// ====== APP ENGINE ======
// Generic: knows screens ('card', 'count', 'read'), one game engine ('find' / 'howmany'), hubs, info cards,
// speech and navigation. All subjects, words, languages and labels come from the registry (see ARCHITECTURE.md).
'use strict';
const $ = id => document.getElementById(id);
const wait = ms => new Promise(r => setTimeout(r, ms));
const capFirst = (w, t) => w.charAt(0).toLocaleUpperCase(t) + w.slice(1);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ====== STATE (persisted best-effort) ======
const store = {
  get(k, d) { try { const v = localStorage.getItem('abc.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('abc.' + k, JSON.stringify(v)); } catch (e) {} }
};
const defaultLang = () => { const l = (navigator.language || 'en').slice(0, 2).toLowerCase(); return ABC.langs[l] ? l : ABC.langOrder[0]; };
let lang = store.get('lang', defaultLang()); if (!ABC.langs[lang]) lang = ABC.langOrder[0];
let S = buildContent(lang);
const L = () => ABC.langs[lang];
const TOPICS = Object.fromEntries(ABC.topics.map(t => [t.id, t]));
const SECTIONS = Object.fromEntries(ABC.sections.map(s => [s.id, s]));
let section = store.get('sec', ABC.sections[0].id); if (!SECTIONS[section]) section = ABC.sections[0].id;
let atHub = store.get('athub', true);
let topicId = store.get('topic', 'digits'); if (!TOPICS[topicId]) topicId = 'digits';
let mode = store.get('mode2', 'view');                    // 'view' (the topic's learn screen) | 'play'
let stars = store.get('stars', 0);
let weights = store.get('w', {});                          // per-item miss weight → practise what's hard
let streak = 0, idx = 0, started = false;

const cur = () => TOPICS[topicId];
const items = () => (cur().items ? cur().items(S) : []);
const gameItems = () => { const g = cur().game; return ((g.items || cur().items)(S)).filter(it => !it.noPlay); };
const screen = () => atHub ? 'hub' : mode === 'play' ? 'play' : cur().view;
const idxKey = () => `idx_${lang}_${topicId}`;
function loadIdx() { const n = items().length; idx = n ? Math.min(store.get(idxKey(), 0), n - 1) : 0; }
const topicUsable = t => t.view && t.items && t.items(S).length > 0;
const gameUsable = t => t.game && topicUsable(t);
loadIdx();

// ====== AUDIO ======
let AC = null;
function ensureAudio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } }
  if (AC.state !== 'running') AC.resume();
}
function tone(freq, start, dur, vol = 0.18, type = 'sine') {
  if (!AC) return;
  const t = AC.currentTime + start, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.05);
}
const sfx = {
  pop() { tone(660, 0, 0.15, 0.15); tone(990, 0.04, 0.2, 0.08); },
  right() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.08, 0.35, 0.16, 'triangle')); },
  wrong() { tone(220, 0, 0.18, 0.12, 'triangle'); tone(196, 0.12, 0.25, 0.1, 'triangle'); },
  fanfare() { [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, i * 0.11, 0.4, 0.15, 'triangle')); }
};

// ====== SPEECH (device voice; works offline on most devices) ======
let voice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const want = L().tts, vs = speechSynthesis.getVoices().filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(lang));
  voice = vs.find(v => v.lang.replace('_', '-') === want && /female|samantha|karen|ioana|anna|google/i.test(v.name))
       || vs.find(v => v.lang.replace('_', '-') === want) || vs[0] || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
let speakTimer = null, speakDone = null;
const liveUtts = new Set(); // keep references: Chrome/Android can cut off (GC) utterances that aren't referenced
function makeUtt(text, rate, onDone) {
  const u = new SpeechSynthesisUtterance(text + ' …'); // trailing pause so engines don't clip the last sound
  if (voice) u.voice = voice;
  u.lang = voice ? voice.lang : L().tts; u.rate = rate; u.pitch = 1.25;
  liveUtts.add(u);
  let fallback;
  const fin = () => { clearTimeout(fallback); liveUtts.delete(u); onDone && onDone(); };
  u.onend = u.onerror = fin;
  fallback = setTimeout(fin, 1500 + text.length * 110); // in case onend never fires
  return u;
}
// Newest request wins (cancels current + pending). Resolves when the line has been spoken.
function speak(text, delay = 0) {
  if (!('speechSynthesis' in window)) return new Promise(r => setTimeout(r, 600));
  speechSynthesis.cancel(); clearTimeout(speakTimer);
  if (speakDone) speakDone();
  return new Promise(res => {
    let settled = false;
    const done = () => { if (!settled) { settled = true; if (speakDone === done) speakDone = null; res(); } };
    speakDone = done;
    speakTimer = setTimeout(() => speechSynthesis.speak(makeUtt(text, 0.85, done)), delay);
  });
}
function sayNow(text) { // queue a short line without cancelling the previous one
  if (!('speechSynthesis' in window)) return;
  clearTimeout(speakTimer); speechSynthesis.speak(makeUtt(text, 1, null));
}
const hush = () => { if ('speechSynthesis' in window) speechSynthesis.cancel(); };

