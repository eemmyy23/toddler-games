// Browser smoke test for abc.html (Playwright + Chromium).
// Usage: serve the repo's PARENT folder so the page is at /toddler-games/abc.html, then
//   node tools/smoke.js [baseUrl]        default http://localhost:8765/toddler-games/abc.html
// Speech is replaced by a recorder, so the test checks exactly what would be spoken.
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://localhost:8765/toddler-games/abc.html';
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FAIL ') + msg); if (!cond) fails++; };

(async () => {
  const b = await chromium.launch();
  const errs = [];
  const page = async (w, h) => {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => {
      localStorage.clear(); window.__said = [];
      speechSynthesis.speak = u => { __said.push(u.text.replace(' …', '')); setTimeout(() => u.onend && u.onend(), 20); };
      speechSynthesis.cancel = () => {};
    });
    await p.goto(URL); await p.waitForTimeout(300);
    return p;
  };
  const p = await page(360, 640);
  const ev = (f, a) => p.evaluate(f, a);
  const said = () => ev(() => __said.slice());
  const clear = () => ev(() => { __said.length = 0; });

  console.log('chrome built from registry');
  ok((await p.$$eval('.flag', f => f.map(x => x.dataset.lang).join())) === 'en,ro,de', 'flags en,ro,de');
  await ev(() => setLang('ro'));
  ok((await p.$$eval('.tab .tl', t => t.map(x => x.textContent).join('|'))) === 'Numere|Litere|Descoperă|Joacă', 'tabs RO');

  console.log('hubs');
  // tiles: '~' prefix = coming soon; headers ('#') are the section titles in the Play hub
  const hub = async sec => { await ev(s => { section = s; atHub = true; render(); }, sec);
    return p.$$eval('#hub > *', t => t.map(x => x.classList.contains('hh') ? '#' + x.textContent : (x.classList.contains('soon') ? '~' : '') + x.lastChild.textContent)); };
  ok((await hub('abc')).join('|') === 'Alfabetul|Citește|Grupuri de litere', 'Litere hub');
  const play = await hub('play'), games = play.filter(x => x[0] !== '#');
  ok(games.filter(x => x[0] !== '~').join('|') === 'Găsește cifra|Câte sunt?|Găsește litera|Găsește cuvântul|Găsește grupul|Găsește culoarea', 'Play hub: the 6 working games');
  const learnCount = await ev(() => ABC.topics.filter(t => !(t.view && t.items && !topicUsable(t))).length);
  ok(games.length === learnCount, `Play hub has exactly one tile per topic (${games.length} = ${learnCount})`);
  await ev(() => setLang('en'));
  ok(!(await hub('abc')).some(x => /groups/i.test(x)), 'EN hides RO-only letter groups');
  await ev(() => setLang('ro'));

  console.log('learn card');
  await ev(() => openTopic('letters', false, true)); await ev(() => { idx = 0; showCard(false); });
  ok((await p.$$eval('.ex .ew', e => e.map(x => x.textContent).join())) === 'albină,arici,ananas,avion', 'A examples');
  await clear(); await p.keyboard.press('m'); await p.waitForTimeout(150);
  ok((await said()).pop() === 'mî, de la minge!', 'key m → mî, de la minge!');
  await ev(() => setLang('de')); await p.waitForTimeout(150);
  ok((await p.innerText('#glyph')).replace('\n', '') === 'Mm', 'language switch keeps letter M');
  await ev(() => setLang('ro'));

  console.log('read');
  await ev(() => { openTopic('read', false, true); idx = items().findIndex(x => x.w === 'câine'); renderRead(false); });
  await clear(); await p.locator('#rplay').dispatchEvent('pointerdown'); await p.waitForTimeout(6000);
  ok(JSON.stringify(await said()) === JSON.stringify(['cî', 'â', 'i', 'nî', 'e', 'câine', 'câi', 'ne', 'câine', 'un câine', 'doi câini', 'câinele', 'câinii']), 'câine ▶ sequence');
  await ev(() => { idx = items().findIndex(x => x.w === 'urs'); renderRead(false); });
  ok(!(await p.$('#rS')), 'one-syllable word has no syllable row');
  await ev(() => { idx = items().findIndex(x => x.w === 'curcubeu'); renderRead(false); });
  ok(await p.isVisible('#rW .infobtn'), 'info button appears in Read for 🌈 (same concept as the colour)');

  console.log('colours + rainbow parts + info');
  await ev(() => { openTopic('colors', false, true); idx = items().findIndex(x => x.id === 'rainbow'); showCard(false); });
  const names = [];
  for (let i = 0; i < 7; i++) {
    const pt = await p.$eval(`#glyph .part[data-part="${i}"]`, el => { const L = el.getTotalLength(), q = el.getPointAtLength(L * .3), m = el.getScreenCTM(); return { x: q.x * m.a + m.e, y: q.y * m.d + m.f }; });
    await clear(); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(80); names.push((await said())[0]);
  }
  ok(names.join() === 'roșu,oranj,galben,verde,albastru,indigo,violet', 'each rainbow band says its colour');
  await p.locator('#linfo .infobtn').dispatchEvent('pointerdown'); await p.waitForTimeout(200);
  ok((await p.innerText('#infotitle')) === 'Curcubeul' && (await p.$$('.inf')).length === 6, 'info card opens with 6 lines');
  await p.locator('#infoclose').dispatchEvent('pointerdown');

  console.log('games');
  for (const [id, re] of [['digits', /^Găsește numărul /], ['count', /^Câte sunt\?$/], ['letters', /^Găsește litera /], ['read', /^(Unde e|Găsește:) /], ['groups', /^Găsește grupul /], ['colors', /^Unde e /]]) {
    await clear(); await ev(i => openTopic(i, true, true), id); await p.waitForTimeout(350);
    const s = await said(), n = (await p.$$('.bub')).length;
    ok(re.test(s[s.length - 1] || '') && n >= 2, `game ${id}: "${s[s.length - 1]}" with ${n} bubbles`);
  }
  await ev(() => openTopic('colors', true, true));
  const seen = await ev(() => { const s = new Set(); for (let k = 0; k < 150; k++) { streak = 9; newRound(); curOpts.forEach(x => s.add(x.id)); } return [...s]; });
  ok(!seen.includes('rainbow') && seen.length === 10, 'Find the colour uses the 10 plain colours, never the rainbow');

  console.log('layout at 360×640 (every letter, every Read word, every language)');
  const bad = [];
  for (const l of ['ro', 'de', 'en']) {
    await ev(x => setLang(x), l);
    await ev(() => openTopic('letters', false, true));
    const nL = await ev(() => items().length);
    for (let i = 0; i < nL; i++) if (await ev(i => { idx = i; showCard(false); const R = e => e.getBoundingClientRect(); return R($('glyph')).top < R($('bar')).bottom - 1 || R($('examples')).bottom > R($('prev')).top + 1; }, i)) bad.push(`${l}:L${i}`);
    await ev(() => openTopic('read', false, true));
    const nR = await ev(() => items().length);
    for (let i = 0; i < nR; i++) if (await ev(i => { idx = i; renderRead(false); const R = e => e.getBoundingClientRect(), top = R($('bar')).bottom, bot = R($('rnav')).top;
      return [...document.querySelectorAll('#rpic,#read .rrow,#rC')].some(e => { const r = R(e); return r.top < top - 1 || r.bottom > bot + 1; }) ||
             [...document.querySelectorAll('#read .rt,#rC .rc')].some(t => t.scrollWidth > t.clientWidth + 1); }, i)) bad.push(`${l}:R${i}`);
  }
  ok(bad.length === 0, 'no overlap / clipping' + (bad.length ? ': ' + bad.slice(0, 10).join(' ') : ''));

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})();
