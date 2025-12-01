/* starfall.js — canvas-based starfall effect */
(function(){
  const canvas = document.createElement('canvas');
  canvas.id = 'starfall-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // On small screens, start canvas hidden above viewport and slide down when ready
  const MOBILE_BREAK = 900; // px
  function maybeSlideIn(){
    try{
      if(window.innerWidth <= MOBILE_BREAK){
        // ensure starting state (CSS puts it translateY(-100%))
        canvas.classList.remove('slide-in');
        // allow the browser to paint the initial state, then add class to trigger transition
        requestAnimationFrame(()=>{
          // small delay to ensure transition occurs on iOS/Android browsers
          setTimeout(()=>canvas.classList.add('slide-in'), 50);
        });
      } else {
        // ensure class removed for larger screens
        canvas.classList.remove('slide-in');
        canvas.style.transform = '';
      }
    }catch(e){/* ignore */}
  }
  // run once at start and when resizing across the breakpoint
  maybeSlideIn();
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', ()=>{
    // only toggle when crossing the threshold to avoid noisy class churn
    const w = window.innerWidth;
    if((lastWidth <= MOBILE_BREAK && w > MOBILE_BREAK) || (lastWidth > MOBILE_BREAK && w <= MOBILE_BREAK)){
      maybeSlideIn();
    }
    lastWidth = w;
  });

  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;
  const DPR = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = W * DPR; canvas.height = H * DPR;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.scale(DPR, DPR);

  const STARS = 120; // number of stars
  const stars = [];

  function rand(min, max){ return Math.random()*(max-min)+min; }

  function makeStar(){
    return {
      x: rand(0, W),
      y: rand(-H, 0),
      size: rand(0.6, 2.8),
      speed: rand(20, 120), // pixels per second
      sway: rand(20, 120), // horizontal sway amplitude
      swaySpeed: rand(0.5, 2.0),
      alpha: rand(0.35, 0.95),
      twinkleSpeed: rand(0.3, 1.2),
      hue: rand(200, 60) > 160 ? 55 : 220, // occasional warm color
      created: performance.now()
    };
  }

  for(let i=0;i<STARS;i++) stars.push(makeStar());

  let last = performance.now();

  function resize(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }

  window.addEventListener('resize', resize);

  function draw(now){
    const dt = Math.min(60, now - last) / 1000; // seconds, cap
    last = now;

    // fade background lightly to create trails effect
    ctx.clearRect(0,0,W,H);
    // draw stars
    for(let i=0;i<stars.length;i++){
      const s = stars[i];
      s.y += s.speed * dt;
      s.x += Math.sin((now/1000)*s.swaySpeed + i) * (s.sway * dt);

      // twinkle
      const tw = 0.5 + 0.5 * Math.sin((now/1000) * s.twinkleSpeed + i);
      const alpha = Math.max(0, Math.min(1, s.alpha * tw));

      // gradient/glow
      const r = s.size;
      ctx.beginPath();
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r*4);
      // cool white to warm
      grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
      grad.addColorStop(0.4, `rgba(255,230,200,${alpha*0.6})`);
      grad.addColorStop(1, `rgba(255,230,200,0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(s.x - r*4, s.y - r*4, r*8, r*8);

      // tiny core bright point
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, alpha*1.2)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI*2);
      ctx.fill();

      // recycle when out of view
      if(s.y - 50 > H){
        // respawn at top with slight horizontal spread
        stars[i] = makeStar();
        stars[i].y = rand(-120, -10);
        stars[i].x = rand(0, W);
      }
    }

    // subtle global overlay shimmer
    requestAnimationFrame(draw);
  }

  // Start loop
  requestAnimationFrame((t)=>{ last = t; draw(t); });

  // pause animation when page hidden to save CPU
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden){ /* do nothing, rAF will stop calling when hidden in many browsers */ }
  });
})();
