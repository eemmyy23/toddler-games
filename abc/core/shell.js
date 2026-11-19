'use strict';
const CFG = ABC.config;
const GAME_VIEW = 'play';
const LANGS = CFG.languages.filter(c => ABC.langs[c] && ABC.langs[c].forms);
const SECTIONS = Object.fromEntries(CFG.sections.map(s => [s.id, s]));
const TILES = Tiles.list();
const TILE = Object.fromEntries(TILES.map(t => [t.id, t]));
const PROFILES = Tiles.profiles();
const PLAY_SECTION = CFG.sections.find(s => s.play).id;
const GAP = 200, CELEBRATE = { spark: [18, 6], burst: [60, 10] }, SWIPE = 50, SEARCH_ROWS = 40, FOCUS_DELAY = 50, STEM = 4, HAND = 5;
let seqTok = 0;
const canPlay = v => !!(v && v.play && (!v.playable || v.playable(APP.item())));

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
const uiCache = {};

const APP = {
  idx: 0, streak: 0, stars: store.get('stars', store.legacy('stars') || 0),
  L: () => ABC.langs[lang],
  alphabet: () => CONTENT.alphabet(lang),
  ui: () => uiCache[lang] || (uiCache[lang] = abcMerge(abcMerge({}, ABC.langs[CFG.baseLanguage].strings), ABC.langs[lang].strings)),
  t: (tpl, vars) => I18N.t(tpl, vars, ABC.langs[lang].bcp47),
  icon: k => `<i class="ic" aria-hidden="true">${CFG.icons[k] != null ? esc(CFG.icons[k]) : ABC.art[k] ? `<svg class="art" viewBox="0 0 32 32">${ABC.art[k]}</svg>` : ''}</i>`,
  exclaim: name => APP.t(APP.ui().exclaim, { name }),
  fitText(el, inner) {
    const ratio = e => e.scrollWidth > e.clientWidth + 1 ? e.clientWidth / e.scrollWidth : 1;
    const worst = () => Math.min(ratio(el), ...(inner ? [...el.querySelectorAll(inner)].map(ratio) : []));
    let k = 1; el.style.setProperty('--fit', k);
    for (let i = 0; i < 6; i++) { const r = worst(); if (r >= 1) break; k *= r; el.style.setProperty('--fit', k.toFixed(3)); }
  },
  mt(key, vars) {
    const m = tileOf().module, get = code => key.split('.').reduce((o, k) => o && o[k], m.strings[code]);
    return I18N.t(get(lang) ?? get(CFG.baseLanguage), vars, ABC.langs[lang].bcp47);
  },
  tile: () => tileOf(),
  items: () => itemsOf(tileOf()),
  item: () => APP.items()[APP.idx],
  gameItems: () => gameItemsOf(tileOf()),
  screen: () => atHub ? 'hub' : mode === 'play' ? GAME_VIEW : tileOf().view,
  indexOf: id => APP.items().findIndex(it => it.id === id),
  step(d) { const n = APP.items().length; APP.idx = (APP.idx + d + n) % n; return APP.items()[APP.idx]; },
  neighbors() { const L = APP.items(), n = L.length; return [L[(APP.idx - 1 + n) % n], L[(APP.idx + 1) % n]]; },
  saveIdx() { const it = APP.item(); if (it) store.set('pos_' + tileId, it.id); },
  light(scope, els) { const root = typeof scope === 'string' ? $(scope) : scope; root.querySelectorAll('.on').forEach(x => x.classList.remove('on')); [].concat(els || []).forEach(e => e && e.classList.add('on')); },
  reveal(el) { if (el) el.scrollIntoView({ block: 'nearest', behavior: calm() ? 'auto' : 'smooth' }); },
  celebrate(el, big) { const r = el && el.getBoundingClientRect(); sfx[big ? 'right' : 'pop'](); confetti(r ? r.left + r.width / 2 : W / 2, r ? r.top + r.height / 2 : H / 3, ...CELEBRATE[big ? 'burst' : 'spark']); },
  stop() { seqTok++; hush(); APP.playing(false); document.querySelectorAll(['stage', 'infolist', ...VIEWS.filter(v => v.fullHeight).map(v => v.el)].map(id => `#${id} .on`).join()).forEach(x => x.classList.remove('on')); },
  async sequence(scope, steps, opts = {}) {
    const t = ++seqTok, alive = () => t === seqTok; hush();
    if (opts.button) APP.playing(true);
    try {
      for (const s of steps) {
        if (!alive()) return false;
        if ('light' in s) { APP.light(scope, s.light); APP.reveal([].concat(s.light)[0]); }
        if (s.pop) sfx.pop();
        if (s.say) await speak(s.say, s.delay || 0);
        if (!alive()) return false;
        await wait(s.pause ?? GAP);
      }
      if (!alive()) return false;
      APP.light(scope, null); if (opts.finale) APP.celebrate(opts.at, true);
      return true;
    } finally { if (opts.button && t === seqTok) APP.playing(false); }
  },
  backdrop(css) { const b = $('backdrop'); b.hidden = !css; b.style.background = css || ''; },
  playing(on) { $('act').classList.toggle('on', !!on); $('act').setAttribute('aria-pressed', !!on); },
  synonyms(it) {
    if (!it.alts || !it.alts.length) return '';
    const home = id => TILES.find(t => usable(t, false) && itemsOf(t).some(y => y.id === id));
    return `<span class="label">${esc(APP.ui().also)}</span>` + it.alts.map(a => { const t = home(a.id);
      return `<button class="pill small syn" data-say="${esc(a.w)}">${esc(a.w)}</button>${t ? `<button class="pill link see" data-t="${t.id}" data-id="${esc(a.id)}" data-play="0" aria-label="${esc(label(t, 0))}">${APP.icon('link')}</button>` : ''}`; }).join('');
  },
  shown() {
    APP.saveIdx(); const v = view(); $('act').hidden = !canPlay(v); if (!v || !v.arrows) return;
    const [pv, nx] = APP.neighbors(), face = v.navFace || (x => x.nav);
    $('prev').innerHTML = APP.icon('prev') + face(pv); $('next').innerHTML = face(nx) + APP.icon('next'); APP.fitText($('prev')); APP.fitText($('next'));
  },
  set(o) { if ('profile' in o && CFG.profiles[o.profile]) profile = o.profile; if ('section' in o && SECTIONS[o.section]) section = o.section; if ('hub' in o) atHub = !!o.hub; },
  links(it, el, brief) {
    const t = tileOf(), play = mode === 'play', few = play || brief, out = [];
    const chip = (x, id, toPlay) => `<button class="pill link" data-t="${x.id}" data-id="${esc(id)}" data-play="${toPlay ? 1 : 0}">${iconHTML(x.icon, 'li')} ${esc(label(x, toPlay ? 1 : 0))}</button>`;
    if (!play && infoFor(it.concept)) out.push(`<button class="pill link infobtn" data-c="${esc(it.concept)}">${APP.icon('info')}${esc(APP.ui().info)}</button>`);
    const near = (a, b) => it.at == null ? 0 : Math.abs((a.at ?? 1e9) - it.at) - Math.abs((b.at ?? 1e9) - it.at);
    if (it.concept && !few) for (const x of TILES) {
      if (x === t || !usable(x, false)) continue;
      const other = itemsOf(x).filter(y => y.concept === it.concept || (y.concepts && y.concepts.includes(it.concept)) || (y.related && y.related.includes(it.concept))).sort(near)[0];
      if (other) out.push(chip(x, other.id, false));
    }
    for (const c of few ? [] : it.related || []) {
      if (c === it.concept) continue;
      for (const x of TILES) {
        if (!usable(x, false)) continue;
        const xs = itemsOf(x), y = xs.find(y => y.id === c) || xs.find(y => y.concept === c);
        if (y) { out.push(`<button class="pill link" data-t="${x.id}" data-id="${esc(y.id)}" data-play="0"><span class="li">${CONTENT.pic(c)}</span> ${esc(y.name)}</button>`); break; }
      }
    }
    const home = it.learn ?? it.id;
    if (play && usable(t, false) && itemsOf(t).some(y => y.id === home)) out.push(chip(t, home, false));
    if (!play && usable(t, true)) out.push(chip(t, it.id, true));
    const html = out.join('');
    if (el) { el.innerHTML = html; el.hidden = !html; }
    return html;
  },
  fit(el, compact) {
    if (compact) el.classList.remove(compact);
    el.style.transform = ''; el.style.transformOrigin = '';
    const kids = [...el.children].filter(k => k.getClientRects().length); if (!kids.length) return;
    const lim0 = $('bar').getBoundingClientRect().bottom + 4;
    const box = el.getBoundingClientRect(), across = r => r.right > box.left && r.left < box.right;
    const low = [...document.querySelectorAll('[data-low]')].filter(e => !e.hidden && e.getClientRects().length && e.getBoundingClientRect().top > innerHeight / 2 && across(e.getBoundingClientRect()));
    const lim1 = Math.min($('tabs').getBoundingClientRect().top, ...low.map(e => e.getBoundingClientRect().top)) - 4;
    const span = () => [Math.min(...kids.map(k => k.getBoundingClientRect().top)), Math.max(...kids.map(k => k.getBoundingClientRect().bottom))];
    let [top, bot] = span();
    if (top >= lim0 && bot <= lim1) return;
    if (compact) { el.classList.add(compact); [top, bot] = span(); if (top >= lim0 && bot <= lim1) return; }
    const k = Math.min(1, (lim1 - lim0) / (bot - top)), r = el.getBoundingClientRect();
    el.style.transformOrigin = `50% ${top - r.top}px`; el.style.transform = `translateY(${lim0 - top}px) scale(${k})`;
  },
  countable() { const xs = CONTENT.countable(lang); return xs[Math.random() * xs.length | 0]; },
  tallyOf(it) {
    if (!it.tally) return { pics: it.pics || [], line: null };
    const x = APP.countable(), n = it.tally, L = APP.L(), f = x.forms;
    const what = n === 1 ? f.sg[0] : n === 2 ? f.pl[0] : L.numbers ? `${L.numbers[n - 1]} ${x.entry.pl}` : null;
    return { pics: Array(n).fill(x.pic), line: what && APP.exclaim(I18N.capFirst(what, L.bcp47)) };
  },
  tally: it => APP.tallyOf(it).pics,
  hands(n) {
    const one = (raised, right) => `<svg class="hand" viewBox="0 0 32 32" aria-label="${esc(APP.ui().aria[right ? 'rightHand' : 'leftHand'])}"><g${right ? ' transform="translate(32 0) scale(-1 1)"' : ''}>${ABC.art['hand-' + raised]}</g></svg>`;
    return n <= HAND ? one(n, false) : one(HAND, false) + one(n - HAND, true);
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
  $('hub').innerHTML = `<div id="ver" class="label" aria-hidden="true">${esc(APP.t(U.version, { version: CFG.version, build: self.MANIFEST.version }))}</div>` + `<button class="pill sbox hsearch" id="hsearch">${APP.icon('search')}<span>${esc(U.search.placeholder)}</span></button>` + hubTiles().map(x => x.header
    ? `<div class="label caps hh">${iconHTML(x.header.icon, 'hi')} ${esc(U.sections[x.header.id])}</div>`
    : `<button class="card ht" data-id="${x.t.id}" data-play="${x.play ? 1 : 0}">${ageBadge(x.t)}` +
      `${tileIcon(x.t, 'hp')}<span class="hl">${esc(x.lbl)}</span></button>`).join('');
}
function openTile(id, play, quiet, itemId) {
  const t = TILE[id]; if (!usable(t, play)) return false;
  leaveView();
  if (id !== tileId || (play ? 'play' : 'view') !== mode) Object.values(ABC.views).forEach(v => v.reset && v.reset());
  tileId = id; mode = play ? 'play' : 'view'; atHub = false; APP.streak = 0;
  store.set('tile', id); store.set('mode', mode); store.set('athub', false);
  loadIdx(); const at = itemId == null ? -1 : APP.indexOf(itemId); if (at >= 0) { APP.idx = at; APP.saveIdx(); }
  if (!quiet) sfx.pop(); render();
  return true;
}
onTapIn('hub', '.hsearch', openSearch);
onTapIn('hub', '.ht', b => openTile(b.dataset.id, b.dataset.play === '1'));
function leaveView() { APP.stop(); if (view() && view().leave) view().leave(); }
function goHub() { leaveView(); section = sectionNow(); atHub = true; store.set('sec', section); store.set('athub', true); sfx.pop(); render(); speak(APP.exclaim(APP.ui().sections[section]), PAUSE.tap); }
function setSection(id) {
  if (id === sectionNow()) { if (!atHub) goHub(); return; }
  leaveView();
  section = id; store.set('sec', id); atHub = true; store.set('athub', true);
  sfx.pop(); render(); speak(APP.exclaim(APP.ui().sections[id]), PAUSE.tap);
}

const VIEWS = Object.values(ABC.views);
function render() {
  const U = APP.ui(), L = APP.L();
  const sec = sectionNow();
  CFG.sections.forEach(s => { const b = $('t-' + s.id); b.classList.toggle('on', sec === s.id); b.setAttribute('aria-current', sec === s.id ? 'page' : 'false'); b.querySelector('.tl').textContent = U.sections[s.id]; APP.fitText(b.querySelector('.tl')); });
  document.querySelectorAll('.flag').forEach(f => { f.classList.toggle('on', f.dataset.lang === lang); f.setAttribute('aria-pressed', f.dataset.lang === lang); f.title = f.classList.contains('novoice') ? U.noVoice : ''; });
  document.querySelectorAll('.age').forEach(b => { const on = b.dataset.p === profile; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); b.setAttribute('aria-label', profileName(b.dataset.p)); });
  document.querySelectorAll('[data-aria]').forEach(e => e.setAttribute('aria-label', U.aria[e.dataset.aria] || ''));
  document.querySelectorAll('[data-text]').forEach(e => { e.textContent = U[e.dataset.text] || ''; });
  document.title = CFG.name;
  document.querySelectorAll('[data-icon]').forEach(e => { e.innerHTML = APP.icon(e.dataset.icon); });
  document.documentElement.lang = L.bcp47; document.documentElement.dir = L.dir || 'ltr';
  if (!atHub && !usable(tileOf(), mode === 'play')) { leaveView(); atHub = true; }
  const sc = APP.screen(), v = view();
  document.body.dataset.mode = sc;
  document.body.classList.toggle('lownav', !!(v && (v.arrows || v.play)));
  $('ages').hidden = !atHub; $('barback').hidden = atHub;
  $('gridbtn').hidden = atHub || mode === 'play' || !tileOf().index; $('stars').hidden = sc !== GAME_VIEW;
  $('barback').innerHTML = APP.icon('back') + iconHTML(SECTIONS[sec].icon, 'bi');
  $('stars').innerHTML = APP.icon('star') + APP.stars;
  $('hub').hidden = sc !== 'hub';
  VIEWS.forEach(x => { $(x.el).hidden = !(v && v === x); });
  $('stage').hidden = !!(v && v.fullHeight);
  $('prev').hidden = $('next').hidden = !(v && v.arrows); $('act').hidden = !canPlay(v); APP.playing(false);
  closeIndex(); closeInfo(); closeSearch(); APP.backdrop(null);
  if (sc === 'hub') renderHub(); else v.show(started);
}

