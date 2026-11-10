import { motion } from 'framer-motion'
import { Bird, Drama, FlipHorizontal2, Ghost, type LucideIcon } from 'lucide-react'
import { RESIDENTS } from '../data/residents'
import type { DoorSpec, ResidentId } from '../types'

export const SIGILS: Record<ResidentId, LucideIcon> = {
  hasbeens: Drama,
  reflection: FlipHorizontal2,
  unfinished: Ghost,
  nonsense: Bird,
}

/** Cosmetic only. A door's look never hints at what is inside. */
const STYLES = [
  { leaf: '#e58aa8', dark: '#b85c7c', arch: true },
  { leaf: '#2b2531', dark: '#17131b', arch: false },
  { leaf: '#d9a441', dark: '#a87523', arch: false },
  { leaf: '#3f7d5c', dark: '#285540', arch: true },
  { leaf: '#3a5f9c', dark: '#26406d', arch: false },
  { leaf: '#b8433b', dark: '#832a25', arch: true },
] as const

/** Door width by how many doors share the hallway, so every round fits a small phone. */
function widthClass(count: number): string {
  if (count >= 5) return 'w-[clamp(64px,min(22vw,12dvh),120px)] sm:w-[clamp(90px,min(15vw,19dvh),160px)]'
  if (count === 4) return 'w-[clamp(60px,min(20vw,19dvh),180px)]'
  return 'w-[clamp(82px,min(24vw,19dvh),190px)]'
}

interface Props {
  door: DoorSpec
  index: number
  /** Number of doors in this round. */
  count: number
  open: boolean
  disabled: boolean
  dimmed: boolean
  reduced: boolean
  onChoose: () => void
}

export function Door({ door, index, count, open, disabled, dimmed, reduced, onChoose }: Props) {
  const special = !!door.special
  const style = special ? { leaf: '#efe6d2', dark: '#c9bc9f', arch: false } : STYLES[door.style % STYLES.length]
  const resident = RESIDENTS[door.plaque]
  const inside = RESIDENTS[door.actual]
  const Sigil = SIGILS[door.plaque]
  const radius = style.arch ? '999px 999px 6px 6px / 38% 38% 6px 6px' : '8px 8px 4px 4px'
  const label = special ? 'The door with no plaque' : `Door ${index + 1}. The plaque shows ${resident.sigil}${door.crooked ? ', hanging crooked' : ''}.`

  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onChoose}
      className={`group relative flex flex-col items-center disabled:cursor-default ${widthClass(count)}`}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 26 }}
      animate={{ opacity: dimmed ? 0.35 : 1, y: 0 }}
      transition={{ delay: reduced ? 0 : index * 0.08, duration: 0.35 }}
      whileHover={disabled || reduced ? undefined : { y: -6 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
    >
      <div className="relative aspect-[10/19] w-full" style={{ perspective: 700 }}>
        {/* frame and what is behind the door */}
        <div
          className="absolute inset-0 border-[5px] border-b-0 border-[#1c1024] shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
          style={{
            borderRadius: radius,
            background: `radial-gradient(ellipse at 50% 60%, ${special ? '#fff6dc' : inside.glow}, ${special ? '#e8b65a' : inside.color} 55%, #0b0610 100%)`,
          }}
        />
        {/* the leaf */}
        <motion.div
          className="absolute inset-[5px] bottom-0 origin-left"
          style={{
            borderRadius: radius,
            background: `linear-gradient(100deg, ${style.leaf}, ${style.dark})`,
            boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.12), inset -8px 0 14px rgba(0,0,0,0.25)',
            transformStyle: 'preserve-3d',
          }}
          animate={{ rotateY: open ? -104 : 0 }}
          transition={{ duration: reduced ? 0.15 : 0.75, ease: [0.5, 0, 0.2, 1] }}
        >
          {/* panels */}
          <div className="absolute inset-x-[14%] top-[30%] h-[24%] rounded-sm border-2 border-black/20 bg-black/5" />
          <div className="absolute inset-x-[14%] top-[60%] h-[30%] rounded-sm border-2 border-black/20 bg-black/5" />
          {/* knob */}
          <div className="absolute right-[9%] top-[55%] h-[7%] w-[13%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff3c4,#e8b65a_45%,#8a5f1e)] shadow-md" />
          {/* plaque: the Concierge's clue */}
          {!special && (
            <div
              className="absolute left-1/2 top-[9%] flex aspect-[4/3] w-[46%] items-center justify-center rounded-[3px] border border-[#7d5720] bg-[linear-gradient(160deg,#f6d993,#c9973f)] shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
              style={{ transform: `translateX(-50%) rotate(${door.crooked ? (index % 2 === 0 ? 11 : -11) : 0}deg)` }}
              data-plaque={door.plaque}
              data-crooked={door.crooked ? 'true' : 'false'}
            >
              <span className="absolute -top-[3px] h-1 w-1 rounded-full bg-[#5a3d12]" />
              <Sigil className="h-[62%] w-[62%] text-[#3a2508]" strokeWidth={2.2} aria-hidden="true" />
            </div>
          )}
        </motion.div>
      </div>
      <span className="mt-2 font-display text-sm font-semibold tracking-wide text-brass/90 group-hover:text-brass">{special ? '—' : `No. ${index + 1}`}</span>
    </motion.button>
  )
}
