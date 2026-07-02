import type { SaveGame } from '../../../entities/SaveGame'

/** Transferdeadline är omgång 15 (stänger efter omgång 15, januari-fönster). */
export const TRANSFER_DEADLINE_ROUND = 15

/**
 * Returnerar true om det finns inkommande bud som kräver svar
 * (status pending, riktade mot managed club).
 */
export function hasOpenBids(game: SaveGame): boolean {
  const pendingIncoming = game.transferBids.filter(
    b => b.direction === 'incoming'
      && b.status === 'pending'
      && b.sellingClubId === game.managedClubId
  )
  return pendingIncoming.length > 0
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
