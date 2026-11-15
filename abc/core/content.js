// ====== CONTENT HELPERS — shared by modules to build ITEMS for one language ======
// An ITEM is what every view and game works on (no per-subject code in the engine):
//   id        stable across languages        key       keyboard key (letters, digits)
//   label     short text                     name      what the voice calls it
//   say       spoken line in Learn           big       HTML of the big picture;  bigClass
//   color     ink colour;  nav: HTML on the ‹ › arrows
//   word / pics / examples [[word, pic, inside?]]     concept   id → "What is it?" card
//   parts     tappable parts of the picture [{ say }] (.part[data-part=i] inside big)
//   bubble / lower / bubbleColor / prompt / promptWord / the / n / noPlay / smallBubble / pictureBubble
const NUMPICS = ['🌞', '🐥', '🐟', '🍓', '⭐', '🎈', '🐞', '🍪', '🚗', '🦋'];
// night palette: soft pastels that read well on dark navy
const INK = ['#ff8f87', '#ffb36b', '#f2d06b', '#93d98f', '#6fd3c4', '#7fb4ff', '#b49cff', '#f38fc4'];
const ink = h => INK[Math.round(h / 45) % 8];
const MAX_EX = 4;

const CONTENT = {
  // the words of one language, in file order, with forms worked out by its grammar
  words(code) {
    const L = ABC.langs[code];
    return L.words.filter(e => ABC.conceptById[e.id]).map(e => {
      const syl = e.w.split('/'), w = syl.join(''), c = ABC.conceptById[e.id];
      return { id: e.id, concept: e.id, pic: c.pic, w, syl, forms: L.forms(e, w), noLetter: e.ex === false, entry: e };
    });
  },
  // example words for a letter / letter group: words starting with it, else words containing it
  examples(code, words, piece, isGroup) {
    const L = ABC.langs[code], t = L.bcp47, low = x => x.toLocaleLowerCase(t), p = low(piece);
    const groups = (L.groups || '').split(/\s+/).filter(Boolean);
    const inGroup = w => groups.some(g => low(w).startsWith(g));
    let ex = words.filter(x => !x.noLetter && low(x.w).startsWith(p) && (isGroup || !inGroup(x.w))).map(x => [x.w, x.pic, false]);
    if (!ex.length) ex = words.filter(x => low(x.w).includes(p)).map(x => [x.w, x.pic, true]);
    return ex.slice(0, MAX_EX);
  },
  navText: (label, color) => `<b style="color:${color}">${esc(label)}</b>`
};
