CONFIG({
  name: 'ABC 123!', version: '1.2.0',
  icons: { info: '📖', star: '⭐', mute: '🔇', back: '‹', prev: '‹', next: '›', play: '▶', close: '✕', settings: '⚙️', search: '🔍', speak: '🔊', listen: '👂', objects: '🍓', fingers: '✋', other: '#', sep: '·', link: '🔗', drag: '👆', less: '−', more: '+' },
  languages: ['en', 'ro', 'de'],
  piper: { ort: 'https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.18.0/', phonemize: 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/',
    models: 'https://huggingface.co/diffusionstudio/piper-voices/resolve/main', runtime: 29571146 },
  modules: ['numbers', 'letters', 'colors', 'families', 'weather', 'shapes', 'body', 'seasons', 'categories', 'opposites', 'sky', 'clock', 'planets', 'health', 'elements'],
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
