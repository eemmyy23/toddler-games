LANG('de', {
  name: 'Deutsch', flag: '🇩🇪', bcp47: 'de-DE', dir: 'ltr',
  voices: /anna|female/i,
  fold: s => s.replace(/ß/g, 'ss'),
  letters: 'A Ä B C D E F G H I J K L M N O Ö P Q R S ß T U Ü V W X Y Z',
  groups: 'sch ei au eu st pf',
  sayGroup: (g, w) => `${w}!`,
  numbers: ['eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn'],
  keepCase: true,
  sayLetter: (c, w, inside) => `${c} wie ${w}!`,
  forms(e, w) {
    if (e.plOnly) return { sg: null, pl: [w, `die ${w}`] };
    if (!e.g) return null;
    const art = { m: 'der', f: 'die', n: 'das' }[e.g];
    if (e.mass || !e.pl) return { sg: [w, `${art} ${w}`], pl: null };
    return { sg: [`${e.g === 'f' ? 'eine' : 'ein'} ${w}`, `${art} ${w}`], pl: [`zwei ${e.pl}`, `die ${e.pl}`] };
  }
});
