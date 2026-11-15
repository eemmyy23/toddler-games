// ====== DEUTSCH ======
LANG('de', {
  name: 'Deutsch', flag: '🇩🇪', tts: 'de-DE',
  alphabet: 'AÄBCDEFGHIJKLMNOÖPQRSßTUÜVWXYZ',
  nums: ['eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn'],
  keepCase: true, // nouns keep their capital letter (Kuh, Haus) in example words

  // ---- grammar ----
  sayLetter: (c, w) => `${c} wie ${w}!`,
  showWord: (w, like) => like ? `wie ${w}` : w,
  // ein/eine from the gender; plural article is always "die"
  forms: (w, f) => f[1] === '-'
    ? { sg: [w, `${f[0]} ${w}`], pl: null }                                 // Milch, Honig, Butter
    : { sg: [`${f[0] === 'die' ? 'eine' : 'ein'} ${w}`, `${f[0]} ${w}`], pl: [f[1], `die ${f[1].replace(/^zwei /, '')}`] },

  // ---- navigation labels ----
  sections: { num: 'Zahlen', abc: 'Buchstaben', disc: 'Entdecken', play: 'Spielen' },
  topics: {
    digits: ['Ziffern', 'Finde die Zahl'], count: ['Zählen', 'Wie viele?'], teens: ['11 – 20', 'Finde 11 – 20'],
    tens: ['Zehner', 'Finde die Zehner'], big: ['Große Zahlen', 'Große Zahlen'], clock: ['Die Uhr', 'Wie spät ist es?'],
    letters: ['Alphabet', 'Finde den Buchstaben'], read: ['Lesen', 'Finde das Wort'], groups: ['Buchstabengruppen', 'Finde die Gruppe'],
    colors: ['Farben', 'Finde die Farbe'], families: ['Tierfamilien', 'Wo ist das Junge?'],
    seasons: ['Jahreszeiten', 'Welche Jahreszeit?'], weather: ['Wetter', 'Wie ist das Wetter?'], cats: ['Kategorien', 'Sortieren']
  },
  games: {
    digits: it => `Finde die Zahl ${it.name}!`,
    count: () => 'Wie viele?',
    letters: (it, o) => `Finde den ${o.small ? 'kleinen ' : ''}Buchstaben ${it.name}!`,
    groups: it => `Finde die Gruppe ${it.name}!`,
    read: it => it.the ? `Wo ist ${it.the}?` : `Finde: ${it.name}!`,
    colors: it => `Wo ist ${it.name}?`
  },

  ui: {
    find: 'Finde', soon: 'bald', info: 'Was ist das?',
    sgpl: ['Einzahl', 'Mehrzahl'], none: ['kein Singular', 'kein Plural'],
    thats: n => `Das ist ${n}.`,
    cheers: ['Super!', 'Toll gemacht!', 'Bravo!', 'Juhu!', 'Geschafft!'],
    wow: n => `Super! Du hast ${n} Sterne!`,
    install: 'ABC 123! auf dem Gerät installieren'
  }
});
