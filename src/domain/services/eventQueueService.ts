/**
 * eventQueueService — sortering och statistik för pendingEvents-kön.
 *
 * Pure functions — inga side effects, inga store-anrop.
 */

import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'
import { getEventPriority } from '../entities/GameEvent'

// Numerisk rank per prio — lägre tal = högre prioritet
const PRIORITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
}

export interface QueueStats {
  total: number
  critical: number
  high: number
  normal: number
  low: number
}

/**
 * D1 (DOM_D1_EVENTVIKTNING_2026-08-19.md) punkt 2 — Ambient-regeln.
 * "Att ett event utan val inte får ett kort är en mekanisk regel, inte en
 * estetisk — den går inte att tolka fel och den kan testas."
 *
 * Ett event utan val (choices.length === 0) ska ALDRIG renderas som ett
 * DecisionCard/EventOverlay-kort. Rent predikat, noll side effects.
 */
export function isAmbientEvent(event: GameEvent): boolean {
  return event.choices.length === 0
}

export type EventRenderTarget = 'overlay' | 'inline' | 'ambient'

/**
 * Central källa för VAR ett pending event ska renderas. GameShell (EventOverlay-
 * gaten), PortalEventSlot (inline-gaten) och EventPrimary (dashboard-primärkortet)
 * läste tidigare var sin kopia av samma priority==='critical'-check — tre ställen
 * som kunde glida isär (samma klass av bugg som Å7:s dubbelpadding). Ett event
 * utan val rutas ALLTID till 'ambient', oavsett priority — annars softlockar ett
 * kritiskt event utan val EventOverlay (fullskärmsmodal utan knappar, upptäckt
 * 2026-08-19 vid D1-utredningen: EventOverlay läste event.choices direkt utan
 * getActionsForEvent-fallbacken som EventCardInline redan hade).
 */
export function getEventRenderTarget(event: GameEvent): EventRenderTarget {
  if (isAmbientEvent(event)) return 'ambient'
  const priority = event.priority ?? getEventPriority(event.type)
  return priority === 'critical' ? 'overlay' : 'inline'
}

/**
 * Returnerar nästa event att visa, eller null om kön är tom.
 * Sorterar primärt på priority (critical → high → normal → low),
 * sekundärt på array-ordning (FIFO inom samma prio).
 * Hoppar över resolved events.
 */
export function getNextEvent(game: SaveGame): GameEvent | null {
  const events = (game.pendingEvents ?? []).filter(e => !e.resolved)
  if (events.length === 0) return null

  const sorted = [...events].sort((a, b) => {
    const ap = PRIORITY_RANK[a.priority ?? getEventPriority(a.type)] ?? PRIORITY_RANK.normal
    const bp = PRIORITY_RANK[b.priority ?? getEventPriority(b.type)] ?? PRIORITY_RANK.normal
    if (ap !== bp) return ap - bp
    // FIFO inom samma prio — bevara array-ordning
    return events.indexOf(a) - events.indexOf(b)
  })

  return sorted[0]
}

/**
 * Statistik för Portal-visning och debugging.
 */
export function getQueueStats(game: SaveGame): QueueStats {
  const events = (game.pendingEvents ?? []).filter(e => !e.resolved)
  const getRank = (e: GameEvent) => e.priority ?? getEventPriority(e.type)
  return {
    total: events.length,
    critical: events.filter(e => getRank(e) === 'critical').length,
    high: events.filter(e => getRank(e) === 'high').length,
    normal: events.filter(e => getRank(e) === 'normal').length,
    low: events.filter(e => getRank(e) === 'low').length,
  }
}
