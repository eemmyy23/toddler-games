# ABC 123! — roadmap

Decided after the architecture audit ([AUDIT-2026-11.md](AUDIT-2026-11.md)).
Everything is built on the preview branch and merged only after the parent approves it on the phone.

## Principles
1. **One engine, age profiles.** Little (2–4) · Explorer (4–7) · Scientist (7–12), shown as three bikes in the top bar. No lock; a higher profile only adds topics.
2. **Few languages, done perfectly.** RO / EN / DE now. A new language needs a native reviewer, a voice tested on the family's devices and a clean `tools/check.js`.
3. **Everything is data or a module.** Adding a word, a language or a subject never edits the engine, `abc.html` or `sw.js`.
4. **Every learn screen has exactly one game**, paired automatically.
5. **Nothing unfinished in front of a toddler.** No "coming soon" tiles in the Little profile.
6. **Correctness is checked by machines first, then signed off by the parent** (review status per entry).

## Stages

### Stage 1 — Foundation ✅ (v1.0.0, 2026-11-15)
- [x] Stable concept ids (ASCII slugs) for words, colours, info cards and saved progress; migrate stored progress.
- [x] Game pool ≥ 2 required (`Tiles.gameOk` uses the game's own pool and `needs`, at its first and hardest round).
- [x] Every language merged over a base language → no `undefined`, no crash on a missing string.
- [x] Service worker: versioned precache of every language (kept network-first so deploys show at once; cache is the offline fallback), `r.ok` check, file list generated (no hand-kept `ASSETS`).
- [x] `ß` and other letters whose uppercase differs; voices: prefer `localService`, separate `en-GB`, "🔇 no voice" state instead of a foreign voice.
- [x] `check.js`: duplicate/orphan ids, same written word for two concepts, letter without example = error.
- [x] `smoke.js` in CI for every language (games, layout at 360×640 and 320×568, offline reload) + `fast.js` layout at 7 sizes 320×480 → 1920×1080.

### Stage 2 — Modules & age profiles (mostly done in v1.0.0)
- [x] Shell + views card, count, read, play + games find, howmany.
- [ ] Views grid, diagram, sequence; games sort, order, pairs, find-region.
- [x] Move current topics into modules: `abc/modules/<id>/{module.js, lang/<code>.js}`.
- [x] Module list with `ages`; profile picked with the visible bikes in the bar (no parental lock); Little profile hides "coming soon".
- [ ] Lazy load per module, precache per active profile.

### Stage 3 — Language model (mostly done in v1.0.0)
- [x] One folder per language: `grammar.js` (incl. letters), `strings.js`, `words.js`, `info.js`.
- [x] Concepts with gloss / translator notes; explicit forms (def, plural, definite plural); bare plurals.
- [x] Writing-system units (multi-character letters, no-case scripts, RTL `dir`).
- [x] Intl: PluralRules, ListFormat, Collator, Segmenter; message templates. (NumberFormat: when numbers > 10 arrive.)
- [ ] Readiness levels L0–L3 per language; hubs hide topics above a language's level.
- [ ] `tools/show.js <id>` (one concept in all languages), `tools/review.js <lang>` (parent's review sheet; approves by hash).

### Stage 4 — Content (in this order, for the child's age)
| # | Module | Profile | Mockup |
|---|---|---|---|
| 1 | Shapes | Little 2+ | — |
| 2 | Body parts (tappable diagram) | Little 2+ | — |
| 3 | Animal families (male · female · baby: țap · capră · ied) | Little 2+ | [09-families](mockups/09-families.html) |
| 4 | Weather | Little 2+ | [14-weather](mockups/14-weather.html) |
| 5 | Seasons | Little 3+ | [13-seasons](mockups/13-seasons.html) |
| 6 | Physics as opposites (big/small, heavy/light, floats/sinks, hot/cold) | Little 3+ | — |
| 7 | Sky: sun, moon, stars, day and night | Little/Explorer 3–4 | — |
| 8 | Day routine → clock: full hours → halves and quarters → "set the time" game | Little 3+ / Explorer 5+ | [10-clock](mockups/10-clock.html), [11-clock-l2](mockups/11-clock-l2.html), [12-clock-game](mockups/12-clock-game.html) |
| 9 | Numbers 11–20, tens (placeholders `teens`, `tens`) | Explorer 4–5+ | [15-numbers-l2](mockups/15-numbers-l2.html), [16-numbers-l3](mockups/16-numbers-l3.html) |
| 10 | Big numbers — "up to infinity" (`big`) | Scientist 7+ | [17-numbers-l4](mockups/17-numbers-l4.html) |
| 11 | Categories (sorting game, `cats`) | Little 3+ | — |
| later | Solar system (Explorer 5+), immune system (Scientist 7+; "germs & handwashing" card under Body at 3+), periodic table (Scientist 9+) | | |

### Across all modules
- [ ] Index: **A–Z / Categories** switch — words grouped by category (animals, food, vehicles …) — [07-words-categories](mockups/07-words-categories.html).
- [ ] "What is it?" spoken cards for every key concept (today only the rainbow), RO / EN / DE.

## Definition of done (every module)
- [ ] Learn screen + its game; nothing "coming soon" visible to the child.
- [ ] Every spoken line works with the offline voice on the family's devices, in every active language.
- [ ] RO / EN / DE complete; `node tools/check.js` passes.
- [ ] Grammar correct (articles, plurals, counting forms).
- [ ] "What is it?" card for each key concept: ≤ 3 short sentences, right for the age.
- [ ] Age band declared; the tile appears from that profile upwards and wears its badge.
- [ ] `tools/fast.js` (320×480 → 1920×1080) and `tools/smoke.js` pass; targets ≥ 60 px; no reading needed in Little.
- [ ] Parent sign-off recorded per language.
- [ ] ≤ ~20 items per module at first; depth later.
