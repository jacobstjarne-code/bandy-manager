/**
 * eventQueueService — sortering och statistik för pendingEvents-kön.
 *
 * Pure functions — inga side effects, inga store-anrop.
 */

import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent, EventPriority } from '../entities/GameEvent'
import { getEventPriority } from '../entities/GameEvent'
import { getEffectiveWhyNowLine } from '../data/contentContract'

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

/**
 * D1 punkt 4 (DOM_D1_EVENTVIKTNING_2026-08-19.md) — självkontrollen. "Kan
 * ingen av de fyra raderna sättas, ska vikten sänkas till normal." Ett
 * `critical`-event utan en "därför nu"-rad är enligt domen inte verkligt
 * pivotal och tappar sin overlay-behandling.
 *
 * KOPPLAD MOT REGISTRET, INTE MOT GISSNING (Jacobs dom 2026-08-21): whyNow-
 * data läses primärt ur `contentContract.ts` per `event.type`. Medium 4
 * (Skutskär-auditen, 2026-08-22): "Prioritera per undertyp/instans, inte
 * bara GameEventType" — getEffectiveWhyNowLine() läser nu FÖRST event-
 * instansens egen `whyNow`-signal (satt vid konstruktionsstället för en
 * SPECIFIK instans, t.ex. det irreversibla stjärnsälj-ultimatumet i
 * economicCrisisService.ts fas 3) innan den faller tillbaka på typ-raden.
 * En bastuinbjudan (samma GameEventType) utan egen whyNow-signal förblir
 * 'normal' — bara den instans som faktiskt bär brådska blir 'critical'.
 */
export function getEffectivePriority(event: GameEvent): EventPriority {
  const raw = event.priority ?? getEventPriority(event.type)
  if (raw !== 'critical') return raw
  return getEffectiveWhyNowLine(event) === null ? 'normal' : 'critical'
}

export type EventRenderTarget = 'overlay' | 'inline' | 'ambient'

/**
 * Central källa för VAR ett pending event ska renderas. GameShell (EventOverlay-
 * gaten) och PortalEventSlot (inline-gaten) läste tidigare var sin kopia av
 * samma priority==='critical'-check — två ställen
 * som kunde glida isär (samma klass av bugg som Å7:s dubbelpadding). Ett event
 * utan val rutas ALLTID till 'ambient', oavsett priority — annars softlockar ett
 * kritiskt event utan val EventOverlay (fullskärmsmodal utan knappar, upptäckt
 * 2026-08-19 vid D1-utredningen: EventOverlay läste event.choices direkt utan
 * getActionsForEvent-fallbacken som EventCardInline redan hade).
 *
 * Läser getEffectivePriority (D1 punkt 4), inte raw priority — se den
 * funktionen för varför overlay-kategorin är tom tills contentContract.ts
 * fylls i.
 */
export function getEventRenderTarget(event: GameEvent): EventRenderTarget {
  if (isAmbientEvent(event)) return 'ambient'
  return getEffectivePriority(event) === 'critical' ? 'overlay' : 'inline'
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
    const ap = PRIORITY_RANK[getEffectivePriority(a)] ?? PRIORITY_RANK.normal
    const bp = PRIORITY_RANK[getEffectivePriority(b)] ?? PRIORITY_RANK.normal
    if (ap !== bp) return ap - bp
    // FIFO inom samma prio — bevara array-ordning
    return events.indexOf(a) - events.indexOf(b)
  })

  return sorted[0]
}

/**
 * Batch-av-tre (D1 punkt 4, dömd 2026-08-21). Ger de ÖVRIGA medlemmarna i
 * `activeEvent`s batch — events som delar `triggerGroupId`, är obesvarade,
 * inte är `activeEvent` självt. "Gränsen är delad orsak, inte antal — och
 * alltid ≤3": max 2 syskon returneras (aktivt + 2 = 3 totalt), och ett
 * pivotal-klassat syskon (getEffectivePriority==='critical') filtreras
 * bort — "Ett pivotal-event får aldrig hamna i en batch", det bryter
 * stapeln och visas ensamt i EventOverlay istället. Utan triggerGroupId på
 * `activeEvent` returneras alltid [] (inget att batcha ihop mot).
 */
export function getBatchSiblings(game: SaveGame, activeEvent: GameEvent): GameEvent[] {
  if (!activeEvent.triggerGroupId) return []
  const events = (game.pendingEvents ?? []).filter(e => !e.resolved)
  return events
    .filter(e =>
      e.id !== activeEvent.id &&
      e.triggerGroupId === activeEvent.triggerGroupId &&
      getEffectivePriority(e) !== 'critical'
    )
    .slice(0, 2)
}

/**
 * Statistik för Portal-visning och debugging.
 */
export function getQueueStats(game: SaveGame): QueueStats {
  const events = (game.pendingEvents ?? []).filter(e => !e.resolved)
  return {
    total: events.length,
    critical: events.filter(e => getEffectivePriority(e) === 'critical').length,
    high: events.filter(e => getEffectivePriority(e) === 'high').length,
    normal: events.filter(e => getEffectivePriority(e) === 'normal').length,
    low: events.filter(e => getEffectivePriority(e) === 'low').length,
  }
}
