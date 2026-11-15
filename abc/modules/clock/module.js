{
  const INK_FACE = '#1d2150', HAND_MIN = '#e5533d', FACE = '#fff8e7';
  const at = (deg, r) => [16 + r * Math.sin(deg * Math.PI / 180), 16 - r * Math.cos(deg * Math.PI / 180)].map(v => v.toFixed(2));
  const hand = (deg, len, w, c) => { const [x, y] = at(deg, len); return `<line x1="16" y1="16" x2="${x}" y2="${y}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`; };
  const face = (h, m) => `<svg class="art" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14.6" fill="${FACE}" stroke="${INK_FACE}" stroke-width="1.6"/>` +
    Array.from({ length: 12 }, (_, i) => { const [x, y] = at((i + 1) * 30, 11.2); return `<text x="${x}" y="${y}" font-size="3.6" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="${INK_FACE}">${i + 1}</text>`; }).join('') +
    hand((h % 12 + m / 60) * 30, 6.8, 2.4, INK_FACE) + hand(m * 6, 10, 1.4, HAND_MIN) + `<circle cx="16" cy="16" r="1.3" fill="${INK_FACE}"/></svg>`;
  const emoji = (h, m) => String.fromCodePoint((m ? 0x1F55C : 0x1F550) + (h + 11) % 12);
  const items = (s, key, m) => (s[key] || []).length === 12 ? s[key].map((name, i) => {
    const h = i + 1, art = face(h, m);
    return { id: `${h}:${m ? '30' : '00'}`, label: `${h}:${m ? '30' : '00'}`, name, say: (s.say && s.say[i] && !m) ? s.say[i] : `${name}!`, word: name,
      big: art, nav: emoji(h, m), bubble: emoji(h, m), bubbleArt: art, pictureBubble: true, prompt: name, the: name };
  }) : [];
  MODULE('clock', {
    section: 'num', ages: [3, 9],
    build(code) { const s = this.strings[code]; return { hours: items(s, 'hours', 0), halves: items(s, 'halves', 30) }; },
    check(code, S, s, report) { for (const k of ['hours', 'halves']) if ((s[k] || []).length !== 12) report(`${k} must have 12 entries`); },
    tiles: [
      { id: 'clock', icon: '🕒', view: 'card', items: S => S.hours, ages: [3, 6], index: true, game: { type: 'find', prompts: ['voice'], ask: () => 'where' } },
      { id: 'halves', icon: '🕞', view: 'card', items: S => S.halves, ages: [5, 9], index: true, game: { type: 'find', prompts: ['voice'], ask: () => 'where' } }
    ]
  });
}
