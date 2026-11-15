{
const COLOR_DATA = [
  { id: 'red', hex: '#e53935', things: 'apple strawberry tomato cherry' }, { id: 'blue', hex: '#1e88e5', things: 'whale dolphin butterfly jeans' },
  { id: 'yellow', hex: '#fdd835', things: 'banana lemon chick sun' }, { id: 'green', hex: '#43a047', things: 'cucumber frog leaf grass' },
  { id: 'orange', concept: 'orange-colour', hex: '#fb8c00', things: 'orange pumpkin fox' }, { id: 'purple', hex: '#8e24aa', things: 'grape umbrella' },
  { id: 'pink', hex: '#f48fb1', things: 'pig flower donut' }, { id: 'brown', hex: '#8d6e63', things: 'bear horse teddy hedgehog' },
  { id: 'black', hex: '#111111', things: 'hat penguin' }, { id: 'white', hex: '#f5f5f5', things: 'sheep cloud egg milk' },
  { id: 'rainbow', concept: 'rainbow', things: 'sun cloud umbrella', noPlay: true, bands: true }
];
const RAINBOW_HEX = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#3949ab', '#8e24aa'];
const RAINBOW_DOT = 'conic-gradient(#e53935,#fb8c00,#fdd835,#43a047,#1e88e5,#3949ab,#8e24aa,#e53935)';
function rainbowSVG() {
  return `<svg class="rbsvg" viewBox="0 0 200 104">${RAINBOW_HEX.map((c, i) => { const r = 92 - i * 10;
    return `<path class="part rbb" data-part="${i}" d="M ${100 - r} 100 A ${r} ${r} 0 0 1 ${100 + r} 100" stroke="${c}"/>`; }).join('')}</svg>`;
}
MODULE('colors', {
  section: 'disc', ages: [2, 6],
  build(code) {
    const s = this.strings[code], loc = ABC.langs[code].bcp47, words = new Map(CONTENT.words(code).map(x => [x.id, x]));
    const colors = COLOR_DATA.filter(c => s.colors[c.id]).map(c => {
      const name = s.colors[c.id];
      const examples = c.things.split(' ').map(id => words.get(id)).filter(Boolean).map(x => [x.w, x.pic, false]), pics = examples.map(x => x[1]);
      const parts = c.bands && s.rainbow && s.rainbow.length === RAINBOW_HEX.length ? s.rainbow.map(b => ({ say: b })) : null;
      if (c.bands && !parts) return null;
      return { id: c.id, label: name, name, say: parts ? `${name}: ${I18N.list(s.rainbow, loc)}!` : `${name}!`,
        big: parts ? rainbowSVG() : `<span class="dot sw" style="background:${c.hex}"></span>`,
        nav: `<span class="dot" style="background:${c.hex || RAINBOW_DOT}"></span>`,
        word: name, pics, examples, concept: c.concept || c.id, parts, noPlay: !!c.noPlay, bubble: '', bubbleColor: c.hex, prompt: name };
    }).filter(Boolean);
    return { colors };
  },
  check(code, S, s, report) { if (s.rainbow && !S.colors.some(x => x.id === 'rainbow')) report('the rainbow needs all 7 band names (closed set)'); },
  tiles: [
    { id: 'colors', icon: '🎨', view: 'card', items: S => S.colors, index: true, search: true, game: { type: 'find', prompts: ['glyph', 'voice'] } }
  ]
});
}
