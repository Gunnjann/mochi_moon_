/* ==========================================================================
   Mochi Moon — main.js
   Loader · Lenis · GSAP/ScrollTrigger choreography · travelling hero bowl ·
   split-line reveals · menu tabs & tilt · pinned Chef's Special · horizontal
   gallery · reviews · reservation form · hours · newsletter
   ========================================================================== */

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const root = document.documentElement;
const body = document.body;

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const { gsap, ScrollTrigger, Lenis } = window;

if (!gsap || !ScrollTrigger) {
  $('#loader')?.remove();
  $$('.reveal-up, .reveal-img').forEach((el) => el.classList.add('is-in'));
  throw new Error('GSAP failed to load — static fallback.');
}
gsap.registerPlugin(ScrollTrigger);
body.classList.add('is-loading');

const useTravel = !reduced;
if (useTravel) root.classList.add('has-travel');

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const lerp = (a, b, t) => a + (b - a) * t;
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/* ==========================================================================
   Smooth scroll
   ========================================================================== */
let lenis = null;
if (!reduced && Lenis) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
function scrollToTarget(el) {
  if (lenis) lenis.scrollTo(el, { offset: el.id === 'hero' ? 0 : -76, duration: 1.6 });
  else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  e.preventDefault();
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  const el = $(id);
  if (!el) return;
  closeMenu();
  scrollToTarget(el);
});

/* ==========================================================================
   Text splitting
   ========================================================================== */
// Hero title → characters inside masked lines
const heroTitle = $('[data-split]');
heroTitle.setAttribute('aria-label', heroTitle.textContent.replace(/\s+/g, ' ').trim());
$$('.line', heroTitle).forEach((line) => {
  line.setAttribute('aria-hidden', 'true');
  const em = line.querySelector('em');
  const target = em || line;
  target.innerHTML = target.textContent.trim().split(' ')
    .map((w) => `<span class="word">${[...w].map((c) => `<span class="char">${c}</span>`).join('')}</span>`).join(' ');
});

// h2.split-lines → words grouped into masked lines (after fonts load, so wrapping is right)
function splitLines(el) {
  if (el.dataset.splitDone) return;
  el.dataset.splitDone = '1';
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  const words = [];
  el.childNodes.forEach((n) => {
    const isEm = n.nodeName === 'EM';
    (n.textContent || '').split(/\s+/).filter(Boolean).forEach((w) => words.push(isEm ? `<em>${w}</em>` : w));
  });
  el.innerHTML = words.map((w) => `<span class="w" style="display:inline-block">${w}</span>`).join(' ');
  const lines = [];
  let top = null;
  $$('.w', el).forEach((w) => {
    if (w.offsetTop !== top) { lines.push([]); top = w.offsetTop; }
    lines[lines.length - 1].push(w.innerHTML);
  });
  el.innerHTML = lines.map((l) => `<span class="ln" aria-hidden="true"><span>${l.join(' ')}</span></span>`).join('');
}

// Buttons → text roll (two stacked copies)
$$('.btn > span').forEach((s) => {
  const t = s.textContent;
  s.innerHTML = `<i>${t}</i><i aria-hidden="true">${t}</i>`;
});

/* ==========================================================================
   Loader (~2s): ring draws, soup rises, counter 00 → 100, curtain lifts
   ========================================================================== */
function runLoader() {
  const pct = $('#loaderPct');
  const duration = reduced ? 0.3 : 2;
  const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
  const failSafe = new Promise((r) => setTimeout(r, 4500));
  const fill = new Promise((r) => {
    const o = { v: 0 };
    gsap.timeline({ onComplete: r })
      .to(o, { v: 100, duration, ease: 'power2.inOut', onUpdate: () => (pct.textContent = String(Math.round(o.v)).padStart(2, '0')) }, 0)
      .to('.loader__ring', { strokeDashoffset: 0, duration, ease: 'power2.inOut' }, 0)
      .fromTo('#loaderSoup', { y: 110 }, { y: 30, duration, ease: 'power2.inOut' }, 0);
  });
  return Promise.all([fill, Promise.race([loaded, failSafe])]).then(() => new Promise((resolve) => {
    gsap.timeline({ onComplete: () => { $('#loader').remove(); resolve(); } })
      .to('.loader__center, .loader__brand', { opacity: 0, y: -20, duration: 0.5, ease: 'power2.in' })
      .to('#loader', { clipPath: 'inset(0 0 100% 0)', duration: reduced ? 0.01 : 1, ease: 'expo.inOut' }, '-=0.1');
  }));
}

