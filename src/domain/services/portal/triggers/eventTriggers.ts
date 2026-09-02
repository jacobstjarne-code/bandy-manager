import type { SaveGame } from '../../../entities/SaveGame'
import { getEffectivePriority } from '../../eventQueueService'
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
 *
 * MASTER_OPPET.md d-evt1-eventprimary-overlay (2026-09-02): läste tidigare
 * rå `(e.priority ?? getEventPriority(e.type)) === 'critical'` — en egen
 * kopia av exakt det mönster eventQueueService.ts:s filhuvud beskriver som
 * redan konsoliderat (GameShell/PortalEventSlot/EventPrimary). Den här
 * funktionen missade D1 punkt 4:s självkontroll (getEffectivePriority
 * nedgraderar critical→normal om eventet saknar en "därför nu"-rad) — ett
 * critical-event utan whyNow kunde alltså trigga dashboardens primärkort
 * här samtidigt som EventOverlay redan korrekt nedgraderat det. Läser nu
 * samma delade funktion som de tre andra.
 */
export function hasCriticalEvent(game: SaveGame): boolean {
  const critical = (game.pendingEvents ?? []).filter(
    e => !e.resolved &&
         e.type !== 'pressConference' &&
         getEventDecisionTier(e) !== 'background' &&
         getEffectivePriority(e) === 'critical'
  )
  return critical.length > 0
}
