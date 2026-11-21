const $ = id => document.getElementById(id);
function onTap(el, fn) { const b = typeof el === 'string' ? $(el) : el; b.addEventListener('pointerdown', e => e.preventDefault()); b.addEventListener('click', e => { e.stopPropagation(); fn(e); }); }
function onTapIn(root, sel, fn) {
  const r = typeof root === 'string' ? $(root) : root;
  r.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest(sel)) e.preventDefault(); }, true);
  r.addEventListener('click', e => { const b = e.target.closest && e.target.closest(sel); if (!b) return; e.stopPropagation(); fn(b, e); }, true);
}
function onScrub(root, sel, fn) {
  const r = typeof root === 'string' ? $(root) : root, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let last = null;
  const pick = e => {
    const all = [...r.querySelectorAll(sel)].map(x => x.getBoundingClientRect()); if (!all.length) return;
    const x = clamp(e.clientX, Math.min(...all.map(q => q.left)) + 1, Math.max(...all.map(q => q.right)) - 1);
    const y = clamp(e.clientY, Math.min(...all.map(q => q.top)) + 1, Math.max(...all.map(q => q.bottom)) - 1);
    const at = document.elementFromPoint(x, y), hit = at && at.closest(sel);
    if (hit && r.contains(hit) && hit !== last) { last = hit; fn(hit, e); }
  };
  r.addEventListener('pointerdown', e => { e.preventDefault(); last = null; try { r.setPointerCapture(e.pointerId); } catch (x) {} pick(e); });
  r.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') pick(e); });
  r.addEventListener('pointerup', e => { last = null; e.stopPropagation(); });
  r.addEventListener('click', e => { e.stopPropagation(); const b = !e.detail && e.target.closest && e.target.closest(sel); if (b) fn(b, e); });
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const PAUSE = { tap: 80, line: 120, ask: 250, answer: 350, praise: 700, beat: 700, hold: 1500 }, TALK = { base: 2000, perChar: 160, silent: 400, karaoke: 75, linger: 1500 };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

const store = {
  get(k, d, session) { try { const v = (session ? sessionStorage : localStorage).getItem('abc2.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v, session) { try { (session ? sessionStorage : localStorage).setItem('abc2.' + k, JSON.stringify(v)); } catch (e) {} },
  legacy(k) { try { const v = localStorage.getItem('abc.' + k); return v == null ? null : JSON.parse(v); } catch (e) { return null; } }
};

let AC = null;
const quietAudio = () => { if (AC && AC.state === 'running') AC.suspend(); };
function ensureAudio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } }
  if (AC.state !== 'running') AC.resume();
}
function tone(freq, start, dur, vol = 0.18, type = 'sine') {
  if (!AC) return;
  const t = AC.currentTime + start, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.05);
}
const sfx = {
  tick() { tone(1400, 0, 0.04, 0.05, 'triangle'); },
  pop() { tone(660, 0, 0.15, 0.15); tone(990, 0.04, 0.2, 0.08); },
  right() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.08, 0.35, 0.16, 'triangle')); },
  wrong() { tone(220, 0, 0.18, 0.12, 'triangle'); tone(196, 0.12, 0.25, 0.1, 'triangle'); },
  fanfare() { [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, i * 0.11, 0.4, 0.15, 'triangle')); }
};

