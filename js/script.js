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
          // prevent default browser dragging which can interfere with swipe gestures
          r.el.draggable = false;
          r.el.setAttribute('draggable','false');
          r.el.style.userSelect = 'none';
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
          // prevent default browser dragging which can interfere with swipe gestures
          r.el.draggable = false;
          r.el.setAttribute('draggable','false');
          r.el.style.userSelect = 'none';
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

  // navigation helpers (use these everywhere so we can remove the next button)
  function prevSlide(){ index = (index - 1 + slides.length) % slides.length; update(); }
  function nextSlide(){ index = (index + 1) % slides.length; update(); }

  // wire up prev button if present, remove the visual "next" button (right arrow)
  const prevBtnEl = document.getElementById('prev');
  const nextBtnEl = document.getElementById('next');
  if(prevBtnEl) prevBtnEl.addEventListener('click', prevSlide);
  // remove the next arrow from the DOM so it's not visible or focusable
  if(nextBtnEl && nextBtnEl.parentNode) nextBtnEl.parentNode.removeChild(nextBtnEl);

  // autoplay
  let timer=null;
  function startAutoplay(){
    stopAutoplay();
    timer=setInterval(()=>{index=(index+1)%slides.length;update();},4000);
  }
  function stopAutoplay(){if(timer)clearInterval(timer);timer=null}
  slidesEl.addEventListener('mouseenter',stopAutoplay);
  slidesEl.addEventListener('mouseleave',startAutoplay);

  // Horizontal swipe on slideshow to navigate slides (touch + pointer fallback)
  (function(){
    if(!slidesEl) return;
    let startX = null, startY = null, tracking = false;
    const THRESHOLD = 50; // px horizontal movement

    let fired = false;
    slidesEl.addEventListener('touchstart', function(e){
      if(!e.touches || !e.touches.length) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
      fired = false;
    }, {passive:true});

    slidesEl.addEventListener('touchmove', function(e){
      if(!tracking || fired) return;
      const t = (e.touches && e.touches[0]) ? e.touches[0] : null;
      if(!t) return;
      const dx = startX - t.clientX;
      const dy = startY - t.clientY;
      // ignore mostly-vertical movement
      if(Math.abs(dx) < Math.abs(dy)) return;
      if(Math.abs(dx) > THRESHOLD){
        fired = true;
        if(dx > 0) nextSlide(); else prevSlide();
      }
    }, {passive:true});

    slidesEl.addEventListener('touchend', function(e){
      tracking = false;
      startX = startY = null;
      fired = false;
    }, {passive:true});

    // pointer events for mouse drag support
    let pointerDown = false;
    slidesEl.addEventListener('pointerdown', function(e){
      pointerDown = true; startX = e.clientX; startY = e.clientY; fired = false;
      slidesEl.setPointerCapture && slidesEl.setPointerCapture(e.pointerId);
    });
    slidesEl.addEventListener('pointermove', function(e){
      if(!pointerDown || fired) return;
      const dx = startX - e.clientX; const dy = startY - e.clientY;
      if(Math.abs(dx) < Math.abs(dy)) return;
      if(Math.abs(dx) > THRESHOLD){ fired = true; if(dx > 0) nextSlide(); else prevSlide(); }
    });
    slidesEl.addEventListener('pointerup', function(e){
      pointerDown = false; startX = startY = null; fired = false;
    });
    slidesEl.addEventListener('pointercancel', ()=>{ pointerDown=false; startX=startY=null; fired=false; });
  })();

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
      prevSlide();
    }
    if (key === 'ArrowRight' || key === 'Right' || key === 39) {
      e.preventDefault();
      nextSlide();
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

    // Mobile swipe-up / swipe-down handler to show/hide the right panel
    function initMobileSwipeToggle(){
      const RIGHT_BREAKPOINT = 900; // matches the CSS media query
      const right = document.querySelector('.right');
      const left = document.querySelector('.left');
      if(!right || !left) return;

      // start collapsed on small screens
      function setInitial(){
        if(window.matchMedia(`(max-width:${RIGHT_BREAKPOINT}px)`).matches){
          right.classList.remove('revealed');
          // ensure collapsed state (CSS handles collapsed style by absence of .revealed)
        } else {
          // on larger screens always show it
          right.classList.add('revealed');
        }
      }

      let startY = null;
      let tracking = false;
      const THRESHOLD = 60; // pixels to consider a swipe

      // touch start on left area (swiping up anywhere on left should reveal)
      left.addEventListener('touchstart', function(e){
        if(e.touches && e.touches.length) startY = e.touches[0].clientY;
        tracking = true;
      }, {passive:true});

      left.addEventListener('touchmove', function(e){
        // optional: could implement a visual follow, but keep simple
      }, {passive:true});

      left.addEventListener('touchend', function(e){
        if(!tracking || startY === null) return;
        const endY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : null;
        tracking = false;
        if(endY === null) { startY = null; return; }
        const delta = startY - endY;
        // swipe up -> reveal
        if(delta > THRESHOLD){
          right.classList.add('revealed');
        }
        // swipe down on left (when panel visible) -> hide
        if(delta < -THRESHOLD){
          right.classList.remove('revealed');
        }
        startY = null;
      }, {passive:true});

      // also listen for swipe down on the right panel to collapse
      right.addEventListener('touchstart', function(e){
        if(e.touches && e.touches.length) startY = e.touches[0].clientY;
        tracking = true;
      }, {passive:true});
      right.addEventListener('touchend', function(e){
        if(!tracking || startY === null) return;
        const endY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : null;
        tracking = false;
        if(endY === null) { startY = null; return; }
        const delta = startY - endY;
        // swipe down (delta negative) collapses
        if(delta < -THRESHOLD){
          right.classList.remove('revealed');
        }
        startY = null;
      }, {passive:true});

      // also support a two-finger or two-tap fallback: tapping a small hint could reveal —
      // for simplicity, allow clicking on left to reveal if collapsed
      left.addEventListener('click', function(){
        if(window.matchMedia(`(max-width:${RIGHT_BREAKPOINT}px)`).matches){
          if(!right.classList.contains('revealed')) right.classList.add('revealed');
        }
      });

      // keep initial state in sync on resize
      window.addEventListener('resize', setInitial);
      // init now
      setInitial();
    }

    // initialize swipe behaviors after content is ready
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', initMobileSwipeToggle);
    } else {
      initMobileSwipeToggle();
    }
})();