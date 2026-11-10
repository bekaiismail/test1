import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, ConciergeBell, DoorOpen, HelpCircle, Home, Moon, Settings as SettingsIcon, Sunrise, Volume2, VolumeX } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Door } from './components/Door'
import { EventScene } from './components/EventScene'
import { GuestBook, HowToPlay, ScareWarning, SettingsPanel } from './components/Overlays'
import { LIE_REMARKS, MORNING_REMARKS, NIGHT_INTROS, ROUND_REMARKS, SPECIAL_REMARKS } from './data/concierge'
import { ALL_FRAGMENTS, getEvent } from './data/events'
import { RESIDENT_IDS, RESIDENTS } from './data/residents'
import { audio } from './game/audio'
import { applyOutcome, finishNight, generateRound, newRun, RULES, specialDoor } from './game/engine'
import { createRng, initialSeed, pick } from './game/rng'
import { defaultSave, loadSave, writeSave } from './game/storage'
import type { DoorSpec, GameEvent, RunState, SaveData, ScareLevel, Settings } from './types'

type Screen = 'menu' | 'hallway' | 'event' | 'morning'
type Overlay = 'none' | 'warning' | 'howto' | 'settings' | 'guestbook'

interface ActiveEvent {
  event: GameEvent
  door: DoorSpec
  newFragment: boolean
}

export default function App() {
  const [save, setSave] = useState<SaveData>(loadSave)
  const [screen, setScreen] = useState<Screen>('menu')
  const [overlay, setOverlay] = useState<Overlay>('none')
  const [run, setRun] = useState<RunState>(newRun)
  const [doors, setDoors] = useState<DoorSpec[]>([])
  const [remark, setRemark] = useState('')
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [active, setActive] = useState<ActiveEvent | null>(null)
  const [justEnded, setJustEnded] = useState(false)

  const rng = useRef(createRng(initialSeed()))
  const roundId = useRef(0)
  const settings = save.settings
  const reduced = settings.reducedMotion

  // Persist progress and keep the audio engine in step with the settings.
  useEffect(() => writeSave(save), [save])
  useEffect(() => audio.apply(settings), [settings])

  // Count play time while the tab is visible and the player is past the menu.
  const screenRef = useRef(screen)
  screenRef.current = screen
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (screenRef.current !== 'menu' && document.visibilityState === 'visible') {
        setSave((s) => ({ ...s, stats: { ...s.stats, playtimeMs: s.stats.playtimeMs + 5000 } }))
      }
    }, 5000)
    return () => window.clearInterval(timer)
  }, [])

  const updateSettings = (next: Settings) => setSave((s) => ({ ...s, settings: next }))

  /** Put the next set of doors in the hallway, or end the night. */
  const deal = useCallback((currentSave: SaveData, currentRun: RunState, forcedRemark?: string) => {
    roundId.current += 1
    if (currentRun.opened >= RULES.nightLength) {
      const special = currentRun.specialDone ? null : specialDoor(currentSave, roundId.current)
      if (!special) {
        setSave(finishNight(currentSave, currentRun))
        const lastId = currentRun.recentEvents[currentRun.recentEvents.length - 1]
        setJustEnded(lastId !== undefined && getEvent(lastId).kind === 'ending')
        setScreen('morning')
        return
      }
      setDoors([special])
      setRemark(getEvent(special.eventId).kind === 'ending' ? SPECIAL_REMARKS.ending : SPECIAL_REMARKS.chapter)
    } else {
      setDoors(generateRound(rng.current, currentSave, currentRun, roundId.current))
      setRemark(forcedRemark ?? pick(Math.random, ROUND_REMARKS))
    }
    setOpeningId(null)
    setScreen('hallway')
  }, [])

  const startNight = (currentSave: SaveData) => {
    audio.unlock()
    audio.startMusic()
    const fresh = newRun(run)
    setRun(fresh)
    setActive(null)
    deal(currentSave, fresh, pick(Math.random, NIGHT_INTROS))
  }

  const pressPlay = () => {
    audio.unlock()
    audio.play('click')
    if (!save.warned) setOverlay('warning')
    else startNight(save)
  }

  const acceptWarning = (scare: ScareLevel) => {
    const next = { ...save, warned: true, settings: { ...save.settings, scare } }
    setSave(next)
    setOverlay('none')
    startNight(next)
  }

  const chooseDoor = (door: DoorSpec) => {
    if (openingId) return
    setOpeningId(door.id)
    audio.play('creak')
    window.setTimeout(
      () => {
        const outcome = applyOutcome(save, run, door)
        setSave(outcome.save)
        setRun(outcome.run)
        setActive({ event: getEvent(door.eventId), door, newFragment: outcome.newFragment })
        setScreen('event')
      },
      reduced ? 250 : 950,
    )
  }

  const backToHallway = () => {
    const lied = active?.door.lied && !active.door.special
    setActive(null)
    deal(save, run, lied ? pick(Math.random, LIE_REMARKS) : undefined)
  }

  const goToMenu = () => {
    audio.stopMusic()
    setActive(null)
    setScreen('menu')
  }

  const resetProgress = () => {
    const fresh = { ...defaultSave(), settings: save.settings, warned: save.warned }
    setSave(fresh)
    goToMenu()
    setOverlay('none')
  }

  const toolbar = (
    <div className="flex shrink-0 items-center gap-1 min-[380px]:gap-1.5">
      <IconButton label="Guest Book" onClick={() => setOverlay('guestbook')}>
        <BookOpen className="h-5 w-5" />
      </IconButton>
      <IconButton label={settings.muted ? 'Unmute' : 'Mute'} onClick={() => updateSettings({ ...settings, muted: !settings.muted })}>
        {settings.muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </IconButton>
      <IconButton label="Settings" onClick={() => setOverlay('settings')}>
        <SettingsIcon className="h-5 w-5" />
      </IconButton>
    </div>
  )

  return (
    <div className="min-h-dvh font-body text-cream">
      <AnimatePresence mode="wait">
        {screen === 'menu' && (
          <Menu key="menu" save={save} reduced={reduced} toolbar={toolbar} onPlay={pressPlay} onHowTo={() => setOverlay('howto')} onGuestBook={() => setOverlay('guestbook')} onSettings={() => setOverlay('settings')} />
        )}
        {screen === 'hallway' && (
          <Hallway key="hallway" save={save} run={run} doors={doors} remark={remark} openingId={openingId} reduced={reduced} toolbar={toolbar} onChoose={chooseDoor} onMenu={goToMenu} />
        )}
        {screen === 'event' && active && <EventScene key={`event-${active.door.id}`} event={active.event} door={active.door} newFragment={active.newFragment} settings={settings} onContinue={backToHallway} />}
        {screen === 'morning' && <Morning key="morning" save={save} run={run} ended={justEnded} reduced={reduced} onAgain={() => startNight(save)} onGuestBook={() => setOverlay('guestbook')} onMenu={goToMenu} />}
      </AnimatePresence>

      <AnimatePresence>
        {overlay === 'warning' && <ScareWarning key="warning" settings={settings} onStart={acceptWarning} />}
        {overlay === 'howto' && <HowToPlay key="howto" onClose={() => setOverlay('none')} />}
        {overlay === 'settings' && <SettingsPanel key="settings" settings={settings} onChange={updateSettings} onReset={resetProgress} onClose={() => setOverlay('none')} />}
        {overlay === 'guestbook' && <GuestBook key="guestbook" save={save} onClose={() => setOverlay('none')} />}
      </AnimatePresence>
    </div>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="ghost-btn flex h-10 w-10 shrink-0 items-center justify-center min-[380px]:h-11 min-[380px]:w-11">
      {children}
    </button>
  )
}