/* ==========================================================================
   Travelling bowl (hero → menu dock)
   ========================================================================== */
const travel = $('#travel');
const spin = $('#travelSpin');
const slot = $('#heroSlot');
const dock = $('#menuDock');
const BASE = 600;
const tState = { pA: 0, pB: 0, intro: 0, px: 0, py: 0, sx: 0, sy: 0, angle: 0, landed: false };
travel.style.width = travel.style.height = BASE + 'px';

addEventListener('pointermove', (e) => {
  tState.px = (e.clientX / innerWidth) * 2 - 1;
  tState.py = (e.clientY / innerHeight) * 2 - 1;
}, { passive: true });

function setLanded(on) {
  if (on === tState.landed) return;
  tState.landed = on;
  dock.classList.toggle('is-landed', on);
  travel.classList.toggle('is-on', !on);
}

function travelTick(_, dt) {
  if (tState.landed) return;
  const W = innerWidth, H = innerHeight;
  const s = slot.getBoundingClientRect();
  const d = dock.getBoundingClientRect();
  const a = easeIO(clamp01(tState.pA));
  const b = easeIO(clamp01(tState.pB));
  const mid = Math.min(W, H) * (W < 1024 ? 0.5 : 0.36);

  let x = lerp(s.left + s.width / 2, W / 2, a);
  let y = lerp(s.top + s.height / 2, H / 2, a);
  let size = lerp(s.width, mid, a);
  x = lerp(x, d.left + d.width / 2, b) + (W >= 1024 ? Math.sin(b * Math.PI) * W * 0.24 : 0);
  y = lerp(y, d.top + d.height / 2, b);
  size = lerp(size, d.width, easeOut(b));

  // gentle mouse parallax (fades out once the journey starts)
  tState.sx = lerp(tState.sx, tState.px, 0.06);
  tState.sy = lerp(tState.sy, tState.py, 0.06);
  const k = 1 - a;
  x += tState.sx * 16 * k; y += tState.sy * 12 * k;

  const scale = (size / BASE) * (0.85 + 0.15 * tState.intro);
  travel.style.transform = `translate3d(${x - (BASE * scale) / 2}px, ${y - (BASE * scale) / 2}px, 0) scale(${scale})`;
  travel.style.opacity = W < 1024 && tState.pB > 0 ? clamp01(1 - Math.sin(b * Math.PI) * 1.8) : tState.intro;

  tState.angle += (dt / 1000) * 5; // slow continuous rotation (deg/s)
  const rot = tState.angle + (a * 90 + b * 270);
  spin.style.transform = `perspective(1200px) rotateX(${-tState.sy * 7 * k}deg) rotateY(${tState.sx * 7 * k}deg) rotate(${rot}deg)`;
}

/* ==========================================================================
   Intro after the loader
   ========================================================================== */
function intro() {
  body.classList.remove('is-loading');
  lenis?.start();
  $$('.split-lines').forEach(splitLines);
  initScroll();
  if (reduced) { tState.intro = 1; $$('.reveal-up, .reveal-img').forEach((el) => el.classList.add('is-in')); return; }
  if (useTravel) { travel.classList.add('is-on'); gsap.ticker.add(travelTick); }
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.hero__panel', { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'expo.inOut' }, 0)
    .from('.nav__inner > *', { y: -20, opacity: 0, duration: 1, stagger: 0.06 }, 0.3)
    .from('.hero__title .char', { yPercent: 115, duration: 1.3, stagger: 0.028 }, 0.35)
    .to(tState, { intro: 1, duration: 1.6, ease: 'expo.out' }, 0.7)
    .from('.dish-column', { opacity: 0, y: 40, duration: 1.4 }, 0.9)
    .add(() => $$('.hero .reveal-up').forEach((el, i) => setTimeout(() => el.classList.add('is-in'), i * 110)), 0.8);
}

