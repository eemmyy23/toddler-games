// ====== ROMÂNĂ ======
LANG('ro', {
  name: 'Română', flag: '🇷🇴', tts: 'ro-RO',
  alphabet: 'AĂÂBCDEFGHIÎJKLMNOPQRSȘTȚUVWXYZ',
  nums: ['unu', 'doi', 'trei', 'patru', 'cinci', 'șase', 'șapte', 'opt', 'nouă', 'zece'],
  // special letter groups (examples come from the dictionary)
  groups: ['ce', 'ci', 'che', 'chi', 'ge', 'gi', 'ghe', 'ghi'],

  // ---- grammar ----
  // letters are spoken as school sounds (DOOM: bî, cî, dî …); vowels as-is; k/q/w/x/y by name
  spell: c => ({ A: 'a', Ă: 'ă', Â: 'â', E: 'e', I: 'i', Î: 'î', O: 'o', U: 'u', K: 'ca', Q: 'chiu', W: 'dublu ve', X: 'ics', Y: 'i grec' })[c]
             || c.toLocaleLowerCase('ro') + 'î',
  sayLetter: (c, w, like) => like ? `${c}, ca în ${w}!` : `${c}, de la ${w}!`,
  showWord: (w, like) => like ? `ca în ${w}` : w,
  // plural definite (school rule): after "doi" add -i (câini → câinii), after "două" add -le (vaci → vacile)
  forms: (w, f) => {
    if (f[0] === 'pl') return { sg: null, pl: [`niște ${w}`, f[1]] };   // ochelari, blugi
    const sg = [f[0] === '-' ? w : `${f[0]} ${w}`, f[1]];
    if (f[2] === '-') return { sg, pl: null };                            // lapte, miere, unt
    const [num, ...rest] = f[2].split(' '), pl = rest.join(' ');
    return { sg, pl: [f[2], pl + (num === 'doi' ? 'i' : 'le')] };
  },

  // ---- navigation labels ----
  sections: { num: 'Numere', abc: 'Litere', disc: 'Descoperă', play: 'Joacă' },
  topics: {
    digits: ['Cifre', 'Găsește cifra'], count: ['Numără', 'Câte sunt?'], teens: ['11 – 20', 'Găsește 11 – 20'],
    tens: ['Zeci', 'Găsește zecile'], big: ['Numere mari', 'Numere mari'], clock: ['Ceasul', 'Unde e ora?'],
    letters: ['Alfabetul', 'Găsește litera'], read: ['Citește', 'Găsește cuvântul'], groups: ['Grupuri de litere', 'Găsește grupul'],
    colors: ['Culori', 'Găsește culoarea'], families: ['Familiile animalelor', 'Unde e puiul?'],
    seasons: ['Anotimpurile', 'Ce anotimp e?'], weather: ['Vremea', 'Ce vreme e?'], cats: ['Categorii', 'Pune la locul lui']
  },
  games: {
    digits: it => `Găsește numărul ${it.name}!`,
    count: () => 'Câte sunt?',
    letters: (it, o) => `Găsește litera ${o.small ? 'mică ' : ''}${it.name}!`,
    groups: it => `Găsește grupul ${it.name}!`,
    read: it => it.the ? `Unde e ${it.the}?` : `Găsește: ${it.name}!`,
    colors: it => `Unde e ${it.name}?`
  },

  ui: {
    find: 'Găsește', soon: 'în curând', info: 'Ce este?',
    sgpl: ['Singular', 'Plural'], none: ['nu are singular', 'nu are plural'],
    thats: n => `Aceasta e ${n}.`,
    cheers: ['Bravo!', 'Super!', 'Foarte bine!', 'Ura!', 'Ai reușit!'],
    wow: n => `Bravo! Ai ${n} ${n % 100 === 0 || n % 100 >= 20 ? 'de ' : ''}steluțe!`,
    install: 'Instalează ABC 123! pe telefon'
  }
});
