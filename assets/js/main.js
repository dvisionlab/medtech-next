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

// Network background (nodi e connessioni, come la locandina) — reagisce a mouse e tocco
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pointer = { x: 0, y: 0, active: false };
if (!reduceMotion) {
  // I canvas hanno pointer-events: none, quindi si ascolta la finestra e si converte la posizione per ogni canvas
  const set = e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; };
  window.addEventListener('pointermove', set, { passive: true });
  window.addEventListener('pointerdown', set, { passive: true });
  window.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') pointer.active = false; }, { passive: true });
  window.addEventListener('pointercancel', () => { pointer.active = false; }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointer.active = false; });
}

document.querySelectorAll('canvas.network').forEach(canvas => {
  const ctx = canvas.getContext('2d');
  let w, h, nodes = [], running = false, raf;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const REACH = 210;   // raggio d'azione del cursore (px)

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(110, Math.max(30, (w * h) / 9000)));
    nodes = Array.from({ length: count }, () => {
      const vx = (Math.random() - .5) * .25, vy = (Math.random() - .5) * .25;
      return { x: Math.random() * w, y: Math.random() * h, vx, vy, bvx: vx, bvy: vy, r: Math.random() * 1.8 + .6, glow: 0 };
    });
    draw();
  }

  // posizione del cursore dentro il canvas (null se fuori o non attivo)
  function cursor() {
    if (!pointer.active || !w) return null;
    const r = canvas.getBoundingClientRect();
    const x = pointer.x - r.left, y = pointer.y - r.top;
    return x >= -REACH && x <= w + REACH && y >= -REACH && y <= h + REACH ? { x, y } : null;
  }

  function draw(c) {
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
    if (c) { // linee dal cursore ai puntini vicini
      for (const n of nodes) {
        const d = Math.hypot(n.x - c.x, n.y - c.y);
        if (d < REACH) {
          ctx.strokeStyle = `rgba(150, 245, 255, ${Math.min(1, (1 - d / REACH) * 1.3)})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(n.x, n.y); ctx.stroke();
        }
      }
    }
    for (const n of nodes) {
      const g = n.glow;
      ctx.fillStyle = g > .05 ? `rgba(${190 - g * 70}, ${235 + g * 20}, 255, ${.85 + g * .15})` : 'rgba(190, 235, 255, .85)';
      ctx.shadowColor = 'rgba(120, 220, 255, .9)'; ctx.shadowBlur = 8 + g * 10;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r + g * 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    if (c) { // il "nodo" del cursore
      ctx.fillStyle = 'rgba(220, 250, 255, .95)';
      ctx.shadowColor = 'rgba(120, 235, 255, 1)'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(c.x, c.y, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function step() {
    const c = cursor();
    for (const n of nodes) {
      // la velocità torna piano a quella originale dopo una spinta
      n.vx += (n.bvx - n.vx) * .04; n.vy += (n.bvy - n.vy) * .04;
      let target = 0;
      if (c) {
        const dx = n.x - c.x, dy = n.y - c.y, d = Math.hypot(dx, dy);
        if (d < REACH && d > .01) {
          const k = 1 - d / REACH;
          // attrazione dolce verso il cursore, ma i puntini troppo vicini vengono respinti: si forma una piccola costellazione
          const f = d > 70 ? -.16 * k : .45 * (1 - d / 70);
          n.vx += (dx / d) * f; n.vy += (dy / d) * f;
          target = k;
        }
      }
      n.glow += (target - n.glow) * .12;
      n.x += n.vx; n.y += n.vy;
      if (n.x < -10) n.x = w + 10; else if (n.x > w + 10) n.x = -10;
      if (n.y < -10) n.y = h + 10; else if (n.y > h + 10) n.y = -10;
    }
    draw(c);
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

// Gallery lightbox
const lb = document.querySelector('.lightbox');
const shots = [...document.querySelectorAll('.gallery a')];
if (lb && shots.length && typeof lb.showModal === 'function') {
  const img = lb.querySelector('img');
  const count = lb.querySelector('.lb-count');
  let cur = 0;
  const show = i => {
    cur = (i + shots.length) % shots.length;
    img.src = shots[cur].href;
    img.alt = shots[cur].querySelector('img').alt;
    count.textContent = `${cur + 1} / ${shots.length}`;
  };
  // Il tasto "indietro" del browser/telefono chiude la foto invece di lasciare la pagina
  const open = i => {
    show(i);
    lb.showModal();
    history.pushState({ lightbox: true }, '');
  };
  const close = () => { if (lb.open) history.back(); };
  window.addEventListener('popstate', () => { if (lb.open) lb.close(); });
  lb.addEventListener('cancel', e => { e.preventDefault(); close(); }); // Esc

  shots.forEach((a, i) => a.addEventListener('click', e => { e.preventDefault(); open(i); }));
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', () => show(cur - 1));
  lb.querySelector('.lb-next').addEventListener('click', () => show(cur + 1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  lb.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
  });
  let x0 = null;
  lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
    x0 = null;
  });
}

// Selettore lingua: ricorda la scelta (usata dallo script in <head>) e mantiene la sezione corrente
document.querySelectorAll('[data-set-lang]').forEach(a => a.addEventListener('click', () => {
  try { localStorage.setItem('mtn-lang', a.dataset.setLang); } catch (e) {}
  if (location.hash) a.setAttribute('href', a.getAttribute('href').split('#')[0] + location.hash);
}));
