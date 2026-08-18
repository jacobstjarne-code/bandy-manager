import { CLUB_TEMPLATES } from './worldGenerator'
import { ClubExpectation } from '../enums'

export interface ClubOffer {
  clubId: string
  difficulty: 'easy' | 'medium' | 'hard'
  quoteIndex: number
}

interface DifficultyInput {
  reputation: number
  finances: number
  wageBudget: number
  boardExpectation: ClubExpectation
}

// U1 (SLUTTEST_KO.md, 2026-08-17) — det största fyndet i sluttestserien:
// difficulty satt ENBART från reputation gjorde en AvoidBottom-klubb med
// sund ekonomi (Skutskär, rep 52) till "hard" trots att styrelsekravet var
// det lägsta som finns och tålamodsstraffet bara träffade botten tre. En
// testare tankade en hel säsong medvetet — femte plats, styrelsen BLEV NÖJD.
//
// Ny modell, tre faktorer, ingen ny simulering vid runtime: reputation
// (bas, som idag) + boardExpectation-gap (kräver styrelsen mer än ryktet
// motiverar?) + finansiell marginal (finances/wageBudget). Se D029 för
// exakta konstanter och kalibreringsresonemang mot de tolv klubbmallarna.
function reputationImpliedSeverity(reputation: number): 0 | 1 | 2 | 3 {
  if (reputation >= 80) return 3
  if (reputation >= 68) return 2
  if (reputation >= 55) return 1
  return 0
}

function expectationSeverity(exp: ClubExpectation): 0 | 1 | 2 | 3 {
  switch (exp) {
    case ClubExpectation.WinLeague: return 3
    case ClubExpectation.ChallengeTop: return 2
    case ClubExpectation.MidTable: return 1
    case ClubExpectation.AvoidBottom: default: return 0
  }
}

/** D029: poäng, inte ett facit i sig — bucket:as till easy/medium/hard nedanför. */
export function computeDifficultyScore(t: DifficultyInput): number {
  let score = t.reputation

  const gap = expectationSeverity(t.boardExpectation) - reputationImpliedSeverity(t.reputation)
  score -= gap * 12  // styrelsen begär mer än ryktet motiverar → svårare jobb

  const margin = t.wageBudget > 0 ? t.finances / t.wageBudget : 0
  if (margin < 4) score -= 10       // tunn kassabuffert mot lönerna — skört läge
  else if (margin >= 6) score += 5  // rejäl marginal — stabilt läge

  return score
}

function getDifficulty(t: DifficultyInput): 'easy' | 'medium' | 'hard' {
  const score = computeDifficultyScore(t)
  if (score >= 75) return 'easy'
  if (score >= 50) return 'medium'
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
    grouped[getDifficulty(t)].push(t.id)
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
