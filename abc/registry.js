// ====== REGISTRY — the single global the app is built from ======
// Load order (see abc.html): registry → lang/* → data/* → content → topics → app.
// Nothing in here knows about a specific language, subject or game.
var ABC = {
  langs: {},      // code → language definition (abc/lang/<code>.js)
  langOrder: [],  // flag order
  words: [],      // the shared dictionary (abc/data/words.js)
  colors: [],     // abc/data/colors.js
  info: {},       // "What is it?" cards, keyed by concept emoji (abc/data/info.js)
  sections: [],   // bottom tabs (abc/topics.js)
  topics: []      // subjects: where they live, which screen, which game (abc/topics.js)
};

// Register a language. See abc/lang/en.js for every field a language provides.
function LANG(code, def) {
  def.code = code;
  ABC.langs[code] = def;
  ABC.langOrder.push(code);
}

// Register a bottom tab. play: true → its hub is generated from the games of all other sections.
function SECTION(id, icon, opts) {
  ABC.sections.push(Object.assign({ id, icon }, opts || {}));
}

// Register a subject (a tile in a section hub).
//   section  which tab it lives in
//   icon     tile picture (emoji or short text)
//   view     'card' | 'count' | 'read'   (which screen shows it; omit → "coming soon")
//   items    S => list   (S = content built for the current language, see abc/content.js)
//   game     { type: 'find' | 'howmany', items?, prompts: ['glyph'|'word'|'voice'], lower? }
//            omit → its game is shown as "coming soon". Every topic gets exactly one Play tile.
//   index    true → the ⊞ index button is offered on its screen
// Labels come from the language file: lang.topics[id] = [learn label, game label],
// spoken game question from lang.games[id](item, { small }).
function TOPIC(id, def) {
  ABC.topics.push(Object.assign({ id }, def));
}
