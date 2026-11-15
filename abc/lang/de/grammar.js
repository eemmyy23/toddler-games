// ====== DEUTSCH — Meta, Buchstaben und Grammatik ======
LANG('de', {
  name: 'Deutsch', flag: '🇩🇪', bcp47: 'de-DE', dir: 'ltr',
  letters: 'A Ä B C D E F G H I J K L M N O Ö P Q R S ß T U Ü V W X Y Z',
  numbers: ['eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn'],
  keepCase: true, // Nomen behalten den Großbuchstaben (Kuh, Haus)
  sayLetter: (c, w, inside) => `${c} wie ${w}!`,
  // Eintrag → { sg: [eine Kuh, die Kuh], pl: [zwei Kühe, die Kühe] }
  //   w: Silben "Kuh" · g: m|f|n · pl: Plural · mass: kein Plural (Milch)
  forms(e, w) {
    if (!e.g) return null;
    const art = { m: 'der', f: 'die', n: 'das' }[e.g];
    if (e.mass || !e.pl) return { sg: [w, `${art} ${w}`], pl: null };
    return { sg: [`${e.g === 'f' ? 'eine' : 'ein'} ${w}`, `${art} ${w}`], pl: [`zwei ${e.pl}`, `die ${e.pl}`] };
  }
});
