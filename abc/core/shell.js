// ====== SHELL — navigation, hubs, age profiles, language switch, info cards, index, input ======
// Knows no subject, language or screen by name: everything comes from ABC.config, ABC.modules, ABC.views, ABC.games.
'use strict';
const CFG = ABC.config;
const LANGS = CFG.languages.filter(c => ABC.langs[c] && ABC.langs[c].forms);
const SECTIONS = Object.fromEntries(CFG.sections.map(s => [s.id, s]));
const MODULES = CFG.modules.map(id => ABC.modules.find(m => m.id === id)).filter(Boolean);
// every tile of every module, with its section and module
const TILES = MODULES.flatMap(m => (m.tiles || []).map(t => Object.assign({ section: m.section, module: m }, t)));
const TILE = Object.fromEntries(TILES.map(t => [t.id, t]));

// ---- state ----
const defaultLang = () => { const nav = (navigator.language || '').toLowerCase(); return LANGS.find(c => nav === c || nav.startsWith(c + '-')) || LANGS[0]; };
let lang = store.get('lang', store.legacy('lang') || defaultLang()); if (!LANGS.includes(lang)) lang = LANGS[0];
let profile = store.get('profile', CFG.defaultProfile); if (!CFG.profiles[profile]) profile = CFG.defaultProfile;
let section = store.get('sec', CFG.sections[0].id); if (!SECTIONS[section]) section = CFG.sections[0].id;
let atHub = store.get('athub', true), tileId = store.get('tile', TILES[0].id), mode = store.get('mode', 'view');
if (!TILE[tileId]) { tileId = TILES[0].id; atHub = true; }
let started = false;
const contentCache = {};
function content(code) {
  if (!contentCache[code]) contentCache[code] = Object.assign({}, ...MODULES.filter(m => m.build && m.strings[code]).map(m => m.build(code)));
  return contentCache[code];
}

