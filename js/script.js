(function(){
  const MAX=23; // try images 1..12
  const slidesEl=document.getElementById('slides');
  const slides=[];
  let index=0;
  // load names & optional title from global config (js/config.js)
  try{
    const namesEl = document.getElementById('names');
    const titleEl = document.querySelector('.propose');
    const cfg = window.PROPOSAL || {};
    if(namesEl){
      const n1 = cfg.name1 || '[Name]';
      const n2 = cfg.name2 || '[Name]';
      namesEl.textContent = `${n1} ❤️ ${n2}`;
    }
    if(titleEl && cfg.title){ titleEl.textContent = cfg.title; }
  }catch(e){/* ignore if config missing */}
  // try loading a sequence of images named 1.jpg..MAX.jpg (jpg/png supported)
  function tryLoad(i){
    return new Promise((res)=>{
      const img=new Image();
      img.onload=()=>res({ok:true,el:img});
      img.onerror=()=>res({ok:false});
      // prefer jpg then png fallback
      img.src=`img/${i}.jpg`;
    });
  }

  (async function(){
    // Prefer a pre-generated images.json listing all files in img/
    let fileList = null;
    try{
      const res = await fetch('images.json', {cache: 'no-cache'});
      if(res.ok){
        const json = await res.json();
        if(Array.isArray(json) && json.length) fileList = json;
      }
    }catch(e){ /* ignore fetch errors */ }

    // Helper to load by filename
    const loadByName = (name) => new Promise((res) => {
      const img = new Image();
      img.onload = () => res({ok:true, el: img});
      img.onerror = () => res({ok:false});
      img.src = `img/${name}`;
    });

    if(fileList){
      // shuffle fileList to show images in random order
      for(let i = fileList.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [fileList[i], fileList[j]] = [fileList[j], fileList[i]];
      }

      for(const fname of fileList){
        const r = await loadByName(fname);
        if(r.ok){
          r.el.alt = `Couple ${fname}`;
          slides.push(r.el);
        }
      }
    } else {
      // Fallback: try numeric names as before
      for(let i=1;i<=MAX;i++){
        // try jpg then png
        let r=await tryLoad(i);
        if(!r.ok){
          // try png
          r=new Promise((res)=>{
            const img=new Image();
            img.onload=()=>res({ok:true,el:img});
            img.onerror=()=>res({ok:false});
            img.src=`img/${i}.png`;
          });
          r=await r;
        }
        if(r.ok){
          r.el.alt=`Couple ${i}`;
          slides.push(r.el);
        }
      }
    }

    if(slides.length===0){
      // fallback placeholder
      const p=document.createElement('div');
      p.style.padding='40px';
      p.style.color='#99a0b0';
      p.style.textAlign='center';
      p.innerText='No images found in img/.\nPlace image files in the img/ folder and optionally run the provided helper to generate images.json.';
      slidesEl.appendChild(p);
      return;
    }

    for(const s of slides){
      const wrapper=document.createElement('div');
      wrapper.className='slide';
      wrapper.appendChild(s);
      slidesEl.appendChild(wrapper);
    }
    update();
    startAutoplay();
  })();

  function update(){
    // measure the visible slideshow width (the parent container), not the total slides width
    const container = slidesEl.closest('.slideshow') || document.getElementById('slideshow');
    const w = container ? container.clientWidth : slidesEl.clientWidth;
    slidesEl.style.transform = `translateX(${-index * w}px)`;
  }
  window.addEventListener('resize',()=>requestAnimationFrame(update));

  // navigation
  document.getElementById('prev').addEventListener('click',()=>{
    index=(index-1+slides.length)%slides.length;update();
  });
  document.getElementById('next').addEventListener('click',()=>{
    index=(index+1)%slides.length;update();
  });

  // autoplay
  let timer=null;
  function startAutoplay(){
    stopAutoplay();
    timer=setInterval(()=>{index=(index+1)%slides.length;update();},4000);
  }
  function stopAutoplay(){if(timer)clearInterval(timer);timer=null}
  slidesEl.addEventListener('mouseenter',stopAutoplay);
  slidesEl.addEventListener('mouseleave',startAutoplay);

  // modal actions (robust show/hide, prevent accidental hide)
  const modal=document.getElementById('modal');
  const yesBtn=document.getElementById('yesBtn');
  const closeBtn=document.getElementById('closeModal');

  function showModal(){
    if(!modal) return;
    modal.setAttribute('aria-hidden','false');
    modal.classList.add('open');
  }
  function hideModal(){
    if(!modal) return;
    modal.setAttribute('aria-hidden','true');
    modal.classList.remove('open');
  }

  if(yesBtn){
    yesBtn.addEventListener('click',(e)=>{e.preventDefault(); e.stopPropagation(); showModal();});
  }
  if(closeBtn){
    closeBtn.addEventListener('click',(e)=>{e.preventDefault(); e.stopPropagation(); hideModal();});
  }

  // clicking on the overlay (outside modal-content) closes the modal
  if(modal){
    modal.addEventListener('click',(e)=>{
      if(e.target === modal){ hideModal(); }
    });
  }

  // robust keyboard support: handle ArrowLeft/ArrowRight and legacy keyCode
  window.addEventListener('keydown', (e) => {
    // ignore when typing in inputs, textareas or contenteditable areas
    const tgt = e.target;
    const isTyping = tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable);
    if (isTyping) return;

    const key = e.key || e.code || e.keyCode;
    // support modern names and legacy keyCode numbers
    if (key === 'ArrowLeft' || key === 'Left' || key === 37) {
      e.preventDefault();
      const prevBtn = document.getElementById('prev');
      if (prevBtn) prevBtn.click();
    }
    if (key === 'ArrowRight' || key === 'Right' || key === 39) {
      e.preventDefault();
      const nextBtn = document.getElementById('next');
      if (nextBtn) nextBtn.click();
    }
    if (key === 'Escape' || key === 'Esc' || key === 27) {
      e.preventDefault();
      if (modal) modal.setAttribute('aria-hidden','true');
    }
  });

  // images are loaded by the IIFE above; no named `loadImages` call required

    // Reveal proposal card when user scrolls to bottom of the page
    (function(){
      const card = document.getElementById('proposalCard');
      if(!card) return;
      let revealed = false;
      const THRESHOLD = 40; // px from bottom

      function isAtBottom(){
        const scrollY = window.scrollY || window.pageYOffset;
        const viewport = window.innerHeight || document.documentElement.clientHeight;
        const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        return (scrollY + viewport) >= (docHeight - THRESHOLD);
      }

      function checkAndReveal(){
        if(revealed) return;
        if(isAtBottom()){
          revealed = true;
          card.classList.remove('reveal-hidden');
          card.classList.add('reveal-visible');
          // optional: focus the Yes button for accessibility
          const yes = document.getElementById('yesBtn');
          if(yes) yes.setAttribute('autofocus','true');
        }
      }

      // If the page is short and already at bottom, reveal immediately
      document.addEventListener('DOMContentLoaded', checkAndReveal);
      window.addEventListener('load', checkAndReveal);
      window.addEventListener('scroll', checkAndReveal, {passive:true});
      window.addEventListener('resize', checkAndReveal);
      // run once now in case DOMContentLoaded already fired
      checkAndReveal();
    })();
})();