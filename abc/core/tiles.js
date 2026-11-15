const Tiles = {
  _content: {},
  modules: () => ABC.config.modules.map(id => ABC.modules.find(m => m.id === id)).filter(Boolean),
  list() {
    return this._list || (this._list = this.modules().flatMap(m => (m.tiles || []).map(t => Object.assign({ section: m.section, module: m }, t))));
  },
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
  learnOk(t, code) { return !!(t.view && ABC.views[t.view] && this.label(t, code, 0) && this.items(t, code).length); },
  gameOk(t, code) {
    const g = t.game && ABC.games[t.game.type];
    if (!g || !this.learnOk(t, code) || !this.label(t, code, 1)) return false;
    const items = this.gameItems(t, code), need = g.needs || 2;
    return g.pool(items, 0).length >= need && g.pool(items, 99).length >= need;
  },
  profiles: () => Object.keys(ABC.config.profiles),
  profileOf(t) {
    const start = (t.ages || t.module.ages || [0])[0], P = this.profiles();
    return P.find(p => start < ABC.config.profiles[p].ages[1]) || P[P.length - 1];
  },
  ageOk(t, profile) { const P = this.profiles(); return P.indexOf(profile) >= P.indexOf(this.profileOf(t)); }
};
