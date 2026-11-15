LANG('en', {
  name: 'English', flag: '🇬🇧', bcp47: 'en-GB', dir: 'ltr',
  voices: /samantha|karen|kate|serena|female/i,
  letters: 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z',
  numbers: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
  sayLetter: (c, w, inside) => inside ? `${c}, like in ${w}!` : `${c} is for ${w}!`,
  forms(e, w) {
    if (e.plOnly) return { sg: null, pl: [w, `the ${w}`] };
    if (!e.art && !e.mass && !e.pl) return null;
    return { sg: [e.mass ? w : `${e.art} ${w}`, `the ${w}`], pl: e.pl ? [`two ${e.pl}`, `the ${e.pl}`] : null };
  }
});
