(function () {
  let target = null, opts = [], locked = false, round = {}, roundTok = 0, keep = false;
  const game = () => ABC.games[APP.tile().game.type];
  const wk = it => `${APP.tile().id}:${it.id}`;
  const weights = store.get('w', {});
  const RULES = { levels: [[8, 4], [3, 3], [0, 2]], maxWeight: 5, cooldown: 700, bigEvery: 10, next: 1200, nextBig: 2400, settle: 350 };
  const nChoices = () => RULES.levels.find(([s]) => APP.streak >= s)[1];
  const look = it => it.bubbleArt || it.bubble || it.bubbleColor;
  const pool = () => game().pool(APP.gameItems(), APP.streak);
  const fits = (it, t, os) => (!t.among || it.among === t.among) && !os.some(o => o === it || (o.sound && o.sound === it.sound) || look(o) === look(it));
  function pickTarget() {
    const p = pool().filter(it => it !== target);
    let r = Math.random() * p.reduce((s, it) => s + 1 + (weights[wk(it)] || 0), 0);
    for (const it of p) { r -= 1 + (weights[wk(it)] || 0); if (r <= 0) return it; }
    return p[p.length - 1];
  }
  const pickSubject = t => { const m = t.members || []; return m.length ? m[Math.random() * m.length | 0].id : null; };
  const subject = () => round.subject && target.members ? target.members.find(m => m.id === round.subject) || null : null;
  function askLine() {
    const key = Tiles.ask(APP.tile(), target, round), it = subject() || target;
    return APP.mt('games.' + key, Object.assign({}, it, { the: it.the || it.name }));
  }
  function newRound() {
    locked = false; target = pickTarget();
    if (!target) { opts = []; $('ask').innerHTML = ''; $('choices').innerHTML = ''; return; }
    opts = [target];
    for (const it of shuffle(pool())) if (opts.length < nChoices() && fits(it, target, opts)) opts.push(it);
    opts = shuffle(opts);
    const g = APP.tile().game, prompts = g.prompts || ['glyph'];
    round = { lower: !!(g.lower && target.lower && Math.random() < 0.5), prompt: prompts[Math.random() * prompts.length | 0], subject: pickSubject(target) };
    draw();
  }
  function draw() {
    locked = false;
    const q = game().show(target, round, askLine(), subject());
    $('ask').innerHTML = `<span class="q">${APP.icon('speak')}${esc(q.text)}</span>${q.picture || ''}`;
    const box = $('choices');
    box.className = 'n' + opts.length + (target.smallBubble ? ' grp' : '') + (target.pictureBubble ? ' wrd' : '');
    box.innerHTML = '';
    opts.forEach((it, i) => {
      const b = document.createElement('button');
      b.className = 'bub'; if (it.bubbleArt) b.innerHTML = it.bubbleArt; else { b.textContent = round.lower && it.lower ? it.lower : it.bubble; b.style.setProperty('--fit', (1.3 / Math.max(1, [...b.textContent].length)).toFixed(3)); }
      b.setAttribute('aria-label', it.name); b.dataset.id = it.id;
      b.style.setProperty('--c', it.bubbleColor || CONTENT.palette(i * 2)); b.style.animationDelay = (i * 0.4) + 's';
      box.appendChild(b);
    });
    $('plinks').innerHTML = APP.links(target); $('plinks').hidden = !$('plinks').innerHTML;
    APP.fit($('play'));
    speak(askLine(), PAUSE.ask);
  }
  function choose(it, el) {
    if (locked) return;
    if (it !== target && el) { const now = Date.now(); if (+(el.dataset.cool || 0) > now) return; el.dataset.cool = now + RULES.cooldown; }
    const U = APP.ui();
    if (it === target) {
      locked = true; APP.streak++; APP.addStar();
      weights[wk(it)] = Math.max(0, (weights[wk(it)] || 0) - 1); store.set('w', weights);
      if (el) el.classList.add('right');
      const big = APP.stars % RULES.bigEvery === 0;
      let said;
      if (big) {
        APP.celebrate(el, true); sfx.fanfare();
        said = speak(APP.t(U.wow, { n: APP.stars }), PAUSE.praise);
      } else { APP.celebrate(el, true); said = speak(APP.t(U.cheer, { cheer: U.cheers[Math.random() * U.cheers.length | 0], name: target.name }), PAUSE.answer); }
      const tok = ++roundTok;
      Promise.all([said, wait(big ? RULES.nextBig : RULES.next)]).then(() => wait(RULES.settle)).then(() => { if (tok === roundTok && APP.screen() === 'play' && locked) newRound(); });
    } else {
      APP.streak = 0;
      if (!round.missed) { round.missed = true; weights[wk(target)] = Math.min(RULES.maxWeight, (weights[wk(target)] || 0) + 1); store.set('w', weights); }
      sfx.wrong();
      if (el) { el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong'); }
      speak(APP.t(U.wrong, { thats: APP.t(U.thats, it.thats), ask: askLine() }), PAUSE.answer);
    }
  }
  onTap('ask', () => { if (target) speak(askLine()); });
  onTapIn('choices', '.bub', b => { const it = opts.find(o => o.id === b.dataset.id); if (it) choose(it, b); });
  VIEW('play', {
    el: 'play',
    show() { if (keep && target) draw(); else { target = null; newRound(); } keep = false; },
    leave() { roundTok++; },
    resize() { if (target) APP.fit($('play')); },
    line: () => target ? askLine() : null,
    beforeLang() { return { target: !locked && target && target.id, opts: opts.map(o => o.id) }; },
    afterLang(s) {
      if (!s || !s.target) return;
      const p = pool(), t = p.find(x => x.id === s.target); if (!t) return;
      const kept = s.opts.map(id => p.find(x => x.id === id)).filter(Boolean), o = [];
      for (const x of kept) if (x === t || fits(x, t, o.concat(t))) o.push(x);
      if (!o.includes(t)) o.push(t);
      for (const x of shuffle(p)) if (o.length < s.opts.length && fits(x, t, o)) o.push(x);
      target = t; opts = kept.filter(x => o.includes(x)).concat(o.filter(x => !kept.includes(x)));
      if (round.lower && !t.lower) round.lower = false;
      if (round.subject && !(t.members || []).some(m => m.id === round.subject)) round.subject = pickSubject(t);
      keep = true;
    },
    reset() { target = null; },
    choices: () => opts,
    select(it) { choose(it, document.querySelector(`.bub[data-id="${CSS.escape(it.id)}"]`)); },
    state: () => ({ target, opts, round }), newRound, choose
  });
})();
