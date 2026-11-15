// ====== CONFIG — the only shared list (tools/check.js validates it) ======
// languages: active languages, in flag order (a folder abc/lang/<code>/ not listed here is a draft and is not loaded)
// modules:   subjects, in hub order (folders abc/modules/<id>/)
// sections:  bottom tabs; play: true → its hub is generated (one game per learn tile of all other sections)
//            icon: an emoji or a short text ("123", "ABC") — text icons get the text style everywhere
// profiles:  age profiles in ascending age order, picked with the bike buttons in the top bar (anyone may switch);
//            { ages: [from, to], art?: ART id (default: the profile id), soon?: false → never shows "coming soon" tiles }.
//            A tile (ages on the tile, else on its module) belongs to the profile its start age falls in (4 → explorer);
//            it shows from that profile upwards (higher profiles add, never take away) and wears that profile's badge.
// After editing: `node tools/check.js --fix` (regenerates abc/manifest.js).
CONFIG({
  languages: ['en', 'ro', 'de'],
  modules: ['numbers', 'letters', 'colors', 'soon'],
  sections: [
    { id: 'num', icon: '123' }, { id: 'abc', icon: 'ABC' }, { id: 'disc', icon: '🧭' }, { id: 'play', icon: '🎯', play: true }
  ],
  profiles: {
    little: { ages: [2, 4], soon: false },   // a toddler can't tell "soon" from "broken"
    explorer: { ages: [4, 7] },
    scientist: { ages: [7, 12] }
  },
  defaultProfile: 'little',
  baseLanguage: 'en' // missing UI text falls back to this language (tools/check.js reports it)
});
