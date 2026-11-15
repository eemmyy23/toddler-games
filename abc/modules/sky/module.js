{
  const SKY = [{ id: 'sun', ex: 'day', sound: 'sun' }, { id: 'moon', ex: 'night', sound: 'night' }, { id: 'star', ex: 'night', sound: 'night' }, { id: 'earth', ex: 'house tree' },
    { id: 'day', ex: 'sun ball', sound: 'sun' }, { id: 'night', ex: 'moon star', sound: 'night' }, { id: 'rocket', ex: 'star moon' }];
  MODULE('sky', {
    section: 'disc', ages: [3, 6],
    build(code) { return { sky: CONTENT.set(code, SKY, this.strings[code]) }; },
    tiles: [
      { id: 'sky', icon: '🌙', view: 'card', items: S => S.sky, index: true, search: true,
        game: { type: 'find', prompts: ['voice'], ask: () => 'where' } }
    ]
  });
}
