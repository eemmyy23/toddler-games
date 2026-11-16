(function () {
  const cur = () => APP.items()[APP.idx];
  const part = i => document.querySelector(`#glyph .part[data-part="${i}"]`);
  function tapBig(e) {
    if (APP.screen() !== 'card') return;
    const it = cur(), p = e.target.closest && e.target.closest('.part');
    if (p && it.parts) { APP.celebrate(p); APP.sequence('glyph', [{ light: p, say: it.parts[+p.dataset.part].say }]); }
    else if (it.parts) APP.sequence('glyph', [{ say: it.name }, ...it.parts.map((x, i) => ({ light: part(i), say: x.say, pop: true }))], { finale: true });
    else { APP.celebrate(e.target); VIEW_CARD.show(true); }
  }
  onTap('glyph', tapBig);
  onTap('word', e => { if (APP.screen() === 'card' && cur().parts) tapBig(e); });
  onTapIn('examples', '.ex', b => APP.sequence('examples', [{ light: b, say: cur().examples[+b.dataset.i][0], pop: true }]));
  const VIEW_CARD = {
    el: 'learn', arrows: true, swipe: true,
    show(sayIt) {
      APP.stop();
      const it = cur(), g = $('glyph'), L = APP.L(), low = s => L.keepCase ? s : s.toLocaleLowerCase(L.bcp47);
      g.className = it.bigClass || ''; g.innerHTML = it.big; g.style.color = it.color || '';
      void g.offsetWidth; g.classList.add('pop');
      const ex = it.examples || [];
      $('pics').hidden = !(it.pics || []).length; $('word').hidden = !it.word;
      $('word').textContent = it.word || '';
      $('also').innerHTML = APP.synonyms(it); $('also').hidden = !$('also').innerHTML; if (!$('also').hidden) APP.fitText($('also'));
      $('pics').innerHTML = (it.pics || []).map((pc, i) => `<span style="animation-delay:${(i * 0.12).toFixed(2)}s">${pc}</span>`).join('');
      $('examples').innerHTML = ex.map(([w, pic], i) => `<button class="card ex" data-i="${i}"><span class="ep">${pic}</span><span class="ew">${it.color
        ? I18N.highlight(low(w), it.unit ? it.unit.lower : it.label, low, s => `<b style="color:${it.color}">${s}</b>`) : esc(low(w))}</span></button>`).join('');
      $('links').innerHTML = APP.links(it); $('links').hidden = !$('links').innerHTML;
      APP.backdrop(it.backdrop);
      APP.fitText(g);
      APP.fit($('learn'));
      APP.shown();
      if (sayIt) speak(it.say, PAUSE.line);
    },
    step(d) { APP.step(d); sfx.pop(); this.show(true); },
    line: () => cur().say,
    resize() { APP.fitText($('glyph')); APP.fit($('learn')); },
    select(it) { APP.idx = APP.indexOf(it.id); this.show(true); APP.celebrate(null); },
    indexFace: it => `${it.nav}<small>${it.word ? esc(it.word) : it.examples && it.examples[0] ? it.examples[0][1] : esc(it.name)}</small>`
  };
  VIEW('card', VIEW_CARD);
})();
