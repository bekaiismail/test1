export type ResidentId = 'hasbeens' | 'reflection' | 'unfinished' | 'nonsense'

export type ScareLevel = 'full' | 'mild' | 'off'

export type SfxId =
  | 'creak'
  | 'blip'
  | 'quack'
  | 'cluck'
  | 'squawk'
  | 'scare'
  | 'boo'
  | 'rumble'
  | 'pop'
  | 'glitch'
  | 'chime'
  | 'sadTrombone'
  | 'laugh'
  | 'tick'
  | 'click'
  | 'fanfare'
  | 'whoosh'

/** Full-screen effects a line of dialogue can trigger. */
export type FxId = 'jumpscare' | 'shake' | 'dark' | 'confetti' | 'crash' | 'glow'

export type VisualId =
  | 'potato'
  | 'dancer'
  | 'parrot'
  | 'mirror'
  | 'halfMonster'
  | 'bedShadow'
  | 'teeth'
  | 'duck'
  | 'chickenChase'
  | 'crash'
  | 'trio'
  | 'duckMirror'
  | 'potatoMonster'
  | 'ending'

export type Speaker = 'resident' | 'concierge' | 'you' | 'narrator'

export interface Line {
  who: Speaker
  text: string
  /** Sound played when the line appears. */
  sfx?: SfxId
  /** Screen effect played when the line appears. */
  fx?: FxId
  /** Tells the visual component which pose/state to show from this line on. */
  pose?: string
}

export interface Fragment {
  id: string
  title: string
  text: string
}

export interface Interaction {
  /** Button label shown after the main lines. */
  label: string
  /** Lines played after the player presses the button. */
  response: Line[]
}

export type EventKind = 'story' | 'crossover' | 'chapter' | 'ending'

export interface GameEvent {
  id: string
  resident: ResidentId
  kind: EventKind
  /** Story thread position (1-3) for kind === 'story'. */
  stage?: 1 | 2 | 3
  title: string
  description: string
  visual: VisualId
  rarity: 'common' | 'rare'
  /** Shown the first time the event is met. */
  lines: Line[]
  /** Short alternative scenes used when the event is met again. One is picked at random. */
  echoes?: Line[][]
  interaction?: Interaction
  /** Lore dropped into the Guest Book the first time the event is met. */
  fragment: Fragment
  /** Minimum thread stage per resident before this event can appear (crossovers). */
  requires?: Partial<Record<ResidentId, number>>
  /** True if the event contains a jumpscare, so scare settings apply. */
  intense?: boolean
}

export interface Resident {
  id: ResidentId
  name: string
  /** One-line identity shown in the Guest Book. */
  tagline: string
  /** What the plaque symbol is called in help text. */
  sigil: string
  color: string
  glow: string
}

export interface Settings {
  master: number
  music: number
  sfx: number
  muted: boolean
  scare: ScareLevel
  reducedMotion: boolean
}

export interface Stats {
  doors: number
  nights: number
  visits: Record<ResidentId, number>
  rare: number
  liesExposed: number
  playtimeMs: number
  /** Finished a night without meeting the Unfinished. */
  luckyEscape: boolean
  /** Met the Unfinished three times in one night. */
  unluckyOne: boolean
}

export interface SaveData {
  version: number
  /** Story stage reached per resident, 0-3. */
  threads: Record<ResidentId, number>
  chapters: Record<ResidentId, boolean>
  endingSeen: boolean
  /** Fragment ids collected, in order. */
  fragments: string[]
  seenEvents: string[]
  stats: Stats
  settings: Settings
  /** The scare warning has been shown and answered. */
  warned: boolean
}

/** A door as generated for one round. */
export interface DoorSpec {
  id: string
  /** Index into the cosmetic door styles. Never related to what is inside. */
  style: number
  /** Who is really behind the door. */
  actual: ResidentId
  /** Whose symbol the plaque shows. */
  plaque: ResidentId
  lied: boolean
  /** The Concierge's tell: a lying plaque sometimes hangs crooked. */
  crooked: boolean
  eventId: string
  /** The event has been met before, so an echo scene plays. */
  echo: boolean
  /** Chapter and ending doors carry no plaque. */
  special?: boolean
}

/** State of the current night. Not persisted. */
export interface RunState {
  /** Doors opened so far tonight. */
  opened: number
  recentEvents: string[]
  recentResidents: ResidentId[]
  /** A lie was exposed tonight, so the Concierge lies more. */
  rattled: boolean
  unfinishedTonight: number
  fragmentsTonight: string[]
  specialDone: boolean
}
