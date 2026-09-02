import type { GameEvent, GameEventType } from '../entities/GameEvent'
import { getEffectivePriority } from './eventQueueService'

export type EventNature = 'critical' | 'player' | 'reactions' | 'inbox-only'

/**
 * Event types that require a decision — shown inline in Översikt (max 3).
 * pressConference is handled separately via game.pendingPressConference.
 *
 * HIGH 11-uppföljning (2026-08-31, communityEvent tillagd): communityEvent
 * (background-tier, decisionTierService.ts — får aldrig en dashboard-yta)
 * hade INGEN resolverbar yta alls innan detta — det matchade ingen av de
 * tre kategorierna nedan och föll till 'inbox-only', som inte renderar
 * något att klicka på. Riktiga val med riktiga effekter (t.ex.
 * characterPlayerService.ts:s veteran-avsked, +3 samhällsstöd) blev
 * därmed olösbara: observerat kvarliggande 62 raka omgångar i HIGH 11:s
 * simulering. Bakgrund ska besvaras "där den hör hemma" (doktrinen) — för
 * communityEvent är det här, Granskas Översikt, inte dashboarden.
 */
export const CRITICAL_GRANSKA_TYPES = new Set<GameEventType>([
  'transferBidReceived',
  'contractRequest',
  'playerUnhappy',
  'criticalEconomy',
  'patronEvent',
  'economicStress',
  'mecenatEvent',
  'mecenatWithdrawal',
  'varsel',
  'detOmojligaValet',
  'riskySponsorOffer',
  'bidWar',
  'communityEvent',
])

/**
 * Event types related to individual players — shown in Spelare-fliken.
 */
export const PLAYER_TYPES = new Set<GameEventType>([
  'starPerformance',
  'playerPraise',
  'playerMediaComment',
  'dayJobConflict',
  'hesitantPlayer',
  'captainSpeech',
  'playerArc',
  'retirementCeremony',
  'academyEvent',
  'schoolAssignment',
])

/**
 * Post-match reaction event types. Routing depends on choices.length:
 * - choices.length === 0 → ReaktionerKort (auto-resolved at render)
 * - choices.length > 0   → Översikt as critical (player decision required)
 *
 * Auto-resolve via the 'auto' choiceId is not safe for events with choices.
 * eventResolver silently returns the game unchanged when choiceId is unknown,
 * so side-effects (e.g. tifoDone for supporter_tifo_*, saveBandyLetter for
 * bandyLetter) never fire and the event re-appears next session. The classify
 * function below routes choice-bearing reactions to 'critical' instead.
 */
export const REACTION_TYPES = new Set<GameEventType>([
  'mediaReaction',
  'fanLetter',
  'opponentQuote',
  'supporterEvent',
  'refereeMeeting',
  'bandyLetter',
])

/**
 * Pure function: classify a pending event by its nature for Granska routing.
 *
 * Routing rules:
 * - CRITICAL_GRANSKA_TYPES with choices.length === 0 → 'reactions' (auto-resolved,
 *   see Ambient-regeln note below)
 * - CRITICAL_GRANSKA_TYPES with choices.length > 0 → 'critical' (decision required
 *   in Översikt)
 * - PLAYER_TYPES → 'player' (Spelare-fliken)
 * - REACTION_TYPES with choices.length === 0 → 'reactions' (auto-resolved)
 * - REACTION_TYPES with choices.length > 0 → 'critical' (decision required —
 *   side-effects in eventResolver only fire on a real choiceId)
 * - Any other type with priority='critical' AND choices.length === 0 → 'reactions'
 * - Any other type with priority='critical' AND choices.length > 0 → 'critical'
 * - Otherwise → 'inbox-only'
 *
 * Ambient-regeln (A-H10, SEXSÄSONGSAUDITEN 2026-08-26 + D1
 * DOM_D1_EVENTVIKTNING_2026-08-19.md): ett event utan val (choices.length === 0)
 * får ALDRIG räknas som ett blockerande 'critical'-event — Granskas
 * unresolvedCritical-räknare (GranskaScreen.tsx) stänger av "Fortsätt" så länge
 * räknaren är > 0, men DecisionCard har inga knappar att rendera för ett event
 * utan val. Innan denna fix gällde choices.length-kollen bara REACTION_TYPES;
 * economicCrisisService.ts:s fas 1 (awareness) skapar avsiktligt ett
 * criticalEconomy-event med choices:[] (ambient, tänkt att auto-resolveras som
 * en reaktion) — det landade ändå i 'critical' och gav ett kriskort utan val,
 * ett soft-lock av "Fortsätt"-knappen (observerat: förlorad slutspelsmatch +
 * aktiv ekonomisk kris). Samma gap fanns i priority==='critical'-fallgrenen.
 *
 * MASTER_OPPET.md d-evt1-eventprimary-overlay (2026-09-02): fallgrenen läste
 * rå `event.priority === 'critical'` — varken `?? getEventPriority(e.type)`-
 * fallbacken eller D1 punkt 4:s självkontroll (getEffectivePriority
 * nedgraderar critical→normal om eventet saknar en "därför nu"-rad).
 * Granska kunde alltså räkna ett event som blockerande kritiskt som
 * GameShell/PortalEventSlot redan korrekt nedgraderat till
 * normal. Läser nu samma delade funktion.
 */
export function classifyEventNature(event: GameEvent): EventNature {
  if (CRITICAL_GRANSKA_TYPES.has(event.type)) {
    return event.choices.length === 0 ? 'reactions' : 'critical'
  }
  if (PLAYER_TYPES.has(event.type)) return 'player'
  if (REACTION_TYPES.has(event.type)) {
    return event.choices.length === 0 ? 'reactions' : 'critical'
  }
  if (getEffectivePriority(event) === 'critical') {
    return event.choices.length === 0 ? 'reactions' : 'critical'
  }
  return 'inbox-only'
}

/**
 * Returns all critical (decision-required) events from pending queue.
 */
export function getCriticalEventsForGranska(pendingEvents: GameEvent[]): GameEvent[] {
  return pendingEvents.filter(e => !e.resolved && classifyEventNature(e) === 'critical')
}

/**
 * Returns all player-related events from pending queue.
 */
export function getPlayerEventsForGranska(pendingEvents: GameEvent[]): GameEvent[] {
  return pendingEvents.filter(e => !e.resolved && classifyEventNature(e) === 'player')
}

/**
 * Returns all reaction events from pending queue.
 */
export function getReactionEventsForGranska(pendingEvents: GameEvent[]): GameEvent[] {
  return pendingEvents.filter(e => !e.resolved && classifyEventNature(e) === 'reactions')
}
