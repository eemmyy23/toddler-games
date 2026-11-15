(function () {
  let target = null, opts = [], locked = false, round = {}, roundTok = 0, keep = false;
  const game = () => ABC.games[APP.tile().game.type];
  const wk = it => `${APP.tile().id}:${it.id}`;
  const weights = store.get('w', {});
  const nChoices = () => APP.streak >= 8 ? 4 : APP.streak >= 3 ? 3 : 2;
  const look = it => it.bubbleArt || (it.bubble ?? it.label) || it.bubbleColor;
  const pool = () => game().pool(APP.gameItems(), APP.streak);
  function pickTarget() {
    const p = pool().filter(it => it !== target);
    let r = Math.random() * p.reduce((s, it) => s + 1 + (weights[wk(it)] || 0), 0);
    for (const it of p) { r -= 1 + (weights[wk(it)] || 0); if (r <= 0) return it; }
    return p[p.length - 1];
  }
  const pickSubject = t => { const m = t.members || []; return m.length ? m[Math.random() * m.length | 0].id : null; };
  const subject = () => round.subject && target.members ? target.members.find(m => m.id === round.subject) || null : null;
  function askLine() {
    const g = APP.tile().game, key = g.ask ? g.ask(target, round) : APP.tile().id, it = subject() || target;
    return APP.mt('games.' + key, Object.assign({}, it, { the: it.the || it.name }));
  }
  function newRound() {
    locked = false; target = pickTarget();
    if (!target) { opts = []; $('ask').innerHTML = ''; $('choices').innerHTML = ''; return; }
    opts = [target];
    for (const it of shuffle(pool())) if (opts.length < nChoices() && (!target.among || it.among === target.among) && !opts.some(o => (o.sound && o.sound === it.sound) || look(o) === look(it))) opts.push(it);
    opts = shuffle(opts);
    const g = APP.tile().game, prompts = g.prompts || ['glyph'];
    round = { lower: !!(g.lower && target.lower && Math.random() < 0.5), prompt: prompts[Math.random() * prompts.length | 0], subject: pickSubject(target) };
    draw();
  }
  function draw() {
    locked = false;
    const q = game().show(target, round, askLine(), subject());
    $('ask').innerHTML = `<span class="q">🔊 ${esc(q.text)}</span>${q.picture || ''}`;
    const box = $('choices');
    box.className = 'n' + opts.length + (target.smallBubble ? ' grp' : '') + (target.pictureBubble ? ' wrd' : '');
    box.innerHTML = '';
    opts.forEach((it, i) => {
      const b = document.createElement('button');
      b.className = 'bub'; if (it.bubbleArt) b.innerHTML = it.bubbleArt; else { b.textContent = round.lower && it.lower ? it.lower : (it.bubble ?? it.label); b.style.setProperty('--fit', (1.3 / Math.max(1, [...b.textContent].length)).toFixed(3)); }
      b.setAttribute('aria-label', it.name); b.dataset.id = it.id;
      b.style.setProperty('--c', it.bubbleColor || ink(i * 90)); b.style.animationDelay = (i * 0.4) + 's';
      b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); choose(it, b); });
      box.appendChild(b);
    });
    $('plinks').innerHTML = APP.links(target);
    APP.fit($('play'));
    speak(askLine(), 250);
  }
  function choose(it, el) {
    APP.firstTouch(); if (locked) return;
    const U = APP.ui();
    if (it === target) {
      locked = true; APP.streak++; APP.addStar();
      weights[wk(it)] = Math.max(0, (weights[wk(it)] || 0) - 1); store.set('w', weights);
      if (el) { el.classList.add('right'); const r = el.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2); } else confetti(W / 2, H / 2);
      const big = APP.stars % 10 === 0;
      let said;
      if (big) {
        sfx.fanfare();
        for (let k = 0; k < 5; k++) setTimeout(() => confetti(Math.random() * W, H * 0.3 + Math.random() * H * 0.3, 60, 12), k * 180);
        said = speak(APP.t(U.wow, { n: APP.stars }), 700);
      } else { sfx.right(); said = speak(`${U.cheers[Math.random() * U.cheers.length | 0]} ${target.name}!`, 400); }
      const tok = ++roundTok;
      Promise.all([said, wait(big ? 2400 : 1200)]).then(() => wait(350)).then(() => { if (tok === roundTok && APP.screen() === 'play' && locked) newRound(); });
    } else {
      APP.streak = 0;
      weights[wk(target)] = Math.min(5, (weights[wk(target)] || 0) + 1); store.set('w', weights);
      sfx.wrong();
      if (el) { el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong'); }
      speak(`${APP.t(U.thats, { name: it.a || it.name, g: it.plural ? 'pl' : it.a ? it.g : null })} ${askLine()}`, 350);
    }
  }
  $('ask').addEventListener('pointerdown', e => { e.stopPropagation(); if (target) speak(askLine()); });
  VIEW('play', {
    el: 'play',
    show() { if (keep && target) draw(); else { target = null; newRound(); } keep = false; },
    leave() { roundTok++; },
    resize() { if (target) APP.fit($('play')); },
    announce(name) { if (target) speak(`${name}. ${askLine()}`, 250); },
    beforeLang() { return { target: target && target.id, opts: opts.map(o => o.id), lower: round.lower }; },
    afterLang(s) {
      if (!s || !s.target) return;
      const p = pool(), t = p.find(x => x.id === s.target); if (!t) return;
      const o = s.opts.map(id => p.find(x => x.id === id)), spare = shuffle(p.filter(x => !o.includes(x) && (!t.among || x.among === t.among)));
      target = t; opts = o.map(x => x || spare.pop()).filter(Boolean);
      if (round.lower && !t.lower) round.lower = false;
      if (round.subject && !(t.members || []).some(m => m.id === round.subject)) round.subject = pickSubject(t);
      keep = true;
    },
    reset() { target = null; },
    onKey(k, e) {
      if (k === ' ' || k === 'enter') { e.preventDefault(); if (target) speak(askLine()); return true; }
      const it = opts.find(x => x.key === k) || pool().find(x => x.key === k); if (!it) return false;
      choose(it, document.querySelector(`.bub[data-id="${CSS.escape(it.id)}"]`)); return true;
    },
    state: () => ({ target, opts, round }), newRound, choose
  });
})();
