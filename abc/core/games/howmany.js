// ====== GAME 'howmany' — N pictures, tap the number. Starts with 1–5, then 1–10 after a streak of 5. ======
GAME('howmany', {
  needs: 2,
  pool: (items, streak) => items.filter(it => it.n && it.n <= (streak >= 5 ? 10 : 5)),
  prompt: t => `<span class="objs">${t.pics.map(p => `<span>${p}</span>`).join('')}</span>`
});
