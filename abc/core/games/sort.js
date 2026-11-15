GAME('sort', {
  needs: 2,
  pool: items => items.filter(it => it.members && it.members.length),
  show: (t, round, ask, s) => ({ text: ask, picture: s ? `<b>${s.bubbleArt || esc(s.pic)}</b>` : '' })
});