// ---- APP: what views and games use ----
const APP = {
  idx: 0, streak: 0, stars: store.get('stars', store.legacy('stars') || 0),
  L: () => ABC.langs[lang],
  S: () => content(lang),
  ui: () => abcMerge(abcMerge({}, ABC.langs[CFG.baseLanguage].strings), ABC.langs[lang].strings),
  t: (tpl, vars) => I18N.t(tpl, vars, ABC.langs[lang].bcp47),
  mt(key, vars) { // a string of the current tile's module, e.g. 'games.letters'
    const s = key.split('.').reduce((o, k) => o && o[k], tileOf().module.strings[lang]);
    return I18N.t(s, vars, ABC.langs[lang].bcp47);
  },
  tile: () => tileOf(),
  items: () => itemsOf(tileOf()),
  gameItems: () => gameItemsOf(tileOf()),
  screen: () => atHub ? 'hub' : mode === 'play' ? 'play' : tileOf().view,
  saveIdx() { const it = APP.items()[APP.idx]; if (it) store.set('pos_' + tileId, it.id); },
  firstTouch, infoButton: c => infoFor(c) ? `<button class="infobtn" data-c="${esc(c)}">📖 ${esc(APP.ui().info)}</button>` : '',
  addStar() { APP.stars++; store.set('stars', APP.stars); const s = $('stars'); s.textContent = '⭐ ' + APP.stars; s.animate([{ transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 400 }); }
};
const tileOf = () => TILE[tileId];
const itemsOf = t => t.items ? t.items(content(lang)) || [] : [];
const gameItemsOf = t => t.game ? ((t.game.items || t.items)(content(lang)) || []).filter(it => !it.noPlay) : [];
const view = () => ABC.views[APP.screen()];
const label = (t, i) => { const s = t.module.strings[lang]; return s && s.tiles && s.tiles[t.id] ? s.tiles[t.id][i] : null; };
// availability — a tile is never shown broken: needs its text in this language and enough items
const learnOk = t => !!(t.view && ABC.views[t.view] && label(t, 0) && itemsOf(t).length);
const gameOk = t => !!(learnOk(t) && t.game && ABC.games[t.game.type] && label(t, 1) &&
  ABC.games[t.game.type].pool(gameItemsOf(t), 99).length >= (ABC.games[t.game.type].needs || 2));
// cumulative: a profile shows every module that starts at or below its upper age (a curious 3-year-old on 🚵 still has numbers)
const ageOk = t => (t.module.ages || [0])[0] <= CFG.profiles[profile][1];
const littleProfile = () => profile === CFG.defaultProfile;
// a tile is listed if: right age, has its label in this language, and it works —
// or it is planned ("coming soon"), which is shown only outside the Little profile (a toddler can't tell "soon" from "broken")
function listed(t, play) {
  if (!ageOk(t) || !label(t, play ? 1 : 0)) return false;
  if (play ? gameOk(t) : learnOk(t)) return true;
  return !littleProfile() && (!t.view || (play && !t.game));
}
function loadIdx() {
  const list = APP.items(), id = store.get('pos_' + tileId, null), i = list.findIndex(it => it.id === id);
  APP.idx = i >= 0 ? i : 0;
}

// ---- hubs ----
function hubTiles() {
  if (!SECTIONS[section].play) return TILES.filter(t => t.section === section && listed(t, false)).map(t => ({ t, ok: learnOk(t), lbl: label(t, 0), play: false }));
  const out = [];
  for (const s of CFG.sections.filter(s => !s.play)) {
    const games = TILES.filter(t => t.section === s.id && listed(t, true)).map(t => ({ t, ok: gameOk(t), lbl: label(t, 1), play: true }));
    if (games.length) out.push({ header: s }, ...games);
  }
  return out;
}
function renderHub() {
  const U = APP.ui();
  $('hub').innerHTML = hubTiles().map(x => x.header
    ? `<div class="hh">${x.header.icon} ${esc(U.sections[x.header.id])}</div>`
    : `<button class="ht${x.ok ? '' : ' soon'}" data-id="${x.t.id}" data-play="${x.play ? 1 : 0}">${x.ok ? '' : `<span class="badge">${esc(U.soon)}</span>`}` +
      `<span class="hp"${x.t.icon.length > 3 ? ' style="font-size:34px;font-weight:700;color:var(--amber)"' : ''}>${x.t.icon}</span><span class="hl">${esc(x.lbl)}</span></button>`).join('');
}
function openTile(id, play, quiet) {
  const t = TILE[id]; if (!t || !(play ? gameOk(t) : learnOk(t))) return false;
  if (view() && view().leave) view().leave();
  if (id !== tileId || (play ? 'play' : 'view') !== mode) ABC.views.play.reset();
  tileId = id; mode = play ? 'play' : 'view'; atHub = false; APP.streak = 0;
  store.set('tile', id); store.set('mode', mode); store.set('athub', false);
  loadIdx(); if (!quiet) sfx.pop(); render();
  return true;
}
$('hub').addEventListener('click', e => {
  const b = e.target.closest('.ht'); if (!b) return;
  firstTouch();
  if (b.classList.contains('soon')) { const l = b.querySelector('.hl').textContent; speak(l + (/[.!?。？！]$/.test(l) ? ' ' : '. ') + APP.ui().soon); return; }
  openTile(b.dataset.id, b.dataset.play === '1');
});
function goHub() { if (view() && view().leave) view().leave(); atHub = true; store.set('athub', true); sfx.pop(); render(); speak(APP.ui().sections[section] + '!', 80); }
function setSection(id) {
  if (id === section) { if (!atHub) goHub(); return; } // tap the active tab → back to its hub
  if (view() && view().leave) view().leave();
  section = id; store.set('sec', id); atHub = true; store.set('athub', true);
  sfx.pop(); render(); speak(APP.ui().sections[id] + '!', 80);
}

// ---- render ----
const VIEW_ELS = [...new Set(Object.values(ABC.views).map(v => v.el))];
function render() {
  const U = APP.ui(), L = APP.L();
  CFG.sections.forEach(s => { const b = $('t-' + s.id); b.classList.toggle('on', section === s.id); b.querySelector('.tl').textContent = U.sections[s.id]; });
  document.querySelectorAll('.flag').forEach(f => f.classList.toggle('on', f.dataset.lang === lang));
  document.querySelectorAll('.age').forEach(b => { const on = b.dataset.p === profile; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); b.setAttribute('aria-label', U.profile[b.dataset.p]); });
  document.documentElement.lang = L.bcp47; document.documentElement.dir = L.dir || 'ltr';
  if (!atHub && !(mode === 'play' ? gameOk(tileOf()) : learnOk(tileOf()))) atHub = true; // e.g. letter groups exist only in Romanian
  const sc = APP.screen(), v = view();
  document.body.dataset.sec = section; document.body.dataset.mode = sc;
  document.body.classList.toggle('topic', !atHub);
  document.body.classList.toggle('idx', !atHub && mode !== 'play' && !!tileOf().index);
  $('barback').innerHTML = `‹ ${SECTIONS[section].icon}`;
  $('stars').textContent = '⭐ ' + APP.stars;
  $('hub').style.display = sc === 'hub' ? 'grid' : 'none';
  VIEW_ELS.forEach(el => { $(el).style.display = v && v.el === el ? (v.fullHeight ? 'block' : 'flex') : 'none'; });
  $('stage').style.display = v && v.fullHeight ? 'none' : 'flex';
  $('prev').style.display = $('next').style.display = v && v.arrows ? 'block' : 'none';
  $('rnav').style.display = v && v.nav === 'rnav' ? 'flex' : 'none';
  closeIndex(); closeInfo();
  if (sc === 'hub') renderHub(); else v.show(started);
}

