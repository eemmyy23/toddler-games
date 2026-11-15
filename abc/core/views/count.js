// ====== VIEW 'count' — 1–10 on one page as objects (rows of 5) or mirrored hands ======
(function () {
  let style = store.get('cstyle', 'obj'), timers = [];
  function stop() { timers.forEach(clearTimeout); timers = []; document.querySelectorAll('.crow.active').forEach(r => r.classList.remove('active')); }
  // hand seen from the back: LEFT thumb on the right, RIGHT hand mirrored; raise order index → … → thumb (5)
  const SKIN = '#f8d2ae', SHADE = '#e7b088', NAIL = '#fde7d6';
  const FING = { little: { x: 13, w: 13, top: 34 }, ring: { x: 28, w: 14, top: 18 }, middle: { x: 44, w: 14, top: 10 }, index: { x: 60, w: 14, top: 18 } };
  const ORDER = ['index', 'middle', 'ring', 'little', 'thumb'];
  function hand(raised, right) {
    const up = new Set(ORDER.slice(0, raised)); let g = '';
    for (const [name, f] of Object.entries(FING)) g += up.has(name)
      ? `<rect x="${f.x}" y="${f.top}" width="${f.w}" height="${80 - f.top}" rx="${f.w / 2}" fill="${SKIN}"/><ellipse cx="${f.x + f.w / 2}" cy="${f.top + 7}" rx="${f.w * 0.3}" ry="4.5" fill="${NAIL}"/>`
      : `<rect x="${f.x}" y="48" width="${f.w}" height="24" rx="${f.w / 2}" fill="${SHADE}"/>`;
    g += `<rect x="10" y="54" width="68" height="58" rx="22" fill="${SKIN}"/>`;
    g += up.has('thumb')
      ? `<rect x="68" y="50" width="16" height="44" rx="8" fill="${SKIN}" transform="rotate(32 76 92)"/><ellipse cx="76" cy="57" rx="4.5" ry="4" fill="${NAIL}" transform="rotate(32 76 92)"/>`
      : `<rect x="34" y="76" width="42" height="15" rx="7.5" fill="${SHADE}"/>`;
    return `<svg class="hand" viewBox="0 0 106 120" aria-label="${right ? 'right' : 'left'} hand"><g${right ? ' transform="translate(106 0) scale(-1 1)"' : ''}>${g}</g></svg>`;
  }
  function render() {
    $('c-obj').classList.toggle('on', style === 'obj'); $('c-hand').classList.toggle('on', style === 'hand');
    $('crows').innerHTML = APP.items().map(it => {
      const objs = style === 'obj' ? it.pics.map(p => `<span class="citem">${p}</span>`).join('') : it.n <= 5 ? hand(it.n, false) : hand(5, false) + hand(it.n - 5, true);
      return `<div class="crow" data-n="${it.n}"><div class="cnum"><div class="cdig" style="color:${it.color}">${esc(it.label)}</div><div class="cword">${esc(it.name)}</div></div>` +
             `<div class="citems${style === 'obj' ? ' obj' : ''}">${objs}</div></div>`;
    }).join('');
  }
  function light(n) {
    const row = document.querySelector(`.crow[data-n="${n}"]`); if (!row) return null;
    document.querySelectorAll('.crow.active').forEach(r => r.classList.remove('active'));
    void row.offsetWidth; row.classList.add('active'); row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return row;
  }
  function one(n) { // tap a row: just that number
    stop(); hush(); const row = light(n); if (!row) return;
    const r = row.querySelector('.cnum').getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + r.height / 2, 24, 6); sfx.pop(); sayNow(APP.items()[n - 1].name);
  }
  function all() { // ▶ 1→10: one number per row
    stop(); hush();
    APP.items().forEach((it, i) => timers.push(setTimeout(() => { light(it.n); sayNow(it.name); sfx.pop(); }, i * 1000)));
    timers.push(setTimeout(() => { sfx.fanfare(); confetti(W / 2, H / 2, 80, 12); }, APP.items().length * 1000));
  }
  $('crows').addEventListener('click', e => { const r = e.target.closest('.crow'); if (r) { ensureAudio(); one(+r.dataset.n); } });
  const btn = (id, fn) => $(id).addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); APP.firstTouch(); fn(); });
  btn('c-obj', () => { style = 'obj'; store.set('cstyle', style); stop(); sfx.pop(); render(); });
  btn('c-hand', () => { style = 'hand'; store.set('cstyle', style); stop(); sfx.pop(); render(); });
  btn('c-all', all);
  VIEW('count', {
    el: 'count', fullHeight: true,
    show() { render(); }, leave: stop,
    announce(name) { speak(`${name}!`, 120); },
    onKey(k, e) {
      if (/^[0-9]$/.test(k)) { ensureAudio(); one(k === '0' ? 10 : +k); return true; }
      if (k === ' ' || k === 'enter') { e.preventDefault(); ensureAudio(); all(); return true; }
      return false;
    },
    keepScroll: true
  });
})();
