/* ==========================================================================
   The hero phone — plays like a film opening, then turns into a feed.
   1. Title card ("a film by NAEUZI"), letterbox bars open onto the showreel.
   2. After the opening (or Skip / Browse), a profile-style grid of every edit
      on the page appears.
   3. Tap an edit to watch it full-screen in the phone, with sound.
   The feed is built from the edit cards in the Edits section, so adding an
   edit there adds it here too.
   ========================================================================== */
(() => {
  'use strict';
  const phone = document.querySelector('[data-phone]');
  if (!phone) return;

  const $ = (s, el = phone) => el.querySelector(s);
  const $$ = (s, el = phone) => Array.from(el.querySelectorAll(s));
  const reduced = document.documentElement.classList.contains('reduce-motion');
  const svg = id => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Clock ---------- */
  const clock = $('[data-clock]');
  const tickClock = () => {
    const d = new Date();
    if (clock) clock.textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  tickClock();
  setInterval(tickClock, 30000);

  /* ---------- Edits, read from the Edits section ---------- */
  const edits = Array.from(document.querySelectorAll('.edits .edit')).map(card => {
    const m = card.querySelector('.edit__media');
    return {
      src: (m.dataset.src || '').trim(),
      poster: (m.dataset.poster || '').trim(),
      link: (m.dataset.link || '').trim(),
      views: (m.dataset.views || '').trim(),
      wide: m.dataset.fit === 'contain',
      tag: (card.querySelector('.edit__tag') || {}).textContent || '',
    };
  }).filter(e => e.src);

  const grid = $('[data-ph-grid]');
  const count = $('[data-ph-count]');
  if (count) count.textContent = String(edits.length);
  edits.forEach((e, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ph-tile';
    b.setAttribute('aria-label', `Play ${e.tag}`);
    b.innerHTML =
      `<img src="${esc(e.poster)}" alt="" loading="lazy" draggable="false">` +
      `<span class="ph-tile__tag">${esc(e.tag.split('·')[0].trim())}</span>` +
      (e.views ? `<span class="ph-tile__views">${svg('i-play')}${esc(e.views)}</span>` : '');
    b.addEventListener('click', () => play(i));
    grid.appendChild(b);
  });

  /* ---------- 1. Opening ---------- */
  const introVideo = $('.ph-intro__video');
  const states = ['is-title', 'is-rolling', 'is-browse', 'is-feed', 'is-playing'];
  const set = (...on) => { states.forEach(s => phone.classList.toggle(s, on.includes(s))); };
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  function intro() {
    clearTimers();
    stopPlayer();
    if (introVideo && !introVideo.src) {
      introVideo.src = phone.dataset.reel;
      introVideo.poster = phone.dataset.reelPoster || '';
    }
    set();
    if (introVideo) { introVideo.currentTime = 0; introVideo.play().catch(() => {}); }
    later(() => set('is-title'), 250);              // title card fades in
    later(() => set('is-rolling'), 2900);           // bars open on the showreel
    later(() => set('is-rolling', 'is-browse'), 5200);
    later(feed, 16000);                             // then the feed slides in
  }

  function feed() {
    clearTimers();
    stopPlayer();
    set('is-feed');
    if (introVideo) introVideo.pause();
  }

  $$('[data-ph-feed]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); feed(); }));
  $('.ph-intro').addEventListener('click', feed);
  $$('[data-ph-intro]').forEach(b => b.addEventListener('click', intro));

  /* ---------- 3. Player ---------- */
  const player = $('.ph-player');
  const pv = $('.ph-player__video');
  const bg = $('.ph-player__bg');
  const tag = $('[data-ph-tag]');
  const viewsEl = $('[data-ph-views]');
  const link = $('[data-ph-link]');
  const soundBtn = $('[data-ph-sound]');
  const bar = $('[data-ph-progress]');

  const setSoundIcon = () => {
    soundBtn.innerHTML = svg(pv.muted ? 'i-mute' : 'i-sound');
    soundBtn.setAttribute('aria-label', pv.muted ? 'Unmute' : 'Mute');
  };

  function play(i) {
    const e = edits[i];
    if (!e) return;
    clearTimers();
    // only one thing makes sound at a time
    document.querySelectorAll('video').forEach(v => { if (v !== pv) v.muted = true; });
    if (introVideo) introVideo.pause();
    player.classList.toggle('is-wide', e.wide);
    bg.style.backgroundImage = e.poster ? `url("${new URL(e.poster, location.href).href}")` : '';
    pv.src = e.src;
    pv.poster = e.poster;
    pv.muted = false;
    tag.textContent = e.tag;
    viewsEl.innerHTML = e.views ? `${svg('i-play')} ${esc(e.views)} views` : '';
    link.hidden = !e.link;
    if (e.link) link.href = e.link;
    setSoundIcon();
    set('is-feed', 'is-playing');
    player.setAttribute('aria-hidden', 'false');
    pv.play().catch(() => { pv.muted = true; setSoundIcon(); pv.play().catch(() => {}); });
  }

  function stopPlayer() {
    if (!pv) return;
    pv.pause();
    player.setAttribute('aria-hidden', 'true');
  }

  $('[data-ph-back]').addEventListener('click', e => { e.stopPropagation(); feed(); });
  soundBtn.addEventListener('click', e => { e.stopPropagation(); pv.muted = !pv.muted; setSoundIcon(); });
  pv.addEventListener('click', () => { if (pv.paused) pv.play().catch(() => {}); else pv.pause(); });
  pv.addEventListener('timeupdate', () => {
    if (pv.duration) bar.style.width = `${(pv.currentTime / pv.duration) * 100}%`;
  });

  /* ---------- Start when the phone is on screen ---------- */
  if (reduced) { feed(); return; }
  let started = false;
  const begin = () => { if (!started) { started = true; intro(); } };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { begin(); io.disconnect(); } }, { threshold: .3 });
    io.observe(phone);
  } else begin();

  // pause everything in the phone when it scrolls away
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) { pv.pause(); if (introVideo) introVideo.pause(); }
        else if (phone.classList.contains('is-rolling') && introVideo) introVideo.play().catch(() => {});
      });
    }, { threshold: 0 }).observe(phone);
  }
})();
