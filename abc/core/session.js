const SESSION = (function () {
  const C = ABC.config.session, S = () => APP.ui().session, sec = 1000, min = 60 * sec;
  const st = Object.assign({ used: 0, at: 0, rest: 0 }, store.get('session', {}));
  let last = 0, left = null, said = false, avg = C.round * sec, held = null, sum = null;
  const save = () => { st.at = Date.now(); store.set('session', st); };
  const limit = () => store.get('limit', C.minutes) * min;
  const resting = () => !$('rest').hidden;
  const active = () => !document.hidden && $('settings').hidden && !resting() && Date.now() - last < C.idle * sec;
  const remaining = () => limit() - st.used;
  const speaking = () => 'speechSynthesis' in window && speechSynthesis.speaking;
  function fresh() { st.used = 0; st.rest = 0; left = null; said = false; save(); }
  function tick() {
    if (!active()) return;
    st.used += sec; save();
    if (APP.screen() === 'play') { if (left == null && remaining() < C.windDown * avg) left = C.windDown; return; }
    if (!said && remaining() <= C.warn * sec) { said = true; speak(S().almost); }
    if (remaining() <= 0 && !speaking()) rest();
  }
  function lead() {
    if (left == null && remaining() <= 0 && APP.screen() === 'play') left = C.windDown;
    const L = S().left;
    return left == null ? null : L[Math.min(left, L.length) - 1];
  }
  function done(announced) {
    if (!announced || left == null) return false;
    if (--left > 0) return false;
    rest(); return true;
  }
  function rest(quiet) {
    APP.stop(); if (APP.settings) APP.settings.close();
    if (!st.rest) { st.rest = Date.now(); save(); }
    gate(false); draw(); $('rest').hidden = false;
    history.pushState({ rest: 1 }, '');
    if (!quiet) speak(S().done);
  }
  function draw() {
    const U = S(), wait = Math.max(0, Math.ceil((st.rest + C.breakMin * min - Date.now()) / min));
    $('restmsg').textContent = U.title;
    $('reststars').innerHTML = APP.stars ? `${APP.icon('star')} ${APP.stars}` : '';
    $('restwait').textContent = wait ? APP.t(U.wait, { n: wait }) : '';
    $('restgo').hidden = !!wait; $('restgo').textContent = U.again;
  }
  function wake() { fresh(); $('rest').hidden = true; gate(false); render(); }
  function gate(on) {
    $('restgate').hidden = !on;
    if (!on) return;
    const [lo, hi] = C.gate, r = () => lo + Math.floor(Math.random() * (hi - lo + 1)), a = r(), b = r();
    sum = a + b;
    const opts = shuffle([...new Set([sum, sum + 1, sum - 1, sum + 2, sum - 2])].slice(0, 4));
    $('restq').textContent = APP.t(S().sum, { a, b });
    $('restopts').innerHTML = opts.map(n => `<button class="pill" data-n="${n}">${n}</button>`).join('');
  }
  function hold(on) {
    clearTimeout(held); $('restlock').classList.toggle('hold', on);
    if (on) held = setTimeout(() => { $('restlock').classList.remove('hold'); gate(true); }, C.hold * sec);
  }
  $('rest').style.setProperty('--hold', `${C.hold}s`);
  $('restlock').addEventListener('pointerdown', e => { e.preventDefault(); hold(true); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(k => $('restlock').addEventListener(k, () => hold(false)));
  $('restlock').addEventListener('contextmenu', e => e.preventDefault());
  onTapIn('restopts', '[data-n]', b => { if (+b.dataset.n === sum) wake(); else gate(false); });
  onTap('restgo', wake);
  addEventListener('popstate', () => { if (resting()) history.pushState({ rest: 1 }, ''); });
  ['pointerdown', 'keydown'].forEach(k => addEventListener(k, () => { last = Date.now(); }, true));
  setInterval(() => { tick(); if (resting()) draw(); }, sec);
  function start() {
    if (st.rest && Date.now() - st.rest < C.breakMin * min) rest(true);
    else if (st.rest || Date.now() - st.at > C.breakMin * min) fresh();
  }
  return { start, lead, done, rest, wake, round: ms => { avg = avg * 0.7 + Math.min(ms, 4 * C.round * sec) * 0.3; }, used: () => st.used, limit };
})();
