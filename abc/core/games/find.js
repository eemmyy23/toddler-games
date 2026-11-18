GAME('find', {
  needs: 2, caption: round => round.prompt === 'voice',
  pool: items => items,
  show(t, round) {
    const shown = round.prompt === 'voice' ? ABC.config.icons.listen : round.prompt === 'word' ? (t.promptWord || t.prompt) : t.prompt;
    return { text: APP.ui().find, picture: `<b>${esc(shown)}</b>` };
  }
});
