import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { VisualId } from '../types'

/**
 * Every character and room is drawn here in SVG and animated with Framer
 * Motion. No image or video files are used. Each visual receives the `pose`
 * set by the current line of dialogue.
 */
export interface VisualProps {
  pose: string
  /** Scares are softened or disabled: no sudden lunges. */
  gentle: boolean
  /** Reduced motion: no looping animation. */
  reduced: boolean
}

const loop = (reduced: boolean, duration: number) =>
  reduced ? { duration: 0 } : { duration, repeat: Infinity, ease: 'easeInOut' as const }

function Frame({ children, bg = 'transparent' }: { children: ReactNode; bg?: string }) {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-hidden="true" style={{ background: bg }}>
      {children}
    </svg>
  )
}

// ── shared shapes ──────────────────────────────────────────────────

function PotatoShape({ pose, reduced }: { pose: string; reduced: boolean }) {
  const sad = pose === 'sad'
  return (
    <motion.g animate={reduced || sad ? { y: 0 } : { y: [0, -4, 0] }} transition={loop(reduced, 1.2)}>
      <ellipse cx="100" cy="112" rx="36" ry="48" fill="#b98a55" />
      <ellipse cx="88" cy="96" rx="34" ry="42" fill="#c99a63" opacity="0.6" />
      {[
        [80, 140],
        [118, 130],
        [108, 84],
        [84, 78],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill="#8a6238" />
      ))}
      {/* arm */}
      <motion.path
        d="M134 112 q16 -6 20 -24"
        stroke="#8a6238"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        style={{ originX: '134px', originY: '112px' }}
        animate={pose === 'wave' && !reduced ? { rotate: [0, -22, 8, -22, 0] } : { rotate: sad ? 60 : 0 }}
        transition={pose === 'wave' ? loop(reduced, 0.9) : { duration: 0.4 }}
      />
      <path d={sad ? 'M66 116 q-12 12 -14 26' : 'M66 112 q-14 4 -18 18'} stroke="#8a6238" strokeWidth="5" strokeLinecap="round" fill="none" />
      {/* eyes under the shades */}
      <circle cx="88" cy="100" r="3" fill="#2b1b12" />
      <circle cx="112" cy="100" r="3" fill="#2b1b12" />
      {/* sunglasses slip when sad */}
      <motion.g animate={{ y: sad ? 13 : 0, rotate: sad ? -9 : 0 }} transition={{ type: 'spring', stiffness: 120, damping: 9 }}>
        <rect x="76" y="92" width="22" height="14" rx="5" fill="#16121c" />
        <rect x="102" y="92" width="22" height="14" rx="5" fill="#16121c" />
        <path d="M98 97 h4 M76 97 l-8 -3 M124 97 l8 -3" stroke="#16121c" strokeWidth="3" />
        <path d="M80 96 l5 6" stroke="#fff" strokeWidth="1.5" opacity="0.4" />
      </motion.g>
      <path d={sad ? 'M90 130 q10 -7 20 0' : 'M88 124 q12 12 24 0'} stroke="#2b1b12" strokeWidth="3" strokeLinecap="round" fill="none" />
    </motion.g>
  )
}

function DuckShape({ color = '#f6cf3e', hat = false, monocle = false }: { color?: string; hat?: boolean; monocle?: boolean }) {
  return (
    <g>
      <ellipse cx="100" cy="134" rx="62" ry="48" fill={color} />
      <path d="M150 120 q34 -6 26 22 q-18 4 -32 -4z" fill={color} />
      <ellipse cx="96" cy="140" rx="30" ry="20" fill="#000" opacity="0.08" />
      <circle cx="78" cy="72" r="34" fill={color} />
      <path d="M46 70 q-30 0 -34 12 q14 12 38 6z" fill="#f08a2c" />
      <path d="M14 82 q16 2 34 -2" stroke="#b85e12" strokeWidth="2" fill="none" />
      <circle cx="68" cy="62" r="6" fill="#1c1320" />
      <circle cx="66" cy="60" r="2" fill="#fff" />
      {monocle && (
        <g>
          <circle cx="68" cy="62" r="10" fill="none" stroke="#d9d9e6" strokeWidth="2" />
          <path d="M76 70 q6 14 2 30" stroke="#d9d9e6" strokeWidth="1.5" fill="none" />
        </g>
      )}
      {hat && (
        <g>
          <rect x="62" y="14" width="34" height="26" rx="2" fill="#1c1320" />
          <rect x="52" y="38" width="54" height="6" rx="3" fill="#1c1320" />
          <rect x="62" y="30" width="34" height="5" fill="#b0413e" />
        </g>
      )}
      <path d="M80 182 l-12 12 h22z M124 182 l-12 12 h22z" fill="#f08a2c" />
    </g>
  )
}

