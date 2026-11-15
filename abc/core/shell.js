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
const littleProfile = () => profile === CFG.defaultProfile;
// age: a tile's ages (or its module's); its profile is the one its start age falls in (start < upper: 4 → explorer, 7 → scientist).
// One rule for both: the badge shows that profile, and the tile is listed from that profile upwards (higher profiles add, never remove).
const PROFILES = Object.keys(CFG.profiles);
const tileProfile = t => { const start = (t.ages || t.module.ages || [0])[0];
  return PROFILES.find(p => start < CFG.profiles[p][1]) || PROFILES[PROFILES.length - 1]; };
const ageOk = t => PROFILES.indexOf(profile) >= PROFILES.indexOf(tileProfile(t));
const ageSVG = p => `<svg viewBox="0 0 32 32" aria-hidden="true"><g fill="none">${AGE_ICON[p] || ''}</g></svg>`;
// age badge on a tile: the profile's bike, placed left → right in profile order (little · explorer · scientist)
const ageBadge = t => { const p = tileProfile(t), i = PROFILES.indexOf(p);
  return `<span class="agebadge" data-p="${p}" style="--ax:${PROFILES.length > 1 ? i / (PROFILES.length - 1) : 0}" title="${esc(APP.ui().profile[p])}">${ageSVG(p)}</span>`; };
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

