{
  const PAIRS = [['big', 'elephant', 'small', 'mouse'], ['hot', 'fire', 'cold', 'snow'], ['fast', 'jaguar', 'slow', 'snail'],
    ['heavy', 'stone', 'light', 'feather'], ['floats', 'ship', 'sinks', 'anchor'], ['long', 'snake', 'short', 'bug']];
  const SIZE = { small: 0.5 };
  MODULE('opposites', {
    section: 'disc', ages: [3, 7],
    build(code) {
      const s = this.strings[code], loc = ABC.langs[code].bcp47, by = new Map(CONTENT.words(code).map(x => [x.id, x]));
      const pairs = PAIRS.map(([a, ca, b, cb]) => [[a, by.get(ca)], [b, by.get(cb)]]).filter(p => p.every(([k, x]) => x && s.word[k] && s.say[k]));
      return {
        pairs: pairs.map(p => { const label = I18N.t(s.pair, { a: s.word[p[0][0]], b: s.word[p[1][0]] });
          return CONTENT.group(code, { id: p[0][0], things: p.map(([, x]) => x), sizes: p.map(([k]) => SIZE[k]), label, word: label,
            name: I18N.list(p.map(([k]) => s.word[k]), loc), says: p.map(([k]) => s.say[k]) }); }),
        sides: pairs.flatMap(p => p.map(([k, x]) => CONTENT.thing(x, { say: s.say[k], side: k, among: p[0][0], learn: p[0][0] })))
      };
    },
    tiles: [
      { id: 'opposites', icon: '⚖️', view: 'card', items: S => S.pairs, index: true, search: true,
        game: { type: 'find', items: S => S.sides, prompts: ['voice'], ask: it => 'which.' + it.side } }
    ]
  });
}
