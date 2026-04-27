import type { SaveGame } from '../../../entities/SaveGame'

/**
 * Returnerar true om patron är aktiv och kravets otillfredsställande
 * har pågått i 3+ omgångar (patience < 30 används som proxy).
 */
export function patronDemandUnmetOver3Rounds(game: SaveGame): boolean {
  const patron = game.patron
  if (!patron || !patron.isActive) return false
  if (!patron.demands || patron.demands.length === 0) return false
  // patience < 30 = patron är otålig sedan ett tag
  const patience = patron.patience ?? 100
  return patience < 30
}
