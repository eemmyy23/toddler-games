{
const HEX = { red: '#e53935', orange: '#fb8c00', yellow: '#fdd835', green: '#43a047', blue: '#1e88e5', indigo: '#3949ab', purple: '#8e24aa',
  pink: '#f48fb1', brown: '#8d6e63', black: '#111111', white: '#f5f5f5' };
const COLOR_DATA = [
  { id: 'red', things: 'apple strawberry tomato cherry' }, { id: 'blue', things: 'whale dolphin butterfly jeans' },
  { id: 'yellow', things: 'banana lemon chick sun' }, { id: 'green', things: 'cucumber frog leaf grass' },
  { id: 'orange', concept: 'orange-colour', things: 'orange pumpkin fox' }, { id: 'purple', things: 'grape umbrella' },
  { id: 'pink', things: 'pig flower donut' }, { id: 'brown', things: 'bear horse teddy hedgehog' },
  { id: 'black', things: 'hat penguin' }, { id: 'white', things: 'sheep cloud egg milk' },
  { id: 'rainbow', concept: 'rainbow', things: 'sun cloud umbrella', noPlay: true, bands: true }
].map(c => Object.assign({ hex: HEX[c.id] }, c));
const RAINBOW_HEX = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple'].map(k => HEX[k]);
const RAINBOW_DOT = `conic-gradient(${[...RAINBOW_HEX, RAINBOW_HEX[0]].join(',')})`;
function rainbowSVG() {
  return `<svg class="rbsvg" viewBox="0 0 200 104">${RAINBOW_HEX.map((c, i) => { const r = 92 - i * 10;
    return `<path class="part rbb" data-part="${i}" d="M ${100 - r} 100 A ${r} ${r} 0 0 1 ${100 + r} 100" stroke="${c}"/>`; }).join('')}</svg>`;
}
MODULE('colors', {
  section: 'disc', ages: [2, 6],
  build(code) {
    const s = this.strings[code], loc = ABC.langs[code].bcp47, words = CONTENT.byId(code);
    const colors = COLOR_DATA.filter(c => s.colors[c.id]).map(c => {
      const name = s.colors[c.id];
      const examples = c.things.split(' ').map(id => words.get(id)).filter(Boolean).map(x => CONTENT.example(x));
      const parts = c.bands && s.rainbow && s.rainbow.length === RAINBOW_HEX.length ? s.rainbow.map(b => ({ say: b })) : null;
      if (c.bands && !parts) return null;
      return CONTENT.picture(code, { id: c.id, name, concept: c.concept || c.id, bubbleColor: c.hex,
        big: parts ? rainbowSVG() : `<span class="dot sw" style="background:${c.hex}"></span>`, nav: `<span class="dot" style="background:${c.hex || RAINBOW_DOT}"></span>` },
        { say: parts ? CONTENT.listing(code, name, s.rainbow) : undefined, examples, parts, noPlay: !!c.noPlay });
    }).filter(Boolean);
    return { colors };
  },
  check(code, S, s, report) { if (s.rainbow && !S.colors.some(x => x.id === 'rainbow')) report('the rainbow needs all 7 band names (closed set)'); },
  tiles: [
    { id: 'colors', icon: '🎨', view: 'card', items: S => S.colors, index: true, search: true, game: { type: 'find', prompts: ['glyph', 'voice'] } }
  ]
});
}
