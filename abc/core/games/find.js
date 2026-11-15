GAME('find', {
  needs: 2,
  pool: items => items,
  prompt(t, round) {
    const shown = round.prompt === 'voice' ? '👂' : round.prompt === 'word' ? (t.promptWord || t.prompt) : t.prompt;
    return `🔊 ${esc(APP.ui().find)} <b>${esc(shown)}</b>`;
  }
});
