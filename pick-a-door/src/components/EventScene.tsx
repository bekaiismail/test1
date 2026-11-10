import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MIRROR_INSULTS } from '../data/events'
import { RESIDENTS } from '../data/residents'
import { audio } from '../game/audio'
import { Visual } from '../scenes/visuals'
import type { DoorSpec, GameEvent, Line, Settings } from '../types'

interface Props {
  event: GameEvent
  door: DoorSpec
  newFragment: boolean
  settings: Settings
  onContinue: () => void
}

const SPEAKER_LABEL = { resident: '', concierge: 'The Concierge', you: 'You', narrator: '' } as const

function randomOf<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

/** Choose the lines for this visit: the full scene the first time, a short echo after that. */
function buildScript(event: GameEvent, door: DoorSpec): Line[] {
  const base = door.echo && event.echoes && event.echoes.length > 0 ? randomOf(event.echoes) : event.lines
  const lines = base.map((line) => ({ ...line, text: line.text.replace('{insult}', randomOf(MIRROR_INSULTS)) }))
  if (door.lied && !door.special) {
    const first = lines[0]
    lines.unshift({
      who: 'narrator',
      text: `The plaque promised ${RESIDENTS[door.plaque].name}. The plaque lied.`,
      pose: first?.pose,
      fx: first?.fx === 'dark' ? 'dark' : undefined,
    })
  }
  return lines
}

