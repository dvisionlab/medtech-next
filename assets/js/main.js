// Mobile nav
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}));

// Edition tabs (accessible, deep-linkable via #edizione-2026)
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab, updateHash = true) {
  tabs.forEach(t => {
    const selected = t === tab;
    t.setAttribute('aria-selected', String(selected));
    t.tabIndex = selected ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
  });
  if (updateHash) history.replaceState(null, '', '#edizione-' + tab.textContent.trim());
}
const tabByYear = y => tabs.find(t => t.textContent.trim() === String(y));
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', e => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    const next = tabs[(i + dir + tabs.length) % tabs.length];
    next.focus();
    selectTab(next);
  });
});
function openEditionFromHash() {
  const m = location.hash.match(/^#edizione-(\d{4})$/);
  const t = m && tabByYear(m[1]);
  if (t) {
    selectTab(t, false);
    document.getElementById('edizioni').scrollIntoView();
  }
}
document.querySelectorAll('[data-tab-link]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  const t = tabByYear(a.dataset.tabLink);
  if (t) selectTab(t);
  document.getElementById('edizioni').scrollIntoView({ behavior: 'smooth' });
}));
openEditionFromHash();

document.getElementById('year').textContent = new Date().getFullYear();

// Network background (nodi e connessioni, come la locandina)
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('canvas.network').forEach(canvas => {
  const ctx = canvas.getContext('2d');
  let w, h, nodes = [], running = false, raf;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(110, Math.max(30, (w * h) / 9000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
      r: Math.random() * 1.8 + .6,
    }));
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const maxD = Math.min(150, Math.max(90, w / 9));
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
        if (d < maxD) {
          ctx.strokeStyle = `rgba(150, 215, 255, ${(1 - d / maxD) * .35})`;
          ctx.lineWidth = .8;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (const n of nodes) {
      ctx.fillStyle = 'rgba(190, 235, 255, .85)';
      ctx.shadowColor = 'rgba(120, 220, 255, .9)'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function step() {
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < -10) n.x = w + 10; else if (n.x > w + 10) n.x = -10;
      if (n.y < -10) n.y = h + 10; else if (n.y > h + 10) n.y = -10;
    }
    draw();
    if (running) raf = requestAnimationFrame(step);
  }

  resize();
  window.addEventListener('resize', resize);
  // il canvas nel tab nascosto ha dimensione 0 finché non si apre: ricalcola quando cambia
  new ResizeObserver(() => resize()).observe(canvas);
  if (!reduceMotion) {
    new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (running) raf = requestAnimationFrame(step);
    }).observe(canvas);
  }
});
