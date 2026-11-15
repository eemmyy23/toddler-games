{
  const THINGS = ['apple', 'chick', 'fish', 'strawberry', 'star', 'balloon', 'ladybird', 'biscuit', 'car', 'butterfly'];
  const TEN = '🔟', ONE = '🟡', BIG = [100, 1000, 10000, 100000, 1000000, Infinity];
  const num = (n, name, color, more) => Object.assign({ id: 'n' + n, label: String(n), name, say: `${name}!`, n, big: String(n), color,
    nav: CONTENT.navText(n, color), word: name, bubble: String(n), bubbleColor: color, prompt: String(n), promptWord: name }, more);
  MODULE('numbers', {
    section: 'num', ages: [2, 6], needs: ['numbers', 'teens', 'tens'],
    build(code) {
      const L = ABC.langs[code], s = this.strings[code];
      const numbers = L.numbers.map((w, i) => {
        const n = i + 1, pic = ABC.conceptById[THINGS[i]].pic, thing = L.words.find(e => e.id === THINGS[i] && e.pl);
        return num(n, w, ink((n * 36) % 360), { key: n === 10 ? '0' : String(n), pics: Array(n).fill(pic), pic, pl: thing && thing.pl, g: thing && thing.g });
      });
      const teens = L.teens.map((w, i) => num(i + 11, w, ink(((i + 11) * 36) % 360), i < 9
        ? { say: I18N.t(s.teenSay, { name: w, ones: L.numbers[i] }), pics: [TEN, ...Array(i + 1).fill(ONE)] }
        : { say: s.tensSay[1], pics: [TEN, TEN] }));
      const tens = L.tens.map((w, i) => num((i + 1) * 10, w, ink(((i + 1) * 36) % 360),
        { id: 't' + (i + 1) * 10, say: s.tensSay[i], pics: Array(i + 1).fill(TEN) }));
      const big = BIG.map((n, i) => { const t = n === Infinity ? '∞' : n.toLocaleString(L.bcp47), color = ink((i * 60 + 200) % 360);
        return s.bigNames && s.bigNames[i] && s.bigSay && s.bigSay[i] && num(n, s.bigNames[i], color, { id: 'b' + (n === Infinity ? 'inf' : n), label: t, big: t,
          bigClass: 'grp', noPlay: n === Infinity, bubble: t, prompt: t, say: s.bigSay[i], smallBubble: true, nav: CONTENT.navText(t, color) }); }).filter(Boolean);
      return { numbers, teens, tens, big };
    },
    check(code, S, s, report) {
      if ((s.tensSay || []).length !== 10) report('tensSay must have 10 entries');
      if ((s.bigNames || []).length !== BIG.length || (s.bigSay || []).length !== BIG.length) report(`bigNames and bigSay must have ${BIG.length} entries`);
    },
    tiles: [
      { id: 'digits', icon: '🔢', view: 'card', items: S => S.numbers, index: true, search: true, game: { type: 'find', prompts: ['glyph', 'glyph', 'word', 'voice'] } },
      { id: 'count', icon: '🧮', view: 'count', items: S => S.numbers, game: { type: 'howmany', ask: it => it.pl ? 'countThing' : 'count' } },
      { id: 'teens', icon: '🔟', view: 'card', items: S => S.teens, ages: [4, 7], index: true, search: true,
        game: { type: 'find', prompts: ['glyph', 'word', 'voice'], ask: () => 'digits' } },
      { id: 'tens', icon: '💯', view: 'card', items: S => S.tens, ages: [5, 8], index: true, search: true,
        game: { type: 'find', prompts: ['glyph', 'word', 'voice'], ask: () => 'digits' } },
      { id: 'big', icon: '♾️', view: 'card', items: S => S.big, ages: [7, 12], index: true, search: true,
        game: { type: 'find', prompts: ['glyph', 'voice'], ask: () => 'digits' } }
    ]
  });
}
