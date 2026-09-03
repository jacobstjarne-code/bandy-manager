/**
 * EventCardInline — visar ett medium eller atmosfäriskt event inline i Portal.
 * Används av PortalEventSlot. Kritiska events hanteras av EventOverlay.
 *
 * Visuell anatomi per spec:
 * - card-sharp-mönster (1 px border, 8 px radius), --bg-portal-surface bakgrund
 * - Prio-signal i typ-label-färg: high/normal = accent, low = muted
 * - Body-text: Georgia 13px italic
 * - Knapprad med actions från getActionsForEvent — alla `.btn .btn-outline`
 *   (en-primär-grinden: Portalens sticky CTA är den enda `.btn-primary`)
 * - Räknarrad hanteras av PortalInboxCounter (i botten av PortalScreen)
 *
 * GEMENSAM BESLUTSMODELL (2026-08-12): INTE migrerad till DecisionCard.
 * Wrappern delar redan knapp-lagret (DecisionChoices nedan) men chrome:et
 * hör till Portal-kortfamiljen, inte Granska/EventOverlay-familjen: vänster-
 * stripen (portal-card-stripe), eyebrow-typografin (portal-card-eyebrow,
 * inte SectionLabel/.h-label), och ålders-förfallsklasserna (aged-1/aged-2)
 * är alla delade med ANDRA Portal-kort, inte unika för händelsekort. Att
 * tvinga in dem i DecisionCard hade antingen svällt komponenten med Portal-
 * specifika props eller brutit den delningen med resten av Portal-familjen.
 */

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { getActionsForEvent } from '../../../domain/services/eventActions'
import { getItemAge } from '../../../domain/services/decisionFatigueService'
import { getInjurySeverity } from '../../../domain/data/injuryDoctorText'
import { getEventTypeMeta } from '../../../domain/data/eventTypeLabels'
import { DecisionChoices } from '../DecisionChoices'
import { SponsorCounterModal } from './SponsorCounterModal'
import type { GameEvent } from '../../../domain/entities/GameEvent'
import type { Player } from '../../../domain/entities/Player'
import type { Sponsor } from '../../../domain/entities/Sponsor'

/**
 * High 6 (Skutskär-auditen, 2026-08-22): eventet bar redan relatedPlayerId
 * och en titel med spelarens namn (eventProcessor.ts) — men kortet visade
 * bara den generiska brödtexten ("Han vill spela...") utan att någonsin
 * rendera titeln eller namnet. Flera samtidiga playThroughInjury-kort gick
 * inte att skilja åt. Samma player-tag-mönster som EventOverlay.tsx, men
 * med namn+dagar-kvar istf generisk "Styrka X" — det är de två sifforna
 * beslutet faktiskt hänger på här. Ren funktion, exporterad så logiken kan
 * testas utan att rendera komponenten eller mocka Zustand-storen.
 */
export function getInjuryTag(event: GameEvent, players: Player[] | undefined): string | undefined {
  if (event.type !== 'playThroughInjury' || !event.relatedPlayerId) return undefined
  const player = players?.find(p => p.id === event.relatedPlayerId)
  if (!player) return undefined
  // A-M6 (SLUTTEST_KO): erbjudandet skapas i checkForPlayThroughInjuryOffer
  // mot ett spelar-snapshot TAGET FÖRE samma omgångs skaderullning
  // (playerStateProcessor.ts, -7 dagar/omgång). Om spelaren låg exakt på
  // gränsen (t.ex. 7 dagar kvar, mjuk) hinner hen bli frisk (injuryDaysRemaining
  // → 0, isInjured → false) i SAMMA anrop till advanceToNextEvent — kortet
  // renderas sedan mot den redan uppdaterade spelaren, med "0 dagar kvar" som
  // resultat. Gata på > 0: spelaren är per definition inte skadad vid 0,
  // visa istf ett frisk-läge — erbjudandet är moot men kortet ska ändå
  // beskriva verkligheten, inte ett omöjligt sifferläge.
  if (player.injuryDaysRemaining <= 0) {
    return `${player.firstName} ${player.lastName} · Frisk`
  }
  const severity = getInjurySeverity(player.injuryDaysRemaining)
  const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1)
  return `${player.firstName} ${player.lastName} · ${severityLabel} skada · ${player.injuryDaysRemaining} dagar kvar`
}

interface Props {
  event: GameEvent
  currentMatchday?: number
}

/**
 * Exporterad (D1, 2026-08-19) så AmbientEventRow.tsx kan återanvända samma
 * emoji+etikett-mappning — en källa, inte en dubblett (Port 4).
 *
 * A-M3 (SEXSÄSONGSAUDITEN 2026-08-26): läste tidigare en egen switch med
 * bara 17/49 GameEventType-fall (generisk '📋 HÄNDELSE'-fallback för
 * resten — läckte aldrig rått här, men dubblerade PortalQueueRail.tsx:s
 * SOURCE_META-logik, som VAR hålig). Läser nu den exhaustiva
 * src/domain/data/eventTypeLabels.ts — en sanning, delad av båda ytorna.
 */
