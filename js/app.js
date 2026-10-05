/* =====================================================================
   Birthday Surprise · app.js
   Texts / pictures / quiz live in  js/config.js  – this file is the engine.
   ===================================================================== */
(() => {
  'use strict';

  const CFG = window.SITE_CONFIG || {};
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand  = (a, b) => a + Math.random() * (b - a);
  const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NAME = CFG.name || 'Cutie';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (s, extra = {}) => String(s).replace(/\{(\w+)\}/g, (m, k) => k === 'name' ? NAME : (k in extra ? extra[k] : m));
  const get = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);

  /* ---- fill every data-t="path.in.config" -------------------------- */
  $$('[data-t]').forEach(el => {
    const k = el.dataset.t;
    const v = k === 'name' ? NAME : get(CFG, k);
    if (v != null) el.textContent = fmt(v);
  });
  document.title = `Happy Birthday, ${NAME} 💖`;

  /* ==================================================================
     MUSIC  – starts automatically; if the browser blocks autoplay it
     starts on the very first tap / click / key press.
     ================================================================== */
  const Music = (() => {
    const el = $('#bg-music'), btn = $('#music-btn'), hint = $('#music-hint');
    const target = clamp(CFG.music && CFG.music.volume != null ? CFG.music.volume : 0.45, 0, 1);
    let wantOn = true, playing = false, pending = false, raf = 0, failed = false;

    try { if (sessionStorage.getItem('bday-music') === 'off') wantOn = false; } catch (e) {}

    el.src = (CFG.music && CFG.music.src) || 'audio/music.mp3';
    el.loop = true;
    el.volume = 0;
    el.addEventListener('error', () => { failed = true; pending = false; ui(); });

    function ui() {
      btn.classList.toggle('is-playing', playing && wantOn);
      btn.classList.toggle('is-off', !wantOn);
      btn.setAttribute('aria-pressed', String(wantOn));
      hint.hidden = !(pending && wantOn && !failed);
    }

    function fade(to, ms = 1800, done) {
      cancelAnimationFrame(raf);
      const from = el.volume, t0 = performance.now();
      const step = now => {
        const k = clamp((now - t0) / ms, 0, 1);
        el.volume = clamp(from + (to - from) * (k * k * (3 - 2 * k)), 0, 1);
        if (k < 1) raf = requestAnimationFrame(step); else if (done) done();
      };
      raf = requestAnimationFrame(step);
    }

    async function start() {
      if (!wantOn || failed) { ui(); return; }
      try {
        await el.play();
        playing = true; pending = false;
        fade(target, 2200);
      } catch (err) {
        playing = false;
        if (err && err.name === 'NotAllowedError') { pending = true; arm(); } else { failed = true; pending = false; }
      }
      ui();
    }

    /* browsers only allow sound after a user gesture → wait for the first one */
    const gestureEvents = ['pointerup', 'touchend', 'mousedown', 'click', 'keydown'];
    function onGesture(e) {
      if (e.target && e.target.closest && e.target.closest('#music-btn')) return; // the button handles itself
      gestureEvents.forEach(ev => window.removeEventListener(ev, onGesture, true));
      start();
    }
    let armed = false;
    function arm() {
      if (armed) return; armed = true;
      gestureEvents.forEach(ev => window.addEventListener(ev, onGesture, true));
    }

    btn.addEventListener('click', () => {
      if (pending) { wantOn = true; start(); return; }
      wantOn = !wantOn;
      try { sessionStorage.setItem('bday-music', wantOn ? 'on' : 'off'); } catch (e) {}
      if (wantOn) { start(); }
      else { fade(0, 600, () => el.pause()); playing = false; ui(); }
      SFX.tap(wantOn ? 6 : 2, true);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (playing) el.pause(); }
      else if (playing && wantOn) el.play().catch(() => {});
    });

    return { start, get on() { return wantOn; } };
  })();

  /* ==================================================================
     SOUND EFFECTS (tiny synthesised blips – no extra files)
     ================================================================== */
  const SFX = (() => {
    let ctx = null, master = null;
    const SC = [523.25, 587.33, 659.25, 783.99, 880.0, 987.77, 1046.5, 1174.66, 1318.51, 1396.91];
    function ensure() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        try { ctx = new AC(); } catch (e) { return false; }
        master = ctx.createGain(); master.gain.value = 0.6; master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    function tone({ f = 440, t = 0, d = 0.2, type = 'sine', g = 0.1, to = null, a = 0.006 }) {
      const now = ctx.currentTime + t;
      const o = ctx.createOscillator(), v = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, now);
      if (to) o.frequency.exponentialRampToValueAtTime(to, now + d);
      v.gain.setValueAtTime(0.0001, now);
      v.gain.linearRampToValueAtTime(g, now + a);
      v.gain.exponentialRampToValueAtTime(0.0001, now + d);
      o.connect(v); v.connect(master); o.start(now); o.stop(now + d + 0.05);
    }
    const can = force => (force || Music.on) && ensure();
    return {
      tap(n = 0, force) { if (!can(force)) return; const f = SC[((n % 10) + 10) % 10]; tone({ f, d: 0.16, g: 0.09 }); tone({ f: f * 2, d: 0.09, g: 0.025, type: 'triangle' }); },
      back()  { if (!can()) return; tone({ f: 420, to: 300, d: 0.12, g: 0.07, type: 'triangle' }); },
      swap()  { if (!can()) return; tone({ f: 660, to: 920, d: 0.1, g: 0.07, type: 'triangle' }); tone({ f: 990, t: 0.07, d: 0.12, g: 0.05 }); },
      bad()   { if (!can()) return; tone({ f: 250, to: 150, d: 0.32, g: 0.11, type: 'sawtooth' }); },
      ok()    { if (!can()) return; [0, 2, 4, 6].forEach((n, i) => tone({ f: SC[n], t: i * 0.075, d: 0.5, g: 0.075, type: 'triangle' })); },
      magic() { if (!can()) return; [2, 4, 5, 6, 7, 8, 9].forEach((n, i) => tone({ f: SC[n] * (n > 6 ? 1.5 : 1), t: i * 0.055, d: 0.55, g: 0.06 })); },
      whoosh(){ if (!can()) return; tone({ f: 200, to: 1400, d: 0.35, g: 0.035, type: 'sine' }); }
    };
  })();

  /* ==================================================================
     CONFETTI (canvas)
     ================================================================== */
  const Confetti = (() => {
    const cv = $('#fx-confetti'), ctx = cv.getContext('2d');
    const COLORS = ['#ff5c8a', '#ff9ec0', '#ffd166', '#fff176', '#ffffff', '#ec4899', '#ffb3c7', '#f9a8d4', '#ffe08a'];
    let W = 0, H = 0, dpr = 1, parts = [], raf = 0, last = 0, rainUntil = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    addEventListener('resize', resize); resize();

    function heart(x, y, s) {
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.35);
      ctx.bezierCurveTo(x, y - s * 0.1, x - s * 0.7, y - s * 0.1, x - s * 0.7, y + s * 0.25);
      ctx.bezierCurveTo(x - s * 0.7, y + s * 0.6, x - s * 0.1, y + s * 0.8, x, y + s);
      ctx.bezierCurveTo(x + s * 0.1, y + s * 0.8, x + s * 0.7, y + s * 0.6, x + s * 0.7, y + s * 0.25);
      ctx.bezierCurveTo(x + s * 0.7, y - s * 0.1, x, y - s * 0.1, x, y + s * 0.35);
      ctx.closePath();
    }

    function make(x, y, vx, vy) {
      const shape = Math.random();
      return {
        x, y, vx, vy, rot: rand(0, 6.28), vr: rand(-0.3, 0.3),
        w: rand(6, 11), h: rand(3, 6), color: pick(COLORS),
        shape: shape < 0.14 ? 'heart' : shape < 0.3 ? 'dot' : 'rect',
        wob: rand(0, 6.28), wobS: rand(0.06, 0.16), life: rand(110, 190)
      };
    }

    function burst(x = W / 2, y = H * 0.42, o = {}) {
      if (reduceMotion) return;
      const { count = 110, power = 14, spread = Math.PI * 2, angle = -Math.PI / 2 } = o;
      for (let i = 0; i < count; i++) {
        const a = angle + rand(-spread / 2, spread / 2), p = rand(power * 0.35, power);
        parts.push(make(x, y, Math.cos(a) * p, Math.sin(a) * p));
      }
      run();
    }
    function celebrate() {
      burst(W / 2, H * 0.4, { count: 130 });
      setTimeout(() => burst(W * 0.15, H * 0.62, { count: 60, angle: -1.15, spread: 0.9, power: 17 }), 180);
      setTimeout(() => burst(W * 0.85, H * 0.62, { count: 60, angle: -1.99, spread: 0.9, power: 17 }), 320);
    }
    function rain(ms = 3500) { if (reduceMotion) return; rainUntil = performance.now() + ms; run(); }

    function run() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }
    function loop(now) {
      const dt = Math.min(2.2, (now - last) / 16.67); last = now;
      ctx.clearRect(0, 0, W, H);
      if (now < rainUntil && parts.length < 220) {
        for (let i = 0; i < 2; i++) { const p = make(rand(0, W), -12, rand(-1.2, 1.2), rand(1.5, 4)); p.life = 400; parts.push(p); }
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.vx *= Math.pow(0.985, dt); p.vy = p.vy * Math.pow(0.985, dt) + 0.26 * dt;
        p.wob += p.wobS * dt;
        p.x += (p.vx + Math.sin(p.wob) * 0.8) * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.life -= dt;
        if (p.y > H + 30 || p.life <= 0) { parts.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = clamp(p.life / 40, 0, 1);
        ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
        if (p.shape === 'rect') { ctx.scale(1, Math.abs(Math.cos(p.wob))); ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
        else if (p.shape === 'dot') { ctx.beginPath(); ctx.arc(0, 0, p.h * 0.7, 0, 6.28); ctx.fill(); }
        else { heart(0, -p.w * 0.5, p.w * 0.9); ctx.fill(); }
        ctx.restore();
      }
      if (parts.length || now < rainUntil) raf = requestAnimationFrame(loop);
      else { raf = 0; ctx.clearRect(0, 0, W, H); }
    }
    return { burst, celebrate, rain };
  })();

  /* ==================================================================
     AMBIENT PARTICLES  (floating hearts / sparkles + cursor trail)
     ================================================================== */
  const Ambient = (() => {
    const cv = $('#fx-ambient'), ctx = cv.getContext('2d');
    const PINKS = ['#ff7eb0', '#ff9cc4', '#f06292', '#ffb3d1', '#ff6fa5'];
    let W = 0, H = 0, dpr = 1, P = [], T = [], raf = 0, last = 0, lastTrail = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = clamp(Math.round(W * H / 60000), 12, 30);
      while (P.length < n) P.push(spawn(true));
      P.length = n;
    }
    function spawn(init) {
      const kind = Math.random();
      return {
        kind: kind < 0.5 ? 'heart' : kind < 0.8 ? 'spark' : 'bubble',
        x: rand(0, W), y: init ? rand(0, H) : H + 30,
        s: rand(7, 20), vy: rand(0.12, 0.5), sway: rand(0, 6.28), swayS: rand(0.004, 0.012), amp: rand(10, 36),
        a: rand(0.18, 0.5), color: pick(PINKS), tw: rand(0, 6.28), rot: rand(-0.5, 0.5)
      };
    }
    function heart(x, y, s) {
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.35);
      ctx.bezierCurveTo(x, y - s * 0.1, x - s * 0.7, y - s * 0.1, x - s * 0.7, y + s * 0.25);
      ctx.bezierCurveTo(x - s * 0.7, y + s * 0.6, x - s * 0.1, y + s * 0.8, x, y + s);
      ctx.bezierCurveTo(x + s * 0.1, y + s * 0.8, x + s * 0.7, y + s * 0.6, x + s * 0.7, y + s * 0.25);
      ctx.bezierCurveTo(x + s * 0.7, y - s * 0.1, x, y - s * 0.1, x, y + s * 0.35);
      ctx.closePath();
    }
    function star(x, y, r) {
      ctx.beginPath();
      ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y);
      ctx.quadraticCurveTo(x, y, x, y - r); ctx.closePath();
    }
    function draw(p, a) {
      ctx.globalAlpha = a;
      if (p.kind === 'heart') { ctx.fillStyle = p.color; heart(p.x, p.y, p.s); ctx.fill(); }
      else if (p.kind === 'spark') { ctx.fillStyle = p.gold ? '#ffc94d' : '#ffe9a8'; star(p.x, p.y, p.s * 0.8); ctx.fill(); }
      else { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 0.6, 0, 6.28); ctx.stroke(); }
    }
    function loop(now) {
      const dt = Math.min(3, (now - last) / 16.67); last = now;
      ctx.clearRect(0, 0, W, H);
      for (const p of P) {
        p.y -= p.vy * dt; p.sway += p.swayS * dt; p.tw += 0.03 * dt;
        p.x += Math.sin(p.sway) * 0.35 * dt;
        if (p.y < -30) Object.assign(p, spawn(false), { x: rand(0, W) });
        draw(p, p.a * (p.kind === 'spark' ? 0.5 + 0.5 * Math.sin(p.tw) : 1));
      }
      for (let i = T.length - 1; i >= 0; i--) {
        const t = T[i];
        t.life -= dt; t.x += t.vx * dt; t.y += t.vy * dt; t.vy += 0.012 * dt;
        if (t.life <= 0) { T.splice(i, 1); continue; }
        draw(t, clamp(t.life / 40, 0, 1) * 0.85);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    }
    function trail(x, y) {
      const now = performance.now();
      if (now - lastTrail < 45 || T.length > 40) return;
      lastTrail = now;
      const heartKind = Math.random() < 0.55;
      T.push({ kind: heartKind ? 'heart' : 'spark', gold: !heartKind && Math.random() < 0.6, x: x + rand(-4, 4), y: y + rand(-4, 4), s: rand(5, 10), vx: rand(-0.5, 0.5), vy: rand(-0.7, -0.15), life: rand(36, 58), color: pick(PINKS) });
    }
    function start() {
      if (reduceMotion || raf) return;
      resize(); last = performance.now(); raf = requestAnimationFrame(loop);
    }
    addEventListener('resize', () => { if (!reduceMotion) resize(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else start();
    });
    return { start, trail };
  })();

  /* ==================================================================
     SCREEN MANAGER
     ================================================================== */
  const Screens = (() => {
    const chapters = { welcome: 0, memories: 1, mail: 2, letter: 2, puzzle: 3, quiz: 4, result: 4, final: 5 };
    const dots = [];
    const nav = $('#progress');
    for (let i = 0; i < 6; i++) { const d = document.createElement('i'); nav.appendChild(d); dots.push(d); }
    const hooks = {};
    let cur = null, timer = 0;

    function progress(id) {
      const c = chapters[id];
      nav.classList.toggle('hide', c == null);
      dots.forEach((d, i) => { d.classList.toggle('on', i === c); d.classList.toggle('done', c != null && i < c); });
    }
    function go(id, opts = {}) {
      const next = $('#screen-' + id), prev = cur ? $('#screen-' + cur) : null;
      if (!next || cur === id) return;
      clearTimeout(timer);
      const show = () => {
        if (prev) prev.classList.remove('melt');
        next.scrollTop = 0;
        next.classList.add('active');
        cur = id; progress(id);
        if (hooks[id]) hooks[id]();
      };
      if (prev) {
        prev.classList.remove('active');
        if (opts.melt) prev.classList.add('melt');
        cur = null;
        timer = setTimeout(show, opts.delay != null ? opts.delay : 560);
      } else show();
    }
    return { go, hooks, get current() { return cur; } };
  })();

  /* ==================================================================
     1 · LOCK
     ================================================================== */
  const Lock = (() => {
    const code = String(CFG.passcode != null ? CFG.passcode : '123456').replace(/\D/g, '') || '123456';
    const pinEl = $('#pin'), msg = $('#pin-msg'), card = $('.card--lock');
    let val = '', locked = false, dots = [];
    for (let i = 0; i < code.length; i++) pinEl.insertAdjacentHTML('beforeend', '<span class="pin-dot"><svg><use href="#i-heart"/></svg></span>');
    dots = $$('.pin-dot', pinEl);
    msg.textContent = fmt((CFG.lock && CFG.lock.wrong) || 'Try again');

    const render = () => dots.forEach((d, i) => d.classList.toggle('on', i < val.length));
    function poke() { card.classList.add('is-poked'); setTimeout(() => card.classList.remove('is-poked'), 220); }

    function check() {
      locked = true;
      if (val === code) {
        card.classList.add('is-open');
        SFX.ok();
        setTimeout(() => Screens.go('gift'), 900);
      } else {
        SFX.bad();
        pinEl.classList.add('shake'); msg.classList.add('show');
        if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
        setTimeout(() => { val = ''; render(); pinEl.classList.remove('shake'); msg.classList.remove('show'); locked = false; }, 1100);
      }
    }
    function press(k) {
      if (locked) return;
      if (k === 'back') { if (!val) return; val = val.slice(0, -1); SFX.back(); }
      else if (val.length < code.length) { val += k; SFX.tap(+k); poke(); if (navigator.vibrate) navigator.vibrate(8); }
      render();
      if (val.length === code.length) setTimeout(check, 220);
    }
    $('#keypad').addEventListener('click', e => {
      const b = e.target.closest('.key[data-k]'); if (b) press(b.dataset.k);
    });
    addEventListener('keydown', e => {
      if (Screens.current !== 'lock') return;
      let k = null;
      if (/^[0-9]$/.test(e.key)) k = e.key; else if (e.key === 'Backspace') k = 'back';
      if (k == null) return;
      const b = $(`.key[data-k="${k}"]`); if (b) { b.classList.add('pressed'); setTimeout(() => b.classList.remove('pressed'), 140); }
      press(k);
    });
    Screens.hooks.lock = () => {};
    return { reset() { val = ''; locked = false; card.classList.remove('is-open'); render(); } };
  })();

  /* ==================================================================
     2 · GIFT   →   3 · WELCOME
     ================================================================== */
  $('#btn-open').addEventListener('click', e => {
    const r = e.currentTarget.getBoundingClientRect();
    SFX.magic();
    Confetti.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 90, power: 15 });
    Screens.go('welcome', { melt: true, delay: 700 });
  });
  Screens.hooks.welcome = () => { setTimeout(() => Confetti.celebrate(), 150); SFX.whoosh(); };
  $('#btn-explore').addEventListener('click', () => { SFX.tap(6); Screens.go('memories'); });

  /* ==================================================================
     4 · MEMORIES  (swipeable polaroid stack)
     ================================================================== */
  const Memories = (() => {
    const box = $('#polaroids');
    const photos = (CFG.memories && CFG.memories.photos) || [];
    const SLOTS = [
      { tx: '0rem', ty: '0rem', rot: '0deg', sc: 1, op: 1 },
      { tx: '-.55rem', ty: '.9rem', rot: '-3.2deg', sc: .97, op: 1 },
      { tx: '.75rem', ty: '1.7rem', rot: '3.6deg', sc: .94, op: 1 },
      { tx: '.75rem', ty: '1.7rem', rot: '3.6deg', sc: .94, op: 0 }
    ];
    let cards = [], order = [], drag = null;

    function applySlot(c, i) {
      const s = SLOTS[Math.min(i, 3)];
      c.style.setProperty('--tx', s.tx); c.style.setProperty('--ty', s.ty);
      c.style.setProperty('--rot', s.rot); c.style.setProperty('--sc', s.sc); c.style.setProperty('--op', s.op);
      c.dataset.pos = i;
    }
    const layout = () => order.forEach((c, i) => applySlot(c, i));

    function build() {
      box.innerHTML = ''; cards = [];
      photos.forEach(p => {
        const f = document.createElement('figure');
        f.className = 'polaroid';
        f.innerHTML = `<img src="${esc(p.src)}" alt="${esc(p.caption || '')}" draggable="false"><figcaption>${esc(fmt(p.caption || ''))}</figcaption>`;
        box.appendChild(f); cards.push(f);
      });
      order = cards.slice(); layout();
    }

    function next(dir = 1) {
      if (order.length < 2) return;
      const top = order.shift(); order.push(top);
      top.classList.remove('dragging');
      top.style.zIndex = 5;
      top.style.setProperty('--tx', (dir * innerWidth * 0.75) + 'px');
      top.style.setProperty('--ty', '-1rem');
      top.style.setProperty('--rot', (dir * 26) + 'deg');
      top.style.setProperty('--op', 0);
      order.slice(0, -1).forEach((c, i) => applySlot(c, i));
      SFX.swap();
      setTimeout(() => {                       // tuck it quietly behind the stack
        top.style.transition = 'none';
        top.style.zIndex = '';
        applySlot(top, order.length - 1);
        top.style.setProperty('--op', 0);
        void top.offsetWidth;
        top.style.transition = '';
        top.style.setProperty('--op', SLOTS[Math.min(order.length - 1, 3)].op === 0 ? 0 : 1);
      }, 520);
    }

    box.addEventListener('pointerdown', e => {
      if (order.length < 2 || !order[0].contains(e.target)) return;
      drag = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
      order[0].classList.add('dragging');
      try { box.setPointerCapture(e.pointerId); } catch (err) {}
    });
    box.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 7) drag.moved = true;
      const c = order[0];
      c.style.setProperty('--tx', dx + 'px'); c.style.setProperty('--ty', dy * 0.3 + 'px');
      c.style.setProperty('--rot', clamp(dx / 14, -28, 28) + 'deg');
    });
    function release(e) {
      if (!drag) return;
      const dx = e.clientX - drag.x, v = dx / Math.max(1, performance.now() - drag.t);
      const moved = drag.moved; drag = null;
      const c = order[0]; c.classList.remove('dragging');
      if (!moved) next(1);
      else if (Math.abs(dx) > 70 || Math.abs(v) > 0.55) next(dx >= 0 ? 1 : -1);
      else applySlot(c, 0);
    }
    box.addEventListener('pointerup', release);
    box.addEventListener('pointercancel', release);
    addEventListener('keydown', e => {
      if (Screens.current !== 'memories') return;
      if (e.key === 'ArrowRight') next(1); else if (e.key === 'ArrowLeft') next(-1);
    });

    Screens.hooks.memories = () => { build(); };
    $('#btn-letter').addEventListener('click', () => { SFX.tap(6); Screens.go('mail'); });
    return {};
  })();

  /* ==================================================================
     5 · MAIL   →   6 · LETTER
     ================================================================== */
  $('#btn-mail').addEventListener('click', e => {
    const r = e.currentTarget.getBoundingClientRect();
    SFX.magic();
    Confetti.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 45, power: 11 });
    Screens.go('letter');
  });

  const Letter = (() => {
    const pages = (CFG.letter && CFG.letter.pages) || [];
    const wrap = $('#letter-pages'), foot = $('#letter-foot'), pill = $('#page-pill');
    let idx = 0, built = false;

    function build() {
      wrap.innerHTML = pages.map((p, i) => {
        const lines = (p.paragraphs || []).map((t, j) => `<span class="line" style="--i:${j}">${esc(fmt(t))}</span>`).join('');
        const sig = p.signature ? `<div class="signature"><b>${esc(fmt(p.signature.big))}</b><span>${esc(fmt(p.signature.small))}</span></div>` : '';
        return `<article class="lpage" data-i="${i}">${p.title ? `<h2>${esc(fmt(p.title))}</h2>` : ''}<p>${lines}</p>${sig}</article>`;
      }).join('');
      built = true;
    }
    function show(i, back) {
      idx = clamp(i, 0, pages.length - 1);
      $$('.lpage', wrap).forEach((el, k) => {
        el.classList.toggle('on', k === idx);
        el.classList.toggle('back', !!back);
      });
      pill.textContent = `Page ${idx + 1} of ${pages.length}`;
      const p = pages[idx], last = idx === pages.length - 1;
      foot.innerHTML = (idx > 0 ? `<button class="btn btn--ghost" data-act="prev"><svg class="ico"><use href="#i-chev-l"/></svg>${esc(fmt(p.back || 'Back'))}</button>` : '')
        + `<button class="btn ${last ? 'btn--primary' : 'btn--soft'} push" data-act="${last ? 'done' : 'next'}">${esc(fmt(p.button || (last ? 'Continue' : 'Read More')))}<svg class="ico"><use href="#${last ? 'i-arrow' : 'i-chev-r'}"/></svg></button>`;
    }
    foot.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const a = b.dataset.act;
      if (a === 'next') { SFX.tap(4); show(idx + 1, false); }
      else if (a === 'prev') { SFX.back(); show(idx - 1, true); }
      else { SFX.tap(6); Screens.go('puzzle'); }
    });
    Screens.hooks.letter = () => { if (!built) build(); show(0); };
    return { reset() { built = false; } };
  })();

  /* ==================================================================
     7 · PUZZLE  (tap two pieces to swap)
     ================================================================== */
  const Puzzle = (() => {
    const P = CFG.puzzle || {};
    const G = clamp(P.grid || 3, 2, 5), N = G * G;
    const board = $('#board'), grid = $('#board-grid'), hint = $('#puzzle-hint');
    const swapsEl = $('#swaps'), done = $('#puzzle-done');
    let tiles = [], sel = null, swaps = 0, phase = 'idle', timers = [];

    const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); };
    const setSlot = (t, s) => { t.dataset.slot = s; t.style.setProperty('--c', s % G); t.style.setProperty('--r', Math.floor(s / G)); };
    const label = () => `${P.swapsLabel || 'Swaps'}: ${swaps}`;

    function build() {
      grid.innerHTML = ''; tiles = [];
      grid.style.setProperty('--n', G);
      for (let id = 0; id < N; id++) {
        const t = document.createElement('div');
        t.className = 'tile'; t.innerHTML = '<i></i>';
        // resolve against the page (not the stylesheet) so it works from any folder
        t.style.setProperty('--img', `url("${new URL(P.image, document.baseURI).href}")`);
        t.style.setProperty('--ox', id % G); t.style.setProperty('--oy', Math.floor(id / G));
        t.dataset.id = id; setSlot(t, id);
        if (id === 0) t.classList.add('c-tl');
        if (id === G - 1) t.classList.add('c-tr');
        if (id === N - G) t.classList.add('c-bl');
        if (id === N - 1) t.classList.add('c-br');
        t.addEventListener('click', () => choose(t));
        grid.appendChild(t); tiles.push(t);
      }
    }

    function shuffle() {
      let perm;
      do {
        perm = Array.from({ length: N }, (_, i) => i);
        for (let i = N - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
      } while (perm.filter((v, i) => v === i).length > 1);
      tiles.forEach((t, i) => setSlot(t, perm[i]));
      board.classList.remove('assembled');
      hint.classList.remove('is-dark');
      hint.textContent = fmt(P.playText || 'Tap two pieces to swap them!');
      phase = 'play';
      SFX.whoosh();
    }

    function start() {
      timers.forEach(clearTimeout); timers = [];
      build(); sel = null; swaps = 0; phase = 'memorize';
      board.classList.add('assembled'); board.classList.remove('solved');
      done.hidden = true; swapsEl.hidden = false; swapsEl.textContent = label();
      hint.classList.add('is-dark');
      let s = P.memorizeSeconds != null ? P.memorizeSeconds : 3;
      const tick = () => {
        hint.textContent = fmt(P.memorizeText || 'Memorize the image! Shuffling in {s}s...', { s });
        if (s <= 0) later(shuffle, 800); else { s--; later(tick, 1000); }
      };
      tick();
    }

    function choose(t) {
      if (phase !== 'play') return;
      if (!sel) { sel = t; t.classList.add('sel'); SFX.tap(3); return; }
      if (sel === t) { t.classList.remove('sel'); sel = null; SFX.back(); return; }
      const a = sel, b = t, sa = +a.dataset.slot, sb = +b.dataset.slot;
      setSlot(a, sb); setSlot(b, sa);
      a.classList.remove('sel'); sel = null;
      swaps++; swapsEl.textContent = label();
      SFX.swap();
      if (tiles.every(x => +x.dataset.slot === +x.dataset.id)) win();
    }

    function win() {
      phase = 'done';
      later(() => {
        board.classList.add('solved', 'assembled');
        SFX.ok(); Confetti.celebrate();
        swapsEl.hidden = true; done.hidden = false;
      }, 520);
    }

    $('#btn-quiz').addEventListener('click', () => { SFX.tap(6); Screens.go('quiz'); });
    Screens.hooks.puzzle = start;
    return { reset() { timers.forEach(clearTimeout); timers = []; phase = 'idle'; } };
  })();

  /* ==================================================================
     8 · QUIZ   →   9 · RESULT
     ================================================================== */
  const Quiz = (() => {
    const Q = CFG.quiz || [];
    const bar = $('#hearts-bar'), qText = $('#q-text'), opts = $('#options'), count = $('#q-count');
    const card = $('.card--quiz');
    let i = 0, score = 0, missed = false, busy = false;

    function hearts() {
      bar.innerHTML = Q.map((_, k) => `<span class="hb ${k < i ? 'done' : k === i ? 'cur' : ''}"><svg><use href="#i-heart"/></svg></span>`).join('');
    }
    function render() {
      const q = Q[i]; missed = false; busy = false;
      hearts();
      qText.textContent = fmt(q.q);
      count.textContent = `Question ${i + 1} of ${Q.length}`;
      opts.classList.remove('locked');
      opts.innerHTML = q.options.map((o, k) => `<button class="opt" data-k="${k}" style="--i:${k}"><span>${esc(fmt(o))}</span><span class="tick"><svg><use href="#i-check"/></svg></span></button>`).join('');
    }
    opts.addEventListener('click', async e => {
      const b = e.target.closest('.opt'); if (!b || busy) return;
      const q = Q[i];
      if (+b.dataset.k === q.answer) {
        busy = true; b.classList.add('ok'); opts.classList.add('locked');
        if (!missed) score++;
        SFX.ok();
        await sleep(950);
        card.classList.add('swap-out'); await sleep(320);
        card.classList.remove('swap-out');
        i++;
        if (i >= Q.length) { hearts(); Screens.go('result'); }
        else render();
      } else {
        missed = true; b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); SFX.bad();
        if (navigator.vibrate) navigator.vibrate(60);
      }
    });
    Screens.hooks.quiz = () => { i = 0; score = 0; render(); };

    Screens.hooks.result = () => {
      $('#score').textContent = `${score}/${Q.length}`;
      $('#result-text').textContent = fmt((CFG.result && CFG.result.text) || 'You got {score} out of {total} right!', { score, total: Q.length });
      setTimeout(() => { Confetti.celebrate(); SFX.magic(); }, 250);
    };
    $('#btn-last').addEventListener('click', () => { SFX.tap(6); Screens.go('final'); });
    return {};
  })();

  /* ==================================================================
     10 · FINALE
     ================================================================== */
  Screens.hooks.final = () => {
    const img = $('#final-photo');
    if (!img.getAttribute('src')) img.src = (CFG.finale && CFG.finale.photo) || '';
    setTimeout(() => { Confetti.celebrate(); Confetti.rain(4200); SFX.magic(); }, 300);
  };
  $('#btn-relive').addEventListener('click', () => {
    SFX.tap(2);
    Lock.reset(); Puzzle.reset(); Letter.reset();
    Screens.go('lock');
  });

  /* ==================================================================
     POLISH: ripples, 3-D tilt, parallax, cursor trail
     ================================================================== */
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('.btn'); if (!b) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(s); setTimeout(() => s.remove(), 700);
  });

  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion) {
    const root = document.documentElement;
    let mx = innerWidth / 2, my = innerHeight / 2, ticking = false;
    const apply = () => {
      ticking = false;
      root.style.setProperty('--px', ((mx / innerWidth) - 0.5) * 2);
      root.style.setProperty('--py', ((my / innerHeight) - 0.5) * 2);
      const card = $('.screen.active .card');
      if (card) {
        const r = card.getBoundingClientRect();
        const nx = clamp((mx - (r.left + r.width / 2)) / (r.width / 2), -1.2, 1.2);
        const ny = clamp((my - (r.top + r.height / 2)) / (r.height / 2), -1.2, 1.2);
        card.style.setProperty('--ry', (nx * 3) + 'deg');
        card.style.setProperty('--rx', (-ny * 2.2) + 'deg');
        card.style.setProperty('--gx', ((mx - r.left) / r.width * 100) + '%');
        card.style.setProperty('--gy', ((my - r.top) / r.height * 100) + '%');
      }
    };
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      Ambient.trail(mx, my);
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    });
    document.addEventListener('mouseleave', () => {
      $$('.card').forEach(c => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ==================================================================
     GO!
     ================================================================== */
  Ambient.start();
  Music.start();                       // tries to autoplay right away
  setTimeout(() => Screens.go('lock'), 250);
})();
