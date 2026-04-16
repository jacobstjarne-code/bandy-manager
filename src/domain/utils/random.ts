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
