import { motion } from 'framer-motion'
import { Check, Lock, RotateCcw, Stamp as StampIcon, Volume2, VolumeX, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ALL_FRAGMENTS } from '../data/events'
import { RESIDENT_IDS, RESIDENTS } from '../data/residents'
import { STAMPS } from '../data/stamps'
import { RULES } from '../game/engine'
import type { SaveData, ScareLevel, Settings } from '../types'
import { SIGILS } from './Door'

function Modal({ title, onClose, children, wide = false }: { title: string; onClose?: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
    if (!onClose) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`paper flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl shadow-2xl outline-none sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
        initial={{ y: 30 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink/15 px-5 py-3">
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-ink/10">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </motion.div>
    </motion.div>
  )
}

// ── Scare options (shared by the warning and the settings) ─────────

const SCARE_OPTIONS: { id: ScareLevel; title: string; text: string }[] = [
  { id: 'full', title: 'Full', text: 'Sudden lunges, one bright flash, loud sounds.' },
  { id: 'mild', title: 'Mild', text: 'Lunges without the flash, and much quieter.' },
  { id: 'off', title: 'Off', text: 'Monsters fade in politely. Same story, no shocks.' },
]

function ScarePicker({ value, onChange }: { value: ScareLevel; onChange: (v: ScareLevel) => void }) {
  return (
    <div role="radiogroup" aria-label="Scare intensity" className="grid gap-2">
      {SCARE_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="radio"
          aria-checked={value === opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex items-start gap-3 rounded-xl border-2 px-3 py-2 text-left transition-colors ${value === opt.id ? 'border-carpet bg-carpet/10' : 'border-ink/15 hover:border-ink/40'}`}
        >
          <span className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${value === opt.id ? 'border-carpet bg-carpet text-cream' : 'border-ink/40'}`}>
            {value === opt.id && <Check className="h-3 w-3" strokeWidth={4} />}
          </span>
          <span>
            <span className="block font-bold">{opt.title}</span>
            <span className="block text-sm opacity-80">{opt.text}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

export function ScareWarning({ settings, onStart }: { settings: Settings; onStart: (scare: ScareLevel) => void }) {
  const [scare, setScare] = useState<ScareLevel>(settings.scare)
  return (
    <Modal title="Before you go in">
      <p className="mb-3 leading-relaxed">
        Some doors hide <strong>sudden scares</strong>, a screen flash and loud noises. Choose how strong you want them. You can change this at any time in Settings.
      </p>
      <ScarePicker value={scare} onChange={setScare} />
      <button type="button" className="brass-btn mt-4 w-full px-6 py-3 text-lg" onClick={() => onStart(scare)}>
        Enter the Hallway
      </button>
    </Modal>
  )
}

// ── How to play ────────────────────────────────────────────────────

export function HowToPlay({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="How to play" onClose={onClose}>
      <ol className="list-decimal space-y-2.5 pl-5 leading-relaxed">
        <li>
          Each round the Concierge shows you <strong>two to five doors</strong>. Pick one.
        </li>
        <li>
          Every door has a brass <strong>plaque</strong> showing who lives behind it. The Concierge hung them, and the Concierge sometimes lies.
        </li>
        <li>
          Each resident has a <strong>story in three parts</strong>. Visit them to hear the next part and collect a fragment for your Guest Book.
        </li>
        <li>
          A night is <strong>{RULES.nightLength} doors</strong>. Finish a resident’s story and a chapter door appears at the end of the night.
        </li>
        <li>Finish all four chapters to find the door with no plaque.</li>
      </ol>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {RESIDENT_IDS.map((id) => {
          const Sigil = SIGILS[id]
          return (
            <div key={id} className="flex items-center gap-2 rounded-lg border border-ink/15 px-2.5 py-2">
              <span className="flex h-8 w-9 shrink-0 items-center justify-center rounded-sm border border-[#7d5720] bg-[linear-gradient(160deg,#f6d993,#c9973f)]">
                <Sigil className="h-5 w-5 text-[#3a2508]" />
              </span>
              <span className="text-sm font-bold leading-tight">{RESIDENTS[id].name}</span>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

// ── Settings ───────────────────────────────────────────────────────

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-3">
      <span className="w-28 text-sm font-bold">{label}</span>
      <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" />
      <span className="w-10 text-right text-sm tabular-nums">{Math.round(value * 100)}%</span>
    </label>
  )
}

export function SettingsPanel({ settings, onChange, onReset, onClose }: { settings: Settings; onChange: (s: Settings) => void; onReset: () => void; onClose: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const set = (patch: Partial<Settings>) => onChange({ ...settings, ...patch })
  return (
    <Modal title="Settings" onClose={onClose}>
      <section className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-carpet">Sound</h3>
        <Slider label="Master volume" value={settings.master} onChange={(master) => set({ master })} />
        <Slider label="Music" value={settings.music} onChange={(music) => set({ music })} />
        <Slider label="Sound effects" value={settings.sfx} onChange={(sfx) => set({ sfx })} />
        <button type="button" onClick={() => set({ muted: !settings.muted })} aria-pressed={settings.muted} className="flex items-center gap-2 rounded-full border-2 border-ink/25 px-4 py-1.5 text-sm font-bold hover:border-ink/50">
          {settings.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          {settings.muted ? 'Muted — tap to unmute' : 'Mute all sound'}
        </button>
      </section>

      <section className="mt-5 space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-carpet">Scares</h3>
        <ScarePicker value={settings.scare} onChange={(scare) => set({ scare })} />
      </section>

      <section className="mt-5 space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-carpet">Motion</h3>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-5 w-5 accent-[#8c2f39]" checked={settings.reducedMotion} onChange={(e) => set({ reducedMotion: e.target.checked })} />
          <span>
            <span className="block font-bold">Reduce motion</span>
            <span className="block text-sm opacity-80">No shaking, flashing, looping animation or typing effect.</span>
          </span>
        </label>
      </section>

      <section className="mt-6 border-t border-ink/15 pt-4">
        {confirming ? (
          <div className="rounded-xl border-2 border-carpet bg-carpet/10 p-3">
            <p className="font-bold">Erase all progress?</p>
            <p className="text-sm opacity-80">Your Guest Book, stamps and story progress will be deleted. Settings are kept.</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="rounded-full bg-carpet px-4 py-1.5 text-sm font-bold text-cream"
                onClick={() => {
                  onReset()
                  setConfirming(false)
                }}
              >
                Yes, erase it
              </button>
              <button type="button" className="rounded-full border-2 border-ink/25 px-4 py-1.5 text-sm font-bold" onClick={() => setConfirming(false)}>
                Keep it
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="flex items-center gap-2 text-sm font-bold text-carpet underline-offset-2 hover:underline" onClick={() => setConfirming(true)}>
            <RotateCcw className="h-4 w-4" /> Erase progress and start over
          </button>
        )}
      </section>
    </Modal>
  )
}

// ── Guest Book: story progress, fragments, stamps, numbers ─────────

function formatTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return h > 0 ? `${h} h ${m} min` : `${m} min`
}

type Tab = 'story' | 'stamps' | 'numbers'

export function GuestBook({ save, onClose }: { save: SaveData; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('story')
  const earned = STAMPS.filter((s) => s.earned(save)).length
  const tabs: { id: Tab; label: string }[] = [
    { id: 'story', label: `Story ${save.fragments.length}/${ALL_FRAGMENTS.length}` },
    { id: 'stamps', label: `Stamps ${earned}/${STAMPS.length}` },
    { id: 'numbers', label: 'Numbers' },
  ]
  const extras = ALL_FRAGMENTS.filter((f) => f.kind === 'crossover' || f.kind === 'ending')

  const fragmentRow = (f: (typeof ALL_FRAGMENTS)[number]) => {
    const have = save.fragments.includes(f.id)
    return (
      <li key={f.id} className={`rounded-lg border px-3 py-2 ${have ? 'border-ink/20 bg-white/40' : 'border-dashed border-ink/20 opacity-60'}`}>
        {have ? (
          <>
            <p className="font-display font-semibold">{f.title}</p>
            <p className="text-sm leading-snug">{f.text}</p>
          </>
        ) : (
          <p className="flex items-center gap-2 text-sm">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Not found yet
          </p>
        )}
      </li>
    )
  }

  return (
    <Modal title="Guest Book" onClose={onClose} wide>
      <div role="tablist" className="mb-4 flex gap-1 rounded-full bg-ink/10 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-full px-2 py-1.5 text-sm font-bold transition-colors ${tab === t.id ? 'bg-ink text-cream' : 'hover:bg-ink/10'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'story' && (
        <div className="space-y-5">
          {RESIDENT_IDS.map((id) => {
            const res = RESIDENTS[id]
            const Sigil = SIGILS[id]
            const stage = save.threads[id]
            return (
              <section key={id}>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-10 shrink-0 items-center justify-center rounded-sm border border-[#7d5720] bg-[linear-gradient(160deg,#f6d993,#c9973f)]">
                    <Sigil className="h-5 w-5 text-[#3a2508]" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-xl font-semibold leading-tight">{res.name}</h3>
                    <p className="text-sm opacity-75">{res.tagline}</p>
                  </div>
                  <div className="flex items-center gap-1" aria-label={`Story ${stage} of ${RULES.stages}${save.chapters[id] ? ', chapter complete' : ''}`}>
                    {Array.from({ length: RULES.stages }, (_, i) => (
                      <span key={i} className={`h-3 w-3 rounded-full border-2 border-ink/50 ${i < stage ? 'bg-ink' : ''}`} />
                    ))}
                    <span className={`ml-1 h-4 w-4 rotate-45 border-2 border-carpet ${save.chapters[id] ? 'bg-carpet' : ''}`} />
                  </div>
                </div>
                <ul className="mt-2 space-y-1.5">{ALL_FRAGMENTS.filter((f) => f.resident === id && (f.kind === 'story' || f.kind === 'chapter')).map(fragmentRow)}</ul>
              </section>
            )
          })}
          <section>
            <h3 className="font-display text-xl font-semibold">Odds and ends</h3>
            <p className="text-sm opacity-75">Rare visits, and whatever is behind the last door.</p>
            <ul className="mt-2 space-y-1.5">{extras.map(fragmentRow)}</ul>
          </section>
        </div>
      )}

      {tab === 'stamps' && (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {STAMPS.map((stamp) => {
            const have = stamp.earned(save)
            return (
              <li key={stamp.id} className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2 ${have ? 'border-carpet bg-carpet/10' : 'border-dashed border-ink/25 opacity-70'}`}>
                <StampIcon className={`h-7 w-7 shrink-0 ${have ? '-rotate-12 text-carpet' : 'text-ink/40'}`} aria-hidden="true" />
                <span>
                  <span className="block font-bold leading-tight">{stamp.title}</span>
                  <span className="block text-sm opacity-80">{stamp.hint}</span>
                </span>
                {have && <span className="sr-only">Earned</span>}
              </li>
            )
          })}
        </ul>
      )}

      {tab === 'numbers' && (
        <dl className="grid grid-cols-2 gap-2">
          {[
            ['Doors opened', save.stats.doors],
            ['Nights stayed', save.stats.nights],
            ['Has-Been visits', save.stats.visits.hasbeens],
            ['Reflection visits', save.stats.visits.reflection],
            ['Unfinished visits', save.stats.visits.unfinished],
            ['Nonsense visits', save.stats.visits.nonsense],
            ['Rare events', save.stats.rare],
            ['Plaque lies exposed', save.stats.liesExposed],
            ['Time in the Hallway', formatTime(save.stats.playtimeMs)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-ink/15 bg-white/40 px-3 py-2">
              <dt className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</dt>
              <dd className="font-display text-2xl font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Modal>
  )
}
