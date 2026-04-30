/**
 * PortalEventSlot — visar nästa icke-kritiska event inline i Portal.
 *
 * Renderas mellan SituationCard/PortalBeat och Primary card.
 * Returnerar null om:
 *   - attention.kind !== 'event' (idle, screen eller scene styr)
 *   - event.priority === 'critical' (dessa hanteras av EventOverlay)
 *
 * Medium och atmosfäriska events visas som EventCardInline.
 */

import { getCurrentAttention } from '../../../domain/services/attentionRouter'
import { getQueueStats } from '../../../domain/services/eventQueueService'
import { getEventPriority } from '../../../domain/entities/GameEvent'
import { EventCardInline } from './EventCardInline'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface Props {
  game: SaveGame
}

export function PortalEventSlot({ game }: Props) {
  const attention = getCurrentAttention(game)

  // Bara render om det är ett event (inte screen/scene/idle)
  if (attention.kind !== 'event') return null

  const event = attention.event
  const priority = event.priority ?? getEventPriority(event.type)

  // Kritiska går via EventOverlay (utanför Portal). Skippa här.
  if (priority === 'critical') return null

  const stats = getQueueStats(game)

  // Antal kvarvarande icke-kritiska events utöver det vi visar nu
  const nonCritical = stats.high + stats.normal + stats.low
  const remainingCount = Math.max(0, nonCritical - 1)

  return (
    <EventCardInline
      event={event}
      remainingCount={remainingCount}
    />
  )
}
