# Toddler Games

Tiny, no-instructions web games for very small children. Each one is a single self-contained HTML file with PWA install support.

## Play online

- 🚀 **Rocket!** — [eemmyy23.github.io/toddler-games/rocket.html](https://eemmyy23.github.io/toddler-games/rocket.html)
  Hold any key (or tap/click and hold) to fire the rocket. Climb past 10 planets, with a warm engine sound and re-entry heat glow on the way back down.

- 🎨 **Paint!** — [eemmyy23.github.io/toddler-games/paint.html](https://eemmyy23.github.io/toddler-games/paint.html)
  Move the mouse — no clicking needed — to paint the canvas in rainbow colors. **Hold left-click** to spray stars instead of paint. **Middle-click** (or the sponge button) resets the canvas. Touch-drag paints the same way. Pitched musical voice follows the brush, with sparkle bursts and chime pings.

- 🔤 **ABC 123!** — [eemmyy23.github.io/toddler-games/abc.html](https://eemmyy23.github.io/toddler-games/abc.html)
  Numbers, letters, reading and colours in 🇬🇧 English, 🇷🇴 Romanian and 🇩🇪 German, dark night theme, tabs **Numere · Litere · Descoperă · Joacă**:
  - **🔢 Numbers:** digits 1–10 and a counting page (objects or hands, index finger first, thumb = 5).
  - **🔤 Letters:** big letter with example words (RO school sounds bî, cî, zî; RO letter groups ce/ci/che/chi/ge/gi/ghe/ghi); **Read**: a word as CAPITALS, small letters, syllables, whole word and a singular/plural table.
  - **🔎 Discover:** colours and a tappable rainbow; "What is it?" cards read aloud.
  - **🎯 Play:** one game for every learn screen, paired automatically; stars.
  Switching the flag keeps the same item (and the same question in a game). The three bikes next to the flags pick the age: balance bike 2–4 · training wheels 4–7 · mountain bike 7–12 (icons from Microsoft Fluent Emoji, MIT; people are never altered). Anyone can switch; a higher age only adds topics.

## Installing

Each game is a Progressive Web App. Open the link, then use your browser's "Install" / "Add to Home Screen" prompt to run it fullscreen offline.

## Extending ABC 123!

Words, colours, info cards, languages and subjects are data. See [ARCHITECTURE.md](ARCHITECTURE.md) for the layout and step-by-step recipes, and run `node tools/check.js --fix` after any change (it checks the content and regenerates `abc/manifest.js`).
