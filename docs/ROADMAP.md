# ABC 123! — roadmap

The one plan for the app. Architecture and rules: [ARCHITECTURE.md](../ARCHITECTURE.md) · [CLAUDE.md](../CLAUDE.md).

## Principles
1. **One engine, age profiles** — Curious 2–4 · Explorer 4–7 · Scientist 7–12 (bikes in the top bar, no lock); a higher profile only adds.
2. **Few languages, done perfectly** — RO / EN / DE; a new language needs a native reviewer and a voice tested on the family's devices.
3. **Everything is data, config or a module** — new content never edits `abc/core/`, `abc.html` or `sw.js`.
4. **Every learn screen has exactly one game**, paired automatically.
5. **Nothing unfinished in front of a child** — a tile that is not complete in a language is not shown.

## Done
- **v1.0** — modular architecture (languages, modules, views, games), stable ids, offline precache from a generated manifest, local voices only, age profiles.
- **v1.1** — A–Z index with side letter bar, universal search in all languages, age badges, one layout column (320×480 → 1920×1080), tokens + one class per component, no code comments.
- **After v1.1** — one question line for every game, gender agreement, Lexend font (full RO/DE), section derived from the screen, links between modules (same concept, lesson ↔ game).
- **Roadmap 2026-11 (all content, RO/EN/DE, each with its game, each audited by an independent reviewer):**

| Module | Age | Learn | Game |
|---|---|---|---|
| Animal families | 2+ | father · mother · young, tappable | "Unde e iedul?" |
| Weather | 2+ | sun, rain, snow, cloud, wind, storm, rainbow + what to wear | "Unde e ploaia?" |
| Shapes | 2+ | 6 drawn shapes + objects | "Unde e cercul?" |
| My body | 2+ | 9 parts + what each does (cards; no drawn figure) | "Unde e nasul?" |
| Seasons | 3+ | 4 seasons + signs | "Când ninge?" |
| Groups | 3+ | 12 groups from the shared dictionary (`GROUP`) | sort: "Unde punem vaca?" |
| Opposites | 3+ | 6 pairs | "Care e greu?" (only between the pair) |
| The sky | 3+ | sun, moon, stars, Earth, day, night, rocket | "Unde e luna?" |
| Germs and washing | 3+ | germs, soap, water, toothbrush | "Unde e săpunul?" |
| The clock / Half past | 3+ / 5+ | drawn faces, the day's routine | "Unde e ora trei?" |
| Numbers 11–20 / Tens | 4+ / 5+ | ten + ones, groups of ten | find the number |
| Solar System | 5+ | the Sun + 8 drawn planets | "Unde e Marte?" |
| Big numbers | 7+ | 100 … 1 000 000, ∞ | find the number |
| Immune system | 7+ | germs, white blood cells, fever, vaccines, plasters | questions by function |
| Chemical elements | 9+ | 1–20 + Fe, Cu, Ag, Au with one fact | "Găsește simbolul pentru oxigen!" |

- Index **A–Z / Groups** switch; 18 "What is it?" cards (sky, weather, seasons, bees, butterflies) plus the rainbow.
- Platform: items from the shared dictionary (`CONTENT.set`), sort game, `members`/`among`/`sound`/`bubbleArt`, bubble text fits its length,
  choices never look or sound the same, shell state behind `APP.set`, no "coming soon" (an incomplete tile is not shown).

## Next
- [x] More "What is it?" cards: planets, body, health, animals, food (61 in total).
- [ ] Parent review tools (`tools/show.js`, `tools/review.js`) — on hold, by request.
- Not needed now (measured): lazy loading — the whole offline set is 103 files, 539 KB (JS 199 KB).
- Not needed now: extra views/games (grid, sequence, pairs, order, find-region) — no module needs them yet; add with the module that does.

## Definition of done (every module)
- Learn screen + its game; nothing unfinished is shown.
- Every spoken line works with the offline voice on the family's devices, in RO / EN / DE; grammar correct (articles, plurals, agreement).
- `node tools/check.js`, `tools/fast.js` and `tools/smoke.js` pass.
- Age declared; the tile appears from that profile upwards and wears its badge.
- Parent sign-off per language.
