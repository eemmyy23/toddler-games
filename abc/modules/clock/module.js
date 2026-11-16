{
  const INK_FACE = '#1d2150', HAND_MIN = '#e5533d', FACE = '#fff8e7', BEZEL = '#f0b24a', BEZEL_EDGE = '#c98a22', TICK = '#b9b2cf', GLOW = '#fffdf6';
  const DAY = 1440, HALF = 720, HOUR = 60, STEP = 5, R = 14;
  const CLOCK = [7, 8, 9, 10, 12, 13, 15, 16, 18, 19, 20, 0].map(h => h * HOUR);
  const HALVES = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(h => h * HOUR + 30);
  const DIAL = ['06:30', '07:45', '08:10', '09:25', '10:50', '12:15', '13:35', '14:05', '15:20', '16:55', '18:40', '21:00'].map(t => +t.slice(0, 2) * HOUR + +t.slice(3));
  const PARTS = [[0, 'night'], [360, 'morning'], [720, 'noon'], [840, 'afternoon'], [1080, 'evening'], [1320, 'night']];
  const SKY = [[0, '0d1233', '070a1f', .6], [300, '141a45', '0a0d28', .5], [360, '4a3f86', '5c2a44', .15], [420, '2f5fa0', '24346a', 0], [720, '2a68b2', '173a73', 0],
    [780, '2a68b2', '173a73', 0], [1020, '2d5ea6', '1d3a72', 0], [1080, '41508f', '6a2f42', 0], [1200, '2c2766', '22152f', .25], [1260, '121641', '0a0c26', .5], [DAY, '0d1233', '070a1f', .6]];
  const STARS = [[12, 14, 1.5], [78, 9, 1.5], [46, 24, 1], [88, 38, 1], [22, 58, 1.5], [64, 70, 1], [8, 84, 1], [92, 76, 1.5], [34, 40, 1], [56, 12, 1]];
  const PICS = [[0, '🌙'], [360, '🌅'], [420, '☀️'], [1080, '🌇'], [1200, '🌙']];
  const TINT = [[0, 5], [360, 2], [720, 1], [1080, 6], [1260, 5]];
  const LINKS = { day: [360, 1200], extra: ['hourglass', 'sundial', 'clock-tower'], at: { 720: 'noon', 0: 'midnight' } };
  const band = (table, v) => table.filter(r => r[0] <= v).pop();
  const pad = n => String(n).padStart(2, '0');
  const idOf = v => `${pad(Math.floor(v / HOUR))}:${pad(v % HOUR)}`;
  const has = id => !!ABC.conceptById[id];

  const at = (deg, r) => [16 + r * Math.sin(deg * Math.PI / 180), 16 - r * Math.cos(deg * Math.PI / 180)].map(x => x.toFixed(2));
  const tick = i => { const big = i % 5 === 0, [x1, y1] = at(i * 6, 13.3), [x2, y2] = at(i * 6, big ? 11.9 : 12.6);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${big ? INK_FACE : TICK}" stroke-width="${big ? .7 : .3}" stroke-linecap="round"/>`; };
  const FACE_SVG = `<circle cx="16" cy="16" r="15.4" fill="${BEZEL}" stroke="${BEZEL_EDGE}" stroke-width=".5"/><circle cx="16" cy="16" r="${R}" fill="${FACE}"/>` +
    `<circle cx="16" cy="13" r="9" fill="${GLOW}" opacity=".7"/>` + Array.from({ length: 60 }, (_, i) => tick(i)).join('') +
    Array.from({ length: 12 }, (_, i) => { const [x, y] = at((i + 1) * 30, 9.7); return `<text x="${x}" y="${y}" font-size="3.3" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="${INK_FACE}">${i + 1}</text>`; }).join('');
  const CAP = `<circle cx="16" cy="16" r="1.5" fill="${BEZEL}" stroke="${INK_FACE}" stroke-width=".5"/>`;
  const bar = (len, w, c) => `<line x1="16" y1="${16 + len * .18}" x2="16" y2="${16 - len}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const HANDS = [{ turn: HALF, snap: HOUR, len: 8, body: bar(8, 2.4, INK_FACE), knob: `<circle cx="16" cy="8" r="1.9" fill="${INK_FACE}" stroke="${FACE}" stroke-width=".5"/>` },
    { turn: HOUR, snap: STEP, len: 11.6, body: bar(11.6, 1.3, HAND_MIN), knob: `<circle cx="16" cy="4.4" r="1.6" fill="${HAND_MIN}" stroke="${FACE}" stroke-width=".5"/>` }];
  const still = v => CONTENT.svg(FACE_SVG + HANDS.map(h => `<g transform="rotate(${((v / h.turn) * 360 % 360).toFixed(2)} 16 16)">${h.body}</g>`).join('') + CAP);

  const hex = h => [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, k) => a.map((x, i) => Math.round(x + (b[i] - x) * k));
  function sky(v) {
    const i = SKY.findIndex(r => r[0] > v), a = SKY[i - 1], b = SKY[i], k = (v - a[0]) / (b[0] - a[0]);
    const top = mix(hex(a[1]), hex(b[1]), k), bot = mix(hex(a[2]), hex(b[2]), k), stars = a[3] + (b[3] - a[3]) * k;
    const dots = stars > .02 ? STARS.map(([x, y, s]) => `radial-gradient(${s}px ${s}px at ${x}% ${y}%, rgba(255,240,200,${stars.toFixed(2)}), transparent 60%)`).join(', ') + ', ' : '';
    return `${dots}linear-gradient(180deg, rgb(${top.join(', ')}), rgb(${bot.join(', ')}))`;
  }

  function speech(code, s) {
    const L = ABC.langs[code], loc = L.bcp47;
    const cycle = s.hourCycle || new Intl.DateTimeFormat(loc, { hour: 'numeric' }).resolvedOptions().hourCycle;
    const fmt = new Intl.DateTimeFormat(loc, { hour: 'numeric', minute: '2-digit', hourCycle: cycle, timeZone: 'UTC' });
    const digital = v => fmt.format(new Date(Date.UTC(2000, 0, 1, Math.floor(v / HOUR), v % HOUR)));
    const words = v => { const h = Math.floor(v / HOUR) % 12, m = v % HOUR;
      return I18N.t(s.time['m' + m], { h: s.hours[h], next: s.hours[(h + 1) % 12], oclock: s.oclock[h] }, loc); };
    const name = v => I18N.t(s.when, { time: words(v), part: s.parts[band(PARTS, v)[1]] }, loc);
    const say = v => CONTENT.exclaim(code, I18N.capFirst(name(v), loc));
    return { cycle, digital, name, say };
  }
  const tint = v => CONTENT.palette(band(TINT, v)[1]);
  const related = (v, extra) => [v >= LINKS.day[0] && v < LINKS.day[1] ? 'day' : 'night', ...extra].filter(has);
  const conceptOf = v => has(LINKS.at[v]) ? LINKS.at[v] : 'clock';

  MODULE('clock', {
    section: 'num', ages: [3, 10],
    build(code) {
      const s = this.strings[code], T = speech(code, s), loc = ABC.langs[code].bcp47;
      const card = (v, what) => CONTENT.picture(code, { id: idOf(v), label: T.digital(v), name: T.name(v), big: still(v), nav: CONTENT.navText(T.digital(v), tint(v)), word: T.digital(v),
        bubbleArt: still(v), bubbleColor: tint(v), concept: conceptOf(v) },
        { say: what ? I18N.t(s.say, { when: I18N.capFirst(T.name(v), loc), what }, loc) : T.say(v), backdrop: sky(v), pics: [band(PICS, v)[1]], concepts: related(v, []), related: ['clock', ...related(v, LINKS.extra)] });
      const dial = Object.freeze({ aria: { less: s.less, more: s.more }, face: FACE_SVG, cap: CAP, cycle: DAY, step: STEP, hands: HANDS.map(h => Object.freeze({ turn: h.turn, snap: h.snap, len: h.len, body: h.body + h.knob })),
        read: v => ({ text: T.digital(v), name: T.name(v), say: T.say(v), pic: band(PICS, v)[1], backdrop: sky(v) }) });
      return {
        hours: CLOCK.map(v => card(v, s.day['h' + v / HOUR])),
        halves: HALVES.map(v => card(v, null)),
        dial: DIAL.map(v => CONTENT.glyph(code, { id: idOf(v), text: T.digital(v), name: T.name(v), color: tint(v) },
          { say: T.say(v), bubbleArt: still(v), at: v, dial, backdrop: sky(v), concept: 'clock', concepts: related(v, []), related: related(v, LINKS.extra) }))
      };
    },
    check(code, S, s, report) {
      for (const k of ['hours', 'oclock']) if ((s[k] || []).length !== 12) report(`${k} must have 12 entries`);
      for (let m = 0; m < HOUR; m += STEP) if (typeof (s.time || {})['m' + m] !== 'string') report(`time.m${m} missing`);
      for (const [, p] of PARTS) if (!(s.parts || {})[p]) report(`parts.${p} missing`);
      for (const v of CLOCK) if (!(s.day || {})['h' + v / HOUR]) report(`day.h${v / HOUR} missing`);
      if (s.hourCycle && !/^h(11|12|23|24)$/.test(s.hourCycle)) report(`hourCycle "${s.hourCycle}" must be h11, h12, h23 or h24`);
    },
    tiles: [
      { id: 'clock', icon: '🕒', view: 'card', items: S => S.hours, ages: [3, 6], index: true, game: { type: 'find', prompts: ['voice'], ask: () => 'where' } },
      { id: 'halves', icon: '🕞', view: 'card', items: S => S.halves, ages: [5, 9], index: true, game: { type: 'find', prompts: ['voice'], ask: () => 'where' } },
      { id: 'setclock', icon: '🕰️', view: 'dial', items: S => S.dial, ages: [6, 10], game: { type: 'find', prompts: ['glyph'], ask: () => 'which' } }
    ]
  });
}
