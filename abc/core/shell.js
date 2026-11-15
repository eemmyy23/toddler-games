'use strict';
const CFG = ABC.config;
const GAME_VIEW = 'play';
const LANGS = CFG.languages.filter(c => ABC.langs[c] && ABC.langs[c].forms);
const SECTIONS = Object.fromEntries(CFG.sections.map(s => [s.id, s]));
const TILES = Tiles.list();
const TILE = Object.fromEntries(TILES.map(t => [t.id, t]));
const PROFILES = Tiles.profiles();
const PLAY_SECTION = CFG.sections.find(s => s.play).id;

for (const v of Object.values(ABC.views)) if (!$(v.el)) {
  const d = document.createElement('div'); d.id = v.el; d.hidden = true;
  (v.fullHeight ? document.body : $('stage')).appendChild(d);
}

const defaultLang = () => { const nav = (navigator.language || '').toLowerCase(); return LANGS.find(c => nav === c || nav.startsWith(c + '-')) || LANGS[0]; };
let lang = store.get('lang', store.legacy('lang') || defaultLang()); if (!LANGS.includes(lang)) lang = LANGS[0];
let profile = store.get('profile', CFG.defaultProfile); if (!CFG.profiles[profile]) profile = CFG.defaultProfile;
let section = store.get('sec', CFG.sections[0].id); if (!SECTIONS[section]) section = CFG.sections[0].id;
const sectionNow = () => atHub ? section : mode === 'play' ? PLAY_SECTION : tileOf().section;
let atHub = store.get('athub', true), tileId = store.get('tile', TILES[0].id), mode = store.get('mode', 'view');
if (!TILE[tileId]) { tileId = TILES[0].id; atHub = true; }
let started = false;