function setLang(code) {
  if (code === lang) { sfx.pop(); announce(); return; }
  const v0 = !atHub && view(), cur = v0 && APP.item();
  if (v0) leaveView();
  const state = v0 && v0.beforeLang ? v0.beforeLang() : null, scroll = v0 && v0.keepScroll ? $(v0.el).scrollTop : 0;
  lang = code; store.set('lang', code); SPEECH.pick(APP.L().bcp47, APP.L().voices, APP.L().words); markVoices();
  if (v0) {
    const i = cur ? APP.indexOf(cur.id) : -1;
    if (i >= 0) APP.idx = i; else loadIdx();
    if (state && v0.afterLang) v0.afterLang(state);
  }
  sfx.pop(); render();
  if (v0 && v0.keepScroll && view() === v0) $(v0.el).scrollTop = scroll;
  announce();
}
function announce() { const name = APP.L().name, line = !atHub && view().line && view().line(); speak(line ? APP.t(APP.ui().then, { a: name, b: line }) : APP.exclaim(name), PAUSE.line); }

let infoId = null;
const infoFor = c => c && APP.L().info[c] ? APP.L().info[c] : null;
function openInfo(c) {
  const I = infoFor(c); if (!I) return;
  infoId = c; $('infotitle').textContent = I.title;
  const names = CONTENT.words(lang).filter(x => x.concept === c).map(x => x.w);
  $('infolist').innerHTML = (names.length > 1 ? `<div class="label">${esc(APP.ui().also)} ${esc(I18N.list(names, APP.L().bcp47))}</div>` : '') + I.lines.map(([e, t], i) => `<button class="card inf" data-i="${i}"><span class="ie">${e}</span><span>${esc(t)}</span></button>`).join('');
  $('info').hidden = false; sfx.pop(); speak(I.title, PAUSE.tap);
}
function closeInfo() { if (!$('info').hidden) APP.stop(); $('info').hidden = true; }
onTapIn(document, '[data-t]', b => { const play = b.dataset.play === '1'; openTile(b.dataset.t, play, false, play ? null : b.dataset.id); });
onTapIn(document, '.infobtn', b => openInfo(b.dataset.c));
onTapIn(document, '.syn', b => APP.sequence(b.parentNode, [{ light: b, say: b.dataset.say, pop: true }]));
onTapIn('infolist', '.inf', b => APP.sequence('infolist', [{ light: b, say: infoFor(infoId).lines[+b.dataset.i][1] }]));
function playInfo() {
  const I = infoFor(infoId);
  APP.sequence('infolist', I.lines.map((l, i) => ({ light: document.querySelector(`.inf[data-i="${i}"]`), say: l[1] })), { finale: true });
}

