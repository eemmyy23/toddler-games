var ABC = {
  config: null,
  langs: {},
  concepts: [],
  conceptById: {},
  art: {},
  modules: [],
  views: {},
  games: {},
  errors: []
};
const abcLang = code => ABC.langs[code] || (ABC.langs[code] = { code, strings: {}, words: [], info: {} });
const isPlain = x => !!x && typeof x === 'object' && !Array.isArray(x);
const abcMerge = (a, b) => { for (const k in b) a[k] = isPlain(b[k]) ? abcMerge(isPlain(a[k]) ? a[k] : {}, b[k]) : b[k]; return a; };

function CONFIG(c) { ABC.config = c; }
function LANG(code, def) { Object.assign(abcLang(code), def); }
function STRINGS(code, s) { abcMerge(abcLang(code).strings, s); }
function WORDS(code) {
  const L = abcLang(code), seen = new Set(L.words.map(x => x.id));
  return (id, e) => {
    if (seen.has(id)) ABC.errors.push(`${code}/words: "${id}" defined twice`);
    seen.add(id); L.words.push(Object.assign({ id }, e));
  };
}
function INFO(code) {
  const L = abcLang(code);
  return (id, card) => { if (L.info[id]) ABC.errors.push(`${code}/info: "${id}" defined twice`); L.info[id] = card; };
}
function C(id, pic, opts) {
  if (ABC.conceptById[id]) ABC.errors.push(`concepts: "${id}" defined twice`);
  const c = Object.assign({ id, pic, order: ABC.concepts.length }, opts);
  ABC.concepts.push(c); ABC.conceptById[id] = c;
}
function ART(id, svg) { if (ABC.art[id]) ABC.errors.push(`art: "${id}" defined twice`); ABC.art[id] = svg; }
function MODULE(id, def) { ABC.modules.push(Object.assign({ id, strings: {} }, def)); }
function MSTRINGS(id, code, s) {
  const m = ABC.modules.find(m => m.id === id);
  if (!m) { ABC.errors.push(`module strings for unknown module "${id}"`); return; }
  m.strings[code] = abcMerge(m.strings[code] || {}, s);
}
function VIEW(id, def) { ABC.views[id] = Object.assign({ id }, def); }
function GAME(id, def) { ABC.games[id] = Object.assign({ id }, def); }