const SPEECH = {
  voice: null, noVoice: false, bcp47: null, respell: [], phonemes: null, engine: null, rate: ABC.config.speech.rate, pitch: ABC.config.speech.pitch,
  norm: v => v.lang.replace('_', '-').toLowerCase(),
  hasVoice(bcp47) {
    if (!('speechSynthesis' in window)) return false;
    const all = speechSynthesis.getVoices(), base = bcp47.toLowerCase().split('-')[0];
    return all.length ? all.some(v => this.norm(v).split('-')[0] === base) : null;
  },
  pick(bcp47, prefer, words = [], ssml = null, own = false, fixes = null, choice = null, engine = null) {
    this.bcp47 = bcp47; this.voice = null; this.engine = engine; this.noVoice = !('speechSynthesis' in window) && !engine;
    const all = 'speechSynthesis' in window ? speechSynthesis.getVoices() : [];
    if (all.length) {
      const want = bcp47.toLowerCase(), base = want.split('-')[0];
      const same = all.filter(v => this.norm(v) === want), lang = all.filter(v => this.norm(v).split('-')[0] === base);
      const nice = v => !!prefer && prefer.test(v.name);
      this.voice = lang.find(v => choice && v.voiceURI === choice) || same.find(v => v.localService && nice(v)) || same.find(v => v.localService) || lang.find(v => v.localService)
                || same.find(nice) || same[0] || lang[0] || null;
      this.noVoice = !this.voice && !engine;
    }
    if (engine) this.voice = { voiceURI: engine.uri, lang: bcp47, name: engine.uri, localService: true };
    this.tune(words, ssml, own, fixes);
  },
  fixKey: (bcp47, v) => `ttsfix.${bcp47}.${v ? v.voiceURI : '-'}`,
  tune(words, ssml, own, fixes) {
    const edge = '[\\p{L}\\p{M}]', lit = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), low = t => t.toLocaleLowerCase(this.bcp47);
    const re = w => new RegExp(`(?<!${edge})${lit(w)}(?!${edge})`, 'giu'), base = e => e.w.split('/').join('');
    const v = fixes && this.voice && fixes[this.voice.voiceURI] || {}, data = Object.assign({}, v.derived, v.words);
    const fix = Object.assign(Object.fromEntries(Object.entries(data).map(([w, t]) => [low(w), /^\/.*\/$/.test(t) ? { k: 'ipa', text: t.slice(1, -1) } : { k: 'tts', text: t }])),
      own && this.voice ? store.get(this.fixKey(this.bcp47, this.voice), {}) : {});
    const all = words.flatMap(e => [e, ...(e.syn || [])]);
    const map = new Map(ssml && this.voice && ssml.test(this.voice.voiceURI)
      ? all.filter(e => e.pron && e.pron.ipa && !e.pron.of && !e.pron.tts).map(e => [low(base(e)), e.pron.ipa.replace(/^[/[]|[/\]]$/g, '')]) : []);
    this.respell = all.filter(e => e.pron && e.pron.tts && !fix[low(base(e))]).map(e => [re(base(e)), e.pron.tts]);
    for (const [w, f] of Object.entries(fix)) {
      map.delete(w);
      if (f.k === 'ipa') map.set(w, f.text); else if (f.k !== 'orig') this.respell.push([re(w), f.text]);
    }
    this.phonemes = map.size ? { map, re: new RegExp(`(?<!${edge})(${[...map.keys()].sort((a, b) => b.length - a.length).map(lit).join('|')})(?!${edge})`, 'giu') } : null;
  }
};
let speakTimer = null, speakDone = null;
const liveUtts = new Set();
const KARAOKE = {
  el: null, cuts: [], marks: [], words: [], raf: 0, t0: 0, est: 0, real: false, id: 0, sub: null, hideT: 0,
  norm: t => (t || '').toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim(),
  find(text) {
    const want = this.norm(text);
    if (!want) return null;
    const shown = e => !e.closest('[hidden], .sub') && e.getClientRects().length > 0, seen = new Set();
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      const t = this.norm(w.currentNode.data);
      if (!t || !want.includes(t)) continue;
      for (let e = w.currentNode.parentElement; e && e !== document.body && !seen.has(e); e = e.parentElement) {
        seen.add(e);
        const all = this.norm(e.textContent);
        if (all.length > want.length) break;
        if (all === want && shown(e)) return e;
      }
    }
    return null;
  },
  slot: () => [...document.querySelectorAll('.sub:not(#sub)')].find(e => !e.closest('[hidden]') && e.getClientRects().length > 0) || $('sub'),
  caption(text) {
    this.hide();
    const s = this.slot();
    s.textContent = text; s.hidden = false;
    return s;
  },
  hide() { clearTimeout(this.hideT); document.querySelectorAll('.sub').forEach(s => { s.textContent = ''; delete s.dataset.said; }); $('sub').hidden = true; },
  wrap(el) {
    if (!el.querySelector('.kw')) {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [];
      while (w.nextNode()) if (w.currentNode.data) nodes.push(w.currentNode);
      let n = -1, open = false;
      for (const t of nodes) {
        const f = document.createDocumentFragment();
        for (const part of t.data.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) { f.append(part); open = false; continue; }
          if (!open) n++;
          const k = document.createElement('span'); k.className = 'kw'; k.dataset.w = n; k.textContent = part; f.append(k); open = true;
        }
        t.replaceWith(f);
      }
    }
    const groups = [];
    el.querySelectorAll('.kw').forEach(k => { (groups[+k.dataset.w] = groups[+k.dataset.w] || []).push(k); });
    return groups.filter(Boolean);
  },
  prime(el, text, line = text) {
    this.stop(); this.id++;
    if (el) this.hide(); else if (this.norm(text)) el = this.caption(text);
    const words = el && el.isConnected ? this.wrap(el) : [];
    if (el) el.dataset.said = line;
    const word = g => g.map(k => k.textContent).join('');
    this.words = words;
    this.marks = el && el.classList.contains('sub') ? words.map(g => { const t = this.find(word(g)); return t ? t.closest('button') || t : null; }) : [];
    if (!words.length) return;
    const cut = ws => { const lens = ws.map(w => I18N.graphemes(w, SPEECH.bcp47).length), tot = lens.reduce((a, b) => a + b, 0); let c = 0; return lens.map(l => (c += l) / tot); };
    const said = text.split(/\s+/).filter(Boolean);
    this.cuts = cut(said.length === words.length ? said : words.map(word));
    this.el = el; this.real = false; this.est = I18N.graphemes(text, SPEECH.bcp47).length * TALK.karaoke / SPEECH.rate;
  },
  start(id, ms) {
    if (!this.el || id !== this.id) return;
    if (ms) this.est = ms;
    this.t0 = performance.now();
    const step = () => { if (!this.el) return; if (!this.real) this.at(Math.min(0.999, (performance.now() - this.t0) / this.est)); this.raf = requestAnimationFrame(step); };
    step();
  },
  boundary(id, i, len) { if (!this.el || !len || id !== this.id) return; this.real = true; this.at(Math.min(0.999, (i + 1) / len)); },
  at(p) {
    const n = this.cuts.findIndex(c => p < c);
    this.words.forEach((g, i) => g.forEach(k => k.classList.toggle('now', i === n)));
    this.marks.forEach((m, i) => m && m.classList.toggle('said', i === n || (m === this.marks[n])));
  },
  stop(id) {
    if (id != null && id !== this.id) return;
    cancelAnimationFrame(this.raf);
    if (this.el) this.el.querySelectorAll('.kw.now').forEach(k => k.classList.remove('now'));
    this.marks.forEach(m => m && m.classList.remove('said'));
    if (this.el && this.el.id === 'sub') this.hideT = setTimeout(() => this.hide(), TALK.linger);
    this.el = null; this.marks = [];
  }
};
function makeUtt(text, onDone, how = {}) {
  let said = how.plain || how.ph ? text : SPEECH.respell.reduce((t, [re, to]) => t.replace(re, to), text);
  if (how.ph) said = `<speak><phoneme alphabet="ipa" ph="${esc(how.ph)}">${esc(text)}</phoneme></speak>`;
  if (!/^<speak>|[.!?…:]\s*$/u.test(said)) said += '.';
  const P = how.plain || how.ph ? null : SPEECH.phonemes;
  if (P && !/^<speak>/.test(said) && P.re.test(esc(said))) {
    P.re.lastIndex = 0;
    said = `<speak>${esc(said).replace(P.re, w => `<phoneme alphabet="ipa" ph="${esc(P.map.get(w.toLocaleLowerCase(SPEECH.bcp47)))}">${w}</phoneme>`)}</speak>`;
  }
  P && (P.re.lastIndex = 0);
  const u = new SpeechSynthesisUtterance(said), kid = KARAOKE.id;
  u.said = text;
  const v = how.voice || SPEECH.voice;
  if (v) u.voice = v;
  u.lang = v ? v.lang : SPEECH.bcp47; u.rate = SPEECH.rate; u.pitch = SPEECH.pitch;
  liveUtts.add(u);
  let fallback;
  const fin = () => { clearTimeout(fallback); liveUtts.delete(u); KARAOKE.stop(kid); onDone && onDone(); };
  u.onend = u.onerror = fin;
  u.onstart = () => KARAOKE.start(kid);
  u.onboundary = e => { if (!e.name || e.name === 'word') KARAOKE.boundary(kid, e.charIndex, said.length); };
  fallback = setTimeout(fin, TALK.base + I18N.graphemes(text, SPEECH.bcp47).length * TALK.perChar);
  return u;
}
function speak(line, delay = 0, el = KARAOKE.find(I18N.shown(line)), how = {}) {
  const text = I18N.said(line), shown = I18N.shown(line);
  const E = 'engine' in how ? how.engine : how.voice ? null : SPEECH.engine;
  KARAOKE.prime(el, shown, line);
  const kid = KARAOKE.id;
  if (!E && (!('speechSynthesis' in window) || (SPEECH.noVoice && !how.voice))) { setTimeout(() => KARAOKE.start(kid), delay); setTimeout(() => KARAOKE.stop(kid), delay + KARAOKE.est); return wait(TALK.silent + delay); }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  if (E) E.stop();
  clearTimeout(speakTimer);
  if (speakDone) speakDone();
  return new Promise(res => {
    let settled = false;
    const done = () => { if (!settled) { settled = true; if (speakDone === done) speakDone = null; res(); } };
    speakDone = done;
    speakTimer = setTimeout(() => E
      ? (E.say(how.plain || how.ph ? text : SPEECH.respell.reduce((t, [re, to]) => t.replace(re, to), text), how, ms => KARAOKE.start(kid, ms)).then(() => { KARAOKE.stop(kid); done(); }, () => { KARAOKE.stop(kid); done(); }))
      : speechSynthesis.speak(makeUtt(text, done, how)), delay);
  });
}
document.addEventListener('click', e => {
  const k = e.target.closest && e.target.closest('[data-said]');
  if (k && !e.target.closest('button, a, input, [role=button], [role=link]')) speak(k.dataset.said, 0, k);
});
const hush = () => { KARAOKE.stop(); KARAOKE.hide(); clearTimeout(speakTimer); if (speakDone) speakDone(); if ('speechSynthesis' in window) speechSynthesis.cancel(); if (SPEECH.engine) SPEECH.engine.stop(); };

