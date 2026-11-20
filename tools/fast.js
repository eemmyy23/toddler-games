const { chromium } = require('playwright');
const path = require('path'), os = require('os'), t0 = Date.now();
const SIZES = (process.argv[2] || '320x480,360x640,390x844,768x1024,1024x768,1280x800,1920x1080').split(',').map(s => s.split('x').map(Number));
const out = process.argv[3] || os.tmpdir();

async function audit() {
  const bad = [], R = e => e.getBoundingClientRect(), vis = e => { const r = R(e); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const hit = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
  const chrome = () => ['bar', 'tabs', 'prev', 'next', 'act'].map(id => document.getElementById(id)).filter(e => e && vis(e))
    .flatMap(e => e.id === 'bar' ? [...e.children].filter(vis) : [e]).map(R);
  const stretched = t => { const cs = getComputedStyle(t), kids = [...t.children].filter(k => getComputedStyle(k).position !== 'absolute').map(R);
    const content = kids.length ? Math.max(...kids.map(k => k.bottom)) - Math.min(...kids.map(k => k.top)) + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) : 0;
    return R(t).height > Math.max(parseFloat(cs.minHeight) || 0, content) + 2; };
  const ringCut = e => { const r = R(e), cs = getComputedStyle(e), m = cs.outlineStyle === 'none' ? 0 : parseFloat(cs.outlineWidth) + parseFloat(cs.outlineOffset);
    for (let a = e.parentElement; m && a && a !== document.body; a = a.parentElement) {
      const o = getComputedStyle(a); if (o.overflowX === 'visible' && o.overflowY === 'visible') continue;
      const b = R(a), x = r.left - b.left - a.clientLeft + a.scrollLeft, y = r.top - b.top - a.clientTop + a.scrollTop;
      if (x - m < -0.5 || x + r.width + m > Math.max(a.clientWidth, a.scrollWidth) + 0.5 || y - m < -0.5 || y + r.height + m > Math.max(a.clientHeight, a.scrollHeight) + 0.5) return a.id || a.className.split(' ')[0];
    }
    return null; };
  const screens = [];
  for (const s of ABC.config.sections) screens.push([`hub:${s.id}`, () => { APP.set({ section: s.id }); APP.set({ hub: true }); render(); }]);
  for (const t of TILES) {
    if (learnOk(t)) { const n = itemsOf(t).length, picks = t.view === 'read' ? itemsOf(t).map((x, i) => [x.w.length + (x.forms ? 20 : 0), i]).sort((a, b) => b[0] - a[0]).slice(0, 6).map(x => x[1]) : [...new Set([0, n >> 1, n - 1, itemsOf(t).reduce((b, x, i, a) => String(x.label).length > String(a[b].label).length ? i : b, 0)])];
      for (const i of picks) screens.push([`${t.id}#${i}`, () => { openTile(t.id, false, true); APP.idx = i; view().show(false); }]); }
    if (gameOk(t)) screens.push([`${t.id}:play`, () => openTile(t.id, true, true)]);
  }
  const wait = f => new Promise(res => { const t0 = performance.now(), go = () => f() || performance.now() - t0 > 2000 ? res() : setTimeout(go, 20); go(); });
  for (const [v, mark] of [['home', '.setl'], ['voice', '.setv'], ['pron', '#setq']]) screens.push([`settings:${v}`, async () => { APP.set({ hub: true }); render(); APP.settings.open(); await wait(() => document.querySelector('#setbody .setl'));
    if (v !== 'home') { document.querySelector(`.setn[data-go=${v}]`).click(); await wait(() => document.querySelector(`#setbody ${mark}`)); } }]);
  for (const [name, go] of screens) {
    if (!document.getElementById('settings').hidden) APP.settings.close();
    await go();
    for (const e of document.querySelectorAll('.on')) { const c = vis(e) && ringCut(e); if (c) bad.push(`${name}: ${e.id || e.className.split(' ')[0]} ring cut by ${c}`); }
    if (name.startsWith('settings:')) continue;
    if (document.documentElement.scrollWidth > innerWidth + 1) bad.push(`${name}: horizontal scroll`);
    const col = R(document.getElementById('stage')), cs = getComputedStyle(document.getElementById('stage'));
    const L = col.left + parseFloat(cs.paddingLeft), Rr = col.right - parseFloat(cs.paddingRight);
    const items = [...document.getElementById('bar').children].filter(vis).map(R);
    if (items.length && Math.abs(items[0].left - L) > 2) bar(`bar starts at ${items[0].left | 0}, content at ${L | 0}`);
    if (items.length && Math.max(...items.map(r => r.right)) > Rr + 2) bar(`bar ends at ${Math.max(...items.map(r => r.right)) | 0}, content at ${Rr | 0}`);
    const tabs = [...document.querySelectorAll('.tab')].map(R);
    if (tabs.length && (tabs[0].left < L - 2 || tabs[tabs.length - 1].right > Rr + 2)) bar('tabs outside the content column');
    function bar(m) { bad.push(`${name}: ${m}`); }
    const fixed = chrome(), root = atHub ? document.getElementById('hub') : document.getElementById(view().el);
    const scroller = el => { for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const o = getComputedStyle(e).overflowY; if (o === 'auto' || o === 'scroll') return true; } return false; };
    for (const e of root.querySelectorAll('button,.rrow,.crow,#glyph,#ask,.ex')) {
      if (!vis(e) || scroller(e) || e.closest('#ctools')) continue;
      const r = R(e); if (fixed.some(f => hit(r, f))) { bad.push(`${name}: ${e.id || e.className.split(' ')[0]} under the chrome`); break; }
    }
    for (const e of root.querySelectorAll('#glyph, .nav, .bub, .rt, .rc, .ht .hl')) if (vis(e) && e.scrollWidth > e.clientWidth + 2) bad.push(`${name}: ${e.id || e.className.split(' ')[0]} text wider than its box`);
    const low = [...document.querySelectorAll('[data-low] button, button[data-low]')].filter(vis);
    for (let i = 0; i < low.length; i++) for (let j = i + 1; j < low.length; j++) if (!low[i].contains(low[j]) && !low[j].contains(low[i]) && hit(R(low[i]), R(low[j]))) bad.push(`${name}: ${low[i].id || low[i].className.split(' ')[0]} overlaps ${low[j].id || low[j].className.split(' ')[0]}`);
    if (atHub) for (const t of document.querySelectorAll('#hub .ht')) {
      const b = R(t.querySelector('.agebadge'));
      if (t.scrollHeight > t.clientHeight + 1) bad.push(`${name}/${t.dataset.id}: tile overflow`);
      if ([...t.querySelectorAll('.hp,.hl')].some(e => hit(R(e), b))) bad.push(`${name}/${t.dataset.id}: under the age badge`);
      if (stretched(t)) bad.push(`${name}/${t.dataset.id}: stretched`);
    }
  }
  if (!document.getElementById('settings').hidden) APP.settings.close();
  return [...new Set(bad)];
}

