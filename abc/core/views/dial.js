(function () {
  const GRIP = { tap: 16, near: 28, reach: 2, weight: 8, center: 1.5, outside: 17, half: 16 };
  let pos = 0, active = 0, grab = null, keep = false, bound = false;
  const release = () => { grab = null; if ($('dface')) $('dface').classList.remove('drag'); };
  const cur = () => APP.items()[APP.idx];
  const D = () => cur().dial;
  const mod = (a, n) => ((a % n) + n) % n;
  const turn = (a, b) => mod(b - a + 180, 360) - 180;
  const angle = (h, p) => mod(p / h.turn * 360, 360);
  const value = () => mod(grab && grab.moved ? grab.start + grab.k * D().hands[grab.i].snap : pos, D().cycle);
  const read = () => D().read(value());
  const spin = h => `rotate(${(pos / h.turn * 360).toFixed(2)}deg)`;
  function polar(e) {
    const r = $('dface').getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    return { deg: mod(Math.atan2(x, -y) * 180 / Math.PI, 360), r: Math.hypot(x, y) / (r.width / 2) * GRIP.half };
  }
  function paint() {
    const d = D(), r = read();
    document.querySelectorAll('#dface .dhand').forEach((g, i) => { g.style.transform = spin(d.hands[i]); g.classList.toggle('held', i === active); });
    const t = $('dtime'), html = esc(r.text);
    if (t.dataset.v !== html) { t.dataset.v = html; t.innerHTML = html; t.setAttribute('aria-label', r.name); APP.fitText(t); }
    $('dface').setAttribute('aria-valuetext', r.name);
    $('dsay').textContent = r.name;
    APP.backdrop(r.backdrop);
  }
  const say = () => speak(read().say, PAUSE.line);
  function pick(q) {
    const hands = D().hands, score = h => Math.abs(turn(angle(h, pos), q.deg)) + Math.max(0, q.r - h.len - GRIP.reach) * GRIP.weight;
    const best = hands.reduce((b, h, k) => score(h) < score(hands[b]) ? k : b, 0);
    return Math.abs(turn(angle(hands[best], pos), q.deg)) < GRIP.near ? best : active;
  }
  function down(e) {
    if (grab || !e.target.closest('#dface')) return;
    const q = polar(e); if (q.r > GRIP.outside) return;
    e.preventDefault(); APP.stop();
    grab = { id: e.pointerId, i: pick(q), x: e.clientX, y: e.clientY, deg: q.deg, start: pos, k: 0, moved: false, q };
    try { $('dface').setPointerCapture(e.pointerId); } catch (x) {}
  }
  function move(e) {
    if (!grab || e.pointerId !== grab.id) return;
    if (!grab.moved) { if (Math.hypot(e.clientX - grab.x, e.clientY - grab.y) < GRIP.tap) return; grab.moved = true; active = grab.i; $('dface').classList.add('drag'); }
    const q = polar(e); if (q.r < GRIP.center) return;
    const h = D().hands[grab.i];
    pos += turn(grab.deg, q.deg) / 360 * h.turn; grab.deg = q.deg;
    const k = Math.round((pos - grab.start) / h.snap);
    if (k !== grab.k) { grab.k = k; sfx.tick(); }
    paint();
  }
  function up(e, cancel) {
    if (!grab || e.pointerId !== grab.id) return;
    const g = grab, hands = D().hands; release();
    if (!g.moved && !cancel && g.q.r < GRIP.center * 2) { say(); return; }
    if (g.moved) pos = g.start + g.k * hands[g.i].snap;
    else if (cancel) return;
    else if (g.i !== active) active = g.i;
    else { const h = hands[active], base = pos - mod(pos, h.snap); pos += Math.round(turn(angle(h, base), g.q.deg) / 360 * h.turn / h.snap) * h.snap; }
    sfx.pop(); paint(); if (!cancel) say();
  }
  function nudge(dir, size) { if (grab) return; const t = D().step; APP.stop(); pos = Math.round(pos / t) * t + dir * (size || t); sfx.pop(); paint(); say(); }
  function refresh() { APP.links(cur(), $('dlinks'), true); paint(); APP.fit($('dial')); APP.shown(); }
  function bind() {
    if (bound) return; bound = true;
    const el = $('dial');
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', e => up(e, false));
    el.addEventListener('pointercancel', e => up(e, true));
    onTapIn(el, '#dless', () => nudge(-1));
    onTapIn(el, '#dmore', () => nudge(1));
    onTapIn(el, '#dtime', b => { APP.celebrate(b); say(); });
    el.addEventListener('keydown', e => {
      if (!e.target.closest('#dface')) return;
      const dir = { ArrowUp: 1, ArrowDown: -1, PageUp: 1, PageDown: -1 }[e.key], hands = D().hands;
      if (dir) { e.preventDefault(); e.stopPropagation(); nudge(dir, hands[active].snap); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); active = (active + 1) % hands.length; sfx.pop(); paint(); }
    });
  }
  VIEW('dial', {
    el: 'dial', arrows: true,
    show(sayIt) {
      APP.stop(); bind(); release();
      const it = cur(), d = it.dial;
      if (!keep) pos = it.at; keep = false;
      $('dial').innerHTML = `<div class="dial" id="dface" role="slider" tabindex="0"><svg viewBox="0 0 32 32" aria-hidden="true">${d.face}${d.hands.map((h, i) => `<g transform="translate(16 16)"><g class="dhand" data-i="${i}" style="transform:${spin(h)}"><g transform="translate(-16 -16)">${h.body}</g></g></g>`).join('')}${d.cap}</svg></div>` +
        `<div class="dinfo"><div class="dctl"><button class="rbtn dstep" id="dless" aria-label="${esc(d.aria.less)}">${APP.icon('less')}</button>` +
        `<button class="pill dtime" id="dtime"></button><button class="rbtn dstep" id="dmore" aria-label="${esc(d.aria.more)}">${APP.icon('more')}</button></div>` +
        `<div class="label dsay" id="dsay"></div><div id="dlinks" class="links"></div></div>`;
      refresh();
      if (sayIt) say();
    },
    step(dir) {
      APP.stop(); release(); APP.step(dir); sfx.pop();
      const it = cur(), d = it.dial; let diff = mod(it.at - value(), d.cycle); if (diff > d.cycle / 2) diff -= d.cycle;
      pos += diff;
      refresh(); say();
    },
    line: () => read().say,
    leave() { release(); },
    resize() { APP.fitText($('dtime')); APP.fit($('dial')); },
    reset() { keep = false; active = 0; },
    beforeLang: () => ({ pos, active }),
    afterLang(s) { if (s) { pos = s.pos; active = s.active; keep = true; } },
    state: () => ({ value: value(), active, pos })
  });
})();
