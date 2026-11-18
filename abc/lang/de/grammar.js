LANG('de', {
  name: 'Deutsch', flag: '🇩🇪', bcp47: 'de-DE', dir: 'ltr',
  voices: /anna|female/i,
  fold: s => s.replace(/ß/g, 'ss').replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u'),
  letters: 'A Ä B C D E F G H I J K L M N O Ö P Q R S ß T U Ü V W X Y Z',
  names: {
    A: { ipa: 'aː', src: 'https://de.wiktionary.org/wiki/A' },
    Ä: { ipa: 'ɛː', src: 'https://de.wiktionary.org/wiki/Ä' },
    B: { ipa: 'beː', src: 'https://de.wiktionary.org/wiki/B' },
    C: { ipa: 't͡seː', src: 'https://de.wiktionary.org/wiki/C' },
    D: { ipa: 'deː', src: 'https://de.wiktionary.org/wiki/D' },
    E: { ipa: 'ʔeː', src: 'https://de.wiktionary.org/wiki/E' },
    F: { ipa: 'ɛf', src: 'https://de.wiktionary.org/wiki/F' },
    G: { ipa: 'ɡeː', src: 'https://de.wiktionary.org/wiki/G' },
    H: { ipa: 'haː', src: 'https://de.wiktionary.org/wiki/H' },
    I: { ipa: 'iː', src: 'https://de.wiktionary.org/wiki/I' },
    J: { ipa: 'jɔt', src: 'https://de.wiktionary.org/wiki/J' },
    K: { ipa: 'kaː', src: 'https://de.wiktionary.org/wiki/K' },
    L: { ipa: 'ɛl', src: 'https://de.wiktionary.org/wiki/L' },
    M: { ipa: 'ɛm', src: 'https://de.wiktionary.org/wiki/M' },
    N: { ipa: 'ɛn', src: 'https://de.wiktionary.org/wiki/N' },
    O: { ipa: 'oː', src: 'https://de.wiktionary.org/wiki/O' },
    Ö: { ipa: 'øː', src: 'https://de.wiktionary.org/wiki/Ö' },
    P: { ipa: 'peː', src: 'https://de.wiktionary.org/wiki/P' },
    Q: { ipa: 'kuː', src: 'https://de.wiktionary.org/wiki/Q' },
    R: { ipa: 'ɛʁ', src: 'https://de.wiktionary.org/wiki/R' },
    S: { ipa: 'ɛs', src: 'https://de.wiktionary.org/wiki/S' },
    ß: { ipa: 'ɛsˈt͡sɛt', src: 'https://de.wiktionary.org/wiki/ß' },
    T: { ipa: 'teː', src: 'https://de.wiktionary.org/wiki/T' },
    U: { ipa: 'uː', src: 'https://de.wiktionary.org/wiki/U' },
    Ü: { ipa: 'yː', src: 'https://de.wiktionary.org/wiki/Ü' },
    V: { ipa: 'faʊ̯', src: 'https://de.wiktionary.org/wiki/V' },
    W: { ipa: 'veː', src: 'https://de.wiktionary.org/wiki/W' },
    X: { ipa: 'ɪks', src: 'https://de.wiktionary.org/wiki/X' },
    Y: { ipa: 'ˈʏpsilɔn', src: 'https://de.wiktionary.org/wiki/Y' },
    Z: { ipa: 't͡sɛt', src: 'https://de.wiktionary.org/wiki/Z' }
  },
  groups: 'sch ei au eu st pf',
  sayGroup: (g, w) => `${w}!`,
  teens: ['elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig'],
  tens: ['zehn', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig', 'hundert'],
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
