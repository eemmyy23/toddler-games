// ====== ROMÂNĂ — meta, litere și gramatică ======
LANG('ro', {
  name: 'Română', flag: '🇷🇴', bcp47: 'ro-RO', dir: 'ltr',
  letters: 'A Ă Â B C D E F G H I Î J K L M N O P Q R S Ș T Ț U V W X Y Z',
  groups: 'ce ci che chi ge gi ghe ghi',           // grupuri de litere (cuvintele lor nu apar la C / G)
  numbers: ['unu', 'doi', 'trei', 'patru', 'cinci', 'șase', 'șapte', 'opt', 'nouă', 'zece'],
  // literele se citesc ca sunete de școală (DOOM: bî, cî, dî …); vocalele ca atare; k/q/w/x/y cu numele lor
  spell: c => ({ A: 'a', Ă: 'ă', Â: 'â', E: 'e', I: 'i', Î: 'î', O: 'o', U: 'u', K: 'ca', Q: 'chiu', W: 'dublu ve', X: 'ics', Y: 'i grec' })[c]
             || c.toLocaleLowerCase('ro') + 'î',
  sayLetter: (c, w, inside) => inside ? `${c}, ca în ${w}!` : `${c}, de la ${w}!`,
  // intrare → { sg: [o vacă, vaca], pl: [două vaci, vacile] }
  //   w: silabe "va/că" · g: m|f|n · def: articulat · pl: plural · plDef: plural articulat
  //   mass: fără articol și fără plural (lapte) · plOnly: doar plural (ochelari)
  //   Toate formele afișate sunt scrise explicit; tools/check.js compară plDef cu regula de școală (doi → -i, două → -le).
  forms(e, w) {
    if (e.plOnly) return { sg: null, pl: [`niște ${w}`, e.plDef] };
    if (!e.def) return null;
    const sg = [e.mass ? w : `${e.g === 'f' ? 'o' : 'un'} ${w}`, e.def];
    return { sg, pl: e.pl ? [`${e.g === 'm' ? 'doi' : 'două'} ${e.pl}`, e.plDef] : null };
  },
  // regula de școală, folosită doar ca verificare
  checkForms(e) { return e.pl && e.plDef !== e.pl + (e.g === 'm' ? 'i' : 'le') ? `plDef "${e.plDef}" ≠ regula (${e.pl + (e.g === 'm' ? 'i' : 'le')})` : null; }
});