// ---- language switch: same item / same question, then announce ----
function setLang(code) {
  if (code === lang) { sfx.pop(); render(); announce(); return; } // tap the current flag → repeat
  const keepId = !atHub && APP.items()[APP.idx] && APP.items()[APP.idx].id;
  const playState = !atHub && mode === 'play' ? ABC.views.play.beforeLang() : null;
  const scroll = $('count').scrollTop;
  lang = code; store.set('lang', code); SPEECH.pick(APP.L().bcp47); markVoices();
  if (!atHub) {
    const list = APP.items(), i = list.findIndex(it => it.id === keepId);
    if (i >= 0) APP.idx = i; else loadIdx();
    if (playState) ABC.views.play.afterLang(playState);
  }
  sfx.pop(); render();
  if (view() && view().keepScroll) $(view().el).scrollTop = scroll;
  announce();
}
function announce() { const name = APP.L().name; if (atHub) speak(`${name}!`, 120); else view().announce(name); }

// ---- "What is it?" cards: appear wherever an item's concept has a card in this language ----
let infoId = null, infoTok = 0;
const infoFor = c => c && APP.L().info[c] ? APP.L().info[c] : null;
function openInfo(c) {
  const I = infoFor(c); if (!I) return;
  infoId = c; $('infotitle').textContent = I.title;
  $('infolist').innerHTML = I.lines.map(([e, t], i) => `<button class="inf" data-i="${i}"><span class="ie">${e}</span><span>${esc(t)}</span></button>`).join('');
  $('info').classList.add('open'); sfx.pop(); speak(I.title, 100);
}
function closeInfo() { infoTok++; $('info').classList.remove('open'); }
const lightInf = i => document.querySelectorAll('.inf').forEach(b => b.classList.toggle('lit', +b.dataset.i === i));
document.addEventListener('pointerdown', e => { const b = e.target.closest('.infobtn'); if (!b) return; e.preventDefault(); e.stopPropagation(); firstTouch(); openInfo(b.dataset.c); }, true);
$('infolist').addEventListener('click', e => { const b = e.target.closest('.inf'); if (!b) return; firstTouch(); infoTok++; lightInf(+b.dataset.i); speak(infoFor(infoId).lines[+b.dataset.i][1], 40); });
async function playInfo() {
  const tok = ++infoTok, I = infoFor(infoId);
  for (let i = 0; i < I.lines.length; i++) {
    if (tok !== infoTok) return;
    lightInf(i); document.querySelector(`.inf[data-i="${i}"]`).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    await speak(I.lines[i][1], i ? 250 : 80);
  }
  if (tok === infoTok) { lightInf(-1); sfx.right(); }
}

// ---- index (⊞): every item of the current tile; sorted with the language's collation when the view asks ----
function openIndex() {
  const v = view(), list = APP.items().map((it, i) => ({ it, i }));
  if (v.indexSort) { const col = I18N.collator(APP.L().bcp47); list.sort((a, b) => col.compare(a.it.w || a.it.label, b.it.w || b.it.label)); }
  $('ixgrid').innerHTML = list.map(({ it, i }) => `<button class="ix${i === APP.idx ? ' on' : ''}" data-i="${i}">${v.indexFace(it)}</button>`).join('');
  $('index').classList.add('open');
  const on = $('ixgrid').querySelector('.on'); if (on) on.scrollIntoView({ block: 'center' });
  sfx.pop();
}
const closeIndex = () => $('index').classList.remove('open');
$('ixgrid').addEventListener('click', e => { const b = e.target.closest('.ix'); if (!b) return; firstTouch(); closeIndex(); APP.idx = +b.dataset.i; sfx.pop(); view().show(true); });

