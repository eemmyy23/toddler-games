GAME('howmany', {
  needs: 2,
  pool: (items, streak) => items.filter(it => it.n && it.n <= (streak >= 5 ? 10 : 5)),
  prompt: t => `<span class="objs">${t.pics.map(p => `<span>${p}</span>`).join('')}</span>`
});