// ====== FX (confetti) ======
const fx = $('fx'), fctx = fx.getContext('2d');
let W, H;
function resize() { W = fx.width = innerWidth; H = fx.height = innerHeight; }
resize(); addEventListener('resize', () => { resize(); if (screen() === 'read') renderRead(false); });
const fxParts = [];
function confetti(x, y, n = 40, spread = 9) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * spread;
    fxParts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, life: 1, s: 6 + Math.random() * 10,
      hue: Math.random() * 360, r: Math.random() * 6, vr: (Math.random() - .5) * .4, star: Math.random() < 0.35 });
  }
}
function drawStar(c, r) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath(); c.fill();
}
(function loop() {
  fctx.clearRect(0, 0, W, H);
  for (let i = fxParts.length - 1; i >= 0; i--) {
    const p = fxParts[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.vx *= 0.98; p.r += p.vr; p.life -= 0.012;
    if (p.life <= 0 || p.y > H + 40) { fxParts.splice(i, 1); continue; }
    fctx.save(); fctx.globalAlpha = Math.min(1, p.life * 1.5); fctx.translate(p.x, p.y); fctx.rotate(p.r);
    fctx.fillStyle = INK[(p.hue / 45 | 0) % 8];
    if (p.star) drawStar(fctx, p.s); else fctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
    fctx.restore();
  }
  requestAnimationFrame(loop);
})();

// ====== INFO CARDS ("What is it?") — appear wherever an item's concept has an entry in ABC.info ======
let infoConcept = null, infoTok = 0;
const infoFor = c => c && ABC.info[c] ? ABC.info[c][lang] : null;
const infoButton = c => infoFor(c) ? `<button class="infobtn" data-c="${esc(c)}">📖 ${esc(L().ui.info)}</button>` : '';
function openInfo(c) {
  const I = infoFor(c); if (!I) return;
  infoConcept = c;
  $('infotitle').textContent = I.title;
  $('infolist').innerHTML = I.lines.map(([e, t], i) => `<button class="inf" data-i="${i}"><span class="ie">${e}</span><span>${esc(t)}</span></button>`).join('');
  $('info').classList.add('open'); sfx.pop(); speak(I.title, 100);
}
function closeInfo() { infoTok++; $('info').classList.remove('open'); }
const lightInf = i => document.querySelectorAll('.inf').forEach(b => b.classList.toggle('lit', +b.dataset.i === i));
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.infobtn'); if (!b) return;
  e.preventDefault(); e.stopPropagation(); firstTouch(); openInfo(b.dataset.c);
}, true);
$('infolist').addEventListener('click', e => {
  const b = e.target.closest('.inf'); if (!b) return;
  firstTouch(); infoTok++; const i = +b.dataset.i;
  lightInf(i); speak(infoFor(infoConcept).lines[i][1], 40);
});
async function playInfo() {
  const tok = ++infoTok, I = infoFor(infoConcept);
  for (let i = 0; i < I.lines.length; i++) {
    if (tok !== infoTok) return;
    lightInf(i); document.querySelector(`.inf[data-i="${i}"]`).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    await speak(I.lines[i][1], i ? 250 : 80);
  }
  if (tok === infoTok) { lightInf(-1); sfx.right(); }
}

