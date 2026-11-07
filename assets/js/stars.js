/* ==========================================================================
   Stars — drifting sparkles behind the page, like naeuzistudios.com.
   They twinkle, drift slowly, and scatter away from the cursor (or finger).
   Drawn on one canvas so it stays light.
   ========================================================================== */
(() => {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'stars';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // One pre-rendered sparkle sprite: soft halo + four-point star.
  const SPRITE = 96;
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = SPRITE;
  (() => {
    const g = sprite.getContext('2d');
    const c = SPRITE / 2;
    const halo = g.createRadialGradient(c, c, 0, c, c, c * 0.9);
    halo.addColorStop(0, 'rgba(243,230,250,.55)');
    halo.addColorStop(.55, 'rgba(184,133,218,.12)');
    halo.addColorStop(1, 'rgba(155,96,197,0)');
    g.fillStyle = halo;
    g.beginPath(); g.arc(c, c, c * 0.9, 0, Math.PI * 2); g.fill();
    const s = c * 0.94;
    const core = g.createRadialGradient(c, c, 0, c, c, s);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(.45, '#e3b8f3');
    core.addColorStop(1, '#b885da');
    g.fillStyle = core;
    g.beginPath();
    g.moveTo(c, c - s);
    g.quadraticCurveTo(c + s * .09, c - s * .09, c + s, c);
    g.quadraticCurveTo(c + s * .09, c + s * .09, c, c + s);
    g.quadraticCurveTo(c - s * .09, c + s * .09, c - s, c);
    g.quadraticCurveTo(c - s * .09, c - s * .09, c, c - s);
    g.fill();
  })();

  let W = 0, H = 0, docH = 0, dpr = 1;
  const stars = [];

  const drift = () => {
    const a = Math.random() * Math.PI * 2;
    const v = .12 + Math.random() * .2;
    return [Math.cos(a) * v, Math.sin(a) * v];
  };

  const seed = () => {
    stars.length = 0;
    const count = Math.max(35, Math.min(90, Math.round((W * docH) / 40000)));
    for (let i = 0; i < count; i++) {
      const size = 8 + Math.pow(Math.random(), 2.2) * 30;
      const [bvx, bvy] = drift();
      stars.push({
        x: Math.random() * W, y: Math.random() * docH, r: size / 2, size,
        vx: bvx, vy: bvy, bvx, bvy,
        op: .3 + Math.random() * .5,
        tw: Math.random() * Math.PI * 2, tws: .008 + Math.random() * .022,
        rot: Math.random() * Math.PI * 2, rotV: (Math.random() - .5) * .004,
      });
    }
  };

  const resize = (reseed) => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const newW = innerWidth;
    H = innerHeight;
    docH = Math.max(document.documentElement.scrollHeight, H);
    canvas.width = Math.round(newW * dpr);
    canvas.height = Math.round(H * dpr);
    if (reseed || newW !== W) { W = newW; seed(); }
  };

  // Cursor / touch position in page coordinates
  let mx = -1e5, my = -1e5, cx = -1e5, cy = -1e5, active = false;
  addEventListener('pointermove', e => { cx = e.clientX; cy = e.clientY; active = true; }, { passive: true });
  addEventListener('pointerdown', e => { cx = e.clientX; cy = e.clientY; active = true; }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { active = false; });
  addEventListener('blur', () => { active = false; });

  const M = 60;
  let raf = 0;
  const tick = () => {
    raf = 0;
    const sy = scrollY;
    mx = cx; my = cy + sy;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    for (const s of stars) {
      if (active) {
        const dx = s.x - mx, dy = s.y - my;
        const d = Math.hypot(dx, dy);
        const range = s.r + 160;
        if (d < range && d > .1) {
          const f = Math.pow(1 - d / range, 2) * .9;
          s.vx += dx / d * f;
          s.vy += dy / d * f;
          s.rotV += (Math.random() - .5) * .002;
        }
      }
      s.vx = s.vx * .96 + s.bvx * .04;
      s.vy = s.vy * .96 + s.bvy * .04;
      s.x += s.vx; s.y += s.vy;
      if (s.x < -M) s.x = W + M; else if (s.x > W + M) s.x = -M;
      if (s.y < -M) s.y = docH + M; else if (s.y > docH + M) s.y = -M;
      s.rotV *= .98;
      s.rot += s.rotV + .0009;
      s.tw += s.tws;

      const y = s.y - sy;
      if (y < -M || y > H + M) continue; // off screen: skip drawing
      ctx.globalAlpha = s.op * (.35 + .65 * (.5 + .5 * Math.sin(s.tw)));
      ctx.save();
      ctx.translate(s.x, y);
      ctx.rotate(s.rot);
      ctx.drawImage(sprite, -s.r, -s.r, s.size, s.size);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(tick);
  };

  const start = () => { if (!raf && !document.hidden) raf = requestAnimationFrame(tick); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => resize(false), 200); });
  resize(true);
  // page height settles once images and videos have their size
  addEventListener('load', () => { const old = docH; resize(false); if (Math.abs(docH - old) > 200) seed(); });
  start();
})();
