(function () {
  const M = self.MANIFEST, CFG = ABC.config;
  const OPTS = [['orig', 'original'], ['ipa', 'IPA'], ['dash', 'cratimă'], ['gap', 'spațiu'], ['dbl', 'consoană dublă']];
  const CONS = /^[^aăâeiîouyäöüáéíóú]$/i;
  let code = store.get('tts.lang', CFG.languages[0]), rows = [], picks = {}, cur = -1, deployed = null;

  const iso = d => {
    const o = -d.getTimezoneOffset(), p = n => String(Math.floor(Math.abs(n))).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}${o >= 0 ? '+' : '-'}${p(o / 60)}:${p(o % 60)}`;
  };
  const variants = e => {
    const parts = e.w.split(/([/ ])/), syl = parts.map((p, i) => i).filter(i => !/^[/ ]$/.test(parts[i]));
    const at = e.pron ? syl[e.pron.stress] : -1, join = ps => ps.filter(p => p !== '/').join('');
    const base = join(parts), v = { base, n: syl.length };
    v.bold = parts.map((p, i) => i === at && syl.length > 1 ? `<b>${esc(p)}</b>` : esc(p)).filter(p => p !== '/').join('');
    const ph = e.pron && e.pron.ipa && !e.pron.of ? e.pron.ipa.replace(/^[/[]|[/\]]$/g, '') : null;
    if (ph) { v.ph = ph; v.ipa = `<speak><phoneme alphabet="ipa" ph="${esc(ph)}">${esc(base)}</phoneme></speak>`; }
    if (at < 0 || syl.length < 2) return v;
    const cut = at === syl[syl.length - 1] ? at - 1 : at + 1, sep = cut > at ? at + 1 : at - 1;
    if (parts[sep] === '/') {
      v.dash = join(parts.map((p, i) => i === sep ? '-' : p));
      v.gap = join(parts.map((p, i) => i === sep ? ' ' : p));
    }
    const s = parts[at], nx = parts[at + 2];
    if (parts[at - 1] !== '/' && parts[at + 1] !== '/') return v;
    if (CONS.test(s.slice(-1))) v.dbl = join(parts.map((p, i) => i === at ? p + p.slice(-1) : p));
    else if (parts[at + 1] === '/' && nx && CONS.test(nx[0])) v.dbl = join(parts.map((p, i) => i === at + 2 ? p[0] + p : p));
    return v;
  };
  const saveKey = () => `tts2.${code}.${SPEECH.voice ? SPEECH.voice.name : '-'}`;
  const opts = r => OPTS.filter(([k]) => r[k === 'orig' ? 'base' : k]);
  const text = (r, k) => r[k === 'orig' ? 'base' : k];
  const label = (r, k, t) => k === 'orig' ? t : k === 'ipa' ? `IPA ${esc(r.ph)}` : esc(r[k]);
  const pk = r => picks[r.e.key] || (picks[r.e.key] = { heard: false, ok: [] });
  const heard = r => !!(picks[r.e.key] && picks[r.e.key].heard);

  function fillLangs() {
    $('lang').innerHTML = CFG.languages.map(c => `<option value="${c}"${c === code ? ' selected' : ''}>${esc(ABC.langs[c].name)}</option>`).join('');
  }
  function fillVoices() {
    const L = ABC.langs[code], base = L.bcp47.toLowerCase().split('-')[0];
    const all = 'speechSynthesis' in window ? speechSynthesis.getVoices().filter(v => SPEECH.norm(v).split('-')[0] === base) : [];
    $('voice').innerHTML = all.length ? all.map((v, i) => `<option value="${i}"${v === SPEECH.voice ? ' selected' : ''}>${esc(v.name)} · ${esc(v.lang)}${v.localService ? ' · local' : ''}${v.default ? ' · default' : ''}</option>`).join('') : '<option>fără voce</option>';
    $('voice').onchange = () => { SPEECH.voice = all[+$('voice').value]; SPEECH.noVoice = !SPEECH.voice; load(); };
  }
  function load() {
    const raw = store.get(saveKey(), {});
    picks = Object.fromEntries(Object.entries(raw).filter(([, v]) => v && Array.isArray(v.ok)));
    render();
  }
  const save = () => store.set(saveKey(), picks);
  function render() {
    const L = ABC.langs[code];
    rows = L.words.flatMap(e => [Object.assign({ key: e.id }, e), ...(e.syn || []).map((s, i) => Object.assign({ key: `${e.id}~${i + 1}` }, s))])
      .map(e => Object.assign({ e }, variants(e))).filter(r => r.n > 1);
    $('list').innerHTML = rows.map((r, i) => `<div class="row${heard(r) ? ' done' : ''}" id="r${i}">
      <div class="w">${r.bold}</div>
      ${opts(r).map(([k, t]) => `<div class="opt"><button class="play" data-i="${i}" data-say="${esc(text(r, k))}">▶ ${label(r, k, t)}</button><button class="mark pass" data-i="${i}" data-k="${k}" aria-pressed="${pk(r).ok.includes(k)}" aria-label="${t} ✓">✓</button></div>`).join('')}
      <div class="meta">${esc(r.e.key)}${r.e.pron ? ` · silaba ${r.e.pron.stress + 1} · ${esc(r.e.pron.src)}` : ''}</div></div>`).join('');
    info();
  }
  function info() {
    const n = rows.filter(heard).length, v = SPEECH.voice;
    $('info').textContent = `${CFG.version} · build ${M.version} · deployed ${deployed || '?'} · ${v ? `${v.name} (${v.lang})` : 'fără voce'} · rate ${SPEECH.rate} · pitch ${SPEECH.pitch} · ascultate ${n}/${rows.length}`;
  }
  function markHeard(i) { const r = rows[i]; if (heard(r)) return; pk(r).heard = true; save(); $('r' + i).classList.add('done'); info(); }
  async function next() {
    let i = rows.findIndex((r, k) => k > cur && !heard(r));
    if (i < 0) i = rows.findIndex(r => !heard(r));
    if (i < 0) return;
    document.querySelectorAll('.row.cur').forEach(el => el.classList.remove('cur'));
    cur = i; const el = $('r' + i), r = rows[i];
    el.classList.add('cur'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); markHeard(i);
    for (const [k] of opts(r)) { await speak(text(r, k)); if (cur !== i) return; await wait(PAUSE.beat); }
  }
  function report() {
    const v = SPEECH.voice, done = rows.filter(heard), count = { heard: done.length, bad: 0 };
    done.forEach(r => { const ok = picks[r.e.key].ok; if (!ok.length) count.bad++; ok.forEach(k => { count[k] = (count[k] || 0) + 1; }); });
    return {
      version: { app: CFG.version, build: M.version, deployed },
      tested: iso(new Date()), page: location.href, userAgent: navigator.userAgent,
      lang: code, bcp47: ABC.langs[code].bcp47,
      voice: v ? { name: v.name, lang: v.lang, local: v.localService, default: v.default, uri: v.voiceURI } : null,
      rate: SPEECH.rate, pitch: SPEECH.pitch, total: rows.length, count,
      results: done.map(r => ({ key: r.e.key, w: r.base, stress: r.e.pron ? r.e.pron.stress : null,
        ok: picks[r.e.key].ok.map(k => ({ k, text: k === 'ipa' ? r.ph : text(r, k) })) }))
    };
  }
  function md(o) {
    const v = o.voice;
    return [`# TTS test — ${o.lang} (${o.bcp47})`, '',
      `- app: ${o.version.app} · build ${o.version.build} · deployed ${o.version.deployed || '?'}`,
      `- tested: ${o.tested}`, `- page: ${o.page}`,
      `- voice: ${v ? `${v.name} · ${v.lang}${v.local ? ' · local' : ''}${v.default ? ' · default' : ''} · ${v.uri}` : '—'}`,
      `- rate ${o.rate} · pitch ${o.pitch}`, `- userAgent: ${o.userAgent}`,
      `- heard ${o.count.heard}/${o.total}: ${Object.entries(o.count).filter(([k]) => k !== 'heard').map(([k, n]) => `${k} ${n}`).join(', ')}`, '',
      '| key | word | stress | ✓ |', '|---|---|---|---|',
      ...o.results.map(r => `| ${r.key} | ${r.w} | ${r.stress == null ? '' : r.stress + 1} | ${r.ok.length ? r.ok.map(x => `${x.k} ${x.text}`).join('; ') : 'bad'} |`)].join('\n');
  }
  function show(t) { $('out').hidden = false; $('text').value = t; $('out').scrollIntoView({ behavior: 'smooth' }); }

  function setLang(c) {
    code = c; store.set('tts.lang', c); cur = -1;
    const L = ABC.langs[c]; SPEECH.pick(L.bcp47, L.voices, L.words); document.documentElement.lang = L.bcp47;
    fillVoices(); load();
  }
  $('lang').onchange = () => setLang($('lang').value);
  $('list').addEventListener('click', e => {
    const say = e.target.closest('[data-say]'); if (say) { markHeard(+say.dataset.i); return speak(say.dataset.say); }
    const b = e.target.closest('.mark'); if (!b) return;
    const r = rows[+b.dataset.i], p = pk(r), k = b.dataset.k;
    p.ok = p.ok.includes(k) ? p.ok.filter(x => x !== k) : [...p.ok, k];
    b.setAttribute('aria-pressed', p.ok.includes(k)); markHeard(+b.dataset.i); save();
  });
  $('next').onclick = next;
  $('json').onclick = () => show(JSON.stringify(report(), null, 2));
  $('md').onclick = () => show(md(report()));
  $('copy').onclick = () => {
    const t = $('text'); t.select();
    (navigator.clipboard ? navigator.clipboard.writeText(t.value) : Promise.reject()).catch(() => document.execCommand('copy'));
  };
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { const L = ABC.langs[code]; SPEECH.pick(L.bcp47, L.voices, L.words); fillVoices(); load(); };
  fetch('abc/manifest.js', { cache: 'no-store' }).then(r => { const h = r.headers.get('last-modified'); deployed = h ? new Date(h).toISOString() : null; info(); }).catch(() => {});
  if (!CFG.languages.includes(code)) code = CFG.languages[0];
  fillLangs(); setLang(code);
})();
