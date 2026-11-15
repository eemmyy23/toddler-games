CONFIG({
  languages: ['en', 'ro', 'de'],
  modules: ['numbers', 'letters', 'colors', 'families', 'weather', 'shapes', 'body', 'seasons', 'categories', 'opposites', 'sky', 'clock', 'planets', 'health'],
  sections: [
    { id: 'num', icon: '123' }, { id: 'abc', icon: 'ABC' }, { id: 'disc', icon: '🧭' }, { id: 'play', icon: '🎯', play: true }
  ],
  profiles: {
    curious: { ages: [2, 4] },
    explorer: { ages: [4, 7] },
    scientist: { ages: [7, 12] }
  },
  defaultProfile: 'curious',
  baseLanguage: 'en'
});
