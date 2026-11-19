(function () {
  const M = self.MANIFEST, CFG = ABC.config, ACUTE = '́';
  const OPTS = [['orig', 'original'], ['v1', 'V1'], ['v2', 'V2']];
  const RO_GLIDE = ['oa', 'ea', 'eo', 'ia', 'ie', 'io', 'iu', 'ua', 'uă'];
  let code = store.get('tts.lang', CFG.languages[0]), rows = [], picks = {}, cur = -1, deployed = null;

  const iso = d => {
    const o = -d.getTimezoneOffset(), p = n => String(Math.floor(Math.abs(n))).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}${o >= 0 ? '+' : '-'}${p(o / 60)}:${p(o % 60)}`;
  };
  const nucleus = (syl, lang) => {
    const s = syl.toLocaleLowerCase(), vow = /[aăâeiîouyäöü]/;
    let i = [...s].findIndex((c, k) => vow.test(c) && !(c === 'y' && vow.test(s[k + 1] || '')));
    if (i < 0) return -1;
    if (lang === 'ro' && RO_GLIDE.includes(s.slice(i, i + 2))) i++;
    return i;
  };
  const variants = (e, lang) => {
    const parts = e.w.split(/([/ ])/), idx = parts.map((p, i) => i).filter(i => !/^[/ ]$/.test(parts[i]));
    const base = parts.filter(p => p !== '/').join('');
    if (idx.length < 2 || !e.pron) return { base, bold: esc(base) };
    const at = idx[e.pron.stress], syl = parts[at], n = nucleus(syl, lang);
    const join = s => parts.map((p, i) => i === at ? s : p).filter(p => p !== '/').join('');
    const bold = parts.map((p, i) => i === at ? `<b>${esc(p)}</b>` : esc(p)).filter(p => p !== '/').join('');
    if (n < 0) return { base, bold };
    const ch = [...syl];
    return { base, bold,
      v1: join([...ch.slice(0, n + 1), ACUTE, ...ch.slice(n + 1)].join('').normalize('NFC')),
      v2: join([...ch.slice(0, n + 1), ch[n], ...ch.slice(n + 1)].join('')) };
  };
  const saveKey = () => `tts.${code}.${SPEECH.voice ? SPEECH.voice.name : '-'}`;

  function fillLangs() {
    $('lang').innerHTML = CFG.languages.map(c => `<option value="${c}"${c === code ? ' selected' : ''}>${esc(ABC.langs[c].name)}</option>`).join('');
  }
  function fillVoices() {
    const L = ABC.langs[code], base = L.bcp47.toLowerCase().split('-')[0];
    const all = 'speechSynthesis' in window ? speechSynthesis.getVoices().filter(v => SPEECH.norm(v).split('-')[0] === base) : [];
    $('voice').innerHTML = all.length ? all.map((v, i) => `<option value="${i}"${v === SPEECH.voice ? ' selected' : ''}>${esc(v.name)} · ${esc(v.lang)}${v.localService ? ' · local' : ''}${v.default ? ' · default' : ''}</option>`).join('') : '<option>fără voce</option>';
    $('voice').onchange = () => { SPEECH.voice = all[+$('voice').value]; SPEECH.noVoice = !SPEECH.voice; load(); };
  }
  const opts = r => OPTS.filter(([k]) => r[k === 'orig' ? 'base' : k]);
  const text = (r, k) => r[k === 'orig' ? 'base' : k];
  const judged = r => { const p = picks[r.e.key] || {}; return opts(r).every(([k]) => p[k]); };
  function load() {
    const raw = store.get(saveKey(), {});
    picks = Object.fromEntries(Object.entries(raw).filter(([, v]) => v && typeof v === 'object'));
    render();
  }
  function render() {
    const L = ABC.langs[code];
    rows = L.words.flatMap(e => [Object.assign({ key: e.id }, e), ...(e.syn || []).map((s, i) => Object.assign({ key: `${e.id}~${i + 1}` }, s))])
      .map(e => Object.assign({ e }, variants(e, code)));
    $('list').innerHTML = rows.map((r, i) => `<div class="row${judged(r) ? ' done' : ''}" id="r${i}">
      <div class="w">${r.bold}</div>
      ${opts(r).map(([k, t]) => `<div class="opt"><button class="play" data-say="${esc(text(r, k))}">▶ ${t}${k === 'orig' ? '' : ` ${esc(text(r, k))}`}</button>${['pass', 'fail'].map(v => `<button class="mark ${v}" data-i="${i}" data-k="${k}" data-v="${v}" aria-pressed="${(picks[r.e.key] || {})[k] === v}" aria-label="${t} ${v}">${v === 'pass' ? '✓' : '✗'}</button>`).join('')}</div>`).join('')}
      <div class="meta">${esc(r.e.key)}${r.e.pron ? ` · silaba ${r.e.pron.stress + 1} · ${esc(r.e.pron.ipa || '')} · ${esc(r.e.pron.src)}` : ''}</div></div>`).join('');
    info();
  }
  function info() {
    const n = rows.filter(judged).length, v = SPEECH.voice;
    $('info').textContent = `${CFG.version} · build ${M.version} · deployed ${deployed || '?'} · ${v ? `${v.name} (${v.lang})` : 'fără voce'} · rate ${SPEECH.rate} · pitch ${SPEECH.pitch} · ${n}/${rows.length}`;
  }
  async function next() {
    let i = rows.findIndex((r, k) => k > cur && !judged(r));
    if (i < 0) i = rows.findIndex(r => !judged(r));
    if (i < 0) return;
    document.querySelectorAll('.row.cur').forEach(el => el.classList.remove('cur'));
    cur = i; const el = $('r' + i), r = rows[i];
    el.classList.add('cur'); el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    for (const t of [r.base, r.v1, r.v2].filter(Boolean)) { await speak(t); if (cur !== i) return; await wait(PAUSE.beat); }
  }
  function report() {
    const v = SPEECH.voice, done = rows.filter(r => Object.keys(picks[r.e.key] || {}).length), count = {};
    done.forEach(r => Object.entries(picks[r.e.key]).forEach(([k, x]) => { count[`${k} ${x}`] = (count[`${k} ${x}`] || 0) + 1; }));
    return {
      version: { app: CFG.version, build: M.version, deployed },
      tested: iso(new Date()), page: location.href, userAgent: navigator.userAgent,
      lang: code, bcp47: ABC.langs[code].bcp47,
      voice: v ? { name: v.name, lang: v.lang, local: v.localService, default: v.default, uri: v.voiceURI } : null,
      rate: SPEECH.rate, pitch: SPEECH.pitch,
      total: rows.length, judged: rows.filter(judged).length, count,
      results: done.map(r => Object.assign({ key: r.e.key, w: r.base, stress: r.e.pron ? r.e.pron.stress : null, src: r.e.pron ? r.e.pron.src : null },
        ...opts(r).map(([k]) => ({ [k]: { text: text(r, k), result: picks[r.e.key][k] || null } }))))
    };
  }
  function md(o) {
    const v = o.voice;
    return [`# TTS test — ${o.lang} (${o.bcp47})`, '',
      `- app: ${o.version.app} · build ${o.version.build} · deployed ${o.version.deployed || '?'}`,
      `- tested: ${o.tested}`, `- page: ${o.page}`,
      `- voice: ${v ? `${v.name} · ${v.lang}${v.local ? ' · local' : ''}${v.default ? ' · default' : ''} · ${v.uri}` : '—'}`,
      `- rate ${o.rate} · pitch ${o.pitch}`, `- userAgent: ${o.userAgent}`,
      `- judged ${o.judged}/${o.total}: ${Object.entries(o.count).map(([k, n]) => `${k} ${n}`).join(', ')}`, '',
      '| key | word | stress | original | V1 | V2 |', '|---|---|---|---|---|---|',
      ...o.results.map(r => `| ${r.key} | ${r.w} | ${r.stress == null ? '' : r.stress + 1} | ${['orig', 'v1', 'v2'].map(k => r[k] ? `${r[k].result || '—'} ${k === 'orig' ? '' : r[k].text}`.trim() : '').join(' | ')} |`)].join('\n');
  }
  function show(text) { $('out').hidden = false; $('text').value = text; $('out').scrollIntoView({ behavior: 'smooth' }); }

  function setLang(c) {
    code = c; store.set('tts.lang', c); cur = -1;
    const L = ABC.langs[c]; SPEECH.pick(L.bcp47, L.voices, L.words); document.documentElement.lang = L.bcp47;
    fillVoices(); load();
  }
  $('lang').onchange = () => setLang($('lang').value);
  $('list').addEventListener('click', e => {
    const say = e.target.closest('[data-say]'); if (say) return speak(say.dataset.say);
    const b = e.target.closest('.mark'); if (!b) return;
    const r = rows[+b.dataset.i], p = picks[r.e.key] = picks[r.e.key] || {}, k = b.dataset.k;
    if (p[k] === b.dataset.v) delete p[k]; else p[k] = b.dataset.v;
    if (!Object.keys(p).length) delete picks[r.e.key];
    store.set(saveKey(), picks);
    b.parentNode.querySelectorAll('.mark').forEach(m => m.setAttribute('aria-pressed', p[k] === m.dataset.v));
    b.closest('.row').classList.toggle('done', judged(r)); info();
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