// ====== CARD SCREEN (letters, digits, groups, colours, …) ======
let partTimers = [];
const partsStop = () => { partTimers.forEach(clearTimeout); partTimers = []; };
function partLight(i) {
  $('glyph').classList.toggle('on', i >= 0);
  document.querySelectorAll('#glyph .part').forEach(p => p.classList.toggle('lit', +p.dataset.part === i));
}
// Wrap the first occurrence of the letter/group in the word with its colour
function hl(word, ch, color) {
  const t = L().tts, i = word.toLocaleLowerCase(t).indexOf(ch.toLocaleLowerCase(t));
  if (i < 0) return esc(word);
  return esc(word.slice(0, i)) + `<b style="color:${color}">${esc(word.slice(i, i + ch.length))}</b>` + esc(word.slice(i + ch.length));
}
function showCard(sayIt = true) {
  partsStop();
  const list = items(), it = list[idx], n = list.length, g = $('glyph');
  g.className = it.bigClass || ''; g.innerHTML = it.big; g.style.color = it.color;
  void g.offsetWidth; g.classList.add('pop');
  const pv = list[(idx - 1 + n) % n], nx = list[(idx + 1) % n];
  $('prev').innerHTML = `‹ ${pv.nav}`; $('next').innerHTML = `${nx.nav} ›`;
  const ex = it.examples || [];
  $('pics').style.display = $('word').style.display = ex.length ? 'none' : '';
  $('word').textContent = it.word || '';
  $('pics').innerHTML = (it.pics || []).map((pc, i) => `<span style="animation-delay:${(i * 0.12).toFixed(2)}s">${pc}</span>`).join('');
  $('examples').innerHTML = ex.map(([w, pic], i) => {
    const shown = L().keepCase ? w : w.toLocaleLowerCase(L().tts);
    return `<button class="ex" data-i="${i}"><span class="ep">${pic}</span><span class="ew">${hl(shown, it.label, it.color)}</span></button>`;
  }).join('');
  $('linfo').innerHTML = infoButton(it.concept);
  store.set(idxKey(), idx);
  if (sayIt) speak(it.say, 120);
}
function step(d) { const n = items().length; idx = (idx + d + n) % n; sfx.pop(); showCard(); }
$('examples').addEventListener('pointerdown', e => {
  const b = e.target.closest('.ex'); if (!b) return;
  e.stopPropagation(); firstTouch();
  const ex = items()[idx].examples[+b.dataset.i];
  document.querySelectorAll('.ex.lit').forEach(x => x.classList.remove('lit'));
  b.classList.add('lit'); setTimeout(() => b.classList.remove('lit'), 900);
  sfx.pop(); speak(ex[0], 80);
});
// Tap the big picture: a part says its name; elsewhere on a picture with parts plays all parts; otherwise repeat.
function tapBig(e) {
  e.stopPropagation(); firstTouch(); partsStop();
  const it = items()[idx], part = e.target.closest && e.target.closest('.part');
  if (part && it.parts) {
    const i = +part.dataset.part; partLight(i); sfx.pop(); speak(it.parts[i].say, 40);
    confetti(e.clientX || W / 2, e.clientY || H / 3, 14, 5);
    partTimers.push(setTimeout(() => partLight(-1), 1200));
  } else if (it.parts) {
    hush(); sayNow(it.name);
    it.parts.forEach((p, i) => partTimers.push(setTimeout(() => { partLight(i); sayNow(p.say); sfx.pop(); }, 900 + i * 850)));
    partTimers.push(setTimeout(() => { partLight(-1); confetti(W / 2, H / 3, 60, 10); }, 900 + it.parts.length * 850 + 300));
  } else { showCard(); sfx.pop(); confetti(e.clientX || W / 2, e.clientY || H / 3, 18, 6); }
}
$('glyph').addEventListener('pointerdown', tapBig);
$('word').addEventListener('pointerdown', e => { if (items()[idx] && items()[idx].parts) tapBig(e); });