export function EventScene({ event, door, newFragment, settings, onContinue }: Props) {
  const resident = RESIDENTS[event.resident]
  const reduced = settings.reducedMotion
  const gentle = settings.scare === 'off'

  const [script, setScript] = useState<Line[]>(() => buildScript(event, door))
  const [index, setIndex] = useState(0)
  // Typed-character count is tied to its line so a new line never looks finished for a frame.
  const [typedState, setTypedState] = useState({ line: 0, count: 0 })
  const [interacted, setInteracted] = useState(!event.interaction || door.echo)
  const [flash, setFlash] = useState(false)
  const [shake, setShake] = useState(0)
  const [dark, setDark] = useState(false)
  const [glow, setGlow] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const nextRef = useRef<HTMLButtonElement>(null)

  const line = script[index]
  const typed = reduced ? line.text.length : typedState.line === index ? typedState.count : 0
  const setTyped = (count: number) => setTypedState({ line: index, count })
  const atEnd = index >= script.length - 1
  const fullyTyped = typed >= line.text.length
  const finished = atEnd && fullyTyped && interacted
  const awaitingInteraction = atEnd && fullyTyped && !interacted

  // The pose is whatever the most recent line asked for.
  const pose = useMemo(() => {
    for (let i = index; i >= 0; i--) if (script[i].pose) return script[i].pose!
    return 'idle'
  }, [index, script])

  // Play the sound and screen effect of each line as it appears.
  useEffect(() => {
    const current = script[index]
    if (current.fx === 'jumpscare') {
      audio.play('scare', settings.scare)
      setDark(false)
      if (settings.scare === 'full' && !reduced) setFlash(true)
      if (settings.scare !== 'off' && !reduced) setShake((s) => s + 1)
    } else if (current.sfx) {
      audio.play(current.sfx, settings.scare)
    }
    if (current.fx === 'dark') setDark(true)
    if (current.fx === 'shake' && !reduced && settings.scare !== 'off') setShake((s) => s + 1)
    if (current.fx === 'glow') {
      setDark(false)
      setGlow(true)
    }
    if (current.fx === 'confetti') setConfetti(true)
    // Only re-run when the line changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, script])

  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(false), 160)
    return () => window.clearTimeout(t)
  }, [flash])

  // Typewriter.
  useEffect(() => {
    if (fullyTyped) return
    const t = window.setTimeout(() => setTyped(typed + 2), 22)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed, fullyTyped, index])

  const advance = useCallback(() => {
    if (!fullyTyped) {
      setTyped(line.text.length)
      return
    }
    if (!atEnd) {
      audio.play('click')
      setIndex((i) => i + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullyTyped, atEnd, line.text.length, index])

  // The fake crash fixes itself; the player is never left on a "broken" screen.
  useEffect(() => {
    if (line.fx !== 'crash' || atEnd) return
    const t = window.setTimeout(() => setIndex((i) => i + 1), 4200)
    return () => window.clearTimeout(t)
  }, [line, atEnd])

  useEffect(() => {
    if (finished && newFragment) audio.play('chime')
  }, [finished, newFragment])

  useEffect(() => {
    nextRef.current?.focus()
    nextRef.current?.scrollIntoView({ block: 'nearest' })
  }, [index, finished, awaitingInteraction])

  const interact = () => {
    if (!event.interaction) return
    audio.play('click')
    const startAt = script.length
    setScript((s) => [...s, ...event.interaction!.response])
    setInteracted(true)
    setIndex(startAt)
  }

  const speaker = line.who === 'resident' ? resident.name : SPEAKER_LABEL[line.who]
  const speakerColor = line.who === 'resident' ? resident.glow : line.who === 'concierge' ? '#e8b65a' : '#b9a6c9'

  return (
    <motion.div
      className="relative flex h-dvh flex-col items-center overflow-hidden"
      style={{ background: `radial-gradient(ellipse at 50% 30%, ${resident.color}55, #150b1e 70%)` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.35 }}
    >
      {/* darkness for the Unfinished */}
      <motion.div className="pointer-events-none absolute inset-0 bg-[#05020a]" animate={{ opacity: dark ? 0.82 : 0 }} transition={{ duration: reduced ? 0 : 0.6 }} />
      {/* warm glow for resolutions */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 35%, rgba(255,233,168,0.5), transparent 65%)' }}
        animate={{ opacity: glow ? 1 : 0 }}
        transition={{ duration: reduced ? 0 : 1.5 }}
      />

      <motion.div
        key={shake}
        className="relative z-10 flex h-full w-full max-w-xl flex-col items-center overflow-y-auto px-4 pb-5 pt-4"
        animate={shake > 0 && !reduced ? { x: [0, -12, 11, -8, 6, -3, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
      >
        <header className="w-full text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: resident.glow }}>
            {event.kind === 'chapter' ? 'Chapter door' : event.kind === 'ending' ? 'The unmarked door' : event.rarity === 'rare' ? 'Rare visit' : resident.name}
          </p>
          <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">{event.title}</h1>
        </header>

        <div className="relative my-3 flex min-h-[130px] w-full flex-1 items-center justify-center">
          <div className="aspect-square h-full max-h-[min(46dvh,380px)]">
            <Visual id={event.visual} pose={pose} gentle={gentle} reduced={reduced} />
          </div>
          {confetti && !reduced && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              {Array.from({ length: 16 }, (_, i) => (
                <motion.span
                  key={i}
                  className="absolute top-0 block h-2.5 w-6 rounded-full bg-[#f6cf3e]"
                  style={{ left: `${(i * 37) % 100}%` }}
                  initial={{ y: -20, rotate: 0, opacity: 1 }}
                  animate={{ y: 420, rotate: 360 + i * 40, opacity: 0 }}
                  transition={{ duration: 1.6 + (i % 5) * 0.25, delay: (i % 4) * 0.1, ease: 'easeIn' }}
                />
              ))}
            </div>
          )}
        </div>

        {/* dialogue */}
        <div
          className="w-full shrink-0 rounded-2xl border border-brass/40 bg-[#150b1e]/90 p-4 shadow-xl backdrop-blur-sm"
          onClick={finished || awaitingInteraction ? undefined : advance}
          role="presentation"
        >
          {speaker && (
            <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.16em]" style={{ color: speakerColor }}>
              {speaker}
            </p>
          )}
          <p className={`min-h-[4.5em] text-[17px] leading-relaxed sm:text-lg ${line.who === 'narrator' ? 'italic text-cream/85' : 'text-cream'}`} aria-live="polite">
            <span aria-hidden="true">{line.text.slice(0, typed)}</span>
            <span className="sr-only">{line.text}</span>
          </p>

          <AnimatePresence>
            {finished && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="paper mt-3 rounded-xl p-3" data-testid="fragment-card">
                {newFragment ? (
                  <>
                    <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-carpet">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Added to the Guest Book
                    </p>
                    <p className="font-display text-lg font-semibold">{event.fragment.title}</p>
                    <p className="text-sm leading-snug">{event.fragment.text}</p>
                  </>
                ) : (
                  <p className="flex items-center gap-1.5 text-sm">
                    <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" /> You have been here before. Nothing new for the Guest Book.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-3 flex justify-end">
            {awaitingInteraction ? (
              <button ref={nextRef} type="button" className="brass-btn px-5 py-2.5 text-base" onClick={interact}>
                {event.interaction!.label}
              </button>
            ) : finished ? (
              <button ref={nextRef} type="button" className="brass-btn flex items-center gap-2 px-6 py-2.5 text-base" onClick={onContinue}>
                Back to the hallway <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                ref={nextRef}
                type="button"
                className="ghost-btn flex items-center gap-2 px-5 py-2 text-sm font-bold"
                onClick={(e) => {
                  e.stopPropagation()
                  advance()
                }}
              >
                {fullyTyped ? 'Next' : 'Skip'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* one single flash for a full-strength scare; never a strobe */}
      {flash && <div className="pointer-events-none absolute inset-0 z-20 bg-white/80" aria-hidden="true" />}
    </motion.div>
  )
}
