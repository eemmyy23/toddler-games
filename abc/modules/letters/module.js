(function () {
  const MAX_EX = 4;
  function examples(L, words, piece, isGroup) {
    const low = x => x.toLocaleLowerCase(L.bcp47), p = low(piece);
    const groups = (L.groups || '').split(/\s+/).filter(Boolean), inGroup = w => groups.some(g => low(w).startsWith(g));
    let ex = words.filter(x => (isGroup || !x.noLetter) && low(x.w).startsWith(p) && (isGroup || !inGroup(x.w))).map(x => CONTENT.example(x));
    if (!ex.length) ex = words.filter(x => low(x.w).includes(p)).map(x => CONTENT.example(x, true));
    return ex.slice(0, MAX_EX);
  }
  MODULE('letters', {
    section: 'abc', ages: [2, 7], needs: ['sayLetter'],
    build(code) {
      const L = ABC.langs[code], words = CONTENT.words(code).filter(x => !ABC.groups[x.id]), A = CONTENT.alphabet(code);
      const low = x => x.toLocaleLowerCase(L.bcp47);
      const alike = (L.alike || '').split(/\s+/).filter(Boolean), sound = u => alike.find(s => s.split('=').includes(u.lower)) || u.id;
      const letters = A.units.map(u => {
        const ex = examples(L, words, u.lower, false), [w, , inside] = ex[0] || [u.upper, '🔤', false];
        const name = A.name(u), color = A.color(u.id);
        return CONTENT.glyph(code, { id: u.id, text: u.upper, name, color, small: u.cased ? u.lower : null },
          { key: u.lower.length === 1 ? u.lower : null, say: L.sayLetter(name, low(w), inside), examples: ex, lower: u.cased ? u.lower : null, unit: u, sound: sound(u) });
      });
      const groups = (L.groups || '').split(/\s+/).filter(Boolean).map((g, i, a) => {
        const ex = examples(L, words, g, true), [w] = ex[0] || [g];
        return CONTENT.glyph(code, { id: 'grp-' + g, text: g, name: g, color: CONTENT.palette(i), cls: 'grp' },
          { say: L.sayGroup ? L.sayGroup(g, low(w)) : L.sayLetter(g, low(w), false), examples: ex, smallBubble: true });
      });
      const read = words.map(x => CONTENT.word(x));
      const wordGame = words.filter(x => /^[\p{L}\p{M}][\p{L}\p{M}\s'’-]*$/u.test(x.w))
        .map((x, i) => CONTENT.thing(x, { bubbleColor: CONTENT.palette(i) }));
      return { letters, groups, words: read, wordGame };
    },
    check(code, S, strings, report) {
      const bare = S.letters.filter(l => !l.examples.length).map(l => l.id);
      if (bare.length) report(`letters with no example word: ${bare.join(' ')}`);
    },
    tiles: [
      { id: 'letters', icon: '🔤', view: 'card', items: S => S.letters, index: true, perLanguage: true,
        game: { type: 'find', prompts: ['glyph', 'glyph', 'voice'], lower: true, ask: (it, r) => r.lower ? 'lettersSmall' : 'letters' } },
      { id: 'read', icon: '📚', view: 'read', items: S => S.words, index: true, search: true, perLanguage: true,
        game: { type: 'find', items: S => S.wordGame, prompts: ['glyph', 'glyph', 'glyph', 'voice'], ask: it => it.the ? 'read' : 'readBare' } },
      { id: 'groups', icon: 'ch', view: 'card', items: S => S.groups, index: true, perLanguage: true,
        game: { type: 'find', prompts: ['glyph', 'glyph', 'voice'] } }
    ]
  });
})();
