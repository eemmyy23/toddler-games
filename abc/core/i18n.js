const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const I18N = {
  t(tpl, vars, locale) {
    if (tpl == null) return '';
    if (typeof tpl === 'function') return tpl(vars || {});
    if (typeof tpl === 'object' && !Array.isArray(tpl)) {
      const cat = new Intl.PluralRules(locale).select((vars && vars.n) || 0);
      tpl = tpl[cat] != null ? tpl[cat] : tpl.other;
    }
    return String(tpl).replace(/\{(\w+)\}/g, (m, k) => vars && vars[k] != null ? vars[k] : m);
  },
  graphemes(s, locale) {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) return Array.from(new Intl.Segmenter(locale, { granularity: 'grapheme' }).segment(s), x => x.segment);
    return Array.from(s);
  },
  list(items, locale) { try { return new Intl.ListFormat(locale, { type: 'conjunction' }).format(items); } catch (e) { return items.join(', '); } },
  collator: locale => new Intl.Collator(locale),
  units(L) {
    return L.letters.split(/\s+/).filter(Boolean).map(tok => {
      const lower = tok.toLocaleLowerCase(L.bcp47), cased = lower !== tok;
      return { id: tok, upper: tok, lower, cased };
    });
  },
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
  upper(ch, unit, locale) { if (unit) return unit.cased ? unit.upper : ch; const u = ch.toLocaleUpperCase(locale); return u.length === ch.length ? u : ch; }
};