(async () => {
  const b = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { localStorage.clear(); speechSynthesis.speak = () => {}; });
  await p.goto('file://' + path.join(__dirname, '..', 'abc.html'), { waitUntil: 'load' });
  await p.waitForFunction(() => typeof APP === 'object');
  const bad = [];
  for (const lang of await p.evaluate(() => ABC.config.languages)) {
    await p.evaluate(l => { setLang(l); APP.set({ profile: Object.keys(ABC.config.profiles).pop() }); }, lang);
    for (const [w, h] of SIZES) {
      await p.setViewportSize({ width: w, height: h });
      bad.push(...(await p.evaluate(audit)).map(m => `${lang} ${w}x${h} ${m}`));
    }
  }
  const [w, h] = SIZES[SIZES.length - 1];
  for (const [n, f] of [['hub', () => { APP.set({ section: 'num' }); APP.set({ hub: true }); render(); }], ['read', () => { openTile('read', false, true); APP.idx = 0; view().show(false); }]])
    { await p.evaluate(f); await p.screenshot({ path: path.join(out, `fast-${w}-${n}.png`) }); }
  await b.close();
  const ok = !bad.length && !errs.length;
  console.log(ok ? 'ok' : `FAIL (${bad.length + errs.length})\n  ` + [...bad, ...errs].slice(0, 40).join('\n  '));
  console.log(`${SIZES.length} sizes · ${Date.now() - t0} ms`);
  process.exit(ok ? 0 : 1);
})();
