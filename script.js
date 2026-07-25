/* ==========================================================================
   Among A Million Stars — script.js
   Button-advanced slide experience. Vanilla JS + GSAP for small tweens.
   ========================================================================== */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     1. STARFIELD (canvas) — ambient stars + shooting stars
     ============================================================ */
  const starCanvas = document.getElementById('starfield');
  const sctx = starCanvas.getContext('2d');
  let stars = [];
  let shootingStars = [];
  let W, H;

  function resizeStarfield(){
    W = starCanvas.width = window.innerWidth;
    H = starCanvas.height = window.innerHeight;
    buildStars();
  }
  function buildStars(){
    const count = Math.floor((W * H) / 9000);
    stars = new Array(count).fill(0).map(() => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.3 + 0.2,
      baseAlpha: Math.random() * 0.6 + 0.25,
      twinkleSpeed: Math.random() * 0.015 + 0.004,
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() > 0.85 ? 'pink' : (Math.random() > 0.7 ? 'gold' : 'white')
    }));
  }
  function starColor(hue, alpha){
    if(hue === 'pink') return `rgba(244,114,182,${alpha})`;
    if(hue === 'gold') return `rgba(250,204,21,${alpha})`;
    return `rgba(245,243,255,${alpha})`;
  }
  function spawnShootingStar(){
    const startX = Math.random() * W * 0.6 + W * 0.2;
    const startY = Math.random() * H * 0.5;
    shootingStars.push({ x:startX, y:startY, vx:-(Math.random()*5+6), vy:(Math.random()*3+3), life:1, len:Math.random()*80+60 });
  }
  let lastShoot = 0;
  function drawStarfield(t){
    sctx.clearRect(0,0,W,H);
    for(const s of stars){
      const a = s.baseAlpha + Math.sin(t * s.twinkleSpeed + s.phase) * 0.25;
      sctx.beginPath();
      sctx.fillStyle = starColor(s.hue, Math.max(a, 0.05));
      sctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      sctx.fill();
    }
    if(!reduceMotion && t - lastShoot > (Math.random()*3000+4500)){ spawnShootingStar(); lastShoot = t; }
    shootingStars.forEach(sh => {
      const grad = sctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx*(sh.len/8), sh.y - sh.vy*(sh.len/8));
      grad.addColorStop(0, `rgba(255,255,255,${sh.life})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      sctx.strokeStyle = grad; sctx.lineWidth = 1.6;
      sctx.beginPath(); sctx.moveTo(sh.x, sh.y);
      sctx.lineTo(sh.x - sh.vx*(sh.len/8), sh.y - sh.vy*(sh.len/8));
      sctx.stroke();
      sh.x += sh.vx; sh.y += sh.vy; sh.life -= 0.02;
    });
    shootingStars = shootingStars.filter(sh => sh.life > 0 && sh.y < H);
    requestAnimationFrame(drawStarfield);
  }
  resizeStarfield();
  requestAnimationFrame(drawStarfield);
  window.addEventListener('resize', debounce(resizeStarfield, 300));

  /* ============================================================
     2. CURSOR TRAIL
     ============================================================ */
  const trailCanvas = document.getElementById('cursor-trail');
  const tctx = trailCanvas.getContext('2d');
  let trailParticles = [];
  function resizeTrail(){ trailCanvas.width = window.innerWidth; trailCanvas.height = window.innerHeight; }
  resizeTrail();
  window.addEventListener('resize', debounce(resizeTrail, 300));
  let lastMove = 0;
  window.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if(now - lastMove < 30 || reduceMotion) return;
    lastMove = now;
    trailParticles.push({ x:e.clientX, y:e.clientY, r:Math.random()*2+1, life:1, vx:(Math.random()-0.5)*0.4, vy:(Math.random()-0.5)*0.4-0.2, hue: Math.random()>0.5?'gold':'pink' });
    if(trailParticles.length > 60) trailParticles.shift();
  });
  function drawTrail(){
    tctx.clearRect(0,0,trailCanvas.width, trailCanvas.height);
    trailParticles.forEach(p => {
      tctx.beginPath();
      tctx.fillStyle = starColor(p.hue, p.life*0.7);
      tctx.arc(p.x, p.y, p.r*p.life*2, 0, Math.PI*2);
      tctx.fill();
      p.x += p.vx; p.y += p.vy; p.life -= 0.025;
    });
    trailParticles = trailParticles.filter(p => p.life > 0);
    requestAnimationFrame(drawTrail);
  }
  requestAnimationFrame(drawTrail);

  /* ============================================================
     3. LOADER
     ============================================================ */
  window.addEventListener('load', () => {
    const fill = document.getElementById('loaderFill');
    requestAnimationFrame(() => { fill.style.width = '100%'; });
    setTimeout(() => {
      document.getElementById('loader').classList.add('hide');
      document.getElementById('main').hidden = false;
      initSlides();
    }, 3000);
  });

  /* ============================================================
     4. SLIDE MANAGER — button-advanced experience
     ============================================================ */
  let slides = [];
  let current = 0;
  let dots = [];

  function initSlides(){
    slides = Array.from(document.querySelectorAll('.slide'));
    buildDots();
    goToSlide(0, false);

    document.getElementById('navNext').addEventListener('click',(e)=>{
    magicSparkles(e.clientX,e.clientY);
    advance();
});
    document.getElementById('navBack').addEventListener('click', () => retreat());
    document.getElementById('beginBtn').addEventListener('click',(e)=>{
    magicSparkles(e.clientX,e.clientY);
    advance();
});
    document.getElementById('replayBtn').addEventListener('click', () => { goToSlide(0, true); });

    window.addEventListener('keydown', (e) => {
      if(e.key === 'ArrowRight') advance();
      if(e.key === 'ArrowLeft') retreat();
    });
  }

  function buildDots(){
    const rail = document.getElementById('dotRail');
    slides.forEach((s, i) => {
      const d = document.createElement('span');
      d.className = 'dot';
      rail.appendChild(d);
      dots.push(d);
    });
  }

  function advance(){
    if(current >= slides.length - 1) return;
    flyFeather();
    goToSlide(current + 1, true);
  }
  function retreat(){
    if(current <= 0) return;
    goToSlide(current - 1, true);
  }

  function goToSlide(index, animateFeather){
    const prevSlide = slides[current];
    current = index;

    slides.forEach((s, i) => { s.classList.toggle('active', i === index); });

    dots.forEach((d, i) => {
      d.classList.toggle('active', i === index);
      d.classList.toggle('done', i < index);
    });

    const navNext = document.getElementById('navNext');
    const navBack = document.getElementById('navBack');
    // hero has its own CTA; ending has replay — hide the floating next button there
    if(index === 0 || index === slides.length - 1){ navNext.classList.add('hide'); }
    else{ navNext.classList.remove('hide'); }
    navBack.classList.toggle('show', index > 0 && index < slides.length - 1);

    onSlideEnter(slides[index].id);
  }

  function onSlideEnter(id){
    if(id === 'slide-memory')
    startShootingStarGame();

 if(id === 'slide-flowers')
    startFlowerSelection();

else
    stopPetals();

 if(id === 'slide-ending')
    animateName();
  }

  /* ============================================================
     5. FEATHER TRANSITION — plays every time Next is touched
     ============================================================ */
  function flyFeather(){
    if(reduceMotion) return;
    const layer = document.getElementById('featherLayer');
    const f = document.createElement('div');
    f.className = 'feather-fly';
    f.style.left = (window.innerWidth * (0.35 + Math.random()*0.3)) + 'px';
    f.style.bottom = '-40px';
    f.innerHTML = `<svg width="34" height="34" viewBox="0 0 24 24"><path d="M20 4c-8 1-14 6-15 15 9-1 14-7 15-15z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6 18l9-9" stroke="currentColor" stroke-width="1.1"/></svg>`;
    layer.appendChild(f);
    gsap.fromTo(f,
      { y: 0, x: 0, rotate: -10, opacity: 0 },
      {
        y: -window.innerHeight * 1.1, x: (Math.random()-0.5) * 160, rotate: 40 + Math.random()*40,
        opacity: 1, duration: 1.5, ease: 'power1.out',
        onComplete: () => f.remove()
      }
    );
    gsap.to(f, { opacity: 0, duration: 0.6, delay: 0.9, ease: 'power1.in' });
  }

  magicSparkles(
    window.innerWidth / 2,
    window.innerHeight / 2
);
  const giftBox = document.getElementById('giftBox');
  const giftHint = document.getElementById('giftHint');
  let giftOpened = false;
  function openGift(){
    if(giftOpened) return;
    giftOpened = true;
    giftBox.classList.add('opened');
    giftHint.textContent = 'a small light for you';
    burstConfetti(giftBox.getBoundingClientRect());
    fireworksBurst();
  }
  giftBox.addEventListener('click', openGift);
  giftBox.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openGift(); } });

  /* ============================================================
     7. MEMORY POLAROID — parallax + lightbox
     ============================================================ */
const polaroid = document.getElementById('polaroid');
const polaroidStage = document.querySelector('.polaroid-stage');

if (polaroid && polaroidStage) {

    polaroidStage.addEventListener('pointermove', (e) => {
        if (reduceMotion) return;

        const rect = polaroidStage.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;

        gsap.to(polaroid,{
            rotateY:px*14,
            rotateX:-py*14,
            duration:0.6,
            ease:'power2.out',
            overwrite:'auto'
        });
    });

    polaroidStage.addEventListener('pointerleave', () => {
        gsap.to(polaroid,{
            rotateY:0,
            rotateX:0,
            duration:0.8,
            ease:'power3.out'
        });
    });

}

  const lightbox = document.getElementById('lightbox');
  function openLightbox(){ lightbox.classList.add('show'); lightbox.setAttribute('aria-hidden','false'); }
  function closeLightbox(){ lightbox.classList.remove('show'); lightbox.setAttribute('aria-hidden','true'); }
  if (polaroid) {
    polaroid.addEventListener('click', openLightbox);
    polaroid.addEventListener('keydown', (e)=>{
        if(e.key==="Enter") openLightbox();
    });
}
 const lightboxClose = document.getElementById('lightboxClose');

if(lightboxClose){
    lightboxClose.addEventListener('click', closeLightbox);
}

if(lightbox){
    lightbox.addEventListener('click', closeLightbox);
}
  window.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeLightbox(); });

  /* ============================================================
     8. FLOWERS — SVG illustrations + bloom + petals
     ============================================================ */
  const flowerSVGs = {
    rose: `
      <g transform="translate(100,150)">
        <path d="M0,80 C-4,40 -4,10 0,-10" stroke="#3f7a4f" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M0,40 C-22,42 -34,30 -34,30 C-20,50 -2,52 0,50" fill="#4a8f5c"/>
        <path d="M0,55 C22,57 34,45 34,45 C20,65 2,67 0,65" fill="#3f7a4f"/>
        <g class="bloom-group">
          <circle cx="0" cy="-30" r="26" fill="#c8114f" opacity=".95"/>
          <path d="M0,-30 C-20,-40 -18,-58 0,-58 C18,-58 20,-40 0,-30Z" fill="#e0175f"/>
          <path d="M0,-30 C-24,-24 -30,-6 -14,6 C-2,14 6,4 0,-30Z" fill="#d1215f"/>
          <path d="M0,-30 C24,-24 30,-6 14,6 C2,14 -6,4 0,-30Z" fill="#c8114f"/>
          <path d="M0,-30 C-14,-14 -8,4 8,2 C18,0 14,-20 0,-30Z" fill="#f0427a"/>
        </g>
      </g>`,
    kathgolap: `
      <g transform="translate(100,150)">
        <path d="M0,80 C2,40 2,10 0,-6" stroke="#3f7a4f" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M0,36 C-20,34 -30,20 -30,20 C-18,42 -2,44 0,42" fill="#4a8f5c"/>
        <g class="bloom-group">
          <circle cx="0" cy="-26" r="24" fill="#fff5f8"/>
          <path d="M0,-26 C-18,-34 -16,-50 0,-50 C16,-50 18,-34 0,-26Z" fill="#ffffff" stroke="#f2c9d9" stroke-width="1"/>
          <path d="M0,-26 C-20,-20 -26,-4 -12,6 C-2,12 4,2 0,-26Z" fill="#fdeef3" stroke="#f2c9d9" stroke-width="1"/>
          <path d="M0,-26 C20,-20 26,-4 12,6 C2,12 -4,2 0,-26Z" fill="#fff8fb" stroke="#f2c9d9" stroke-width="1"/>
          <circle cx="0" cy="-26" r="5" fill="#fbbf24"/>
        </g>
      </g>`,
    dolonchapa: `
      <g transform="translate(100,150)">
        <path d="M0,80 C0,44 0,16 0,-4" stroke="#3f7a4f" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M0,50 C-18,46 -24,32 -24,32 C-14,54 0,54 0,52" fill="#4a8f5c"/>
        <path d="M0,20 C16,18 22,6 22,6 C12,26 0,28 0,26" fill="#3f7a4f"/>
        <g class="bloom-group">
          <path d="M0,-4 L-6,-30 L0,-46 L6,-30 Z" fill="#fdf6e3" stroke="#e7dcb0" stroke-width="1"/>
          <path d="M0,-10 L-12,-24 L-4,-38 L0,-24 Z" fill="#fffdf3" stroke="#e7dcb0" stroke-width="1"/>
          <path d="M0,-10 L12,-24 L4,-38 L0,-24 Z" fill="#fbf3d9" stroke="#e7dcb0" stroke-width="1"/>
          <circle cx="0" cy="-30" r="3" fill="#facc15"/>
        </g>
      </g>`
  };
  document.querySelectorAll('.flower-svg').forEach(svg => {
    svg.innerHTML = flowerSVGs[svg.dataset.flower];
    const bloom = svg.querySelector('.bloom-group');
    gsap.set(bloom, { transformOrigin:'50% 100%', scale:0.15, opacity:0 });
  });
 function startShootingStarGame(){}

function moveStar(){}

function unlockPhoto(){}

function startFlowerSelection(){

    document.querySelectorAll(".flowerBtn").forEach(btn=>{

        btn.onclick = ()=>{

            const flower = btn.dataset.flower;

            switch(flower){

                case "rose":
                    break;

                case "sakura":
                    break;

                case "tulip":
                    break;

                case "sunflower":
                    break;

            }

        };

    });

}
  function bloomFlowers(){
    document.querySelectorAll('.bloom-group').forEach((bloom, i) => {
      gsap.to(bloom, { scale:1, opacity:1, duration:1.2, delay: i*0.15 + 0.2, ease:'back.out(1.6)' });
    });
  }

  const petalField = document.getElementById('petalField');
  const petalColors = ['#F472B6', '#f7a8cd', '#FACC15'];
  let petalInterval = null;
  function startPetals(){
    bloomFlowers();
    if(reduceMotion || petalInterval) return;
    petalInterval = setInterval(spawnPetal, 700);
  }
  function stopPetals(){
    if(petalInterval){ clearInterval(petalInterval); petalInterval = null; }
  }
  function spawnPetal(){
    const p = document.createElement('div');
    const size = Math.random()*8+6;
    p.className = 'petal';
    p.style.width = size+'px';
    p.style.height = (size*0.8)+'px';
    p.style.borderRadius = '60% 40% 60% 40%';
    p.style.background = petalColors[Math.floor(Math.random()*petalColors.length)];
    p.style.left = Math.random()*100+'%';
    p.style.top = '-20px';
    petalField.appendChild(p);
    const duration = Math.random()*4+5;
    gsap.to(p, { y:420, x:(Math.random()-0.5)*160, rotate:Math.random()*360, opacity:0, duration, ease:'sine.inOut', onComplete: () => p.remove() });
  }

  /* ============================================================
     9. CAKE — wish button blows candles
     ============================================================ */
  const cakeEl = document.getElementById('cakeEl');
  const wishBtn = document.getElementById('wishBtn');
  const cakeNote = document.getElementById('cakeNote');
  let candlesBlown = false;
  wishBtn.addEventListener('click', () => {
    if(candlesBlown) return;
    candlesBlown = true;
    cakeEl.classList.add('blown');
    cakeNote.textContent = 'wish made ✧';
    spawnSmoke();
    burstConfetti(cakeEl.getBoundingClientRect());
    fireworksBurst();
  });
  function spawnSmoke(){
    const candles = cakeEl.querySelectorAll('.candle');
    candles.forEach(c => {
      for(let i=0;i<5;i++){
        const s = document.createElement('span');
        s.className = 'smoke';
        c.appendChild(s);
        gsap.fromTo(s, { y:0, x:0, opacity:.6, scale:.5 }, { y:-40-Math.random()*20, x:(Math.random()-0.5)*30, opacity:0, scale:2, duration:1.6, delay:i*0.08, ease:'sine.out', onComplete:()=>s.remove() });
      }
    });
  }

  /* ============================================================
     10. COUNTDOWN — target next Aug 1
     ============================================================ */
  function nextBirthday(){
    const now = new Date();
    let year = now.getFullYear();
    let target = new Date(year, 7, 1, 0, 0, 0);
    if(now > target){
      const isSameDay = now.getFullYear() === target.getFullYear() && now.getMonth() === target.getMonth() && now.getDate() === target.getDate();
      if(!isSameDay) target = new Date(year+1, 7, 1, 0, 0, 0);
    }
    return target;
  }
  const cdDays = document.getElementById('cdDays');
  const cdHours = document.getElementById('cdHours');
  const cdMins = document.getElementById('cdMins');
  const cdSecs = document.getElementById('cdSecs');
  const countdownGrid = document.getElementById('countdownGrid');
  const countdownArrived = document.getElementById('countdownArrived');
  const countdownTitle = document.getElementById('countdownTitle');
  function pad(n){ return String(n).padStart(2,'0'); }
  function tickCountdown(){
    const now = new Date();
    const target = nextBirthday();
    const isBirthdayToday = now.getFullYear() === target.getFullYear() && now.getMonth() === target.getMonth() && now.getDate() === target.getDate();
    if(isBirthdayToday){
      countdownGrid.hidden = true; countdownArrived.hidden = false; countdownTitle.textContent = "It's Her Day"; return;
    }
    const diff = target - now;
    cdDays.textContent = pad(Math.floor(diff/86400000));
    cdHours.textContent = pad(Math.floor((diff%86400000)/3600000));
    cdMins.textContent = pad(Math.floor((diff%3600000)/60000));
    cdSecs.textContent = pad(Math.floor((diff%60000)/1000));
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ============================================================
     11. WISH + SIMULATED SMS
     ============================================================ */
  const wishInput = document.getElementById('wishInput');
  const sendWishBtn = document.getElementById('sendWishBtn');
  const smsBubble = document.getElementById('smsBubble');
  let wishSent = false;
  sendWishBtn.addEventListener('click', () => {
    const val = wishInput.value.trim();
    if(!val || wishSent) return;
    wishSent = true;
    sendWishBtn.disabled = true;
    sendWishBtn.querySelector('span').textContent = 'Sending...';
    wishInput.disabled = true;

    setTimeout(() => {
      sendWishBtn.querySelector('span').textContent = 'Sent';
      smsBubble.classList.add('show');
      burstConfetti(document.getElementById('wishCard').getBoundingClientRect());
    }, 900);
  });

  /* ============================================================
     12. ENDING — canvas writes "SRABONI" with gathering stars
     ============================================================ */
  const nameCanvas = document.getElementById('nameCanvas');
  const nctx = nameCanvas.getContext('2d');
  let nameAnimated = false;
  function setupNameCanvas(){
    const rect = nameCanvas.getBoundingClientRect();
    nameCanvas.width = rect.width * devicePixelRatio;
    nameCanvas.height = rect.height * devicePixelRatio;
    nctx.scale(devicePixelRatio, devicePixelRatio);
  }
  function getTextPoints(text, w, h){
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const octx = off.getContext('2d');
    octx.fillStyle = '#fff';
    const fontSize = Math.min(w/(text.length*0.62), h*0.6);
    octx.font = `700 ${fontSize}px Playfair Display, serif`;
    octx.textAlign = 'center'; octx.textBaseline = 'middle';
    octx.fillText(text, w/2, h/2);
    const data = octx.getImageData(0,0,w,h).data;
    const points = [];
    const gap = 4;
    for(let y=0;y<h;y+=gap){
      for(let x=0;x<w;x+=gap){
        const idx = (y*w+x)*4+3;
        if(data[idx] > 128) points.push({x,y});
      }
    }
    return points;
  }
  function animateName(){
    if(nameAnimated) return;
    nameAnimated = true;
    setupNameCanvas();
    const rect = nameCanvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    const targets = getTextPoints('SRABONI', w, h);
    const particles = targets.map(t => ({ x:Math.random()*w, y:Math.random()*h, tx:t.x, ty:t.y }));
    let frame = 0;
    const maxFrames = reduceMotion ? 1 : 90;
    function step(){
      frame++;
      nctx.clearRect(0,0,w,h);
      particles.forEach(p => {
        p.x += (p.tx - p.x) * 0.08;
        p.y += (p.ty - p.y) * 0.08;
        nctx.beginPath();
        nctx.fillStyle = 'rgba(250,204,21,0.9)';
        nctx.shadowColor = 'rgba(244,114,182,0.8)';
        nctx.shadowBlur = 6;
        nctx.arc(p.x, p.y, 1.4, 0, Math.PI*2);
        nctx.fill();
      });
      if(frame < maxFrames) requestAnimationFrame(step);
    }
    step();
  }

  /* ============================================================
     13. CONFETTI + FIREWORKS (canvas-based)
     ============================================================ */
  const confettiCanvas = document.getElementById('confettiCanvas');
  const cctx = confettiCanvas.getContext('2d');
  let confettiParticles = [];
  let fireworkParticles = [];
  function resizeConfetti(){ confettiCanvas.width = window.innerWidth; confettiCanvas.height = window.innerHeight; }
  resizeConfetti();
  window.addEventListener('resize', debounce(resizeConfetti, 300));
  const confettiColors = ['#F472B6', '#FACC15', '#6D28D9', '#ffffff', '#9061e8'];
  function burstConfetti(originRect){
    if(reduceMotion) return;
    const ox = originRect ? (originRect.left + originRect.width/2) : window.innerWidth/2;
    const oy = originRect ? (originRect.top + originRect.height/2) : window.innerHeight/2;
    for(let i=0;i<90;i++){
      const angle = Math.random()*Math.PI*2;
      const speed = Math.random()*9+3;
      confettiParticles.push({ x:ox, y:oy, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed-4, size:Math.random()*6+4, color:confettiColors[Math.floor(Math.random()*confettiColors.length)], rot:Math.random()*360, vr:(Math.random()-0.5)*12, life:1 });
    }
  }
  function fireworksBurst(){
    if(reduceMotion) return;
    for(let b=0;b<2;b++){
      setTimeout(() => {
        const ox = Math.random()*window.innerWidth*0.6 + window.innerWidth*0.2;
        const oy = Math.random()*window.innerHeight*0.35 + window.innerHeight*0.12;
        for(let i=0;i<46;i++){
          const angle = (Math.PI*2/46)*i;
          const speed = Math.random()*4+3;
          fireworkParticles.push({ x:ox, y:oy, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed, color:confettiColors[Math.floor(Math.random()*confettiColors.length)], life:1 });
        }
      }, b*260);
    }
  }
  function drawConfettiLoop(){
    cctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
    confettiParticles.forEach(p => {
      p.vy += 0.18; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.008;
      cctx.save(); cctx.translate(p.x, p.y); cctx.rotate(p.rot*Math.PI/180);
      cctx.globalAlpha = Math.max(p.life,0); cctx.fillStyle = p.color;
      cctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
      cctx.restore();
    });
    confettiParticles = confettiParticles.filter(p => p.life > 0 && p.y < confettiCanvas.height+40);
    fireworkParticles.forEach(p => {
      p.vy += 0.03; p.x += p.vx; p.y += p.vy; p.life -= 0.014;
      cctx.beginPath(); cctx.globalAlpha = Math.max(p.life,0); cctx.fillStyle = p.color;
      cctx.arc(p.x, p.y, 2.2, 0, Math.PI*2); cctx.fill();
    });
    fireworkParticles = fireworkParticles.filter(p => p.life > 0);
    cctx.globalAlpha = 1;
    requestAnimationFrame(drawConfettiLoop);
  }
  requestAnimationFrame(drawConfettiLoop);

  /* ============================================================
     utils
     ============================================================ */
  function debounce(fn, wait){
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  }

})();

/* ============ STAR CATCHING GAME LOGIC ============ */
(function initStarGame() {
  function setupGame() {
    const okBtn = document.getElementById('starOkBtn');
    const msgBox = document.getElementById('starMsgBox');
    const starCounter = document.getElementById('starCounter');
    const starStage = document.getElementById('starStage');
    const magicBanner = document.getElementById('magicCompleteBanner');
    const photoStage = document.getElementById('memoryPhotoStage');

    if (!okBtn || !starStage) return;

    let starsCaught = 0;
    const totalStars = 5;

    okBtn.addEventListener('click', () => {
      msgBox.style.display = 'none';
      starCounter.style.display = 'block';
      starStage.style.display = 'block';
      spawnStarsSequentially();
    });

    function spawnStarsSequentially() {
      starStage.innerHTML = '';
      starsCaught = 0;
      updateCounter();

      const stageWidth = Math.max(100, starStage.clientWidth - 60);
      const stageHeight = Math.max(100, starStage.clientHeight - 60);

      for (let i = 0; i < totalStars; i++) {
        setTimeout(() => {
          const star = document.createElement('div');
          star.classList.add('interactive-star');
          star.innerText = '⭐';

          const randomX = Math.max(15, Math.floor(Math.random() * stageWidth));
          const randomY = Math.max(15, Math.floor(Math.random() * stageHeight));

          star.style.left = `${randomX}px`;
          star.style.top = `${randomY}px`;

          star.addEventListener('click', function () {
            if (this.classList.contains('pop-out')) return;

            this.innerText = '✨';
            this.classList.add('pop-out');
            starsCaught++;
            updateCounter();

            setTimeout(() => {
              this.remove();
            }, 350);

            if (starsCaught === totalStars) {
              onGameComplete();
            }
          });

          starStage.appendChild(star);
        }, i * 400);
      }
    }

    function updateCounter() {
      starCounter.innerText = `⭐ ${starsCaught}/${totalStars}`;
    }

    function onGameComplete() {
      setTimeout(() => {
        starStage.style.display = 'none';
        starCounter.style.display = 'none';
        magicBanner.style.display = 'block';

        setTimeout(() => {
          photoStage.style.display = 'block';
          void photoStage.offsetWidth; 
          photoStage.classList.add('visible');
        }, 600);
      }, 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupGame);
  } else {
    setupGame();
  }
})();
/* ============ FLOWER EXPLOSION EFFECT ============ */
document.addEventListener('DOMContentLoaded', () => {
  const flowerCards = document.querySelectorAll('.flower-card');

  // Emojis mapping for petals burst
  const flowerPetals = {
    rose: ['🌹', '🥀', '❤️', '✨'],
    kathgolap: ['🌸', '🌼', '✨', '💛'],
    dolanchapa: ['💮', '🤍', '✨', '🌿']
  };

  flowerCards.forEach(card => {
    card.addEventListener('click', (e) => {
      const flowerType = card.getAttribute('data-flower');
      const symbols = flowerPetals[flowerType] || ['🌸', '✨'];

      // Trigger burst of 35 floating elements
      for (let i = 0; i < 35; i++) {
        createFloatingPetal(symbols);
      }
    });
  });

  function createFloatingPetal(symbols) {
    const petal = document.createElement('div');
    petal.classList.add('floating-petal');

    // Pick a random symbol from the array
    petal.innerText = symbols[Math.floor(Math.random() * symbols.length)];

    // Randomize positioning and size
    const startX = Math.random() * window.innerWidth;
    const duration = 2.5 + Math.random() * 2.5; // Fall speed between 2.5s - 5s
    const fontSize = 1.2 + Math.random() * 1.5; // Size variation

    petal.style.left = `${startX}px`;
    petal.style.fontSize = `${fontSize}rem`;
    petal.style.animationDuration = `${duration}s`;

    document.body.appendChild(petal);

    // Remove element after animation finishes
    setTimeout(() => {
      petal.remove();
    }, duration * 1000);
  }
});
/* ============ FLOWER INTERACTIVE BLOOM LOGIC ============ */
document.addEventListener('DOMContentLoaded', () => {
  const flowerCards = document.querySelectorAll('.flower-card');
  const loveNote = document.getElementById('flowerLoveNote');

  // Emoji sets for petal burst
  const flowerPetals = {
    rose: ['🌹', '🥀', '❤️', '✨', '💖'],
    kathgolap: ['🌸', '🌼', '✨', '💛', '🤍'],
    dolanchapa: ['💮', '🤍', '✨', '🌿', '💎']
  };

  flowerCards.forEach(card => {
    card.addEventListener('click', () => {
      const flowerType = card.getAttribute('data-flower');
      const noteText = card.getAttribute('data-note');
      const symbols = flowerPetals[flowerType] || ['🌸', '✨'];

      // 1. Highlight active card
      flowerCards.forEach(c => c.classList.remove('active-bloom'));
      card.classList.add('active-bloom');

      // 2. Change background mood
      document.body.classList.remove('bloom-rose', 'bloom-kathgolap', 'bloom-dolanchapa');
      document.body.classList.add(`bloom-${flowerType}`);

      // 3. Smooth love note update
      if (loveNote) {
        loveNote.style.opacity = '0';
        loveNote.style.transform = 'translateY(-10px)';

        setTimeout(() => {
          loveNote.innerText = noteText;
          loveNote.style.opacity = '1';
          loveNote.style.transform = 'translateY(0)';
        }, 300);
      }

      // 4. Trigger 40 swirling floating petals
      for (let i = 0; i < 40; i++) {
        setTimeout(() => {
          createSwirlingPetal(symbols);
        }, i * 60); // Staggered drop delay
      }
    });
  });

  function createSwirlingPetal(symbols) {
    const petal = document.createElement('div');
    petal.classList.add('floating-petal');

    petal.innerText = symbols[Math.floor(Math.random() * symbols.length)];

    const startX = Math.random() * window.innerWidth;
    const duration = 3 + Math.random() * 3; // 3s to 6s fall duration
    const fontSize = 1.3 + Math.random() * 1.5;

    petal.style.left = `${startX}px`;
    petal.style.fontSize = `${fontSize}rem`;
    petal.style.animationDuration = `${duration}s`;

    document.body.appendChild(petal);

    setTimeout(() => {
      petal.remove();
    }, duration * 1000);
  }
});
