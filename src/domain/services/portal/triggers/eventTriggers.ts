import type { SaveGame } from '../../../entities/SaveGame'
import { getEventPriority } from '../../../entities/GameEvent'
import { getEventDecisionTier } from '../../decisionTierService'

/**
 * Returnerar true om det finns ett olöst KRITISKT event som kräver svar.
 * Ignorerar presskonferenser (de hanteras separat).
 * Ignorerar medium/low-priority events — de renderas av PortalEventSlot inline.
 *
 * HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md): bakgrundsnivån får
 * aldrig ett dashboardkort — inte heller ett primärkort. Ingen bakgrundstyp
 * är critical i dagens getEventPriority-tabell, så filtret ändrar inget nu;
 * det finns för att en framtida per-instans-priority (`event.priority`) inte
 * ska kunna smuggla upp t.ex. en fanLetter till primärplatsen förbi domen.
 */
export function hasCriticalEvent(game: SaveGame): boolean {
  const critical = (game.pendingEvents ?? []).filter(
    e => !e.resolved &&
         e.type !== 'pressConference' &&
         getEventDecisionTier(e) !== 'background' &&
         (e.priority ?? getEventPriority(e.type)) === 'critical'
  )
  return critical.length > 0
}