function MonsterTop({ pose }: { pose: string }) {
  const roaring = pose === 'lunge'
  const happy = pose === 'finished'
  return (
    <g>
      <path d="M60 52 l-14 -30 l26 18z M140 52 l14 -30 l-26 18z" fill="#e7dcc8" />
      <path d="M44 120 q-6 -84 56 -84 q62 0 56 84z" fill="#6b2d5c" />
      <path d="M44 120 q-6 -84 56 -84" fill="none" stroke="#8d3f78" strokeWidth="4" />
      <circle cx="78" cy="74" r={roaring ? 13 : 10} fill="#ffe66b" />
      <circle cx="122" cy="74" r={roaring ? 13 : 10} fill="#ffe66b" />
      <circle cx="78" cy={happy ? 72 : 76} r="4.5" fill="#1c1320" />
      <circle cx="122" cy={happy ? 72 : 76} r="4.5" fill="#1c1320" />
      {roaring ? (
        <g>
          <ellipse cx="100" cy="104" rx="30" ry="17" fill="#1c0a12" />
          <path d="M72 98 l7 12 l7 -13 l7 13 l7 -13 l7 13 l7 -13 l7 13 l7 -12" fill="#fff" />
          <path d="M76 112 l6 -9 l6 9 l6 -9 l6 9 l6 -9 l6 9 l6 -9 l6 9" fill="#fff" />
        </g>
      ) : happy ? (
        <path d="M82 100 q18 16 36 0" stroke="#1c0a12" strokeWidth="4" strokeLinecap="round" fill="none" />
      ) : (
        <g>
          <path d="M86 104 q14 -6 28 0" stroke="#1c0a12" strokeWidth="4" strokeLinecap="round" fill="none" />
          <ellipse cx="66" cy="92" rx="7" ry="4" fill="#e86a8a" opacity="0.55" />
          <ellipse cx="134" cy="92" rx="7" ry="4" fill="#e86a8a" opacity="0.55" />
        </g>
      )}
      {/* arms */}
      <path d={roaring ? 'M46 108 q-26 -20 -24 -54' : 'M46 112 q-18 6 -16 26'} stroke="#6b2d5c" strokeWidth="11" strokeLinecap="round" fill="none" />
      <path d={roaring ? 'M154 108 q26 -20 24 -54' : 'M154 112 q18 6 16 26'} stroke="#6b2d5c" strokeWidth="11" strokeLinecap="round" fill="none" />
    </g>
  )
}

function GlowEyes({ y = 90 }: { y?: number }) {
  return (
    <motion.g animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.2, repeat: Infinity }}>
      <ellipse cx="82" cy={y} rx="8" ry="5" fill="#ffe66b" />
      <ellipse cx="118" cy={y} rx="8" ry="5" fill="#ffe66b" />
      <circle cx="82" cy={y} r="2.2" fill="#1c1320" />
      <circle cx="118" cy={y} r="2.2" fill="#1c1320" />
    </motion.g>
  )
}

/** Entrance used by anything that lunges. Gentle mode fades instead of pouncing. */
function Lunge({ active, gentle, children }: { active: boolean; gentle: boolean; children: ReactNode }) {
  if (!active) return <g>{children}</g>
  return (
    <motion.g
      style={{ originX: '100px', originY: '110px' }}
      initial={gentle ? { opacity: 0, scale: 0.9 } : { scale: 0.2, opacity: 1 }}
      animate={gentle ? { opacity: 1, scale: 1 } : { scale: [0.2, 1.45, 1.2] }}
      transition={gentle ? { duration: 0.8 } : { duration: 0.28, times: [0, 0.6, 1] }}
    >
      {children}
    </motion.g>
  )
}

