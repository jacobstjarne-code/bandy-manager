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
 *
 * HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md, 2026-08-31): VILKET
 * beslut som får kortet avgörs inte längre av köordningen (getNextEvent →
 * attentionRouter) utan av visningsregeln — översta måste, annars översta
 * månad (selectDashboardDecisions, decisionTierService.ts). Bakgrundsnivån
 * (press, orten, småval) får ALDRIG ett dashboardkort; den besvaras där den
 * hör hemma (Granska-flikarna, presskonferensskärmen, EventOverlay för de
 * kritiska). Resten av månadskön batchas till ETT sekundärt kort
 * (MonthDecisionsSecondary, registrerat i initCardBag.ts) — aldrig som flera
 * likvärdiga kort här.
 *
 * OFÖRÄNDRAT av HIGH 11, medvetet: ambient-raden (D1 punkt 2),
 * overlay-routningen (EventOverlay äger de kritiska) och avskedsceremonin
 * (CeremonyRetirement är en helskärmsceremoni, inte ett beslutskort — samma
 * undantag som PressConferenceScene).
 */

import { getCurrentAttention } from '../../../domain/services/attentionRouter'
import { getEventRenderTarget } from '../../../domain/services/eventQueueService'
import { selectDashboardDecisions } from '../../../domain/services/decisionTierService'
import { EventCardInline } from './EventCardInline'
import { AmbientEventRow } from './AmbientEventRow'
import { CeremonyRetirement } from './CeremonyRetirement'
import type { SaveGame } from '../../../domain/entities/SaveGame'

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

  // HIGH 11 — visningsregeln. Kortet är inte längre "nästa i kön" utan det
  // primära beslutet: översta måste, annars översta månad. Bakgrund ger null
  // (inget dashboardkort), även när den ligger först i kön.
  const primary = selectDashboardDecisions(game).primary
  if (!primary) return null
  // Skulle det primära vara overlay-routat äger EventOverlay det.
  if (getEventRenderTarget(primary) === 'overlay') return null

  return (
    <EventCardInline event={primary} currentMatchday={game.currentMatchday} />
  )
}
