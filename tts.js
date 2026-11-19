(function () {
  const M = self.MANIFEST, CFG = ABC.config, ACUTE = '́';
  const CHOICES = [['', '—'], ['orig', '✓ original'], ['v1', '✓ V1'], ['v2', '✓ V2'], ['bad', '✗ toate greșite']];
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
  function load() {
    picks = store.get(saveKey(), {});
    render();
  }
  function render() {
    const L = ABC.langs[code];
    rows = L.words.flatMap(e => [Object.assign({ key: e.id }, e), ...(e.syn || []).map((s, i) => Object.assign({ key: `${e.id}~${i + 1}` }, s))])
      .map(e => Object.assign({ e }, variants(e, code)));
    $('list').innerHTML = rows.map((r, i) => `<div class="row${picks[r.e.key] ? ' done' : ''}" id="r${i}">
      <div class="w">${r.bold}</div>
      <select data-i="${i}" aria-label="Rezultat ${esc(r.base)}">${CHOICES.filter(([v]) => (v !== 'v1' && v !== 'v2') || r.v1).map(([v, t]) => `<option value="${v}"${(picks[r.e.key] || '') === v ? ' selected' : ''}>${t}</option>`).join('')}</select>
      <div class="plays"><button data-say="${esc(r.base)}">▶ original</button>${r.v1 ? `<button data-say="${esc(r.v1)}">▶ V1 ${esc(r.v1)}</button><button data-say="${esc(r.v2)}">▶ V2 ${esc(r.v2)}</button>` : ''}</div>
      <div class="meta">${esc(r.e.key)}${r.e.pron ? ` · silaba ${r.e.pron.stress + 1} · ${esc(r.e.pron.ipa || '')} · ${esc(r.e.pron.src)}` : ''}</div></div>`).join('');
    info();
  }
  function info() {
    const n = rows.filter(r => picks[r.e.key]).length, v = SPEECH.voice;
    $('info').textContent = `${CFG.version} · build ${M.version} · deployed ${deployed || '?'} · ${v ? `${v.name} (${v.lang})` : 'fără voce'} · rate ${SPEECH.rate} · pitch ${SPEECH.pitch} · ${n}/${rows.length}`;
  }
  async function next() {
    let i = rows.findIndex((r, k) => k > cur && !picks[r.e.key]);
    if (i < 0) i = rows.findIndex(r => !picks[r.e.key]);
    if (i < 0) return;
    document.querySelectorAll('.row.cur').forEach(el => el.classList.remove('cur'));
    cur = i; const el = $('r' + i), r = rows[i];
    el.classList.add('cur'); el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    for (const t of [r.base, r.v1, r.v2].filter(Boolean)) { await speak(t); if (cur !== i) return; await wait(PAUSE.beat); }
  }
  function report() {
    const v = SPEECH.voice, done = rows.filter(r => picks[r.e.key]), count = {};
    done.forEach(r => { count[picks[r.e.key]] = (count[picks[r.e.key]] || 0) + 1; });
    return {
      version: { app: CFG.version, build: M.version, deployed },
      tested: iso(new Date()), page: location.href, userAgent: navigator.userAgent,
      lang: code, bcp47: ABC.langs[code].bcp47,
      voice: v ? { name: v.name, lang: v.lang, local: v.localService, default: v.default, uri: v.voiceURI } : null,
      rate: SPEECH.rate, pitch: SPEECH.pitch,
      total: rows.length, judged: done.length, count,
      results: done.map(r => ({ key: r.e.key, w: r.base, stress: r.e.pron ? r.e.pron.stress : null, src: r.e.pron ? r.e.pron.src : null,
        choice: picks[r.e.key], text: { orig: r.base, v1: r.v1, v2: r.v2 }[picks[r.e.key]] || null }))
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
      '| key | word | stress | choice | text |', '|---|---|---|---|---|',
      ...o.results.map(r => `| ${r.key} | ${r.w} | ${r.stress == null ? '' : r.stress + 1} | ${r.choice} | ${r.text || ''} |`)].join('\n');
  }
  function show(text) { $('out').hidden = false; $('text').value = text; $('out').scrollIntoView({ behavior: 'smooth' }); }

  function setLang(c) {
    code = c; store.set('tts.lang', c); cur = -1;
    const L = ABC.langs[c]; SPEECH.pick(L.bcp47, L.voices, L.words); document.documentElement.lang = L.bcp47;
    fillVoices(); load();
  }
  $('lang').onchange = () => setLang($('lang').value);
  $('list').addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) speak(b.dataset.say); });
  $('list').addEventListener('change', e => {
    const s = e.target.closest('select[data-i]'); if (!s) return;
    const r = rows[+s.dataset.i];
    if (s.value) picks[r.e.key] = s.value; else delete picks[r.e.key];
    store.set(saveKey(), picks); s.closest('.row').classList.toggle('done', !!s.value); info();
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