// ====== READ SCREEN: word → CAPITALS, small letters, syllables, whole word, singular/plural ======
let readTok = 0;
function letterSay(ch) { const up = ch.toLocaleUpperCase(L().tts); return L().spell ? L().spell(up) : up; }
function letterInk(ch) { const up = ch.toLocaleUpperCase(L().tts), it = S.letters.find(x => x.id === up); return it ? it.color : 'var(--text)'; }
function renderRead(sayIt = true) {
  const t = L().tts, e = items()[idx], syl = e.syl, word = syl.join(''), shown = capFirst(word, t), forms = e.forms, pic = e.pic;
  const isL = c => /\p{L}/u.test(c), chars = Array.from(word).filter(isL);
  const tile = (txt, say, cls = '', color = '') =>
    `<button class="rt ${cls}" data-say="${esc(say)}"${color ? ` style="color:${color}"` : ''}>${esc(txt)}</button>`;
  // long words shrink the tiles so a whole word always fits on one line
  const avail = Math.min(innerWidth, 640) - 24, nl = chars.length, gap = nl > 8 ? 3 : 6;
  const tw = Math.min(54, Math.floor((avail - (nl - 1) * gap) / nl));
  const lstyle = `--tw:${tw}px;--tf:${Math.min(32, Math.round(tw * 0.62))}px;gap:${gap}px`;
  const upper = chars.map(c => tile(c.toLocaleUpperCase(t), letterSay(c), 'u', letterInk(c))).join('');
  const lower = Array.from(shown).filter(isL).map(c => tile(c, letterSay(c), 'l', letterInk(c))).join('');
  const longest = forms ? Math.max(...[...(forms.sg || []), ...(forms.pl || [])].map(x => x.length), 8) : 0;
  const chipW = (Math.min(innerWidth, 520) - 24 - 8) / 2, em = longest * 0.66;
  const side = Math.floor((chipW - 2 * 26 - 30) / em), tall = side < 15;
  const cf = Math.max(11, Math.min(20, tall ? Math.floor((chipW - 22) / em) : side));
  const ns = syl.length, sylFont = Math.min(32, Math.floor((avail - ns * 20 - (ns - 1) * 22) / Math.max(1, word.length) * 1.55));
  const syls = syl.map((sy, i) => (i ? '<span class="rsep">·</span>' : '') + tile(i === 0 ? capFirst(sy, t) : sy, sy, 's', INK[(i * 3 + 4) % 8])).join('');
  const U = L().ui;
  $('read').innerHTML =
    `<div id="rpic" data-say="${esc(word)}">${pic}</div>` +
    `<div class="rrow let" id="rU" style="${lstyle}">${upper}</div>` +
    `<div class="rrow let" id="rL" style="${lstyle}">${lower}</div>` +
    (syl.length > 1 ? `<div class="rrow syl" id="rS" style="--sf:${sylFont}px">${syls}</div>` : '') + // one syllable: no row
    `<div class="rrow" id="rW">${tile(shown, word, 'word')}${infoButton(e.concept)}</div>` +
    (forms ? `<div id="rC" class="${tall ? 'tall' : ''}" style="--cf:${cf}px"><div class="rh">${esc(U.sgpl[0])}</div><div class="rh">${esc(U.sgpl[1])}</div>` +
      [0, 1].map(r => [['sg', 1], ['pl', 2]].map(([k, n], c) => forms[k]
        ? `<button class="rc" data-say="${esc(forms[k][r])}"><span class="rce">${pic.repeat(n)}</span><span>${esc(forms[k][r])}</span></button>`
        : `<div class="rc none">${r === 0 ? '— ' + esc(U.none[c]) : ''}</div>`).join('')).join('') + `</div>` : '');
  const R = items(), n = R.length;
  $('rprev').innerHTML = `‹ <b>${R[(idx - 1 + n) % n].pic}</b>`; $('rnext').innerHTML = `<b>${R[(idx + 1) % n].pic}</b> ›`;
  store.set(idxKey(), idx);
  if (sayIt) speak(word, 150);
}
function lightTile(el) { document.querySelectorAll('#read .lit').forEach(x => x.classList.remove('lit')); if (el) el.classList.add('lit'); }
$('read').addEventListener('pointerdown', e => {
  const el = e.target.closest('[data-say]'); if (!el) return;
  e.stopPropagation(); firstTouch(); readTok++;
  lightTile(el.classList.contains('rt') || el.classList.contains('rc') ? el : null);
  sfx.pop(); speak(el.dataset.say, 60);
});
// ▶: spell CAPITALS → small letters as a word → syllables → whole word → singular/plural
async function playRead() {
  const tok = ++readTok, alive = () => tok === readTok && screen() === 'read', word = items()[idx].syl.join('');
  for (const el of document.querySelectorAll('#rU .rt')) { if (!alive()) return; lightTile(el); await speak(el.dataset.say); await wait(150); }
  if (!alive()) return; await wait(300);
  lightTile(null); document.querySelectorAll('#rL .rt').forEach(x => x.classList.add('lit'));
  if ($('rS')) await speak(word); else await wait(700);
  if (!alive()) return; await wait(300);
  for (const el of document.querySelectorAll('#rS .rt')) { if (!alive()) return; lightTile(el); await speak(el.dataset.say); await wait(200); }
  if (!alive()) return; await wait(300);
  const w = document.querySelector('#rW .rt'); lightTile(w); sfx.right(); await speak(word, 350);
  if (!alive()) return; await wait(300);
  for (const el of document.querySelectorAll('#rC .rc[data-say]')) { if (!alive()) return; lightTile(el); await speak(el.dataset.say); await wait(250); }
  if (!alive()) return;
  const r = w.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top, 40, 8);
  setTimeout(() => { if (alive()) lightTile(null); }, 800);
}
function readStep(d) { const n = items().length; idx = (idx + d + n) % n; readTok++; sfx.pop(); renderRead(true); }

