// ====== ENGLISH — meta, letters and grammar ======
// Template for a new language: copy the folder abc/lang/en/, translate, add the code to abc/config.js,
// add abc/modules/<id>/lang/<code>.js for each module, run `node tools/check.js --fix`.
// Nothing in abc/core/, abc.html or sw.js changes. Fields: see LANG in abc/core/registry.js.
LANG('en', {
  name: 'English', flag: '🇬🇧', bcp47: 'en-GB', dir: 'ltr',
  voices: /samantha|karen|kate|serena|female/i,       // preferred device voices (names), when several exist
  // letters taught in this language, separated by spaces (multi-character letters allowed: "cs", "ll")
  letters: 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z',
  numbers: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
  // spoken line for a letter: (letter name, example word, inside = the letter is inside the word, not first)
  sayLetter: (c, w, inside) => inside ? `${c}, like in ${w}!` : `${c} is for ${w}!`,
  // word entry → { sg: [a cow, the cow] | null, pl: [two cows, the cows] | null } | null
  //   w: syllables "cow" · art: a|an · mass: no article (milk) · pl: plural "cows" · plOnly: glasses
  forms(e, w) {
    if (e.plOnly) return { sg: null, pl: [w, `the ${w}`] };
    if (!e.art && !e.mass && !e.pl) return null;
    return { sg: [e.mass ? w : `${e.art} ${w}`, `the ${w}`], pl: e.pl ? [`two ${e.pl}`, `the ${e.pl}`] : null };
  }
});
