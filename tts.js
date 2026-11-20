(function () {
  const M = self.MANIFEST, CFG = ABC.config;
  const OPTS = [['orig', 'original'], ['ipa', 'IPA'], ['dash', 'cratimă'], ['gap', 'spațiu'], ['dbl', 'consoană dublă'], ['own', 'textul tău']];
  const G2P = { ro: [[/j/g, 'ʒ'], [/ce/g, 'ʧe'], [/ci$/g, 'ʧʲ'], [/ci/g, 'ʧi'], [/ge/g, 'ʤe'], [/gi$/g, 'ʤʲ'], [/gi/g, 'ʤi'], [/ch/g, 'k'], [/gh/g, 'g'], [/ii$/g, 'ij'],
    [/([^aăâeiîou])i$/g, '$1ʲ'], [/ă/g, 'ə'], [/[âî]/g, 'ɨ'], [/c/g, 'k'], [/ș/g, 'ʃ'], [/ț/g, 'ʦ'], [/g/g, 'ɡ']] };
  const IPA = /^[/[].*[/\]]$|[ˈˌəɨʃʒʧʤʦɡʲːθðŋɲ]/;
  const bare = t => t.replace(/^[/[]|[/\]]$/g, '');
  const ssml = (ph, form) => `<speak><phoneme alphabet="ipa" ph="${esc(bare(ph))}">${esc(form)}</phoneme></speak>`;
  const g2p = (t, lang) => G2P[lang] ? G2P[lang].reduce((x, [re, to]) => x.replace(re, to), t) : null;
  const formIpa = (ph0, base, form, lang) => {
    const ph = ph0.replace(/t͡ʃ/g, 'ʧ').replace(/d͡ʒ/g, 'ʤ').replace(/t͡s/g, 'ʦ');
    const lo = t => t.toLocaleLowerCase(), b = lo(base), f = lo(form);
    let p = 0; while (p < b.length && b[p] === f[p]) p++;
    if (p > 0) p--;
    while (p > 0 && /[cgh]/.test(b[p - 1])) p--;
    const from = g2p(b.slice(p), lang), to = g2p(f.slice(p), lang);
    if (from == null || to == null) return null;
    let i = ph.length, j = from.length;
    while (j > 0 && i > 0) { i--; if (ph[i] === '.') continue; if (ph[i] !== from[j - 1]) return null; j--; }
    return j ? null : ph.slice(0, from.length ? i : ph.length) + to;
  };
  const CONS = /^[^aăâeiîouyäöüáéíóú]$/i;
  let code = store.get('tts.lang', CFG.languages[0]), rows = [], picks = {}, cur = -1, deployed = null, print = null;

  const iso = d => {
    const o = -d.getTimezoneOffset(), p = n => String(Math.floor(Math.abs(n))).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}${o >= 0 ? '+' : '-'}${p(o / 60)}:${p(o % 60)}`;
  };
  const rowsOf = e => {
    const parts = e.w.split(/([/ ])/), syl = parts.map((p, i) => i).filter(i => !/^[/ ]$/.test(parts[i]));
    const at = e.pron ? syl[e.pron.stress] : -1, join = ps => ps.filter(p => p !== '/').join('');
    const base = join(parts), cuts = [];
    const head = { form: base, of: base, bold: parts.map((p, i) => i === at && syl.length > 1 ? `<b>${esc(p)}</b>` : esc(p)).filter(p => p !== '/').join('') };
    const ph = e.pron && e.pron.ipa && !e.pron.of ? e.pron.ipa.replace(/^[/[]|[/\]]$/g, '') : null;
    if (ph) { head.ph = ph; head.ipa = `<speak><phoneme alphabet="ipa" ph="${esc(ph)}">${esc(base)}</phoneme></speak>`; }
    if (at >= 0 && syl.length > 1) {
      const sep = at === syl[syl.length - 1] ? at - 1 : at + 1;
      if (parts[sep] === '/') cuts.push(['dash', join(parts.slice(0, sep)).length, '-'], ['gap', join(parts.slice(0, sep)).length, ' ']);
      const s = parts[at], nx = parts[at + 2], whole = parts[at - 1] !== '/' && parts[at + 1] !== '/';
      if (!whole && CONS.test(s.slice(-1))) cuts.push(['dbl', join(parts.slice(0, at + 1)).length, s.slice(-1)]);
      else if (!whole && parts[at + 1] === '/' && nx && CONS.test(nx[0])) cuts.push(['dbl', join(parts.slice(0, at + 1)).length, nx[0]]);
    }
    const low = t => t.toLocaleLowerCase(ABC.langs[code].bcp47);
    return [...new Set([base, e.def, e.pl, e.plDef].filter(Boolean))].map((form, n) => {
      const r = n ? { form, of: base, bold: esc(form) } : head;
      if (n && ph) { const fp = formIpa(ph, base, form, code); if (fp) { r.ph = fp; r.ipa = `<speak><phoneme alphabet="ipa" ph="${esc(fp)}">${esc(form)}</phoneme></speak>`; } }
      for (const [k, pos, ins] of cuts) if (pos < form.length && low(form.slice(0, pos)) === low(base.slice(0, pos))) r[k] = form.slice(0, pos) + ins + form.slice(pos);
      return r;
    });
  };
  const saveKey = () => `tts3.${code}.${SPEECH.voice ? SPEECH.voice.name : '-'}`;
  const opts = r => OPTS.filter(([k]) => k === 'own' || r[k === 'orig' ? 'form' : k]);
  const text = (r, k) => k === 'own' ? (picks[id(r)] || {}).own || '' : r[k === 'orig' ? 'form' : k];
  const label = (r, k, t) => k === 'orig' ? t : k === 'ipa' ? `IPA ${esc(r.ph)}` : esc(r[k]);
  const id = r => `${r.e.key}|${r.form}`;
  const P = r => picks[id(r)] || {}, M_ = r => P(r).m || {};
  const ok = r => OPTS.map(([k]) => k).filter(k => M_(r)[k] === 'ok' && (k !== 'own' || P(r).own));
  const done = r => Object.keys(M_(r)).length > 0 || !!P(r).none;
  const edit = (r, f) => { const p = picks[id(r)] = Object.assign({ m: {} }, picks[id(r)]); f(p); if (!Object.keys(p.m).length && !p.none && !p.own) delete picks[id(r)]; };
  const marks = (r, i, k, t) => ['ok', 'no'].map(v => `<button class="mark ${v === 'ok' ? 'pass' : 'fail'}" data-i="${i}" data-k="${k}" data-v="${v}" aria-pressed="${M_(r)[k] === v}" aria-label="${t} ${v === 'ok' ? '✓' : '✗'}">${v === 'ok' ? '✓' : '✗'}</button>`).join('');

  function fillLangs() {
    $('lang').innerHTML = CFG.languages.map(c => `<option value="${c}"${c === code ? ' selected' : ''}>${esc(ABC.langs[c].name)}</option>`).join('');
  }
  function fillVoices() {
    const L = ABC.langs[code], base = L.bcp47.toLowerCase().split('-')[0];
    const all = 'speechSynthesis' in window ? speechSynthesis.getVoices().filter(v => SPEECH.norm(v).split('-')[0] === base) : [];
    $('voice').innerHTML = all.length ? all.map((v, i) => `<option value="${i}"${v === SPEECH.voice ? ' selected' : ''}>${esc(v.name)} · ${esc(v.lang)}${v.localService ? ' · local' : ''}${v.default ? ' · default' : ''}</option>`).join('') : '<option>fără voce</option>';
    $('voice').onchange = () => { SPEECH.voice = all[+$('voice').value]; SPEECH.noVoice = !SPEECH.voice; load(); probe(); };
  }
  function load() {
    const raw = store.get(saveKey(), {});
    picks = Object.fromEntries(Object.entries(raw).filter(([, v]) => v && typeof v === 'object')
      .map(([k, v]) => [k, Array.isArray(v.ok) ? { m: Object.fromEntries(v.ok.map(x => [x, 'ok'])) } : v]));
    render();
  }
  function save() {
    store.set(saveKey(), picks);
    const L = ABC.langs[code], fix = {};
    rows.forEach(r => {
      const k = ok(r)[0]; if (!k) return;
      const t = k === 'ipa' ? r.ph : text(r, k), ipa = k === 'own' && IPA.test(t);
      fix[r.form.toLocaleLowerCase(L.bcp47)] = ipa ? { k: 'ipa', text: bare(t) } : { k, text: t };
    });
    store.set(SPEECH.fixKey(L.bcp47, SPEECH.voice), fix);
  }
  function render() {
    const L = ABC.langs[code];
    rows = L.words.flatMap(e => [Object.assign({ key: e.id }, e), ...(e.syn || []).map((s, i) => Object.assign({ key: `${e.id}~${i + 1}` }, s))])
      .flatMap(e => rowsOf(e).map(r => Object.assign({ e }, r)));
    $('list').innerHTML = rows.map((r, i) => `<div class="row${done(r) ? ' done' : ''}" id="r${i}">
      <div class="w">${r.bold}${r.form !== r.of ? ` <small>· ${esc(r.of)}</small>` : ''}</div>
      ${opts(r).map(([k, t]) => k === 'own'
        ? `<div class="opt"><button class="play own" data-own="${i}" aria-label="▶ ${t}">▶</button><input data-i="${i}" placeholder="${t} sau IPA" value="${esc(text(r, k))}" autocapitalize="off" autocomplete="off" spellcheck="false">${marks(r, i, k, t)}</div>`
        : `<div class="opt"><button class="play" data-i="${i}" data-say="${esc(text(r, k))}">▶ ${label(r, k, t)}</button>${marks(r, i, k, t)}</div>`).join('')}
      <button class="none" data-none="${i}" aria-pressed="${!!P(r).none}">✗ toate greșite</button>
      <div class="meta">în aplicație: <b>${esc(applied(r))}</b> · ${esc(r.e.key)}${r.e.pron ? ` · silaba ${r.e.pron.stress + 1} · ${esc(r.e.pron.src)}` : ''}</div></div>`).join('');
    info();
  }
  function applied(r) {
    const L = ABC.langs[code], v = SPEECH.voice, w = r.form.toLocaleLowerCase(L.bcp47), local = v ? store.get(SPEECH.fixKey(L.bcp47, v), {}) : {};
    const d = v && L.fixes && L.fixes[v.voiceURI] || {}, fromData = Object.assign({}, d.derived, d.words)[r.form];
    if (local[w]) return `${local[w].k === 'ipa' ? 'IPA ' : ''}${local[w].text} (bifa ta)`;
    if (fromData) return /^\/.*\/$/.test(fromData) ? `IPA ${fromData.slice(1, -1)}` : fromData;
    if (v && L.ssml && L.ssml.test(v.voiceURI) && r.form === r.of && r.e.pron && r.e.pron.ipa && !r.e.pron.of) return `IPA ${r.ph}`;
    return 'original';
  }
  function probe() {
    const L = ABC.langs[code], v = SPEECH.voice;
    if (!v || !('speechSynthesis' in window)) return;
    print = null; info();
    const u = new SpeechSynthesisUtterance((L.numbers || []).slice(0, 5).join(' ') + '.');
    u.voice = v; u.lang = v.lang; u.rate = 1; u.pitch = 1; u.volume = 0;
    let t0 = 0, words = 0;
    u.onstart = () => { t0 = performance.now(); };
    u.onboundary = e => { if (e.name !== 'sentence') words++; };
    u.onend = u.onerror = e => { print = { ms: t0 ? Math.round(performance.now() - t0) : null, words, error: e.error || null }; info(); };
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
  const printText = () => print ? `amprentă ${print.ms == null ? '?' : print.ms} ms · ${print.words} cuvinte${print.error ? ` · ${print.error}` : ''}` : 'amprentă …';
  function info() {
    const n = rows.filter(done).length, v = SPEECH.voice;
    $('info').textContent = `${CFG.version} · build ${M.version} · deployed ${deployed || '?'} · ${v ? `${v.name} (${v.lang})` : 'fără voce'} · ${printText()} · rate ${SPEECH.rate} · pitch ${SPEECH.pitch} · marcate ${n}/${rows.length}`;
  }
  async function next() {
    const i = cur + 1 < rows.length ? cur + 1 : 0;
    document.querySelectorAll('.row.cur').forEach(el => el.classList.remove('cur'));
    cur = i; const el = $('r' + i), r = rows[i];
    el.classList.add('cur'); el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    for (const [k] of opts(r)) { const t = text(r, k); if (!t) continue; await speak(k === 'own' && IPA.test(t) ? ssml(t, r.form) : t); if (cur !== i) return; await wait(PAUSE.beat); }
  }
  function report() {
    const v = SPEECH.voice, ticked = rows.filter(done), count = { marked: ticked.length, none: ticked.filter(r => P(r).none).length };
    ticked.forEach(r => Object.entries(M_(r)).forEach(([k, x]) => { count[`${k} ${x}`] = (count[`${k} ${x}`] || 0) + 1; }));
    return {
      version: { app: CFG.version, build: M.version, deployed },
      tested: iso(new Date()), page: location.href, userAgent: navigator.userAgent,
      lang: code, bcp47: ABC.langs[code].bcp47,
      voice: v ? { name: v.name, lang: v.lang, local: v.localService, default: v.default, uri: v.voiceURI } : null,
      fingerprint: print, voices: ('speechSynthesis' in window ? speechSynthesis.getVoices() : []).map(x => `${x.name} | ${x.lang} | ${x.voiceURI}${x.localService ? '' : ' | network'}`), rate: SPEECH.rate, pitch: SPEECH.pitch, total: rows.length, count,
      results: ticked.map(r => ({ key: r.e.key, w: r.form, of: r.of, stress: r.e.pron ? r.e.pron.stress : null, none: !!P(r).none,
        marks: Object.entries(M_(r)).map(([k, x]) => ({ k, mark: x, text: k === 'ipa' ? r.ph : text(r, k) })) }))
    };
  }
  function md(o) {
    const v = o.voice;
    return [`# TTS test — ${o.lang} (${o.bcp47})`, '',
      `- app: ${o.version.app} · build ${o.version.build} · deployed ${o.version.deployed || '?'}`,
      `- tested: ${o.tested}`, `- page: ${o.page}`,
      `- voice: ${v ? `${v.name} · ${v.lang}${v.local ? ' · local' : ''}${v.default ? ' · default' : ''} · ${v.uri}` : '—'}`,
      `- ${printText()}`, `- rate ${o.rate} · pitch ${o.pitch}`, `- userAgent: ${o.userAgent}`,
      `- voices (${o.voices.length}): ${o.voices.filter(x => /\b(ro|en|de)[-_]/i.test(x)).join(' ; ')}`,
      `- marked ${o.count.marked}/${o.total}: ${Object.entries(o.count).filter(([k]) => k !== 'marked').map(([k, n]) => `${k} ${n}`).join(', ')}`, '',
      '| key | word | stress | ✓ | ✗ | toate greșite |', '|---|---|---|---|---|---|',
      ...o.results.map(r => `| ${r.key} | ${r.w} | ${r.stress == null ? '' : r.stress + 1} | ${r.marks.filter(x => x.mark === 'ok').map(x => `${x.k} ${x.text}`).join('; ')} | ${r.marks.filter(x => x.mark === 'no').map(x => `${x.k} ${x.text}`).join('; ')} | ${r.none ? 'da' : ''} |`)].join('\n');
  }
  function show(t) { $('out').hidden = false; $('text').value = t; $('out').scrollIntoView({ behavior: 'smooth' }); }

  function setLang(c) {
    code = c; store.set('tts.lang', c); cur = -1;
    const L = ABC.langs[c]; SPEECH.pick(L.bcp47, L.voices); document.documentElement.lang = L.bcp47;
    fillVoices(); load(); probe();
  }
  $('lang').onchange = () => setLang($('lang').value);
  $('list').addEventListener('click', e => {
    const say = e.target.closest('[data-say]'); if (say) return speak(say.dataset.say);
    const own = e.target.closest('[data-own]'); if (own) { const t = own.parentNode.querySelector('input').value.trim(); return t && speak(IPA.test(t) ? ssml(t, rows[+own.dataset.own].form) : t); }
    const none = e.target.closest('[data-none]');
    if (none) { const r = rows[+none.dataset.none]; edit(r, p => { if (p.none) delete p.none; else p.none = true; }); none.setAttribute('aria-pressed', !!P(r).none); none.closest('.row').classList.toggle('done', done(r)); save(); return info(); }
    const b = e.target.closest('.mark'); if (!b) return;
    const r = rows[+b.dataset.i], k = b.dataset.k, v = b.dataset.v;
    edit(r, p => { if (p.m[k] === v) delete p.m[k]; else p.m[k] = v; });
    b.parentNode.querySelectorAll('.mark').forEach(x => x.setAttribute('aria-pressed', M_(r)[k] === x.dataset.v));
    b.closest('.row').classList.toggle('done', done(r)); save(); info();
    b.closest('.row').querySelector('.meta b').textContent = applied(r);
  });
  $('list').addEventListener('input', e => {
    const t = e.target.closest('input[data-i]'); if (!t) return;
    const r = rows[+t.dataset.i];
    edit(r, p => { if (t.value.trim()) p.own = t.value.trim(); else delete p.own; }); save();
  });
  $('next').onclick = next;
  $('json').onclick = () => show(JSON.stringify(report(), null, 2));
  $('md').onclick = () => show(md(report()));
  $('copy').onclick = () => {
    const t = $('text'); t.select();
    (navigator.clipboard ? navigator.clipboard.writeText(t.value) : Promise.reject()).catch(() => document.execCommand('copy'));
  };
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { const L = ABC.langs[code]; SPEECH.pick(L.bcp47, L.voices); fillVoices(); load(); };
  fetch('abc/manifest.js', { cache: 'no-store' }).then(r => { const h = r.headers.get('last-modified'); deployed = h ? new Date(h).toISOString() : null; info(); }).catch(() => {});
  if (!CFG.languages.includes(code)) code = CFG.languages[0];
  fillLangs(); setLang(code);
})();
