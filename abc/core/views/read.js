// ====== VIEW 'read' — a word: CAPITALS · small letters · syllables · whole word · singular/plural table ======
(function () {
  let tok = 0;
  const cur = () => APP.items()[APP.idx];
  const lit = el => { document.querySelectorAll('#read .lit').forEach(x => x.classList.remove('lit')); if (el) el.classList.add('lit'); };
  function letterSay(u) { const L = APP.L(); return L.spell ? L.spell(u.upper) : u.upper; }
  function render(sayIt) {
    const L = APP.L(), loc = L.bcp47, S = APP.S(), e = cur(), syl = e.syl, word = e.w, forms = e.forms, pic = e.pic, U = APP.ui();
    const colorOf = u => { const it = u && S.letters.find(x => x.unit === u); return it ? it.color : 'var(--text)'; };
    const parts = I18N.splitUnits(word, S.units, loc).filter(p => /[\p{L}\p{M}]/u.test(p.text));
    const tile = (txt, say, cls = '', color = '') => `<button class="rt ${cls}" data-say="${esc(say)}"${color ? ` style="color:${color}"` : ''}>${esc(txt)}</button>`;
    // long words shrink the tiles so the whole word always fits on one line
    const avail = Math.min(innerWidth, 640) - 24, nl = parts.length, gap = nl > 8 ? 3 : 6;
    const tw = Math.min(54, Math.floor((avail - (nl - 1) * gap) / nl));
    const lstyle = `--tw:${tw}px;--tf:${Math.min(32, Math.round(tw * 0.62))}px;gap:${gap}px`;
    const say = p => p.unit ? letterSay(p.unit) : I18N.upper(p.text, null, loc);
    const upper = parts.map(p => tile(I18N.upper(p.text, p.unit, loc), say(p), 'u', colorOf(p.unit))).join('');
    const lower = parts.map((p, i) => tile(i === 0 ? I18N.upper(p.text, p.unit, loc) : p.text, say(p), 'l', colorOf(p.unit))).join('');
    const shown = parts.length ? I18N.upper(parts[0].text, parts[0].unit, loc) + word.slice(parts[0].text.length) : word;
    const cells = forms ? [...(forms.sg || []), ...(forms.pl || [])] : [];
    const longest = Math.max(8, ...cells.map(x => x.length));
    const chipW = (Math.min(innerWidth, 520) - 24 - 8) / 2, em = longest * 0.66;
    const side = Math.floor((chipW - 2 * 26 - 30) / em), tall = side < 15;
    const cf = Math.max(11, Math.min(20, tall ? Math.floor((chipW - 22) / em) : side));
    const ns = syl.length, sylFont = Math.min(32, Math.floor((avail - ns * 20 - (ns - 1) * 22) / Math.max(1, word.length) * 1.55));
    const capFirst = s => { const g = I18N.graphemes(s, loc); return g.length ? I18N.upper(g[0], null, loc) + s.slice(g[0].length) : s; };
    const syls = syl.map((sy, i) => (i ? '<span class="rsep">·</span>' : '') + tile(i === 0 ? capFirst(sy) : sy, sy, 's', INK[(i * 3 + 4) % 8])).join('');
    $('read').innerHTML =
      `<div id="rpic" data-say="${esc(word)}">${pic}</div>` +
      `<div class="rrow let" id="rU" style="${lstyle}">${upper}</div>` +
      `<div class="rrow let" id="rL" style="${lstyle}">${lower}</div>` +
      (syl.length > 1 ? `<div class="rrow syl" id="rS" style="--sf:${sylFont}px">${syls}</div>` : '') +   // one syllable: no row
      `<div class="rrow" id="rW">${tile(shown, word, 'word')}${APP.infoButton(e.concept)}</div>` +
      (forms ? `<div id="rC" class="${tall ? 'tall' : ''}" style="--cf:${cf}px"><div class="rh">${esc(U.sgpl[0])}</div><div class="rh">${esc(U.sgpl[1])}</div>` +
        [0, 1].map(r => [['sg', 1], ['pl', 2]].map(([k, n], c) => forms[k]
          ? `<button class="rc" data-say="${esc(forms[k][r])}"><span class="rce">${pic.repeat(n)}</span><span>${esc(forms[k][r])}</span></button>`
          : `<div class="rc none">${r === 0 ? '— ' + esc(U.none[c]) : ''}</div>`).join('')).join('') + `</div>` : '');
    fit();
    const R = APP.items(), n = R.length;
    $('rprev').innerHTML = `‹ <b>${R[(APP.idx - 1 + n) % n].pic}</b>`; $('rnext').innerHTML = `<b>${R[(APP.idx + 1) % n].pic}</b> ›`;
    APP.saveIdx();
    if (sayIt) speak(word, 150);
  }
  // small screens (e.g. 320×568): if the rows run under the ‹ ▶ › bar, switch to the compact layout
  function fit() {
    const el = $('read'); el.classList.remove('tight');
    const over = () => { const first = el.firstElementChild, last = el.lastElementChild, nav = $('rnav'), bar = $('bar');
      return !!last && nav.style.display !== 'none' && (last.getBoundingClientRect().bottom > nav.getBoundingClientRect().top - 4 || first.getBoundingClientRect().top < bar.getBoundingClientRect().bottom); };
    if (over()) el.classList.add('tight');
  }
  $('read').addEventListener('pointerdown', e => {
    const el = e.target.closest('[data-say]'); if (!el) return;
    e.stopPropagation(); APP.firstTouch(); tok++;
    lit(el.classList.contains('rt') || el.classList.contains('rc') ? el : null);
    sfx.pop(); speak(el.dataset.say, 60);
  });
  // ▶: CAPITALS letter by letter → small letters as a word → syllables → whole word → singular/plural
  async function play() {
    const t = ++tok, alive = () => t === tok && APP.screen() === 'read', word = cur().w;
    for (const el of document.querySelectorAll('#rU .rt')) { if (!alive()) return; lit(el); await speak(el.dataset.say); await wait(150); }
    if (!alive()) return; await wait(300);
    lit(null); document.querySelectorAll('#rL .rt').forEach(x => x.classList.add('lit'));
    if ($('rS')) await speak(word); else await wait(700);
    if (!alive()) return; await wait(300);
    for (const el of document.querySelectorAll('#rS .rt')) { if (!alive()) return; lit(el); await speak(el.dataset.say); await wait(200); }
    if (!alive()) return; await wait(300);
    const w = document.querySelector('#rW .rt'); lit(w); sfx.right(); await speak(word, 350);
    if (!alive()) return; await wait(300);
    for (const el of document.querySelectorAll('#rC .rc[data-say]')) { if (!alive()) return; lit(el); await speak(el.dataset.say); await wait(250); }
    if (!alive()) return;
    const r = w.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top, 40, 8);
    setTimeout(() => { if (alive()) lit(null); }, 800);
  }
  VIEW('read', {
    el: 'read', nav: 'rnav', swipe: true,
    show(sayIt) { render(sayIt); },
    step(d) { const n = APP.items().length; APP.idx = (APP.idx + d + n) % n; tok++; sfx.pop(); render(true); },
    play, leave() { tok++; }, resize() { render(false); },
    announce(name) { speak(`${name}. ${cur().w}`, 120); },
    onKey(k, e) { if (k === ' ' || k === 'enter') { e.preventDefault(); ensureAudio(); play(); return true; } return false; },
    indexFace: it => `${it.pic}<small>${esc(it.w)}</small>`,
    indexSort: true
  });
})();
