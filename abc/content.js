// ====== CONTENT — turns raw data + a language into uniform ITEMS ======
// Every screen and game in app.js works on items of this one shape, so it needs no per-subject code:
//   id        stable across languages (language switch keeps the same item)
//   key       keyboard key that selects it (letters, digits)
//   label     short text (letter, digit, group, colour name, word)
//   name      what the voice calls it ("bî", "trei", "roșu")
//   say       spoken line when it's shown in Learn
//   big       HTML of the big picture in Learn;  bigClass: extra CSS class
//   color     ink colour of the label;  nav: HTML shown on the ‹ › arrows
//   word      word under the picture;  pics: pictures under it;  examples: [[word, pic, inside?], …] cards
//   concept   emoji → "What is it?" card (abc/data/info.js) if one exists
//   parts     tappable parts of the picture: [{ say }] (e.g. rainbow bands)
//   bubble    text in a game bubble;  lower: small-letter variant;  bubbleColor;  prompt: text shown in the question
//   the       definite form for questions ("Where is the cow?");  n: amount;  noPlay: not used in games
const NUMPICS = ['🌞', '🐥', '🐟', '🍓', '⭐', '🎈', '🐞', '🍪', '🚗', '🦋'];
// Night palette for letters/bubbles: soft pastels that read well on dark navy
const INK = ['#ff8f87', '#ffb36b', '#f2d06b', '#93d98f', '#6fd3c4', '#7fb4ff', '#b49cff', '#f38fc4'];
const ink = h => INK[Math.round(h / 45) % 8];
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const MAX_EX = 4;
const splitEmoji = s => Array.from(s.matchAll(/\p{Extended_Pictographic}(‍\p{Extended_Pictographic}|️)*|\p{Regional_Indicator}{2}|[0-9#*]️?⃣/gu), m => m[0]);

// Dictionary rows → words of one language: { id, pic, w, syl, forms, noLetter }
function wordsFor(code) {
  const L = ABC.langs[code], out = [];
  ABC.words.forEach((row, id) => {
    let s = row[code]; if (!s) return;
    const noLetter = s[0] === '!'; if (noLetter) s = s.slice(1);
    const [sylS, ...f] = s.split('|');
    const syl = sylS.split('/'), w = syl.join('');
    out.push({ id, pic: row.pic, w, syl, forms: f.length ? L.forms(w, f) : null, noLetter });
  });
  return out;
}

function rainbowSVG() {
  const arcs = ABC.rainbow.map((b, i) => {
    const r = 92 - i * 10;
    return `<path class="part rbb" data-part="${i}" d="M ${100 - r} 100 A ${r} ${r} 0 0 1 ${100 + r} 100" stroke="${b.hex}"/>`;
  }).join('');
  return `<svg class="rbsvg" viewBox="0 0 200 104">${arcs}</svg>`;
}
const RAINBOW_DOT = 'conic-gradient(#e53935,#fb8c00,#fdd835,#43a047,#1e88e5,#3949ab,#8e24aa,#e53935)';

function buildContent(code) {
  const L = ABC.langs[code], t = L.tts, WL = wordsFor(code);
  const low = x => x.toLocaleLowerCase(t);
  const navText = (label, color) => `<b style="color:${color}">${esc(label)}</b>`;
  // RO: words starting with ce/ci/che/chi/ge/gi/ghe/ghi belong to the groups, not to C / G
  const inGroup = w => (L.groups || []).some(g => low(w).startsWith(g));
  const exFor = (ch, isGroup) => {
    const c = low(ch);
    let ex = WL.filter(x => !x.noLetter && low(x.w).startsWith(c) && (isGroup || !inGroup(x.w))).map(x => [x.w, x.pic, false]);
    if (!ex.length) ex = WL.filter(x => low(x.w).includes(c)).map(x => [x.w, x.pic, true]); // Ă → vacă, ß → Fuß
    return ex.slice(0, MAX_EX);
  };
  const S = {};

  S.letters = Array.from(L.alphabet).map((ch, i, a) => {
    const ex = exFor(ch, false), [w, pic, like] = ex[0] || [ch, '🔤', false];
    const name = L.spell ? L.spell(ch) : ch, small = low(ch), color = ink((i * 360 / a.length) | 0);
    return { id: ch, key: small, label: ch, name, say: L.sayLetter(name, low(w), like),
      big: small !== ch ? `${esc(ch)}<small>${esc(small)}</small>` : esc(ch), color, nav: navText(ch, color),
      examples: ex, concept: null, bubble: ch, lower: small !== ch ? small : null, bubbleColor: color, prompt: ch };
  });

  S.numbers = L.nums.map((w, i) => {
    const n = i + 1, color = ink((n * 36) % 360);
    return { id: 'n' + n, key: n === 10 ? '0' : String(n), label: String(n), name: w, say: `${w}!`, n,
      big: String(n), color, nav: navText(n, color), word: w, pics: Array(n).fill(NUMPICS[i]), pic: NUMPICS[i],
      bubble: String(n), bubbleColor: color, prompt: String(n), promptWord: w };
  });

  S.groups = (L.groups || []).map((g, i, a) => {
    const ex = exFor(g, true), [w] = ex[0] || [g], color = ink((i * 360 / a.length + 20) | 0);
    return { id: g, label: g, name: g, say: L.sayLetter(g, low(w), false), big: esc(g), bigClass: 'grp',
      color, nav: navText(g, color), examples: ex, bubble: g, bubbleColor: color, prompt: g, smallBubble: true };
  });

  S.colors = ABC.colors.filter(c => c[code]).map(c => {
    const name = c[code], pics = splitEmoji(c.pics), rb = c.parts === 'rainbow';
    const parts = rb ? ABC.rainbow.map(b => ({ say: b[code] })) : null;
    return { id: c.id, label: name, name, say: rb ? `${name}: ${parts.map(p => p.say).join(', ')}!` : `${name}!`,
      big: rb ? rainbowSVG() : `<span class="sw" style="background:${c.hex}"></span>`,
      nav: `<span class="dot" style="background:${c.hex || RAINBOW_DOT}"></span>`,
      word: name, pics, concept: c.concept || null, parts, noPlay: !!c.noPlay,
      bubble: '', bubbleColor: c.hex, prompt: name };
  });

  // Read: every word in the dictionary (singular/plural table only when it has forms)
  S.words = WL.map(x => Object.assign({}, x, { id: 'w' + x.id, wid: x.id, label: x.w, name: x.w, concept: x.pic }));
  // "Find the word": bubble = picture, question = the written word ("Unde e vaca?")
  S.wordGame = WL.filter(x => /^\p{L}+$/u.test(x.w)).map((x, i) => ({
    id: 'w' + x.id, label: x.w, name: x.w, word: x.w, concept: x.pic,
    the: x.forms && x.forms.sg ? x.forms.sg[1] : null,
    bubble: x.pic, bubbleColor: ink((i * 47) % 360), prompt: x.w, pictureBubble: true }));

  // fill in neutral defaults so screens never need to check
  for (const list of Object.values(S)) for (const it of list) if (!it.color) it.color = '';
  return S;
}
