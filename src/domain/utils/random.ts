/** Kanonisk signerad 31-polynomial-hash för deterministiska domänval. */
export function stringHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}

/** Samma bitmönster som stringHash, tolkat som osignerat 32-bitars heltal. */
export function stringHashUnsigned(s: string): number {
  return stringHash(s) >>> 0
}

/** Deterministiskt val ur en array via numerisk eller sträng-seed. */
export function seededPick<T>(arr: readonly T[], seed: number | string): T {
  if (arr.length === 0) throw new Error('seededPick: empty array')
  const n = typeof seed === 'string' ? stringHash(seed) : seed
  return arr[Math.abs(n) % arr.length]
}

/** Deterministiskt val med no-repeat: hoppar index som finns i `seen`. */
export function seededPickNoRepeat<T>(
  arr: readonly T[],
  seed: number | string,
  seen: Set<number>,
): { item: T; index: number } {
  if (arr.length === 0) throw new Error('seededPickNoRepeat: empty array')
  const n = typeof seed === 'string' ? stringHash(seed) : seed
  let idx = Math.abs(n) % arr.length
  let step = 0
  while (seen.has(idx) && step < arr.length) {
    idx = (idx + 1) % arr.length
    step++
  }
  return { item: arr[idx], index: idx }
}

/**
 * Deterministic seed from a fixture ID string.
 * Hashes the string into a 32-bit integer — avoids Date.now() as a fallback seed.
 * Same fixture always produces the same seed across runs and devices.
 */
export function fixtureSeed(fixtureId: string, extra = 0): number {
  let h = 0x811c9dc5
  for (let i = 0; i < fixtureId.length; i++) {
    h ^= fixtureId.charCodeAt(i)
    h = (Math.imul(h, 0x01000193) >>> 0)
  }
  return (h + extra * 0x9e3779b9) >>> 0
}

/**
 * Mulberry32 — fast seeded pseudo-random number generator.
 * Returns a function that produces numbers in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return function (): number {
    s += 0x6d2b79f5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
