MSTRINGS('clock', 'en', {
  tiles: { clock: ['The clock', 'Find the time'], halves: ['Half past', 'Find half past'], setclock: ['Set the clock', 'Read the clock'] },
  games: { which: 'Which clock shows {name}?' },
  hourCycle: 'h12',
  hours: ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'],
  oclock: ["twelve o'clock", "one o'clock", "two o'clock", "three o'clock", "four o'clock", "five o'clock", "six o'clock", "seven o'clock",
           "eight o'clock", "nine o'clock", "ten o'clock", "eleven o'clock"],
  time: { m0: '{oclock}', m5: 'five past {h}', m10: 'ten past {h}', m15: 'quarter past {h}', m20: 'twenty past {h}', m25: 'twenty-five past {h}', m30: 'half past {h}',
          m35: 'twenty-five to {next}', m40: 'twenty to {next}', m45: 'quarter to {next}', m50: 'ten to {next}', m55: 'five to {next}' },
  parts: { night: 'at night', morning: 'in the morning', forenoon: 'in the morning', noon: 'at midday', lunch: 'in the afternoon', afternoon: 'in the afternoon', evening: 'in the evening' },
  less: 'Five minutes back', more: 'Five minutes on',
  when: '{time} {part}',
  say: '{when}. {what}',
  day: { h7: 'We wake up and stretch.', h8: 'We eat breakfast.', h9: 'We play at nursery.', h10: 'We eat some fruit.', h12: 'We have lunch.', h13: 'We have a rest.',
         h15: 'We play in the park.', h16: 'Time for a snack.', h18: 'We have dinner.', h19: 'We have a bath.', h20: 'We go to bed. The moon is out.', h0: 'Midnight. Everyone is asleep.' }
});
