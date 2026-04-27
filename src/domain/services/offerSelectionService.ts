import { CLUB_TEMPLATES } from './worldGenerator'

export interface ClubOffer {
  clubId: string
  difficulty: 'easy' | 'medium' | 'hard'
  quoteIndex: number
}

// Difficulty baseras på reputation:
// hard: reputation < 55
// medium: reputation 55-74
// easy: reputation >= 75

function getDifficulty(reputation: number): 'easy' | 'medium' | 'hard' {
  if (reputation >= 75) return 'easy'
  if (reputation >= 55) return 'medium'
  return 'hard'
}

// Enkel deterministisk seedad random (mulberry32-inspirerad)
function seededRandom(seed: number): () => number {
  let s = seed >>> 0
  return function () {
    s = (Math.imul(s ^ (s >>> 15), s | 1) ^ ((s ^ (s >>> 7)) * (s | 61))) >>> 0
    return s / 0x100000000
  }
}

/**
 * Väljer 3 klubbar för "Tre erbjudanden"-scenen.
 * Balanserad: en svår, en medel, en lätt.
 */
export function selectThreeOffers(seed: number): ClubOffer[] {
  const rng = seededRandom(seed)

  const grouped: Record<'easy' | 'medium' | 'hard', string[]> = {
    easy: [],
    medium: [],
    hard: [],
  }

  for (const t of CLUB_TEMPLATES) {
    grouped[getDifficulty(t.reputation)].push(t.id)
  }

  // Fallback: om en grupp är tom, fyll från närmaste
  if (grouped.easy.length === 0) {
    grouped.easy = [...grouped.medium]
  }
  if (grouped.hard.length === 0) {
    grouped.hard = [...grouped.medium]
  }
  if (grouped.medium.length === 0) {
    grouped.medium = [...grouped.easy]
  }

  function pickOne(pool: string[]): string {
    const idx = Math.floor(rng() * pool.length)
    return pool[idx]
  }

  const hardId = pickOne(grouped.hard)
  const mediumId = pickOne(grouped.medium.filter(id => id !== hardId))
  const easyId = pickOne(grouped.easy.filter(id => id !== hardId && id !== mediumId))

  return [
    { clubId: hardId, difficulty: 'hard', quoteIndex: selectQuoteIndex(seed, hardId, 5) },
    { clubId: mediumId, difficulty: 'medium', quoteIndex: selectQuoteIndex(seed, mediumId, 5) },
    { clubId: easyId, difficulty: 'easy', quoteIndex: selectQuoteIndex(seed, easyId, 5) },
  ]
}

/**
 * Väljer ett citat-index ur poolen för given klubb.
 * Deterministisk baserat på seed + clubId.
 */
export function selectQuoteIndex(seed: number, clubId: string, poolSize: number): number {
  if (poolSize <= 0) return 0
  // Hash av seed + clubId
  let hash = seed
  for (let i = 0; i < clubId.length; i++) {
    hash = Math.imul(hash ^ clubId.charCodeAt(i), 0x9e3779b9)
    hash ^= hash >>> 16
  }
  return Math.abs(hash) % poolSize
}
