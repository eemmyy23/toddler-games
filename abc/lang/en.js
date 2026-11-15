// ====== ENGLISH ======
// Template for a new language: copy this file, translate, add it to abc.html and sw.js,
// add the language key to the rows of abc/data/*.js, then run `node tools/check.js`.
LANG('en', {
  name: 'English', flag: '🇬🇧', tts: 'en-US',
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  nums: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],

  // ---- grammar ----
  // spoken line for a letter: (letter name, example word, like = letter is inside the word)
  sayLetter: (c, w, like) => like ? `${c}, like in ${w}!` : `${c} is for ${w}!`,
  showWord: (w, like) => like ? `like in ${w}` : w,
  // dictionary forms → { sg: [indefinite, definite] | null, pl: [two …, definite plural] | null }
  forms: (w, f) => f[0] === 'pl' ? { sg: null, pl: [w, `the ${w}`] } : {
    sg: [f[0] === '-' ? w : `${f[0]} ${w}`, `the ${w}`],
    pl: f[1] === '-' ? null : [f[1], `the ${f[1].replace(/^two /, '')}`] },

  // ---- navigation labels ----
  sections: { num: 'Numbers', abc: 'Letters', disc: 'Discover', play: 'Play' },
  // topic id → [learn tile, game tile]
  topics: {
    digits: ['Digits', 'Find the number'], count: ['Count', 'How many?'], teens: ['11 – 20', 'Find 11 – 20'],
    tens: ['Tens', 'Find the tens'], big: ['Big numbers', 'Big numbers'], clock: ['The clock', 'What time is it?'],
    letters: ['Alphabet', 'Find the letter'], read: ['Read', 'Find the word'], groups: ['Letter groups', 'Find the group'],
    colors: ['Colours', 'Find the colour'], families: ['Animal families', 'Where is the baby?'],
    seasons: ['Seasons', 'Which season?'], weather: ['Weather', 'What is the weather?'], cats: ['Categories', 'Sort it']
  },
  // spoken question of each game: (target item, { small })
  games: {
    digits: it => `Find the number ${it.name}!`,
    count: () => 'How many?',
    letters: (it, o) => `Find the ${o.small ? 'small ' : ''}letter ${it.name}!`,
    groups: it => `Find the letter ${it.name}!`,
    read: it => it.the ? `Where is ${it.the}?` : `Find: ${it.name}!`,
    colors: it => `Where is ${it.name}?`
  },

  // ---- other UI text ----
  ui: {
    find: 'Find', soon: 'soon', info: 'What is it?',
    sgpl: ['Singular', 'Plural'], none: ['no singular', 'no plural'],
    thats: n => `That's ${n}.`,
    cheers: ['Yay!', 'Great job!', 'You did it!', 'Super!', 'Hooray!'],
    wow: n => `Well done! You have ${n} stars!`,
    install: 'Install ABC 123! on your device'
  }
});