const APP = {
  idx: 0, streak: 0, stars: store.get('stars', store.legacy('stars') || 0),
  L: () => ABC.langs[lang],
  alphabet: () => CONTENT.alphabet(lang),
  ui: () => abcMerge(abcMerge({}, ABC.langs[CFG.baseLanguage].strings), ABC.langs[lang].strings),
  t: (tpl, vars) => I18N.t(tpl, vars, ABC.langs[lang].bcp47),
  icon: k => `<i class="ic" aria-hidden="true">${CFG.icons[k] != null ? esc(CFG.icons[k]) : ABC.art[k] ? `<svg class="art" viewBox="0 0 32 32">${ABC.art[k]}</svg>` : ''}</i>`,
  exclaim: name => APP.t(APP.ui().exclaim, { name }),
  mt(key, vars) {
    const m = tileOf().module, get = code => key.split('.').reduce((o, k) => o && o[k], m.strings[code]);
    return I18N.t(get(lang) ?? get(CFG.baseLanguage), vars, ABC.langs[lang].bcp47);
  },
  tile: () => tileOf(),
  items: () => itemsOf(tileOf()),
  gameItems: () => gameItemsOf(tileOf()),
  screen: () => atHub ? 'hub' : mode === 'play' ? GAME_VIEW : tileOf().view,
  indexOf: id => APP.items().findIndex(it => it.id === id),
  step(d) { const n = APP.items().length; APP.idx = (APP.idx + d + n) % n; return APP.items()[APP.idx]; },
  neighbors() { const L = APP.items(), n = L.length; return [L[(APP.idx - 1 + n) % n], L[(APP.idx + 1) % n]]; },
  saveIdx() { const it = APP.items()[APP.idx]; if (it) store.set('pos_' + tileId, it.id); },
  firstTouch,
  set(o) { if ('profile' in o && CFG.profiles[o.profile]) profile = o.profile; if ('section' in o && SECTIONS[o.section]) section = o.section; if ('hub' in o) atHub = !!o.hub; },
  links(it) {
    const t = tileOf(), play = mode === 'play', out = [];
    const chip = (x, id, toPlay) => `<button class="pill small link" data-t="${x.id}" data-id="${esc(id)}" data-play="${toPlay ? 1 : 0}">${iconHTML(x.icon, 'li')} ${esc(label(x, toPlay ? 1 : 0))}</button>`;
    if (!play && infoFor(it.concept)) out.push(`<button class="pill small infobtn" data-c="${esc(it.concept)}">${APP.icon('info')}${esc(APP.ui().info)}</button>`);
    if (it.concept) for (const x of TILES) {
      if (x === t || !usable(x, false)) continue;
      const other = itemsOf(x).find(y => y.concept === it.concept || (y.concepts && y.concepts.includes(it.concept)));
      if (other) out.push(chip(x, other.id, false));
    }
    const home = it.learn ?? it.id;
    if (play && usable(t, false) && itemsOf(t).some(y => y.id === home)) out.push(chip(t, home, false));
    if (!play && usable(t, true)) out.push(chip(t, it.id, true));
    return out.join('');
  },
  fit(el, compact) {
    if (compact) el.classList.remove(compact);
    el.style.transform = ''; el.style.transformOrigin = '';
    const kids = [...el.children]; if (!kids.length) return;
    const lim0 = $('bar').getBoundingClientRect().bottom + 4;
    const low = [...document.querySelectorAll('[data-low]')].filter(e => !e.hidden && e.getClientRects().length && e.getBoundingClientRect().top > innerHeight / 2);
    const lim1 = Math.min($('tabs').getBoundingClientRect().top, ...low.map(e => e.getBoundingClientRect().top)) - 4;
    const span = () => [Math.min(...kids.map(k => k.getBoundingClientRect().top)), Math.max(...kids.map(k => k.getBoundingClientRect().bottom))];
    let [top, bot] = span();
    if (top >= lim0 && bot <= lim1) return;
    if (compact) { el.classList.add(compact); [top, bot] = span(); if (top >= lim0 && bot <= lim1) return; }
    const k = Math.min(1, (lim1 - lim0) / (bot - top)), r = el.getBoundingClientRect();
    el.style.transformOrigin = `50% ${top - r.top}px`; el.style.transform = `translateY(${lim0 - top}px) scale(${k})`;
  },
  addStar() { APP.stars++; store.set('stars', APP.stars); const s = $('stars'); s.innerHTML = APP.icon('star') + APP.stars; if (!calm()) s.animate([{ transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 400 }); }
};
const tileOf = () => TILE[tileId];
const itemsOf = t => Tiles.items(t, lang);
const gameItemsOf = t => Tiles.gameItems(t, lang);
const learnOk = t => Tiles.learnOk(t, lang);
const gameOk = t => Tiles.gameOk(t, lang);
const label = (t, i) => Tiles.label(t, lang, i);
const view = () => ABC.views[APP.screen()];
const ageOk = t => Tiles.ageOk(t, profile);
const usable = (t, play) => !!t && ageOk(t) && (play ? gameOk(t) : learnOk(t));
function loadIdx() { const i = APP.indexOf(store.get('pos_' + tileId, null)); APP.idx = i >= 0 ? i : 0; }

const artSVG = p => `<svg viewBox="0 0 32 32" aria-hidden="true"><g fill="none">${ABC.art[CFG.profiles[p].art || p] || ''}</g></svg>`;
const profileName = p => { const U = APP.ui(), [a, b] = CFG.profiles[p].ages; return APP.t(U.profile.ages, { name: U.profile[p], a, b }); };
const ageBadge = t => { const p = Tiles.profileOf(t), i = PROFILES.indexOf(p);
  return `<span class="agebadge" data-p="${p}" style="--ax:${PROFILES.length > 1 ? i / (PROFILES.length - 1) : 0}" title="${esc(profileName(p))}">${artSVG(p)}</span>`; };
const iconHTML = (icon, cls) => `<span class="${cls} ico${/[\p{L}\p{N}]/u.test(icon) && !/\p{Extended_Pictographic}/u.test(icon) ? ' txt' : ''}" aria-hidden="true">${esc(icon)}</span>`;
const tileIcon = (t, cls) => iconHTML(t.icon, cls);

function hubTiles() {
  if (!SECTIONS[section].play) return TILES.filter(t => t.section === section && usable(t, false)).map(t => ({ t, lbl: label(t, 0), play: false }));
  const out = [];
  for (const s of CFG.sections.filter(s => !s.play)) {
    const games = TILES.filter(t => t.section === s.id && usable(t, true)).map(t => ({ t, lbl: label(t, 1), play: true }));
    if (games.length) out.push({ header: s }, ...games);
  }
  return out;
}
function renderHub() {
  const U = APP.ui();
  $('hub').innerHTML = `<button class="pill sbox hsearch" id="hsearch"><span>${esc(U.search.placeholder)}</span></button>` + hubTiles().map(x => x.header
    ? `<div class="label hh">${iconHTML(x.header.icon, 'hi')} ${esc(U.sections[x.header.id])}</div>`
    : `<button class="ht" data-id="${x.t.id}" data-play="${x.play ? 1 : 0}">${ageBadge(x.t)}` +
      `${tileIcon(x.t, 'hp')}<span class="hl">${esc(x.lbl)}</span></button>`).join('');
}
function openTile(id, play, quiet) {
  const t = TILE[id]; if (!usable(t, play)) return false;
  if (view() && view().leave) view().leave();
  if (id !== tileId || (play ? 'play' : 'view') !== mode) Object.values(ABC.views).forEach(v => v.reset && v.reset());
  tileId = id; mode = play ? 'play' : 'view'; atHub = false; APP.streak = 0;
  store.set('tile', id); store.set('mode', mode); store.set('athub', false);
  loadIdx(); if (!quiet) sfx.pop(); render();
  return true;
}
$('hub').addEventListener('click', e => {
  if (e.target.closest('.hsearch')) { firstTouch(); openSearch(); return; }
  const b = e.target.closest('.ht'); if (!b) return;
  firstTouch();
  openTile(b.dataset.id, b.dataset.play === '1');
});
function goHub() { if (view() && view().leave) view().leave(); section = sectionNow(); atHub = true; store.set('sec', section); store.set('athub', true); sfx.pop(); render(); speak(APP.exclaim(APP.ui().sections[section]), 80); }
function setSection(id) {
  if (id === sectionNow()) { if (!atHub) goHub(); return; }
  if (view() && view().leave) view().leave();
  section = id; store.set('sec', id); atHub = true; store.set('athub', true);
  sfx.pop(); render(); speak(APP.exclaim(APP.ui().sections[id]), 80);
}

const VIEWS = Object.values(ABC.views);
function render() {
  const U = APP.ui(), L = APP.L();
  const sec = sectionNow();
  CFG.sections.forEach(s => { const b = $('t-' + s.id); b.classList.toggle('on', sec === s.id); b.setAttribute('aria-current', sec === s.id ? 'page' : 'false'); b.querySelector('.tl').textContent = U.sections[s.id]; });
  document.querySelectorAll('.flag').forEach(f => { f.classList.toggle('on', f.dataset.lang === lang); f.setAttribute('aria-pressed', f.dataset.lang === lang); f.title = f.classList.contains('novoice') ? U.noVoice : ''; });
  document.querySelectorAll('.age').forEach(b => { const on = b.dataset.p === profile; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); b.setAttribute('aria-label', profileName(b.dataset.p)); });
  document.querySelectorAll('[data-aria]').forEach(e => e.setAttribute('aria-label', U.aria[e.dataset.aria] || ''));
  document.querySelectorAll('[data-text]').forEach(e => { e.textContent = U[e.dataset.text] || ''; });
  document.title = CFG.name;
  document.querySelectorAll('[data-icon]').forEach(e => { e.innerHTML = APP.icon(e.dataset.icon); });
  $('ver').textContent = APP.t(U.version, { version: CFG.version, build: self.MANIFEST.version });
  document.documentElement.lang = L.bcp47; document.documentElement.dir = L.dir || 'ltr';
  if (!atHub && !usable(tileOf(), mode === 'play')) { if (view() && view().leave) view().leave(); atHub = true; }
  const sc = APP.screen(), v = view();
  document.body.dataset.mode = sc;
  document.body.classList.toggle('lownav', !!(v && (v.arrows || v.nav)));
  $('ages').hidden = !atHub; $('barback').hidden = atHub;
  $('gridbtn').hidden = atHub || mode === 'play' || !tileOf().index; $('stars').hidden = sc !== GAME_VIEW;
  $('barback').innerHTML = APP.icon('back') + iconHTML(SECTIONS[sec].icon, 'bi');
  $('stars').innerHTML = APP.icon('star') + APP.stars;
  $('hub').hidden = sc !== 'hub';
  VIEWS.forEach(x => { $(x.el).hidden = !(v && v === x); if (x.nav) $(x.nav).hidden = !(v && v === x); });
  $('stage').hidden = !!(v && v.fullHeight);
  $('prev').hidden = $('next').hidden = !(v && v.arrows);
  closeIndex(); closeInfo(); closeSearch();
  if (sc === 'hub') renderHub(); else v.show(started);
}

