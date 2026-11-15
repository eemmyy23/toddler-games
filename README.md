# Toddler Games

Tiny, no-instructions web games for very small children. Rocket! and Paint! are single self-contained HTML files; ABC 123! is `abc.html` plus the `abc/` folder. All install as PWAs and share `sw.js` for offline use.

## Play online

- 🚀 **Rocket!** — [eemmyy23.github.io/toddler-games/rocket.html](https://eemmyy23.github.io/toddler-games/rocket.html)
  Hold any key (or tap/click and hold) to fire the rocket. Climb past 10 planets, with a warm engine sound and re-entry heat glow on the way back down.

- 🎨 **Paint!** — [eemmyy23.github.io/toddler-games/paint.html](https://eemmyy23.github.io/toddler-games/paint.html)
  Move the mouse — no clicking needed — to paint the canvas in rainbow colors. **Hold left-click** to spray stars instead of paint. **Middle-click** (or the sponge button) resets the canvas. Touch-drag paints the same way. Pitched musical voice follows the brush, with sparkle bursts and chime pings.

- 🔤 **ABC 123!** — [eemmyy23.github.io/toddler-games/abc.html](https://eemmyy23.github.io/toddler-games/abc.html)
  Numbers, letters, reading and the world around us in 🇬🇧 English, 🇷🇴 Romanian and 🇩🇪 German, dark night theme, four tabs (Numbers · Letters · Discover · Play):
  - **123 Numbers:** 1–10, counting (objects or hands), 11–20, tens, big numbers up to a million and ∞, the clock and half past.
  - **ABC Letters:** big letter with example words (RO school sounds bî, cî, zî), letter groups in every language (RO ce/ci/che/chi…, EN sh/ch/th…, DE sch/ch/ei…); **Read**: a word as CAPITALS, small letters, syllables, whole word and a singular/plural table.
  - **🧭 Discover:** colours and the rainbow, animal families, weather, shapes, my body, seasons, groups, opposites, the sky, the Solar System, germs and washing, the immune system, chemical elements; 61 "What is it?" cards read aloud.
  - **🎯 Play:** one game for every learn screen, paired automatically; stars.
  - **🔍 Search** finds a word, number or colour typed in any language; **⊞** opens every item (A–Z sections with a side letter bar in Read).
  Switching the flag keeps the same item (and the same question in a game). The three bikes next to the flags pick the age: balance bike 2–4 · training wheels 4–7 · mountain bike 7–12. Anyone can switch; a higher age only adds topics.

## Installing

Each game is a Progressive Web App. Open the link, then use your browser's "Install" / "Add to Home Screen" prompt to run it fullscreen offline.

## Extending ABC 123!

Words, colours, info cards, languages, subjects and age profiles are data or modules. See [ARCHITECTURE.md](ARCHITECTURE.md) for the layout and step-by-step recipes, and run `node tools/check.js --fix` after any change (it checks the content and regenerates `abc/manifest.js`).