// ── Main menu ──────────────────────────────────────────────────────

const MENU_DOORS = ['#e58aa8', '#2b2531', '#d9a441', '#3f7d5c', '#3a5f9c', '#b8433b', '#e58aa8']

function Menu({
  save,
  reduced,
  toolbar,
  onPlay,
  onHowTo,
  onGuestBook,
  onSettings,
}: {
  save: SaveData
  reduced: boolean
  toolbar: React.ReactNode
  onPlay: () => void
  onHowTo: () => void
  onGuestBook: () => void
  onSettings: () => void
}) {
  const returning = save.stats.doors > 0
  return (
    <motion.main className="wallpaper relative flex min-h-dvh flex-col overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="relative z-10 flex justify-end p-3">{toolbar}</div>

      {/* a hallway of doors drifting past */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[84px] h-[38dvh] overflow-hidden opacity-55" aria-hidden="true">
        <motion.div className="absolute bottom-0 flex h-full items-end gap-[7vw]" animate={reduced ? { x: 0 } : { x: ['0%', '-50%'] }} transition={reduced ? { duration: 0 } : { duration: 44, repeat: Infinity, ease: 'linear' }}>
          {[...MENU_DOORS, ...MENU_DOORS].map((color, i) => (
            <div key={i} className="relative aspect-[10/19] h-[86%] shrink-0 rounded-t-md border-4 border-b-0 border-[#1c1024]" style={{ background: `linear-gradient(100deg, ${color}, #1c1024 160%)` }}>
              <div className="absolute right-[10%] top-[55%] h-[6%] w-[12%] rounded-full bg-brass" />
              <div className="absolute left-1/2 top-[10%] h-[9%] w-[40%] -translate-x-1/2 rounded-sm bg-brass/80" />
            </div>
          ))}
        </motion.div>
      </div>
      <div className="skirting absolute inset-x-0 bottom-[70px] h-[14px]" />
      <div className="carpet absolute inset-x-0 bottom-0 h-[70px]" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-start px-5 pt-[4dvh] text-center">
        <motion.div initial={reduced ? {} : { y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
          <p className="text-xs font-extrabold uppercase tracking-[0.34em] text-brass">The Hallway presents</p>
          <h1 className="font-display text-[clamp(3.2rem,15vw,7rem)] font-bold leading-[0.9] text-cream drop-shadow-[0_6px_0_rgba(0,0,0,0.35)]">
            Pick <span className="italic text-brass">a</span> Door
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-lg italic text-muted">“You have two choices. Or three. Or five. Good luck.”</p>
        </motion.div>

        <div className="mt-7 flex w-full max-w-xs flex-col gap-3">
          <button type="button" className="brass-btn flex items-center justify-center gap-2 px-8 py-4 text-xl" onClick={onPlay}>
            <DoorOpen className="h-6 w-6" aria-hidden="true" />
            {returning ? `Begin night ${save.stats.nights + 1}` : 'Play'}
          </button>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" className="ghost-btn flex flex-col items-center gap-1 !rounded-2xl px-1 py-2.5 text-xs font-bold leading-tight" onClick={onHowTo}>
              <HelpCircle className="h-5 w-5" aria-hidden="true" /> How to play
            </button>
            <button type="button" className="ghost-btn flex flex-col items-center gap-1 !rounded-2xl px-1 py-2.5 text-xs font-bold leading-tight" onClick={onGuestBook}>
              <BookOpen className="h-5 w-5" aria-hidden="true" /> Guest Book
            </button>
            <button type="button" className="ghost-btn flex flex-col items-center gap-1 !rounded-2xl px-1 py-2.5 text-xs font-bold leading-tight" onClick={onSettings}>
              <SettingsIcon className="h-5 w-5" aria-hidden="true" /> Settings
            </button>
          </div>
          {returning && (
            <p className="text-sm text-muted">
              {save.fragments.length} of {ALL_FRAGMENTS.length} fragments found
              {save.endingSeen ? ' · checked out' : ''}
            </p>
          )}
        </div>
      </div>
    </motion.main>
  )
}

// ── The hallway: pick a door ───────────────────────────────────────

function Hallway({
  save,
  run,
  doors,
  remark,
  openingId,
  reduced,
  toolbar,
  onChoose,
  onMenu,
}: {
  save: SaveData
  run: RunState
  doors: DoorSpec[]
  remark: string
  openingId: string | null
  reduced: boolean
  toolbar: React.ReactNode
  onChoose: (door: DoorSpec) => void
  onMenu: () => void
}) {
  const special = doors.length === 1 && doors[0].special
  const roundKey = doors[0]?.id ?? 'empty'
  return (
    <motion.main className="wallpaper relative flex min-h-dvh flex-col overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.3 }}>
      <header className="relative z-10 flex items-center justify-between gap-1.5 p-2.5 sm:p-3">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <IconButton label="Leave to the menu" onClick={onMenu}>
            <Home className="h-5 w-5" />
          </IconButton>
          <div>
            <p className="flex items-center gap-1.5 font-display text-lg font-semibold leading-none">
              <Moon className="h-4 w-4 text-brass" aria-hidden="true" /> Night {save.stats.nights + 1}
            </p>
            <div className="mt-1.5 flex gap-1" role="img" aria-label={`${Math.min(run.opened, RULES.nightLength)} of ${RULES.nightLength} doors opened tonight`}>
              {Array.from({ length: RULES.nightLength }, (_, i) => (
                <span key={i} className={`h-2 w-2.5 rounded-sm min-[380px]:w-3.5 ${i < run.opened ? 'bg-brass' : 'bg-cream/20'}`} />
              ))}
            </div>
          </div>
        </div>
        {toolbar}
      </header>

      {/* the Concierge */}
      <div className="relative z-10 mx-auto mt-1 flex w-full max-w-xl items-start gap-3 px-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-brass bg-night text-brass shadow-lg">
          <ConciergeBell className="h-6 w-6" aria-hidden="true" />
        </span>
        <AnimatePresence mode="wait">
          <motion.p
            key={roundKey}
            className="relative rounded-2xl rounded-tl-sm border border-brass/40 bg-night/85 px-4 py-2.5 text-[15px] leading-snug shadow-lg sm:text-base"
            initial={{ opacity: 0, x: reduced ? 0 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            aria-live="polite"
          >
            <span className="mb-0.5 block text-[10px] font-extrabold uppercase tracking-[0.18em] text-brass">The Concierge</span>
            {remark}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* the doors */}
      <div className="relative z-10 flex flex-1 items-end justify-center px-3 pb-[78px] pt-4">
        <div key={roundKey} className={`flex flex-wrap items-end justify-center gap-x-[clamp(8px,3vw,34px)] gap-y-2 ${special ? '' : 'max-w-5xl'}`} data-testid="doors">
          {doors.map((door, i) => (
            <Door key={door.id} door={door} index={i} count={doors.length} open={openingId === door.id} disabled={openingId !== null} dimmed={openingId !== null && openingId !== door.id} reduced={reduced} onChoose={() => onChoose(door)} />
          ))}
        </div>
      </div>

      <div className="skirting absolute inset-x-0 bottom-[64px] h-[14px]" />
      <div className="carpet absolute inset-x-0 bottom-0 h-[64px]" />
      <p className="absolute inset-x-0 bottom-5 z-10 text-center text-sm font-bold text-cream/85">{special ? 'One door left tonight.' : 'Read the plaques. Then pick a door.'}</p>
    </motion.main>
  )
}

// ── Morning: the night is over ─────────────────────────────────────

function Morning({ save, run, ended, reduced, onAgain, onGuestBook, onMenu }: { save: SaveData; run: RunState; ended: boolean; reduced: boolean; onAgain: () => void; onGuestBook: () => void; onMenu: () => void }) {
  const [remark] = useState(() => pick(Math.random, MORNING_REMARKS))
  const found = ALL_FRAGMENTS.filter((f) => run.fragmentsTonight.includes(f.id))
  const pendingChapter = RESIDENT_IDS.find((id) => save.threads[id] >= RULES.stages && !save.chapters[id])
  const allChapters = RESIDENT_IDS.every((id) => save.chapters[id])

  let hint = 'Finish a resident’s three-part story and their chapter door appears at the end of a night.'
  if (ended || save.endingSeen) hint = 'You have checked out. The Hallway stays open; the residents are always in.'
  else if (allChapters) hint = 'All four chapters are complete. Tomorrow night ends with a door that has no plaque.'
  else if (pendingChapter) hint = `${RESIDENTS[pendingChapter].name} have more to say. Their chapter door waits at the end of tomorrow night.`

  return (
    <motion.main
      className="flex min-h-dvh flex-col items-center justify-center px-5 py-8"
      style={{ background: 'linear-gradient(180deg, #2a1838 0%, #6b3b5a 45%, #e8a36a 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.6 }}
    >
      <div className="w-full max-w-md">
        <div className="text-center">
          <Sunrise className="mx-auto h-10 w-10 text-brass" aria-hidden="true" />
          <h1 className="font-display text-4xl font-bold">{ended ? 'Checked out' : `Night ${save.stats.nights} is over`}</h1>
          <p className="mt-2 italic text-cream/85">“{remark}”</p>
        </div>

        <div className="paper mt-5 rounded-2xl p-4 shadow-xl">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-carpet">Found tonight</h2>
          {found.length > 0 ? (
            <ul className="mt-1.5 space-y-1">
              {found.map((f) => (
                <li key={f.id} className="font-display text-lg font-semibold leading-tight">
                  {f.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-sm">Nothing new for the Guest Book. The residents enjoyed the company anyway.</p>
          )}

          <h2 className="mt-4 text-xs font-extrabold uppercase tracking-[0.16em] text-carpet">Stories</h2>
          <ul className="mt-1.5 space-y-1.5">
            {RESIDENT_IDS.map((id) => (
              <li key={id} className="flex items-center gap-2 text-sm font-bold">
                <span className="w-32 shrink-0">{RESIDENTS[id].name}</span>
                <span className="flex flex-1 gap-1" role="img" aria-label={`${save.threads[id]} of ${RULES.stages} parts${save.chapters[id] ? ', chapter complete' : ''}`}>
                  {Array.from({ length: RULES.stages + 1 }, (_, i) => {
                    const filled = i < RULES.stages ? i < save.threads[id] : save.chapters[id]
                    return <span key={i} className="h-2.5 flex-1 rounded-full" style={{ background: filled ? RESIDENTS[id].color : 'rgba(36,21,47,0.15)' }} />
                  })}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-snug opacity-85">{hint}</p>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <button type="button" className="brass-btn flex items-center justify-center gap-2 px-8 py-3.5 text-lg" onClick={onAgain}>
            <Moon className="h-5 w-5" aria-hidden="true" /> Stay another night
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" className="ghost-btn flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold" onClick={onGuestBook}>
              <BookOpen className="h-4 w-4" aria-hidden="true" /> Guest Book
            </button>
            <button type="button" className="ghost-btn flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold" onClick={onMenu}>
              <Home className="h-4 w-4" aria-hidden="true" /> Main menu
            </button>
          </div>
        </div>
      </div>
    </motion.main>
  )
}
