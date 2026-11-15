# ABC 123! — roadmap

The one plan for the app. Architecture and rules: [ARCHITECTURE.md](../ARCHITECTURE.md) · [CLAUDE.md](../CLAUDE.md).

## Principles
1. **One engine, age profiles** — Adventurer 2–4 · Explorer 4–7 · Scientist 7–12 (bikes in the top bar, no lock); a higher profile only adds.
2. **Few languages, done perfectly** — RO / EN / DE; a new language needs a native reviewer and a voice tested on the family's devices.
3. **Everything is data, config or a module** — new content never edits `abc/core/`, `abc.html` or `sw.js`.
4. **Every learn screen has exactly one game**, paired automatically.
5. **Nothing unfinished in front of a toddler** — no "coming soon" for Adventurers (2–4).

## Done
- **v1.0** — modular architecture (languages, modules, views, games), stable ids, offline precache from a generated manifest, local voices only, age profiles.
- **v1.1** — A–Z index with side letter bar, universal search in all languages, age badges, one layout column (320×480 → 1920×1080), tokens + one class per component, no code comments.
- **After v1.1** — one question line for every game, "Câți pui sunt?" with gender agreement, Lexend font (full RO/DE), section derived from the screen.
- Content today: numbers 1–10 (digits, counting), letters, letter groups (RO), reading with singular/plural, colours + rainbow; one "What is it?" card (rainbow).

## Next — content (in this order, for the child's age)
Each is a module (`abc/modules/<id>/`) with a learn screen, its game, RO/EN/DE text and an age.

| # | Module | Age | What the child sees and hears |
|---|---|---|---|
| 1 | Animal families | 2+ | Male · female · young per animal (țap · capră · ied), each tappable and spoken with its article; ‹ › to the next animal. Game: "Unde e iedul?" |
| 2 | Weather | 2+ | Sun, rain, snow, clouds, wind, rainbow — tap to hear; each shows what to wear (cap, umbrella, gloves). Game: "Unde e ploaia?" |
| 3 | Shapes | 2+ | Circle, square, triangle, star, heart… Game: find the shape. |
| 4 | Body parts | 2+ | Tappable child figure: each part lights and is named. Needs a diagram view. |
| 5 | Seasons | 3+ | Four seasons with their signs (flowers, sun, leaves, snow), spoken. Game: "Când ninge?" |
| 6 | Categories | 3+ | Sorting game: put the animal / fruit / vehicle in its group. Needs a sort game. |
| 7 | Opposites (physics) | 3+ | Big/small, heavy/light, floats/sinks, hot/cold. |
| 8 | Sky | 3–4 | Sun, moon, stars, day and night. |
| 9 | Clock | 3+ → 5+ | Level 1: full hours with the part of day (morning, noon, evening, night). Level 2: half past. Game: "Unde e ora 3?" between two clocks. |
| 10 | Numbers 11–20, tens | 4–5+ | 11–20 as ten + ones (dots), tens as bundles of ten; ‹ › and ▶ like digits. |
| 11 | Big numbers | 7+ | 100, 1 000, … "numbers never end" (∞). |
| later | Solar system (5+), immune system (7+; "germs & handwashing" card at 3+), periodic table (9+) | | |

Across all modules:
- [ ] Index: **A–Z / Categories** switch (words grouped as farm animals, wild animals, birds, insects, sea, fruit, vegetables, food …).
- [ ] "What is it?" spoken cards for every key concept (≤ 3 short sentences, right for the age).

## Next — platform
- [ ] Views: grid, diagram (body), sequence (clock / routine); games: sort, order, pairs, find-region.
- [ ] Load modules lazily; precache per active profile.
- [ ] Readiness level per language: hide a topic in a language until it is complete and reviewed.
- [ ] Parent review tools: `tools/show.js <id>` (one concept in all languages), `tools/review.js <lang>` (review sheet, approval by hash).
- [ ] Shell state (lang, profile, section) behind `APP` instead of script-scope variables the tests set directly.

## Definition of done (every module)
- Learn screen + its game; nothing "coming soon" visible for Adventurers (2–4).
- Every spoken line works with the offline voice on the family's devices, in RO / EN / DE; grammar correct (articles, plurals, agreement).
- `node tools/check.js`, `tools/fast.js` and `tools/smoke.js` pass.
- Age declared; the tile appears from that profile upwards and wears its badge.
- Parent sign-off per language.
