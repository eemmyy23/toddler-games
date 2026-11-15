{
  const BODY = [{ id: 'eye', ex: 'glasses' }, { id: 'ear' }, { id: 'nose', ex: 'flower' }, { id: 'mouth', ex: 'apple' }, { id: 'tooth' },
    { id: 'tongue', ex: 'ice-cream' }, { id: 'hand', ex: 'gloves' }, { id: 'arm' }, { id: 'foot', ex: 'sock shoe' }];
  MODULE('body', {
    section: 'disc', ages: [2, 5],
    build(code) { return { body: CONTENT.set(code, BODY, this.strings[code]) }; },
    tiles: [
      { id: 'body', icon: '👃', view: 'card', items: S => S.body, index: true, search: true,
        game: { type: 'find', prompts: ['voice'], ask: () => 'where' } }
    ]
  });
}
