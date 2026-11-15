// Fast layout check for CSS / markup edits — target < 3 s. No server: loads abc.html from disk.
//   node tools/fast.js [WxH] [outDir]     default 360x640, screenshots in the OS temp dir
// Checks every hub × every profile: nothing overflows a tile, nothing under the age badge, tiles not stretched.
// The full suite (tools/smoke.js) still runs before a push and in CI.
const { chromium } = require('playwright');
const path = require('path'), os = require('os'), t0 = Date.now();
const [W, H] = (process.argv[2] || '360x640').split('x').map(Number);
const out = process.argv[3] || os.tmpdir();
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { localStorage.clear(); speechSynthesis.speak = () => {}; });
  await p.goto('file://' + path.join(__dirname, '..', 'abc.html'), { waitUntil: 'load' });
  await p.waitForFunction(() => typeof APP === 'object');
  const bad = await p.evaluate(() => {
    const out = [], R = e => e.getBoundingClientRect();
    for (const pr of Object.keys(ABC.config.profiles)) for (const s of ABC.config.sections) {
      profile = pr; section = s.id; atHub = true; render();
      for (const t of document.querySelectorAll('#hub .ht')) {
        const b = R(t.querySelector('.agebadge'));
        if (t.scrollHeight > t.clientHeight + 1) out.push(`${pr}/${s.id}/${t.dataset.id}: overflow`);
        for (const e of t.querySelectorAll('.hp,.hl,.badge')) { const q = R(e); if (q.top < b.bottom - 1 && q.right > b.left && q.left < b.right) out.push(`${pr}/${s.id}/${t.dataset.id}: ${e.className} under badge`); }
        if (R(t).height > 0.45 * innerHeight && R(t).height > 220) out.push(`${pr}/${s.id}/${t.dataset.id}: stretched`);
      }
    }
    return out;
  });
  const shots = [['hub-num', () => { profile = 'scientist'; section = 'num'; render(); }], ['hub-play', () => { section = 'play'; render(); }],
                 ['read', () => { profile = 'little'; openTile('read', false, true); }]];
  for (const [n, f] of shots) { await p.evaluate(f); await p.screenshot({ path: path.join(out, `fast-${n}.png`) }); }
  await b.close();
  const ok = !bad.length && !errs.length;
  console.log(ok ? 'ok' : 'FAIL\n  ' + [...bad, ...errs].join('\n  '));
  console.log(`${W}x${H} · ${Date.now() - t0} ms · screenshots: ${out}/fast-*.png`);
  process.exit(ok ? 0 : 1);
})();
