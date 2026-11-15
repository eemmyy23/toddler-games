LANG('en', {
  name: 'English', flag: '🇬🇧', bcp47: 'en-GB', dir: 'ltr',
  voices: /samantha|karen|kate|serena|female/i,
  letters: 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z',
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
