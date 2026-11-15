(function () {
  let style = store.get('cstyle', 'obj');
  const BEAT = 700;
  const hand = (raised, right) => `<svg class="hand" viewBox="0 0 32 32" aria-label="${esc(APP.ui().aria[right ? 'rightHand' : 'leftHand'])}"><g${right ? ' transform="translate(32 0) scale(-1 1)"' : ''}>${ABC.art['hand-' + raised]}</g></svg>`;
  const item = n => APP.items().find(it => it.n === n);
  function render() {
    const list = APP.items();
    $('c-obj').classList.toggle('on', style === 'obj'); $('c-hand').classList.toggle('on', style === 'hand');
    $('crows').innerHTML = list.map(it => {
      const objs = style === 'obj' ? (it.pics || []).map(p => `<span>${p}</span>`).join('') : it.n <= 5 ? hand(it.n, false) : hand(5, false) + hand(it.n - 5, true);
      return `<div class="card crow" data-n="${it.n}"><div class="cnum"><div class="cdig" style="color:${it.color}">${esc(it.label)}</div><div class="cword">${esc(it.name)}</div></div>` +
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
