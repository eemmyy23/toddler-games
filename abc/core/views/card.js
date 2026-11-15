(function () {
  let partTimers = [];
  const partsStop = () => { partTimers.forEach(clearTimeout); partTimers = []; };
  function partLight(i) {
    $('glyph').classList.toggle('on', i >= 0);
    document.querySelectorAll('#glyph .part').forEach(p => p.classList.toggle('on', +p.dataset.part === i));
  }
  function hl(word, piece, color) {
    const t = APP.L().bcp47, i = word.toLocaleLowerCase(t).indexOf(piece.toLocaleLowerCase(t));
    if (i < 0 || !color) return esc(word);
    return esc(word.slice(0, i)) + `<b style="color:${color}">${esc(word.slice(i, i + piece.length))}</b>` + esc(word.slice(i + piece.length));
  }
  const cur = () => APP.items()[APP.idx];
  function tapBig(e) {
    if (APP.screen() !== 'card') return;
    e.stopPropagation(); APP.firstTouch(); partsStop();
    const it = cur(), part = e.target.closest && e.target.closest('.part');
    if (part && it.parts) {
      const i = +part.dataset.part; partLight(i); sfx.pop(); speak(it.parts[i].say, 40);
      confetti(e.clientX || W / 2, e.clientY || H / 3, 14, 5); partTimers.push(setTimeout(() => partLight(-1), 1200));
    } else if (it.parts) {
      hush(); sayNow(it.name);
      it.parts.forEach((p, i) => partTimers.push(setTimeout(() => { partLight(i); sayNow(p.say); sfx.pop(); }, 900 + i * 850)));
      partTimers.push(setTimeout(() => { partLight(-1); confetti(W / 2, H / 3, 60, 10); }, 900 + it.parts.length * 850 + 300));
    } else { VIEW_CARD.show(true); sfx.pop(); confetti(e.clientX || W / 2, e.clientY || H / 3, 18, 6); }
  }
  onTap('glyph', tapBig);
  onTap('word', e => { if (APP.screen() === 'card' && cur().parts) tapBig(e); });
  onTapIn('examples', '.ex', b => {
    APP.firstTouch();
    const ex = cur().examples[+b.dataset.i];
    document.querySelectorAll('.ex.on').forEach(x => x.classList.remove('on'));
    b.classList.add('on'); setTimeout(() => b.classList.remove('on'), 900);
    sfx.pop(); speak(ex[0], 80);
  });

  const VIEW_CARD = {
    el: 'learn', arrows: true, swipe: true,
    show(sayIt) {
      partsStop();
      const it = APP.items()[APP.idx], g = $('glyph'), L = APP.L();
      g.className = it.bigClass || ''; g.innerHTML = it.big ?? esc(it.label); g.style.color = it.color || '';
      void g.offsetWidth; g.classList.add('pop');
      const ex = it.examples || [];
      $('pics').hidden = !!ex.length; $('word').hidden = !it.word;
      $('word').textContent = it.word || '';
      $('pics').innerHTML = (it.pics || []).map((pc, i) => `<span style="animation-delay:${(i * 0.12).toFixed(2)}s">${pc}</span>`).join('');
      $('examples').innerHTML = ex.map(([w, pic], i) => {
        const shown = L.keepCase ? w : w.toLocaleLowerCase(L.bcp47);
        return `<button class="ex" data-i="${i}"><span class="ep">${pic}</span><span class="ew">${hl(shown, it.unit ? it.unit.lower : it.label, it.color)}</span></button>`;
      }).join('');
      $('links').innerHTML = APP.links(it);
      APP.fitText(g);
      APP.fit($('learn'));
      APP.shown();
      if (sayIt) speak(it.say, 120);
    },
    step(d) { APP.step(d); sfx.pop(); this.show(true); },
    announce(name) { speak(APP.t(APP.ui().then, { a: name, b: cur().say }), 120); },
    leave() { partsStop(); }, pause() { partsStop(); },
    resize() { APP.fitText($('glyph')); APP.fit($('learn')); },
    onKey(k) {
      const i = APP.items().findIndex(it => it.key === k); if (i < 0) return false;
      APP.idx = i; sfx.pop(); this.show(true); confetti(W / 2, H / 2, 24, 7); return true;
    },
    indexFace: it => `${it.nav ?? esc(it.label)}<small>${it.word ? esc(it.word) : it.examples && it.examples[0] ? it.examples[0][1] : esc(it.name)}</small>`
  };
  VIEW('card', VIEW_CARD);
})();
