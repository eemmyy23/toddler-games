const INK = ['#ff8f87', '#ffb36b', '#f2d06b', '#93d98f', '#6fd3c4', '#7fb4ff', '#b49cff', '#f38fc4'];
const ink = h => INK[Math.round(h / 45) % 8];

const CONTENT = {
  words(code) {
    const L = ABC.langs[code];
    return L.words.filter(e => ABC.conceptById[e.id]).map(e => {
      const syl = e.w.split('/'), w = syl.join(''), c = ABC.conceptById[e.id];
      return { id: e.id, concept: e.id, pic: c.pic, w, syl, forms: L.forms(e, w), noLetter: e.ex === false, entry: e };
    });
  },
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