// ── visuals ────────────────────────────────────────────────────────

function Potato({ pose, reduced }: VisualProps) {
  return (
    <Frame>
      <polygon points="70,0 130,0 176,176 24,176" fill="#ffe9a8" opacity="0.14" />
      <ellipse cx="100" cy="176" rx="82" ry="14" fill="#5a3418" />
      <ellipse cx="100" cy="172" rx="82" ry="12" fill="#7a4a22" />
      <PotatoShape pose={pose} reduced={reduced} />
    </Frame>
  )
}

function DancerShape({ pose, reduced }: { pose: string; reduced: boolean }) {
  const dancing = pose !== 'stop' && !reduced
  const limb = (d: string, ox: number, oy: number, swing: number[], delay = 0) => (
    <motion.path
      d={d}
      stroke="#f6ecd9"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
      style={{ originX: `${ox}px`, originY: `${oy}px` }}
      animate={dancing ? { rotate: swing } : { rotate: 0 }}
      transition={dancing ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut', delay } : { duration: 0.5 }}
    />
  )
  return (
    <motion.g animate={dancing ? { y: [0, -7, 0], x: [-5, 5, -5] } : { y: 0, x: 0 }} transition={loop(!dancing, 0.7)}>
      <circle cx="100" cy="52" r="15" fill="#f6ecd9" />
      <path d="M94 50 h1 M105 50 h1" stroke="#24152f" strokeWidth="3" strokeLinecap="round" />
      <path d={pose === 'stop' ? 'M94 60 q6 -4 12 0' : 'M94 57 q6 5 12 0'} stroke="#24152f" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M100 67 v52" stroke="#f6ecd9" strokeWidth="6" strokeLinecap="round" />
      {pose === 'stop' ? (
        <path d="M100 80 l-20 30 M100 80 l20 30" stroke="#f6ecd9" strokeWidth="6" strokeLinecap="round" />
      ) : (
        <>
          {limb('M100 80 l-30 -18', 100, 80, [0, 55, 0])}
          {limb('M100 80 l30 -18', 100, 80, [0, -55, 0], 0.35)}
        </>
      )}
      {limb('M100 119 l-18 44', 100, 119, [0, 18, 0])}
      {limb('M100 119 l18 44', 100, 119, [0, -18, 0], 0.35)}
    </motion.g>
  )
}

function Dancer({ pose, reduced }: VisualProps) {
  const tiles = ['#e8a13a', '#b0413e', '#7cc4d8', '#8fbf5a']
  return (
    <Frame>
      {Array.from({ length: 8 }, (_, i) => (
        <motion.rect
          key={i}
          x={20 + (i % 4) * 40}
          y={164 + Math.floor(i / 4) * 16}
          width="38"
          height="14"
          rx="2"
          fill={tiles[(i + Math.floor(i / 4)) % 4]}
          animate={pose === 'stop' || reduced ? { opacity: 0.25 } : { opacity: [0.25, 0.9, 0.25] }}
          transition={loop(reduced, 1.4 + (i % 3) * 0.3)}
        />
      ))}
      <DancerShape pose={pose} reduced={reduced} />
    </Frame>
  )
}

function ParrotShape({ pose, reduced }: { pose: string; reduced: boolean }) {
  const talking = pose === 'talk' && !reduced
  return (
    <g>
      <path d="M40 150 h120" stroke="#8a6238" strokeWidth="8" strokeLinecap="round" />
      <path d="M100 150 v40" stroke="#8a6238" strokeWidth="6" />
      <path d="M108 138 q22 30 12 52 q-22 -12 -28 -44z" fill="#2f7fd0" />
      <ellipse cx="104" cy="108" rx="30" ry="42" fill="#3fae5a" />
      <path d="M112 96 q26 14 12 48 q-22 -8 -24 -34z" fill="#2c8a45" />
      <circle cx="92" cy="60" r="24" fill="#e04b3c" />
      <path d="M100 38 q8 -16 18 -10 q-6 4 -8 14z" fill="#f3c33b" />
      <circle cx="88" cy="56" r="7" fill="#fff" />
      <circle cx="87" cy="56" r="3.2" fill="#1c1320" />
      <path d="M70 58 q-22 0 -22 16 q12 2 24 -4z" fill="#f3c33b" />
      <motion.path
        d="M70 68 q-14 4 -18 8 q10 8 22 0z"
        fill="#d9a22a"
        style={{ originX: '70px', originY: '68px' }}
        animate={talking ? { rotate: [0, -22, 0] } : { rotate: 0 }}
        transition={loop(!talking, 0.32)}
      />
      <path d="M94 150 v8 M112 150 v8" stroke="#f3c33b" strokeWidth="4" strokeLinecap="round" />
    </g>
  )
}

function Parrot({ pose, reduced }: VisualProps) {
  return (
    <Frame>
      <ParrotShape pose={pose} reduced={reduced} />
    </Frame>
  )
}

function MirrorFrame({ children }: { children: ReactNode }) {
  return (
    <g>
      <defs>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3d6a7a" />
          <stop offset="1" stopColor="#16303c" />
        </linearGradient>
        <clipPath id="glassClip">
          <path d="M52 190 v-110 a48 48 0 0 1 96 0 v110z" />
        </clipPath>
      </defs>
      <path d="M40 196 v-116 a60 60 0 0 1 120 0 v116z" fill="#b98532" />
      <path d="M46 196 v-116 a54 54 0 0 1 108 0 v116z" fill="#e8b65a" />
      <path d="M52 190 v-110 a48 48 0 0 1 96 0 v110z" fill="url(#glass)" />
      <g clipPath="url(#glassClip)">
        {children}
        <path d="M60 60 l26 -26 M64 88 l44 -44" stroke="#fff" strokeWidth="5" opacity="0.1" strokeLinecap="round" />
      </g>
      <circle cx="100" cy="16" r="9" fill="#e8b65a" stroke="#b98532" strokeWidth="3" />
    </g>
  )
}

function ReflectionFace({ pose, reduced }: { pose: string; reduced: boolean }) {
  if (pose === 'empty') return null
  const tone = '#cfe6ee'
  const serious = pose === 'serious'
  return (
    <g>
      <path d="M56 196 q0 -50 44 -50 q44 0 44 50z" fill="#8fb4c2" />
      {pose === 'copy' && (
        <motion.g initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: reduced ? 0 : 1.4 }}>
          <path d="M134 168 q10 -20 4 -44" stroke={tone} strokeWidth="11" strokeLinecap="round" fill="none" />
          <circle cx="138" cy="118" r="10" fill={tone} />
        </motion.g>
      )}
      <circle cx="100" cy="106" r="32" fill={tone} />
      <path d="M68 100 q4 -38 34 -36 q30 2 30 34 q-10 -18 -34 -16 q-18 0 -30 18z" fill="#4b6a78" />
      <circle cx="88" cy="106" r="3.4" fill="#16303c" />
      <circle cx="113" cy="106" r="3.4" fill="#16303c" />
      <path d={serious ? 'M80 96 l14 3 M106 99 l14 -3' : 'M80 98 l14 -4 M106 96 l14 0'} stroke="#16303c" strokeWidth="3" strokeLinecap="round" />
      {pose === 'brush' ? (
        <g>
          <ellipse cx="100" cy="124" rx="9" ry="6" fill="#fff" />
          <motion.g animate={reduced ? { x: 0 } : { x: [-5, 5, -5] }} transition={loop(reduced, 0.35)}>
            <rect x="98" y="121" width="46" height="5" rx="2.5" fill="#e04b3c" />
            <rect x="92" y="119" width="12" height="9" rx="2" fill="#fff" />
          </motion.g>
        </g>
      ) : serious ? (
        <path d="M90 124 h20" stroke="#16303c" strokeWidth="3" strokeLinecap="round" />
      ) : pose === 'copy' ? (
        <path d="M88 121 q12 10 24 0" stroke="#16303c" strokeWidth="3" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M88 124 q14 4 26 -8" stroke="#16303c" strokeWidth="3" strokeLinecap="round" fill="none" />
      )}
    </g>
  )
}

