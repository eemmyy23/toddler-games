(function () {
  const st = { view: 'home', size: null, sizeOf: null, busy: null, got: 0, err: null, ctl: null, ask: false };
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
  function pron() {
    return `<iframe class="settest" title="${esc(S().pron)}" src="${esc(CFG.testPage)}?embed=1&amp;lang=${encodeURIComponent(APP.L().code)}"></iframe>`;
  }
  async function draw() {
    if ($('settings').hidden) return;
    const U = S(), v = st.view;
    $('settitle').textContent = v === 'home' ? U.title : v === 'voice' ? U.voice : U.pron;
    $('setback').hidden = v === 'home';
    $('setclose').hidden = v !== 'home';
    $('setbody').innerHTML = v === 'home' ? await home() : v === 'voice' ? await voice() : pron();
  }
  function go(v) { if (st.view === 'pron') APP.pickVoice(); st.view = v; st.ask = false; note(''); draw(); }
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
  function close() { if (st.view === 'pron') APP.pickVoice(); $('settings').hidden = true; }
  onTap('setbtn', open); onTap('setclose', close);
  onTap('setback', () => go('home'));
  onTapIn('setbody', '.setl', b => { setLang(b.dataset.l); st.sizeOf = null; draw(); });
  onTapIn('setbody', '.setn', b => go(b.dataset.go));
  onTapIn('setbody', '[data-play]', b => listen(b.dataset.play));
  onTapIn('setbody', '.setv[data-v]', (b, e) => { if (!e.target.closest('button')) choose(b.dataset.v); });
  $('setbody').addEventListener('keydown', e => { const b = e.target.closest('.setv[data-v]'); if (b && e.target === b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); choose(b.dataset.v); } });
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