// ====== COUNT SCREEN: 1–10 as objects (rows of 5) or mirrored hands ======
let countStyle = store.get('cstyle', 'obj'), countTimers = [];
function stopCount() { countTimers.forEach(clearTimeout); countTimers = []; document.querySelectorAll('.crow.active').forEach(r => r.classList.remove('active')); }
// Hand seen from the back: LEFT hand thumb on the right, RIGHT hand mirrored. Raise order index → … → thumb (5).
const SKIN = '#f8d2ae', SHADE = '#e7b088', NAIL = '#fde7d6';
const FING = { little: { x: 13, w: 13, top: 34 }, ring: { x: 28, w: 14, top: 18 }, middle: { x: 44, w: 14, top: 10 }, index: { x: 60, w: 14, top: 18 } };
const ORDER = ['index', 'middle', 'ring', 'little', 'thumb'];
function handSVG(raised, right) {
  const up = new Set(ORDER.slice(0, raised)); let g = '';
  for (const [name, f] of Object.entries(FING)) {
    g += up.has(name)
      ? `<rect x="${f.x}" y="${f.top}" width="${f.w}" height="${80 - f.top}" rx="${f.w / 2}" fill="${SKIN}"/><ellipse cx="${f.x + f.w / 2}" cy="${f.top + 7}" rx="${f.w * 0.3}" ry="4.5" fill="${NAIL}"/>`
      : `<rect x="${f.x}" y="48" width="${f.w}" height="24" rx="${f.w / 2}" fill="${SHADE}"/>`;
  }
  g += `<rect x="10" y="54" width="68" height="58" rx="22" fill="${SKIN}"/>`;
  g += up.has('thumb')
    ? `<rect x="68" y="50" width="16" height="44" rx="8" fill="${SKIN}" transform="rotate(32 76 92)"/><ellipse cx="76" cy="57" rx="4.5" ry="4" fill="${NAIL}" transform="rotate(32 76 92)"/>`
    : `<rect x="34" y="76" width="42" height="15" rx="7.5" fill="${SHADE}"/>`;
  return `<svg class="hand" viewBox="0 0 106 120" aria-label="${right ? 'right' : 'left'} hand"><g${right ? ' transform="translate(106 0) scale(-1 1)"' : ''}>${g}</g></svg>`;
}
function renderCount() {
  $('c-obj').classList.toggle('on', countStyle === 'obj'); $('c-hand').classList.toggle('on', countStyle === 'hand');
  $('crows').innerHTML = S.numbers.map(it => {
    const objs = countStyle === 'obj' ? it.pics.map(p => `<span class="citem">${p}</span>`).join('')
      : it.n <= 5 ? handSVG(it.n, false) : handSVG(5, false) + handSVG(it.n - 5, true);
    return `<div class="crow" data-n="${it.n}"><div class="cnum"><div class="cdig" style="color:${it.color}">${it.label}</div><div class="cword">${esc(it.name)}</div></div>` +
           `<div class="citems${countStyle === 'obj' ? ' obj' : ''}">${objs}</div></div>`;
  }).join('');
}
$('crows').addEventListener('click', e => { const r = e.target.closest('.crow'); if (r) { ensureAudio(); countRow(+r.dataset.n); } });
function lightRow(n) {
  const row = document.querySelector(`.crow[data-n="${n}"]`); if (!row) return null;
  document.querySelectorAll('.crow.active').forEach(r => r.classList.remove('active'));
  void row.offsetWidth; row.classList.add('active'); row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return row;
}
function countRow(n) { // tap one row: just say that number
  stopCount(); hush();
  const row = lightRow(n); if (!row) return;
  const r = row.querySelector('.cnum').getBoundingClientRect();
  confetti(r.left + r.width / 2, r.top + r.height / 2, 24, 6); sfx.pop(); sayNow(L().nums[n - 1]);
}
function countAll() { // ▶ 1→10: one number per row
  stopCount(); hush();
  L().nums.forEach((w, i) => countTimers.push(setTimeout(() => { lightRow(i + 1); sayNow(w); sfx.pop(); }, i * 1000)));
  countTimers.push(setTimeout(() => { sfx.fanfare(); confetti(W / 2, H / 2, 80, 12); }, 10 * 1000));
}

