import { CROSSOVERS, ENDING, chapterEvent, getEvent, storyEvent } from '../data/events'
import { RESIDENT_IDS } from '../data/residents'
import type { DoorSpec, GameEvent, ResidentId, RunState, SaveData } from '../types'
import { pick, pickWeighted, type Rng } from './rng'

/**
 * THE CONCIERGE (expectation engine)
 *
 * Rule-based, no AI. Every number that shapes the experience is in RULES so it
 * can be tuned in one place and checked by the tests in engine.test.ts.
 */
export const RULES = {
  /** Doors opened per night before the night ends (or a special door appears). */
  nightLength: 8,
  /** Chance of each door count per round. */
  doorCounts: [
    [2, 0.5],
    [3, 0.3],
    [4, 0.15],
    [5, 0.05],
  ] as const,
  /** The same event is never offered again within this many opened doors. */
  repeatWindow: 4,
  /** A resident's weight halves for each appearance in this many recent doors. */
  residentWindow: 3,
  /** Chance a plaque tells the truth. */
  truthBase: 0.75,
  /** Chance a plaque tells the truth for the rest of a night once a lie was exposed. */
  truthRattled: 0.5,
  /** Chance that a lying plaque hangs crooked (the learnable tell). */
  tellRate: 0.6,
  /** Chance a door holds a rare crossover when one is available. */
  crossoverRate: 0.05,
  /** Number of cosmetic door styles. */
  doorStyles: 6,
  /** Story stages per resident. */
  stages: 3,
} as const

/** Start a night. Recent history carries over so the repeat rules also hold across nights. */
export function newRun(previous?: RunState): RunState {
  return {
    opened: 0,
    recentEvents: previous?.recentEvents ?? [],
    recentResidents: previous?.recentResidents ?? [],
    rattled: false,
    unfinishedTonight: 0,
    fragmentsTonight: [],
    specialDone: false,
  }
}

export function pickDoorCount(rng: Rng): number {
  let roll = rng()
  for (const [count, chance] of RULES.doorCounts) {
    roll -= chance
    if (roll < 0) return count
  }
  return 2
}

/** Base weight 1 each, halved per appearance in the recent window. */
export function residentWeights(recent: readonly ResidentId[]): Record<ResidentId, number> {
  const window = recent.slice(-RULES.residentWindow)
  const weights = {} as Record<ResidentId, number>
  for (const id of RESIDENT_IDS) {
    const seen = window.filter((x) => x === id).length
    weights[id] = Math.pow(0.5, seen)
  }
  return weights
}

function requirementsMet(ev: GameEvent, save: SaveData): boolean {
  if (!ev.requires) return true
  return RESIDENT_IDS.every((id) => save.threads[id] >= (ev.requires?.[id] ?? 0))
}

/**
 * Decide which event sits behind a door belonging to `resident`.
 * `taken` holds event ids already placed on other doors this round.
 */
export function pickEvent(
  rng: Rng,
  resident: ResidentId,
  save: SaveData,
  run: RunState,
  taken: ReadonlySet<string>,
): { eventId: string; echo: boolean; repeat: boolean } {
  const recent = run.recentEvents.slice(-RULES.repeatWindow)
  const blocked = (id: string) => recent.includes(id) || taken.has(id)

  // Rare crossover.
  const crossovers = CROSSOVERS.filter((e) => e.resident === resident && requirementsMet(e, save) && !blocked(e.id))
  if (crossovers.length > 0 && rng() < RULES.crossoverRate) {
    const ev = pick(rng, crossovers)
    return { eventId: ev.id, echo: save.seenEvents.includes(ev.id), repeat: false }
  }

  // Next unseen chapter of this resident's story.
  const stage = save.threads[resident]
  if (stage < RULES.stages) {
    const next = storyEvent(resident, stage + 1)
    if (next && !taken.has(next.id)) return { eventId: next.id, echo: false, repeat: false }
  }

  // Otherwise revisit something already met, avoiding recent repeats.
  const seen: GameEvent[] = []
  for (let s = 1; s <= Math.min(stage, RULES.stages); s++) {
    const ev = storyEvent(resident, s)
    if (ev) seen.push(ev)
  }
  const fresh = seen.filter((e) => !blocked(e.id))
  if (fresh.length > 0) return { eventId: pick(rng, fresh).id, echo: true, repeat: false }

  // Everything is recent: take the least recently shown one.
  if (seen.length > 0) {
    const sorted = [...seen].sort((a, b) => run.recentEvents.lastIndexOf(a.id) - run.recentEvents.lastIndexOf(b.id))
    return { eventId: sorted[0].id, echo: true, repeat: true }
  }
  // Brand-new resident whose first event is already on another door this round.
  const first = storyEvent(resident, 1)!
  return { eventId: first.id, echo: false, repeat: true }
}

