// ====== MODULE: LETTERS, READING, LETTER GROUPS ======
MODULE('letters', {
  section: 'abc', ages: [2, 7],
  build(code) {
    const L = ABC.langs[code], t = L.bcp47, words = CONTENT.words(code), units = I18N.units(L);
    const low = x => x.toLocaleLowerCase(t);
    const letters = units.map((u, i, a) => {
      const ex = CONTENT.examples(code, words, u.lower, false), [w, pic, inside] = ex[0] || [u.upper, '🔤', false];
      const name = L.spell ? L.spell(u.upper) : u.upper, color = ink((i * 360 / a.length) | 0);
      return { id: u.id, key: u.lower.length === 1 ? u.lower : null, label: u.upper, name, say: L.sayLetter(name, low(w), inside),
        big: u.cased ? `${esc(u.upper)}<small>${esc(u.lower)}</small>` : esc(u.upper), color, nav: CONTENT.navText(u.upper, color),
        examples: ex, bubble: u.upper, lower: u.cased ? u.lower : null, bubbleColor: color, prompt: u.upper, unit: u };
    });
    const groups = (L.groups || '').split(/\s+/).filter(Boolean).map((g, i, a) => {
      const ex = CONTENT.examples(code, words, g, true), [w] = ex[0] || [g], color = ink((i * 360 / a.length + 20) | 0);
      return { id: 'grp-' + g, label: g, name: g, say: L.sayLetter(g, low(w), false), big: esc(g), bigClass: 'grp',
        color, nav: CONTENT.navText(g, color), examples: ex, bubble: g, bubbleColor: color, prompt: g, smallBubble: true };
    });
    // Read: every word; "Find the word": bubble = picture, question uses the definite form ("Unde e vaca?")
    const read = words.map(x => Object.assign({}, x, { label: x.w, name: x.w }));
    const wordGame = words.filter(x => /^[\p{L}\p{M}][\p{L}\p{M}\s'’-]*$/u.test(x.w)).map((x, i) => ({
      id: x.id, label: x.w, name: x.w, word: x.w, concept: x.concept, the: x.forms && x.forms.sg ? x.forms.sg[1] : null,
      bubble: x.pic, bubbleColor: ink((i * 47) % 360), prompt: x.w, pictureBubble: true }));
    return { letters, units, groups, words: read, wordGame };
  },
  tiles: [
    { id: 'letters', icon: '🔤', view: 'card', items: S => S.letters, index: true,
      game: { type: 'find', prompts: ['glyph', 'glyph', 'voice'], lower: true, ask: (it, r) => r.lower ? 'lettersSmall' : 'letters' } },
    { id: 'read', icon: '📚', view: 'read', items: S => S.words, index: true,
      game: { type: 'find', items: S => S.wordGame, prompts: ['glyph', 'glyph', 'glyph', 'voice'], ask: it => it.the ? 'read' : 'readBare' } },
    { id: 'groups', icon: 'ce·ci', view: 'card', items: S => S.groups,
      game: { type: 'find', prompts: ['glyph', 'glyph', 'voice'] } }
  ]
});
