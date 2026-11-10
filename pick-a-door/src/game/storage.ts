import type { SaveData } from '../types'

const KEY = 'pick-a-door/save'
/** Bump when the save shape changes, and add a step in `migrate`. */
export const SAVE_VERSION = 1

export function defaultSave(): SaveData {
  const prefersReduced =
    typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return {
    version: SAVE_VERSION,
    threads: { hasbeens: 0, reflection: 0, unfinished: 0, nonsense: 0 },
    chapters: { hasbeens: false, reflection: false, unfinished: false, nonsense: false },
    endingSeen: false,
    fragments: [],
    seenEvents: [],
    stats: {
      doors: 0,
      nights: 0,
      visits: { hasbeens: 0, reflection: 0, unfinished: 0, nonsense: 0 },
      rare: 0,
      liesExposed: 0,
      playtimeMs: 0,
      luckyEscape: false,
      unluckyOne: false,
    },
    settings: { master: 0.8, music: 0.5, sfx: 0.8, muted: false, scare: prefersReduced ? 'mild' : 'full', reducedMotion: prefersReduced },
    warned: false,
  }
}

/** Fill any missing fields from defaults so older or damaged saves still load. */
function migrate(raw: unknown): SaveData {
  const base = defaultSave()
  if (!raw || typeof raw !== 'object') return base
  const data = raw as Partial<SaveData>
  return {
    ...base,
    ...data,
    version: SAVE_VERSION,
    threads: { ...base.threads, ...data.threads },
    chapters: { ...base.chapters, ...data.chapters },
    fragments: Array.isArray(data.fragments) ? data.fragments : [],
    seenEvents: Array.isArray(data.seenEvents) ? data.seenEvents : [],
    stats: { ...base.stats, ...data.stats, visits: { ...base.stats.visits, ...data.stats?.visits } },
    settings: { ...base.settings, ...data.settings },
  }
}

export function loadSave(): SaveData {
  try {
    const text = window.localStorage.getItem(KEY)
    if (!text) return defaultSave()
    return migrate(JSON.parse(text))
  } catch {
    // Private mode, blocked storage or corrupt data: start fresh, the game still works.
    return defaultSave()
  }
}

export function writeSave(save: SaveData): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(save))
  } catch {
    // Storage unavailable; progress lasts for this visit only.
  }
}

export function clearSave(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
