/* Icebreaker redesign preview — small, dependency-free behaviours */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Mobile nav */
  const burger = document.querySelector('.burger');
  const mnav = document.querySelector('.mnav');
  if (burger && mnav) {
    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      mnav.hidden = open;
      burger.querySelector('.ic-open').hidden = !open;
      burger.querySelector('.ic-close').hidden = open;
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !mnav.hidden) { burger.click(); burger.focus(); }
    });
    mnav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { if (!mnav.hidden) burger.click(); }));
  }

  /* Count-up numbers: <span data-count="41203" data-prefix="$" data-suffix="+">0</span> */
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const counters = document.querySelectorAll('[data-count]');
  const run = (el) => {
    const end = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const show = (v) => { el.textContent = prefix + (dec ? v.toFixed(dec) : fmt(v)) + suffix; };
    if (reduce) { show(end); return; }
    const dur = 1100, t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      show(end * e);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.4 });
    counters.forEach((el) => io.observe(el));
  } else {
    counters.forEach(run);
  }

  /* Reveal on scroll (transform only; readable before it fires) */
  const rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io2.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    rv.forEach((el) => io2.observe(el));
  } else {
    rv.forEach((el) => el.classList.add('in'));
  }

  /* Live clock in the tracker card */
  const clock = document.querySelector('[data-clock]');
  if (clock) {
    const paint = () => {
      const d = new Date();
      clock.textContent = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' +
        d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };
    paint(); setInterval(paint, 30000);
  }

  /* Build-your-team calculator */
  const calc = document.querySelector('[data-calc]');
  if (calc) {
    const range = calc.querySelector('input[type="range"]');
    const out = calc.querySelector('output');
    const monthly = calc.querySelector('[data-monthly]');
    const onetime = calc.querySelector('[data-onetime]');
    const first = calc.querySelector('[data-first]');
    const capnote = calc.querySelector('[data-capnote]');
    const segs = calc.querySelectorAll('.seg button');
    const FIRST = 3500, ADD = 1500, CAP = 7000, FEE = 3500;
    const money = (n) => '$' + n.toLocaleString('en-US');
    const update = () => {
      const n = parseInt(range.value, 10);
      const raw = FIRST + ADD * (n - 1);
      const m = Math.min(raw, CAP);
      out.textContent = n + (n === 1 ? ' rep' : ' reps');
      monthly.textContent = money(m) + '/mo';
      onetime.textContent = money(FEE * n);
      first.textContent = money(m * 12);
      if (raw > CAP) {
        capnote.innerHTML = '<span class="ok">Cap reached.</span> ' + n + ' reps would be ' + money(raw) + '/mo without it — you pay ' + money(CAP) + '.';
      } else if (raw === CAP) {
        capnote.innerHTML = '<span class="ok">At the cap.</span> Every rep after this one is free to manage.';
      } else {
        capnote.textContent = money(CAP - raw) + ' of headroom before the ' + money(CAP) + ' cap.';
      }
      segs.forEach((b) => b.setAttribute('aria-pressed', String(parseInt(b.dataset.reps, 10) === n)));
    };
    range.addEventListener('input', update);
    segs.forEach((b) => b.addEventListener('click', () => { range.value = b.dataset.reps; update(); }));
    update();
  }

  /* Year */
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
