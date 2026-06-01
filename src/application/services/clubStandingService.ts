/**
 * clubStandingService — tabellmatematik för det hanterade laget.
 * Beräknar min/max möjlig slutplacering utifrån återstående omgångar.
 *
 * Ren funktion. 2 poäng per seger (bandy), 1 vid oavgjort.
 */

import type { SaveGame } from '../../domain/entities/SaveGame'

export const REGULAR_SEASON_ROUNDS = 22
const POINTS_PER_WIN = 2

export interface ManagedStanding {
  currentPlace: number
  points: number
  played: number
  remainingRounds: number
  /** Bästa möjliga slutplacering (lägst siffra) om laget vinner allt och konkurrenter snubblar. */
  minPossiblePlace: number
  /** Sämsta möjliga slutplacering (högst siffra) om laget förlorar allt och konkurrenter vinner. */
  maxPossiblePlace: number
}

/**
 * Min/max placering: för varje annat lag, kan de teoretiskt hamna över/under oss
 * givet båda lagens maxpoäng? En konkurrent kan passera oss om deras maxpoäng
 * (nuvarande + 2×återstående) ≥ vår minpoäng, och vice versa.
 */
export function computeManagedStanding(game: SaveGame): ManagedStanding | null {
  const rows = game.standings ?? []
  const me = rows.find(r => r.clubId === game.managedClubId)
  if (!me) return null

  const remainingRounds = Math.max(0, REGULAR_SEASON_ROUNDS - me.played)
  const myMax = me.points + remainingRounds * POINTS_PER_WIN
  const myMin = me.points // förlorar allt

  let canFinishAbove = 0  // lag som säkert hamnar över oss (kan inte hinnas ikapp)
  let couldBeAbove = 0    // lag som teoretiskt kan hamna över oss

  for (const r of rows) {
    if (r.clubId === game.managedClubId) continue
    const theirRemaining = Math.max(0, REGULAR_SEASON_ROUNDS - r.played)
    const theirMax = r.points + theirRemaining * POINTS_PER_WIN
    const theirMin = r.points

    // Säkert över oss: deras minpoäng > vår maxpoäng (vi kan aldrig passera)
    if (theirMin > myMax) canFinishAbove++
    // Teoretiskt över oss: deras maxpoäng ≥ vår minpoäng
    if (theirMax >= myMin) couldBeAbove++
  }

  // minPossiblePlace: i bästa fall är bara de "säkert över"-lagen kvar ovanför
  const minPossiblePlace = canFinishAbove + 1
  // maxPossiblePlace: i värsta fall ligger alla "teoretiskt över"-lag ovanför
  const maxPossiblePlace = couldBeAbove + 1

  return {
    currentPlace: me.position,
    points: me.points,
    played: me.played,
    remainingRounds,
    minPossiblePlace,
    maxPossiblePlace,
  }
}