function Mirror({ pose, reduced }: VisualProps) {
  return (
    <Frame>
      <MirrorFrame>
        <ReflectionFace pose={pose} reduced={reduced} />
      </MirrorFrame>
    </Frame>
  )
}

function HalfMonster({ pose, gentle }: VisualProps) {
  if (pose === 'hidden') {
    return (
      <Frame>
        <GlowEyes />
      </Frame>
    )
  }
  const finished = pose === 'finished'
  return (
    <Frame>
      <Lunge active={pose === 'lunge'} gentle={gentle}>
        <MonsterTop pose={pose} />
        {finished ? (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
            <rect x="52" y="118" width="96" height="34" rx="10" fill="#6b2d5c" />
            <path d="M70 150 v32 h-14 M130 150 v32 h14" stroke="#6b2d5c" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M38 152 h124 M48 152 v40 M152 152 v40" stroke="#b98532" strokeWidth="6" strokeLinecap="round" />
          </motion.g>
        ) : (
          <g>
            <path d="M48 122 q-4 40 10 66 M152 122 q4 40 -10 66 M58 188 h84" stroke="#b9a6c9" strokeWidth="2.5" strokeDasharray="6 6" fill="none" />
            <text x="100" y="162" textAnchor="middle" fontFamily="monospace" fontSize="17" fontWeight="700" fill="#b9a6c9">
              TODO
            </text>
          </g>
        )}
      </Lunge>
    </Frame>
  )
}

