{
  const FAMILIES = ['rooster hen chicken-chick', 'billy-goat goat kid', 'ram sheep lamb', 'bull cow calf', 'stallion mare foal', 'boar sow piglet', 'drake duck duckling', 'tomcat cat kitten'];
  const SIZES = [1, 0.85, 0.6];
  MODULE('families', {
    section: 'disc', ages: [2, 5],
    build(code) {
      const loc = ABC.langs[code].bcp47, cap = s => s.charAt(0).toLocaleUpperCase(loc) + s.slice(1);
      const fams = FAMILIES.map(f => CONTENT.things(code, f.split(' '))).filter(m => m.length === 3 && m.every(CONTENT.the));
      const families = fams.map(m => ({
        id: m[1].id, label: m[1].w, name: m[1].w, say: cap(I18N.list(m.map(CONTENT.the), loc)) + '!', concept: m[1].id, concepts: m.map(x => x.id), nav: m[1].pic,
        big: `<span class="pset">${m.map((x, i) => `<span class="part" data-part="${i}" style="--s:${SIZES[i]}">${CONTENT.pic(x.id)}</span>`).join('')}</span>`,
        parts: m.map(x => ({ say: cap(CONTENT.the(x)) + '!' })), examples: m.map(x => [x.w, x.pic, false])
      }));
      return { families, young: fams.map(m => CONTENT.thing(m[2], { learn: m[1].id })) };
    },
    check(code, S, s, report) { if (S.families.length < FAMILIES.length) report(`${FAMILIES.length - S.families.length} animal families miss a word`); },
    tiles: [
      { id: 'families', icon: '🐐', view: 'card', items: S => S.families, index: true, search: true,
        game: { type: 'find', items: S => S.young, prompts: ['voice'], ask: () => 'where' } }
    ]
  });
}
