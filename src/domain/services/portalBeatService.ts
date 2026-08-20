import type { SaveGame } from '../entities/SaveGame'
import { PORTAL_BEATS, PIVOTAL_BEAT_IDS, PIVOTAL_BEAT_COOLDOWN_SEASONS, type PortalBeat } from '../data/portalBeats'
import { isOnCooldown } from './narrativeLogService'

/**
 * Returnerar det beat som ska visas just nu, eller null.
 * Prioriterar beatet med lägst index i PORTAL_BEATS (ordning = prioritet).
 */
export function getActiveBeat(game: SaveGame): PortalBeat | null {
  const shown = game.shownBeats ?? []
  const season = game.currentSeason

  for (const beat of PORTAL_BEATS) {
    const key = getBeatKey(beat, season, game)
    if (shown.includes(key)) continue
    // U5 forts: pivotal beats har DESSUTOM en multi-säsongsspärr utöver
    // shownBeats-dedupen ovan — shownBeats hindrar bara EXAKT samma
    // (ofta säsongsstämplade) nyckel; isOnCooldown hindrar samma beat-id
    // från att komma tillbaka för tidigt även när nyckeln i sig är ny
    // (t.ex. ripple_consequences olika trigger/omgång-suffix varje gång).
    if (PIVOTAL_BEAT_IDS.includes(beat.id) && isOnCooldown(game, beat.id, PIVOTAL_BEAT_COOLDOWN_SEASONS, season)) continue
    if (beat.trigger(game)) return beat
  }
  return null
}

/** Returnerar den nyckel som ska läggas till i game.shownBeats. */
export function getBeatKey(beat: PortalBeat, season: number, game?: SaveGame): string {
  if (beat.keyFn && game) return beat.keyFn(game)
  return beat.oncePerSeason ? `${beat.id}_${season}` : beat.id
}
