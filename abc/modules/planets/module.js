{
  const PLANETS = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'].map(id => ({ id }));
  MODULE('planets', {
    section: 'disc', ages: [5, 9],
    build(code) { return { planets: CONTENT.set(code, PLANETS, this.strings[code]) }; },
    tiles: [
      { id: 'planets', icon: '🪐', view: 'card', items: S => S.planets, index: true, search: true,
        game: { type: 'find', prompts: ['voice'], ask: () => 'where' } }
    ]
  });
}
