{
  const CLEAN = [{ id: 'germ' }, { id: 'soap', ex: 'water hand' }, { id: 'water', ex: 'soap' }, { id: 'toothbrush', ex: 'tooth' }];
  const IMMUNE = [{ id: 'germ' }, { id: 'blood' }, { id: 'fever' }, { id: 'vaccine' }, { id: 'bandage' }];
  MODULE('health', {
    section: 'disc', ages: [3, 12],
    build(code) {
      const s = this.strings[code];
      return { clean: CONTENT.set(code, CLEAN, { say: s.clean }), immune: CONTENT.set(code, IMMUNE, { say: s.immune }) };
    },
    check(code, S, s, report) {
      for (const [k, spec] of [['clean', CLEAN], ['immune', IMMUNE]]) { const miss = spec.filter(e => !(s[k] || {})[e.id]).map(e => e.id); if (miss.length) report(`${k}.${miss.join(', ')} missing`); }
    },
    tiles: [
      { id: 'clean', icon: '🧼', view: 'card', items: S => S.clean, ages: [3, 6], search: true, game: { type: 'find', prompts: ['voice'], ask: () => 'where' } },
      { id: 'immune', icon: '🦠', view: 'card', items: S => S.immune, ages: [7, 12], search: true, game: { type: 'find', prompts: ['voice'], ask: it => 'which.' + it.concept } }
    ]
  });
}
