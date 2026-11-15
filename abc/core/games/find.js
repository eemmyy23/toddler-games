GAME('find', {
  needs: 2,
  pool: items => items,
  show(t, round) {
    const shown = round.prompt === 'voice' ? ABC.config.icons.listen : round.prompt === 'word' ? (t.promptWord || t.prompt) : t.prompt;
    return { text: APP.ui().find, picture: `<b>${esc(shown)}</b>` };
  }
});