// ====== GAME ENGINE — one engine for every topic: 'find' (tap the asked item) and 'howmany' ======
let target = null, locked = false, curOpts = [], round = { lower: false, prompt: 'glyph' }, roundTok = 0;
const nChoices = () => streak >= 8 ? 4 : streak >= 3 ? 3 : 2;
const wk = it => `${lang}:${topicId}:${it.id}`;
function pool() {
  let list = gameItems();
  if (cur().game.type === 'howmany') list = list.filter(it => it.n <= (streak >= 5 ? 10 : 5)); // small amounts first
  return list;
}
function pickTarget() { // weighted random: missed items come up more; avoid immediate repeat
  const p = pool().filter(it => it !== target);
  let r = Math.random() * p.reduce((s, it) => s + 1 + (weights[wk(it)] || 0), 0);
  for (const it of p) { r -= 1 + (weights[wk(it)] || 0); if (r <= 0) return it; }
  return p[p.length - 1];
}
function askLine() {
  const g = L().games[topicId];
  return g ? g(target, { small: round.lower }) : `${L().ui.find} ${target.name}!`;
}
function newRound() {
  locked = false; target = pickTarget();
  curOpts = shuffle([target, ...shuffle(pool().filter(it => it !== target)).slice(0, nChoices() - 1)]);
  const g = cur().game, prompts = g.prompts || ['glyph'];
  round = { lower: !!(g.lower && target.lower && Math.random() < 0.5), prompt: prompts[Math.random() * prompts.length | 0] };
  drawRound();
}
function drawRound() {
  locked = false;
  if (cur().game.type === 'howmany') { // show N objects (rows of 5), answer with a digit
    $('ask').innerHTML = `<span class="objs">${target.pics.map(p => `<span>${p}</span>`).join('')}</span>`;
  } else {
    const shown = round.prompt === 'voice' ? '👂' : round.prompt === 'word' ? (target.promptWord || target.prompt) : target.prompt;
    $('ask').innerHTML = `🔊 ${esc(L().ui.find)} <b>${esc(shown)}</b>`;
  }
  const box = $('choices');
  box.className = 'n' + curOpts.length + (target.smallBubble ? ' grp' : '') + (target.pictureBubble ? ' wrd' : '');
  box.innerHTML = '';
  curOpts.forEach((it, i) => {
    const b = document.createElement('button');
    b.className = 'bub'; b.textContent = round.lower && it.lower ? it.lower : it.bubble;
    b.setAttribute('aria-label', it.name); b.dataset.id = it.id;
    b.style.setProperty('--c', it.bubbleColor || ink(i * 90)); b.style.animationDelay = (i * 0.4) + 's';
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); choose(it, b); });
    box.appendChild(b);
  });
  speak(askLine(), 250);
}
function choose(it, el) {
  ensureAudio(); if (locked) return;
  if (it === target) {
    locked = true; streak++;
    stars++; store.set('stars', stars); updateStars();
    weights[wk(it)] = Math.max(0, (weights[wk(it)] || 0) - 1); store.set('w', weights);
    if (el) { el.classList.add('right'); const r = el.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2); } else confetti(W / 2, H / 2);
    const big = stars % 10 === 0, U = L().ui;
    let said;
    if (big) {
      sfx.fanfare();
      for (let k = 0; k < 5; k++) setTimeout(() => confetti(Math.random() * W, H * 0.3 + Math.random() * H * 0.3, 60, 12), k * 180);
      said = speak(U.wow(stars), 700);
    } else { sfx.right(); said = speak(`${U.cheers[Math.random() * U.cheers.length | 0]} ${target.name}!`, 400); }
    const tok = ++roundTok; // next question only after the praise has been fully spoken
    Promise.all([said, wait(big ? 2400 : 1200)]).then(() => wait(350)).then(() => { if (tok === roundTok && screen() === 'play' && locked) newRound(); });
  } else {
    streak = 0;
    weights[wk(target)] = Math.min(5, (weights[wk(target)] || 0) + 1); store.set('w', weights);
    sfx.wrong();
    if (el) { el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong'); }
    speak(`${L().ui.thats(it.name)} ${askLine()}`, 350);
  }
}
function updateStars() {
  const s = $('stars'); s.textContent = '⭐ ' + stars;
  s.animate([{ transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 400 });
}
$('ask').addEventListener('pointerdown', e => { e.stopPropagation(); if (target) speak(askLine()); });

// ====== INDEX (⊞): every item of the current topic on one grid ======
function openIndex() {
  const t = L().tts, read = screen() === 'read';
  $('ixgrid').innerHTML = items().map((it, i) => {
    const face = read ? `${it.pic}<small>${esc(capFirst(it.w, t))}</small>`
      : `<span style="color:${it.color}">${esc(it.label)}</span>${(it.examples && it.examples[0]) ? `<small>${it.examples[0][1]}</small>` : ''}`;
    return `<button class="ix${i === idx ? ' on' : ''}" data-i="${i}">${face}</button>`;
  }).join('');
  $('index').classList.add('open');
  const on = $('ixgrid').querySelector('.on'); if (on) on.scrollIntoView({ block: 'center' });
  sfx.pop();
}
const closeIndex = () => $('index').classList.remove('open');
$('ixgrid').addEventListener('click', e => {
  const b = e.target.closest('.ix'); if (!b) return;
  firstTouch(); closeIndex(); idx = +b.dataset.i; sfx.pop();
  if (screen() === 'read') { readTok++; renderRead(true); } else showCard(true);
});

// ====== HUBS — tiles generated from ABC.topics; the Play hub = one game per topic, grouped by section ======
function hubTiles(sec) {
  if (!SECTIONS[sec].play) return ABC.topics.filter(t => t.section === sec && !(t.view && t.items && !topicUsable(t)))
    .map(t => ({ id: t.id, icon: t.icon, label: L().topics[t.id][0], ok: topicUsable(t), play: false }));
  const out = [];
  for (const s of ABC.sections.filter(s => !s.play)) {
    out.push({ header: s });
    for (const t of ABC.topics.filter(t => t.section === s.id && !(t.view && t.items && !topicUsable(t))))
      out.push({ id: t.id, icon: t.icon, label: L().topics[t.id][1], ok: gameUsable(t), play: true });
  }
  return out;
}
function renderHub() {
  const soon = L().ui.soon;
  $('hub').innerHTML = hubTiles(section).map(t => t.header
    ? `<div class="hh">${t.header.icon} ${esc(L().sections[t.header.id])}</div>`
    : `<button class="ht${t.ok ? '' : ' soon'}" data-id="${t.id}" data-play="${t.play ? 1 : 0}">${t.ok ? '' : `<span class="badge">${esc(soon)}</span>`}` +
      `<span class="hp"${t.icon.length > 3 ? ' style="font-size:34px;font-weight:700;color:var(--amber)"' : ''}>${t.icon}</span><span>${esc(t.label)}</span></button>`).join('');
}
function openTopic(id, play, quiet) {
  const t = TOPICS[id]; if (!t || !(play ? gameUsable(t) : topicUsable(t))) return false;
  if (id !== topicId || (play ? 'play' : 'view') !== mode) target = null;
  topicId = id; mode = play ? 'play' : 'view'; atHub = false; streak = 0;
  store.set('topic', id); store.set('mode2', mode); store.set('athub', false);
  loadIdx(); if (!quiet) sfx.pop(); render();
  return true;
}
$('hub').addEventListener('click', e => {
  const b = e.target.closest('.ht'); if (!b) return;
  firstTouch();
  if (b.classList.contains('soon')) { const l = b.lastChild.textContent; speak(l + (/[.!?]$/.test(l) ? ' ' : '. ') + L().ui.soon); return; }
  openTopic(b.dataset.id, b.dataset.play === '1');
});
function goHub() { atHub = true; store.set('athub', true); sfx.pop(); render(); speak(L().sections[section] + '!', 80); }
function setSection(id) {
  if (id === section) { if (!atHub) goHub(); return; } // tap the active tab → back to its hub
  section = id; store.set('sec', id); atHub = true; store.set('athub', true);
  sfx.pop(); render(); speak(L().sections[id] + '!', 80);
}

// ====== RENDER ======
let keepRound = false;
function render() {
  ABC.sections.forEach(s => { const b = $('t-' + s.id); b.classList.toggle('on', section === s.id); b.querySelector('.tl').textContent = L().sections[s.id]; });
  document.querySelectorAll('.flag').forEach(f => f.classList.toggle('on', f.dataset.lang === lang));
  document.documentElement.lang = lang;
  const sc = screen();
  document.body.dataset.sec = section; document.body.dataset.mode = sc;
  document.body.classList.toggle('topic', !atHub);
  document.body.classList.toggle('idx', !atHub && mode !== 'play' && !!cur().index);
  $('barback').innerHTML = `‹ ${SECTIONS[section].icon}`;
  $('hub').style.display = sc === 'hub' ? 'grid' : 'none';
  $('learn').style.display = sc === 'card' ? 'flex' : 'none';
  $('play').style.display = sc === 'play' ? 'flex' : 'none';
  $('read').style.display = $('rnav').style.display = sc === 'read' ? 'flex' : 'none';
  $('count').style.display = sc === 'count' ? 'block' : 'none';
  $('stage').style.display = sc === 'count' ? 'none' : 'flex';
  $('prev').style.display = $('next').style.display = sc === 'card' ? 'block' : 'none';
  stopCount(); partsStop(); readTok++; closeIndex(); closeInfo();
  if (sc === 'hub') renderHub();
  else if (sc === 'card') showCard(started);
  else if (sc === 'read') renderRead(started);
  else if (sc === 'count') renderCount();
  else if (keepRound && target) drawRound(); else { target = null; newRound(); }
}

// ====== LANGUAGE SWITCH — stays on the same item / question ======
// Same item in the new list: same id; else letter without accents (Ș→S, Ä→A, ß→S); else next dictionary word.
function mapItem(it, list) {
  if (!it) return null;
  const same = list.find(x => x.id === it.id); if (same) return same;
  if (typeof it.id === 'string' && it.id.length === 1) {
    const base = it.id === 'ß' ? 'S' : it.id.normalize('NFD').replace(/\p{M}/gu, '');
    return list.find(x => x.id === base) || null;
  }
  if (it.wid != null) return list.find(x => x.wid > it.wid) || list[0];
  return null;
}
function setLang(l) {
  if (l === lang) { sfx.pop(); render(); announceLang(); return; } // tap current flag → repeat
  const oldItem = items()[idx], oldTarget = target, oldOpts = curOpts, scroll = $('count').scrollTop;
  lang = l; store.set('lang', l); S = buildContent(l); pickVoice();
  if (!atHub && !topicUsable(cur())) atHub = true; // e.g. letter groups exist only in Romanian
  const ni = items().indexOf(mapItem(oldItem, items()));
  if (ni >= 0) { idx = ni; store.set(idxKey(), idx); } else loadIdx();
  keepRound = false;
  if (!atHub && mode === 'play' && oldTarget) {
    const list = pool(), t = mapItem(oldTarget, list), o = oldOpts.map(x => mapItem(x, list));
    if (t && o.every(Boolean) && new Set(o).size === o.length) { target = t; curOpts = o; if (round.lower && !t.lower) round.lower = false; keepRound = true; }
  }
  if (!keepRound) target = null;
  sfx.pop(); render(); keepRound = false;
  if (screen() === 'count') $('count').scrollTop = scroll;
  announceLang();
}
function announceLang() { // the language name in that language, then the current item
  const name = L().name, sc = screen();
  if (sc === 'card') speak(`${name}. ${items()[idx].say}`, 120);
  else if (sc === 'play' && target) speak(`${name}. ${askLine()}`, 250);
  else if (sc === 'read') speak(`${name}. ${items()[idx].syl.join('')}`, 120);
  else speak(`${name}!`, 120);
}

// ====== BUILD THE CHROME (flags, tabs) FROM THE REGISTRY ======
$('flags').innerHTML = ABC.langOrder.map(c => `<button class="flag" data-lang="${c}" aria-label="${esc(ABC.langs[c].name)}">${ABC.langs[c].flag}</button>`).join('');
$('tabs').innerHTML = ABC.sections.map(s => `<button class="tab" id="t-${s.id}"><span class="ti">${s.icon}</span><span class="tl"></span></button>`).join('');

// ====== INPUT ======
function firstTouch() { if (started) return; started = true; ensureAudio(); }
addEventListener('pointerdown', firstTouch, true);
addEventListener('keydown', firstTouch, true);
function tapBtn(el, fn) {
  (typeof el === 'string' ? $(el) : el).addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); firstTouch(); fn(); });
}
document.querySelectorAll('.flag').forEach(f => tapBtn(f, () => setLang(f.dataset.lang)));
ABC.sections.forEach(s => tapBtn('t-' + s.id, () => setSection(s.id)));
tapBtn('barback', goHub);
tapBtn('prev', () => step(-1)); tapBtn('next', () => step(1));
tapBtn('rprev', () => readStep(-1)); tapBtn('rnext', () => readStep(1)); tapBtn('rplay', playRead);
tapBtn('infoclose', closeInfo); tapBtn('infoplay', playInfo);
tapBtn('gridbtn', openIndex); tapBtn('ixclose', closeIndex);
tapBtn('c-obj', () => { countStyle = 'obj'; store.set('cstyle', 'obj'); stopCount(); sfx.pop(); renderCount(); });
tapBtn('c-hand', () => { countStyle = 'hand'; store.set('cstyle', 'hand'); stopCount(); sfx.pop(); renderCount(); });
tapBtn('c-all', countAll);

