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
  profile: { title: 'Vârsta', little: 'Mic (2–4)', explorer: 'Explorator (4–7)', scientist: 'Om de știință (7–12)' }
});