function setLang(code) {
  if (code === lang) { sfx.pop(); announce(); return; }
  const v0 = !atHub && view(), cur = v0 && APP.items()[APP.idx];
  if (v0 && v0.leave) v0.leave();
  const state = v0 && v0.beforeLang ? v0.beforeLang() : null, scroll = v0 && v0.keepScroll ? $(v0.el).scrollTop : 0;
  lang = code; store.set('lang', code); SPEECH.pick(APP.L().bcp47, APP.L().voices); markVoices();
  if (v0) {
    const i = cur ? APP.indexOf(cur.id) : -1;
    if (i >= 0) APP.idx = i; else loadIdx();
    if (state && v0.afterLang) v0.afterLang(state);
  }
  sfx.pop(); render();
  if (v0 && v0.keepScroll && view() === v0) $(v0.el).scrollTop = scroll;
  announce();
}
function announce() { const name = APP.L().name; if (atHub) speak(APP.exclaim(name), 120); else view().announce(name); }

let infoId = null, infoTok = 0;
const infoFor = c => c && APP.L().info[c] ? APP.L().info[c] : null;
function openInfo(c) {
  const I = infoFor(c); if (!I) return;
  infoId = c; $('infotitle').textContent = I.title;
  $('infolist').innerHTML = I.lines.map(([e, t], i) => `<button class="inf" data-i="${i}"><span class="ie">${e}</span><span>${esc(t)}</span></button>`).join('');
  $('info').hidden = false; sfx.pop(); speak(I.title, 100);
}
function closeInfo() { infoTok++; $('info').hidden = true; }
const lightInf = i => document.querySelectorAll('.inf').forEach(b => b.classList.toggle('on', +b.dataset.i === i));
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.link'); if (!b) return; e.preventDefault(); e.stopPropagation(); firstTouch();
  const play = b.dataset.play === '1'; if (!openTile(b.dataset.t, play)) return;
  if (!play) { const i = APP.indexOf(b.dataset.id); if (i >= 0) { APP.idx = i; APP.saveIdx(); view().show(true); } }
}, true);
document.addEventListener('pointerdown', e => { const b = e.target.closest('.infobtn'); if (!b) return; e.preventDefault(); e.stopPropagation(); firstTouch(); openInfo(b.dataset.c); }, true);
$('infolist').addEventListener('click', e => { const b = e.target.closest('.inf'); if (!b) return; firstTouch(); infoTok++; lightInf(+b.dataset.i); speak(infoFor(infoId).lines[+b.dataset.i][1], 40); });
async function playInfo() {
  const tok = ++infoTok, I = infoFor(infoId);
  for (let i = 0; i < I.lines.length; i++) {
    if (tok !== infoTok) return;
    lightInf(i); document.querySelector(`.inf[data-i="${i}"]`).scrollIntoView({ block: 'nearest', behavior: calm() ? 'auto' : 'smooth' });
    await speak(I.lines[i][1], i ? 250 : 80);
  }
  if (tok === infoTok) { lightInf(-1); sfx.right(); }
}