// ---- age profiles: three bikes in the top bar, visible on every hub; anyone may switch ----
const K = '#ffc94d', BW = '#e8ecff', SKIN = '#f2c49b';
const wheel = (x, y, r, knob) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${BW}" stroke-width="${knob ? 3.2 : 2.4}"${knob ? ' stroke-dasharray="2.2 1.6"' : ''}/><circle cx="${x}" cy="${y}" r="1.3" fill="${BW}"/>`;
const rider = (hx, hy, limbs, helmet) => `<circle cx="${hx}" cy="${hy}" r="4.2" fill="${SKIN}"/>` +
  (helmet ? `<path d="M${hx - 4.6} ${hy - 0.5} a4.6 4.6 0 0 1 9.2 0 z" fill="${K}"/>` : `<path d="M${hx - 4.2} ${hy - 1} a4.2 4.2 0 0 1 8.4 0 q-4 -2 -8.4 0z" fill="#8a5a3c"/>`) +
  `<path d="${limbs}" fill="none" stroke="${K}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
const frame = (d, c) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
const AGE_ICON = { // balance bike · training wheels · mountain bike
  little: wheel(11, 31, 6.5) + wheel(37, 31, 6.5) + frame('M11 31 L20 23 L33 23 L37 31 M33 23 L31 15 M28 15 h6', '#7fb4ff') +
    `<path d="M17 22 h7" stroke="${K}" stroke-width="3" stroke-linecap="round"/>` + rider(22, 8, 'M21 13 L21 21 M21 15 L30 16 M21 21 L18 30 L16 37 M21 21 L26 29 L27 37'),
  explorer: wheel(11, 29, 8) + wheel(37, 29, 8) + wheel(3, 34, 3.4) + `<path d="M11 29 L3 34" stroke="${BW}" stroke-width="2"/>` +
    frame('M11 29 L19 18 L32 18 L37 29 M19 18 L23 29 L32 18 M32 18 L30 11 M27 11 h6', '#93d98f') +
    `<path d="M16 16 h6" stroke="${K}" stroke-width="3" stroke-linecap="round"/>` + rider(21, 4.5, 'M20 9 L20 16 M20 11 L29 12 M20 16 L25 23 L23 29'),
  scientist: wheel(10, 29, 9, 1) + wheel(38, 29, 9, 1) + frame('M10 29 L19 17 L33 16 L38 29 M19 17 L24 29 L33 16 M33 16 L31 9 M28 9 h7', '#f38fc4') +
    `<path d="M34.5 20 L36.5 25" stroke="${BW}" stroke-width="2.4" stroke-linecap="round"/><path d="M15 15 h6" stroke="${K}" stroke-width="3" stroke-linecap="round"/>` +
    rider(26, 4.5, 'M24 8 L18 14 M22 10 L31 10 M18 14 L25 21 L24 29', 1)
};
$('ages').innerHTML = Object.keys(CFG.profiles).map(p => { const [a, b] = CFG.profiles[p];
  return `<button class="age" data-p="${p}" role="radio"><svg viewBox="-2 -3 52 43" aria-hidden="true">${AGE_ICON[p] || ''}</svg><small>${a}–${b}</small></button>`; }).join('');
function setProfile(p) {
  if (!CFG.profiles[p]) return;
  profile = p; store.set('profile', p); atHub = true; store.set('athub', true);
  sfx.pop(); render(); speak(APP.ui().profile[p] + '!', 80);
}

// ---- chrome from config ----
$('flags').innerHTML = LANGS.map(c => `<button class="flag" data-lang="${c}" aria-label="${esc(ABC.langs[c].name)}">${ABC.langs[c].flag}<i class="nv">🔇</i></button>`).join('');
$('tabs').innerHTML = CFG.sections.map(s => `<button class="tab" id="t-${s.id}"><span class="ti">${s.icon}</span><span class="tl"></span></button>`).join('');
// a language whose device has no voice at all gets a 🔇 mark (text still shown; never read by another language's voice)
function markVoices() {
  if (!('speechSynthesis' in window)) return;
  const all = speechSynthesis.getVoices(); if (!all.length) return;
  document.querySelectorAll('.flag').forEach(f => {
    const base = ABC.langs[f.dataset.lang].bcp47.toLowerCase().split('-')[0];
    f.classList.toggle('novoice', !all.some(v => v.lang.replace('_', '-').toLowerCase().split('-')[0] === base));
  });
}
SPEECH.pick(APP.L().bcp47);
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { SPEECH.pick(APP.L().bcp47); markVoices(); };
markVoices();

// ---- input ----
function firstTouch() { if (started) return; started = true; ensureAudio(); }
addEventListener('pointerdown', firstTouch, true);
addEventListener('keydown', firstTouch, true);
function tapBtn(el, fn) { (typeof el === 'string' ? $(el) : el).addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); firstTouch(); fn(); }); }
document.querySelectorAll('.flag').forEach(f => tapBtn(f, () => setLang(f.dataset.lang)));
CFG.sections.forEach(s => tapBtn('t-' + s.id, () => setSection(s.id)));
tapBtn('barback', goHub);
tapBtn('prev', () => view().step(-1)); tapBtn('next', () => view().step(1));
tapBtn('rprev', () => view().step(-1)); tapBtn('rnext', () => view().step(1)); tapBtn('rplay', () => view().play());
tapBtn('infoclose', closeInfo); tapBtn('infoplay', playInfo);
tapBtn('gridbtn', openIndex); tapBtn('ixclose', closeIndex);
document.querySelectorAll('.age').forEach(b => tapBtn(b, () => setProfile(b.dataset.p)));
addEventListener('resize', () => { resizeFx(); if (!atHub && view().resize) view().resize(); });
let sx = null; // swipe on screens that page through items
$('stage').addEventListener('pointerdown', e => { sx = e.clientX; });
$('stage').addEventListener('pointerup', e => {
  const v = view(); if (sx == null || !v || !v.swipe) return;
  const dx = e.clientX - sx; sx = null;
  if (Math.abs(dx) > 50) v.step((dx < 0) !== (APP.L().dir === 'rtl') ? 1 : -1);
});
// keyboard: arrows page; a letter/digit goes to the view, or on a hub opens the tile that has it
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
  const k = e.key.toLocaleLowerCase(APP.L().bcp47), v = view();
  if ((k === 'arrowright' || k === 'arrowleft') && v && v.step) { v.step(k === 'arrowright' ? 1 : -1); return; }
  if (e.repeat) return;
  if (v && v.onKey && v.onKey(k, e)) return;
  if (k.length !== 1 && !/^\p{L}$/u.test(k)) return;
  const play = APP.screen() === 'play' || (atHub && SECTIONS[section].play);
  const t = TILES.find(t => (play || t.section === section) && listed(t, play) && (play ? gameOk(t) : learnOk(t) && t.view === 'card') &&
    (play ? gameItemsOf(t) : itemsOf(t)).some(it => it.key === k));
  if (!t || (t.id === tileId && !atHub)) return;
  openTile(t.id, play, true);
  if (view().onKey) view().onKey(k, e);
});
addEventListener('contextmenu', e => e.preventDefault());

loadIdx();
render();

// ---- PWA ----
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' });
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
}
(function () {
  const bar = $('install-bar'), btn = $('install-btn'), msg = $('install-msg'), dismiss = $('dismiss-btn');
  let deferred = null;
  if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) return;
  try { if (sessionStorage.getItem('install-dismissed')) return; } catch (e) {}
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; msg.textContent = APP.ui().install; bar.style.display = 'flex'; });
  bar.addEventListener('pointerdown', e => e.stopPropagation());
  btn.addEventListener('click', () => { if (!deferred) return; deferred.prompt(); deferred.userChoice.then(() => { deferred = null; bar.style.display = 'none'; }); });
  dismiss.addEventListener('click', () => { bar.style.display = 'none'; try { sessionStorage.setItem('install-dismissed', '1'); } catch (e) {} });
  addEventListener('appinstalled', () => { bar.style.display = 'none'; });
})();
