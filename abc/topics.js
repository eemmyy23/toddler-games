// ====== SECTIONS & TOPICS — the whole menu of the app, in one place ======
// Bottom tabs (order = order on screen). The Play tab is generated: one game tile per topic below.
SECTION('num', '🔢');
SECTION('abc', '🔤');
SECTION('disc', '🔎');
SECTION('play', '🎯', { play: true });

// Topics. A topic without `view` is shown as "coming soon" in its hub, and its game too.
// A topic without `game` has its Play tile shown as "coming soon".
// S = content for the current language (abc/content.js): S.numbers, S.letters, S.groups, S.colors, S.words, S.wordGame
TOPIC('digits',  { section: 'num', icon: '🔢', view: 'card', items: S => S.numbers,
                   game: { type: 'find', prompts: ['glyph', 'glyph', 'word', 'voice'] } });
TOPIC('count',   { section: 'num', icon: '🧮', view: 'count', items: S => S.numbers,
                   game: { type: 'howmany' } });
TOPIC('teens',   { section: 'num', icon: '🔟' });
TOPIC('tens',    { section: 'num', icon: '💯' });
TOPIC('big',     { section: 'num', icon: '✨' });
TOPIC('clock',   { section: 'num', icon: '⏰' });

TOPIC('letters', { section: 'abc', icon: '🔤', view: 'card', items: S => S.letters, index: true,
                   game: { type: 'find', prompts: ['glyph', 'glyph', 'voice'], lower: true } });
TOPIC('read',    { section: 'abc', icon: '📚', view: 'read', items: S => S.words, index: true,
                   game: { type: 'find', items: S => S.wordGame, prompts: ['glyph', 'glyph', 'glyph', 'voice'] } });
TOPIC('groups',  { section: 'abc', icon: 'ce·ci', view: 'card', items: S => S.groups,
                   game: { type: 'find', prompts: ['glyph', 'glyph', 'voice'] } });

TOPIC('colors',  { section: 'disc', icon: '🎨', view: 'card', items: S => S.colors,
                   game: { type: 'find', prompts: ['glyph', 'voice'] } });
TOPIC('families', { section: 'disc', icon: '🐐' });
TOPIC('seasons', { section: 'disc', icon: '🌷' });
TOPIC('weather', { section: 'disc', icon: '🌦️' });
TOPIC('cats',    { section: 'disc', icon: '🧩' });