const OTHER = CFG.icons.other;
const GROUP_OF = new Map(Object.entries(ABC.groups).flatMap(([g, ms]) => ms.map(m => [m, g])));
const hasGroups = GROUP_OF.size > 0;
let ixMode = store.get('ixmode', 'az');
$('ixmode').addEventListener('pointerdown', e => { const b = e.target.closest('.seg'); if (!b) return; e.preventDefault(); firstTouch(); ixMode = b.dataset.m; store.set('ixmode', ixMode); openIndex(); });
function openIndex() {
  const v = view(), L = APP.L(), U = APP.ui(), list = APP.items().map((it, i) => ({ it, i }));
  const face = it => v.indexFace ? v.indexFace(it) : esc(it.label);
  const btn = ({ it, i }) => `<button class="ix${i === APP.idx ? ' on' : ''}" data-i="${i}">${face(it)}</button>`;
  let html = '', az = '';
  const byGroup = !!(v.indexSort && hasGroups && ixMode === 'grp');
  $('ixmode').hidden = !(v.indexSort && hasGroups);
  $('ixmode').querySelectorAll('.seg').forEach(b => { b.classList.toggle('on', (b.dataset.m === 'grp') === byGroup); b.textContent = U.index[b.dataset.m]; });
  if (v.indexSort) {
    const col = I18N.collator(L.bcp47), A = APP.alphabet(), names = byGroup ? new Map(CONTENT.words(lang).map(x => [x.id, x.w])) : null;
    const first = s => { const p = I18N.splitUnits(s, A.units, L.bcp47).find(x => /[\p{L}\p{N}]/u.test(x.text)); return p && p.unit ? p.unit.id : OTHER; };
    list.sort((a, b) => col.compare(a.it.label, b.it.label));
    const keys = byGroup ? Object.keys(ABC.groups) : A.units.map(u => u.id), groups = new Map(keys.map(k => [k, []])); groups.set(OTHER, []);
    list.forEach(x => groups.get(byGroup ? GROUP_OF.get(x.it.concept) || OTHER : first(x.it.label)).push(x));
    const head = u => { if (byGroup) return { text: u === OTHER ? u : ABC.conceptById[u].pic, color: 'inherit', name: u === OTHER ? U.index.other : names.get(u) };
      const unit = A.unit(u); return { text: unit ? unit.upper : u, color: A.color(u) || 'var(--muted)' }; };
    for (const [u, xs] of groups) {
      if (!xs.length) continue;
      const h = head(u), n = APP.t(U.words, { n: xs.length });
      html += `<div class="ixh" id="ixh-${esc(u)}"><b style="color:${h.color}">${esc(h.text)}</b><span class="label">${esc(h.name ? APP.t(U.headCount, { name: h.name, n }) : n)}</span></div>` + xs.map(btn).join('');
    }
    az = [...groups.keys()].filter(u => u !== OTHER || groups.get(OTHER).length)
      .map(u => `<span class="az${groups.get(u).length ? '' : ' dim'}" data-u="${esc(u)}">${esc(head(u).text)}</span>`).join('');
  } else html = list.map(btn).join('');
  $('ixgrid').innerHTML = html; $('ixaz').innerHTML = az; $('ixaz').hidden = !az;
  $('ixsearch').querySelector('span').textContent = U.search.placeholder;
  $('index').hidden = false;
  const on = $('ixgrid').querySelector('.on'); if (on) on.scrollIntoView({ block: 'center' });
  syncAZ(); sfx.pop();
}
function syncAZ() {
  const g = $('ixgrid'), hs = g.querySelectorAll('.ixh'); if (!hs.length) return;
  let cur = hs[0];
  for (const h of hs) { if (h.offsetTop - g.scrollTop <= 28) cur = h; else break; }
  if (g.scrollTop + g.clientHeight >= g.scrollHeight - 2) cur = hs[hs.length - 1];
  const u = cur.id.slice(4);
  $('ixaz').querySelectorAll('.az').forEach(a => { const on = a.dataset.u === u; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
}
let azRaf = 0;
$('ixgrid').addEventListener('scroll', () => { if (!azRaf) azRaf = requestAnimationFrame(() => { azRaf = 0; syncAZ(); }); }, { passive: true });
const closeIndex = () => { $('index').hidden = true; };
$('ixgrid').addEventListener('click', e => { const b = e.target.closest('.ix'); if (!b) return; firstTouch(); closeIndex(); APP.idx = +b.dataset.i; sfx.pop(); view().show(true); });
(function () {
  let last = null;
  const jump = y => {
    const bar = $('ixaz'), all = [...bar.children]; if (!all.length) return;
    const r = bar.getBoundingClientRect(), k = Math.max(0, Math.min(all.length - 1, Math.floor((y - r.top) / r.height * all.length)));
    const el = all.slice(k).find(x => !x.classList.contains('dim')) || [...all].reverse().find(x => !x.classList.contains('dim'));
    if (!el || el.dataset.u === last) return; last = el.dataset.u;
    const h = document.getElementById('ixh-' + el.dataset.u); if (h) $('ixgrid').scrollTo({ top: h.offsetTop - 4 });
    syncAZ(); sfx.pop();
  };
  $('ixaz').addEventListener('pointerdown', e => { e.preventDefault(); last = null; try { $('ixaz').setPointerCapture(e.pointerId); } catch (x) {} jump(e.clientY); });
  $('ixaz').addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') jump(e.clientY); });
  $('ixaz').addEventListener('pointerup', () => { last = null; });
})();

const FOLDS = LANGS.map(c => ABC.langs[c].fold).filter(Boolean);
const fold = s => FOLDS.reduce((x, f) => f(x), String(s || '').replace(/\//g, '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase());
function searchPool() {
  const out = [];
  for (const t of TILES) {
    if (!t.search || !usable(t, false)) continue;
    const per = LANGS.map(c => [c, new Map(Tiles.items(t, c).map(it => [it.id, it]))]);
    for (const it of itemsOf(t)) {
      const names = per.map(([c, m]) => { const x = m.get(it.id); return [c, x ? x.name : null]; }).filter(x => x[1]);
      out.push({ t, it, names, extra: [it.label] });
    }
  }
  return out;
}
function runSearch() {
  const U = APP.ui(), q = fold($('sq').value.trim()), col = I18N.collator(APP.L().bcp47);
  $('sqclear').hidden = !q;
  if (!q) { $('smeta').textContent = ''; $('sres').innerHTML = `<p class="shint">${esc(U.search.hint)}</p>`; return; }
  const score = s => { const f = fold(s); return f === q ? 3 : f.split(/[\s-]+/).some(w => w.startsWith(q)) ? 2 : q.length >= 4 && f.includes(q) ? 1 : 0; };
  const hits = searchPool().map(x => ({ x, s: Math.max(...x.names.map(n => score(n[1])), ...x.extra.map(score)) })).filter(h => h.s)
    .sort((a, b) => b.s - a.s || col.compare(a.x.names[0][1], b.x.names[0][1]));
  const groups = new Map();
  for (const h of hits) { const k = h.x.it.concept || `${h.x.t.id}:${h.x.it.id}`; if (groups.has(k)) groups.get(k).push(h.x); else groups.set(k, [h.x]); }
  const rows = [...groups.values()].slice(0, 40);
  $('smeta').textContent = rows.length ? APP.t(U.search.results, { n: rows.length }) : U.search.none;
  const mark = n => { const f = fold(n), i = f.indexOf(q); return i < 0 || f.length !== n.replace(/\//g, '').length ? esc(n) : esc(n.slice(0, i)) + '<mark>' + esc(n.slice(i, i + q.length)) + '</mark>' + esc(n.slice(i + q.length)); };
  $('sres').innerHTML = rows.map(([x, ...more]) => {
    const cur = x.names.find(n => n[0] === lang), others = x.names.filter(n => n[0] !== lang);
    const icons = [x, ...more].map(m => `<button class="link srk" data-t="${m.t.id}" data-id="${esc(m.it.id)}" data-play="0">${tileIcon(m.t, 'ico-s')}</button>`).join('');
    return `<div class="sr" role="button" data-t="${x.t.id}" data-id="${esc(x.it.id)}"><span class="srp">${x.it.concept && ABC.art[x.it.concept] ? CONTENT.pic(x.it.concept) : x.it.pic || x.it.nav || esc(x.it.label)}</span>` +
      `<span class="srt"><b>${mark(cur ? cur[1] : x.it.name)}</b><small>${others.map(([c, n]) => `<span>${ABC.langs[c].flag}${mark(n)}</span>`).join('')}</small></span>${icons}</div>`;
  }).join('');
}
function openSearch() {
  const U = APP.ui(); $('sq').placeholder = U.search.placeholder; $('sq').value = '';
  $('search').hidden = false; runSearch(); sfx.pop(); setTimeout(() => $('sq').focus(), 50);
}
const closeSearch = () => { $('search').hidden = true; $('sq').blur(); };
$('sq').addEventListener('input', runSearch);
$('sres').addEventListener('click', e => {
  const b = e.target.closest('.sr'); if (!b || e.target.closest('.link')) return; firstTouch(); closeSearch(); closeIndex();
  openTile(b.dataset.t, false, true); const i = APP.indexOf(b.dataset.id);
  if (i >= 0) { APP.idx = i; APP.saveIdx(); } view().show(true);
});
tapBtn('sqclear', () => { $('sq').value = ''; runSearch(); $('sq').focus(); });
tapBtn('sclose', closeSearch);
tapBtn('ixsearch', openSearch);

$('ages').innerHTML = PROFILES.map(p => { const [a, b] = CFG.profiles[p].ages;
  return `<button class="seg age" data-p="${p}" role="radio">${artSVG(p)}<small>${esc(APP.t(APP.ui().range, { a, b }))}</small></button>`; }).join('');
function setProfile(p) {
  if (!CFG.profiles[p]) return;
  profile = p; store.set('profile', p); atHub = true; store.set('athub', true);
  sfx.pop(); render(); speak(APP.exclaim(profileName(p)), 80);
}

$('flags').innerHTML = LANGS.map(c => `<button class="seg flag" data-lang="${c}" aria-label="${esc(ABC.langs[c].name)}">${ABC.langs[c].flag}<i class="nv">${esc(CFG.icons.mute)}</i></button>`).join('');
$('tabs').innerHTML = CFG.sections.map(s => `<button class="tab" id="t-${s.id}">${iconHTML(s.icon, 'ti')}<span class="tl"></span></button>`).join('');
function markVoices() {
  document.querySelectorAll('.flag').forEach(f => { const has = SPEECH.hasVoice(ABC.langs[f.dataset.lang].bcp47); f.classList.toggle('novoice', has === false); });
}
SPEECH.pick(APP.L().bcp47, APP.L().voices);
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { SPEECH.pick(APP.L().bcp47, APP.L().voices); markVoices(); };
markVoices();

function firstTouch() { started = true; ensureAudio(); }
addEventListener('pointerdown', firstTouch, true);
addEventListener('keydown', firstTouch, true);
function tapBtn(el, fn) { onTap(el, () => { firstTouch(); fn(); }); }
document.querySelectorAll('.flag').forEach(f => tapBtn(f, () => setLang(f.dataset.lang)));
CFG.sections.forEach(s => tapBtn('t-' + s.id, () => setSection(s.id)));
tapBtn('barback', goHub);
tapBtn('prev', () => view().step(-1)); tapBtn('next', () => view().step(1));
tapBtn('infoclose', closeInfo); tapBtn('infoplay', playInfo);
tapBtn('gridbtn', openIndex); tapBtn('ixclose', closeIndex);
document.querySelectorAll('.age').forEach(b => tapBtn(b, () => setProfile(b.dataset.p)));
addEventListener('resize', () => { resizeFx(); if (!atHub && view().resize) view().resize(); });
let sx = null;
$('stage').addEventListener('pointerdown', e => { sx = e.clientX; }, true);
$('stage').addEventListener('pointerup', e => {
  const v = view(), start = sx; sx = null;
  if (start == null || !v || !v.swipe) return;
  const dx = e.clientX - start;
  if (Math.abs(dx) > 50) v.step((dx < 0) !== (APP.L().dir === 'rtl') ? 1 : -1);
});
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
  if (e.key === 'Escape') { closeSearch(); closeIndex(); closeInfo(); return; }
  if (!$('search').hidden || (e.target.closest && e.target.closest('input, textarea'))) return;
  const k = e.key.toLocaleLowerCase(APP.L().bcp47), v = view();
  if ((k === 'arrowright' || k === 'arrowleft') && v && v.step) { v.step(k === 'arrowright' ? 1 : -1); return; }
  if (e.repeat) return;
  if (v && v.onKey && v.onKey(k, e)) return;
  if (k.length !== 1 && !/^\p{L}$/u.test(k)) return;
  const play = APP.screen() === GAME_VIEW || (atHub && SECTIONS[section].play);
  const t = TILES.find(t => (play || t.section === sectionNow()) && usable(t, play) &&
    ABC.views[play ? GAME_VIEW : t.view].onKey && (play ? gameItemsOf(t) : itemsOf(t)).some(it => it.key === k));
  if (!t || (t.id === tileId && !atHub)) return;
  openTile(t.id, play, true);
  if (!play && view().onKey) view().onKey(k, e);
});
addEventListener('contextmenu', e => e.preventDefault());

loadIdx();
render();

if ('serviceWorker' in navigator) {
  const reg = navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => null);
  let stale = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => caches.keys().then(k => { stale = !k.includes('toddler-' + self.MANIFEST.version); }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && stale) location.reload();
    else if (!document.hidden) reg.then(r => r && r.update()).catch(() => {});
  });
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hush(); if (view() && view().leave) view().leave(); quietAudio(); }
  else if (!atHub) render();
});
(function () {
  const bar = $('install-bar'), btn = $('install-btn'), msg = $('install-msg'), dismiss = $('dismiss-btn');
  let deferred = null;
  if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) return;
  try { if (sessionStorage.getItem('install-dismissed')) return; } catch (e) {}
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; msg.textContent = APP.t(APP.ui().install, { app: CFG.name }); bar.hidden = false; });
  bar.addEventListener('pointerdown', e => e.stopPropagation());
  btn.addEventListener('click', () => { if (!deferred) return; deferred.prompt(); deferred.userChoice.then(() => { deferred = null; bar.hidden = true; }); });
  dismiss.addEventListener('click', () => { bar.hidden = true; try { sessionStorage.setItem('install-dismissed', '1'); } catch (e) {} });
  addEventListener('appinstalled', () => { bar.hidden = true; });
})();