function BedShadow({ pose, reduced }: VisualProps) {
  const scale = pose === 'grow' ? 2.6 : pose === 'ask' ? 1.5 : 1
  const y = pose === 'grow' ? -64 : pose === 'ask' ? -30 : 0
  return (
    <Frame>
      <motion.g
        style={{ originX: '100px', originY: '160px' }}
        animate={{ scale, y }}
        transition={{ duration: reduced ? 0 : pose === 'grow' ? 1.6 : 0.8, ease: 'easeOut' }}
      >
        <ellipse cx="100" cy="160" rx="46" ry="24" fill="#08040c" />
        <ellipse cx="88" cy="154" rx="5" ry="3.4" fill="#ffe66b" />
        <ellipse cx="112" cy="154" rx="5" ry="3.4" fill="#ffe66b" />
        {pose === 'ask' && <path d="M94 166 q6 -4 12 0" stroke="#ffe66b" strokeWidth="1.6" fill="none" strokeLinecap="round" />}
      </motion.g>
      {pose !== 'grow' && (
        <g>
          <rect x="28" y="96" width="14" height="74" rx="4" fill="#7a4a22" />
          <rect x="158" y="118" width="12" height="52" rx="4" fill="#7a4a22" />
          <rect x="36" y="124" width="130" height="22" rx="6" fill="#f6ecd9" />
          <rect x="44" y="112" width="34" height="18" rx="8" fill="#fff" />
          <path d="M80 122 h86 v22 h-86z" fill="#4a6fb0" />
          <path d="M80 122 q10 10 20 0 q10 10 20 0 q10 10 20 0 q10 10 26 0" stroke="#7c9bd6" strokeWidth="3" fill="none" />
        </g>
      )}
      {pose === 'ask' && (
        <text x="150" y="70" fontFamily="Georgia, serif" fontSize="40" fontWeight="700" fill="#ffe66b">
          ?
        </text>
      )}
    </Frame>
  )
}