/* ==========================================================================
   Scroll choreography (pins first, then everything that depends on layout)
   ========================================================================== */
const ings = $$('.ing');
const bar = $('#specialBar');
const specialDish = $('#specialDish');
function updateSpecial(p) {
  bar.style.transform = `scaleX(${p})`;
  specialDish.style.transform = `rotate(${p * 360}deg)`;
  ings.forEach((el, i) => el.classList.toggle('is-in', p > 0.08 + i * 0.15));
}

function initScroll() {
  if (reduced) { ings.forEach((el) => el.classList.add('is-in')); return; }

  // 1. Hero pin → bowl travels into the menu dock
  gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: '+=60%', pin: true, scrub: true, onUpdate: (s) => (tState.pA = s.progress) } })
    .to('.hero__copy', { y: -80, opacity: 0, ease: 'none' }, 0)
    .to('.hero__panel', { clipPath: 'inset(0 0 0 100%)', ease: 'none' }, 0)
    .to('.dish-column', { y: -120, opacity: 0, ease: 'none' }, 0);
  ScrollTrigger.create({
    trigger: '#about', start: 'top bottom', endTrigger: '#menuDock', end: 'center 45%',
    onUpdate: (s) => { tState.pB = s.progress; setLanded(s.progress >= 0.999); },
    onLeave: () => setLanded(true),
    onEnterBack: () => setLanded(false),
  });

  // 2. Chef's Special + gallery (responsive)
  const gallery = $('.gallery');
  const track = $('.gallery__track');
  const idx = $('#galleryIdx');
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px)', () => {
    ScrollTrigger.create({ trigger: '#special', start: 'top top', end: '+=150%', pin: true, scrub: true, onUpdate: (s) => updateSpecial(s.progress) });
    gallery.classList.add('is-pinned');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: gallery, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
        onUpdate: (s) => (idx.textContent = String(Math.min(5, 1 + Math.floor(s.progress * 5))).padStart(2, '0')),
      },
    });
    $$('.shot__frame img').forEach((img) => {
      gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: img.closest('.shot'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
    return () => gallery.classList.remove('is-pinned');
  });
  mm.add('(max-width: 1023px)', () => {
    ScrollTrigger.create({ trigger: '.special__stage', start: 'top 85%', end: 'bottom 15%', scrub: true, onUpdate: (s) => updateSpecial(s.progress) });
  });

  // 3. Curved edge into the dark section flattens as it arrives
  gsap.to('#specialCurve', { attr: { d: 'M0,120 Q720,120 1440,120 Z' }, ease: 'none', scrollTrigger: { trigger: '#special', start: 'top bottom', end: 'top 25%', scrub: true } });

  // 4. Split-line headings
  $$('.split-lines').forEach((h) => {
    gsap.from($$('.ln > span', h), { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });

  // 5. Fade-up blocks & image curtains
  ScrollTrigger.batch('.reveal-up:not(.hero .reveal-up), .reveal-img', {
    start: 'top 90%', once: true,
    onEnter: (els) => els.forEach((el, i) => setTimeout(() => el.classList.add('is-in'), i * 90)),
  });

  // 6. Image parallax
  $$('[data-parallax]').forEach((img) => {
    gsap.fromTo(img, { yPercent: -7 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // 7. Menu cards rise in
  ScrollTrigger.batch('.dish', {
    start: 'top 92%', once: true,
    onEnter: (els) => gsap.from(els, { y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 }),
  });

  // 8. Counters
  $$('[data-count]').forEach((el) => {
    const target = +el.dataset.count;
    el.textContent = '0';
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => { const o = { v: 0 }; gsap.to(o, { v: target, duration: 2.2, ease: 'power3.out', onUpdate: () => (el.textContent = Math.round(o.v)) }); } });
  });

  // 9. Active nav link
  $$('.nav__links a').forEach((link) => {
    const sec = $(link.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 45%', end: 'bottom 45%', onToggle: (s) => { link.classList.toggle('is-active', s.isActive); s.isActive ? link.setAttribute('aria-current', 'true') : link.removeAttribute('aria-current'); } });
  });

  ScrollTrigger.refresh();
}

/* ==========================================================================
   Navigation: blur on scroll, hide on scroll-down, mobile sheet
   ========================================================================== */
const nav = $('#nav');
const navToggle = $('#navToggle');
let lastY = 0, ticking = false;
addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 20);
    if (!nav.classList.contains('is-open')) nav.classList.toggle('is-hidden', y > 400 && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove('is-hidden');
    lastY = y; ticking = false;
  });
}, { passive: true });
nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));

