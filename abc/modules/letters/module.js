(function () {
  const MAX_EX = 4;
  function examples(L, words, piece, isGroup) {
    const low = x => x.toLocaleLowerCase(L.bcp47), p = low(piece);
    const groups = (L.groups || '').split(/\s+/).filter(Boolean), inGroup = w => groups.some(g => low(w).startsWith(g));
    let ex = words.filter(x => (isGroup || !x.noLetter) && low(x.w).startsWith(p) && (isGroup || !inGroup(x.w))).map(x => [x.w, x.pic, false]);
    if (!ex.length) ex = words.filter(x => low(x.w).includes(p)).map(x => [x.w, x.pic, true]);
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
        return { id: u.id, key: u.lower.length === 1 ? u.lower : null, label: u.upper, name, say: L.sayLetter(name, low(w), inside),
          big: u.cased ? `${esc(u.upper)}<small>${esc(u.lower)}</small>` : esc(u.upper), color, nav: CONTENT.navText(u.upper, color),
          examples: ex, bubble: u.upper, lower: u.cased ? u.lower : null, bubbleColor: color, prompt: u.upper, unit: u, sound: sound(u) };
      });
      const groups = (L.groups || '').split(/\s+/).filter(Boolean).map((g, i, a) => {
        const ex = examples(L, words, g, true), [w] = ex[0] || [g], color = ink((i * 360 / a.length + 20) | 0);
        return { id: 'grp-' + g, label: g, name: g, say: L.sayGroup ? L.sayGroup(g, low(w)) : L.sayLetter(g, low(w), false), big: esc(g), bigClass: 'grp',
          color, nav: CONTENT.navText(g, color), examples: ex, bubble: g, bubbleColor: color, prompt: g, smallBubble: true };
      });
      const read = words.map(x => Object.assign({}, x, { label: x.w, name: x.w }));
      const wordGame = words.filter(x => /^[\p{L}\p{M}][\p{L}\p{M}\s'’-]*$/u.test(x.w))
        .map((x, i) => CONTENT.thing(x, { bubbleColor: ink((i * 47) % 360) }));
      return { letters, groups, words: read, wordGame };
    },
    check(code, S, strings, report) {
      const bare = S.letters.filter(l => !l.examples.length).map(l => l.id);
      if (bare.length) report(`letters with no example word: ${bare.join(' ')}`);
    },
    tiles: [
      { id: 'letters', icon: '🔤', view: 'card', items: S => S.letters, index: true,
        game: { type: 'find', prompts: ['glyph', 'glyph', 'voice'], lower: true, ask: (it, r) => r.lower ? 'lettersSmall' : 'letters' } },
      { id: 'read', icon: '📚', view: 'read', items: S => S.words, index: true, search: true,
        game: { type: 'find', items: S => S.wordGame, prompts: ['glyph', 'glyph', 'glyph', 'voice'], ask: it => it.the ? 'read' : 'readBare' } },
      { id: 'groups', icon: 'ch', view: 'card', items: S => S.groups, index: true,
        game: { type: 'find', prompts: ['glyph', 'glyph', 'voice'] } }
    ]
  });
})();
