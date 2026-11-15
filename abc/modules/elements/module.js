{
  const ELEMENTS = [[1, 'H'], [2, 'He'], [3, 'Li'], [4, 'Be'], [5, 'B'], [6, 'C'], [7, 'N'], [8, 'O'], [9, 'F'], [10, 'Ne'], [11, 'Na'], [12, 'Mg'],
    [13, 'Al'], [14, 'Si'], [15, 'P'], [16, 'S'], [17, 'Cl'], [18, 'Ar'], [19, 'K'], [20, 'Ca'], [26, 'Fe'], [29, 'Cu'], [47, 'Ag'], [79, 'Au']];
  MODULE('elements', {
    section: 'disc', ages: [9, 12],
    build(code) {
      const s = this.strings[code], loc = ABC.langs[code].bcp47;
      return { elements: ELEMENTS.filter(([, sym]) => s.names[sym] && s.facts[sym]).map(([z, sym], i) => CONTENT.glyph(code,
        { id: sym, text: sym, name: s.names[sym], color: CONTENT.palette(i), small: z, word: s.names[sym] },
        { say: I18N.t(s.intro, { name: I18N.capFirst(s.names[sym], loc), sym, z, fact: s.facts[sym] }, loc) })) };
    },
    tiles: [
      { id: 'elements', icon: '⚗️', view: 'card', items: S => S.elements, index: true, search: true,
        game: { type: 'find', prompts: ['word', 'voice'], ask: () => 'symbol' } }
    ]
  });
}