function Teeth({ pose, gentle }: VisualProps) {
  if (pose === 'hidden') {
    return (
      <Frame>
        <rect x="76" y="50" width="48" height="96" fill="#08040c" />
        <path d="M76 50 l30 8 v96 l-30 -8z" fill="#3a2350" stroke="#24152f" strokeWidth="2" />
        <circle cx="100" cy="106" r="2.5" fill="#e8b65a" />
        <path d="M0 150 h200" stroke="#3a2350" strokeWidth="3" />
      </Frame>
    )
  }
  const calm = pose === 'calm'
  const row = (yBase: number, dir: 1 | -1, count: number) =>
    Array.from({ length: count }, (_, i) => {
      const w = 140 / count
      const x = 30 + i * w
      return <path key={`${yBase}-${i}`} d={`M${x} ${yBase} l${w / 2} ${dir * (calm ? 12 : 24)} l${w / 2} ${-dir * (calm ? 12 : 24)}z`} fill="#fff" />
    })
  return (
    <Frame>
      <Lunge active={pose === 'lunge'} gentle={gentle}>
        <ellipse cx="100" cy="110" rx="84" ry="74" fill="#3d1230" />
        <circle cx="66" cy="60" r="12" fill="#ffe66b" />
        <circle cx="134" cy="60" r="12" fill="#ffe66b" />
        <circle cx="66" cy="62" r="4.5" fill="#1c1320" />
        <circle cx="134" cy="62" r="4.5" fill="#1c1320" />
        <circle cx="100" cy="46" r="8" fill="#ffe66b" />
        <circle cx="100" cy="47" r="3" fill="#1c1320" />
        <ellipse cx="100" cy="124" rx="70" ry={calm ? 20 : 40} fill="#12040c" />
        {row(calm ? 108 : 92, 1, 11)}
        {row(calm ? 140 : 156, -1, 10)}
        {!calm && <ellipse cx="100" cy="132" rx="26" ry="12" fill="#b0413e" />}
      </Lunge>
    </Frame>
  )
}

