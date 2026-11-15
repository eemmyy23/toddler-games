const THINGS = ['sun', 'chick', 'fish', 'strawberry', 'star', 'balloon', 'ladybird', 'biscuit', 'car', 'butterfly'];
MODULE('numbers', {
  section: 'num', ages: [2, 6], needs: ['numbers'],
  build(code) {
    const L = ABC.langs[code];
    return { numbers: L.numbers.map((w, i) => {
      const n = i + 1, color = ink((n * 36) % 360), pic = ABC.conceptById[THINGS[i]].pic, thing = L.words.find(e => e.id === THINGS[i] && e.pl);
      return { id: 'n' + n, key: n === 10 ? '0' : String(n), label: String(n), name: w, say: `${w}!`, n,
        big: String(n), color, nav: CONTENT.navText(n, color), word: w, pics: Array(n).fill(pic), pic, pl: thing && thing.pl, g: thing && thing.g,
        bubble: String(n), bubbleColor: color, prompt: String(n), promptWord: w };
    }) };
  },
  tiles: [
    { id: 'digits', icon: '🔢', view: 'card', items: S => S.numbers, index: true, search: true, game: { type: 'find', prompts: ['glyph', 'glyph', 'word', 'voice'] } },
    { id: 'count', icon: '🧮', view: 'count', items: S => S.numbers, game: { type: 'howmany', ask: it => it.pl ? 'countThing' : 'count' } }
  ]
});
