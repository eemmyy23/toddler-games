{
  const CLEAN = [{ id: 'germ' }, { id: 'soap', ex: 'water hand' }, { id: 'water', ex: 'soap' }, { id: 'toothbrush', ex: 'tooth' }];
  const IMMUNE = [{ id: 'germ' }, { id: 'blood' }, { id: 'fever' }, { id: 'vaccine' }, { id: 'bandage' }];
  MODULE('health', {
    section: 'disc', ages: [3, 12],
    build(code) {
      const s = this.strings[code];
      return { clean: CONTENT.set(code, CLEAN, { say: s.clean }), immune: CONTENT.set(code, IMMUNE, { say: s.immune }) };
    },
    tiles: [
      { id: 'clean', icon: '🧼', view: 'card', items: S => S.clean, ages: [3, 6], index: true, search: true, game: { type: 'find', prompts: ['voice'], ask: () => 'where' } },
      { id: 'immune', icon: '🦠', view: 'card', items: S => S.immune, ages: [7, 12], index: true, search: true, game: { type: 'find', prompts: ['voice'], ask: it => 'which.' + it.concept } }
    ]
  });
}
