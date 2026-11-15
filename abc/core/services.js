// ====== SERVICES — speech, sounds, confetti, storage (used by the shell, views and games through APP) ======
const $ = id => document.getElementById(id);
const wait = ms => new Promise(r => setTimeout(r, ms));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---- storage (best-effort; namespaced; v2 keys use stable concept ids) ----
const store = {
  get(k, d) { try { const v = localStorage.getItem('abc2.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('abc2.' + k, JSON.stringify(v)); } catch (e) {} },
  legacy(k) { try { const v = localStorage.getItem('abc.' + k); return v == null ? null : JSON.parse(v); } catch (e) { return null; } }
};

// ---- sound effects ----
let AC = null;
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
  pop() { tone(660, 0, 0.15, 0.15); tone(990, 0.04, 0.2, 0.08); },
  right() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.08, 0.35, 0.16, 'triangle')); },
  wrong() { tone(220, 0, 0.18, 0.12, 'triangle'); tone(196, 0.12, 0.25, 0.1, 'triangle'); },
  fanfare() { [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, i * 0.11, 0.4, 0.15, 'triangle')); }
};

// ---- speech: device voice for the active language, offline voices first; never another language's voice ----
const SPEECH = {
  voice: null, noVoice: false, bcp47: 'en-GB',
  pick(bcp47) {
    this.bcp47 = bcp47;
    if (!('speechSynthesis' in window)) { this.noVoice = true; return; }
    const all = speechSynthesis.getVoices();
    if (!all.length) { this.voice = null; this.noVoice = false; return; } // list not loaded yet: let the browser choose by lang
    const norm = v => v.lang.replace('_', '-').toLowerCase(), want = bcp47.toLowerCase(), base = want.split('-')[0];
    const same = all.filter(v => norm(v) === want), lang = all.filter(v => norm(v).split('-')[0] === base);
    const nice = v => /female|samantha|karen|ioana|anna|serena|kate|google/i.test(v.name);
    this.voice = same.find(v => v.localService && nice(v)) || same.find(v => v.localService) || lang.find(v => v.localService)
              || same.find(nice) || same[0] || lang[0] || null;
    this.noVoice = !this.voice;
  }
};
let speakTimer = null, speakDone = null;
const liveUtts = new Set(); // keep references: Chrome/Android can cut off (GC) utterances that aren't referenced
function makeUtt(text, rate, onDone) {
  const u = new SpeechSynthesisUtterance(text + ' …'); // trailing pause so engines don't clip the last sound
  if (SPEECH.voice) u.voice = SPEECH.voice;
  u.lang = SPEECH.voice ? SPEECH.voice.lang : SPEECH.bcp47; u.rate = rate; u.pitch = 1.25;
  liveUtts.add(u);
  let fallback;
  const fin = () => { clearTimeout(fallback); liveUtts.delete(u); onDone && onDone(); };
  u.onend = u.onerror = fin;
  fallback = setTimeout(fin, 2000 + I18N.graphemes(text, SPEECH.bcp47).length * 160); // if onend never fires
  return u;
}
// Newest request wins (cancels current + pending). Resolves when the line has been spoken.
function speak(text, delay = 0) {
  if (!('speechSynthesis' in window) || SPEECH.noVoice) return wait(400 + delay);
  speechSynthesis.cancel(); clearTimeout(speakTimer);
  if (speakDone) speakDone();
  return new Promise(res => {
    let settled = false;
    const done = () => { if (!settled) { settled = true; if (speakDone === done) speakDone = null; res(); } };
    speakDone = done;
    speakTimer = setTimeout(() => speechSynthesis.speak(makeUtt(text, 0.85, done)), delay);
  });
}
function sayNow(text) { // queue a short line without cancelling the previous one
  if (!('speechSynthesis' in window) || SPEECH.noVoice) return;
  clearTimeout(speakTimer); speechSynthesis.speak(makeUtt(text, 1, null));
}
const hush = () => { if ('speechSynthesis' in window) speechSynthesis.cancel(); };

// ---- confetti ----
const fx = $('fx'), fctx = fx.getContext('2d');
let W, H;
function resizeFx() { W = fx.width = innerWidth; H = fx.height = innerHeight; }
resizeFx();
const fxParts = [];
function confetti(x, y, n = 40, spread = 9) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * spread;
    fxParts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, life: 1, s: 6 + Math.random() * 10,
      hue: Math.random() * 360, r: Math.random() * 6, vr: (Math.random() - .5) * .4, star: Math.random() < 0.35 });
  }
}
(function loop() {
  fctx.clearRect(0, 0, W, H);
  for (let i = fxParts.length - 1; i >= 0; i--) {
    const p = fxParts[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.vx *= 0.98; p.r += p.vr; p.life -= 0.012;
    if (p.life <= 0 || p.y > H + 40) { fxParts.splice(i, 1); continue; }
    fctx.save(); fctx.globalAlpha = Math.min(1, p.life * 1.5); fctx.translate(p.x, p.y); fctx.rotate(p.r);
    fctx.fillStyle = INK[(p.hue / 45 | 0) % 8];
    if (p.star) { fctx.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, rr = k % 2 ? p.s * .45 : p.s; fctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } fctx.closePath(); fctx.fill(); }
    else fctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
    fctx.restore();
  }
  requestAnimationFrame(loop);
})();
