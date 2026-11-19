(function () {
  const big = i => document.querySelector(`#glyph .part[data-part="${i}"]`);
  const cell = i => document.querySelector(`#parts .pt[data-part="${i}"]`);
  const both = i => [cell(i), big(i)];
  let at = -1, said = '';
  const calmHint = () => { $('parts').classList.remove('hint'); const tip = $('parts').querySelector('.tip'); if (tip) tip.remove(); };
  function part(i) {
    const it = APP.item(); if (!it.parts || !it.parts[i]) return;
    at = i; calmHint();
    APP.sequence('learn', [{ light: both(i), say: it.parts[i].say, pop: true, pause: PAUSE.hold }]);
  }
  function playAll() { calmHint(); at = -1; return APP.sequence('learn', [{ say: APP.item().name }, ...APP.item().parts.map((x, i) => ({ light: both(i), say: x.say, pop: true }))], { button: true, finale: true, at: $('glyph') }); }
  function tapBig(e) {
    if (APP.screen() !== 'card') return;
    const it = APP.item(), p = e.target.closest && e.target.closest('.part');
    if (p && it.parts) { APP.celebrate(p); part(+p.dataset.part); }
    else if (it.parts) { part((at + 1) % it.parts.length); APP.celebrate(big(at)); }
    else { APP.celebrate(e.target); VIEW_CARD.show(true); }
  }
  onTap('glyph', tapBig);
  onTap('word', e => { if (APP.screen() === 'card' && APP.item().parts) tapBig(e); });
  onScrub('parts', '.pt', b => part(+b.dataset.part));
  onTapIn('examples', '.ex', b => APP.sequence('examples', [{ light: b, say: APP.item().examples[+b.dataset.i][0], pop: true }]));
  const VIEW_CARD = {
    el: 'learn', arrows: true, swipe: true,
    show(sayIt) {
      APP.stop();
      const it = APP.item(), g = $('glyph'), L = APP.L(), low = s => L.keepCase ? s : s.toLocaleLowerCase(L.bcp47);
      g.className = it.bigClass || ''; g.innerHTML = it.big; g.style.setProperty('--c', it.color || ''); g.classList.toggle('ink', !!it.color);
      void g.offsetWidth; g.classList.add('pop');
      const ex = it.examples || [];
      const P = it.parts || [], strip = P.length > 0 && P.every(x => x.color); at = -1;
      $('parts').hidden = !strip; $('parts').classList.remove('hint');
      $('parts').innerHTML = strip ? P.map((x, i) => `<button class="card pt" data-part="${i}" aria-label="${esc(x.say)}" style="--i:${i};--c:${x.color}"></button>`).join('')
        + `<span class="tip">${APP.icon('drag')}</span>` : '';
      if (strip) { void $('parts').offsetWidth; $('parts').classList.add('hint'); }
      const tl = APP.tallyOf(it), pics = tl.pics; said = tl.line ? `${it.say} ${tl.line}` : it.say; $('pics').hidden = !pics.length; $('word').hidden = !it.word;
      $('word').textContent = it.word || '';
      $('also').innerHTML = APP.synonyms(it); $('also').hidden = !$('also').innerHTML; if (!$('also').hidden) APP.fitText($('also'));
      $('pics').innerHTML = pics.map((pc, i) => `<span style="--i:${i}">${pc}</span>`).join('');
      $('examples').innerHTML = ex.map(([w, pic], i) => `<button class="card ex" data-i="${i}"><span class="ep">${pic}</span><span class="ew">${it.color
        ? I18N.highlight(low(w), it.unit ? it.unit.lower : it.label, low, s => `<b class="ink" style="--c:${it.color}">${s}</b>`) : esc(low(w))}</span></button>`).join('');
      APP.links(it, $('links'));
      APP.backdrop(it.backdrop);
      APP.fitText(g);
      APP.fit($('learn'), 'tight');
      APP.shown();
      if (sayIt) speak(said, PAUSE.line);
    },
    step(d) { APP.step(d); sfx.pop(); this.show(true); },
    line: () => said,
    play: () => playAll(),
    playable: it => !!(it && it.parts),
    resize() { APP.fitText($('glyph')); if (!$('also').hidden) APP.fitText($('also')); APP.fit($('learn'), 'tight'); },
    select(it) { APP.idx = APP.indexOf(it.id); this.show(true); APP.celebrate(null); },
    indexFace: it => `${it.word && it.word === it.label ? it.big : it.nav}<small>${it.word ? esc(it.word) : it.examples && it.examples[0] ? it.examples[0][1] : esc(it.name)}</small>`
  };
  VIEW('card', VIEW_CARD);
})();
