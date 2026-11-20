LANG('en', {
  name: 'English', flag: '🇬🇧', bcp47: 'en-GB', dir: 'ltr',
  voices: /samantha|karen|kate|serena|female/i,
  piper: 'en_GB-alba-medium',
  letters: 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z',
  names: {
    A: { name: 'a', src: 'https://en.wiktionary.org/wiki/A' },
    B: { name: 'bee', src: 'https://en.wiktionary.org/wiki/B' },
    C: { name: 'cee', src: 'https://en.wiktionary.org/wiki/C' },
    D: { name: 'dee', src: 'https://en.wiktionary.org/wiki/D' },
    E: { name: 'e', src: 'https://en.wiktionary.org/wiki/E' },
    F: { name: 'ef', src: 'https://en.wiktionary.org/wiki/F' },
    G: { name: 'gee', src: 'https://en.wiktionary.org/wiki/G' },
    H: { name: 'aitch', src: 'https://en.wiktionary.org/wiki/H' },
    I: { name: 'i', src: 'https://en.wiktionary.org/wiki/I' },
    J: { name: 'jay', src: 'https://en.wiktionary.org/wiki/J' },
    K: { name: 'kay', src: 'https://en.wiktionary.org/wiki/K' },
    L: { name: 'el', src: 'https://en.wiktionary.org/wiki/L' },
    M: { name: 'em', src: 'https://en.wiktionary.org/wiki/M' },
    N: { name: 'en', src: 'https://en.wiktionary.org/wiki/N' },
    O: { name: 'o', src: 'https://en.wiktionary.org/wiki/O' },
    P: { name: 'pee', src: 'https://en.wiktionary.org/wiki/P' },
    Q: { name: 'cue', src: 'https://en.wiktionary.org/wiki/Q' },
    R: { name: 'ar', src: 'https://en.wiktionary.org/wiki/R' },
    S: { name: 'ess', src: 'https://en.wiktionary.org/wiki/S' },
    T: { name: 'tee', src: 'https://en.wiktionary.org/wiki/T' },
    U: { name: 'u', src: 'https://en.wiktionary.org/wiki/U' },
    V: { name: 'vee', src: 'https://en.wiktionary.org/wiki/V' },
    W: { name: 'double U', src: 'https://en.wiktionary.org/wiki/W' },
    X: { name: 'ex', src: 'https://en.wiktionary.org/wiki/X' },
    Y: { name: 'wye', src: 'https://en.wiktionary.org/wiki/Y' },
    Z: { name: 'zed', src: 'https://en.wiktionary.org/wiki/Z' }
  },
  groups: 'sh ch wh ph',
  sayGroup: (g, w) => `${w}!`,
  teens: ['eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'],
  tens: ['ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'one hundred'],
  numbers: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
  sayLetter: (c, w, inside) => inside ? `${c}, like in ${w}!` : `${c} is for ${w}!`,
  forms(e, w) {
    if (e.plOnly) return { sg: null, pl: [w, `the ${w}`] };
    if (!e.art && !e.mass && !e.pl) return null;
    return { sg: [e.mass ? w : `${e.art} ${w}`, `the ${w}`], pl: e.pl ? [`two ${e.pl}`, `the ${e.pl}`] : null };
  }
});
