const HOWMANY = { upTo: 5, hardUpTo: 10, hardAfter: 5 };
GAME('howmany', {
  needs: 2,
  pool: (items, streak) => items.filter(it => it.n && it.n <= (streak >= HOWMANY.hardAfter ? HOWMANY.hardUpTo : HOWMANY.upTo)),
  show: (t, round, ask) => ({ text: ask, picture: `<span class="objs">${t.pics.map(p => `<span>${p}</span>`).join('')}</span>` })
});
