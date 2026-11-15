// Browser smoke test for abc.html (Playwright + Chromium).
// Usage: serve the repo's PARENT folder so the page is at /toddler-games/abc.html, then
//   node tools/smoke.js [baseUrl] [WxH]  default http://localhost:8765/toddler-games/abc.html 360x640
// Speech is replaced by a recorder, so the test checks exactly what would be spoken.
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://localhost:8765/toddler-games/abc.html';
const [VW, VH] = (process.argv[3] || '360x640').split('x').map(Number);
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FAIL ') + msg); if (!cond) fails++; };

(async () => {
  const b = await chromium.launch();
  const errs = [];
  const p = await b.newPage({ viewport: { width: VW, height: VH } });
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => {
    if (!sessionStorage.seeded) { localStorage.clear(); sessionStorage.seeded = 1; }
    window.__said = [];
    speechSynthesis.speak = u => { __said.push(u.text.replace(' …', '')); setTimeout(() => u.onend && u.onend(), 20); };
    speechSynthesis.cancel = () => {};
  });
  await p.goto(URL); await p.waitForTimeout(500);
  const ev = (f, a) => p.evaluate(f, a);
  const said = () => ev(() => __said.slice());
  const clear = () => ev(() => { __said.length = 0; });
  const show = i => ev(i => { APP.idx = i; ABC.views[APP.screen()].show(false); }, i);
  const find = (pred) => ev(src => APP.items().findIndex(new Function('x', 'return ' + src)), pred);

  console.log('chrome built from config');
  ok((await p.$$eval('.flag', f => f.map(x => x.dataset.lang).join())) === 'en,ro,de', 'flags en,ro,de');
  await ev(() => setLang('ro'));
  ok((await p.$$eval('.tab .tl', t => t.map(x => x.textContent).join('|'))) === 'Numere|Litere|Descoperă|Joacă', 'tabs RO');
  ok(await ev(() => !!document.querySelector('#manifest-check') || !!self.MANIFEST.version), 'manifest loaded');

  console.log('hubs');
  const hub = async sec => { await ev(s => { section = s; atHub = true; render(); }, sec);
    return p.$$eval('#hub > *', t => t.map(x => x.classList.contains('hh') ? '#' + x.textContent : (x.classList.contains('soon') ? '~' : '') + x.querySelector('.hl').textContent)); };
  ok((await hub('abc')).join('|') === 'Alfabetul|Citește|Grupuri de litere', 'Litere hub');
  let play = await hub('play');
  ok(!play.some(x => x[0] === '~'), 'Little profile: no "coming soon" tiles');
  ok(play.filter(x => x[0] !== '#').join('|') === 'Găsește cifra|Câte sunt?|Găsește litera|Găsește cuvântul|Găsește grupul|Găsește culoarea', 'Play hub: the 6 games');
  // 1:1 mapping: every Learn tile listed in a section has exactly one game tile, same id, same order
  for (const prof of ['little', 'explorer']) {
    const pair = await ev(pr => { profile = pr; const learn = [], games = [];
      for (const s of ABC.config.sections.filter(s => !s.play)) { section = s.id; learn.push(...hubTiles().map(x => x.t.id)); }
      section = 'play'; games.push(...hubTiles().filter(x => x.t).map(x => x.t.id)); return [learn.join(), games.join()]; }, prof);
    ok(pair[0] === pair[1], `${prof}: Learn ↔ Play 1:1 (${pair[0].split(',').length} tiles)`);
  }
  await ev(() => { profile = 'explorer'; });
  play = await hub('play');
  ok(play.some(x => x[0] === '~'), 'Explorer profile shows "coming soon" tiles');
  await ev(() => { profile = 'little'; });
  console.log('age profiles (bikes in the bar)');
  await hub('num');
  const bar = await ev(() => { const R = e => e.getBoundingClientRect(), f = R($('flags')), a = R($('ages'));
    return { one: Math.abs(f.top - a.top) < 2, gap: a.left - f.right, right: innerWidth - a.right, n: document.querySelectorAll('.age').length }; });
  ok(bar.n === 3 && bar.one && bar.gap >= 0 && bar.right >= 0, `3 bikes on the same row as the flags (gap ${bar.gap | 0}px, right ${bar.right | 0}px)`);
  for (const pr of ['scientist', 'explorer', 'little']) {
    await clear(); await p.locator(`.age[data-p="${pr}"]`).dispatchEvent('pointerdown'); await p.waitForTimeout(150);
    const st = await ev(() => ({ p: profile, on: document.querySelector('.age.on').dataset.p, hub: [...document.querySelectorAll('#hub .ht:not(.soon)')].length }));
    ok(st.p === pr && st.on === pr && st.hub >= 2, `tap ${pr}: selected, ${st.hub} working tiles, said "${(await said()).pop()}"`);
  }
  const counts = await ev(() => ['little', 'explorer', 'scientist'].map(pr => { profile = pr; section = 'play'; return hubTiles().filter(x => x.t && x.ok).length; }));
  ok(counts[0] <= counts[1] && counts[1] <= counts[2] && counts[0] === 6, `higher profiles add, never remove working games (${counts.join(' ≤ ')})`);
  await ev(() => { profile = 'little'; });
  await ev(() => openTile('letters', false, true));
  ok(!(await p.isVisible('#ages')), 'bikes hidden inside a lesson (bar holds back/index/stars)');
  await ev(() => setLang('en'));
  ok(!(await hub('abc')).some(x => /group/i.test(x)), 'EN hides RO-only letter groups');
  await ev(() => setLang('ro'));

  console.log('learn card');
  await ev(() => openTile('letters', false, true)); await show(0);
  ok((await p.$$eval('.ex .ew', e => e.map(x => x.textContent).join())) === 'albină,arici,ananas,avion', 'A examples');
  await clear(); await p.keyboard.press('m'); await p.waitForTimeout(150);
  ok((await said()).pop() === 'mî, de la minge!', 'key m → mî, de la minge!');
  await ev(() => setLang('de')); await p.waitForTimeout(150);
  ok((await p.innerText('#glyph')).replace(/\s/g, '') === 'Mm', 'language switch keeps letter M');
  await ev(() => openTile('letters', false, true)); await show(await find("x.id === 'ß'"));
  ok((await p.innerText('#glyph')).replace(/\s/g, '') === 'ß', 'German ß stays ß (not SS)');
  await ev(() => setLang('ro'));

  console.log('read');
  await ev(() => openTile('read', false, true)); await show(await find("x.w === 'câine'"));
  await clear(); await p.locator('#rplay').dispatchEvent('pointerdown'); await p.waitForTimeout(6000);
  ok(JSON.stringify(await said()) === JSON.stringify(['cî', 'â', 'i', 'nî', 'e', 'câine', 'câi', 'ne', 'câine', 'un câine', 'doi câini', 'câinele', 'câinii']), 'câine ▶ sequence: ' + (await said()).join(', '));
  await show(await find("x.w === 'urs'"));
  ok(!(await p.$('#rS')), 'one-syllable word has no syllable row');
  await show(await find("x.w === 'curcubeu'"));
  ok(await p.isVisible('#rW .infobtn'), 'info button in Read for 🌈 (same concept as the colour)');

  console.log('colours + rainbow parts + info');
  await ev(() => openTile('colors', false, true)); await show(await find("x.id === 'rainbow'"));
  const names = [];
  for (let i = 0; i < 7; i++) {
    const pt = await p.$eval(`#glyph .part[data-part="${i}"]`, el => { const L = el.getTotalLength(), q = el.getPointAtLength(L * .3), m = el.getScreenCTM(); return { x: q.x * m.a + m.e, y: q.y * m.d + m.f }; });
    await clear(); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(80); names.push((await said())[0]);
  }
  ok(names.join() === 'roșu,oranj,galben,verde,albastru,indigo,violet', 'each rainbow band says its colour: ' + names.join());
  await p.locator('#linfo .infobtn').dispatchEvent('pointerdown'); await p.waitForTimeout(200);
  ok((await p.innerText('#infotitle')) === 'Curcubeul' && (await p.$$('.inf')).length === 6, 'info card opens with 6 lines');
  await p.locator('#infoclose').dispatchEvent('pointerdown');

  console.log('games (every language)');
  const ASK = {
    ro: [['digits', /^Găsește numărul /], ['count', /^Câte sunt\?$/], ['letters', /^Găsește litera /], ['read', /^(Unde e|Găsește:) /], ['groups', /^Găsește grupul /], ['colors', /^Unde e /]],
    en: [['digits', /^Find the number /], ['count', /^How many\?$/], ['letters', /^Find the (small )?letter /], ['read', /^(Where is|Find:) /], ['colors', /^Where is /]],
    de: [['digits', /^Finde die Zahl /], ['count', /^Wie viele\?$/], ['letters', /^Finde (den (kleinen )?Buchstaben|das) /], ['read', /^(Wo ist|Finde:) /], ['colors', /^Wo ist /]]
  };
  for (const l of ['ro', 'en', 'de']) {
    await ev(x => setLang(x), l);
    for (const [id, re] of ASK[l]) {
      await clear(); await ev(i => openTile(i, true, true), id); await p.waitForTimeout(350);
      const s = await said(), n = (await p.$$('.bub')).length, last = s[s.length - 1] || '';
      ok(re.test(last) && !/undefined|\{/.test(last) && n >= 2, `${l} game ${id}: "${last}" with ${n} bubbles`);
    }
  }
  await ev(() => setLang('ro'));
  await ev(() => openTile('colors', true, true));
  const seen = await ev(() => { const s = new Set(); for (let k = 0; k < 150; k++) { APP.streak = 9; ABC.views.play.newRound(); ABC.views.play.state().opts.forEach(x => s.add(x.id)); } return [...s]; });
  ok(!seen.includes('rainbow') && seen.length === 10, `Find the colour: 10 plain colours, never the rainbow (${seen.length})`);
  // language switch keeps the same question
  await ev(() => openTile('letters', true, true));
  for (let k = 0; k < 200 && !(await ev(() => { const st = ABC.views.play.state(); return !/[ȘȚĂÂÎ]/.test(st.target.id) && /[ȘȚĂÂÎ]/.test(st.opts.map(o => o.id).join('')); })); k++) await ev(() => ABC.views.play.newRound());
  const before = await ev(() => ABC.views.play.state().target.id);
  await ev(() => setLang('de')); const after = await ev(() => ABC.views.play.state().target.id);
  ok(before === after, `language switch keeps the question (${before} → ${after})`);
  await ev(() => setLang('ro'));

  console.log('stars text (plural rules)');
  const wow = await ev(() => [1, 2, 20, 21].map(n => APP.t(APP.ui().wow, { n })));
  ok(wow[2].includes('20 de steluțe') && !wow[0].includes('de steluțe') && !wow[1].includes(' de ') && wow[3].includes('21 de'), 'RO: ' + wow.join(' | '));

  console.log(`layout at ${VW}×${VH} (every letter, every Read word, every language)`);
  const bad = [];
  for (const l of ['ro', 'de', 'en']) {
    await ev(x => setLang(x), l);
    await ev(() => openTile('letters', false, true));
    const nL = await ev(() => APP.items().length);
    for (let i = 0; i < nL; i++) if (await ev(i => { APP.idx = i; ABC.views.card.show(false); const R = e => e.getBoundingClientRect(); return R($('glyph')).top < R($('bar')).bottom - 1 || R($('examples')).bottom > R($('prev')).top + 1; }, i)) bad.push(`${l}:L${i}`);
    await ev(() => openTile('read', false, true));
    const nR = await ev(() => APP.items().length);
    for (let i = 0; i < nR; i++) if (await ev(i => { APP.idx = i; ABC.views.read.show(false); const R = e => e.getBoundingClientRect(), top = R($('bar')).bottom, bot = R($('rnav')).top;
      return [...document.querySelectorAll('#rpic,#read .rrow,#rC')].some(e => { const r = R(e); return r.top < top - 1 || r.bottom > bot + 1; }) ||
             [...document.querySelectorAll('#read .rt,#rC .rc')].some(t => t.scrollWidth > t.clientWidth + 1); }, i)) bad.push(`${l}:R${i}`);
  }
  ok(bad.length === 0, 'no overlap / clipping' + (bad.length ? ': ' + bad.slice(0, 10).join(' ') : ''));

  console.log('offline (service worker precache from manifest)');
  const cached = await ev(async () => { await navigator.serviceWorker.ready; await new Promise(r => setTimeout(r, 1500));
    const k = (await caches.keys()).find(k => k === 'toddler-' + self.MANIFEST.version); if (!k) return 'no cache';
    const c = await caches.open(k), miss = []; for (const f of self.MANIFEST.files) if (!(await c.match(f))) miss.push(f); return miss.join(' '); });
  ok(cached === '', 'all manifest files cached' + (cached ? ': ' + cached : ''));
  await p.context().setOffline(true); await p.reload(); await p.waitForTimeout(800);
  ok(await ev(() => typeof APP === 'object' && document.querySelectorAll('.flag').length === 3), 'reload works offline');
  await p.context().setOffline(false);

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})();
