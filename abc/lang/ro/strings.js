// ====== ROMÂNĂ — textele aplicației (textele fiecărui subiect sunt în abc/modules/<id>/lang/ro.js) ======
// Șabloane: "{name}" se înlocuiește; un obiect { one, few, other } se alege cu Intl.PluralRules('ro')
// (ro: 1 → one, 2–19 și 101–119 → few, 20+ / 100 → other = „de”).
STRINGS('ro', {
  sections: { num: 'Numere', abc: 'Litere', disc: 'Descoperă', play: 'Joacă' },
  find: 'Găsește', soon: 'în curând', info: 'Ce este?', noVoice: 'nu există voce pentru această limbă',
  sgpl: ['Singular', 'Plural'], none: ['nu are singular', 'nu are plural'],
  thats: 'Aceasta e {name}.',
  cheers: ['Bravo!', 'Super!', 'Foarte bine!', 'Ura!', 'Ai reușit!'],
  wow: { one: 'Bravo! Ai o steluță!', few: 'Bravo! Ai {n} steluțe!', other: 'Bravo! Ai {n} de steluțe!' },
  install: 'Instalează ABC 123! pe telefon',
  search: { placeholder: 'Caută un cuvânt…', hint: 'Scrie în orice limbă — cuvântul apare în limba aleasă sus.', none: 'Nu am găsit nimic.',
    results: { one: 'un rezultat', few: '{n} rezultate', other: '{n} de rezultate' } },
  words: { one: 'un cuvânt', few: '{n} cuvinte', other: '{n} de cuvinte' },
  profile: { title: 'Vârsta', little: 'Mic, de la 2 la 4 ani', explorer: 'Explorator, de la 4 la 7 ani', scientist: 'Om de știință, de la 7 la 12 ani' }
});
