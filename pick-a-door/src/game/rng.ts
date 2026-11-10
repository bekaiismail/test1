/** A random source returning a float in [0, 1). */
export type Rng = () => number

/** Small, fast, seedable generator (mulberry32). Same seed, same sequence. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Seed from `?seed=123` in the URL when present (for testing), else from the clock. */
export function initialSeed(): number {
  if (typeof window !== 'undefined') {
    const raw = new URLSearchParams(window.location.search).get('seed')
    if (raw !== null && raw !== '' && Number.isFinite(Number(raw))) return Number(raw)
  }
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}

/** Pick a key in proportion to its weight. */
export function pickWeighted<K extends string>(rng: Rng, weights: Record<K, number>, keys: readonly K[]): K {
  const total = keys.reduce((sum, k) => sum + Math.max(0, weights[k]), 0)
  if (total <= 0) return pick(rng, keys)
  let roll = rng() * total
  for (const k of keys) {
    roll -= Math.max(0, weights[k])
    if (roll < 0) return k
  }
  return keys[keys.length - 1]
}