function closeMenu() {
  if (!nav.classList.contains('is-open')) return;
  nav.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Open menu');
  lenis?.start();
}
navToggle.addEventListener('click', () => {
  const open = !nav.classList.contains('is-open');
  nav.classList.toggle('is-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (open) {
    lenis?.stop();
    if (!reduced) gsap.from('.nav__links li', { yPercent: 60, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, delay: 0.25 });
  } else lenis?.start();
});
addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); navToggle.focus(); } });

/* ==========================================================================
   Cursor, magnetic buttons, press feedback
   ========================================================================== */
if (finePointer && !reduced) {
  root.classList.add('has-cursor');
  const cursor = $('.cursor');
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
  addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    const view = !!e.target.closest('.shot');
    cursor.classList.toggle('is-view', view);
    cursor.classList.toggle('is-hover', !view && !!e.target.closest('a, button, [data-tilt], select, input'));
  });
  document.documentElement.addEventListener('mouseleave', () => (cursor.style.opacity = 0));
  document.documentElement.addEventListener('mouseenter', () => (cursor.style.opacity = ''));

  $$('.magnetic').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.5, ease: 'power3.out' });
    });
    btn.addEventListener('pointerleave', () => gsap.to(btn, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)' }));
  });

  $$('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transition = 'transform .2s ease-out';
      card.style.transform = `rotateX(${-py * 8}deg) rotateY(${px * 8}deg)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transition = ''; card.style.transform = ''; });
  });
}
if (!reduced) {
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.btn');
    if (!b) return;
    b.classList.remove('is-press'); void b.offsetWidth; b.classList.add('is-press');
  });
  document.addEventListener('animationend', (e) => e.target.classList?.remove('is-press'));
}

/* ==========================================================================
   Hero dish column: duplicate items for a seamless infinite loop
   ========================================================================== */
const colTrack = $('.dish-column__track');
colTrack.innerHTML += colTrack.innerHTML;

/* ==========================================================================
   Menu tabs + filtering
   ========================================================================== */
const tabs = $$('#menu .tab');
const cards = $$('#menuGrid .dish');
function filterMenu(cat) {
  const show = cards.filter((c) => cat === 'all' || c.dataset.category === cat);
  const apply = () => cards.forEach((c) => c.classList.toggle('is-hidden', !show.includes(c)));
  if (reduced) { apply(); ScrollTrigger.refresh(); return; }
  gsap.to(cards.filter((c) => !c.classList.contains('is-hidden')), {
    opacity: 0, y: 20, duration: 0.3, stagger: 0.02, ease: 'power2.in',
    onComplete() {
      apply();
      ScrollTrigger.refresh();
      gsap.fromTo(show, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07, clearProps: 'transform,opacity' });
    },
  });
}
function selectTab(tab, focus = false) {
  tabs.forEach((t) => { const on = t === tab; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
  if (focus) tab.focus();
  filterMenu(tab.dataset.filter);
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (e) => {
    const map = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    selectTab(tabs[(map[e.key] + tabs.length) % tabs.length], true);
  });
});

/* ==========================================================================
   Reviews: crossfade carousel with timed progress bar
   ========================================================================== */
(() => {
  const quotes = $$('.quote');
  const qIdx = $('#qIdx');
  const pauseBtn = $('#qPause');
  let i = 0, paused = reduced, hovering = false, timer = null;
  const DURATION = 6;

  quotes.forEach((q) => {
    const bq = q.querySelector('blockquote');
    bq.innerHTML = bq.textContent.split(' ').map((w) => `<span class="word">${w}</span>`).join(' ');
  });
  function show(n) {
    i = (n + quotes.length) % quotes.length;
    quotes.forEach((q, k) => { const on = k === i; q.classList.toggle('is-active', on); q.toggleAttribute('inert', !on); q.setAttribute('aria-hidden', String(!on)); });
    qIdx.textContent = String(i + 1).padStart(2, '0');
    if (!reduced) gsap.fromTo($$('.word', quotes[i]), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.015 });
    restart();
  }
  function restart() {
    timer?.kill();
    gsap.set('#qBar', { scaleX: 0 });
    if (paused) return;
    timer = gsap.to('#qBar', { scaleX: 1, duration: DURATION, ease: 'none', onComplete: () => show(i + 1) });
    if (hovering) timer.pause();
  }
  $('#qPrev').addEventListener('click', () => show(i - 1));
  $('#qNext').addEventListener('click', () => show(i + 1));
  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.textContent = paused ? 'Play' : 'Pause';
    restart();
  });
  if (reduced) { pauseBtn.setAttribute('aria-pressed', 'true'); pauseBtn.textContent = 'Play'; }
  const q = $('.quotes');
  const hold = (on) => { hovering = on; on ? timer?.pause() : timer?.resume(); };
  q.addEventListener('pointerenter', () => hold(true));
  q.addEventListener('pointerleave', () => hold(false));
  q.addEventListener('focusin', () => hold(true));
  q.addEventListener('focusout', () => hold(false));
  quotes.forEach((qq, k) => k && (qq.setAttribute('aria-hidden', 'true'), qq.setAttribute('inert', '')));
  ScrollTrigger.create({ trigger: q, start: 'top 80%', once: true, refreshPriority: -1, onEnter: restart });
})();

/* ==========================================================================
   Reservation form + jumping mochi + confetti
   ========================================================================== */
(() => {
  const form = $('#reserveForm');
  const success = $('#reserveSuccess');
  const fName = $('#fName'), fPhone = $('#fPhone'), fDate = $('#fDate'), fTime = $('#fTime');
  const out = $('#fGuests');
  let guests = 2;
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  fDate.min = todayStr;
  for (let m = 12 * 60; m <= 22 * 60 + 30; m += 30) {
    const h = Math.floor(m / 60), mm = m % 60;
    const o = document.createElement('option');
    o.value = `${pad(h)}:${pad(mm)}`;
    o.textContent = `${((h + 11) % 12) + 1}:${pad(mm)} ${h < 12 ? 'am' : 'pm'}`;
    fTime.appendChild(o);
  }
  $$('.stepper__btn').forEach((b) => b.addEventListener('click', () => { guests = Math.min(12, Math.max(1, guests + +b.dataset.step)); out.textContent = guests; }));

  const setErr = (input, msg) => {
    $('#' + input.getAttribute('aria-describedby')).textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  };
  const checks = {
    fName: () => setErr(fName, fName.value.trim().length < 2 ? 'Please tell us your name.' : ''),
    fPhone: () => { const d = fPhone.value.replace(/\D/g, ''); return setErr(fPhone, d.length < 10 || d.length > 13 ? 'Please enter a valid 10-digit phone number.' : ''); },
    fDate: () => setErr(fDate, !fDate.value ? 'Choose a date.' : fDate.value < todayStr ? 'That date has passed.' : ''),
    fTime: () => {
      if (!fTime.value) return setErr(fTime, 'Choose a time.');
      if (fDate.value === todayStr) {
        const [h, m] = fTime.value.split(':').map(Number);
        const n = new Date();
        if (h * 60 + m <= n.getHours() * 60 + n.getMinutes()) return setErr(fTime, 'That time has passed today.');
      }
      return setErr(fTime, '');
    },
  };
  [fName, fPhone, fDate, fTime].forEach((el) => {
    el.addEventListener('blur', () => el.value && checks[el.id]());
    el.addEventListener('input', () => el.getAttribute('aria-invalid') === 'true' && checks[el.id]());
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (Object.values(checks).map((fn) => fn()).includes(false)) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }
    // ➜ Connect a real backend here (Formspree / Google Sheets / WhatsApp). See README.
    const d = new Date(`${fDate.value}T${fTime.value}`);
    const when = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    $('#successMsg').textContent = `A table for ${guests} on ${when} at ${fTime.options[fTime.selectedIndex].text} is held for ${fName.value.trim().split(' ')[0]}. We'll confirm on WhatsApp shortly.`;
    form.hidden = true; success.hidden = false; success.focus();
    ScrollTrigger.refresh();
    if (reduced) return;
    const m = '.success__body';
    gsap.timeline()
      .fromTo(m, { scaleX: 1, scaleY: 1, y: 0 }, { scaleX: 1.15, scaleY: 0.82, duration: 0.18, ease: 'power2.in' })
      .to(m, { scaleX: 0.92, scaleY: 1.1, y: -46, duration: 0.38, ease: 'power2.out' })
      .call(confetti)
      .to(m, { y: 0, scaleX: 1, scaleY: 1, duration: 0.32, ease: 'power2.in' })
      .to(m, { scaleX: 1.1, scaleY: 0.9, duration: 0.1 })
      .to(m, { scaleX: 1, scaleY: 1, duration: 0.8, ease: 'elastic.out(1, 0.35)' })
      .fromTo('.success h3, .success p, .success .btn', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.08 }, 0.2);
  });
  $('#bookAgain').addEventListener('click', () => {
    form.reset(); guests = 2; out.textContent = 2;
    [fName, fPhone, fDate, fTime].forEach((el) => setErr(el, ''));
    success.hidden = true; form.hidden = false; fName.focus();
    ScrollTrigger.refresh();
  });

  function confetti() {
    const c = $('#confetti');
    const ctx = c.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = c.clientWidth, h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr; ctx.scale(dpr, dpr);
    const colors = ['#B4441C', '#E07A4F', '#4F5B49', '#161412', '#D9C9B0'];
    const ox = w / 2, oy = 90;
    const parts = Array.from({ length: 80 }, () => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, sp = 4 + Math.random() * 6;
      return { x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, w: 3 + Math.random() * 3, h: 6 + Math.random() * 6, c: colors[(Math.random() * colors.length) | 0], r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3 };
    });
    const start = performance.now();
    (function tick(t) {
      const e = t - start;
      ctx.clearRect(0, 0, w, h);
      parts.forEach((p) => {
        p.vy += 0.18; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - e / 2400); ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      if (e < 2400) requestAnimationFrame(tick); else ctx.clearRect(0, 0, w, h);
    })(start);
  }
})();