export function getEventTypeLabel(event: GameEvent): string {
  const { icon, label } = getEventTypeMeta(event.type)
  return `${icon} ${label.toUpperCase()}`
}

export function EventCardInline({ event, currentMatchday }: Props) {
  const resolveEvent = useGameStore(s => s.resolveEvent)
  const previewSponsorCounter = useGameStore(s => s.previewSponsorCounter)
  const commitSponsorCounter = useGameStore(s => s.commitSponsorCounter)
  const players = useGameStore(s => s.game?.players)
  // DOM_SPONSOR_MOTBUD_2026-08-31.md: choiceId==='counter' fångas HÄR, före
  // resolveEvent — Y är fri inmatning (SponsorCounterModal), inte ett
  // fördefinierat val. Detta är den enda platsen sponsorOffer faktiskt
  // renderas (PortalEventSlot → EventCardInline), se rotorsak i D-fact.
  const [showCounterModal, setShowCounterModal] = useState(false)
  const actions = getActionsForEvent(event)
  const typeLabel = getEventTypeLabel(event)
  const injuryTag = getInjuryTag(event, players)
  // Entitets-dedup-grinden (2026-08-12): ett event OM ett bud ÄR budet, inte
  // en separat entitet — event.id och bid.id är olika strängar för samma
  // sak. relatedBidId är den kanoniska identiteten när den finns (matchar
  // OpenBidsSecondary/IncomingBidCard/TransfersOutgoingBid), annars faller
  // det tillbaka på event.id.
  const entityId = event.relatedBidId ? `bid:${event.relatedBidId}` : `event:${event.id}`

  const age = currentMatchday != null ? getItemAge(event, currentMatchday) : 0
  const agedClass = age >= 5 ? 'aged-2' : age >= 3 ? 'aged-1' : ''

  function handleAction(choiceId: string) {
    if (event.type === 'sponsorOffer' && choiceId === 'counter') {
      setShowCounterModal(true)
      return
    }
    resolveEvent(event.id, choiceId, true)
  }

  let sponsorForCounter: Sponsor | null = null
  if (showCounterModal && event.sponsorData) {
    try {
      sponsorForCounter = JSON.parse(event.sponsorData)
    } catch {
      sponsorForCounter = null
    }
  }

  return (
    <div
      className={`event-card-inline${agedClass ? ` ${agedClass}` : ''}`}
      style={{
        position: 'relative',
        margin: '0 0 8px 0',
        background: 'var(--bg-portal-surface)',
        border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px 14px 18px',
      }}
      data-entity-id={entityId}
      data-entity-source="EventCardInline"
    >
      {/* Vänster-stripe — action card, 3 px */}
      <div className="portal-card-stripe portal-card-stripe-copper-wide" />

      {/* Typ-label — eyebrow, klassbaserad */}
      <p className="portal-card-eyebrow" style={{ display: 'flex', alignItems: 'center' }}>
        <span>{typeLabel}</span>
        {agedClass && age > 0 && (
          <span className="event-card-age-tag">{age} omg gammal</span>
        )}
      </p>

      {/* Titel — visas för hallDebate-events */}
      {event.type === 'hallDebate' && event.title && (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, color: 'var(--text-light)', lineHeight: 1.35, marginBottom: 8 }}>
          {event.title}
        </div>
      )}

      {/* High 6: spelar-tag för playThroughInjury — namn, skada, dagar kvar */}
      {injuryTag && (
        <div style={{ marginBottom: 8 }}>
          <span style={{
            fontSize: 11,
            borderRadius: 99,
            padding: '3px 8px',
            fontWeight: 600,
            background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
            color: 'var(--accent)',
          }}>
            {injuryTag}
          </span>
        </div>
      )}

      {/* Body-text */}
      <p style={{
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        fontStyle: 'italic',
        color: 'var(--text-light)',
        lineHeight: 1.6,
        marginBottom: 12,
      }}>
        {event.body}
      </p>

      {/* Knapprad — alla outline (en-primär-grinden, post 18/Å3-Å4-mönstret:
          Portalens sticky CTA är den enda .btn-primary, alltid. Tidigare
          gav första action .btn-primary här, vilket kolliderade med CTA:n
          och slog upp osynligt tills portal-bid-single/-multi registrerades
          i sceneRegistry.ts, 2026-08-22 — samma lucka-klass som Å3/Å4. */}
      <DecisionChoices
        choices={actions.map(a => ({ id: a.choiceId, label: a.label }))}
        onChoose={(id) => handleAction(id)}
        layout="inline"
      />

      {sponsorForCounter && (
        <SponsorCounterModal
          sponsor={sponsorForCounter}
          onClose={() => setShowCounterModal(false)}
          onPreview={(requestedWeeklyIncome) => previewSponsorCounter(event.id, requestedWeeklyIncome)}
          onCommit={(requestedWeeklyIncome, outcome) => commitSponsorCounter(event.id, requestedWeeklyIncome, outcome)}
        />
      )}
    </div>
  )
}
