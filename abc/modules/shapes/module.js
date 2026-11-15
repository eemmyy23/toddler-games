{
  const SHAPES = [{ id: 'circle', ex: 'ball orange clock' }, { id: 'square', ex: 'gift box dice' }, { id: 'triangle', ex: 'pizza' },
    { id: 'star' }, { id: 'heart' }, { id: 'diamond', ex: 'kite' }];
  MODULE('shapes', {
    section: 'disc', ages: [2, 6],
    build(code) { return { shapes: CONTENT.set(code, SHAPES, this.strings[code]) }; },
    tiles: [
      { id: 'shapes', icon: '🔺', view: 'card', items: S => S.shapes, index: true, search: true,
        game: { type: 'find', prompts: ['voice'], ask: () => 'where' } }
    ]
  });
}
