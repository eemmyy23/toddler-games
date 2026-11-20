CONFIG({
  name: 'ABC 123!', version: '1.2.0',
  icons: { lock: '🔒', rest: '😴', info: '📖', star: '⭐', mute: '🔇', back: '‹', prev: '‹', next: '›', play: '▶', close: '✕', settings: '⚙️', search: '🔍', speak: '🔊', listen: '👂', objects: '🍓', fingers: '✋', other: '#', sep: '·', link: '🔗', drag: '👆', less: '−', more: '+' },
  languages: ['en', 'ro', 'de'],
  piper: { ort: 'https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.18.0/', phonemize: 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/',
    models: 'https://huggingface.co/diffusionstudio/piper-voices/resolve/main', runtime: 29571146 },
  modules: ['numbers', 'letters', 'colors', 'families', 'weather', 'shapes', 'body', 'seasons', 'categories', 'opposites', 'sky', 'clock', 'planets', 'health', 'elements'],
  sections: [
    { id: 'num', icon: '123' }, { id: 'abc', icon: 'ABC' }, { id: 'disc', icon: '🧭' }, { id: 'play', icon: '🎯', play: true }
  ],
  profiles: {
    curious: { ages: [2, 4], tier: 0 },
    explorer: { ages: [4, 7], tier: 1 },
    scientist: { ages: [7, 12], tier: 2 }
  },
  play: { choices: [2, 3, 4], up: 3, down: 2, window: 5, recent: 0.5, recentSubjects: 8, sameSpot: 2, maxWeight: 2, cooldown: 700, bigEvery: 10, next: 1200, nextBig: 2400, settle: 350 },
  session: { minutes: 3, choices: [2, 3, 5, 7, 10, 15], idle: 30, round: 12, windDown: 3, warn: 30, breakMin: 10, hold: 3, gate: [2, 9] },
  defaultProfile: 'curious',
  baseLanguage: 'en'
});
