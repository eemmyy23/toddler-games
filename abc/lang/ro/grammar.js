LANG('ro', {
  name: 'Română', flag: '🇷🇴', bcp47: 'ro-RO', dir: 'ltr',
  voices: /ioana|female/i,
  checkWord: e => Object.values(e).some(v => typeof v === 'string' && /[şţŞŢ]/.test(v)) ? 'ş/ţ cu sedilă — folosește ș/ț cu virgulă' : null,
  letters: 'A Ă Â B C D E F G H I Î J K L M N O P Q R S Ș T Ț U V W X Y Z',
  groups: 'ce ci che chi ge gi ghe ghi',
  alike: 'â=î',
  teens: ['unsprezece', 'doisprezece', 'treisprezece', 'paisprezece', 'cincisprezece', 'șaisprezece', 'șaptesprezece', 'optsprezece', 'nouăsprezece', 'douăzeci'],
  tens: ['zece', 'douăzeci', 'treizeci', 'patruzeci', 'cincizeci', 'șaizeci', 'șaptezeci', 'optzeci', 'nouăzeci', 'o sută'],
  numbers: ['unu', 'doi', 'trei', 'patru', 'cinci', 'șase', 'șapte', 'opt', 'nouă', 'zece'],
  spell: c => ({ A: 'a', Ă: 'ă', Â: 'â', E: 'e', I: 'i', Î: 'î', O: 'o', U: 'u', K: 'ca', Q: 'chiu', W: 'dublu ve', X: 'ics', Y: 'i grec' })[c]
             || c.toLocaleLowerCase('ro') + 'î',
  sayLetter: (c, w, inside) => inside ? `${c}, ca în ${w}!` : `${c}, de la ${w}!`,
  forms(e, w) {
    if (e.plOnly) return { sg: null, pl: [`niște ${w}`, e.plDef] };
    if (!e.def) return null;
    const sg = [e.mass ? w : `${e.g === 'f' ? 'o' : 'un'} ${w}`, e.def];
    return { sg, pl: e.pl ? [`${e.g === 'm' ? 'doi' : 'două'} ${e.pl}`, e.plDef] : null };
  },
  checkForms(e) { if (!e.pl || e.pl === e.w.replace(/\//g, '')) return null; const [h, ...rest] = e.pl.split(' '), want = [h + (e.g === 'm' ? 'i' : 'le'), ...rest].join(' '); return e.plDef !== want ? `plDef "${e.plDef}" ≠ regula (${want})` : null; }
});
