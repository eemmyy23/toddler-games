const HOWMANY = { upTo: 5, hardUpTo: 10, hardAfter: 5, fingers: 0.25 };
GAME('howmany', {
  needs: 2,
  pool: (items, streak) => items.filter(it => it.n && it.n <= (streak >= HOWMANY.hardAfter ? HOWMANY.hardUpTo : HOWMANY.upTo)),
  vary() {
    const code = APP.L().code, things = CONTENT.words(code).filter(x => !x.synOf && x.forms && x.forms.pl && !x.entry.mass && !x.entry.unique && !x.entry.plOnly);
    const fingers = things.find(x => x.concept === APP.tile().game.fingers), x = fingers && Math.random() < HOWMANY.fingers ? fingers : things[Math.random() * things.length | 0];
    return x ? { thing: x.concept, pic: x.pic, hands: x === fingers, vars: { pl: x.entry.pl, g: x.entry.g } } : null;
  },
  show: (t, round, ask) => { const k = round.look;
    return { text: ask, picture: k && k.hands ? `<span class="hands">${APP.hands(t.n)}</span>` : `<span class="objs">${Array(t.n).fill(k ? k.pic : t.pic).map(p => `<span>${p}</span>`).join('')}</span>` }; }
});
