// ====== COLOURS ======
// { id, hex, pics (3 things of that colour), <lang>: name }. Add a language = add its key to every row.
ABC.colors = [
  { id: 'red', hex: '#e53935', pics: '🍎🍓🚒', en: 'red', ro: 'roșu', de: 'Rot' },
  { id: 'blue', hex: '#1e88e5', pics: '🫐💧🦋', en: 'blue', ro: 'albastru', de: 'Blau' },
  { id: 'yellow', hex: '#fdd835', pics: '🍌🐤🌻', en: 'yellow', ro: 'galben', de: 'Gelb' },
  { id: 'green', hex: '#43a047', pics: '🥒🐸🍃', en: 'green', ro: 'verde', de: 'Grün' },
  { id: 'orange', hex: '#fb8c00', pics: '🍊🥕🎃', en: 'orange', ro: 'portocaliu', de: 'Orange' },
  { id: 'purple', hex: '#8e24aa', pics: '🍇🍆🔮', en: 'purple', ro: 'mov', de: 'Lila' },
  { id: 'pink', hex: '#f48fb1', pics: '🐷🌸🦩', en: 'pink', ro: 'roz', de: 'Rosa' },
  { id: 'brown', hex: '#8d6e63', pics: '🐻🌰🍫', en: 'brown', ro: 'maro', de: 'Braun' },
  { id: 'black', hex: '#111111', pics: '🐈‍⬛🎩🎱', en: 'black', ro: 'negru', de: 'Schwarz' },
  { id: 'white', hex: '#f5f5f5', pics: '☁️⛄🐑', en: 'white', ro: 'alb', de: 'Weiß' },
  // The rainbow is learn-only (not one colour → not in "Find the colour"). Its bands are tappable parts.
  { id: 'rainbow', concept: '🌈', pics: '🌈🌦️☔', en: 'rainbow', ro: 'curcubeu', de: 'Regenbogen', noPlay: true, parts: 'rainbow' }
];

// Rainbow bands, outside → inside (ROGVAIV, as taught in school)
ABC.rainbow = [
  { hex: '#e53935', en: 'red', ro: 'roșu', de: 'Rot' },
  { hex: '#fb8c00', en: 'orange', ro: 'oranj', de: 'Orange' },
  { hex: '#fdd835', en: 'yellow', ro: 'galben', de: 'Gelb' },
  { hex: '#43a047', en: 'green', ro: 'verde', de: 'Grün' },
  { hex: '#1e88e5', en: 'blue', ro: 'albastru', de: 'Blau' },
  { hex: '#3949ab', en: 'indigo', ro: 'indigo', de: 'Indigo' },
  { hex: '#8e24aa', en: 'violet', ro: 'violet', de: 'Violett' }
];
