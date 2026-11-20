const PRON = {
  KINDS: ['ipa', 'dash', 'gap', 'dbl'],
  IPA: /^[/[].*[/\]]$|[ˈˌəɨʃʒʧʤʦɡʲːθðŋɲ]/,
  bare: t => t.replace(/^[/[]|[/\]]$/g, ''),
  ssml: (ph, form) => `<speak><phoneme alphabet="ipa" ph="${esc(PRON.bare(ph))}">${esc(form)}</phoneme></speak>`,
  g2p(t, code) { const G = ABC.langs[code].g2p; return G ? G.reduce((x, [re, to]) => x.replace(re, to), t) : null; },
  formIpa(ph0, base, form, code) {
    const ph = ph0.replace(/t͡ʃ/g, 'ʧ').replace(/d͡ʒ/g, 'ʤ').replace(/t͡s/g, 'ʦ');
    const lo = t => t.toLocaleLowerCase(), b = lo(base), f = lo(form);
    let p = 0; while (p < b.length && b[p] === f[p]) p++;
    if (p > 0) p--;
    while (p > 0 && /[cgh]/.test(b[p - 1])) p--;
    const from = this.g2p(b.slice(p), code), to = this.g2p(f.slice(p), code);
    if (from == null || to == null) return null;
    let i = ph.length, j = from.length;
    while (j > 0 && i > 0) { i--; if (ph[i] === '.') continue; if (ph[i] !== from[j - 1]) return null; j--; }
    return j ? null : ph.slice(0, from.length ? i : ph.length) + to;
  },
  CONS: /^[^aăâeiîouyäöüáéíóú]$/i,
  rowsOf(e, code) {
    const parts = e.w.split(/([/ ])/), syl = parts.map((p, i) => i).filter(i => !/^[/ ]$/.test(parts[i]));
    const at = e.pron ? syl[e.pron.stress] : -1, join = ps => ps.filter(p => p !== '/').join('');
    const base = join(parts), cuts = [], low = t => t.toLocaleLowerCase(ABC.langs[code].bcp47);
    const head = { form: base, of: base, bold: parts.map((p, i) => i === at && syl.length > 1 ? `<b>${esc(p)}</b>` : esc(p)).filter(p => p !== '/').join('') };
    const ph = e.pron && e.pron.ipa && !e.pron.of ? this.bare(e.pron.ipa) : null;
    if (ph) { head.ph = ph; head.ipa = this.ssml(ph, base); }
    if (at >= 0 && syl.length > 1) {
      const sep = at === syl[syl.length - 1] ? at - 1 : at + 1;
      if (parts[sep] === '/') cuts.push(['dash', join(parts.slice(0, sep)).length, '-'], ['gap', join(parts.slice(0, sep)).length, ' ']);
      const s = parts[at], nx = parts[at + 2], whole = parts[at - 1] !== '/' && parts[at + 1] !== '/';
      if (!whole && this.CONS.test(s.slice(-1))) cuts.push(['dbl', join(parts.slice(0, at + 1)).length, s.slice(-1)]);
      else if (!whole && parts[at + 1] === '/' && nx && this.CONS.test(nx[0])) cuts.push(['dbl', join(parts.slice(0, at + 1)).length, nx[0]]);
    }
    return [...new Set([base, e.def, e.pl, e.plDef].filter(Boolean))].map((form, n) => {
      const r = n ? { form, of: base, bold: esc(form) } : head;
      if (n && ph) { const fp = this.formIpa(ph, base, form, code); if (fp) { r.ph = fp; r.ipa = this.ssml(fp, form); } }
      for (const [k, pos, ins] of cuts) if (pos < form.length && low(form.slice(0, pos)) === low(base.slice(0, pos))) r[k] = form.slice(0, pos) + ins + form.slice(pos);
      return r;
    });
  },
  entries: code => ABC.langs[code].words.flatMap(e => [Object.assign({ key: e.id }, e), ...(e.syn || []).map((s, i) => Object.assign({ id: e.id, key: `${e.id}~${i + 1}` }, s))]),
  rows(code) { return this.entries(code).flatMap(e => this.rowsOf(e, code).map(r => Object.assign({ e }, r))); },
  fixes: (code, voice) => store.get(SPEECH.fixKey(ABC.langs[code].bcp47, voice), {}),
  setFix(code, voice, form, fix) {
    const L = ABC.langs[code], k = SPEECH.fixKey(L.bcp47, voice), all = store.get(k, {}), w = form.toLocaleLowerCase(L.bcp47);
    if (fix) all[w] = fix; else delete all[w];
    store.set(k, all);
  }
};