// swipe left/right on card and read screens
let sx = null;
$('stage').addEventListener('pointerdown', e => { sx = e.clientX; });
$('stage').addEventListener('pointerup', e => {
  const sc = screen(); if (sx == null || (sc !== 'card' && sc !== 'read')) return;
  const dx = e.clientX - sx; sx = null;
  if (Math.abs(dx) > 50) (sc === 'read' ? readStep : step)(dx < 0 ? 1 : -1);
});

// Keyboard: a typed letter/digit shows that item (learn) or answers (play); on a hub it opens the topic that has it.
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase(), sc = screen();
  if (sc === 'read') {
    if (k === 'arrowright') readStep(1); else if (k === 'arrowleft') readStep(-1);
    else if (k === ' ' || k === 'enter') { e.preventDefault(); ensureAudio(); playRead(); }
    return;
  }
  if (k === 'arrowright' || k === 'arrowleft') { if (sc === 'card') step(k === 'arrowright' ? 1 : -1); return; }
  if (e.repeat) return;
  if (sc === 'count') {
    if (/^[0-9]$/.test(k)) { ensureAudio(); countRow(k === '0' ? 10 : +k); }
    else if (k === ' ' || k === 'enter') { e.preventDefault(); ensureAudio(); countAll(); }
    return;
  }
  if (k === ' ' || k === 'enter') { e.preventDefault(); if (sc === 'card') step(1); else if (sc === 'play' && target) speak(askLine()); return; }
  const play = sc === 'play' || (sc === 'hub' && SECTIONS[section].play);
  const has = t => (play ? gameUsable(t) && t.game.type === 'find' : topicUsable(t) && t.view === 'card') && t.items(S).some(it => it.key === k);
  if (sc === 'hub' || !has(cur())) { // open the topic (in this section, or any for Play) that has this key
    const t = ABC.topics.find(t => (play || t.section === section) && has(t));
    if (!t) return; openTopic(t.id, play, true); if (play) return;
  }
  const i = items().findIndex(it => it.key === k); if (i < 0) return;
  if (screen() === 'card') { idx = i; sfx.pop(); showCard(); confetti(W / 2, H / 2, 24, 7); }
  else { const it = curOpts.find(x => x.key === k) || items()[i]; choose(it, document.querySelector(`.bub[data-id="${CSS.escape(it.id)}"]`)); }
});
addEventListener('contextmenu', e => e.preventDefault());

render();

// ====== PWA ======
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' });
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
}
(function () {
  const bar = $('install-bar'), btn = $('install-btn'), msg = $('install-msg'), dismiss = $('dismiss-btn');
  let deferred = null;
  if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) return;
  try { if (sessionStorage.getItem('install-dismissed')) return; } catch (e) {}
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; msg.textContent = L().ui.install; bar.style.display = 'flex'; });
  bar.addEventListener('pointerdown', e => e.stopPropagation());
  btn.addEventListener('click', () => { if (!deferred) return; deferred.prompt(); deferred.userChoice.then(() => { deferred = null; bar.style.display = 'none'; }); });
  dismiss.addEventListener('click', () => { bar.style.display = 'none'; try { sessionStorage.setItem('install-dismissed', '1'); } catch (e) {} });
  addEventListener('appinstalled', () => { bar.style.display = 'none'; });
})();
