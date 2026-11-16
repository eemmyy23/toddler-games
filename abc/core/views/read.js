(function () {
  const cur = () => APP.items()[APP.idx];
  function render(sayIt) {
    const L = APP.L(), loc = L.bcp47, A = APP.alphabet(), e = cur(), syl = e.syl, word = e.w, forms = e.forms, pic = e.pic, U = APP.ui();
    const colorOf = u => (u && A.color(u.id)) || 'var(--text)';
    const parts = I18N.splitUnits(word, A.units, loc).filter(p => /[\p{L}\p{M}\s]/u.test(p.text)).filter((p, i, a) => !/\s/.test(p.text) || (i && !/\s/.test(a[i - 1].text)));
    const gap = '<span class="rgap"></span>';
    const tile = (txt, say, cls = '', color = '') => `<button class="card rt ${cls}" data-say="${esc(say)}"${color ? ` style="color:${color}"` : ''}>${esc(txt)}</button>`;
    const say = p => p.unit ? A.name(p.unit) : I18N.upper(p.text, null, loc);
    const upper = parts.map(p => /\s/.test(p.text) ? gap : tile(I18N.upper(p.text, p.unit, loc), say(p), 'u', colorOf(p.unit))).join('');
    const lower = parts.map((p, i) => /\s/.test(p.text) ? gap : tile(i === 0 ? I18N.upper(p.text, p.unit, loc) : p.text, say(p), 'l', colorOf(p.unit))).join('');
    const shown = parts.length ? I18N.upper(parts[0].text, parts[0].unit, loc) + word.slice(parts[0].text.length) : word;
    const syls = syl.map((sy, i) => (i ? `<span class="rsep">${esc(ABC.config.icons.sep)}</span>` : '') + tile(i === 0 ? I18N.capFirst(sy, loc) : sy, sy, 's', CONTENT.palette(i * 3 + 4))).join('');
    $('read').innerHTML =
      `<div class="rcol"><div id="rpic" data-say="${esc(word)}">${pic}</div>` +
      `<div class="rrow let" id="rU">${upper}</div>` +
      `<div class="rrow let" id="rL">${lower}</div>` +
      (syl.length > 1 ? `<div class="rrow syl" id="rS">${syls}</div>` : '') +
      `<div class="rrow" id="rW">${tile(shown, word, 'word')}</div>` + (e.alts && e.alts.length ? `<div class="also" id="rA">${APP.synonyms(e)}</div>` : '') + `</div><div class="rcol">` +
      (forms ? `<div id="rC"><div class="label caps rh">${esc(U.sgpl[0])}</div><div class="label caps rh">${esc(U.sgpl[1])}</div>` +
        [0, 1].map(r => [['sg', 1], ['pl', 2]].map(([k, n], c) => forms[k]
          ? `<button class="card rc" data-say="${esc(forms[k][r])}"><span class="rce">${pic.repeat(n)}</span><span>${esc(forms[k][r])}</span></button>`
          : `<div class="rc none">${r === 0 ? esc(APP.t(U.noneLine, { none: U.none[c] })) : ''}</div>`).join('')).join('') + `</div>` : '') +
      `<div class="links" id="rlinks"></div></div>`;
    APP.links(e, $('rlinks'));
    ['rU', 'rL', 'rS', 'rW', 'rC', 'rA'].forEach(id => $(id) && APP.fitText($(id), '.rt, .rc'));
    fit();
    APP.shown();
    if (sayIt) speak(word, PAUSE.line);
  }
  const fit = () => APP.fit($('read'), 'tight');
  onTapIn('read', '[data-say]', el => APP.sequence('read', [{ light: el.classList.contains('rt') || el.classList.contains('rc') ? el : null, say: el.dataset.say, pop: true }]));
  function play() {
    const all = s => [...document.querySelectorAll(s)], w = document.querySelector('#rW .rt'), word = cur().w;
    APP.sequence('read', [
      ...all('#rU .rt').map(el => ({ light: el, say: el.dataset.say })),
      { light: all('#rL .rt'), say: $('rS') ? word : null },
      ...all('#rS .rt').map(el => ({ light: el, say: el.dataset.say })),
      { light: w, say: word, pop: true },
      ...all('#rA .syn').map(el => ({ light: el, say: el.dataset.say })),
      ...all('#rC .rc[data-say]').map(el => ({ light: el, say: el.dataset.say }))
    ], { button: true, finale: true, at: w });
  }
  const VIEW_READ = {
    el: 'read', arrows: true, swipe: true, navFace: x => `<b>${x.pic}</b>`,
    show(sayIt) { render(sayIt); },
    step(d) { APP.step(d); APP.stop(); sfx.pop(); render(true); },
    play, resize() { render(false); },
    line: () => cur().w,
    indexFace: it => `${it.pic}<small>${esc(it.w)}</small>`,
    indexSort: true
  };
  VIEW('read', VIEW_READ);
})();
