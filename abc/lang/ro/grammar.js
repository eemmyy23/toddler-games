LANG('ro', {
  name: 'Română', flag: '🇷🇴', bcp47: 'ro-RO', dir: 'ltr',
  voices: /ioana|female/i,
  ssml: /^moz-tts:android:ro_RO$/,
  fixes: {
    'moz-tts:android:ro_RO': { tested: '2026-11-20T04:46:36+02:00', words: {
      hipopotam: '/hi.po.poˈtam/', hipopotamul: '/hi.po.poˈtamul/', hipopotami: 'hipopo tami', hipopotamii: 'hipopo tamii',
      meduză: '/meˈdu.zə/', ananasul: '/a.naˈnasul/', ananași: '/a.naˈnaʃʲ/', ananașii: 'ana nașii',
      ancoră: 'an-coră', ancorele: '/ˈan.ko.rele/'
    } },
    'Romanian Romania': { tested: '2026-11-20T04:49:52+02:00', words: { ancoră: '/ˈan.ko.rə/', ancorele: 'an-corele' } }
  },
  checkWord: e => Object.values(e).some(v => typeof v === 'string' && /[şţŞŢ]/.test(v)) ? 'ş/ţ cu sedilă — folosește ș/ț cu virgulă' : null,
  letters: 'A Ă Â B C D E F G H I Î J K L M N O P Q R S Ș T Ț U V W X Y Z',
  groups: 'ce ci che chi ge gi ghe ghi',
  alike: 'â=î',
  teens: ['unsprezece', 'doisprezece', 'treisprezece', 'paisprezece', 'cincisprezece', 'șaisprezece', 'șaptesprezece', 'optsprezece', 'nouăsprezece', 'douăzeci'],
  tens: ['zece', 'douăzeci', 'treizeci', 'patruzeci', 'cincizeci', 'șaizeci', 'șaptezeci', 'optzeci', 'nouăzeci', 'o sută'],
  numbers: ['unu', 'doi', 'trei', 'patru', 'cinci', 'șase', 'șapte', 'opt', 'nouă', 'zece'],
  names: {
    A: { say: 'a', src: 'https://dexonline.ro/definitie/a' },
    Ă: { say: 'ă', src: 'https://dexonline.ro/definitie/ă' },
    Â: { say: 'â', src: 'https://dexonline.ro/definitie/â' },
    B: { say: 'bî', src: 'https://dexonline.ro/definitie/b' },
    C: { say: 'cî', src: 'https://dexonline.ro/definitie/c' },
    D: { say: 'dî', src: 'https://dexonline.ro/definitie/d' },
    E: { say: 'e', src: 'https://dexonline.ro/definitie/e' },
    F: { say: 'fî', src: 'https://dexonline.ro/definitie/f' },
    G: { say: 'gî', src: 'https://dexonline.ro/definitie/g' },
    H: { say: 'hî', src: 'https://dexonline.ro/definitie/h' },
    I: { say: 'i', src: 'https://dexonline.ro/definitie/i' },
    Î: { say: 'î', src: 'https://dexonline.ro/definitie/î' },
    J: { say: 'jî', src: 'https://dexonline.ro/definitie/j' },
    K: { say: 'ca', src: 'https://dexonline.ro/definitie/k' },
    L: { say: 'lî', src: 'https://dexonline.ro/definitie/l' },
    M: { say: 'mî', src: 'https://dexonline.ro/definitie/m' },
    N: { say: 'nî', src: 'https://dexonline.ro/definitie/n' },
    O: { say: 'o', src: 'https://dexonline.ro/definitie/o' },
    P: { say: 'pî', src: 'https://dexonline.ro/definitie/p' },
    Q: { say: 'chiu', src: 'https://dexonline.ro/definitie/q' },
    R: { say: 'rî', src: 'https://dexonline.ro/definitie/r' },
    S: { say: 'sî', src: 'https://dexonline.ro/definitie/s' },
    Ș: { say: 'șî', src: 'https://dexonline.ro/definitie/ș' },
    T: { say: 'tî', src: 'https://dexonline.ro/definitie/t' },
    Ț: { say: 'țî', src: 'https://dexonline.ro/definitie/ț' },
    U: { say: 'u', src: 'https://dexonline.ro/definitie/u' },
    V: { say: 'vî', src: 'https://dexonline.ro/definitie/v' },
    W: { say: 'dublu vî', src: 'https://dexonline.ro/definitie/w' },
    X: { say: 'ics', src: 'https://dexonline.ro/definitie/x' },
    Y: { say: 'igrec', src: 'https://dexonline.ro/definitie/y' },
    Z: { say: 'zî', src: 'https://dexonline.ro/definitie/z' }
  },
  sayLetter: (c, w, inside) => inside ? `${c}, ca în ${w}!` : `${c}, de la ${w}!`,
  forms(e, w) {
    if (e.plOnly) return { sg: null, pl: [`niște ${w}`, e.plDef] };
    if (!e.def) return null;
    const sg = [e.mass ? w : `${e.g === 'f' ? 'o' : 'un'} ${w}`, e.def];
    return { sg, pl: e.pl ? [`${e.g === 'm' ? 'doi' : 'două'} ${e.pl}`, e.plDef] : null };
  },
  checkForms(e) { if (!e.pl || e.pl === e.w.replace(/\//g, '')) return null; const [h, ...rest] = e.pl.split(' '), want = [h + (e.g === 'm' ? 'i' : 'le'), ...rest].join(' '); return e.plDef !== want ? `plDef "${e.plDef}" ≠ regula (${want})` : null; }
});
