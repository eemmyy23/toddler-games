const WEATHER = [
  { id: 'sun', ex: 'cap sunglasses' }, { id: 'rain', ex: 'umbrella boots' }, { id: 'snow', ex: 'gloves scarf sled' },
  { id: 'cloud', ex: 'jacket' }, { id: 'wind', ex: 'kite jacket' }, { id: 'storm', ex: 'house' }, { id: 'rainbow', ex: 'rain sun' }
];
MODULE('weather', {
  section: 'disc', ages: [2, 6],
  build(code) { return { weather: CONTENT.set(code, WEATHER, this.strings[code]) }; },
  tiles: [
    { id: 'weather', icon: '🌦️', view: 'card', items: S => S.weather, index: true, search: true,
      game: { type: 'find', prompts: ['voice'], ask: () => 'where' } }
  ]
});
