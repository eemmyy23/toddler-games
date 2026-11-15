{
  const SKY = [{ id: 'sun', ex: 'day' }, { id: 'moon', ex: 'night' }, { id: 'star', ex: 'night' }, { id: 'earth', ex: 'house tree' },
    { id: 'day', ex: 'sun ball' }, { id: 'night', ex: 'moon star' }, { id: 'rocket', ex: 'star moon' }];
  MODULE('sky', {
    section: 'disc', ages: [3, 6],
    build(code) { return { sky: CONTENT.set(code, SKY, this.strings[code]) }; },
    tiles: [
      { id: 'sky', icon: '🌙', view: 'card', items: S => S.sky, index: true, search: true,
        game: { type: 'find', prompts: ['voice'], ask: () => 'where' } }
    ]
  });
}
