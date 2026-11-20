const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));
const ls = (dir, re) => exists(dir) ? fs.readdirSync(path.join(root, dir)).filter(f => re.test(f)).sort().map(f => `${dir}/${f}`) : [];
const FIX = process.argv.includes('--fix');
let errors = 0, warnings = 0;
const err = m => { console.log('  ERROR ' + m); errors++; };
const warn = m => { console.log('  warn  ' + m); warnings++; };

const ctx = vm.createContext({ console, Intl, self: {} });
const run = f => vm.runInContext(read(f) + '\n;globalThis.ABC = ABC;', ctx, { filename: f });
run('abc/core/registry.js'); run('abc/core/i18n.js'); run('abc/config.js');
const CFG = ctx.ABC.config;
const scripts = ['abc/core/registry.js', 'abc/core/i18n.js', 'abc/config.js', 'abc/concepts.js', 'abc/art.js'];
for (const c of CFG.languages) {
  for (const f of ['grammar', 'strings', 'words', 'info']) { const p = `abc/lang/${c}/${f}.js`; if (exists(p)) scripts.push(p); else if (f !== 'info') err(`language ${c}: missing ${p}`); }
}
scripts.push('abc/core/content.js', 'abc/core/tiles.js');
for (const m of CFG.modules) {
  if (!exists(`abc/modules/${m}/module.js`)) { err(`module ${m}: missing abc/modules/${m}/module.js`); continue; }
  scripts.push(...ls(`abc/modules/${m}`, /^(?!module\.js).*\.js$/), `abc/modules/${m}/module.js`);
  for (const c of CFG.languages) { const p = `abc/modules/${m}/lang/${c}.js`; if (exists(p)) scripts.push(p); }
}
const VIEW_FILES = ls('abc/core/views', /\.js$/), GAME_FILES = ls('abc/core/games', /\.js$/);
scripts.push('abc/core/services.js', 'abc/core/piper.js', 'abc/core/pron.js', ...VIEW_FILES, ...GAME_FILES, 'abc/core/shell.js', 'abc/core/settings.js');
const files = ['abc.html', 'abc/manifest.js', ...scripts, 'manifest-abc.json', 'abc-icon-192.png', 'abc-icon-512.png',
  ...ls('fonts', /\.woff2$/), 'rocket.html', 'paint.html', 'tts.html', 'tts.js', 'manifest.json', 'manifest-paint.json',
  'icon-192.png', 'icon-512.png', 'paint-icon-192.png', 'paint-icon-512.png'].filter(exists);
for (const f of ls('.', /\.(html|js)$/).map(f => f.slice(2))) if (f !== 'sw.js' && !files.includes(f)) err(`${f}: not in the manifest files — the version hash would miss its changes and sw.js would keep serving the old copy`);
const hash = crypto.createHash('sha256'); files.filter(f => f !== 'abc/manifest.js').forEach(f => hash.update(f).update(fs.readFileSync(path.join(root, f))));
const version = hash.digest('hex').slice(0, 10);
const manifest = `self.MANIFEST = ${JSON.stringify({ version, scripts, files }, null, 2)};\n`;
if (FIX) { fs.writeFileSync(path.join(root, 'abc/manifest.js'), manifest); console.log(`manifest written: ${scripts.length} scripts, ${files.length} files, version ${version}`); }
else if (!exists('abc/manifest.js') || read('abc/manifest.js') !== manifest) err('abc/manifest.js is out of date — run `node tools/check.js --fix`');

for (const f of scripts.slice(3)) { if (/^abc\/core\/(services|shell|settings|views\/)/.test(f)) continue; run(f); }
const ABC = ctx.ABC, Tiles = vm.runInContext('Tiles', ctx), CONTENT = vm.runInContext('CONTENT', ctx), langs = CFG.languages, base = CFG.baseLanguage;
for (const f of VIEW_FILES) ABC.views[path.basename(f, '.js')] = {};
const keysOf = (o, p = '') => Object.entries(o || {}).flatMap(([k, v]) => v && typeof v === 'object' && !Array.isArray(v) && !('other' in v) ? keysOf(v, p + k + '.') : [p + k]);