const fx = $('fx'), fctx = fx.getContext('2d');
let W, H;
function resizeFx() { W = fx.width = innerWidth; H = fx.height = innerHeight; }
resizeFx();
const fxParts = [];
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function confetti(x, y, n = 40, spread = 9) {
  if (calm()) return;
  if (!fxOn) { fxOn = true; requestAnimationFrame(loop); }
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * spread;
    fxParts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, life: 1, s: 6 + Math.random() * 10,
      hue: Math.random() * 360, r: Math.random() * 6, vr: (Math.random() - .5) * .4, star: Math.random() < 0.35 });
  }
}
let fxOn = false;
function loop() {
  fctx.clearRect(0, 0, W, H);
  for (let i = fxParts.length - 1; i >= 0; i--) {
    const p = fxParts[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.vx *= 0.98; p.r += p.vr; p.life -= 0.012;
    if (p.life <= 0 || p.y > H + 40) { fxParts.splice(i, 1); continue; }
    fctx.save(); fctx.globalAlpha = Math.min(1, p.life * 1.5); fctx.translate(p.x, p.y); fctx.rotate(p.r);
    fctx.fillStyle = CONTENT.palette(p.hue);
    if (p.star) { fctx.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, rr = k % 2 ? p.s * .45 : p.s; fctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } fctx.closePath(); fctx.fill(); }
    else fctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
    fctx.restore();
  }
  fxOn = fxParts.length > 0; if (fxOn) requestAnimationFrame(loop);
}