/** Build the doors for one round. */
export function generateRound(rng: Rng, save: SaveData, run: RunState, roundId: number): DoorSpec[] {
  const count = pickDoorCount(rng)
  const truthChance = run.rattled ? RULES.truthRattled : RULES.truthBase
  const weights = residentWeights(run.recentResidents)
  const available = [...RESIDENT_IDS]
  const taken = new Set<string>()
  const doors: DoorSpec[] = []

  for (let i = 0; i < count; i++) {
    // Prefer a different resident behind each door; with five doors one repeats.
    // A resident whose only available events were shown too recently is passed over.
    const candidates = available.length > 0 ? [...available] : [...RESIDENT_IDS]
    let actual = candidates[0]
    let choice = pickEvent(rng, actual, save, run, taken)
    while (candidates.length > 0) {
      actual = pickWeighted(rng, weights, candidates)
      choice = pickEvent(rng, actual, save, run, taken)
      if (!choice.repeat) break
      candidates.splice(candidates.indexOf(actual), 1)
    }
    // Nobody left who would not repeat a recent event: hang one door fewer this round.
    if (choice.repeat && doors.length >= 2) continue
    const idx = available.indexOf(actual)
    if (idx >= 0) available.splice(idx, 1)

    const { eventId, echo } = choice
    taken.add(eventId)

    const honest = rng() < truthChance
    const plaque = honest ? actual : pick(rng, RESIDENT_IDS.filter((r) => r !== actual))
    const crooked = !honest && rng() < RULES.tellRate

    doors.push({
      id: `r${roundId}-d${i}`,
      style: Math.floor(rng() * RULES.doorStyles),
      actual,
      plaque,
      lied: !honest,
      crooked,
      eventId,
      echo,
    })
  }
  return doors
}

/** The special door at the end of a night, if one is due. */
export function specialDoor(save: SaveData, roundId: number): DoorSpec | null {
  const pending = RESIDENT_IDS.find((id) => save.threads[id] >= RULES.stages && !save.chapters[id])
  if (pending) {
    const ev = chapterEvent(pending)
    return { id: `r${roundId}-special`, style: 0, actual: pending, plaque: pending, lied: false, crooked: false, eventId: ev.id, echo: false, special: true }
  }
  const allDone = RESIDENT_IDS.every((id) => save.chapters[id])
  if (allDone && !save.endingSeen) {
    return { id: `r${roundId}-special`, style: 0, actual: ENDING.resident, plaque: ENDING.resident, lied: false, crooked: false, eventId: ENDING.id, echo: false, special: true }
  }
  return null
}

export interface Outcome {
  save: SaveData
  run: RunState
  /** True when the event's fragment was collected just now. */
  newFragment: boolean
}

/** Apply the result of opening a door. Pure: returns new save and run objects. */
export function applyOutcome(save: SaveData, run: RunState, door: DoorSpec): Outcome {
  const ev = getEvent(door.eventId)
  const firstTime = !save.seenEvents.includes(ev.id)
  const newFragment = !save.fragments.includes(ev.fragment.id)

  const threads = { ...save.threads }
  if (ev.kind === 'story' && ev.stage && ev.stage > threads[ev.resident]) threads[ev.resident] = ev.stage

  const chapters = { ...save.chapters }
  if (ev.kind === 'chapter') chapters[ev.resident] = true

  const stats = {
    ...save.stats,
    doors: save.stats.doors + 1,
    visits: { ...save.stats.visits, [door.actual]: save.stats.visits[door.actual] + 1 },
    rare: save.stats.rare + (ev.rarity === 'rare' ? 1 : 0),
    liesExposed: save.stats.liesExposed + (door.lied ? 1 : 0),
  }

  const unfinishedTonight = run.unfinishedTonight + (door.actual === 'unfinished' && !door.special ? 1 : 0)
  if (unfinishedTonight >= 3) stats.unluckyOne = true

  const nextSave: SaveData = {
    ...save,
    threads,
    chapters,
    endingSeen: save.endingSeen || ev.kind === 'ending',
    seenEvents: firstTime ? [...save.seenEvents, ev.id] : save.seenEvents,
    fragments: newFragment ? [...save.fragments, ev.fragment.id] : save.fragments,
    stats,
  }

  const nextRun: RunState = {
    ...run,
    opened: run.opened + (door.special ? 0 : 1),
    recentEvents: [...run.recentEvents, ev.id].slice(-12),
    recentResidents: [...run.recentResidents, door.actual].slice(-12),
    rattled: run.rattled || door.lied,
    unfinishedTonight,
    fragmentsTonight: newFragment ? [...run.fragmentsTonight, ev.fragment.id] : run.fragmentsTonight,
    specialDone: run.specialDone || !!door.special,
  }

  return { save: nextSave, run: nextRun, newFragment }
}

/** Close out a night: count it and award the night-based stamps. */
export function finishNight(save: SaveData, run: RunState): SaveData {
  return {
    ...save,
    stats: {
      ...save.stats,
      nights: save.stats.nights + 1,
      luckyEscape: save.stats.luckyEscape || (run.opened >= RULES.nightLength && run.unfinishedTonight === 0),
    },
  }
}
