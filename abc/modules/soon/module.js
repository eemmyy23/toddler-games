// ====== PLACEHOLDERS — planned subjects, shown as "coming soon" (never in the Little profile) ======
// When a subject is built it becomes its own module folder and its line here is removed.
// Each tile carries its own target age (from docs/ROADMAP.md); the age badge and the profile filter use it.
MODULE('soon', {
  ages: [4, 12],
  tiles: [
    { id: 'teens', icon: '🔟', section: 'num', ages: [4, 7] }, { id: 'tens', icon: '💯', section: 'num', ages: [5, 8] },
    { id: 'big', icon: '✨', section: 'num', ages: [7, 12] }, { id: 'clock', icon: '⏰', section: 'num', ages: [5, 9] },
    { id: 'families', icon: '🐐', section: 'disc', ages: [2, 5] }, { id: 'seasons', icon: '🌷', section: 'disc', ages: [3, 6] },
    { id: 'weather', icon: '🌦️', section: 'disc', ages: [2, 6] }, { id: 'cats', icon: '🧩', section: 'disc', ages: [3, 6] }
  ]
});
