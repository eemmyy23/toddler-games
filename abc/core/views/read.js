(function () {
  let tok = 0;
  const cur = () => APP.items()[APP.idx];
  const lit = el => { document.querySelectorAll('#read .on').forEach(x => x.classList.remove('on')); if (el) el.classList.add('on'); };
  function render(sayIt) {
    const L = APP.L(), loc = L.bcp47, A = APP.alphabet(), e = cur(), syl = e.syl, word = e.w, forms = e.forms, pic = e.pic, U = APP.ui();
    const colorOf = u => (u && A.color(u.id)) || 'var(--text)';
    const parts = I18N.splitUnits(word, A.units, loc).filter(p => /[\p{L}\p{M}]/u.test(p.text));
    const tile = (txt, say, cls = '', color = '') => `<button class="rt ${cls}" data-say="${esc(say)}"${color ? ` style="color:${color}"` : ''}>${esc(txt)}</button>`;
    const avail = $('read').clientWidth || innerWidth - 24, nl = parts.length, gap = nl > 8 ? 3 : 6;
    const tw = Math.min(54, Math.floor((avail - (nl - 1) * gap) / nl));
    const lstyle = `--tw:${tw}px;--tf:${Math.min(32, Math.round(tw * 0.62))}px;gap:${gap}px`;
    const say = p => p.unit ? A.name(p.unit) : I18N.upper(p.text, null, loc);
    const upper = parts.map(p => tile(I18N.upper(p.text, p.unit, loc), say(p), 'u', colorOf(p.unit))).join('');
    const lower = parts.map((p, i) => tile(i === 0 ? I18N.upper(p.text, p.unit, loc) : p.text, say(p), 'l', colorOf(p.unit))).join('');
    const shown = parts.length ? I18N.upper(parts[0].text, parts[0].unit, loc) + word.slice(parts[0].text.length) : word;
    const cells = forms ? [...(forms.sg || []), ...(forms.pl || [])] : [];
    const longest = Math.max(8, ...cells.map(x => x.length));
    const chipW = (avail - 8) / 2, em = longest * 0.66;
    const side = Math.floor((chipW - 2 * 26 - 30) / em), tall = side < 15;
    const cf = Math.max(11, Math.min(20, tall ? Math.floor((chipW - 22) / em) : side));
    const ns = syl.length, sylFont = Math.min(32, Math.floor((avail - ns * 20 - (ns - 1) * 22) / Math.max(1, word.length) * 1.55));
    const capFirst = s => { const g = I18N.graphemes(s, loc); return g.length ? I18N.upper(g[0], null, loc) + s.slice(g[0].length) : s; };
    const syls = syl.map((sy, i) => (i ? '<span class="rsep">·</span>' : '') + tile(i === 0 ? capFirst(sy) : sy, sy, 's', INK[(i * 3 + 4) % 8])).join('');
    $('read').innerHTML =
      `<div id="rpic" data-say="${esc(word)}">${pic}</div>` +
      `<div class="rrow let" id="rU" style="${lstyle}">${upper}</div>` +
      `<div class="rrow let" id="rL" style="${lstyle}">${lower}</div>` +
      (syl.length > 1 ? `<div class="rrow syl" id="rS" style="--sf:${sylFont}px">${syls}</div>` : '') +
      `<div class="rrow" id="rW">${tile(shown, word, 'word')}${APP.infoButton(e.concept)}</div>` +
      (forms ? `<div id="rC" class="${tall ? 'tall' : ''}" style="--cf:${cf}px"><div class="label rh">${esc(U.sgpl[0])}</div><div class="label rh">${esc(U.sgpl[1])}</div>` +
        [0, 1].map(r => [['sg', 1], ['pl', 2]].map(([k, n], c) => forms[k]
          ? `<button class="rc" data-say="${esc(forms[k][r])}"><span class="rce">${pic.repeat(n)}</span><span>${esc(forms[k][r])}</span></button>`
          : `<div class="rc none">${r === 0 ? '— ' + esc(U.none[c]) : ''}</div>`).join('')).join('') + `</div>` : '');
    fit();
    const [pv, nx] = APP.neighbors();
    $('rprev').innerHTML = `‹ <b>${pv.pic}</b>`; $('rnext').innerHTML = `<b>${nx.pic}</b> ›`;
    APP.saveIdx();
    if (sayIt) speak(word, 150);
  }
  const fit = () => APP.fit($('read'), 'tight');
  $('read').addEventListener('pointerdown', e => {
    const el = e.target.closest('[data-say]'); if (!el) return;
    e.stopPropagation(); APP.firstTouch(); tok++;
    lit(el.classList.contains('rt') || el.classList.contains('rc') ? el : null);
    sfx.pop(); speak(el.dataset.say, 60);
  });
  async function play() {
    const t = ++tok, alive = () => t === tok && APP.screen() === 'read', word = cur().w;
    for (const el of document.querySelectorAll('#rU .rt')) { if (!alive()) return; lit(el); await speak(el.dataset.say); await wait(150); }
    if (!alive()) return; await wait(300);
    lit(null); document.querySelectorAll('#rL .rt').forEach(x => x.classList.add('on'));
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
  const btn = (id, fn) => $(id).addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); APP.firstTouch(); fn(); });
  btn('rprev', () => VIEW_READ.step(-1)); btn('rnext', () => VIEW_READ.step(1)); btn('rplay', play);
  const VIEW_READ = {
    el: 'read', nav: 'rnav', swipe: true,
    show(sayIt) { render(sayIt); },
    step(d) { APP.step(d); tok++; sfx.pop(); render(true); },
    play, leave() { tok++; }, resize() { render(false); },
    announce(name) { speak(`${name}. ${cur().w}`, 120); },
    onKey(k, e) { if (k === ' ' || k === 'enter') { e.preventDefault(); APP.firstTouch(); play(); return true; } return false; },
    indexFace: it => `${it.pic}<small>${esc(it.w)}</small>`,
    indexSort: true
  };
  VIEW('read', VIEW_READ);
})();
