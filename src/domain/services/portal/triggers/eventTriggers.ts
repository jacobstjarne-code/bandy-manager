import type { SaveGame } from '../../../entities/SaveGame'
import { getEventPriority } from '../../../entities/GameEvent'

/**
 * Returnerar true om det finns ett olöst KRITISKT event som kräver svar.
 * Ignorerar presskonferenser (de hanteras separat).
 * Ignorerar medium/low-priority events — de renderas av PortalEventSlot inline.
 */
export function hasCriticalEvent(game: SaveGame): boolean {
  const critical = (game.pendingEvents ?? []).filter(
    e => !e.resolved &&
         e.type !== 'pressConference' &&
         (e.priority ?? getEventPriority(e.type)) === 'critical'
  )
  return critical.length > 0
}
