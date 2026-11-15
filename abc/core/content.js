const INK = ['#ff8f87', '#ffb36b', '#f2d06b', '#93d98f', '#6fd3c4', '#7fb4ff', '#b49cff', '#f38fc4'];

const ITEM = Symbol('item'), OPEN = ['say', 'examples', 'sound'];
const CONTENT = {
  words(code) {
    const L = ABC.langs[code];
    return L.words.filter(e => ABC.conceptById[e.id]).map(e => {
      const syl = e.w.split(/[/\s]+/), w = e.w.replace(/\//g, ''), c = ABC.conceptById[e.id];
      return { id: e.id, concept: e.id, pic: c.pic, w, syl, say: I18N.t(L.strings.exclaim, { name: w }), forms: L.forms(e, w), noLetter: e.ex === false, entry: e };
    });
  },
  exclaim: (code, name) => I18N.t(ABC.langs[code].strings.exclaim, { name }),
  _abc: {},
  alphabet(code) {
    if (this._abc[code]) return this._abc[code];
    const L = ABC.langs[code], units = I18N.units(L), n = units.length;
    const color = id => { const i = units.findIndex(u => u.id === id); return i < 0 ? null : CONTENT.palette(i); };
    const name = u => L.spell ? L.spell(u.upper) : u.upper;
    return (this._abc[code] = { units, color, name, unit: id => units.find(u => u.id === id) || null });
  },
  things(code, ids) { const by = new Map(this.words(code).map(x => [x.id, x])); return ids.map(id => by.get(id)).filter(Boolean); },
  pic: id => ABC.art[id] ? `<svg class="art" viewBox="0 0 32 32" aria-hidden="true">${ABC.art[id]}</svg>` : ABC.conceptById[id].pic,
  the: x => x.forms && x.forms.sg ? x.forms.sg[1] : null,
  palette: i => INK[((Math.round(i) % INK.length) + INK.length) % INK.length],
  made: it => !!(it && it[ITEM]),
  seal(base, extra) {
    for (const [k, v] of Object.entries(extra || {})) {
      if (v === undefined) continue;
      if (k in base && !OPEN.includes(k)) ABC.errors.push(`item ${base.id}: "${k}" is built by CONTENT and may not be overridden`);
      else base[k] = v;
    }
    Object.defineProperty(base, ITEM, { value: true });
    return base;
  },
  thing: (x, extra) => CONTENT.seal({ id: x.id, label: x.w, name: x.w, say: x.say, big: CONTENT.pic(x.id), word: x.w, nav: ABC.art[x.id] ? CONTENT.pic(x.id) : x.pic, pic: x.pic,
    concept: x.id, the: CONTENT.the(x), bubble: x.pic, bubbleArt: ABC.art[x.id] ? CONTENT.pic(x.id) : null, pictureBubble: true, prompt: x.w, plural: !!x.entry.plOnly,
    a: x.forms && x.forms.sg ? x.forms.sg[x.entry.unique ? 1 : 0] : null, g: x.entry.g }, extra),
  glyph: (code, { id, text, name, color, small, word, cls }, extra) => CONTENT.seal({ id, label: text, name, say: CONTENT.exclaim(code, name),
    big: small != null ? `${esc(text)}<small>${esc(small)}</small>` : esc(text), bigClass: cls || '', color, nav: CONTENT.navText(text, color), word: word || '',
    bubble: text, bubbleColor: color, prompt: text, promptWord: name }, extra),
  picture: (code, { id, label, name, big, nav, bubble, bubbleArt, bubbleColor, concept }, extra) => CONTENT.seal({ id, label: label ?? name, name, say: CONTENT.exclaim(code, name),
    big, nav, word: name, bubble: bubble ?? '', bubbleArt: bubbleArt || null, bubbleColor: bubbleColor || null, pictureBubble: !!(bubble || bubbleArt), prompt: name, the: name, concept: concept || null }, extra),
  group(code, { id, things, lead, sizes, label, name, word, says }, extra) {
    const x0 = things[lead || 0];
    return CONTENT.seal({ id, label, name, say: says.join(' '), concept: x0.id, concepts: things.map(x => x.id), nav: x0.pic, word: word || '',
      big: `<span class="pset">${things.map((x, i) => `<span class="part" data-part="${i}" style="--s:${(sizes || [])[i] ?? 1}">${CONTENT.pic(x.id)}</span>`).join('')}</span>`,
      parts: says.map(say => ({ say })), examples: things.map(x => [x.w, x.pic, false]) }, extra);
  },
  sayThe: (code, x) => CONTENT.exclaim(code, I18N.capFirst(CONTENT.the(x) || x.w, ABC.langs[code].bcp47)),
  set(code, spec, s) {
    const by = new Map(this.words(code).map(x => [x.id, x])), ex = ids => (ids || '').split(' ').map(i => by.get(i)).filter(Boolean).map(y => [y.w, y.pic, false]);
    for (const e of spec) if (!by.has(e.id)) ABC.errors.push(`${code}: no word for "${e.id}" (needed by a module)`);
    return spec.map(e => by.get(e.id) && this.thing(by.get(e.id), Object.assign({ examples: ex(e.ex) }, e.sound ? { sound: e.sound } : {}, s && s.say && s.say[e.id] ? { say: s.say[e.id] } : {}))).filter(Boolean);
  },
  navText: (label, color) => `<b style="color:${color}">${esc(label)}</b>`
};