const OTHER = CFG.icons.other;
const GROUP_OF = new Map(Object.entries(ABC.groups).flatMap(([g, ms]) => ms.map(m => [m, g])));
const hasGroups = GROUP_OF.size > 0;
let ixMode = store.get('ixmode', 'az');
onTapIn('ixmode', '.seg', b => { ixMode = b.dataset.m; store.set('ixmode', ixMode); openIndex(); });
function openIndex() {
  const v = view(), L = APP.L(), U = APP.ui(), list = APP.items().map((it, i) => ({ it, i }));
  const face = it => v.indexFace ? v.indexFace(it) : esc(it.label);
  const btn = ({ it, i }) => `<button class="card ix${i === APP.idx ? ' on' : ''}" data-i="${i}">${face(it)}</button>`;
  let html = '', az = '';
  const byGroup = !!(v.indexSort && hasGroups && ixMode === 'grp');
  $('ixmode').hidden = !(v.indexSort && hasGroups);
  $('ixmode').querySelectorAll('.seg').forEach(b => { const on = (b.dataset.m === 'grp') === byGroup; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.textContent = U.index[b.dataset.m]; });
  if (v.indexSort) {
    const col = I18N.collator(L.bcp47), A = APP.alphabet(), by = byGroup ? CONTENT.byId(lang) : null, names = by && { get: id => (by.get(id) || {}).w };
    const first = s => { const p = I18N.splitUnits(s, A.units, L.bcp47).find(x => /[\p{L}\p{N}]/u.test(x.text)); return p && p.unit ? p.unit.id : OTHER; };
    list.sort((a, b) => col.compare(a.it.label, b.it.label));
    const keys = byGroup ? Object.keys(ABC.groups) : A.units.map(u => u.id), groups = new Map(keys.map(k => [k, []])); groups.set(OTHER, []);
    list.forEach(x => groups.get(byGroup ? GROUP_OF.get(x.it.concept) || OTHER : first(x.it.label)).push(x));
    const head = u => { if (byGroup) return { text: u === OTHER ? u : ABC.conceptById[u].pic, color: 'inherit', name: u === OTHER ? U.index.other : names.get(u) };
      const unit = A.unit(u); return { text: unit ? unit.upper : u, color: A.color(u) || 'var(--muted)' }; };
    for (const [u, xs] of groups) {
      if (!xs.length) continue;
      const h = head(u), n = APP.t(U.words, { n: xs.length });
      html += `<div class="ixh" id="ixh-${esc(u)}"><b class="ink" style="--c:${h.color}">${esc(h.text)}</b><span class="label">${esc(h.name ? APP.t(U.headCount, { name: h.name, n }) : n)}</span></div>` + xs.map(btn).join('');
    }
    az = [...groups.keys()].filter(u => u !== OTHER || groups.get(OTHER).length)
      .map(u => `<button class="az${groups.get(u).length ? '' : ' dim'}" data-u="${esc(u)}" aria-label="${esc(head(u).name || head(u).text)}">${esc(head(u).text)}</button>`).join('');
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
  for (const h of hs) { if (h.offsetTop - g.scrollTop <= $('ixaz').offsetWidth) cur = h; else break; }
  if (g.scrollTop + g.clientHeight >= g.scrollHeight - 2) cur = hs[hs.length - 1];
  const u = cur.id.slice(4);
  $('ixaz').querySelectorAll('.az').forEach(a => { const on = a.dataset.u === u; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
}
let azRaf = 0;
$('ixgrid').addEventListener('scroll', () => { if (!azRaf) azRaf = requestAnimationFrame(() => { azRaf = 0; syncAZ(); }); }, { passive: true });
const closeIndex = () => { $('index').hidden = true; };
onTapIn('ixgrid', '.ix', b => { closeIndex(); APP.idx = +b.dataset.i; sfx.pop(); view().show(true); });
onScrub('ixaz', '.az', a => {
  const all = [...$('ixaz').children], k = all.indexOf(a);
  const el = all.slice(k).find(x => !x.classList.contains('dim')) || [...all].reverse().find(x => !x.classList.contains('dim'));
  if (!el || el.classList.contains('on')) return;
  const h = document.getElementById('ixh-' + el.dataset.u); if (h) $('ixgrid').scrollTo({ top: h.offsetTop - 4 });
  syncAZ(); sfx.pop();
});

const FOLDS = LANGS.map(c => ABC.langs[c].fold).filter(Boolean);
const fold = s => FOLDS.reduce((x, f) => f(x), String(s || '').replace(/\//g, '').replace(/[-‐]/g, ' ').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase());
function searchPool() {
  const out = [];
  for (const t of TILES) {
    if (!t.search || !usable(t, false)) continue;
    const per = LANGS.map(c => [c, new Map(Tiles.items(t, c).map(it => [it.id, it]))]);
    for (const it of itemsOf(t)) {
      const names = per.map(([c, m]) => { const x = m.get(it.id); return [c, x ? x.name : null]; }).filter(x => x[1]);
      const forms = c => { const x = CONTENT.byId(c).get(it.id) || (it.concept && CONTENT.byId(c).get(it.concept)); return x && x.forms ? [...(x.forms.sg || []), ...(x.forms.pl || [])] : []; };
      out.push({ t, it, names, extra: [it.label, ...per.flatMap(([c]) => forms(c))] });
    }
  }
  return out;
}
function runSearch() {
  const U = APP.ui(), q = fold($('sq').value.trim()), col = I18N.collator(APP.L().bcp47);
  $('sqclear').hidden = !q;
  if (!q) { $('smeta').textContent = ''; $('sres').innerHTML = `<p class="shint">${esc(U.search.hint)}</p>`; return; }
  const stem = q.length >= STEM ? q.slice(0, -1) : null;
  const score = s => { const f = fold(s), ws = f.split(/[\s-]+/); return f === q ? 3 : ws.some(w => w.startsWith(q)) ? 2 : q.length >= STEM && (f.includes(q) || ws.some(w => w.startsWith(stem))) ? 1 : 0; };
  const hits = searchPool().map(x => ({ x, s: Math.max(...x.names.map(n => score(n[1])), ...x.extra.map(score)) })).filter(h => h.s)
    .sort((a, b) => b.s - a.s || col.compare(a.x.names[0][1], b.x.names[0][1]));
  const groups = new Map();
  for (const h of hits) { const k = h.x.it.concept || fold(h.x.it.name); if (groups.has(k)) groups.get(k).push(h.x); else groups.set(k, [h.x]); }
  const rows = [...groups.values()].slice(0, SEARCH_ROWS);
  $('smeta').textContent = rows.length ? APP.t(U.search.results, { n: rows.length }) : U.search.none;
  const mark = n => I18N.highlight(n, q, fold, s => `<mark>${s}</mark>`);
  $('sres').innerHTML = rows.map(([x, ...more]) => {
    const cur = x.names.find(n => n[0] === lang), others = x.names.filter(n => n[0] !== lang);
    const icons = [x, ...more].map(m => `<button class="srk" data-t="${m.t.id}" data-id="${esc(m.it.id)}" data-play="0" aria-label="${esc(label(m.t, 0))}">${tileIcon(m.t, 'ico-s')}</button>`).join('');
    return `<div class="card sr"><button class="srgo" data-t="${x.t.id}" data-id="${esc(x.it.id)}" data-play="0"><span class="srp">${x.it.concept && ABC.art[x.it.concept] ? CONTENT.pic(x.it.concept) : x.it.pic || x.it.nav || esc(x.it.label)}</span>` +
      `<span class="srt"><b>${mark(cur ? cur[1] : x.it.name)}</b><small>${others.map(([c, n]) => `<span><i>${ABC.langs[c].flag}</i>${mark(n)}</span>`).join('')}</small></span></button>${icons}</div>`;
  }).join('');
}
function openSearch() {
  const U = APP.ui(); $('sq').placeholder = U.search.placeholder; $('sq').value = '';
  $('search').hidden = false; runSearch(); sfx.pop(); setTimeout(() => $('sq').focus(), FOCUS_DELAY);
}
const closeSearch = () => { $('search').hidden = true; $('sq').blur(); };
$('sq').addEventListener('input', runSearch);
onTap('sqclear', () => { $('sq').value = ''; runSearch(); $('sq').focus(); });
onTap('sclose', closeSearch);
onTap('ixsearch', openSearch);

$('ages').innerHTML = PROFILES.map(p => { const [a, b] = CFG.profiles[p].ages;
  return `<button class="seg age" data-p="${p}" role="radio">${artSVG(p)}<small>${esc(APP.t(APP.ui().range, { a, b }))}</small></button>`; }).join('');
function setProfile(p) {
  if (!CFG.profiles[p]) return;
  profile = p; store.set('profile', p); atHub = true; store.set('athub', true);
  sfx.pop(); render(); speak(APP.exclaim(profileName(p)), PAUSE.tap);
}

$('flags').innerHTML = LANGS.map(c => `<button class="seg flag" data-lang="${c}" aria-label="${esc(ABC.langs[c].name)}">${ABC.langs[c].flag}<i class="nv" hidden>${esc(CFG.icons.mute)}</i></button>`).join('');
$('tabs').innerHTML = CFG.sections.map(s => `<button class="tab" id="t-${s.id}">${iconHTML(s.icon, 'ti')}<span class="tl"></span></button>`).join('');
function markVoices() {
  document.querySelectorAll('.flag').forEach(f => { const has = SPEECH.hasVoice(ABC.langs[f.dataset.lang].bcp47); f.classList.toggle('novoice', has === false); f.querySelector('.nv').hidden = has !== false; });
}
SPEECH.pick(APP.L().bcp47, APP.L().voices, APP.L().words);
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { SPEECH.pick(APP.L().bcp47, APP.L().voices, APP.L().words); markVoices(); };
markVoices();

function firstTouch() { started = true; ensureAudio(); }
addEventListener('pointerdown', firstTouch, true);
addEventListener('keydown', firstTouch, true);
document.querySelectorAll('.flag').forEach(f => onTap(f, () => setLang(f.dataset.lang)));
CFG.sections.forEach(s => onTap('t-' + s.id, () => setSection(s.id)));
onTap('barback', goHub);
onTap('prev', () => view().step(-1)); onTap('next', () => view().step(1)); onTap('act', () => $('act').classList.contains('on') ? APP.stop() : view().play());
onTap('infoclose', closeInfo); onTap('infoplay', playInfo);
onTap('gridbtn', openIndex); onTap('ixclose', closeIndex);
document.querySelectorAll('.age').forEach(b => onTap(b, () => setProfile(b.dataset.p)));
addEventListener('resize', () => { resizeFx(); if (atHub) return; if (view().arrows) { APP.fitText($('prev')); APP.fitText($('next')); } if (view().resize) view().resize(); });
let sx = null;
$('stage').addEventListener('pointerdown', e => { sx = e.clientX; }, true);
$('stage').addEventListener('pointerup', e => {
  const v = view(), start = sx; sx = null;
  if (start == null || !v || !v.swipe) return;
  const dx = e.clientX - start;
  if (Math.abs(dx) > SWIPE) v.step((dx < 0) !== (APP.L().dir === 'rtl') ? 1 : -1);
});
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
  if (e.key === 'Escape') { closeSearch(); closeIndex(); closeInfo(); return; }
  if (!$('search').hidden || (e.target.closest && e.target.closest('input, textarea'))) return;
  const k = e.key.toLocaleLowerCase(APP.L().bcp47), v = view();
  if ((k === 'arrowright' || k === 'arrowleft') && v && v.step) { v.step((k === 'arrowright') !== (APP.L().dir === 'rtl') ? 1 : -1); return; }
  if (e.repeat) return;
  if ((k === ' ' || k === 'enter') && v && !(e.target.closest && e.target.closest('button, [role=link], [role=slider]'))) { e.preventDefault(); if (canPlay(v)) $('act').classList.contains('on') ? APP.stop() : v.play(); else if (v.line && v.line()) speak(v.line()); return; }
  const pick = (vw, k) => { const it = (vw.choices ? vw.choices() : APP.items()).find(x => x.key === k); if (it && vw.select) vw.select(it); return !!it; };
  if (v && pick(v, k)) return;
  if (k.length !== 1 && !/^\p{L}$/u.test(k)) return;
  if (APP.screen() === GAME_VIEW) return;
  const play = atHub && SECTIONS[section].play;
  const t = TILES.find(t => (play || t.section === sectionNow()) && usable(t, play) &&
    ABC.views[play ? GAME_VIEW : t.view].select && (play ? gameItemsOf(t) : itemsOf(t)).some(it => it.key === k));
  if (!t || (t.id === tileId && !atHub)) return;
  openTile(t.id, play, true);
  if (!play) pick(view(), k);
});
addEventListener('contextmenu', e => e.preventDefault());

loadIdx();
render();
if (document.fonts) document.fonts.ready.then(() => { if (!atHub && view().resize) view().resize(); });

if ('serviceWorker' in navigator) {
  const reg = navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => null);
  let stale = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => fetch('abc/manifest.js', { cache: 'no-store' }).then(r => r.text()).then(t => { stale = !t.includes(`"${self.MANIFEST.version}"`); }).catch(() => {}));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && stale) location.reload();
    else if (!document.hidden) reg.then(r => r && r.update()).catch(() => {});
  });
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { APP.stop(); quietAudio(); }
});
(function () {
  const bar = $('install-bar'), btn = $('install-btn'), msg = $('install-msg'), dismiss = $('dismiss-btn');
  let deferred = null;
  if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) return;
  if (store.get('install-dismissed', false, true)) return;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; msg.textContent = APP.t(APP.ui().install, { app: CFG.name }); bar.hidden = false; });
  bar.addEventListener('pointerdown', e => e.stopPropagation());
  onTap(btn, () => { if (!deferred) return; deferred.prompt(); deferred.userChoice.then(() => { deferred = null; bar.hidden = true; }); });
  onTap(dismiss, () => { bar.hidden = true; store.set('install-dismissed', true, true); });
  addEventListener('appinstalled', () => { bar.hidden = true; });
})();
