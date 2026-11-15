{
  const ELEMENTS = [[1, 'H'], [2, 'He'], [3, 'Li'], [4, 'Be'], [5, 'B'], [6, 'C'], [7, 'N'], [8, 'O'], [9, 'F'], [10, 'Ne'], [11, 'Na'], [12, 'Mg'],
    [13, 'Al'], [14, 'Si'], [15, 'P'], [16, 'S'], [17, 'Cl'], [18, 'Ar'], [19, 'K'], [20, 'Ca'], [26, 'Fe'], [29, 'Cu'], [47, 'Ag'], [79, 'Au']];
  MODULE('elements', {
    section: 'disc', ages: [9, 12],
    build(code) {
      const s = this.strings[code], loc = ABC.langs[code].bcp47, cap = x => x.charAt(0).toLocaleUpperCase(loc) + x.slice(1);
      return { elements: ELEMENTS.filter(([, sym]) => s.names[sym] && s.facts[sym]).map(([z, sym], i) => {
        const name = s.names[sym], color = ink((i * 37) % 360);
        return { id: sym, label: sym, name, say: `${I18N.t(s.intro, { name: cap(name), sym, z })} ${s.facts[sym]}`, big: `${esc(sym)}<small>${z}</small>`, color,
          nav: CONTENT.navText(sym, color), word: name, bubble: sym, bubbleColor: color, prompt: sym, promptWord: name };
      }) };
    },
    check(code, S, s, report) { if (S.elements.length < ELEMENTS.length) report(`${ELEMENTS.length - S.elements.length} elements miss a name or a fact`); },
    tiles: [
      { id: 'elements', icon: '⚗️', view: 'card', items: S => S.elements, index: true, search: true,
        game: { type: 'find', prompts: ['word', 'voice'], ask: () => 'symbol' } }
    ]
  });
}
