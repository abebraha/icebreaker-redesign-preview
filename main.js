/* Icebreaker redesign preview v2 — motion system, hero field, small behaviours. No dependencies. */
(function () {
  const doc = document.documentElement;
  doc.classList.remove('no-js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const raf = window.requestAnimationFrame;

  /* ---------- Header: transparent over the hero, glass once scrolled ---------- */
  const hdr = document.querySelector('.hdr');
  const solid = () => { if (hdr) hdr.classList.toggle('solid', window.scrollY > 24); };
  solid(); window.addEventListener('scroll', solid, { passive: true });

  /* ---------- Mobile nav ---------- */
  const burger = document.querySelector('.burger');
  const mnav = document.querySelector('.mnav');
  if (burger && mnav) {
    const set = (open) => {
      burger.setAttribute('aria-expanded', String(open));
      mnav.hidden = !open;
      burger.querySelector('.ic-open').hidden = open;
      burger.querySelector('.ic-close').hidden = !open;
      document.body.style.overflow = open ? 'hidden' : '';
      if (hdr) hdr.classList.toggle('solid', open || window.scrollY > 24);
    };
    burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mnav.hidden) { set(false); burger.focus(); } });
    mnav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));
  }

  /* ---------- Reveals: sections get .in when they enter; hero on load ---------- */
  const revealables = document.querySelectorAll('[data-reveal], [data-stagger]');
  const markIn = (el) => el.classList.add('in');
  if (reduce || !('IntersectionObserver' in window)) {
    revealables.forEach(markIn);
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { markIn(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    revealables.forEach((el) => { if (el.hasAttribute('data-reveal-now')) setTimeout(() => markIn(el), 80); else io.observe(el); });
  }

  /* ---------- Count-ups ---------- */
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const counters = document.querySelectorAll('[data-count]');
  const runCount = (el) => {
    const end = parseFloat(el.dataset.count), prefix = el.dataset.prefix || '', suffix = el.dataset.suffix || '';
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const show = (v) => { el.textContent = prefix + (dec ? v.toFixed(dec) : fmt(v)) + suffix; };
    if (reduce) { show(end); return; }
    const dur = 1400, t0 = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - t0) / dur); show(end * (1 - Math.pow(1 - p, 4))); if (p < 1) raf(tick); };
    raf(tick);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => { entries.forEach((en) => { if (en.isIntersecting) { runCount(en.target); io.unobserve(en.target); } }); }, { threshold: 0.5 });
    counters.forEach((el) => io.observe(el));
  } else counters.forEach(runCount);

  /* ---------- Cursor glow on glass panels ---------- */
  if (fine) {
    document.querySelectorAll('.glass, .ui').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    });
  }

  /* ---------- Magnetic primary buttons ---------- */
  if (fine && !reduce) {
    document.querySelectorAll('.btn-magnet').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        b.style.transform = 'translate(' + (dx * 0.18).toFixed(1) + 'px,' + (dy * 0.22).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- Parallax (subtle) ---------- */
  const px = Array.from(document.querySelectorAll('[data-parallax]'));
  if (px.length && !reduce) {
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      px.forEach((el) => {
        const r = el.getBoundingClientRect();
        const f = parseFloat(el.dataset.parallax) || 0.1;
        const off = (r.top + r.height / 2 - vh / 2) * -f;
        el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; raf(update); } }, { passive: true });
    update();
  }

  /* ---------- 90-days progress line ---------- */
  const days = document.querySelector('.days');
  const prog = document.querySelector('.progress i');
  if (days && prog) {
    const upd = () => {
      const r = days.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      const p = Math.min(1, Math.max(0, (-r.top + window.innerHeight * 0.35) / Math.max(1, total)));
      prog.style.width = (p * 100).toFixed(1) + '%';
    };
    window.addEventListener('scroll', upd, { passive: true }); upd();
  }

  /* ---------- Live clock ---------- */
  document.querySelectorAll('[data-clock]').forEach((clock) => {
    const paint = () => {
      const d = new Date();
      clock.textContent = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };
    paint(); setInterval(paint, 30000);
  });

  /* ---------- Build-your-team calculator ---------- */
  const calc = document.querySelector('[data-calc]');
  if (calc) {
    const range = calc.querySelector('input[type="range"]'), out = calc.querySelector('output');
    const monthly = calc.querySelector('[data-monthly]'), onetime = calc.querySelector('[data-onetime]'), first = calc.querySelector('[data-first]'), capnote = calc.querySelector('[data-capnote]');
    const segs = calc.querySelectorAll('.seg button');
    const FIRST = 3500, ADD = 1500, CAP = 7000, FEE = 3500;
    const money = (n) => '$' + n.toLocaleString('en-US');
    const update = () => {
      const n = parseInt(range.value, 10), rawv = FIRST + ADD * (n - 1), m = Math.min(rawv, CAP);
      out.textContent = n + (n === 1 ? ' rep' : ' reps');
      monthly.textContent = money(m) + '/mo'; onetime.textContent = money(FEE * n); first.textContent = money(m * 12);
      if (rawv > CAP) capnote.innerHTML = '<span class="ok">Cap reached.</span> ' + n + ' reps would be ' + money(rawv) + '/mo without it — you pay ' + money(CAP) + '.';
      else if (rawv === CAP) capnote.innerHTML = '<span class="ok">At the cap.</span> Every rep after this one is free to manage.';
      else capnote.textContent = money(CAP - rawv) + ' of headroom before the ' + money(CAP) + ' cap.';
      segs.forEach((b) => b.setAttribute('aria-pressed', String(parseInt(b.dataset.reps, 10) === n)));
    };
    range.addEventListener('input', update);
    segs.forEach((b) => b.addEventListener('click', () => { range.value = b.dataset.reps; update(); }));
    update();
  }

  /* ---------- Year ---------- */
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Hero field: a grid of points that breathes; calls ripple through it; meetings light up ---------- */
  const canvas = document.querySelector('canvas.field');
  if (canvas) {
    const ctx = canvas.getContext('2d', { alpha: true });
    let W = 0, H = 0, dpr = 1, pts = [], cols = 0, rows = 0, gap = 26;
    let mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    let pulses = [], links = [], running = true, last = 0, t = 0;
    const rnd = (a, b) => a + Math.random() * (b - a);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gap = W < 700 ? 30 : 26;
      cols = Math.ceil(W / gap) + 2; rows = Math.ceil(H / gap) + 2;
      pts = [];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) pts.push({ x: i * gap - gap, y: j * gap - gap, f: 0 });
    };

    const noise = (x, y, tt) => (
      Math.sin(x * 0.011 + tt * 0.6) * Math.cos(y * 0.013 - tt * 0.45) * 0.6 +
      Math.sin((x + y) * 0.006 + tt * 0.25) * 0.4
    );

    const spawnPulse = () => {
      const p = pts[Math.floor(Math.random() * pts.length)];
      if (!p) return;
      pulses.push({ x: p.x, y: p.y, r: 0, max: rnd(90, 170), life: 0, dur: rnd(1.4, 2.2) });
    };
    const spawnLink = () => {
      const a = pts[Math.floor(Math.random() * pts.length)];
      if (!a) return;
      const ang = rnd(0, Math.PI * 2), d = rnd(140, 320);
      const bx = Math.min(W - 20, Math.max(20, a.x + Math.cos(ang) * d)), by = Math.min(H - 20, Math.max(20, a.y + Math.sin(ang) * d));
      links.push({ ax: a.x, ay: a.y, bx, by, life: 0, dur: 2.6 });
    };

    let pulseTimer = 0, linkTimer = 0;
    const frame = (now) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; t += dt;
      mouse.x += (mouse.tx - mouse.x) * 0.12; mouse.y += (mouse.ty - mouse.y) * 0.12;
      pulseTimer += dt; linkTimer += dt;
      if (pulseTimer > 0.55) { pulseTimer = 0; spawnPulse(); }
      if (linkTimer > 2.4) { linkTimer = 0; spawnLink(); }

      ctx.clearRect(0, 0, W, H);

      // points
      for (let k = 0; k < pts.length; k++) {
        const p = pts[k];
        const n = noise(p.x, p.y, t);
        let a = 0.10 + 0.22 * (n + 1) / 2;
        let s = 1.1 + 0.9 * (n + 1) / 2;
        let ox = 0, oy = 0;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, dd = dx * dx + dy * dy;
        if (dd < 180 * 180) {
          const d = Math.sqrt(dd) || 1, f = (1 - d / 180);
          ox = dx / d * f * 14; oy = dy / d * f * 14; a += f * 0.45; s += f * 1.2;
        }
        // pulse flash
        for (let q = 0; q < pulses.length; q++) {
          const pu = pulses[q];
          const pd = Math.hypot(p.x - pu.x, p.y - pu.y);
          if (Math.abs(pd - pu.r) < 14) { a += 0.5 * (1 - pu.life / pu.dur); s += 0.8; }
        }
        ctx.fillStyle = 'rgba(160,190,235,' + Math.min(1, a).toFixed(3) + ')';
        ctx.fillRect(p.x + ox - s / 2, p.y + oy - s / 2, s, s);
      }

      // pulses
      for (let q = pulses.length - 1; q >= 0; q--) {
        const pu = pulses[q]; pu.life += dt; const k = pu.life / pu.dur;
        pu.r = pu.max * (1 - Math.pow(1 - k, 3));
        ctx.beginPath(); ctx.arc(pu.x, pu.y, pu.r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(191,227,255,' + (0.35 * (1 - k)).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.stroke();
        if (k >= 1) pulses.splice(q, 1);
      }

      // links (a call becoming a meeting)
      for (let q = links.length - 1; q >= 0; q--) {
        const L = links[q]; L.life += dt; const k = L.life / L.dur;
        const draw = Math.min(1, k * 1.6), fade = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
        const ex = L.ax + (L.bx - L.ax) * draw, ey = L.ay + (L.by - L.ay) * draw;
        ctx.beginPath(); ctx.moveTo(L.ax, L.ay); ctx.lineTo(ex, ey);
        ctx.strokeStyle = 'rgba(191,227,255,' + (0.5 * fade).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.arc(L.ax, L.ay, 2.2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(191,227,255,' + (0.9 * fade).toFixed(3) + ')'; ctx.fill();
        if (draw >= 1) {
          const g = ctx.createRadialGradient(L.bx, L.by, 0, L.bx, L.by, 26);
          g.addColorStop(0, 'rgba(191,227,255,' + (0.55 * fade).toFixed(3) + ')'); g.addColorStop(1, 'rgba(191,227,255,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(L.bx, L.by, 26, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(L.bx, L.by, 3, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,' + (0.95 * fade).toFixed(3) + ')'; ctx.fill();
        }
        if (k >= 1) links.splice(q, 1);
      }
      raf(frame);
    };

    const start = () => { if (!running) { running = true; last = performance.now(); raf(frame); } };
    const stop = () => { running = false; };
    resize(); window.addEventListener('resize', resize);
    if (fine) {
      window.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top; }, { passive: true });
      window.addEventListener('pointerleave', () => { mouse.tx = -9999; mouse.ty = -9999; });
    }
    if (reduce) {
      // one still frame: the field, no motion
      t = 1.3; running = true; last = performance.now(); pulses = []; links = [];
      const once = () => { running = false; };
      raf((now) => { frame(now); once(); });
    } else {
      running = false; start();
      document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((en) => { en[0].isIntersecting ? start() : stop(); }, { threshold: 0.02 }).observe(canvas);
      }
    }
  }
})();
