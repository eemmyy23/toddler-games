// Content checker — run after adding a language, word, colour, info card or topic:
//   node tools/check.js
// Loads the same files as abc.html (no browser needed) and reports anything missing or malformed.
// Exit code 1 on errors (warnings don't fail).
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'abc.html'), 'utf8');
const files = [...html.matchAll(/<script src="(abc\/[^"]+)"><\/script>/g)].map(m => m[1]).filter(f => !f.endsWith('app.js'));
const ctx = vm.createContext({ console });
for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8') + '\n;globalThis.ABC = ABC; globalThis.buildContent = typeof buildContent !== "undefined" ? buildContent : undefined;', ctx, { filename: f });
const ABC = ctx.ABC;
let errors = 0, warnings = 0;
const err = m => { console.log('  ERROR ' + m); errors++; };
const warn = m => { console.log('  warn  ' + m); warnings++; };
const langs = ABC.langOrder, base = ABC.langs[langs[0]];

console.log(`languages: ${langs.join(', ')}`);
for (const c of langs) {
  const L = ABC.langs[c];
  for (const k of ['name', 'flag', 'tts', 'alphabet', 'nums', 'sayLetter', 'showWord', 'forms', 'sections', 'topics', 'games', 'ui'])
    if (L[k] == null) err(`${c}: missing "${k}"`);
  if (L.nums && L.nums.length !== 10) err(`${c}: nums must have 10 entries`);
  for (const s of ABC.sections) if (!L.sections || !L.sections[s.id]) err(`${c}: sections.${s.id} missing`);
  for (const t of ABC.topics) {
    const lab = L.topics && L.topics[t.id];
    if (!Array.isArray(lab) || lab.length !== 2) err(`${c}: topics.${t.id} must be [learn label, game label]`);
  }
  for (const k of Object.keys(base.ui)) if (L.ui && L.ui[k] == null) err(`${c}: ui.${k} missing`);
}

console.log(`topics: ${ABC.topics.length}`);
for (const t of ABC.topics) {
  if (!ABC.sections.find(s => s.id === t.section)) err(`topic ${t.id}: unknown section "${t.section}"`);
  if (t.view && !['card', 'count', 'read'].includes(t.view)) err(`topic ${t.id}: unknown view "${t.view}"`);
  if (t.game && !['find', 'howmany'].includes(t.game.type)) err(`topic ${t.id}: unknown game type "${t.game.type}"`);
  if (t.view && !t.game) warn(`topic ${t.id}: has a learn screen but no game yet (Play shows it as "coming soon")`);
}

console.log(`words: ${ABC.words.length}`);
const pics = new Map();
ABC.words.forEach((row, i) => {
  if (!row.pic) err(`words[${i}]: missing pic`);
  if (pics.has(row.pic)) warn(`words[${i}] ${row.pic}: same picture as words[${pics.get(row.pic)}]`); else pics.set(row.pic, i);
  for (const c of langs) {
    let v = row[c]; if (!v) continue;
    if (v[0] === '!') v = v.slice(1);
    const [syl, ...f] = v.split('|'), w = syl.split('/').join('');
    if (!w.trim()) err(`words[${i}] ${row.pic} ${c}: empty word`);
    try { if (f.length) { const r = ABC.langs[c].forms(w, f); if (!r || (!r.sg && !r.pl)) err(`words[${i}] ${row.pic} ${c}: forms gave nothing`); } }
    catch (e) { err(`words[${i}] ${row.pic} ${c}: forms "${f.join('|')}" → ${e.message}`); }
  }
  for (const k of Object.keys(row)) if (k !== 'pic' && !ABC.langs[k]) err(`words[${i}] ${row.pic}: unknown language key "${k}"`);
});
for (const c of langs) { const n = ABC.words.filter(r => r[c]).length; if (n < ABC.words.length * 0.8) warn(`${c}: only ${n}/${ABC.words.length} words translated`); }

console.log(`colours: ${ABC.colors.length}, rainbow bands: ${(ABC.rainbow || []).length}`);
for (const row of [...ABC.colors, ...(ABC.rainbow || [])]) for (const c of langs) if (!row[c]) err(`colour ${row.id || row.hex}: missing ${c}`);

const concepts = new Set([...ABC.words.map(r => r.pic), ...ABC.colors.map(r => r.concept).filter(Boolean)]);
console.log(`info cards: ${Object.keys(ABC.info).length}`);
for (const [k, v] of Object.entries(ABC.info)) {
  if (!concepts.has(k)) err(`info ${k}: no word or colour has this concept, so the card can never be shown`);
  const n = (v[langs[0]] || { lines: [] }).lines.length;
  for (const c of langs) {
    if (!v[c]) { err(`info ${k}: missing ${c}`); continue; }
    if (!v[c].title || !Array.isArray(v[c].lines)) err(`info ${k} ${c}: needs title + lines`);
    else if (v[c].lines.length !== n) warn(`info ${k} ${c}: ${v[c].lines.length} lines, ${langs[0]} has ${n}`);
  }
}

if (ctx.buildContent) {
  console.log('built content per language');
  for (const c of langs) {
    const S = ctx.buildContent(c);
    for (const t of ABC.topics.filter(t => t.view)) {
      const list = t.items(S);
      if (t.game && list.length && !ABC.langs[c].games[t.id]) err(`${c}: games.${t.id} (spoken question) missing`);
    }
    const bare = S.letters.filter(l => !l.examples.length).map(l => l.id);
    if (bare.length) warn(`${c}: letters with no example word: ${bare.join(' ')}`);
  }
}

console.log(errors ? `\n${errors} error(s), ${warnings} warning(s)` : `\nOK — ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
