GAME('howmany', {
  needs: 2,
  pool: (items, streak) => items.filter(it => it.n && it.n <= (streak >= 5 ? 10 : 5)),
  show: (t, round, ask) => ({ text: ask, picture: `<span class="objs" style="--cols:${Math.min(5, t.pics.length)}">${t.pics.map(p => `<span>${p}</span>`).join('')}</span>` })
});
