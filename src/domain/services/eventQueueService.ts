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
