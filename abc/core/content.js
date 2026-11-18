const INK = ['#ff8f87', '#ffb36b', '#f2d06b', '#93d98f', '#6fd3c4', '#7fb4ff', '#b49cff', '#f38fc4'];

const CONTENT = (() => {
  const ITEM = Symbol('item'), OPEN = ['say', 'examples', 'sound'], wordCache = {}, abcCache = {};
  const str = (code, k) => ABC.langs[code].strings[k] ?? ABC.langs[ABC.config.baseLanguage].strings[k];
  const t = (code, k, vars) => I18N.t(str(code, k), vars, ABC.langs[code].bcp47);
  const svg = body => `<svg class="art" viewBox="0 0 32 32" aria-hidden="true">${body}</svg>`;
  const pic = id => ABC.art[id] ? svg(ABC.art[id]) : ABC.conceptById[id].pic;
  const the = x => x.forms && x.forms.sg ? x.forms.sg[1] : null;
  const example = (x, inside) => [x.w, x.pic, !!inside];
  function words(code) {
    if (wordCache[code]) return wordCache[code];
    const L = ABC.langs[code];
    const entries = L.words.filter(e => ABC.conceptById[e.id]).flatMap(e => [Object.assign({ key: e.id }, e),
      ...(e.syn || []).map((s, i) => Object.assign({ id: e.id, ex: e.ex, unique: e.unique }, s, { key: `${e.id}~${i + 1}`, synOf: e.id }))]);
    const list = entries.map(e => {
      const syl = e.w.split(/[/\s]+/), w = e.w.replace(/\//g, ''), c = ABC.conceptById[e.id];
      return { id: e.key, concept: e.id, pic: pic(e.id), w, syl, say: t(code, 'exclaim', { name: w }), forms: L.forms(e, w), noLetter: e.ex === false, entry: e };
    });
    return (wordCache[code] = list.map(x => Object.freeze(Object.assign(x, { alts: list.filter(y => y.concept === x.concept && y !== x).map(y => ({ id: y.id, w: y.w })) }))));
  }
  const idCache = {}, byId = code => idCache[code] || (idCache[code] = new Map(words(code).map(x => [x.id, x])));
  function seal(base, extra) {
    for (const [k, v] of Object.entries(extra || {})) {
      if (v === undefined) continue;
      if (k in base && !OPEN.includes(k)) ABC.errors.push(`item ${base.id}: "${k}" is built by CONTENT and may not be overridden`);
      else base[k] = v;
    }
    base.big ??= esc(base.label); base.nav ??= esc(base.label); base.bubble ??= base.label;
    base.thats = { name: base.a || base.name, g: base.plural ? 'pl' : base.a ? base.g : null };
    Object.defineProperty(base, ITEM, { value: true });
    return Object.freeze(base);
  }
  const C = {
    words, byId, pic, svg, the, example,
    exclaim: (code, name) => t(code, 'exclaim', { name }),
    listing: (code, name, list) => t(code, 'listing', { name, list: I18N.list(list, ABC.langs[code].bcp47) }),
    things: (code, ids) => { const by = byId(code); return ids.map(id => by.get(id)).filter(Boolean); },
    palette: i => INK[((Math.round(i) % INK.length) + INK.length) % INK.length],
    made: it => !!(it && it[ITEM] && Object.isFrozen(it)),
    navText: (label, color) => `<b class="ink" style="--c:${color}">${esc(label)}</b>`,
    alphabet(code) {
      if (abcCache[code]) return abcCache[code];
      const L = ABC.langs[code], units = I18N.units(L);
      const color = id => { const i = units.findIndex(u => u.id === id); return i < 0 ? null : C.palette(i); };
      const name = u => L.spell ? L.spell(u.upper) : u.upper;
      return (abcCache[code] = { units, color, name, unit: id => units.find(u => u.id === id) || null });
    },
    thing: (x, extra) => seal({ id: x.id, label: x.w, name: x.w, say: x.say, big: pic(x.concept), word: x.w, nav: pic(x.concept), pic: x.pic,
      concept: x.concept, the: the(x), bubble: x.pic, bubbleArt: ABC.art[x.concept] ? pic(x.concept) : null, pictureBubble: true, prompt: x.w, alts: x.alts, plural: !!x.entry.plOnly,
      a: x.forms && x.forms.sg ? x.forms.sg[x.entry.unique ? 1 : 0] : null, g: x.entry.g }, extra),
    word: (x, extra) => C.thing(x, Object.assign({ syl: x.syl, w: x.w, forms: x.forms }, extra)),
    glyph: (code, { id, text, name, color, small, word, cls }, extra) => seal({ id, label: text, name, say: C.exclaim(code, name),
      big: small != null ? `${esc(text)}<small>${esc(small)}</small>` : esc(text), bigClass: cls || '', color, nav: C.navText(text, color), word: word || '',
      bubble: text, bubbleColor: color, prompt: text, promptWord: name }, extra),
    picture: (code, { id, label, name, big, nav, word, bubble, bubbleArt, bubbleColor, concept }, extra) => seal({ id, label: label ?? name, name, say: C.exclaim(code, name),
      big, nav, word: word ?? name, bubble: bubble ?? '', bubbleArt: bubbleArt || null, bubbleColor: bubbleColor || null, pictureBubble: !!(bubble || bubbleArt), prompt: name, the: name, concept: concept || null }, extra),
    group(code, { id, things, lead, sizes, label, name, word, says, parts, captions }, extra) {
      const x0 = things[lead || 0], caps = captions || things.map(x => x.w);
      const faces = parts || things.map(x => pic(x.id));
      return seal({ id, label, name, say: says.join(' '), concept: x0.id, concepts: things.map(x => x.id), nav: x0.pic, word: word || '',
        big: `<span class="pset">${faces.map((f, i) => `<button class="part" data-part="${i}" aria-label="${esc(says[i])}"><span class="pic" style="--s:${(sizes || [])[i] ?? 1}">${f}</span><span class="caption">${esc(caps[i])}</span></button>`).join('')}</span>`,
        parts: says.map(say => ({ say })) }, extra);
    },
    sayThe: (code, x) => C.exclaim(code, I18N.capFirst(the(x) || x.w, ABC.langs[code].bcp47)),
    set(code, spec, s) {
      const by = byId(code), ex = ids => (ids || '').split(' ').map(i => by.get(i)).filter(Boolean).map(y => example(y));
      for (const e of spec) if (!by.has(e.id)) ABC.errors.push(`${code}: no word for "${e.id}" (needed by a module)`);
      return spec.map(e => by.get(e.id) && C.thing(by.get(e.id), { examples: ex(e.ex), sound: e.sound, say: s && s.say && s.say[e.id] })).filter(Boolean);
    }
  };
  return Object.freeze(C);
})();
