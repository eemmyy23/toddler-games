(function () {
  const st = { view: 'home', size: null, sizeOf: null, busy: null, got: 0, err: null, ctl: null, ask: false, q: '', all: false, word: null, open: -1 };
  const S = () => APP.ui().settings, key = () => `voice.${APP.L().code}`, mb = n => Math.round(n / 1e6);
  const voices = () => {
    const base = APP.L().bcp47.toLowerCase().split('-')[0];
    return 'speechSynthesis' in window ? speechSynthesis.getVoices().filter(v => SPEECH.norm(v).split('-')[0] === base) : [];
  };
  const say = () => speak(S().sample);
  const note = t => { $('setmsg').textContent = t; };
  const langs = () => `<div class="setlang">${CFG.languages.filter(c => ABC.langs[c] && ABC.langs[c].forms).map(c =>
    `<button class="card setl${c === APP.L().code ? ' on' : ''}" data-l="${c}" aria-pressed="${c === APP.L().code}"><span>${ABC.langs[c].flag}</span>${esc(ABC.langs[c].name)}</button>`).join('')}</div>`;
  const nav = (v, title, sub, badge) => `<button class="card setn" data-go="${v}"><span class="sett"><b>${esc(title)}</b><small>${esc(sub)}</small></span>${badge ? `<span class="chip">${esc(badge)}</span>` : ''}<span class="go">${APP.icon('next')}</span></button>`;
  const chip = t => `<span class="chip">${esc(t)}</span>`;
  const play = v => `<button class="rbtn small" data-play="${esc(v)}" aria-label="${esc(S().listen)}">${APP.icon('play')}</button>`;
  function curName() {
    const v = SPEECH.voice, U = S();
    return !v ? U.none : v.voiceURI.startsWith('piper:') ? U.piper : `${v.name} · ${U.phoneTag}`;
  }
  async function home() {
    const U = S();
    return `${langs()}${nav('voice', U.voice, st.busy != null ? APP.t(U.downloading, { p: st.busy }) : curName())}${nav('pron', U.pron, U.pronSub)}`;
  }
  async function voice() {
    const U = S(), L = APP.L(), id = L.piper, cur = SPEECH.voice && SPEECH.voice.voiceURI, list = voices();
    const has = id && await PIPER.has(id);
    if (id && !has && st.sizeOf !== id && PIPER.ok()) { st.sizeOf = id; st.size = null; PIPER.size(id).then(n => { st.size = n; draw(); }); }
    const phone = list.length ? list.map(v => `<div class="card setv${cur === v.voiceURI ? ' on' : ''}" data-v="${esc(v.voiceURI)}" role="button" tabindex="0">
        <span class="sett"><b>${esc(v.name)}</b><small>${esc(v.lang)} · ${esc(U.phoneTag)}</small></span>${cur === v.voiceURI ? chip(U.inUse) : ''}${play(v.voiceURI)}</div>`).join('')
      : `<div class="card setv off"><span class="sett"><b>${esc(APP.t(U.noPhone, { lang: L.name }))}</b></span></div>`;
    const how = `<details class="sethow"><summary>${esc(U.how)}</summary><p><b>Android:</b> ${esc(U.howAndroid)}</p><p><b>iOS:</b> ${esc(U.howIos)}</p></details>`;
    let piper = '';
    if (id) {
      const total = st.size == null || st.sizeOf !== id ? '…' : mb(st.size), name = `<span class="sett"><b>${esc(U.piper)}</b><small>${esc(U.piperTag)}</small></span>`;
      if (has) piper = st.ask
        ? `<div class="card setv"><span class="sett"><b>${esc(U.delAsk)}</b></span><button id="setdel" class="pill small danger">${esc(U.del)}</button><button id="setkeep" class="pill small">${esc(U.cancel)}</button></div>`
        : `<div class="card setv${cur === `piper:${id}` ? ' on' : ''}" data-v="piper:${esc(id)}" role="button" tabindex="0">${name}${cur === `piper:${id}` ? chip(U.inUse) : ''}${play(`piper:${id}`)}
            <button id="setrm" class="rbtn small" aria-label="${esc(U.del)}">🗑</button></div>`;
      else if (st.busy != null) piper = `<div class="card setv"><span class="sett"><b>${esc(U.piper)}</b><small>${esc(APP.t(U.progress, { p: st.busy, got: mb(st.got), total }))}</small>
          <progress max="100" value="${st.busy}"></progress></span><button id="setstop" class="pill small">${esc(U.cancel)}</button></div>`;
      else piper = `<div class="card setv off">${name}<button id="setdl" class="pill small primary"${PIPER.ok() && navigator.onLine !== false ? '' : ' disabled'}>${esc(st.err ? U.retry : APP.t(U.download, { mb: total }))}</button></div>
          ${st.err ? `<p class="label sethint">${esc(st.err)}</p>` : ''}${navigator.onLine === false ? `<p class="label sethint">${esc(U.offline)}</p>` : ''}`;
    }
    return `${langs()}<div class="label caps">${esc(U.phone)}</div><p class="label sethint">${esc(U.phoneHint)}</p>${how}${phone}
      ${piper ? `<div class="label caps">${esc(U.more)}</div>${piper}` : ''}`;
  }
  const code = () => APP.L().code;
  const fold = t => t.toLocaleLowerCase(APP.L().bcp47).normalize('NFD').replace(/\p{M}/gu, '');
  const fixes = () => PRON.fixes(code(), SPEECH.voice);
  const low = t => t.toLocaleLowerCase(APP.L().bcp47);
  const ipaOk = () => !!SPEECH.engine || !!(APP.L().ssml && SPEECH.voice && APP.L().ssml.test(SPEECH.voice.voiceURI));
  const entry = k => PRON.entries(code()).find(e => e.key === k);
  const formsOf = e => PRON.rowsOf(e, code());
  const nFixed = e => { const f = fixes(); return formsOf(e).filter(r => f[low(r.form)]).length; };
  function opts(r) {
    const U = S(), out = [{ k: 'now', label: U.asNow }];
    PRON.KINDS.forEach(k => { if (r[k] && (k !== 'ipa' || ipaOk())) out.push({ k, label: APP.t(U.version, { n: out.length + 1 }), text: k === 'ipa' ? r.ph : r[k] }); });
    return out;
  }
  async function raw(text, ph) {
    hush();
    if (SPEECH.engine) {
      const id = APP.L().piper; await PIPER.load(id);
      const { data, rate } = ph ? { data: await PIPER.pcm(await PIPER.ipaIds(ph)), rate: (await PIPER.ready).cfg.audio.sample_rate } : await PIPER.render(text, null);
      return PIPER.play(data, rate);
    }
    if (!SPEECH.voice || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(ph ? PRON.ssml(ph, text) : text);
    u.voice = SPEECH.voice; u.lang = SPEECH.voice.lang; u.rate = SPEECH.rate; u.pitch = SPEECH.pitch;
    speechSynthesis.speak(u);
  }
  function pron() {
    const U = S(), q = fold(st.q.trim()), all = PRON.entries(code());
    const hits = st.all ? all : q ? all.filter(e => formsOf(e).some(r => fold(r.form).includes(q))) : [];
    const rows = hits.map(e => { const w = e.w.split('/').join(''), n = nFixed(e);
      return `<div class="card setv" data-word="${esc(e.key)}" role="button" tabindex="0"><span class="setpic">${CONTENT.pic(e.id)}</span><span class="sett"><b>${esc(w)}</b></span>${n ? `<span class="chip">${esc(U.fixed)}</span>` : ''}${play(`say:${w}`)}<span class="go">${APP.icon('next')}</span></div>`; }).join('');
    return `<input id="setq" class="card setq" type="search" placeholder="${esc(U.search)}" value="${esc(st.q)}" autocomplete="off" spellcheck="false" enterkeyhint="search">
      ${!q && !st.all ? `<p class="label sethint">${esc(U.searchHint)}</p><button id="setall" class="pill link">${esc(APP.t(U.showAll, { n: all.length }))}</button>`
        : rows || `<p class="label sethint">${esc(U.noResult)}</p>`}${send()}`;
  }
  function word() {
    const U = S(), e = entry(st.word), w = e.w.split('/').join(''), f = fixes();
    const forms = formsOf(e).map((r, i) => {
      const cur = f[low(r.form)], sel = !cur ? 'now' : cur.k === 'own' || (cur.k === 'ipa' && cur.text !== r.ph) ? 'own' : cur.k;
      const head = `<div class="card setv"><span class="sett"><b>${esc(r.form)}</b></span>${cur ? `<span class="chip">${esc(U.fixed)}</span>` : ''}${play(`say:${r.form}`)}<button class="pill small" data-fix="${i}">${esc(U.fix)}</button></div>`;
      if (st.open !== i) return head;
      return `${head}<div class="setopts"><div class="label">${esc(U.which)}</div>
        ${opts(r).map(o => `<div class="card setv${sel === o.k ? ' on' : ''}" data-opt="${i}:${o.k}" role="button" tabindex="0"><span class="sett"><b>${esc(o.label)}</b></span>${sel === o.k ? `<span class="chip">${esc(U.inUse)}</span>` : ''}${play(`opt:${i}:${o.k}`)}</div>`).join('')}
        <div class="card setv setown${sel === 'own' ? ' on' : ''}"><span class="sett"><b>${esc(U.noneRight)}</b><input id="setown" class="setq" placeholder="${esc(U.write)}" value="${esc(sel === 'own' ? cur.text : '')}" autocomplete="off" spellcheck="false"></span>
          ${play(`own:${i}`)}<button class="pill small primary" data-use="${i}">${esc(U.use)}</button></div>
        <button class="pill link" data-restore="${i}">${esc(U.restore)}</button>
        <details class="sethow"><summary>${esc(U.advanced)}</summary>${opts(r).filter(o => o.text).map(o => `<p><b>${esc(o.label)}:</b> ${esc(o.k === 'ipa' ? `/${o.text}/` : o.text)}</p>`).join('')}</details></div>`;
    }).join('');
    return `<div class="card setv setword"><span class="setpic">${CONTENT.pic(e.id)}</span><span class="sett"><b>${esc(w)}</b></span>${play(`say:${w}`)}</div>
      <div class="label caps">${esc(U.forms)}</div>${forms}${send()}`;
  }
  const mine = () => Object.entries(fixes());
  const send = () => { const n = mine().length; return n ? `<button id="setsend" class="pill primary setsend">${esc(APP.t(S().send, { n }))}</button>` : ''; };
  function report() {
    const v = SPEECH.voice, L = APP.L();
    return [`ABC 123! · ${CFG.version} · ${self.MANIFEST.version}`, `${L.name} (${L.bcp47}) · ${v ? `${v.name} · ${v.voiceURI}` : '—'}`, navigator.userAgent, '',
      ...mine().map(([w, x]) => `- ${w} → ${x.k === 'ipa' ? `/${x.text}/` : x.text} (${x.k})`), '', S().shareNote].join('\n');
  }
  function apply(form, fix) { PRON.setFix(code(), SPEECH.voice, form, fix); APP.pickVoice(); note(S().saved); draw(); }
  async function draw() {
    if ($('settings').hidden) return;
    const U = S(), v = st.view;
    $('settitle').textContent = v === 'home' ? U.title : v === 'voice' ? U.voice : U.pron;
    $('setback').hidden = v === 'home';
    $('setclose').hidden = v !== 'home';
    const focus = document.activeElement && document.activeElement.id === 'setq';
    $('setbody').innerHTML = v === 'home' ? await home() : v === 'voice' ? await voice() : v === 'word' ? word() : pron();
    if (v === 'pron' && (focus || st.focus)) { const q = $('setq'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); st.focus = false; }
  }
  function go(v) { st.view = v; st.ask = false; st.open = -1; if (v === 'pron') st.focus = true; note(''); draw(); }
  async function choose(uri) {
    store.set(key(), uri);
    const id = APP.L().piper;
    if (id && uri === `piper:${id}`) { await PIPER.load(id); PIPER.live = id; }
    APP.pickVoice(); draw(); say();
  }
  async function listen(uri) {
    const id = APP.L().piper;
    if (id && uri === `piper:${id}`) { await PIPER.load(id); return PIPER.engine(id).say(S().sample); }
    const v = voices().find(x => x.voiceURI === uri);
    if (!v) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(S().sample); u.voice = v; u.lang = v.lang; u.rate = SPEECH.rate; u.pitch = SPEECH.pitch;
    speechSynthesis.speak(u);
  }
  function download() {
    const id = APP.L().piper;
    st.busy = 0; st.got = 0; st.err = null; st.ctl = 'AbortController' in window ? new AbortController() : null; draw();
    PIPER.download(id, p => { st.busy = Math.round(p * 100); st.got = p * (st.size || 0); const b = document.querySelector('#setbody progress'); if (b) { b.value = st.busy; b.previousElementSibling.textContent = APP.t(S().progress, { p: st.busy, got: mb(st.got), total: mb(st.size || 0) }); } }, st.ctl && st.ctl.signal)
      .then(() => { st.busy = null; st.sizeOf = null; return choose(`piper:${id}`); },
        x => { st.busy = null; st.err = x && x.name === 'AbortError' ? null : x && x.name === 'QuotaExceededError' ? APP.t(S().full, { mb: mb(st.size || 0) }) : S().failed; draw(); });
  }
  function open() { APP.stop(); st.view = 'home'; $('settings').hidden = false; sfx.pop(); note(''); draw(); }
  function close() { $('settings').hidden = true; }
  onTap('setbtn', open); onTap('setclose', close);
  onTap('setback', () => go(st.view === 'word' ? 'pron' : 'home'));
  onTapIn('setbody', '.setl', b => { setLang(b.dataset.l); st.sizeOf = null; draw(); });
  onTapIn('setbody', '.setn', b => go(b.dataset.go));
  onTapIn('setbody', '[data-play]', b => {
    const p = b.dataset.play;
    if (p.startsWith('say:')) return speak(p.slice(4));
    if (p.startsWith('own:')) { const t = (($('setown') || {}).value || '').trim(), r = formsOf(entry(st.word))[+p.split(':')[1]]; return t && (PRON.IPA.test(t) ? raw(r.form, PRON.bare(t)) : raw(t)); }
    if (p.startsWith('opt:')) {
      const [, i, k] = p.split(':'), r = formsOf(entry(st.word))[+i];
      return k === 'now' ? speak(r.form) : k === 'ipa' ? raw(r.form, r.ph) : raw(r[k]);
    }
    return listen(p);
  });
  onTapIn('setbody', '.setv[data-word]', (b, e) => { if (!e.target.closest('button')) { st.word = b.dataset.word; st.open = -1; st.view = 'word'; note(''); draw(); } });
  onTapIn('setbody', '[data-fix]', b => { st.open = st.open === +b.dataset.fix ? -1 : +b.dataset.fix; draw(); });
  onTapIn('setbody', '.setv[data-opt]', (b, e) => {
    if (e.target.closest('button')) return;
    const [i, k] = b.dataset.opt.split(':'), r = formsOf(entry(st.word))[+i];
    apply(r.form, k === 'now' ? null : { k, text: k === 'ipa' ? r.ph : r[k] });
    if (k === 'now') speak(r.form); else if (k === 'ipa') raw(r.form, r.ph); else raw(r[k]);
  });
  onTapIn('setbody', '[data-use]', b => {
    const t = (($('setown') || {}).value || '').trim(), r = formsOf(entry(st.word))[+b.dataset.use];
    if (t) apply(r.form, PRON.IPA.test(t) ? { k: 'ipa', text: PRON.bare(t) } : { k: 'own', text: t });
  });
  onTapIn('setbody', '[data-restore]', b => { const r = formsOf(entry(st.word))[+b.dataset.restore]; apply(r.form, { k: 'orig', text: r.form }); speak(r.form); });
  onTapIn('setbody', '#setall', () => { st.all = true; draw(); });
  onTapIn('setbody', '#setsend', () => { const t = report(); (navigator.share ? navigator.share({ title: S().pron, text: t }) : Promise.reject()).catch(() => navigator.clipboard && navigator.clipboard.writeText(t).then(() => note(S().copied))); });
  $('setbody').addEventListener('input', e => { if (e.target.id === 'setq') { st.q = e.target.value; st.all = false; draw(); } });
  onTapIn('setbody', '.setv[data-v]', (b, e) => { if (!e.target.closest('button')) choose(b.dataset.v); });
  $('setbody').addEventListener('keydown', e => { if (e.target.matches && e.target.matches('.setv[role=button]') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.target.click(); } });
  onTapIn('setbody', '#setdl', download);
  onTapIn('setbody', '#setstop', () => { if (st.ctl) st.ctl.abort(); });
  onTapIn('setbody', '#setrm', () => { st.ask = true; draw(); });
  onTapIn('setbody', '#setkeep', () => { st.ask = false; draw(); });
  onTapIn('setbody', '#setdel', () => {
    const id = APP.L().piper, was = store.get(key(), null) === `piper:${id}`;
    PIPER.remove(id).then(() => { if (was) { store.set(key(), null); note(S().switched); } st.ask = false; st.sizeOf = null; APP.pickVoice(); draw(); });
  });
  if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', () => { if (st.view === 'voice') draw(); });
  window.addEventListener('online', draw); window.addEventListener('offline', draw);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('settings').hidden) { if (st.view === 'home') close(); else go('home'); } });
  APP.settings = { open, close, draw };
})();
