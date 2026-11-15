// ====== ENGLISH — app UI text (the texts of each subject live in abc/modules/<id>/lang/en.js) ======
// Templates: "{name}" is replaced; an object { one, few, many, other } is chosen with Intl.PluralRules.
STRINGS('en', {
  sections: { num: 'Numbers', abc: 'Letters', disc: 'Discover', play: 'Play' },
  find: 'Find', soon: 'soon', info: 'What is it?', noVoice: 'no voice for this language',
  sgpl: ['Singular', 'Plural'], none: ['no singular', 'no plural'],
  thats: "That's {name}.",
  cheers: ['Yay!', 'Great job!', 'You did it!', 'Super!', 'Hooray!'],
  wow: { one: 'Well done! You have {n} star!', other: 'Well done! You have {n} stars!' },
  search: { placeholder: 'Search a word…', hint: 'Type in any language — the word is shown in the language chosen above.', none: 'Nothing found.',
    results: { one: '1 result', other: '{n} results' } },
  words: { one: '1 word', other: '{n} words' },
  install: 'Install ABC 123! on your device',
  profile: { title: 'Age', little: 'Little, ages 2 to 4', explorer: 'Explorer, ages 4 to 7', scientist: 'Scientist, ages 7 to 12' }
});
