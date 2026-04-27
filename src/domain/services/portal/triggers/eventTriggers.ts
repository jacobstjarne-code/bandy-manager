import type { SaveGame } from '../../../entities/SaveGame'

/**
 * Returnerar true om det finns ett olöst kritiskt event som kräver svar.
 * Ignorerar presskonferenser (de hanteras separat).
 */
export function hasCriticalEvent(game: SaveGame): boolean {
  const critical = (game.pendingEvents ?? []).filter(
    e => !e.resolved && e.type !== 'pressConference'
  )
  return critical.length > 0
}
