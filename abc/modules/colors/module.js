// ====== MODULE: COLOURS (+ the interactive rainbow) ======
// Language-neutral data here; names per language in lang/<code>.js (colors.<id>, rainbow bands).
const COLOR_DATA = [
  { id: 'red', hex: '#e53935', pics: '🍎🍓🚒' }, { id: 'blue', hex: '#1e88e5', pics: '🫐💧🦋' },
  { id: 'yellow', hex: '#fdd835', pics: '🍌🐤🌻' }, { id: 'green', hex: '#43a047', pics: '🥒🐸🍃' },
  { id: 'orange', hex: '#fb8c00', pics: '🍊🥕🎃' }, { id: 'purple', hex: '#8e24aa', pics: '🍇🍆🔮' },
  { id: 'pink', hex: '#f48fb1', pics: '🐷🌸🦩' }, { id: 'brown', hex: '#8d6e63', pics: '🐻🌰🍫' },
  { id: 'black', hex: '#111111', pics: '🐈‍⬛🎩🎱' }, { id: 'white', hex: '#f5f5f5', pics: '☁️⛄🐑' },
  // learn-only (not one colour → not in "Find the colour"); its bands are tappable parts; concept → "What is it?"
  { id: 'rainbow', concept: 'rainbow', pics: '🌈🌦️☔', noPlay: true, bands: true }
];
// rainbow bands outside → inside (ROGVAIV, as taught in school); a closed set: every language must name all 7
const RAINBOW_HEX = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#3949ab', '#8e24aa'];
const RAINBOW_DOT = 'conic-gradient(#e53935,#fb8c00,#fdd835,#43a047,#1e88e5,#3949ab,#8e24aa,#e53935)';
function rainbowSVG() {
  return `<svg class="rbsvg" viewBox="0 0 200 104">${RAINBOW_HEX.map((c, i) => { const r = 92 - i * 10;
    return `<path class="part rbb" data-part="${i}" d="M ${100 - r} 100 A ${r} ${r} 0 0 1 ${100 + r} 100" stroke="${c}"/>`; }).join('')}</svg>`;
}
MODULE('colors', {
  section: 'disc', ages: [2, 6],
  build(code) {
    const s = this.strings[code], loc = ABC.langs[code].bcp47;
    if (!s) return { colors: [] };
    const colors = COLOR_DATA.filter(c => s.colors[c.id]).map(c => {
      const name = s.colors[c.id], pics = I18N.graphemes(c.pics, loc);
      const parts = c.bands && s.rainbow && s.rainbow.length === RAINBOW_HEX.length ? s.rainbow.map(b => ({ say: b })) : null;
      if (c.bands && !parts) return null; // closed set incomplete → don't show a broken rainbow
      return { id: c.id, label: name, name, say: parts ? `${name}: ${I18N.list(s.rainbow, loc)}!` : `${name}!`,
        big: parts ? rainbowSVG() : `<span class="sw" style="background:${c.hex}"></span>`,
        nav: `<span class="dot" style="background:${c.hex || RAINBOW_DOT}"></span>`,
        word: name, pics, concept: c.concept || null, parts, noPlay: !!c.noPlay, bubble: '', bubbleColor: c.hex, prompt: name };
    }).filter(Boolean);
    return { colors };
  },
  tiles: [
    { id: 'colors', icon: '🎨', view: 'card', items: S => S.colors, index: true, search: true, game: { type: 'find', prompts: ['glyph', 'voice'] } }
  ]
});