// an icon (tab, tile) is an emoji or a short text ("123", "ABC", "ce·ci"); text icons get the text style — one rule everywhere
const iconHTML = (icon, cls) => `<span class="${cls} ico${/[\p{L}\p{N}]/u.test(icon) && !/\p{Extended_Pictographic}/u.test(icon) ? ' txt' : ''}" aria-hidden="true">${esc(icon)}</span>`;
const tileIcon = (t, cls) => iconHTML(t.icon, cls);
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
  $('hub').innerHTML = `<button class="sbox hsearch" id="hsearch"><span>${esc(U.search.placeholder)}</span></button>` + hubTiles().map(x => x.header
    ? `<div class="hh">${iconHTML(x.header.icon, 'hi')} ${esc(U.sections[x.header.id])}</div>`
    : `<button class="ht${x.ok ? '' : ' soon'}" data-id="${x.t.id}" data-play="${x.play ? 1 : 0}">${ageBadge(x.t)}${x.ok ? '' : `<span class="badge">${esc(U.soon)}</span>`}` +
      `${tileIcon(x.t, 'hp')}<span class="hl">${esc(x.lbl)}</span></button>`).join('');
}
function openTile(id, play, quiet) {
  const t = TILE[id]; if (!t || !(play ? gameOk(t) : learnOk(t))) return false;
  if (view() && view().leave) view().leave();
  if (id !== tileId || (play ? 'play' : 'view') !== mode) ABC.views.play.reset();
  tileId = id; mode = play ? 'play' : 'view'; atHub = false; APP.streak = 0;
  if (!play) { section = t.section; store.set('sec', section); } // back always leads to the tile's own hub
  store.set('tile', id); store.set('mode', mode); store.set('athub', false);
  loadIdx(); if (!quiet) sfx.pop(); render();
  return true;
}
$('hub').addEventListener('click', e => {
  if (e.target.closest('.hsearch')) { firstTouch(); openSearch(); return; }
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
  $('barback').innerHTML = `‹ ${iconHTML(SECTIONS[section].icon, 'bi')}`;
  $('stars').textContent = '⭐ ' + APP.stars;
  $('hub').style.display = sc === 'hub' ? 'grid' : 'none';
  VIEW_ELS.forEach(el => { $(el).style.display = v && v.el === el ? (v.fullHeight ? 'block' : 'flex') : 'none'; });
  $('stage').style.display = v && v.fullHeight ? 'none' : 'flex';
  $('prev').style.display = $('next').style.display = v && v.arrows ? 'block' : 'none';
  $('rnav').style.display = v && v.nav === 'rnav' ? 'flex' : 'none';
  closeIndex(); closeInfo(); closeSearch();
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

// ---- index (⊞): every item of the current tile. Word lists: A–Z sections + a side letter bar (drag to jump) ----
const OTHER = '#'; // words that start with a sign outside the alphabet
const firstUnit = (w, L, units) => { const p = I18N.splitUnits(w, units, L.bcp47).find(x => /[\p{L}\p{N}]/u.test(x.text)); return p && p.unit ? p.unit.id : OTHER; };
function openIndex() {
  const v = view(), L = APP.L(), U = APP.ui(), list = APP.items().map((it, i) => ({ it, i }));
  const btn = ({ it, i }) => `<button class="ix${i === APP.idx ? ' on' : ''}" data-i="${i}">${v.indexFace(it)}</button>`;
  let html = '', az = '';
  if (v.indexSort) {
    const col = I18N.collator(L.bcp47), units = APP.S().units, letters = APP.S().letters;
    list.sort((a, b) => col.compare(a.it.w || a.it.label, b.it.w || b.it.label));
    const groups = new Map(units.map(u => [u.id, []])); groups.set(OTHER, []);
    list.forEach(x => groups.get(firstUnit(x.it.w || x.it.label, L, units)).push(x));
    for (const [u, xs] of groups) {
      if (!xs.length) continue;
      const lt = letters.find(l => l.id === u), color = lt ? lt.color : 'var(--muted)';
      html += `<div class="ixh" id="ixh-${esc(u)}"><b style="color:${color}">${esc(lt ? lt.label : u)}</b><span>${esc(APP.t(U.words, { n: xs.length }))}</span></div>` + xs.map(btn).join('');
    }
    az = [...groups.keys()].filter(u => u !== OTHER || groups.get(OTHER).length)
      .map(u => `<span class="az${groups.get(u).length ? '' : ' off'}" data-u="${esc(u)}">${esc((letters.find(l => l.id === u) || { label: u }).label)}</span>`).join('');
  } else html = list.map(btn).join('');
  $('ixgrid').innerHTML = html; $('ixaz').innerHTML = az; $('ixaz').style.display = az ? 'flex' : 'none';
  $('ixsearch').querySelector('span').textContent = U.search.placeholder;
  $('index').classList.add('open');
  const on = $('ixgrid').querySelector('.on'); if (on) on.scrollIntoView({ block: 'center' });
  syncAZ(); sfx.pop();
}
// scroll-spy: the side bar always lights the section being read (last header at or above the top of the list)
function syncAZ() {
  const g = $('ixgrid'), hs = g.querySelectorAll('.ixh'); if (!hs.length) return;
  let cur = hs[0];
  for (const h of hs) { if (h.offsetTop - g.scrollTop <= 28) cur = h; else break; }
  if (g.scrollTop + g.clientHeight >= g.scrollHeight - 2) cur = hs[hs.length - 1]; // at the very end
  const u = cur.id.slice(4);
  $('ixaz').querySelectorAll('.az').forEach(a => { const on = a.dataset.u === u; a.classList.toggle('cur', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
}
let azRaf = 0;
$('ixgrid').addEventListener('scroll', () => { if (!azRaf) azRaf = requestAnimationFrame(() => { azRaf = 0; syncAZ(); }); }, { passive: true });
const closeIndex = () => $('index').classList.remove('open');
$('ixgrid').addEventListener('click', e => { const b = e.target.closest('.ix'); if (!b) return; firstTouch(); closeIndex(); APP.idx = +b.dataset.i; sfx.pop(); view().show(true); });
// letter bar: tap or drag; empty letters jump to the next letter that has words
(function () {
  let last = null;
  const jump = y => {
    const bar = $('ixaz'), all = [...bar.children]; if (!all.length) return;
    const r = bar.getBoundingClientRect(), k = Math.max(0, Math.min(all.length - 1, Math.floor((y - r.top) / r.height * all.length)));
    const el = all.slice(k).find(x => !x.classList.contains('off')) || [...all].reverse().find(x => !x.classList.contains('off'));
    if (!el || el.dataset.u === last) return; last = el.dataset.u;
    const h = document.getElementById('ixh-' + el.dataset.u); if (h) $('ixgrid').scrollTo({ top: h.offsetTop - 4 }); // #ixgrid is the offsetParent
    syncAZ();
    sfx.pop();
  };
  $('ixaz').addEventListener('pointerdown', e => { e.preventDefault(); last = null; try { $('ixaz').setPointerCapture(e.pointerId); } catch (x) {} jump(e.clientY); });
  $('ixaz').addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') jump(e.clientY); });
  $('ixaz').addEventListener('pointerup', () => { last = null; });
})();

// ---- universal search: every searchable tile, matched in ALL languages, shown in the current one ----
const fold = s => String(s || '').replace(/\//g, '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/ß/g, 'ss');
function searchPool() {
  const out = [];
  for (const t of TILES) {
    if (!t.search || !listed(t, false) || !learnOk(t)) continue;
    const per = LANGS.map(c => [c, new Map(((t.items(content(c)) || [])).map(it => [it.id, it]))]);
    for (const it of itemsOf(t)) {
      const names = per.map(([c, m]) => { const x = m.get(it.id); return [c, x ? (x.w || x.name) : null]; }).filter(x => x[1]);
      out.push({ t, it, names, extra: [it.label] });
    }
  }
  return out;
}
function runSearch() {
  const U = APP.ui(), q = fold($('sq').value.trim()), col = I18N.collator(APP.L().bcp47);
  $('sqclear').style.visibility = q ? 'visible' : 'hidden';
  if (!q) { $('smeta').textContent = ''; $('sres').innerHTML = `<p class="shint">${esc(U.search.hint)}</p>`; return; }
  const score = s => { const f = fold(s); return f === q ? 3 : f.split(/[\s-]+/).some(w => w.startsWith(q)) ? 2 : q.length >= 4 && f.includes(q) ? 1 : 0; }; // short queries: word starts only
  const hits = searchPool().map(x => ({ x, s: Math.max(...x.names.map(n => score(n[1])), ...x.extra.map(score)) })).filter(h => h.s)
    .sort((a, b) => b.s - a.s || col.compare(a.x.names[0][1], b.x.names[0][1])).slice(0, 40);
  $('smeta').textContent = hits.length ? APP.t(U.search.results, { n: hits.length }) : U.search.none;
  const mark = n => { const f = fold(n), i = f.indexOf(q); return i < 0 || f.length !== n.replace(/\//g, '').length ? esc(n) : esc(n.slice(0, i)) + '<mark>' + esc(n.slice(i, i + q.length)) + '</mark>' + esc(n.slice(i + q.length)); };
  $('sres').innerHTML = hits.map(({ x }) => {
    const cur = x.names.find(n => n[0] === lang), others = x.names.filter(n => n[0] !== lang);
    return `<button class="sr" data-t="${x.t.id}" data-id="${esc(x.it.id)}"><span class="srp">${x.it.pic || x.it.nav || ''}</span>` +
      `<span class="srt"><b>${mark(cur ? cur[1] : x.it.name)}</b><small>${others.map(([c, n]) => `${ABC.langs[c].flag} ${mark(n)}`).join(' · ')}</small></span>` +
      `${tileIcon(x.t, 'srk')}</button>`;
  }).join('');
}
function openSearch() {
  const U = APP.ui(); $('sq').placeholder = U.search.placeholder; $('sq').value = '';
  $('search').classList.add('open'); runSearch(); sfx.pop(); setTimeout(() => $('sq').focus(), 50);
}
const closeSearch = () => { $('search').classList.remove('open'); $('sq').blur(); };
$('sq').addEventListener('input', runSearch);
$('sres').addEventListener('click', e => {
  const b = e.target.closest('.sr'); if (!b) return; firstTouch(); closeSearch(); closeIndex();
  const t = TILE[b.dataset.t];
  openTile(t.id, false, true); const i = APP.items().findIndex(it => it.id === b.dataset.id);
  if (i >= 0) { APP.idx = i; APP.saveIdx(); } view().show(true);
});
tapBtn('sqclear', () => { $('sq').value = ''; runSearch(); $('sq').focus(); });
tapBtn('sclose', closeSearch);
tapBtn('ixsearch', openSearch);

// ---- age profiles: three bikes in the top bar, visible on every hub; anyone may switch ----
$('ages').innerHTML = PROFILES.map(p => { const [a, b] = CFG.profiles[p];
  return `<button class="age" data-p="${p}" role="radio">${ageSVG(p)}<small>${a}–${b}</small></button>`; }).join('');
function setProfile(p) {
  if (!CFG.profiles[p]) return;
  profile = p; store.set('profile', p); atHub = true; store.set('athub', true);
  sfx.pop(); render(); speak(APP.ui().profile[p] + '!', 80);
}

// ---- chrome from config ----
$('flags').innerHTML = LANGS.map(c => `<button class="flag" data-lang="${c}" aria-label="${esc(ABC.langs[c].name)}">${ABC.langs[c].flag}<i class="nv">🔇</i></button>`).join('');
$('tabs').innerHTML = CFG.sections.map(s => `<button class="tab" id="t-${s.id}">${iconHTML(s.icon, 'ti')}<span class="tl"></span></button>`).join('');
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
  if (e.key === 'Escape') { closeSearch(); closeIndex(); closeInfo(); return; }
  if ($('search').classList.contains('open') || (e.target.closest && e.target.closest('input, textarea'))) return; // typing in the search box
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
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {}); // offline cache is a bonus (e.g. file:// has none)
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
