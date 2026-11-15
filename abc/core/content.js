const INK = ['#ff8f87', '#ffb36b', '#f2d06b', '#93d98f', '#6fd3c4', '#7fb4ff', '#b49cff', '#f38fc4'];
const ink = h => INK[Math.round(h / 45) % 8];

const CONTENT = {
  words(code) {
    const L = ABC.langs[code];
    return L.words.filter(e => ABC.conceptById[e.id]).map(e => {
      const syl = e.w.split(/[/\s]+/), w = e.w.replace(/\//g, ''), c = ABC.conceptById[e.id];
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
  things(code, ids) { const by = new Map(this.words(code).map(x => [x.id, x])); return ids.map(id => by.get(id)).filter(Boolean); },
  pic: id => ABC.art[id] ? `<svg class="art" viewBox="0 0 32 32" aria-hidden="true">${ABC.art[id]}</svg>` : ABC.conceptById[id].pic,
  the: x => x.forms && x.forms.sg ? x.forms.sg[1] : null,
  thing: (x, more) => Object.assign({ id: x.id, label: x.w, name: x.w, say: `${x.w}!`, big: CONTENT.pic(x.id), word: x.w, nav: x.pic, pic: x.pic,
    concept: x.id, the: CONTENT.the(x), bubble: x.pic, bubbleArt: ABC.art[x.id] ? CONTENT.pic(x.id) : null, pictureBubble: true, prompt: x.w, plural: !!x.entry.plOnly }, more),
  set(code, spec, s) {
    const by = new Map(this.words(code).map(x => [x.id, x])), ex = ids => (ids || '').split(' ').map(i => by.get(i)).filter(Boolean).map(y => [y.w, y.pic, false]);
    return spec.map(e => by.get(e.id) && this.thing(by.get(e.id), Object.assign({ examples: ex(e.ex) }, e.sound ? { sound: e.sound } : {}, s && s.say && s.say[e.id] ? { say: s.say[e.id] } : {}))).filter(Boolean);
  },
  navText: (label, color) => `<b style="color:${color}">${esc(label)}</b>`
};
