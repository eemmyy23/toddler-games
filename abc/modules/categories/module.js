{
  const SHOWN = 8, ALIKE = ['farm-animals wild-animals birds bugs sea-animals', 'fruit vegetables food'];
  MODULE('categories', {
    section: 'disc', ages: [3, 7],
    build(code) {
      const cats = CONTENT.things(code, Object.keys(ABC.groups)).map(g => {
        const raw = CONTENT.things(code, ABC.groups[g.id]).filter(x => x.forms && x.forms.sg), members = raw.map(x => CONTENT.thing(x));
        return members.length >= 2 && CONTENT.thing(g, { members, sound: ALIKE.find(a => a.split(' ').includes(g.id)), concepts: members.map(x => x.id), 
          examples: raw.slice(0, SHOWN).map(x => CONTENT.example(x)) });
      });
      return { categories: cats.filter(Boolean) };
    },
    tiles: [
      { id: 'cats', icon: '🧩', view: 'card', items: S => S.categories, index: true, search: true,
        game: { type: 'sort', prompts: ['glyph'], ask: () => 'sort' } }
    ]
  });
}
