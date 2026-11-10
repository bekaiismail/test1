import type { Resident, ResidentId } from '../types'

export const RESIDENT_IDS: readonly ResidentId[] = ['hasbeens', 'reflection', 'unfinished', 'nonsense']

export const RESIDENTS: Record<ResidentId, Resident> = {
  hasbeens: {
    id: 'hasbeens',
    name: 'The Has-Beens',
    tagline: 'Jokes everyone stopped laughing at.',
    sigil: 'the masks',
    color: '#e8a13a',
    glow: '#ffd27a',
  },
  reflection: {
    id: 'reflection',
    name: 'The Reflection',
    tagline: 'A mirror image somebody walked away from.',
    sigil: 'the mirrored halves',
    color: '#7cc4d8',
    glow: '#c9f1fb',
  },
  unfinished: {
    id: 'unfinished',
    name: 'The Unfinished',
    tagline: 'Nightmares nobody finished dreaming.',
    sigil: 'the ghost',
    color: '#b0413e',
    glow: '#ff7a6b',
  },
  nonsense: {
    id: 'nonsense',
    name: 'The Nonsense',
    tagline: 'Ideas that never made sense. They only tell the truth.',
    sigil: 'the bird',
    color: '#8fbf5a',
    glow: '#d6f59a',
  },
}