/* ==========================================================================
   Opening hours (restaurant timezone)
   ========================================================================== */
(() => {
  const TZ = 'Asia/Kolkata';
  const HOURS = { 0: [660, 1320], 1: [720, 1350], 2: [720, 1350], 3: [720, 1350], 4: [720, 1350], 5: [720, 1410], 6: [720, 1410] };
  const n = new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
  const day = n.getDay(), mins = n.getHours() * 60 + n.getMinutes();
  const [o, c] = HOURS[day];
  const open = mins >= o && mins < c;
  const fmt = (m) => { const h = Math.floor(m / 60), mm = m % 60; return `${((h + 11) % 12) + 1}${mm ? ':' + String(mm).padStart(2, '0') : ''} ${h < 12 ? 'am' : 'pm'}`; };
  const pill = $('[data-open-pill]');
  pill.textContent = open ? 'Open now' : 'Closed now';
  pill.classList.toggle('is-closed', !open);
  const status = $('[data-open-status]');
  status.textContent = open ? `Open today till ${fmt(c)}` : mins < o ? `Opens today at ${fmt(o)}` : 'Closed · opens tomorrow';
  if (!open) $('.hero__meta .dot').classList.add('is-closed');
  $$('.hours [data-days]').forEach((row) => row.classList.toggle('is-today', row.dataset.days.split(',').includes(String(day))));
})();

/* ==========================================================================
   Newsletter + year
   ========================================================================== */
$('#newsForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#newsEmail'), msg = $('#newsMsg');
  if (!input.value || !input.checkValidity()) { msg.textContent = 'Please enter a valid email address.'; input.focus(); return; }
  msg.textContent = 'Thank you — you’re on the list.';
  input.value = '';
});
$('#year').textContent = new Date().getFullYear();

/* ---------- Go ---------- */
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => runLoader()).then(intro);
