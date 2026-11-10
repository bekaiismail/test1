import type { SaveData } from '../types'

/** Achievements, shown as passport-style stamps in the Guest Book. */
export interface Stamp {
  id: string
  title: string
  hint: string
  earned: (save: SaveData) => boolean
}

export const STAMPS: readonly Stamp[] = [
  { id: 'first-door', title: 'First Door', hint: 'Open one door.', earned: (s) => s.stats.doors >= 1 },
  { id: 'meme-hunter', title: 'Meme Hunter', hint: 'Visit the Has-Beens 8 times.', earned: (s) => s.stats.visits.hasbeens >= 8 },
  { id: 'fearless', title: 'Fearless Guest', hint: 'Visit the Unfinished 8 times.', earned: (s) => s.stats.visits.unfinished >= 8 },
  { id: 'mirror-victim', title: 'Mirror Victim', hint: 'Get insulted by the Reflection 8 times.', earned: (s) => s.stats.visits.reflection >= 8 },
  { id: 'duck-scholar', title: 'Duck Scholar', hint: 'Visit the Nonsense 8 times.', earned: (s) => s.stats.visits.nonsense >= 8 },
  { id: 'lie-detector', title: 'Lie Detector', hint: 'Open 5 doors whose plaques lied.', earned: (s) => s.stats.liesExposed >= 5 },
  { id: 'lucky-escape', title: 'Lucky Escape', hint: 'Finish a night without meeting the Unfinished.', earned: (s) => s.stats.luckyEscape },
  { id: 'unlucky-one', title: 'The Unlucky One', hint: 'Meet the Unfinished 3 times in one night.', earned: (s) => s.stats.unluckyOne },
  { id: 'rare-find', title: 'Rare Find', hint: 'See 3 rare events.', earned: (s) => s.stats.rare >= 3 },
  { id: 'regular', title: 'Regular', hint: 'Stay 5 nights.', earned: (s) => s.stats.nights >= 5 },
  { id: 'checked-out', title: 'Checked Out', hint: 'Open the unmarked door.', earned: (s) => s.endingSeen },
]
