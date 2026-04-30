import type { SaveGame } from '../entities/SaveGame'
import { PORTAL_BEATS, type PortalBeat } from '../data/portalBeats'

/**
 * Returnerar det beat som ska visas just nu, eller null.
 * Prioriterar beatet med lägst index i PORTAL_BEATS (ordning = prioritet).
 */
export function getActiveBeat(game: SaveGame): PortalBeat | null {
  const shown = game.shownBeats ?? []
  const season = game.currentSeason

  for (const beat of PORTAL_BEATS) {
    const key = beat.oncePerSeason ? `${beat.id}_${season}` : beat.id
    if (shown.includes(key)) continue
    if (beat.trigger(game)) return beat
  }
  return null
}

/** Returnerar den nyckel som ska läggas till i game.shownBeats. */
export function getBeatKey(beat: PortalBeat, season: number): string {
  return beat.oncePerSeason ? `${beat.id}_${season}` : beat.id
}
