// ====== VIEW 'card' — one item big (letter, digit, colour, group…), examples / pictures, ‹ › arrows ======
// Uses item fields only: big, bigClass, color, nav, word, pics, examples, concept, parts, say, label, name.
(function () {
  let partTimers = [];
  const partsStop = () => { partTimers.forEach(clearTimeout); partTimers = []; };
  function partLight(i) {
    $('glyph').classList.toggle('on', i >= 0);
    document.querySelectorAll('#glyph .part').forEach(p => p.classList.toggle('lit', +p.dataset.part === i));
  }
  // first occurrence of the letter/group in the word, in its colour
  function hl(word, piece, color) {
    const t = APP.L().bcp47, i = word.toLocaleLowerCase(t).indexOf(piece.toLocaleLowerCase(t));
    if (i < 0) return esc(word);
    return esc(word.slice(0, i)) + `<b style="color:${color}">${esc(word.slice(i, i + piece.length))}</b>` + esc(word.slice(i + piece.length));
  }
  const cur = () => APP.items()[APP.idx];
  function tapBig(e) {
    if (APP.screen() !== 'card') return;
    e.stopPropagation(); APP.firstTouch(); partsStop();
    const it = cur(), part = e.target.closest && e.target.closest('.part');
    if (part && it.parts) { // one part: say its name
      const i = +part.dataset.part; partLight(i); sfx.pop(); speak(it.parts[i].say, 40);
      confetti(e.clientX || W / 2, e.clientY || H / 3, 14, 5); partTimers.push(setTimeout(() => partLight(-1), 1200));
    } else if (it.parts) { // elsewhere: name, then every part in order
      hush(); sayNow(it.name);
      it.parts.forEach((p, i) => partTimers.push(setTimeout(() => { partLight(i); sayNow(p.say); sfx.pop(); }, 900 + i * 850)));
      partTimers.push(setTimeout(() => { partLight(-1); confetti(W / 2, H / 3, 60, 10); }, 900 + it.parts.length * 850 + 300));
    } else { VIEW_CARD.show(true); sfx.pop(); confetti(e.clientX || W / 2, e.clientY || H / 3, 18, 6); }
  }
  $('glyph').addEventListener('pointerdown', tapBig);
  $('word').addEventListener('pointerdown', e => { if (APP.screen() === 'card' && cur().parts) tapBig(e); });
  $('examples').addEventListener('pointerdown', e => {
    const b = e.target.closest('.ex'); if (!b) return;
    e.stopPropagation(); APP.firstTouch();
    const ex = cur().examples[+b.dataset.i];
    document.querySelectorAll('.ex.lit').forEach(x => x.classList.remove('lit'));
    b.classList.add('lit'); setTimeout(() => b.classList.remove('lit'), 900);
    sfx.pop(); speak(ex[0], 80);
  });

  const VIEW_CARD = {
    el: 'learn', arrows: true, swipe: true,
    show(sayIt) {
      partsStop();
      const list = APP.items(), it = list[APP.idx], n = list.length, g = $('glyph'), L = APP.L();
      g.className = it.bigClass || ''; g.innerHTML = it.big; g.style.color = it.color || '';
      void g.offsetWidth; g.classList.add('pop');
      const pv = list[(APP.idx - 1 + n) % n], nx = list[(APP.idx + 1) % n];
      $('prev').innerHTML = `‹ ${pv.nav}`; $('next').innerHTML = `${nx.nav} ›`;
      const ex = it.examples || [];
      $('pics').style.display = $('word').style.display = ex.length ? 'none' : '';
      $('word').textContent = it.word || '';
      $('pics').innerHTML = (it.pics || []).map((pc, i) => `<span style="animation-delay:${(i * 0.12).toFixed(2)}s">${pc}</span>`).join('');
      $('examples').innerHTML = ex.map(([w, pic], i) => {
        const shown = L.keepCase ? w : w.toLocaleLowerCase(L.bcp47);
        return `<button class="ex" data-i="${i}"><span class="ep">${pic}</span><span class="ew">${hl(shown, it.unit ? it.unit.lower : it.label, it.color)}</span></button>`;
      }).join('');
      $('linfo').innerHTML = APP.infoButton(it.concept);
      APP.saveIdx();
      if (sayIt) speak(it.say, 120);
    },
    step(d) { const n = APP.items().length; APP.idx = (APP.idx + d + n) % n; sfx.pop(); this.show(true); },
    announce(name) { speak(`${name}. ${cur().say}`, 120); },
    leave() { partsStop(); },
    onKey(k) { // a typed letter/digit of this list shows it
      const i = APP.items().findIndex(it => it.key === k); if (i < 0) return false;
      APP.idx = i; sfx.pop(); this.show(true); confetti(W / 2, H / 2, 24, 7); return true;
    },
    indexFace: it => it.examples ? `<span style="color:${it.color}">${esc(it.label)}</span>${it.examples[0] ? `<small>${it.examples[0][1]}</small>` : ''}`
      : `${it.nav || esc(it.label)}<small>${esc(it.name)}</small>`
  };
  VIEW('card', VIEW_CARD);
})();
