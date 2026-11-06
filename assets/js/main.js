/* ==========================================================================
   naeuzi — page behaviour
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduced = document.documentElement.classList.contains('reduce-motion');
  const svg = id => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;

  /* ---------- Year bits ---------- */
  const year = new Date().getFullYear();
  $$('[data-year]').forEach(el => { el.textContent = year; });
  $$('[data-years-since]').forEach(el => {
    const n = year - parseInt(el.dataset.yearsSince, 10);
    el.dataset.count = String(n);
    el.textContent = `${n}+`;
  });

  /* ---------- Nav state ---------- */
  const nav = $('[data-nav]');
  const onScroll = () => nav && nav.classList.toggle('is-scrolled', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Count up ---------- */
  function countUp(el) {
    const to = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const suf = el.dataset.suffix || '';
    const fmt = v => v.toFixed(dec) + suf;
    if (reduced || !isFinite(to)) { el.textContent = fmt(to || 0); return; }
    const t0 = performance.now();
    const dur = 1800;
    const step = now => {
      const t = Math.min(1, (now - t0) / dur);
      const e = t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
      el.textContent = fmt(to * e);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Reveal on scroll ---------- */
  // stagger siblings that reveal together
  const groups = new Map();
  $$('[data-reveal]').forEach(el => {
    const p = el.parentElement;
    const n = groups.get(p) || 0;
    el.style.setProperty('--ri', n);
    groups.set(p, n + 1);
  });

  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        $$('[data-count]', e.target).forEach(countUp);
        io.unobserve(e.target);
      });
    }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
    $$('[data-reveal]').forEach(el => io.observe(el));
  } else {
    $$('[data-reveal]').forEach(el => el.classList.add('is-in'));
  }

  /* ---------- Edits: build media from data attributes ---------- */
  const PLACEHOLDER = (label) => `
    <div class="placeholder">
      <svg class="placeholder__icon" aria-hidden="true"><use href="#i-play"/></svg>
      <span class="placeholder__label">${label}</span>
      <span class="placeholder__sub">Edit dropping soon</span>
    </div>`;

  const videos = [];
  const embeds = [];
  function embedUrl(link) {
    if (!link) return null;
    let m = link.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    if (m) return { kind: 'tiktok', url: `https://www.tiktok.com/player/v1/${m[1]}?autoplay=1&loop=1&music_info=0&description=0&rel=0&progress_bar=0&timestamp=0&fullscreen_button=0&closed_caption=0` };
    m = link.match(/instagram\.com\/(p|reel|reels)\/([\w-]+)/);
    if (m) return { kind: 'instagram', url: `https://www.instagram.com/${m[1] === 'p' ? 'p' : 'reel'}/${m[2]}/embed` };
    return null;
  }
  $$('.edit__media').forEach(media => {
    const src = (media.dataset.src || '').trim();
    const poster = (media.dataset.poster || '').trim();
    const link = (media.dataset.link || '').trim();
    const card = media.closest('.edit');
    const label = card ? ($('.edit__tag', card) || {}).textContent || 'Edit' : 'Showreel';

    const views = (media.dataset.views || '').trim();
    const addViews = () => {
      if (!views) return;
      const b = document.createElement('span');
      b.className = 'edit__views';
      b.innerHTML = `${svg('i-play')}${views} views`;
      media.appendChild(b);
    };
    const embed = !src ? embedUrl(link) : null;
    if (embed) {
      // the post itself is the preview: its player loads as the card nears the screen
      media.classList.add('has-embed', `is-${embed.kind}`);
      const box = document.createElement('div');
      box.className = 'embed-box';
      if (media.dataset.ratio) box.style.aspectRatio = media.dataset.ratio;
      media.appendChild(box);
      const load = () => {
        if (box.firstChild) return;
        const f = document.createElement('iframe');
        f.src = embed.url;
        f.title = `${label} edit`;
        f.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
        f.allowFullscreen = true;
        f.setAttribute('scrolling', 'no');
        box.appendChild(f);
      };
      embeds.push({ media, load });
      addViews();
      return;
    }

    if (!src && !poster) {
      if (card) media.innerHTML = PLACEHOLDER(label);
    } else if (src) {
      const v = document.createElement('video');
      v.src = src;
      if (poster) v.poster = poster;
      v.muted = true; v.loop = true; v.playsInline = true;
      v.preload = 'metadata';
      v.setAttribute('playsinline', '');
      media.innerHTML = '';
      media.appendChild(v);
      media.classList.add('has-video');
      if (media.dataset.fit === 'contain') {
        // wide edits: show the whole frame over a blurred copy of itself
        media.classList.add('fit-contain');
        if (poster) media.style.setProperty("--bg", `url("${new URL(poster, location.href).href}")`);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'edit__sound';
      btn.setAttribute('aria-label', 'Turn sound on');
      btn.innerHTML = svg('i-mute');
      media.appendChild(btn);
      videos.push({ v, btn, media });
      media.addEventListener('click', e => {
        if (e.target.closest('a')) return;
        toggleSound(v, btn);
      });
    } else if (poster) {
      media.innerHTML = `<img src="${poster}" alt="" loading="lazy">`;
    }

    addViews();
    if (link) {
      const a = document.createElement('a');
      a.className = 'edit__open';
      a.href = link;
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = `Watch ${svg('i-arrow')}`;
      media.appendChild(a);
    }
  });

  function toggleSound(v, btn) {
    const turnOn = v.muted;
    videos.forEach(o => { o.v.muted = true; o.btn.innerHTML = svg('i-mute'); o.btn.setAttribute('aria-label', 'Turn sound on'); });
    if (turnOn) {
      v.muted = false;
      v.play().catch(() => {});
      btn.innerHTML = svg('i-sound');
      btn.setAttribute('aria-label', 'Turn sound off');
    }
  }

  // play only what's on screen
  if (videos.length && 'IntersectionObserver' in window) {
    const vio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const v = $('video', e.target);
        if (!v) return;
        if (e.isIntersecting && !reduced) v.play().catch(() => {});
        else { v.pause(); }
      });
    }, { threshold: .35 });
    videos.forEach(o => vio.observe(o.media));
  }

  if (embeds.length) {
    if ('IntersectionObserver' in window) {
      const eio = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          const o = embeds.find(x => x.media === e.target);
          if (o) o.load();
          eio.unobserve(e.target);
        });
      }, { rootMargin: '300px 0px' });
      embeds.forEach(o => eio.observe(o.media));
    } else embeds.forEach(o => o.load());
  }

  /* ---------- About photo: flips through the photos while hovered ---------- */
  $$('.about__photo').forEach(el => {
    const imgs = $$('img', el);
    if (imgs.length < 2) return;
    let i = 0, t = 0;
    const show = n => { imgs[i].classList.remove('is-on'); i = n % imgs.length; imgs[i].classList.add('is-on'); };
    const start = () => { show(i + 1); clearInterval(t); t = setInterval(() => show(i + 1), 1100); };
    const stop = () => { clearInterval(t); };
    el.addEventListener('mouseenter', start);
    el.addEventListener('mouseleave', stop);
    el.addEventListener('focus', start);
    el.addEventListener('blur', stop);
  });

  /* ---------- Filters ---------- */
  const filterBtns = $$('[data-filter]');
  filterBtns.forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.filter;
    filterBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $$('.edit').forEach(card => {
      const show = f === 'all' || card.dataset.cat === f;
      card.classList.toggle('is-hidden', !show);
      if (show) card.classList.add('is-in');
    });
  }));

  /* ---------- Promote your track ---------- */
  const modal = $('#promo-modal');
  $$('[data-promo-open]').forEach(b => b.addEventListener('click', () => {
    if (modal && typeof modal.showModal === 'function') modal.showModal();
    else location.hash = '#promo';
  }));
  if (modal) {
    modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
    $$('a', modal).forEach(a => a.addEventListener('click', () => setTimeout(() => modal.close(), 150)));
  }

  /* ---------- Copy email ---------- */
  const toastEl = $('.toast');
  let toastT = 0;
  const toast = msg => {
    toastEl.innerHTML = `${svg('i-check')}<span></span>`;
    $('span', toastEl).textContent = msg;
    toastEl.classList.add('is-shown');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-shown'), 2200);
  };
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const text = btn.dataset.copy;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
      ta.remove();
    }
    toast(ok ? 'Email copied' : 'Couldn’t copy — select the address instead');
    const label = $('span', btn);
    if (ok && label) { label.textContent = 'Copied!'; setTimeout(() => { label.textContent = 'Copy'; }, 2000); }
  }));
})();
