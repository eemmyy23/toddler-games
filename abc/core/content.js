// ====== CONTENT HELPERS — shared by modules and views to build / read ITEMS for one language ======
// An ITEM is what every view and game works on (no per-subject code in the engine):
//   id        stable across languages        key       keyboard key (letters, digits)
//   label     short text (also the sort key)  name      what the voice calls it
//   say       spoken line in Learn           big       HTML of the big picture (default: label);  bigClass
//   color     ink colour;  nav: HTML on the ‹ › arrows (default: label)
//   word / pic / pics / examples [[word, pic, inside?]]     concept   id → "What is it?" card
//   parts     tappable parts of the picture [{ say }] (.part[data-part=i] inside big)
//   unit      letter unit (letters) · w / syl / forms  word, syllables, grammatical forms (Read) · n  number (Count)
//   bubble (default: label) / lower / bubbleColor / prompt / promptWord / the / noPlay / smallBubble / pictureBubble  (games)
// night palette: soft pastels that read well on dark navy
const INK = ['#ff8f87', '#ffb36b', '#f2d06b', '#93d98f', '#6fd3c4', '#7fb4ff', '#b49cff', '#f38fc4'];
const ink = h => INK[Math.round(h / 45) % 8];

const CONTENT = {
  // the words of one language, in file order, with forms worked out by its grammar
  words(code) {
    const L = ABC.langs[code];
    return L.words.filter(e => ABC.conceptById[e.id]).map(e => {
      const syl = e.w.split('/'), w = syl.join(''), c = ABC.conceptById[e.id];
      return { id: e.id, concept: e.id, pic: c.pic, w, syl, forms: L.forms(e, w), noLetter: e.ex === false, entry: e };
    });
  },
  // the alphabet of a language: units + one colour and one spoken name per letter — used by letter items, Read and the A–Z index
  _abc: {},
  alphabet(code) {
    if (this._abc[code]) return this._abc[code];
    const L = ABC.langs[code], units = I18N.units(L), n = units.length;
    const color = id => { const i = units.findIndex(u => u.id === id); return i < 0 ? null : ink((i * 360 / n) | 0); };
    const name = u => L.spell ? L.spell(u.upper) : u.upper;
    return (this._abc[code] = { units, color, name, unit: id => units.find(u => u.id === id) || null });
  },
  navText: (label, color) => `<b style="color:${color}">${esc(label)}</b>`
};
