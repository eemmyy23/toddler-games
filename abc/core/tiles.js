// ====== TILES — the one rule set for "what a tile shows and when", shared by the app and tools/check.js (no DOM) ======
// A tile belongs to a module: { id, icon, view?, items?, game?, index?, search?, section?, ages? } (see ARCHITECTURE.md).
// Content: each module builds its own namespace per language — S[moduleId] — so modules never overwrite each other.
const Tiles = {
  _content: {},
  modules: () => ABC.config.modules.map(id => ABC.modules.find(m => m.id === id)).filter(Boolean),
  list() {
    return this._list || (this._list = this.modules().flatMap(m => (m.tiles || []).map(t => Object.assign({ section: m.section, module: m }, t))));
  },
  // module content for one language; a module that throws is reported and simply has no items (its tiles hide)
  content(code) {
    if (this._content[code]) return this._content[code];
    const S = {};
    for (const m of this.modules()) {
      S[m.id] = {};
      if (!m.build || !m.strings[code]) continue;
      try { S[m.id] = m.build(code) || {}; } catch (e) { ABC.errors.push(`module ${m.id}/${code}: build failed — ${e.message}`); }
    }
    return (this._content[code] = S);
  },
  label: (t, code, i) => { const s = t.module.strings[code]; return s && s.tiles && s.tiles[t.id] ? s.tiles[t.id][i] : null; },
  items(t, code) { return t.items ? t.items(this.content(code)[t.module.id]) || [] : []; },
  gameItems(t, code) {
    if (!t.game) return [];
    return ((t.game.items || t.items)(this.content(code)[t.module.id]) || []).filter(it => !it.noPlay);
  },
  // a tile is never shown broken: its text in this language and enough items (a game: at its first AND its hardest round)
  learnOk(t, code) { return !!(t.view && ABC.views[t.view] && this.label(t, code, 0) && this.items(t, code).length); },
  gameOk(t, code) {
    const g = t.game && ABC.games[t.game.type];
    if (!g || !this.learnOk(t, code) || !this.label(t, code, 1)) return false;
    const items = this.gameItems(t, code), need = g.needs || 2;
    return g.pool(items, 0).length >= need && g.pool(items, 99).length >= need;
  },
  // ages: a tile's ages (or its module's) — its profile is the one its start age falls in (start < upper: 4 → explorer).
  // The badge shows that profile and the tile is listed from that profile upwards (higher profiles add, never remove).
  profiles: () => Object.keys(ABC.config.profiles),
  profileOf(t) {
    const start = (t.ages || t.module.ages || [0])[0], P = this.profiles();
    return P.find(p => start < ABC.config.profiles[p].ages[1]) || P[P.length - 1];
  },
  ageOk(t, profile) { const P = this.profiles(); return P.indexOf(profile) >= P.indexOf(this.profileOf(t)); }
};
