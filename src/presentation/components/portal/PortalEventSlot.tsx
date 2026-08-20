/**
 * PortalEventSlot — visar nästa icke-kritiska event inline i Portal.
 *
 * Renderas mellan SituationCard/PortalBeat och Primary card.
 * Returnerar null om:
 *   - attention.kind !== 'event' (idle, screen eller scene styr)
 *   - getEventRenderTarget(event) === 'overlay' (kritiska icke-ambienta events,
 *     dessa hanteras av EventOverlay)
 *
 * D1 (DOM_D1_EVENTVIKTNING_2026-08-19.md) punkt 2 — ambienta events (utan val)
 * fångas HÄR oavsett priority, som AmbientEventRow — de får aldrig ett kort.
 * Medium och atmosfäriska events (med val) visas som EventCardInline.
 */

import { getCurrentAttention } from '../../../domain/services/attentionRouter'
import { getEventRenderTarget, getBatchSiblings } from '../../../domain/services/eventQueueService'
import { EventCardInline } from './EventCardInline'
import { AmbientEventRow } from './AmbientEventRow'
import { CeremonyRetirement } from './CeremonyRetirement'
import { BatchStack } from './BatchStack'
import type { SaveGame } from '../../../domain/entities/SaveGame'

// Batch-av-tre (D1 punkt 4, 2026-08-21): "beta av, inte bläddra" — 220ms
// sjunk-och-tona-ut innan resolveEvent faktiskt körs, så nästa kort i
// stapeln hinner resas med sin egen entré istf att bytas ut direkt.
const BATCH_EXIT_DELAY_MS = 220

interface Props {
  game: SaveGame
}

export function PortalEventSlot({ game }: Props) {
  const attention = getCurrentAttention(game)

  // Bara render om det är ett event (inte screen/scene/idle)
  if (attention.kind !== 'event') return null

  const event = attention.event
  const target = getEventRenderTarget(event)

  // Suppressa community-events under cup-finalhelgen (tonalt fel att visa bandyskola under finalen)
  const currentSlot = (game.seasonCalendar ?? []).find(s => s.matchday === game.currentMatchday)
  if (currentSlot?.isCupFinalhelgen && event.type === 'communityEvent') return null

  // Ambienta events (utan val) — ambient rad, oavsett priority. Måste fångas
  // här: EventOverlay (GameShell.tsx) skippar dem numera helt.
  if (target === 'ambient') {
    return <AmbientEventRow event={event} />
  }

  // Kritiska (icke-ambienta) går via EventOverlay (utanför Portal). Skippa här.
  if (target === 'overlay') return null

  // Retirement ceremony gets full-screen chrome (legend farewell)
  if (event.type === 'retirementCeremony') {
    return <CeremonyRetirement game={game} event={event} />
  }

  // Batch-av-tre: bara chrome när det faktiskt finns ≥1 syskon med samma
  // triggerGroupId. Ett enskilt event (ingen delad orsak) ser ut som innan.
  const siblings = getBatchSiblings(game, event)
  if (siblings.length > 0) {
    return (
      <BatchStack siblingCount={siblings.length} totalInBatch={siblings.length + 1}>
        <EventCardInline key={event.id} event={event} currentMatchday={game.currentMatchday} exitDelayMs={BATCH_EXIT_DELAY_MS} />
      </BatchStack>
    )
  }

  return (
    <EventCardInline event={event} currentMatchday={game.currentMatchday} />
  )
}
