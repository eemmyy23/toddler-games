{
  const PAIRS = [['big', 'elephant', 'small', 'mouse'], ['hot', 'fire', 'cold', 'snow'], ['fast', 'jaguar', 'slow', 'snail'],
    ['heavy', 'stone', 'light', 'feather'], ['floats', 'ship', 'sinks', 'anchor'], ['long', 'snake', 'short', 'bug']];
  const SIZE = { small: 0.5 };
  MODULE('opposites', {
    section: 'disc', ages: [3, 7],
    build(code) {
      const s = this.strings[code], by = new Map(CONTENT.words(code).map(x => [x.id, x]));
      const pairs = PAIRS.map(([a, ca, b, cb]) => [[a, by.get(ca)], [b, by.get(cb)]]).filter(p => p.every(([k, x]) => x && s.word[k] && s.say[k]));
      const sides = p => p.map(([k, x]) => ({ id: k, label: s.word[k], name: CONTENT.the(x) || x.w, a: x.forms && x.forms.sg ? x.forms.sg[0] : null, g: x.entry.g, say: s.say[k], concept: x.id, pic: x.pic,
        bubble: x.pic, pictureBubble: true, among: p[0][0], learn: p[0][0] }));
      return {
        pairs: pairs.map(p => ({ id: p[0][0], label: `${s.word[p[0][0]]} – ${s.word[p[1][0]]}`, name: `${s.word[p[0][0]]}, ${s.word[p[1][0]]}`,
          say: p.map(([k]) => s.say[k]).join(' '), concept: p[0][1].id, concepts: p.map(([, x]) => x.id), nav: p[0][1].pic,
          word: `${s.word[p[0][0]]} – ${s.word[p[1][0]]}`, big: `<span class="pset">${p.map(([, x], i) => `<span class="part" data-part="${i}" style="--s:${SIZE[p[i][0]] || 1}">${CONTENT.pic(x.id)}</span>`).join('')}</span>`,
          parts: p.map(([k]) => ({ say: s.say[k] })), examples: p.map(([, x]) => [x.w, x.pic, false]) })),
        sides: pairs.flatMap(sides)
      };
    },
    check(code, S, s, report) { if (S.pairs.length < PAIRS.length) report(`${PAIRS.length - S.pairs.length} opposite pairs miss a word or a sentence`); },
    tiles: [
      { id: 'opposites', icon: '⚖️', view: 'card', items: S => S.pairs, index: true, search: true,
        game: { type: 'find', items: S => S.sides, prompts: ['voice'], ask: it => 'which.' + it.id } }
    ]
  });
}
