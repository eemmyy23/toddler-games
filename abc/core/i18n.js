// ====== I18N HELPERS — Intl-based, no per-language code here ======
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const I18N = {
  // template: "text {var}" | { one, few, many, other } (needs vars.n) | function(vars)
  t(tpl, vars, locale) {
    if (tpl == null) return '';
    if (typeof tpl === 'function') return tpl(vars || {});
    if (typeof tpl === 'object' && !Array.isArray(tpl)) {
      const cat = new Intl.PluralRules(locale).select((vars && vars.n) || 0);
      tpl = tpl[cat] != null ? tpl[cat] : tpl.other;
    }
    return String(tpl).replace(/\{(\w+)\}/g, (m, k) => vars && vars[k] != null ? vars[k] : m);
  },
  // user-perceived characters (emoji with skin/ZWJ, Devanagari clusters …)
  graphemes(s, locale) {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) return Array.from(new Intl.Segmenter(locale, { granularity: 'grapheme' }).segment(s), x => x.segment);
    return Array.from(s);
  },
  list(items, locale) { try { return new Intl.ListFormat(locale, { type: 'conjunction' }).format(items); } catch (e) { return items.join(', '); } },
  collator: locale => new Intl.Collator(locale),
  // letters of a language → units { id, upper, lower, cased }. Multi-character letters ("cs", "ll") allowed.
  units(L) {
    return L.letters.split(/\s+/).filter(Boolean).map(tok => {
      const lower = tok.toLocaleLowerCase(L.bcp47), cased = lower !== tok;
      return { id: tok, upper: tok, lower, cased };
    });
  },
  // split a word into the language's letter units (longest match first), else graphemes
  splitUnits(word, units, locale) {
    const out = [], low = word.toLocaleLowerCase(locale), byLen = units.slice().sort((a, b) => b.lower.length - a.lower.length);
    const g = I18N.graphemes(word, locale);
    let pos = 0, gi = 0;
    while (pos < word.length) {
      const u = byLen.find(u => u.lower.length > 1 && low.startsWith(u.lower, pos));
      if (u) { out.push({ text: word.slice(pos, pos + u.lower.length), unit: u }); pos += u.lower.length; while (gi < g.length && g.slice(0, gi).join('').length < pos) gi++; continue; }
      const ch = g[gi] || word[pos]; gi++;
      const cl = ch.toLocaleLowerCase(locale);
      out.push({ text: ch, unit: units.find(u => u.lower === cl) || null });
      pos += ch.length;
    }
    return out;
  },
  // upper-case form of one unit/grapheme without changing its length (ß stays ß, not SS)
  upper(ch, unit, locale) { if (unit) return unit.cased ? unit.upper : ch; const u = ch.toLocaleUpperCase(locale); return u.length === ch.length ? u : ch; }
};
