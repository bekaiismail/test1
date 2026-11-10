import { describe, expect, it } from 'vitest'
import { EVENTS, getEvent } from '../data/events'
import { RESIDENT_IDS } from '../data/residents'
import type { DoorSpec, ResidentId, RunState, SaveData } from '../types'
import { applyOutcome, finishNight, generateRound, newRun, pickDoorCount, residentWeights, RULES, specialDoor } from './engine'
import { createRng } from './rng'
import { defaultSave } from './storage'

const freshSave = (): SaveData => defaultSave()

/** Play whole nights, always choosing with `choose`, and report what happened. */
function simulate(seed: number, nights: number, choose: (doors: DoorSpec[], rng: () => number) => DoorSpec) {
  const rng = createRng(seed)
  let save = freshSave()
  const opened: DoorSpec[] = []
  const rounds: DoorSpec[][] = []
  let round = 0
  let run: RunState = newRun()
  for (let n = 0; n < nights; n++) {
    run = newRun(run)
    while (run.opened < RULES.nightLength) {
      const doors = generateRound(rng, save, run, ++round)
      rounds.push(doors)
      const door = choose(doors, rng)
      opened.push(door)
      ;({ save, run } = applyOutcome(save, run, door))
    }
    const special = specialDoor(save, ++round)
    if (special) {
      opened.push(special)
      ;({ save, run } = applyOutcome(save, run, special))
    }
    save = finishNight(save, run)
  }
  return { save, opened, rounds }
}

const first = (doors: DoorSpec[]) => doors[0]
const random = (doors: DoorSpec[], rng: () => number) => doors[Math.floor(rng() * doors.length)]

describe('event registry', () => {
  it('has at least 12 story events, three per resident, each with a fragment', () => {
    const story = EVENTS.filter((e) => e.kind === 'story')
    expect(story.length).toBeGreaterThanOrEqual(12)
    for (const id of RESIDENT_IDS) {
      const stages = story.filter((e) => e.resident === id).map((e) => e.stage).sort()
      expect(stages).toEqual([1, 2, 3])
    }
    for (const e of EVENTS) {
      expect(e.lines.length).toBeGreaterThan(0)
      expect(e.fragment.text.length).toBeGreaterThan(0)
    }
  })

  it('has unique event and fragment ids', () => {
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(EVENTS.length)
    expect(new Set(EVENTS.map((e) => e.fragment.id)).size).toBe(EVENTS.length)
  })
})

describe('door generation', () => {
  it('follows the 50/30/15/5 door-count distribution', () => {
    const rng = createRng(42)
    const counts: Record<number, number> = { 2: 0, 3: 0, 4: 0, 5: 0 }
    const N = 20000
    for (let i = 0; i < N; i++) counts[pickDoorCount(rng)]++
    expect(counts[2] / N).toBeCloseTo(0.5, 1)
    expect(counts[3] / N).toBeCloseTo(0.3, 1)
    expect(counts[4] / N).toBeCloseTo(0.15, 1)
    expect(counts[5] / N).toBeCloseTo(0.05, 1)
  })

  it('is reproducible from a seed', () => {
    const a = simulate(7, 3, first).opened.map((d) => d.eventId)
    const b = simulate(7, 3, first).opened.map((d) => d.eventId)
    expect(a).toEqual(b)
  })

  it('puts a different resident behind each door when there are four or fewer', () => {
    const { rounds } = simulate(11, 20, random)
    for (const doors of rounds.filter((d) => d.length <= 4)) {
      expect(new Set(doors.map((d) => d.actual)).size).toBe(doors.length)
    }
  })

  it('door style is independent of what is inside', () => {
    const { rounds } = simulate(5, 60, random)
    const byStyle: Record<number, Set<ResidentId>> = {}
    for (const d of rounds.flat()) (byStyle[d.style] ??= new Set()).add(d.actual)
    for (const residents of Object.values(byStyle)) expect(residents.size).toBe(RESIDENT_IDS.length)
  })
})

