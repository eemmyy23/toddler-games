// Fast layout check for CSS / markup edits — target < 3 s. No server: loads abc.html from disk.
//   node tools/fast.js [WxH,WxH,…] [outDir]     default: phone low-res → desktop (see SIZES)
// Generic checks on every screen at every size (no per-screen rules):
//   · alignment: the top bar, the content and the tab bar share one column (--col / --gut)
//   · nothing of the active screen sits under the fixed chrome (top bar, tab bar, ‹ › arrows)
//   · no horizontal scrolling; hub tiles: no overflow, nothing under the age badge, not stretched
// The full suite (tools/smoke.js) still runs before a push and in CI.
const { chromium } = require('playwright');
const path = require('path'), os = require('os'), t0 = Date.now();
const SIZES = (process.argv[2] || '320x480,360x640,390x844,768x1024,1024x768,1280x800,1920x1080').split(',').map(s => s.split('x').map(Number));
const out = process.argv[3] || os.tmpdir();

// runs in the page: every screen of the app, measured generically
function audit() {
  const bad = [], R = e => e.getBoundingClientRect(), vis = e => { const r = R(e); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const hit = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
  const chrome = () => ['bar', 'tabs', 'prev', 'next', 'rnav'].map(id => document.getElementById(id)).filter(e => e && vis(e))
    .flatMap(e => e.id === 'rnav' || e.id === 'bar' ? [...e.children].filter(vis) : [e]).map(R);
  const screens = [];
  for (const s of ABC.config.sections) screens.push([`hub:${s.id}`, () => { section = s.id; atHub = true; render(); }]);
  for (const t of TILES) {
    if (learnOk(t)) { const n = itemsOf(t).length, picks = t.view === 'read' ? itemsOf(t).map((x, i) => [x.w.length + (x.forms ? 20 : 0), i]).sort((a, b) => b[0] - a[0]).slice(0, 6).map(x => x[1]) : [0, n - 1];
      for (const i of picks) screens.push([`${t.id}#${i}`, () => { openTile(t.id, false, true); APP.idx = i; view().show(false); }]); }
    if (gameOk(t)) screens.push([`${t.id}:play`, () => openTile(t.id, true, true)]);
  }
  for (const [name, go] of screens) {
    go();
    if (document.documentElement.scrollWidth > innerWidth + 1) bad.push(`${name}: horizontal scroll`);
    // one column: bar edges = content edges = tab edges
    const col = R(document.getElementById('stage')), cs = getComputedStyle(document.getElementById('stage'));
    const L = col.left + parseFloat(cs.paddingLeft), Rr = col.right - parseFloat(cs.paddingRight);
    const items = [...document.getElementById('bar').children].filter(vis).map(R);
    if (items.length && Math.abs(items[0].left - L) > 2) bar(`bar starts at ${items[0].left | 0}, content at ${L | 0}`);
    const tabs = [...document.querySelectorAll('.tab')].map(R);
    if (tabs.length && (tabs[0].left < L - 2 || tabs[tabs.length - 1].right > Rr + 2)) bar('tabs outside the content column');
    function bar(m) { bad.push(`${name}: ${m}`); }
    // nothing under the fixed chrome
    const fixed = chrome(), root = atHub ? document.getElementById('hub') : document.getElementById(view().el);
    const scroller = el => { for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const o = getComputedStyle(e).overflowY; if (o === 'auto' || o === 'scroll') return true; } return false; };
    for (const e of root.querySelectorAll('button,.rrow,.crow,#glyph,#ask,.ex')) {
      if (!vis(e) || scroller(e) || e.closest('#ctools')) continue; // scrolling lists may pass under the chrome
      const r = R(e); if (fixed.some(f => hit(r, f))) { bad.push(`${name}: ${e.id || e.className.split(' ')[0]} under the chrome`); break; }
    }
    if (atHub) for (const t of document.querySelectorAll('#hub .ht')) {
      const b = R(t.querySelector('.agebadge'));
      if (t.scrollHeight > t.clientHeight + 1) bad.push(`${name}/${t.dataset.id}: tile overflow`);
      if ([...t.querySelectorAll('.hp,.hl,.badge')].some(e => hit(R(e), b))) bad.push(`${name}/${t.dataset.id}: under the age badge`);
      if (R(t).height > 220) bad.push(`${name}/${t.dataset.id}: stretched`);
    }
  }
  return [...new Set(bad)];
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { localStorage.clear(); speechSynthesis.speak = () => {}; });
  await p.goto('file://' + path.join(__dirname, '..', 'abc.html'), { waitUntil: 'load' });
  await p.waitForFunction(() => typeof APP === 'object');
  await p.evaluate(() => { setLang('ro'); profile = 'scientist'; });
  const bad = [];
  for (const [w, h] of SIZES) {
    await p.setViewportSize({ width: w, height: h });
    bad.push(...(await p.evaluate(audit)).map(m => `${w}x${h} ${m}`));
  }
  const [w, h] = SIZES[SIZES.length - 1];
  for (const [n, f] of [['hub', () => { section = 'num'; atHub = true; render(); }], ['read', () => { openTile('read', false, true); APP.idx = 0; view().show(false); }]])
    { await p.evaluate(f); await p.screenshot({ path: path.join(out, `fast-${w}-${n}.png`) }); }
  await b.close();
  const ok = !bad.length && !errs.length;
  console.log(ok ? 'ok' : `FAIL (${bad.length + errs.length})\n  ` + [...bad, ...errs].slice(0, 40).join('\n  '));
  console.log(`${SIZES.length} sizes · ${Date.now() - t0} ms`);
  process.exit(ok ? 0 : 1);
})();
