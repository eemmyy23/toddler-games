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
    speechSynthesis.speak = u => { __said.push(u.said); setTimeout(() => u.onend && u.onend(), 20); };
    speechSynthesis.cancel = () => {};
  });
  await p.goto(URL); await p.waitForFunction(() => typeof APP === 'object');
  const ev = (f, a) => p.evaluate(f, a);
  const said = () => ev(() => __said.slice());
  const until = (f, arg) => p.waitForFunction(f, arg, { timeout: 15000 });
  const spoken = (n = 1) => until(n => __said.length >= n, n);
  const clear = () => ev(() => { __said.length = 0; });
  const show = i => ev(i => { APP.idx = i; ABC.views[APP.screen()].show(false); }, i);
  const find = (pred) => ev(src => APP.items().findIndex(new Function('x', 'return ' + src)), pred);

  console.log('chrome built from config');
  ok((await p.$$eval('.flag', f => f.map(x => x.dataset.lang).join())) === 'en,ro,de', 'flags en,ro,de');
  await ev(() => setLang('ro'));
  ok((await p.$$eval('.tab .tl', t => t.map(x => x.textContent).join('|'))) === 'Numere|Litere|Descoperă|Joacă', 'tabs RO');
  ok(await ev(() => !!self.MANIFEST.version), 'manifest loaded');

  console.log('hubs');
  const hub = async sec => { await ev(s => { APP.set({ section: s }); APP.set({ hub: true }); render(); }, sec);
    return p.$$eval('#hub > :not(.hsearch):not(#ver)', t => t.map(x => x.classList.contains('hh') ? '#' + x.textContent : x.querySelector('.hl').textContent)); };
  ok((await hub('abc')).join('|') === 'Alfabetul|Citește|Grupuri de litere', 'Litere hub');
  let play = await hub('play');
  ok(['Găsește numărul', 'Câte sunt?', 'Găsește litera', 'Găsește cuvântul', 'Găsește grupul', 'Găsește culoarea'].every(g => play.includes(g)), `Play hub: ${play.filter(x => x[0] !== '#').length} games`);
  for (const prof of ['curious', 'explorer']) {
    const pair = await ev(pr => { APP.set({ profile: pr }); const learn = [], games = [];
      for (const s of ABC.config.sections.filter(s => !s.play)) { APP.set({ section: s.id }); learn.push(...hubTiles().map(x => x.t.id)); }
      APP.set({ section: 'play' }); games.push(...hubTiles().filter(x => x.t).map(x => x.t.id)); return [learn.join(), games.join()]; }, prof);
    ok(pair[0] === pair[1], `${prof}: Learn ↔ Play 1:1 (${pair[0].split(',').length} tiles)`);
  }
  await ev(() => { APP.set({ profile: 'curious' }); });
  console.log('age profiles (bikes in the bar)');
  await hub('num');
  const bar = await ev(() => { const R = e => e.getBoundingClientRect(), f = R($('flags')), a = R($('ages'));
    return { one: Math.abs(f.top - a.top) < 2, gap: a.left - f.right, right: innerWidth - a.right, n: document.querySelectorAll('.age').length }; });
  ok(bar.n === 3 && bar.one && bar.gap >= 0 && bar.right >= 0, `3 bikes on the same row as the flags (gap ${bar.gap | 0}px, right ${bar.right | 0}px)`);
  for (const pr of ['scientist', 'explorer', 'curious']) {
    await clear(); await p.locator(`.age[data-p="${pr}"]`).dispatchEvent('click'); await spoken();
    const st = await ev(() => ({ p: profile, on: document.querySelector('.age.on').dataset.p, hub: [...document.querySelectorAll('#hub .ht')].length }));
    ok(st.p === pr && st.on === pr && st.hub >= 2, `tap ${pr}: selected, ${st.hub} working tiles, said "${(await said()).pop()}"`);
  }
  const counts = await ev(() => ['curious', 'explorer', 'scientist'].map(pr => { APP.set({ profile: pr }); APP.set({ section: 'play' }); return hubTiles().filter(x => x.t).length; }));
  ok(counts[0] <= counts[1] && counts[1] <= counts[2] && counts[0] >= 6, `higher profiles add, never remove working games (${counts.join(' ≤ ')})`);
  await ev(() => { APP.set({ profile: 'curious' }); });
  await ev(() => openTile('letters', false, true));
  ok(!(await p.isVisible('#ages')), 'bikes hidden inside a lesson (bar holds back/index/stars)');
  await ev(() => setLang('en'));
  ok((await hub('abc')).some(x => /group/i.test(x)), 'EN has letter groups too');
  await ev(() => setLang('ro'));

  console.log('learn card');
  await ev(() => openTile('letters', false, true)); await show(0);
  ok((await p.$$eval('.ex .ew', e => e.map(x => x.textContent).join())) === 'albină,arici,ananas,avion', 'A examples');
  await clear(); await p.keyboard.press('m'); await spoken();
  ok((await said()).pop() === 'mî, de la minge!', 'key m → mî, de la minge!');
  await ev(() => setLang('de'));
  ok((await p.innerText('#glyph')).replace(/\s/g, '') === 'Mm', 'language switch keeps letter M');
  await ev(() => openTile('letters', false, true)); await show(await find("x.id === 'ß'"));
  ok((await p.innerText('#glyph')).replace(/\s/g, '') === 'ß', 'German ß stays ß (not SS)');
  await ev(() => setLang('ro'));

  console.log('read');
  await ev(() => openTile('read', false, true)); await show(await find("x.w === 'câine'"));
  await clear(); await p.locator('#act').dispatchEvent('click'); await spoken(13);
  ok(JSON.stringify(await said()) === JSON.stringify(['cî', 'â', 'i', 'nî', 'e', 'câine', 'câi', 'ne', 'câine', 'un câine', 'doi câini', 'câinele', 'câinii']), 'câine ▶ sequence: ' + (await said()).join(', '));
  await show(await find("x.w === 'urs'"));
  ok(!(await p.$('#rS')), 'one-syllable word has no syllable row');
  await show(await find("x.w === 'curcubeu'"));
  ok(await p.isVisible('#read .links .infobtn'), 'info button in Read for 🌈 (same concept as the colour)');

  console.log('colours + rainbow parts + info');
  await ev(() => openTile('colors', false, true)); await show(await find("x.id === 'rainbow'"));
  const names = [];
  for (let i = 0; i < 7; i++) {
    const pt = await p.$eval(`#glyph .part[data-part="${i}"]`, el => { const L = el.getTotalLength(), q = el.getPointAtLength(L * .3), m = el.getScreenCTM(); return { x: q.x * m.a + m.e, y: q.y * m.d + m.f }; });
    await clear(); await p.mouse.click(pt.x, pt.y); await spoken(); names.push((await said())[0]);
  }
  ok(names.join() === 'roșu,portocaliu,galben,verde,albastru,indigo,violet', 'each rainbow band says its colour: ' + names.join());
  const BANDS = 'roșu,portocaliu,galben,verde,albastru,indigo,violet';
  const cells = () => p.$$eval('#parts .pt', c => c.map(e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }));
  let pc = await cells();
  ok(pc.length === 7 && pc.every(c => c.w >= 44 && c.h >= 44), `rainbow strip: 7 bands, each ≥ 44px (${pc.map(c => (c.w | 0) + 'x' + (c.h | 0)).join(' ')})`);
  await show(await find("x.id === 'rainbow'"));
  ok(await p.isVisible('#parts .tip') && await ev(() => $('parts').classList.contains('hint')), 'first view shows the idle hint (👆 + nudge)');
  await clear(); await p.mouse.click(pc[2].x, pc[2].y); await spoken();
  ok((await said())[0] === 'galben' && await ev(() => document.querySelector('#parts .pt[data-part="2"]').classList.contains('on') && document.querySelector('#glyph .part[data-part="2"]').classList.contains('on')), 'tap a strip band: says "galben", lights the band and the arc');
  ok(!(await p.$('#parts .tip')), 'the hint goes away once a part is used');
  await clear(); await p.mouse.move(pc[0].x, pc[0].y); await p.mouse.down();
  for (const c of pc) await p.mouse.move(c.x, c.y, { steps: 4 });
  await p.mouse.up(); await spoken(7);
  ok((await said()).join() === BANDS, 'drag a finger across the strip: says every colour in order: ' + (await said()).join());
  ok(await ev(() => APP.items()[APP.idx].id === 'rainbow'), 'dragging the strip does not swipe to the next card');
  await clear(); await p.locator('#parts .pt[data-part="5"]').dispatchEvent('click'); await spoken();
  ok((await said())[0] === 'indigo', 'keyboard (click without pointer) on a band says it');
  await show(await find("x.id === 'rainbow'"));
  const hollow = await p.$eval('#glyph svg', el => { const m = el.getScreenCTM(); return { x: 100 * m.a + m.e, y: 96 * m.d + m.f }; });
  const steps = [];
  for (let k = 0; k < 2; k++) { await clear(); await p.mouse.click(hollow.x, hollow.y); await spoken(); steps.push((await said())[0]); }
  ok(steps.join() === 'roșu,portocaliu', 'tapping the picture off a band steps through the parts: ' + steps.join());
  ok(await p.isVisible('#act'), '▶ shown on a card with parts');
  await clear(); await p.locator('#act').dispatchEvent('click'); await spoken(8);
  ok((await said()).join() === 'curcubeu,' + BANDS, '▶ plays the name and every part: ' + (await said()).join());
  await until(() => !$('act').classList.contains('on'));
  for (const [t, n] of [['families', 3], ['opposites', 2]]) {
    await ev(t => openTile(t, false, true), t); await show(0); await ev(() => Promise.all($('glyph').getAnimations().map(a => a.finished))); pc = await p.$$eval('#glyph .part', els => els.map(e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }));
    ok(await p.isHidden('#parts'), `${t}: no extra strip — the picture itself is tapped, each part captioned`);
    const sayN = await ev(() => APP.items()[APP.idx].parts.map(x => x.say));
    await clear(); await p.mouse.click(pc[n - 1].x, pc[n - 1].y); await spoken();
    ok(pc.length === n && pc.every(c => c.w >= 44 && c.h >= 44) && (await said())[0] === sayN[n - 1], `${t}: ${n} captioned parts in the picture ≥ 44px (${pc.map(c => (c.w | 0) + 'x' + (c.h | 0)).join(' ')}), the last says "${(await said())[0]}"`);
  }
  await ev(() => openTile('colors', false, true)); await show(await find("x.id === 'red'"));
  ok(!(await p.isVisible('#act')) && !(await p.isVisible('#parts')), 'a plain colour has no ▶ and no part strip');
  await show(await find("x.id === 'rainbow'"));
  await p.locator('#links .infobtn').dispatchEvent('click'); await until(() => !$('info').hidden);
  ok((await p.innerText('#infotitle')) === 'Curcubeul' && (await p.$$('.inf')).length === 6, 'info card opens with 6 lines');
  await p.locator('#infoclose').dispatchEvent('click');

  console.log('games (every language)');
  const ASK = {
    ro: [['digits', /^Găsește numărul /], ['count', /^Câ(ți|te) \S+ sunt\?$/], ['letters', /^Găsește litera /], ['read', /^(Unde e|Găsește:) /], ['groups', /^Găsește grupul /], ['colors', /^Unde e /], ['families', /^Unde e .+\?$/], ['weather', /^Unde e .+\?$/], ['shapes', /^Unde e .+\?$/], ['body', /^Unde e .+\?$/], ['seasons', /^Când .+\?$/], ['cats', /^Unde punem .+\?$/], ['opposites', /^Care .+\?$/], ['sky', /^(Unde e|Când e) .+\?$/], ['clock', /^Unde e ora .+\?$/], ['halves', /^Unde e .+ și jumătate .+\?$/], ['setclock', /^Care ceas arată .+\?$/], ['teens', /^Găsește numărul /], ['tens', /^Găsește numărul /], ['big', /^Găsește numărul /], ['planets', /^Unde e .+\?$/], ['clean', /^Unde e .+\?$/], ['immune', /^(Ce|Unde) .+\?$/], ['elements', /^Găsește simbolul pentru .+!$/]],
    en: [['digits', /^Find the number /], ['count', /^How many \S+\?$/], ['letters', /^Find the (small )?letter /], ['read', /^(Where is|Find:) /], ['groups', /^Find \S+!$/], ['colors', /^Where is /], ['families', /^Where is the .+\?$/], ['weather', /^Where is the .+\?$/], ['shapes', /^Where is the .+\?$/], ['body', /^Where is the .+\?$/], ['seasons', /^When .+\?$/], ['cats', /^Where does the .+ go\?$/], ['opposites', /^Which one .+\?$/], ['sky', /^(Where is the .+|When is it \w+ outside)\?$/], ['clock', /^Where is .+ o'clock .+\?$/], ['halves', /^Where is half past .+\?$/], ['setclock', /^Which clock shows .+\?$/], ['teens', /^Find the number /], ['tens', /^Find the number /], ['big', /^Find the number /], ['planets', /^Where is .+\?$/], ['clean', /^Where is .+\?$/], ['immune', /^(What|Where) .+\?$/], ['elements', /^Find the symbol for .+!$/]],
    de: [['digits', /^Finde die Zahl /], ['count', /^Wie viele \S+\?$/], ['letters', /^Finde (den (kleinen )?Buchstaben|das) /], ['read', /^(Wo ist|Finde:) /], ['groups', /^Finde \S+!$/], ['colors', /^Wo ist /], ['families', /^Wo ist (der|die|das) .+\?$/], ['weather', /^Wo ist (der|die|das) .+\?$/], ['shapes', /^Wo ist (der|die|das) .+\?$/], ['body', /^Wo ist (der|die|das) .+\?$/], ['seasons', /^Wann .+\?$/], ['cats', /^Wohin gehört (der|die|das) .+\?$/], ['opposites', /^Was .+\?$/], ['sky', /^(Wo ist (der|die|das) .+|Wann ist es draußen \w+)\?$/], ['clock', /^Wo ist .+ Uhr \S+\?$/], ['halves', /^Wo ist halb .+\?$/], ['setclock', /^Welche Uhr zeigt .+\?$/], ['teens', /^Finde die Zahl /], ['tens', /^Finde die Zahl /], ['big', /^Finde die Zahl /], ['planets', /^Wo ist .+\?$/], ['clean', /^Wo ist .+\?$/], ['immune', /^(Was|Wo) .+\?$/], ['elements', /^Finde das Symbol für .+!$/]]
  };
  await ev(() => { APP.set({ profile: 'scientist' }); });
  for (const l of ['ro', 'en', 'de']) {
    await ev(x => setLang(x), l);
    const games = await ev(() => Tiles.list().filter(t => t.game && usable(t, true)).map(t => t.id).sort().join());
    ok(games === ASK[l].map(x => x[0]).sort().join(), `${l}: every playable game is checked (${games})`);
    for (const [id, re] of ASK[l]) {
      await clear(); await ev(i => openTile(i, true, true), id); await spoken();
      const s = await said(), n = (await p.$$('.bub')).length, last = s[s.length - 1] || '';
      ok(re.test(last) && !/undefined|\{/.test(last) && n >= 2, `${l} game ${id}: "${last}" with ${n} bubbles`);
    }
  }
  await ev(() => { setLang('ro'); APP.set({ profile: 'curious' }); });
  await ev(() => openTile('colors', true, true));
  const seen = await ev(() => { const s = new Set(); for (let k = 0; k < 150; k++) { APP.streak = 9; ABC.views.play.newRound(); ABC.views.play.state().opts.forEach(x => s.add(x.id)); } return [...s]; });
  ok(!seen.includes('rainbow') && seen.length === 10, `Find the colour: 10 plain colours, never the rainbow (${seen.length})`);
  await ev(() => openTile('letters', true, true));
  for (let k = 0; k < 200 && !(await ev(() => { const st = ABC.views.play.state(); return !/[ȘȚĂÂÎ]/.test(st.target.id) && /[ȘȚĂÂÎ]/.test(st.opts.map(o => o.id).join('')); })); k++) await ev(() => ABC.views.play.newRound());
  const before = await ev(() => ABC.views.play.state().target.id);
  await ev(() => setLang('de')); const after = await ev(() => ABC.views.play.state().target.id);
  ok(before === after, `language switch keeps the question (${before} → ${after})`);
  await ev(() => setLang('ro'));

  console.log('choice rules (every game, every language, 40 rounds)');
  const rules = await ev(() => { const look = it => it.bubbleArt || (it.bubble ?? it.label) || it.bubbleColor, bad = [];
    APP.set({ profile: 'scientist' });
    for (const c of ABC.config.languages) { setLang(c);
      for (const t of Tiles.list().filter(t => t.game && usable(t, true))) { openTile(t.id, true, true);
        for (let k = 0; k < 40; k++) { APP.streak = k % 12; ABC.views.play.newRound(); const { target, opts } = ABC.views.play.state();
          const ok1 = opts.filter(o => o === target).length === 1, ok2 = new Set(opts.map(look)).size === opts.length,
            ok3 = new Set(opts.map(o => o.sound || o.id)).size === opts.length, ok4 = !target.among || opts.every(o => o.among === target.among);
          if (!(ok1 && ok2 && ok3 && ok4)) { bad.push(`${c}/${t.id}`); break; } } } }
    setLang('ro'); return bad; });
  ok(!rules.length, 'one right answer, no two choices look or sound alike, pairs stay pairs' + (rules.length ? ': ' + rules.join(' ') : ''));
  await ev(() => openTile('colors', true, true));
  const tapRes = await ev(async () => { const { target } = ABC.views.play.state(), s0 = APP.stars, b = document.querySelector(`.bub[data-id="${CSS.escape(target.id)}"]`);
    b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); const s1 = APP.stars; b.click(); return [s0, s1, APP.stars]; });
  ok(tapRes[1] === tapRes[0] && tapRes[2] === tapRes[0] + 1, `a choice answers on click (keyboard too), not on a bare touch (stars ${tapRes.join(' → ')})`);
  const bg = await ev(() => { openTile('letters', true, true); const q0 = ABC.views.play.state().target.id;
    const flip = h => { Object.defineProperty(document, 'hidden', { value: h, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); };
    flip(true); flip(false); const q1 = ABC.views.play.state().target.id;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '5' })); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q' }));
    openTile('weather', false, true); document.querySelector('#links .infobtn').click(); flip(true); flip(false);
    const r = { q0, q1, tile: 'letters', infoOpen: !$('info').hidden }; closeInfo(); delete document.hidden; return r; });
  ok(bg.q0 === bg.q1 && bg.infoOpen, `back from the background: same question (${bg.q0} → ${bg.q1}), the open card stays open`);
  const keyGame = await ev(() => { openTile('letters', true, true); const s = APP.streak = 4; ['5', 'q', '7'].forEach(k => window.dispatchEvent(new KeyboardEvent('keydown', { key: k }))); return [APP.tile().id, APP.screen()]; });
  ok(keyGame[0] === 'letters' && keyGame[1] === 'play', `keys that are not a choice never leave the game (${keyGame.join('/')})`);
  const sfold = await ev(() => { const q = (c, v) => { setLang(c); openSearch(); $('sq').value = v; runSearch(); const r = [...document.querySelectorAll('#sres .sr')].map(x => x.dataset.t + ':' + x.dataset.id); closeSearch(); return r; };
    const r = { gruen: q('de', 'gruen').length, ice: q('en', 'ice-cream').length, ten: q('en', 'ten').filter(x => /^(digits|tens)/.test(x)).length, syn: q('ro', 'ghete').join() }; setLang('ro'); return r; });
  ok(sfold.gruen >= 1 && sfold.ice >= 1 && sfold.ten === 1 && sfold.syn === 'read:boots~1', `search: DE ue = ü, hyphen = space, one row per number, synonyms (ghete → the gheată page) (${JSON.stringify(sfold)})`);
  const syns = await ev(() => { setLang('ro'); openTile('read', false, true); APP.idx = APP.indexOf('boots'); view().show(false); return [...document.querySelectorAll('#rA .syn')].map(b => b.dataset.say).join(); });
  ok(syns === 'gheată,bocanc', `synonyms shown under the word in Read (${syns})`);
  const stay = await ev(() => { document.querySelector('#rA .syn').click(); return APP.items()[APP.idx].id; });
  ok(stay === 'boots', `tapping a synonym's word says it and stays on the page (${stay})`);
  await p.locator('#rA .link').first().dispatchEvent('click');
  const synPage = await ev(() => ({ id: APP.items()[APP.idx].id, w: APP.items()[APP.idx].w, back: [...document.querySelectorAll('#rA .syn')].map(b => b.dataset.say).join() }));
  ok(synPage.id === 'boots~1' && synPage.w === 'gheată' && synPage.back === 'cizmă,bocanc', `🔗 opens the synonym's own Read page, which links back (${JSON.stringify(synPage)})`);
  const prof = await ev(() => { const has = p => { APP.set({ profile: p, section: 'play', hub: true }); return hubTiles().filter(x => x.t).map(x => x.t.id); };
    const c = has('curious'), s = has('scientist'); APP.set({ profile: 'curious' }); return { c: c.length, s: s.length, gated: s.filter(id => !c.includes(id)).length, extra: c.filter(id => !s.includes(id)).length }; });
  ok(prof.gated > 0 && prof.extra === 0, `the youngest profile hides older games (${prof.c} of ${prof.s}, ${prof.gated} hidden)`);
  const voice = await ev(() => { const real = speechSynthesis.getVoices;
    speechSynthesis.getVoices = () => [{ lang: 'en-GB', name: 'A', localService: true }, { lang: 'ro_RO', name: 'B', localService: false }, { lang: 'de-DE', name: 'C', localService: true }];
    SPEECH.pick('ro-RO'); const ro = SPEECH.voice && SPEECH.voice.name; SPEECH.pick('fr-FR'); const fr = [SPEECH.voice, SPEECH.noVoice];
    speechSynthesis.getVoices = real; SPEECH.pick(APP.L().bcp47, APP.L().voices); return { ro, fr }; });
  ok(voice.ro === 'B' && voice.fr[0] === null && voice.fr[1] === true, `speech uses only a voice of the current language (ro → ${voice.ro}, fr → none)`);

  console.log('clock: hour cycle per language, setting the clock by hand, day/night backdrop');
  await ev(() => { APP.set({ profile: 'scientist' }); });
  const cyc = await ev(() => { const r = {}; for (const c of ABC.config.languages) { setLang(c); openTile('clock', false, true); APP.idx = APP.indexOf('15:00'); view().show(false); r[c] = $('word').textContent; } return r; });
  ok(/^3:00\s?pm$/i.test(cyc.en) && cyc.ro === '15:00' && cyc.de === '15:00', `15:00 per language, hour cycle from the module strings (${JSON.stringify(cyc)})`);
  const fb = await ev(() => { const s = ABC.modules.find(m => m.id === 'clock').strings.ro, hc = s.hourCycle, L = ABC.langs.ro, b0 = L.bcp47;
    const at = loc => { delete s.hourCycle; L.bcp47 = loc; delete Tiles._content.ro; return Tiles.items(TILE.clock, 'ro').find(x => x.id === '15:00').word; };
    const r = { us: at('en-US'), ro: at('ro-RO') }; s.hourCycle = hc; L.bcp47 = b0; delete Tiles._content.ro; return r; });
  ok(/^3:00\s?PM$/i.test(fb.us) && fb.ro === '15:00', `without hourCycle data the locale decides via Intl (en-US ${fb.us}, ro-RO ${fb.ro})`);
  const talk = await ev(() => { const r = {}; for (const c of ['en', 'ro', 'de']) { const d = Tiles.content(c).clock.dial[0].dial; r[c] = [210, 165, 750, 765].map(v => d.read(v).say); } return r; });
  ok(/^Half past three at night/.test(talk.en[0]) && /^Trei fără un sfert/.test(talk.ro[1]) && /^Halb vier/.test(talk.de[0]) && /^Halb eins mittags/.test(talk.de[2]) && /^Unu fără un sfert/.test(talk.ro[3]),
    `spoken times by rule: ${talk.en[0]} | ${talk.ro[1]} | ${talk.de[0]} | ${talk.de[2]} | ${talk.ro[3]}`);
  const nights = await ev(() => { openTile('clock', false, true); const bg = id => { APP.idx = APP.indexOf(id); view().show(false); return $('backdrop').hidden ? '' : $('backdrop').style.background; };
    const r = { day: bg('12:00'), night: bg('20:00') }; goHub(); r.hub = $('backdrop').hidden; return r; });
  ok(nights.day && nights.night && nights.day !== nights.night && /radial/.test(nights.night) && !/radial/.test(nights.day) && nights.hub, 'card backdrop: day sky at 12:00, starry night at 20:00, none on the hub');
  await ev(() => { setLang('en'); openTile('setclock', false, true); APP.idx = APP.indexOf('15:20'); view().show(false); });
  const box = await p.$eval('#dface', e => { const r = e.getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, R: r.width / 2 }; });
  const pt = (deg, k) => [box.cx + box.R * k * Math.sin(deg * Math.PI / 180), box.cy - box.R * k * Math.cos(deg * Math.PI / 180)];
  const drag = async (path, k) => { await p.mouse.move(...pt(path[0], k)); await p.mouse.down(); for (const d of path.slice(1)) await p.mouse.move(...pt(d, k), { steps: 4 }); await p.mouse.up(); };
  const dialNow = () => ev(() => ({ t: $('dtime').textContent, v: ABC.views.dial.state().value, hour: parseFloat(document.querySelector('#dface .dhand').style.transform.slice(7)) % 360, bg: $('backdrop').style.background }));
  const d0 = await dialNow();
  await clear(); await drag([120, 160, 200, 240, 268], 0.72); await spoken();
  const d1 = await dialNow(), s1 = (await said()).pop();
  ok(d1.v === 945 && /3:45\s?pm$/i.test(d1.t) && Math.abs(d1.hour - 112.5) < 0.01 && s1 === 'Quarter to four in the afternoon!',
    `dragging the minute hand 15:20 → ${d1.t} (snapped to 5), the hour hand follows (${d1.hour}°), said on release: "${s1}"`);
  await clear(); await drag([112.5, 150, 190, 202.5], 0.35); await spoken();
  const d2 = await dialNow(), s2 = (await said()).pop();
  ok(d2.v === 1125 && /6:45\s?pm$/i.test(d2.t) && s2 === 'Quarter to seven in the evening!' && d2.bg !== d0.bg, `dragging the hour hand keeps the minutes (${d2.t}, "${s2}") and the background changes`);
  await clear(); await p.mouse.click(...pt(0, 0.62)); await spoken();
  const d3 = await dialNow();
  await clear(); await p.locator('#dmore').dispatchEvent('click'); await spoken();
  const d4 = await dialNow(), s4 = (await said()).pop();
  ok(d3.v === 1425 && d4.v === 1430 && /night/.test(s4) && /radial/.test(d4.bg), `tap alternatives: tap the 12 → ${d3.t}, + → ${d4.t} ("${s4}"), starry night`);
  const rays = await ev(() => { const d = APP.items()[0].dial, rgb = s => [...s.matchAll(/rgb\((\d+), (\d+), (\d+)\)/g)].map(m => m.slice(1).map(Number));
    const lum = c => c.map(x => x / 255).map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4).reduce((a, x, i) => a + x * [0.2126, 0.7152, 0.0722][i], 0);
    const con = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    const e = document.createElement('span'); e.className = 'label'; document.body.appendChild(e); const muted = rgb(getComputedStyle(e).color)[0]; e.remove();
    const text = rgb(getComputedStyle(document.body).color)[0]; let t = 99, m = 99;
    for (let v = 0; v < d.cycle; v += d.step) { const [top, bot] = rgb(d.read(v).backdrop).slice(-2); t = Math.min(t, con(text, top), con(text, bot)); m = Math.min(m, con(muted, bot)); }
    return { t: +t.toFixed(2), m: +m.toFixed(2) }; });
  ok(rays.t >= 4.5 && rays.m >= 3, `backdrop contrast at every 5 minutes: text ≥ 4.5 (${rays.t}), muted text on the lower sky ≥ 3 (${rays.m})`);
  await ev(() => { setLang('ro'); APP.set({ profile: 'curious' }); });

  console.log('index, A–Z bar, universal search');
  await ev(() => setLang('ro'));
  for (const id of ['digits', 'letters', 'read', 'colors']) {
    await ev(i => openTile(i, false, true), id);
    ok(await p.isVisible('#gridbtn'), `${id}: index (⊞) button visible`);
  }
  await ev(() => { openTile('read', false, true); openIndex(); });
  const ix = await ev(() => ({ heads: [...document.querySelectorAll('.ixh b')].map(b => b.textContent), az: document.querySelectorAll('#ixaz .az').length,
    c: document.querySelector('#ixh-C .label').textContent, bar: getComputedStyle($('ixaz')).display }));
  ok(ix.bar === 'flex' && ix.az >= 26 && ix.heads[0] === 'A' && ix.heads.includes('Ș'), `Read index: A–Z sections (${ix.heads.length}) + side bar (${ix.az} letters)`);
  ok(/^\d+ (de )?cuvinte$/.test(ix.c), `section count: "C · ${ix.c}"`);
  const azb = await p.$eval('#ixaz', e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, top: r.top, h: r.height }; });
  const n = await ev(() => document.querySelectorAll('#ixaz .az').length), k = await ev(() => [...document.querySelectorAll('#ixaz .az')].findIndex(a => a.dataset.u === 'V'));
  await p.mouse.click(azb.x, azb.top + azb.h * (k + 0.5) / n);
  const vis = await ev(() => { const h = $('ixh-V').getBoundingClientRect(), g = $('ixgrid').getBoundingClientRect(); return h.top >= g.top - 2 && h.top < g.top + 40; });
  ok(vis, 'tap V on the side bar jumps to the V section');
  ok(await ev(() => document.querySelector('#ixaz .az.on')?.dataset.u === 'V'), 'side bar lights V after the jump');
  for (const u of ['M', 'C', 'T']) {
    await ev(u => { $('ixgrid').scrollTo({ top: $('ixh-' + u).offsetTop + 30 }); }, u); await until(u => document.querySelector('#ixaz .az.on')?.dataset.u === u, u).catch(() => {});
    const cur = await ev(() => document.querySelector('#ixaz .az.on')?.dataset.u);
    ok(cur === u, `scrolling into ${u} lights ${u} in the side bar (got ${cur})`);
  }
  await ev(() => closeIndex());
  const search = async q => { await ev(q => { openSearch(); $('sq').value = q; runSearch(); }, q);
    return ev(() => [...document.querySelectorAll('.sr')].map(r => r.dataset.t + ':' + r.dataset.id)); };
  ok((await search('goat')).includes('read:goat'), 'search "goat" (EN) → capră');
  ok((await search('ziege')).includes('read:goat'), 'search "Ziege" (DE, any case) → capră');
  ok((await search('zwei'))[0] === 'digits:n2', 'search "zwei" → 2');
  const rot = await search('rot');
  ok(rot[0].endsWith(':red') && rot.length === 1, `search "rot" → one result for roșu, no substring noise (${rot.join(' ')})`);
  ok(await ev(() => [...document.querySelectorAll('.sr .link')].map(l => l.dataset.t).join()) === 'read,colors', 'roșu links to Citește and Culori');
  ok((await search('capra')).includes('read:goat'), 'search without diacritics: "capra" → capră');
  await ev(() => { document.querySelector('.sr').click(); });
  ok(await ev(() => APP.screen() === 'read' && APP.items()[APP.idx].id === 'goat' && $('search').hidden), 'tapping a result opens it');
  await ev(() => { openSearch(); }); await until(() => document.activeElement === $('sq')); await p.keyboard.type('m');
  ok(await ev(() => !$('search').hidden && $('sq').value === 'm'), 'typing in search does not trigger letter shortcuts');
  await p.keyboard.press('Escape');

  console.log('hubs: tiles look like buttons (not stretched)');
  for (const sec of ['num', 'abc', 'disc']) {
    await ev(s => { APP.set({ section: s }); APP.set({ hub: true }); render(); }, sec);
    const hs = await p.$$eval('#hub .ht', t => t.map(x => { const R = e => e.getBoundingClientRect(), cs = getComputedStyle(x), kids = [...x.children].filter(k => getComputedStyle(k).position !== 'absolute').map(R);
      const content = Math.max(...kids.map(k => k.bottom)) - Math.min(...kids.map(k => k.top)) + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      return [R(x).height | 0, Math.max(parseFloat(cs.minHeight), content) + 2]; }));
    ok(hs.length && hs.every(([h, max]) => h <= max), `${sec} hub tiles not stretched (${hs.map(h => h[0]).join(', ')})`);
  }
  ok(await p.isVisible('.hsearch'), 'search pill on the hub');
  ok(await ev(() => !ABC.config.sections.some(s => /🔍|🔎/u.test(s.icon))), 'no tab uses a magnifier (it would look like search)');
  await ev(() => { APP.set({ profile: 'scientist' }); APP.set({ section: 'disc' }); APP.set({ hub: true }); render(); });
  const badges = await ev(() => [...document.querySelectorAll('#hub .ht')].map(t => { const b = t.querySelector('.agebadge'), r = t.getBoundingClientRect(), q = b.getBoundingClientRect();
    return { id: t.dataset.id, p: b.dataset.p, x: (q.left + q.width / 2 - r.left) / r.width }; }));
  const where = { curious: x => x < 0.3, explorer: x => x > 0.4 && x < 0.6, scientist: x => x > 0.7 };
  await ev(() => { APP.set({ profile: 'scientist' }); APP.set({ section: 'disc' }); render(); });
  ok(badges.length && badges.every(b => where[b.p](b.x)), 'age badges placed by age: ' + badges.map(b => `${b.id}=${b.p}@${b.x.toFixed(2)}`).join(' '));
  ok(badges.find(b => b.id === 'colors').p === 'curious' && badges.find(b => b.id === 'families').p === 'curious', 'colours, families = curious');
  await ev(() => { APP.set({ section: 'num' }); render(); });
  const nb = await ev(() => Object.fromEntries([...document.querySelectorAll('#hub .ht')].map(t => [t.dataset.id, t.querySelector('.agebadge').dataset.p])));
  ok(nb.digits === 'curious' && nb.teens === 'explorer' && nb.clock === 'curious' && nb.halves === 'explorer' && nb.setclock === 'explorer' && nb.big === 'scientist', 'numbers hub: ' + JSON.stringify(nb));
  const over = [];
  for (const pr of ['curious', 'explorer', 'scientist']) for (const sec of ['num', 'abc', 'disc', 'play']) {
    await ev(([pr, sec]) => { APP.set({ profile: pr }); APP.set({ section: sec }); APP.set({ hub: true }); render(); }, [pr, sec]);
    over.push(...await ev(() => [...document.querySelectorAll('#hub .ht')].filter(t => { const r = t.getBoundingClientRect(), b = t.querySelector('.agebadge').getBoundingClientRect();
      return t.scrollHeight > t.clientHeight + 1 || [...t.querySelectorAll('.hp,.hl')].some(e => { const q = e.getBoundingClientRect(); return q.top < b.bottom - 1 && q.right > b.left && q.left < b.right; }); }).map(t => t.dataset.id)));
  }
  ok(!over.length, 'hub tiles: nothing overflows or sits under the age badge' + (over.length ? ': ' + [...new Set(over)].join(' ') : ''));
  await ev(() => { APP.set({ profile: 'curious' }); render(); });

  console.log('count ▶: pressed state, progress, starts at 1, tap again stops');
  await ev(() => { openTile('count', false, true); $('count').scrollTop = 9999; });
  await p.locator('#act').dispatchEvent('click'); await until(() => document.querySelector('.crow.on')?.dataset.n === '2');
  const cp = await ev(() => ({ top: $('count').scrollTop, cls: $('act').classList.contains('on'), act: document.querySelector('.crow.on')?.dataset.n }));
  ok(cp.top < 5 && cp.cls && cp.act === '2', `playing: scrolled to top, ▶ pressed, row ${cp.act}`);
  const rows = [];
  for (let k = 3; k <= 10; k++) { await until(k => document.querySelector('.crow.on')?.dataset.n === String(k), k);
    await ev(() => new Promise(res => { let last = -1; const tick = () => { const s = $('count').scrollTop; if (s === last) res(); else { last = s; setTimeout(tick, 80); } }; tick(); })); rows.push(await ev(() => { const a = document.querySelector('.crow.on'); if (!a) return 'none';
    const r = a.getBoundingClientRect(), b = $('count').getBoundingClientRect(), t = $('ctools').getBoundingClientRect(); return r.top >= t.bottom - 14 && r.bottom <= Math.min(b.bottom, innerHeight - 60) + 2 ? 'ok' : a.dataset.n; })); }
  ok(rows.every(x => x === 'ok'), 'the counted row is always fully visible (' + rows.join(' ') + ')');
  await p.locator('#act').dispatchEvent('click');
  ok(await ev(() => !$('act').classList.contains('on') && !document.querySelector('.crow.on')), 'tap ▶ again stops');

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
    for (let i = 0; i < nR; i++) if (await ev(i => { APP.idx = i; ABC.views.read.show(false); const R = e => e.getBoundingClientRect(), top = R($('bar')).bottom, bot = Math.min(R($('act')).top, R($('prev')).top);
      return [...document.querySelectorAll('#rpic,#read .rrow,#rC')].some(e => { const r = R(e); return r.top < top - 1 || r.bottom > bot + 1; }) ||
             [...document.querySelectorAll('#read .rt,#rC .rc')].some(t => t.scrollWidth > t.clientWidth + 1); }, i)) bad.push(`${l}:R${i}`);
  }
  ok(bad.length === 0, 'no overlap / clipping' + (bad.length ? ': ' + bad.slice(0, 10).join(' ') : ''));

  console.log('offline (service worker precache from manifest)');
  const cached = await ev(async () => { await navigator.serviceWorker.ready; await new Promise(r => setTimeout(r, 1500));
    const k = (await caches.keys()).find(k => k === 'toddler-' + self.MANIFEST.version); if (!k) return 'no cache';
    const c = await caches.open(k), miss = []; for (const f of self.MANIFEST.files) if (!(await c.match(self.MANIFEST.scripts.includes(f) ? f + '?v=' + self.MANIFEST.version : f))) miss.push(f); return miss.join(' '); });
  ok(cached === '', 'all manifest files cached' + (cached ? ': ' + cached : ''));
  await p.context().setOffline(true); await p.reload(); await p.waitForFunction(() => typeof APP === 'object', null, { timeout: 10000 }).catch(() => {});
  ok(await ev(() => typeof APP === 'object' && document.querySelectorAll('.flag').length === 3), 'reload works offline');
  await p.context().setOffline(false);

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})();
