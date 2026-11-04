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
const m = location.hash.match(/^#edizione-(\d{4})$/);
if (m) {
  const t = tabs.find(t => t.textContent.trim() === m[1]);
  if (t) {
    selectTab(t, false);
    document.getElementById('edizioni').scrollIntoView();
  }
}

document.getElementById('year').textContent = new Date().getFullYear();
