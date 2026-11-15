// ====== MODULE: NUMBERS 1–10 ======
const NUMPICS = ['🌞', '🐥', '🐟', '🍓', '⭐', '🎈', '🐞', '🍪', '🚗', '🦋']; // one picture per number (Count, How many?)
// tiles: each tile is a learn screen; its `game` is its Play tile (paired automatically).
MODULE('numbers', {
  section: 'num', ages: [2, 6], needs: ['numbers'],
  build(code) {
    const L = ABC.langs[code];
    return { numbers: L.numbers.map((w, i) => {
      const n = i + 1, color = ink((n * 36) % 360);
      return { id: 'n' + n, key: n === 10 ? '0' : String(n), label: String(n), name: w, say: `${w}!`, n,
        big: String(n), color, nav: CONTENT.navText(n, color), word: w, pics: Array(n).fill(NUMPICS[i]), pic: NUMPICS[i],
        bubble: String(n), bubbleColor: color, prompt: String(n), promptWord: w };
    }) };
  },
  tiles: [
    { id: 'digits', icon: '🔢', view: 'card', items: S => S.numbers, index: true, search: true, game: { type: 'find', prompts: ['glyph', 'glyph', 'word', 'voice'] } },
    { id: 'count', icon: '🧮', view: 'count', items: S => S.numbers, game: { type: 'howmany' } }
  ]
});
