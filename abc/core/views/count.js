(function () {
  let style = store.get('cstyle', 'obj');
  const BEAT = 700;
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
    return `<svg class="hand" viewBox="0 0 106 120" aria-label="${esc(APP.ui().aria[right ? 'rightHand' : 'leftHand'])}"><g${right ? ' transform="translate(106 0) scale(-1 1)"' : ''}>${g}</g></svg>`;
  }
  const item = n => APP.items().find(it => it.n === n);
  function render() {
    const list = APP.items();
    $('c-obj').classList.toggle('on', style === 'obj'); $('c-hand').classList.toggle('on', style === 'hand');
    $('crows').innerHTML = list.map(it => {
      const objs = style === 'obj' ? (it.pics || []).map(p => `<span>${p}</span>`).join('') : it.n <= 5 ? hand(it.n, false) : hand(5, false) + hand(it.n - 5, true);
      return `<div class="crow" data-n="${it.n}"><div class="cnum"><div class="cdig" style="color:${it.color}">${esc(it.label)}</div><div class="cword">${esc(it.name)}</div></div>` +
             `<div class="citems${style === 'obj' ? ' objs start' : ''}">${objs}</div></div>`;
    }).join('');
  }
  const row = n => document.querySelector(`.crow[data-n="${n}"]`);
  function one(n) { const it = item(n), r = it && row(n); if (!r) return; APP.celebrate(r.querySelector('.cnum')); APP.sequence('crows', [{ light: r, say: it.name }]); }
  function all() { $('count').scrollTo({ top: 0 }); APP.sequence('crows', APP.items().map(it => ({ light: row(it.n), say: it.name, pop: true, pause: BEAT })), { button: true, finale: true }); }
  onTapIn('crows', '.crow', r => one(+r.dataset.n));
  onTap('c-obj', () => { style = 'obj'; store.set('cstyle', style); APP.stop(); sfx.pop(); render(); });
  onTap('c-hand', () => { style = 'hand'; store.set('cstyle', style); APP.stop(); sfx.pop(); render(); });
  VIEW('count', {
    el: 'count', fullHeight: true,
    show() { render(); }, play: all,
    select(it) { one(it.n); },
    keepScroll: true
  });
})();
