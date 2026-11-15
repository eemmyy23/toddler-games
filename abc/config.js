// ====== CONFIG — the only shared list ======
// languages: active languages, in flag order (a folder abc/lang/<code>/ not listed here is a draft and is not loaded)
// modules:   subjects, in hub order (folders abc/modules/<id>/)
// sections:  bottom tabs; play: true → its hub is generated (one game per learn tile of all other sections)
// profiles:  age profiles chosen by the parent (long-press on the flags); a module shows if its ages overlap
// After editing: `node tools/check.js --fix` (regenerates abc/manifest.js).
CONFIG({
  languages: ['en', 'ro', 'de'],
  modules: ['numbers', 'letters', 'colors', 'soon'],
  sections: [
    { id: 'num', icon: '🔢' }, { id: 'abc', icon: '🔤' }, { id: 'disc', icon: '🔎' }, { id: 'play', icon: '🎯', play: true }
  ],
  profiles: { little: [2, 4], explorer: [4, 7], scientist: [7, 12] },
  defaultProfile: 'little',
  baseLanguage: 'en' // missing UI text falls back to this language (tools/check.js reports it)
});