describe('the Concierge (expectation engine)', () => {
  it('halves a resident weight for each recent appearance', () => {
    const w = residentWeights(['nonsense', 'unfinished', 'unfinished', 'unfinished'])
    expect(w.unfinished).toBe(0.125)
    expect(w.nonsense).toBe(1) // outside the 3-door window
    expect(w.hasbeens).toBe(1)
  })

  it('tells the truth about 75% of the time until a lie is exposed, then about 50%', () => {
    const rng = createRng(99)
    const save = freshSave()
    const rate = (run: RunState) => {
      let honest = 0
      let total = 0
      for (let i = 0; i < 4000; i++) {
        for (const d of generateRound(rng, save, run, i)) {
          total++
          if (!d.lied) honest++
        }
      }
      return honest / total
    }
    expect(rate(newRun())).toBeCloseTo(RULES.truthBase, 1)
    expect(rate({ ...newRun(), rattled: true })).toBeCloseTo(RULES.truthRattled, 1)
  })

  it('only ever hangs lying plaques crooked, and about 60% of them', () => {
    const { rounds } = simulate(3, 200, random)
    const all = rounds.flat()
    expect(all.filter((d) => d.crooked && !d.lied)).toHaveLength(0)
    const lies = all.filter((d) => d.lied)
    expect(lies.length).toBeGreaterThan(100)
    expect(lies.filter((d) => d.crooked).length / lies.length).toBeCloseTo(RULES.tellRate, 1)
    for (const d of lies) expect(d.plaque).not.toBe(d.actual)
  })

  it('never shows an event that was shown in the last 4 doors, even across nights', () => {
    for (const seed of [21, 22, 23]) {
      for (const strategy of [random, first]) {
        const ids = simulate(seed, 60, strategy).opened.map((d) => d.eventId)
        let violations = 0
        for (let i = 1; i < ids.length; i++) {
          if (ids.slice(Math.max(0, i - RULES.repeatWindow), i).includes(ids[i])) violations++
        }
        expect(violations).toBe(0)
      }
    }
  })

  it('keeps the four residents roughly equal over a long run', () => {
    const { save } = simulate(8, 150, random)
    const visits = RESIDENT_IDS.map((id) => save.stats.visits[id])
    const total = visits.reduce((a, b) => a + b, 0)
    for (const v of visits) expect(v / total).toBeGreaterThan(0.2)
  })

  it('rare crossovers appear, but rarely', () => {
    const { opened } = simulate(13, 150, random)
    const cross = opened.filter((d) => getEvent(d.eventId).kind === 'crossover').length
    expect(cross).toBeGreaterThan(0)
    expect(cross / opened.length).toBeLessThan(0.06)
  })
})

describe('story progress', () => {
  it('advances a thread one stage per first visit and collects the fragment', () => {
    const rng = createRng(1)
    let save = freshSave()
    let run = newRun()
    const doors = generateRound(rng, save, run, 1)
    const door = doors[0]
    const out = applyOutcome(save, run, door)
    ;({ save, run } = out)
    expect(out.newFragment).toBe(true)
    expect(save.threads[door.actual]).toBe(1)
    expect(save.fragments).toHaveLength(1)
    expect(save.stats.doors).toBe(1)
    expect(run.opened).toBe(1)
  })

  it('marks the Concierge as rattled after a lie is exposed', () => {
    const save = freshSave()
    const lying: DoorSpec = { id: 'x', style: 0, actual: 'nonsense', plaque: 'hasbeens', lied: true, crooked: true, eventId: 'RANDOM_001', echo: false }
    const out = applyOutcome(save, newRun(), lying)
    expect(out.run.rattled).toBe(true)
    expect(out.save.stats.liesExposed).toBe(1)
  })

  it('offers a chapter door once a thread is complete, and the ending after all four', () => {
    const save = freshSave()
    expect(specialDoor(save, 1)).toBeNull()
    save.threads.nonsense = 3
    expect(specialDoor(save, 1)?.eventId).toBe('CHAPTER_NONSENSE')
    for (const id of RESIDENT_IDS) {
      save.threads[id] = 3
      save.chapters[id] = true
    }
    expect(specialDoor(save, 1)?.eventId).toBe('ENDING_001')
    save.endingSeen = true
    expect(specialDoor(save, 1)).toBeNull()
  })

  it('the whole story can be completed by playing, and play continues afterwards', () => {
    const { save } = simulate(2024, 30, random)
    expect(save.endingSeen).toBe(true)
    expect(save.fragments.length).toBeGreaterThanOrEqual(17)
    const more = simulate(2024, 40, random).save
    expect(more.stats.doors).toBeGreaterThan(save.stats.doors)
  })
})
