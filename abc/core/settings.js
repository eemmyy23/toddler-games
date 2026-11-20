(function () {
  const st = { size: null, busy: null, err: false, sizeOf: null };
  const S = () => APP.ui().settings, key = () => `voice.${APP.L().code}`;
  const voices = () => {
    const base = APP.L().bcp47.toLowerCase().split('-')[0];
    return 'speechSynthesis' in window ? speechSynthesis.getVoices().filter(v => SPEECH.norm(v).split('-')[0] === base) : [];
  };
  const row = (uri, name, on) => `<button class="card setv${on ? ' on' : ''}" data-v="${esc(uri)}">${esc(name)}</button>`;
  async function render() {
    const L = APP.L(), U = S(), cur = SPEECH.voice && SPEECH.voice.voiceURI, id = L.piper, has = id && await PIPER.has(id);
    const dl = st.busy != null ? APP.t(U.downloading, { p: st.busy }) : st.err ? U.failed : U.download;
    $('settitle').textContent = U.title;
    $('setbody').innerHTML = `<div class="label caps">${esc(U.voice)}</div>
      <div class="label">${esc(U.phone)}</div>
      ${voices().map(v => row(v.voiceURI, `${v.name} · ${v.lang}`, cur === v.voiceURI)).join('') || `<div class="label">${esc(APP.ui().noVoice)}</div>`}
      <p class="label sethint">${esc(U.phoneHint)}</p>
      ${id ? `<div class="label">${esc(U.piper)}</div>${has
        ? `${row(`piper:${id}`, APP.t(U.piperName, { id }), cur === `piper:${id}`)}<button id="setrm" class="pill small">${esc(U.remove)}</button>`
        : `<p class="label sethint">${esc(APP.t(U.piperHint, { mb: st.size == null || st.sizeOf !== id ? '…' : Math.round(st.size / 1e6) }))}</p>
           <button id="setdl" class="pill primary"${st.busy != null || !PIPER.ok() ? ' disabled' : ''}>${esc(dl)}</button>`}` : ''}
      <button id="settest" class="pill link">${esc(U.test)}</button>`;
    if (id && !has && st.sizeOf !== id && PIPER.ok()) { st.sizeOf = id; st.size = null; PIPER.size(id).then(n => { st.size = n; if (!$('settings').hidden) render(); }); }
  }
  async function choose(uri) {
    store.set(key(), uri);
    const id = APP.L().piper;
    if (id && uri === `piper:${id}`) { await PIPER.load(id); PIPER.live = id; }
    APP.pickVoice(); render(); speak(S().sample);
  }
  function test() {
    $('setbody').innerHTML = `<button id="setback" class="pill">${APP.icon('back')} ${esc(S().voice)}</button>
      <iframe class="settest" title="${esc(S().test)}" src="${esc(CFG.testPage)}?embed=1&amp;lang=${encodeURIComponent(APP.L().code)}"></iframe>`;
  }
  const leaveTest = () => { if (document.querySelector('.settest')) APP.pickVoice(); };
  function open() { APP.stop(); $('settings').hidden = false; sfx.pop(); render(); }
  function close() { leaveTest(); $('settings').hidden = true; }
  onTap('setbtn', open); onTap('setclose', close);
  onTapIn('setbody', '.setv', b => choose(b.dataset.v));
  onTapIn('setbody', '#settest', test);
  onTapIn('setbody', '#setback', () => { leaveTest(); render(); });
  onTapIn('setbody', '#setdl', () => {
    const id = APP.L().piper; st.busy = 0; st.err = false; render();
    PIPER.download(id, p => { st.busy = Math.round(p * 100); const b = $('setdl'); if (b) b.textContent = APP.t(S().downloading, { p: st.busy }); })
      .then(() => { st.busy = null; return choose(`piper:${id}`); }, () => { st.busy = null; st.err = true; render(); });
  });
  onTapIn('setbody', '#setrm', () => {
    const id = APP.L().piper;
    PIPER.remove(id).then(() => { if (store.get(key(), null) === `piper:${id}`) store.set(key(), null); st.sizeOf = null; APP.pickVoice(); render(); });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  APP.settings = { open, close, render };
})();
