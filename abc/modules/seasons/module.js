{
  const SEASONS = [{ id: 'spring', ex: 'flower bee butterfly' }, { id: 'summer', ex: 'sun ice-cream watermelon' },
    { id: 'autumn', ex: 'leaf pumpkin grape' }, { id: 'winter', ex: 'snow sled scarf' }];
  MODULE('seasons', {
    section: 'disc', ages: [3, 6],
    build(code) { return { seasons: CONTENT.set(code, SEASONS, this.strings[code]) }; },
    tiles: [
      { id: 'seasons', icon: '🌷', view: 'card', items: S => S.seasons, index: true, search: true,
        game: { type: 'find', prompts: ['voice'], ask: it => 'when.' + it.id } }
    ]
  });
}
