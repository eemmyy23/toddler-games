// ====== GAME 'find' — "Find the B / Where is the cow?": tap the asked item among 2–4 bubbles ======
// Uses item fields: prompt, promptWord (the play host uses bubble, lower, bubbleColor, smallBubble, pictureBubble, the).
// Tile game options: prompts ['glyph' | 'word' | 'voice'], lower, ask(item, round) → question key, items.
GAME('find', {
  needs: 2,
  pool: items => items,
  prompt(t, round) {
    const shown = round.prompt === 'voice' ? '👂' : round.prompt === 'word' ? (t.promptWord || t.prompt) : t.prompt;
    return `🔊 ${esc(APP.ui().find)} <b>${esc(shown)}</b>`;
  }
});
