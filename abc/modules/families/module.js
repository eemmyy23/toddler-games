{
  const FAMILIES = ['rooster hen chicken-chick', 'billy-goat goat kid', 'ram sheep lamb', 'bull cow calf', 'stallion mare foal', 'boar sow piglet', 'drake duck duckling', 'tomcat cat kitten'];
  const SIZES = [1, 0.85, 0.6];
  MODULE('families', {
    section: 'disc', ages: [2, 5],
    build(code) {
      const loc = ABC.langs[code].bcp47;
      const fams = FAMILIES.map(f => CONTENT.things(code, f.split(' '))).filter(m => m.length === 3 && m.every(CONTENT.the));
      return {
        families: fams.map(m => CONTENT.group(code, { id: m[1].id, things: m, lead: 1, sizes: SIZES, label: m[1].w, name: m[1].w, says: m.map(x => CONTENT.sayThe(code, x)) },
          { say: CONTENT.exclaim(code, I18N.capFirst(I18N.list(m.map(CONTENT.the), loc), loc)) })),
        young: fams.map(m => CONTENT.thing(m[2], { learn: m[1].id }))
      };
    },
    tiles: [
      { id: 'families', icon: '🐐', view: 'card', items: S => S.families, index: true, search: true,
        game: { type: 'find', items: S => S.young, prompts: ['voice'], ask: () => 'where' } }
    ]
  });
}
