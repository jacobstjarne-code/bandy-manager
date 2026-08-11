import type { SaveGame } from '../../../entities/SaveGame'
import type { TransferBid } from '../../../entities/GameEvent'

/** Transferdeadline är omgång 15 (stänger efter omgång 15, januari-fönster). */
export const TRANSFER_DEADLINE_ROUND = 15

/**
 * AUDIT DEL 2 (2026-08-11), Berg-budets dubbelrendering: PortalEventSlot
 * renderar redan ETT pendingEvent fullt ut (📋 HÄNDELSE med vägval, via
 * getNextEvent/attentionRouter). Ett bud vars event är just det aktiva
 * kortet får INTE också räknas som "öppet" här — takregeln säger att
 * sekundära/kö-ytor bara ska visa det som INTE redan renderats ovanför,
 * inte en andra rendering av samma lista (samma dubbelkälleklass som A3/
 * SÄSONGENS BERÄTTELSER, tredje gången i den här auditen).
 */
export function getQueueableOpenBids(game: SaveGame): TransferBid[] {
  // TEMP — CI-VERIFIERING (2026-08-11): återinför medvetet Berg-buggen
  // (exkluderingen borttagen) för att bevisa att entitets-dedup-grinden
  // failar i pipelinen, inte bara lokalt. Reverteras i nästa commit på
  // denna branch, mergas ALDRIG mot main.
  const pendingIncoming = game.transferBids.filter(
    b => b.direction === 'incoming'
      && b.status === 'pending'
      && b.sellingClubId === game.managedClubId
  )
  return pendingIncoming
}

/**
 * Returnerar true om det finns inkommande bud som kräver svar OCH inte
 * redan visas som ett eget HÄNDELSE-beslutskort (PortalEventSlot) — se
 * getQueueableOpenBids.
 */
export function hasOpenBids(game: SaveGame): boolean {
  return getQueueableOpenBids(game).length > 0
}

/**
 * Returnerar true om transferfönstret stänger inom ≤3 omgångar.
 */
export function transferDeadlineWithin3Rounds(game: SaveGame): boolean {
  const currentRound = (() => {
    const completedLeague = game.fixtures.filter(
      f => f.status === 'completed' && !f.isCup
    )
    return completedLeague.length > 0
      ? Math.max(...completedLeague.map(f => f.roundNumber))
      : 0
  })()

  const roundsLeft = TRANSFER_DEADLINE_ROUND - currentRound
  return roundsLeft > 0 && roundsLeft <= 3
}
