# ABC 123! — architecture

> Current state (v0.9). The target architecture and the plan to get there are in
> [docs/ROADMAP.md](docs/ROADMAP.md); the findings behind them in [docs/AUDIT-2026-11.md](docs/AUDIT-2026-11.md).

A single static PWA: no framework, no build step. Works offline via `sw.js`.
Everything the child sees is **data**. The engine (`abc/app.js`) has no per-subject, per-language or per-word code.

```
abc.html               markup + CSS only; loads the scripts below in this order
abc/registry.js        the global ABC + LANG(), SECTION(), TOPIC()
abc/lang/<code>.js     one file per language: grammar, labels, spoken questions, UI text
abc/data/words.js      the dictionary — one row per concept (picture), all languages in the row
abc/data/colors.js     colours + rainbow bands
abc/data/info.js       "What is it?" cards, keyed by concept (emoji)
abc/content.js         builds uniform ITEMS from data + language (letters, numbers, groups, colours, words)
abc/topics.js          the menu: tabs (sections) and topics (screen + game) — one place
abc/app.js             engine: screens, one game engine, hubs, index, info cards, speech, navigation
tools/check.js         content checker (node, no deps) — also runs in CI
tools/smoke.js         browser test (Playwright): navigation, speech, games, layout at 360×640
```

## Core ideas

1. **Concept = picture.** A word row (`🐄`), a colour (`🌈`) and an info card are linked by their emoji.
   An info card added for `🐄` appears on every screen that shows a cow — no code changes.
2. **Uniform items.** `content.js` turns every subject into items with the same fields
   (`label`, `name`, `say`, `big`, `nav`, `examples`, `pics`, `parts`, `bubble`, `prompt`, `concept`, …).
   The card screen and the game engine only read those fields.
3. **Learn ↔ Play is automatic.** Every topic gets exactly one Play tile, grouped by its section.
   A topic with a `game` is playable; without one, its Play tile says "coming soon".
4. **Stable ids.** Items keep the same `id` in every language, so switching the flag stays on the same item/question.

## How to…

**Add a word** — one row in `abc/data/words.js`:
```js
{ pic: '🦁', en: 'li/on|a|two lions', ro: 'leu|un|leul|doi lei', de: 'Lö/we|der|zwei Löwen' }
```
It appears under its first letter in Learn, in Read (with the singular/plural table), in "Find the word" and in the index.

**Add a "What is it?" card** — in `abc/data/info.js`, keyed by the picture:
```js
ABC.info['🐝'] = { en: { title: 'The bee', lines: [['🐝', 'A bee makes honey.'], …] }, ro: {…}, de: {…} };
```

**Add a language** — copy `abc/lang/en.js` to `abc/lang/<code>.js`, translate it, add its `<script>` to `abc.html`
and the file to `sw.js`, add `<code>: '…'` to the rows of `abc/data/*.js`. The flag appears automatically.
Run `node tools/check.js` — it lists every missing label, word, colour and info line.

**Add a subject** — `TOPIC('id', { section, icon, view, items, game })` in `abc/topics.js`,
labels in each language's `topics.id = [learn label, game label]` and the spoken question in `games.id`.
- reuse an existing screen (`card`, `count`, `read`) by giving items in the uniform shape (add a builder in `content.js`);
- a picture with tappable parts (like the rainbow bands) uses `big` HTML with `.part[data-part=i]` + `parts: [{ say }]`;
- a new kind of screen = one render function + one `view` name in `app.js`.

**Add a game type** — implement it next to `'find'` / `'howmany'` in the game engine of `app.js`, then use `game: { type }`.

## Checks

```
node tools/check.js                       # data completeness, every language (CI runs this)
python3 -m http.server 8765  (in the parent folder)  &&  node tools/smoke.js
```