const html = read('abc.html'), css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
const markup = html.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<title>[^<]*<\/title>/, '').replace(/<!doctype[^>]*>/i, '');
for (const m of markup.matchAll(/>([^<]*[^<\s][^<]*)</gu)) err(`abc.html: hard-coded text "${m[1].trim()}" — text comes from strings/config`);
{ const body = css.replace(/@media[^{]*\{:root\{[^}]*\}\}/g, '').replace(/:root\{[^}]*\}/g, '').replace(/@media \(prefers-reduced-motion:reduce\)\{[^{]*\{[^}]*\}\}/, '');
  for (const m of body.matchAll(/@media[^{]*\{(?!:root)/g)) err(`abc.html CSS: "${m[0].trim()}" sets more than tokens — breakpoints only reassign :root tokens`);
  for (const m of body.matchAll(/[^{}]+\{[^}]*\}/g)) {
    const raw = [...m[0].matchAll(/(?<![\w.#-])-?(\d+(?:\.\d+)?)(px|vh|vw)\b/g)].filter(x => x[2] !== 'px' || +x[1] > 2).map(x => x[0]);
    const col = m[0].match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|cubic-bezier\(/g) || [], dur = m[0].match(/(?<![\w.#-])\d*\.?\d+m?s\b/g) || [];
    raw.push(...dur);
    if (raw.length || col.length) err(`abc.html CSS: raw ${[...raw, ...col].join(' ')} in "${m[0].trim().split('{')[0].slice(0, 50)}" — sizes, colours and timings are :root tokens`);
  } }
for (const m of css.matchAll(/content\s*:\s*(['"])(.+?)\1/g)) err(`abc.html CSS: hard-coded content "${m[2]}" — icons come from config.icons`);
const appMan = JSON.parse(read('manifest-abc.json')), title = (html.match(/<title>([^<]*)<\/title>/) || [])[1], apple = (html.match(/apple-mobile-web-app-title" content="([^"]*)"/) || [])[1];
const theme = (html.match(/name="theme-color" content="([^"]*)"/) || [])[1], bg0 = (css.match(/--bg0:([^;]+);/) || [])[1];
for (const [what, v] of [['<title>', title], ['apple-mobile-web-app-title', apple], ['manifest-abc.json name', appMan.name]]) if (v !== CFG.name) err(`${what} "${v}" ≠ config.name "${CFG.name}"`);
if (theme !== bg0 || appMan.theme_color !== bg0 || appMan.background_color !== bg0) err(`theme colour: meta ${theme}, manifest ${appMan.theme_color}/${appMan.background_color}, --bg0 ${bg0} must match`);
if ((html.match(/<html lang="([^"]*)"/) || [])[1] !== CFG.baseLanguage) err('abc.html <html lang> must be config.baseLanguage');
const usedKeys = { aria: [...html.matchAll(/data-aria="(\w+)"/g)].map(m => m[1]), text: [...html.matchAll(/data-text="(\w+)"/g)].map(m => m[1]), icon: [...html.matchAll(/data-icon="(\w+)"/g)].map(m => m[1]) };
const apps = ['abc.html', 'paint.html', 'rocket.html'].filter(exists).map(f => { const href = (read(f).match(/rel="manifest" href="([^"]+)"/) || [])[1]; return href && Object.assign({ page: f }, JSON.parse(read(href))); }).filter(Boolean);
for (const a of apps) {
  if (!a.id || !a.start_url || !a.scope || !a.start_url.startsWith(a.scope)) err(`${a.page}: manifest needs id, start_url and a scope that contains start_url`);
  for (const b of apps) if (a !== b && (b.start_url.startsWith(a.scope) || a.id === b.id)) err(`${a.page} and ${b.page}: installed apps overlap (scope ${a.scope} contains ${b.start_url}) — each app needs its own scope`);
}
for (const f of fs.readdirSync(root).filter(f => /\.(png|jpe?g|webp|gif)$/i.test(f))) if (!files.includes(f)) err(`${f}: image in the repo root that the app does not use (stray screenshot?)`);
console.log('config');
if (!/^\d+\.\d+\.\d+$/.test(CFG.version || '')) err('config.version must be x.y.z');
if (!langs.includes(base)) err(`config.baseLanguage "${base}" is not in config.languages`);
if (new Set(CFG.sections.map(s => s.id)).size !== CFG.sections.length) err('config.sections: duplicate id');
if (CFG.sections.filter(s => s.play).length !== 1) err('config.sections: exactly one section must have play: true');
const P = Object.keys(CFG.profiles || {});
if (!P.length) err('config.profiles is empty');
if (!CFG.profiles[CFG.defaultProfile]) err(`config.defaultProfile "${CFG.defaultProfile}" is not a profile`);
P.forEach((p, i) => {
  const a = CFG.profiles[p].ages;
  if (!Array.isArray(a) || a.length !== 2 || a[0] >= a[1]) err(`profile ${p}: ages must be [from, to]`);
  else if (i && a[1] <= CFG.profiles[P[i - 1]].ages[1]) err(`profile ${p}: profiles must be listed in ascending age order`);
  if (!ABC.art[CFG.profiles[p].art || p]) err(`profile ${p}: no picture — ART('${CFG.profiles[p].art || p}', …) in abc/art.js`);
});

for (const k of usedKeys.icon) if (CFG.icons[k] == null && !ABC.art[k]) err(`abc.html data-icon "${k}": not in config.icons or ART`);
ABC.errors.splice(0).forEach(err);
console.log(`languages: ${langs.join(', ')} (base ${base})`);
const needs = new Set(Tiles.modules().flatMap(m => m.needs || []));
for (const c of langs) {
  const L = ABC.langs[c]; if (!L) { err(`${c}: not loaded`); continue; }
  for (const k of ['name', 'flag', 'bcp47', 'letters', 'forms', ...needs]) if (L[k] == null) err(`${c}: grammar.js missing "${k}"`);
  for (const k of ['numbers', 'teens', 'tens']) if (L[k] && L[k].length !== 10) err(`${c}: ${k} must have 10 entries`);
  try { new Intl.Locale(L.bcp47); } catch (e) { err(`${c}: bcp47 "${L.bcp47}" is not a valid locale`); }
  for (const k of usedKeys.aria) if (!(L.strings.aria || {})[k]) err(`${c}/strings.js: aria.${k} missing (used by abc.html)`);
  for (const k of usedKeys.text) if (L.strings[k] == null) err(`${c}/strings.js: ${k} missing (used by abc.html)`);
  const ck = new Set(keysOf(L.strings));
  for (const k of keysOf(ABC.langs[base].strings)) if (!ck.has(k)) err(`${c}/strings.js: missing "${k}" (would show ${base} text)`);
  for (const s of CFG.sections) if (!(L.strings.sections || {})[s.id]) err(`${c}/strings.js: sections.${s.id} missing`);
  for (const p of P) if (!(L.strings.profile || {})[p]) err(`${c}/strings.js: profile.${p} missing`);
}

console.log(`concepts: ${ABC.concepts.length}`);
const used = new Set();
const SRC = /^https:\/\/(commons\.wikimedia\.org|dexonline\.ro|(ro|en|de)\.wiktionary\.org)\/\S+$/, PRON = ['ipa', 'stress', 'src', 'of', 'ipaSrc', 'tts', 'voice'];
const checkPron = (where, p, syl) => {
  if (!p) return err(`${where}: no pron ({ stress, src } from dexonline / wiktionary)`);
  for (const k of Object.keys(p)) if (!PRON.includes(k)) err(`${where}: pron.${k} is not a PRON field`);
  if (!Number.isInteger(p.stress) || p.stress < 0 || p.stress >= syl) err(`${where}: pron.stress ${p.stress} outside its ${syl} syllable(s)`);
  for (const k of ['src', 'ipaSrc']) if (k in p && !SRC.test(p[k])) err(`${where}: pron.${k} "${p[k]}" is not a source URL`);
  if (!p.src) err(`${where}: pron without src`);
  if (p.tts && !p.voice) err(`${where}: pron.tts without the voice it was heard wrong on`);
};
for (const x of ABC.concepts) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(x.id)) err(`concept "${x.id}": id must be an ASCII slug`);
  if (!/\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u.test(x.pic)) warn(`concept "${x.id}": picture "${x.pic}" is not an emoji`);
}
const inGroup = new Map();
for (const [g, ms] of Object.entries(ABC.groups)) {
  if (!ABC.conceptById[g]) err(`group "${g}": not a concept (add it to abc/concepts.js)`);
  for (const m of ms) { if (!ABC.conceptById[m]) err(`group ${g}: unknown concept "${m}"`); if (inGroup.has(m)) err(`concept "${m}" is in two groups (${inGroup.get(m)}, ${g})`); inGroup.set(m, g); }
}
for (const c of langs) {
  const L = ABC.langs[c]; if (!L) continue;
  const seenW = new Map();
  for (const e of L.words.flatMap(e => [e, ...(e.syn || []).map(s => Object.assign({ id: e.id }, s))])) {
    used.add(e.id);
    if (!ABC.conceptById[e.id]) { err(`${c}/words.js: unknown concept "${e.id}" (add it to abc/concepts.js)`); continue; }
    const w = (e.w || '').split('/').join('');
    if (!w.trim()) err(`${c}/words.js ${e.id}: empty word`);
    for (const [k, v] of Object.entries(e)) if (typeof v === 'string' && v !== v.normalize('NFC')) err(`${c}/words.js ${e.id}.${k}: not NFC-normalized`);
    if (L.checkWord) { const m = L.checkWord(e); if (m) err(`${c}/words.js ${e.id}: ${m}`); }
    checkPron(`${c}/words.js ${e.id} "${w}"`, e.pron, (e.w || '').split(/[/ ]/).filter(Boolean).length);
    try { L.forms(e, w); } catch (x) { err(`${c}/words.js ${e.id}: forms → ${x.message}`); }
    if (L.checkForms) { const m = L.checkForms(e); if (m) warn(`${c}/words.js ${e.id}: ${m}`); }
    const key = w.toLocaleLowerCase(L.bcp47);
    if (seenW.has(key) && !(e.homonym && e.homonym === seenW.get(key))) err(`${c}/words.js: "${w}" is used for two concepts (${seenW.get(key)}, ${e.id}) — add a note or pick another word`);
    seenW.set(key, e.id);
  }
  const forms = new Set(L.words.flatMap(e => [e, ...(e.syn || [])]).flatMap(e => [e.w.split('/').join(''), e.def, e.pl, e.plDef]).filter(Boolean).map(t => t.toLocaleLowerCase(L.bcp47)));
  for (const [uri, v] of Object.entries(L.fixes || {})) {
    if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d[+-]\d\d:\d\d$/.test(v.tested || '')) err(`${c}/grammar.js fixes["${uri}"]: needs tested (the tts.html export time)`);
    for (const [w, t] of Object.entries(Object.assign({}, v.derived, v.words))) {
      if (!forms.has(w.toLocaleLowerCase(L.bcp47))) err(`${c}/grammar.js fixes["${uri}"].${w}: not a form of any word`);
      if (typeof t !== 'string' || !t.trim()) err(`${c}/grammar.js fixes["${uri}"].${w}: needs a respelling or /ipa/`);
    }
  }
  for (const u of L.letters.split(' ')) {
    const n = (L.names || {})[u];
    if (!n || !SRC.test(n.src || '') || !(n.say || n.name || n.ipa)) err(`${c}/grammar.js names.${u}: needs say, name or ipa and a source URL`);
  }
  for (const u of Object.keys(L.names || {})) if (!L.letters.split(' ').includes(u)) err(`${c}/grammar.js names.${u}: not a letter`);
  for (const id of Object.keys(L.info || {})) {
    const I = L.info[id];
    if (!ABC.conceptById[id]) err(`${c}/info.js: card "${id}" has no concept`);
    if (!I.title || !Array.isArray(I.lines) || !I.lines.length || I.lines.some(l => !Array.isArray(l) || l.length !== 2)) err(`${c}/info.js ${id}: needs title + lines [[emoji, sentence], …]`);
    const b = ABC.langs[base].info[id]; if (b && b.lines.length !== I.lines.length) warn(`${c}/info.js ${id}: ${I.lines.length} lines, ${base} has ${b.lines.length}`);
  }
  const missing = ABC.concepts.filter(x => !L.words.some(e => e.id === x.id)).length;
  if (missing) warn(`${c}: ${missing}/${ABC.concepts.length} concepts have no word in this language`);
}
for (const x of ABC.concepts) if (!used.has(x.id)) warn(`concept "${x.id}" is used by no language`);

console.log(`modules: ${CFG.modules.join(', ')}`);
const tileIds = new Map();
for (const m of Tiles.modules()) {
  for (const t of m.tiles || []) {
    if (tileIds.has(t.id)) err(`tile "${t.id}" defined in modules ${tileIds.get(t.id)} and ${m.id}`); tileIds.set(t.id, m.id);
    if (!CFG.sections.some(s => s.id === (t.section || m.section))) err(`tile ${t.id}: unknown section`);
    if (t.view && !ABC.views[t.view]) err(`tile ${t.id}: unknown view "${t.view}"`);
    if (t.game && !ABC.games[t.game.type]) err(`tile ${t.id}: unknown game type "${t.game.type}"`);
    if (!(t.ages || m.ages)) err(`tile ${t.id}: no ages (on the tile or its module)`);
  }
}
for (const c of langs) {
  const S = Tiles.content(c);
  ABC.errors.splice(0).forEach(err);
  for (const m of Tiles.modules()) {
    const s = m.strings[c];
    if (!s) { warn(`module ${m.id}: no strings for ${c} → hidden in ${c}`); continue; }
    if (m.check) m.check(c, S[m.id], s, msg => err(`module ${m.id}/${c}: ${msg}`));
    const mine = new Set(keysOf(s)), miss = keysOf(m.strings[CFG.baseLanguage]).filter(k => !mine.has(k));
    if (miss.length) err(`module ${m.id}/${c}: ${miss.join(', ')} missing (the base language has them)`);
  }
  for (const t of Tiles.list()) {
    const s = t.module.strings[c]; if (!s) continue;
    const lab = s.tiles && s.tiles[t.id], items = Tiles.items(t, c);
    if (t.view && !items.length) { if (lab) warn(`${c}: tile ${t.id} has a label but no items → hidden`); continue; }
    if (!Array.isArray(lab) || lab.length !== 2) { if (t.view) err(`module ${t.module.id}/${c}: tiles.${t.id} must be [learn label, game label]`); else warn(`module ${t.module.id}/${c}: tiles.${t.id} missing → hidden`); continue; }
    if (!t.perLanguage) {
      const ids = it => [it.id, ...(it.members || []).map(m => it.id + '>' + m.id)], mine = new Set(items.flatMap(ids));
      const gone = [...new Set(langs.flatMap(l => Tiles.items(t, l).flatMap(ids)))].filter(id => !mine.has(id));
      if (gone.length) err(`${c}: tile ${t.id} is incomplete — missing ${gone.join(', ')} (another language has them)`);
    }
    for (const it of items) for (const r of it.related || []) if (!ABC.conceptById[r]) err(`module ${t.module.id}/${c}: tile ${t.id} item "${it.id}" relates to "${r}", which is not a concept`);
    for (const it of [...items, ...(t.game ? Tiles.gameItems(t, c) : [])].flatMap(it => [it, ...(it.members || [])])) if (!CONTENT.made(it)) err(`module ${t.module.id}/${c}: tile ${t.id} item "${it.id}" is not built by CONTENT (thing/word/glyph/picture/group)`);
    if (!t.game) continue;
    if (!Tiles.gameOk(t, c)) { err(`${c}: game ${t.id} has too few playable items (needs ≥ ${ABC.games[t.game.type].needs || 2} at every level)`); continue; }
    const asks = new Set(Tiles.gameItems(t, c).flatMap(it => [false, true].map(lower => Tiles.ask(t, it, { lower }))));
    const spoken = v => typeof v === 'string' || (!!v && typeof v.other === 'string');
    for (const k of asks) if (!spoken(k.split('.').reduce((o, x) => o && o[x], s.games || {}))) err(`module ${t.module.id}/${c}: games.${k} (spoken question) missing`);
  }
}
console.log('engine');
const lit = new Set([...CFG.languages, ...Object.keys(CFG.profiles), ...CFG.modules, ...CFG.sections.map(s => s.id), ...tileIds.keys(), ...ABC.concepts.map(x => x.id)]);
const engine = new Set([...Object.keys(ABC.views), ...Object.keys(ABC.games), ...Object.keys(CFG.icons), 'view', 'hub', 'sine', 'square', 'triangle', 'sawtooth', 'hand', 'obj']);
for (const f of ['sw.js', ...ls('abc/core', /\.js$/), ...VIEW_FILES, ...GAME_FILES]) {
  const src = read(f);
  for (const m of src.matchAll(/(['"`])([a-z][a-z0-9-]*)\1/g)) if (lit.has(m[2]) && !engine.has(m[2])) err(`${f}: names "${m[2]}" (a language, profile, module, section, tile or concept) — the engine must not`);
}
for (const f of [...scripts, 'sw.js', ...ls('tools', /\.js$/)].filter(f => f !== 'abc/manifest.js')) {
  const src = read(f).replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '""').replace(/\/(?![*/])(?:\\.|\[(?:\\.|[^\]])*\]|[^/\\\n])+\/[gimsuy]*/g, '/r/');
  for (const m of src.matchAll(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g)) err(`${f}: comment "${m[0].slice(0, 40)}" — no comments in code`);
}
for (const m of css.matchAll(/\/\*([\s\S]*?)\*\//g)) err(`abc.html CSS: comment "${m[1].trim().slice(0, 40)}"`);
for (const m of html.matchAll(/<!--([\s\S]*?)-->/g)) err(`abc.html: comment "${m[1].trim().slice(0, 40)}"`);
for (const m of markup.matchAll(/\s(aria-label|title|alt|placeholder|value)="([^"]+)"/g)) err(`abc.html: ${m[1]}="${m[2]}" is hard-coded text — set it from strings`);
console.log(errors ? `\n${errors} error(s), ${warnings} warning(s)` : `\nOK — ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
