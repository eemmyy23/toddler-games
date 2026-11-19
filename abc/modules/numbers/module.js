{
  const TEN = '🔟', ONE = '🟡', BIG = [100, 1000, 10000, 100000, 1000000, Infinity];
  const num = (code, n, name, i, more, look) => CONTENT.glyph(code, Object.assign({ id: 'n' + n, text: String(n), name, color: CONTENT.palette(i), word: name }, look), Object.assign({ n }, more));
  MODULE('numbers', {
    section: 'num', ages: [2, 6], needs: ['numbers', 'teens', 'tens'],
    build(code) {
      const L = ABC.langs[code], s = this.strings[code];
      const nm = (n, name, i, more, look) => num(code, n, name, i, Object.assign({ a: I18N.t(s.thatsNum, { name }, L.bcp47), g: s.thatsG }, more), look);
      const numbers = L.numbers.map((w, i) => nm(i + 1, w, i + 1, { key: i === 9 ? '0' : String(i + 1), tally: i + 1 }));
      const teens = L.teens.map((w, i) => nm(i + 11, w, i + 11, i < 9
        ? { say: I18N.t(s.teenSay, { name: w, ones: L.numbers[i] }, L.bcp47), pics: [TEN, ...Array(i + 1).fill(ONE)] }
        : { say: s.tensSay[1], pics: [TEN, TEN] }));
      const tens = L.tens.map((w, i) => nm((i + 1) * 10, w, i + 1,
        { say: s.tensSay[i], pics: Array(i + 1).fill(TEN) }, { id: 't' + (i + 1) * 10 }));
      const big = BIG.map((n, i) => { const t = n === Infinity ? '∞' : n.toLocaleString(L.bcp47);
        return s.bigNames && s.bigNames[i] && s.bigSay && s.bigSay[i] && nm(n, s.bigNames[i], i + 5,
          { noPlay: n === Infinity, say: s.bigSay[i], smallBubble: true }, { id: 'b' + (n === Infinity ? 'inf' : n), text: t, cls: 'grp' }); }).filter(Boolean);
      return { numbers, teens, tens, big };
    },
    check(code, S, s, report) {
      if ((s.tensSay || []).length !== 10) report('tensSay must have 10 entries');
      if ((s.bigNames || []).length !== BIG.length || (s.bigSay || []).length !== BIG.length) report(`bigNames and bigSay must have ${BIG.length} entries`);
    },
    tiles: [
      { id: 'digits', icon: '🔢', view: 'card', items: S => S.numbers, index: true, search: true, game: { type: 'find', prompts: ['glyph', 'glyph', 'word', 'voice'] } },
      { id: 'count', icon: '🧮', view: 'count', items: S => S.numbers, game: { type: 'howmany', fingers: 'finger', ask: (it, round) => round.look ? 'countThing' : 'count' } },
      { id: 'teens', icon: '🔟', view: 'card', items: S => S.teens, ages: [4, 7], index: true, search: true,
        game: { type: 'find', prompts: ['glyph', 'word', 'voice'], ask: () => 'digits' } },
      { id: 'tens', icon: '💯', view: 'card', items: S => S.tens, ages: [5, 8], index: true, search: true,
        game: { type: 'find', prompts: ['glyph', 'word', 'voice'], ask: () => 'digits' } },
      { id: 'big', icon: '♾️', view: 'card', items: S => S.big, ages: [7, 12], index: true, search: true,
        game: { type: 'find', prompts: ['glyph', 'voice'], ask: () => 'digits' } }
    ]
  });
}