function Duck({ pose, reduced }: VisualProps) {
  const dancing = pose === 'dance' && !reduced
  return (
    <Frame>
      {dancing &&
        [
          [26, 40, 0],
          [168, 30, 0.5],
          [176, 96, 1],
        ].map(([x, y, d]) => (
          <motion.text key={x} x={x} y={y} fontSize="22" fill="#d6f59a" animate={{ y: [y, y - 14, y], opacity: [0, 1, 0] }} transition={{ duration: 1.6, repeat: Infinity, delay: d }}>
            ♪
          </motion.text>
        ))}
      <motion.g
        style={{ originX: '100px', originY: '190px' }}
        animate={dancing ? { rotate: [-9, 9, -9], y: [0, -8, 0] } : { rotate: 0, y: 0 }}
        transition={dancing ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
      >
        <DuckShape hat={pose === 'hat'} />
      </motion.g>
    </Frame>
  )
}

function ChickenChase({ pose, reduced }: VisualProps) {
  if (pose === 'bananas') {
    return (
      <Frame>
        {[
          [40, 150, -20],
          [84, 168, 30],
          [128, 146, 80],
          [160, 170, -50],
          [100, 120, 10],
          [60, 100, 140],
        ].map(([x, y, rot], i) => (
          <motion.path
            key={i}
            d="M0 0 q14 20 40 14 q-6 12 -24 10 q-16 -4 -16 -24z"
            fill="#f6cf3e"
            stroke="#b98532"
            strokeWidth="2"
            initial={{ x: 100, y: 110, scale: 0, rotate: 0 }}
            animate={{ x: x - 20, y: y - 10, scale: 1, rotate: rot }}
            transition={{ type: 'spring', stiffness: 140, damping: 9, delay: reduced ? 0 : i * 0.05 }}
          />
        ))}
      </Frame>
    )
  }
  return (
    <Frame>
      <path d="M0 176 h200" stroke="#5e1c27" strokeWidth="6" />
      <motion.g animate={reduced ? { x: 30 } : { x: [-90, 230] }} transition={reduced ? { duration: 0 } : { duration: 1.9, repeat: Infinity, ease: 'linear' }}>
        {/* the small door giving chase */}
        <motion.g animate={reduced ? {} : { y: [0, -6, 0] }} transition={loop(reduced, 0.3)}>
          <rect x="-64" y="126" width="26" height="44" rx="3" fill="#b8433b" stroke="#5e1c27" strokeWidth="2" />
          <circle cx="-44" cy="150" r="2.5" fill="#e8b65a" />
          <path d="M-58 170 l-4 6 M-44 170 l4 6" stroke="#5e1c27" strokeWidth="3" strokeLinecap="round" />
        </motion.g>
        {/* the chicken */}
        <motion.g animate={reduced ? {} : { y: [0, -9, 0] }} transition={loop(reduced, 0.26)}>
          <ellipse cx="20" cy="140" rx="24" ry="19" fill="#fff" />
          <path d="M0 136 l-16 -10 l6 16z" fill="#fff" />
          <circle cx="42" cy="118" r="12" fill="#fff" />
          <path d="M36 106 q4 -10 8 0 q4 -10 8 0 v6 h-16z" fill="#e04b3c" />
          <path d="M53 118 l12 4 l-12 4z" fill="#f08a2c" />
          <circle cx="46" cy="116" r="2.4" fill="#1c1320" />
          <path d="M14 158 l-8 16 M26 158 l8 16" stroke="#f08a2c" strokeWidth="3.5" strokeLinecap="round" />
        </motion.g>
      </motion.g>
    </Frame>
  )
}

function Crash({ pose, reduced }: VisualProps) {
  const crashed = pose === 'crash'
  return (
    <div className="flex h-full w-full items-center justify-center p-3">
      <motion.div
        className="w-full max-w-[280px] overflow-hidden rounded-md border-2 border-[#1c1320] bg-[#d9d9e6] text-left font-mono text-[#1c1320] shadow-[6px_6px_0_#1c1320]"
        animate={crashed && !reduced ? { x: [0, -3, 3, -2, 0] } : { x: 0 }}
        transition={crashed && !reduced ? { duration: 0.4, repeat: 3 } : { duration: 0 }}
      >
        <div className={`px-3 py-1.5 text-xs font-bold text-white ${crashed ? 'bg-[#b0413e]' : 'bg-[#3f7d5c]'}`}>{crashed ? 'pickadoor.exe — pretend error' : 'pickadoor.exe — fine, actually'}</div>
        <div className="space-y-2 p-3 text-xs leading-snug">
          {crashed ? (
            <>
              <p className="font-bold">pickadoor.exe has stopped pretending.</p>
              <p>Collecting your details… name: ________</p>
              <div className="h-2.5 w-full overflow-hidden rounded bg-white">
                <motion.div className="h-full bg-[#b0413e]" initial={{ width: '5%' }} animate={{ width: '92%' }} transition={{ duration: reduced ? 0 : 3 }} />
              </div>
              <p className="opacity-70">(This is a joke. Nothing is broken.)</p>
            </>
          ) : (
            <>
              <p className="font-bold">✔ Everything works. It always did.</p>
              <p>Guest: [not found]</p>
              <p>Reflection: [signed in since Tuesday]</p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function Trio({ pose, reduced }: VisualProps) {
  const fading = pose === 'fade'
  const sub = pose === 'bow' || fading ? 'stop' : 'dance'
  return (
    <motion.div className="grid h-full w-full grid-cols-3 items-end" animate={{ opacity: fading ? 0.25 : 1, y: fading ? -18 : 0 }} transition={{ duration: reduced ? 0 : 2 }}>
      <Frame>
        <PotatoShape pose={fading || pose === 'bow' ? 'idle' : 'wave'} reduced={reduced} />
      </Frame>
      <Frame>
        <DancerShape pose={sub} reduced={reduced} />
      </Frame>
      <Frame>
        <ParrotShape pose={sub === 'dance' ? 'talk' : 'quiet'} reduced={reduced} />
      </Frame>
    </motion.div>
  )
}

function DuckMirror(_: VisualProps) {
  return (
    <Frame>
      <MirrorFrame>
        <g transform="translate(142 108) scale(-0.46 0.46)">
          <DuckShape color="#e9dc9a" monocle />
        </g>
      </MirrorFrame>
      <g transform="translate(-14 108) scale(0.46)">
        <DuckShape />
      </g>
    </Frame>
  )
}

function PotatoMonster({ reduced }: VisualProps) {
  return (
    <div className="grid h-full w-full grid-cols-2 items-end">
      <Frame>
        <polygon points="70,0 130,0 176,176 24,176" fill="#ffe9a8" opacity="0.14" />
        <PotatoShape pose="wave" reduced={reduced} />
      </Frame>
      <Frame>
        <motion.g animate={reduced ? {} : { rotate: [-3, 3, -3], y: [0, -4, 0] }} transition={loop(reduced, 0.5)} style={{ originX: '100px', originY: '120px' }}>
          <MonsterTop pose="finished" />
          <path d="M48 122 q-4 40 10 66 M152 122 q4 40 -10 66" stroke="#b9a6c9" strokeWidth="2.5" strokeDasharray="6 6" fill="none" />
        </motion.g>
      </Frame>
    </div>
  )
}

function Ending({ pose, reduced }: VisualProps) {
  if (pose === 'door') {
    return (
      <Frame>
        <motion.rect x="62" y="24" width="76" height="160" fill="#fff6dc" animate={{ opacity: [0.7, 1, 0.7] }} transition={loop(reduced, 3)} />
        <path d="M62 24 l-34 16 v160 l34 -16z" fill="#e9dfcb" stroke="#b9a98c" strokeWidth="2" />
        <circle cx="36" cy="116" r="3" fill="#b98532" />
        <path d="M56 20 h88 v170 h-88z" fill="none" stroke="#b9a98c" strokeWidth="6" />
      </Frame>
    )
  }
  const copy = pose === 'copy'
  const person = '#f0c987'
  return (
    <Frame>
      <rect width="200" height="200" fill="#dfeeee" />
      {Array.from({ length: 6 }, (_, i) => (
        <path key={i} d={`M${i * 40} 0 v200 M0 ${i * 40} h200`} stroke="#c2d9da" strokeWidth="1.5" />
      ))}
      <rect x="46" y="18" width="108" height="118" rx="8" fill="#b9a98c" />
      <rect x="52" y="24" width="96" height="106" rx="5" fill="#9fc6d2" />
      <clipPath id="endClip">
        <rect x="52" y="24" width="96" height="106" rx="5" />
      </clipPath>
      <g clipPath="url(#endClip)">
        <path d="M62 136 q0 -44 38 -44 q38 0 38 44z" fill="#d98a6a" />
        {copy && (
          <motion.g initial={{ y: 40 }} animate={{ y: 0 }} transition={{ duration: reduced ? 0 : 1.2 }}>
            <path d="M128 122 q8 -18 2 -38" stroke={person} strokeWidth="10" strokeLinecap="round" fill="none" />
            <circle cx="130" cy="80" r="9" fill={person} />
          </motion.g>
        )}
        <circle cx="100" cy="72" r="26" fill={person} />
        <path d="M74 68 q2 -30 28 -28 q24 2 24 26 q-10 -12 -28 -12 q-14 0 -24 14z" fill="#5a3a2a" />
        <circle cx="90" cy="72" r="3" fill="#24152f" />
        <circle cx="110" cy="72" r="3" fill="#24152f" />
        {copy ? (
          <path d="M90 84 q10 8 20 0" stroke="#24152f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : (
          <g>
            <ellipse cx="100" cy="86" rx="7" ry="5" fill="#fff" />
            <rect x="100" y="84" width="34" height="4" rx="2" fill="#e04b3c" />
          </g>
        )}
        <path d="M58 40 l22 -16" stroke="#fff" strokeWidth="5" opacity="0.25" strokeLinecap="round" />
      </g>
      <rect x="40" y="150" width="120" height="18" rx="9" fill="#fff" stroke="#c2d9da" strokeWidth="2" />
      <path d="M100 150 v-12 h14" stroke="#b9c4c8" strokeWidth="5" fill="none" strokeLinecap="round" />
      {copy && (
        <motion.g initial={{ y: 60 }} animate={{ y: 0 }} transition={{ duration: reduced ? 0 : 1.2 }}>
          <path d="M60 210 q-6 -30 6 -52" stroke="#cfe6ee" strokeWidth="14" strokeLinecap="round" fill="none" />
          <circle cx="68" cy="150" r="12" fill="#cfe6ee" />
        </motion.g>
      )}
    </Frame>
  )
}

const VISUALS: Record<VisualId, (props: VisualProps) => ReactNode> = {
  potato: Potato,
  dancer: Dancer,
  parrot: Parrot,
  mirror: Mirror,
  halfMonster: HalfMonster,
  bedShadow: BedShadow,
  teeth: Teeth,
  duck: Duck,
  chickenChase: ChickenChase,
  crash: Crash,
  trio: Trio,
  duckMirror: DuckMirror,
  potatoMonster: PotatoMonster,
  ending: Ending,
}

export function Visual({ id, ...props }: VisualProps & { id: VisualId }) {
  const Component = VISUALS[id]
  return <Component {...props} />
}
