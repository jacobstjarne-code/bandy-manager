import type { Player } from '../../../domain/entities/Player'
import type { Club } from '../../../domain/entities/Club'
import type { TransferBid, EventChoice } from '../../../domain/entities/GameEvent'
import { formatValue } from '../../utils/formatters'
import { DecisionChoices } from '../DecisionChoices'

interface IncomingBidCardProps {
  bid: TransferBid
  player: Player
  buyingClub: Club
  currentRound: number
  choices: EventChoice[]
  onChoose: (choiceId: string) => void
}

/**
 * AUDIT DEL 2 B1 (2026-08-09): förstaklasskort på Marknad för inkommande bud —
 * inte längre bara ett inbox-item. Motiv-fälten (dreamClub/lojalitet) är
 * strukturerad data, inte skriven prosa — Code skriver aldrig svensk speltext
 * (CLAUDE.md), så "motiv" visas som etiketter/siffror, samma register som
 * playerNotesService.ts:s formatMetadata ("Lojalitet X/10"), inte en ny mening.
 *
 * ÖVERLÄMNING 2 (2026-08-12): choices/onChoose istf onAccept/onReject —
 * TransfersScreen skickar samma bidReceivedEvent(bid, game).choices som
 * resolveEvent-vägen redan använder, så Marknad och HÄNDELSE-kortet visar
 * exakt samma alternativ (inklusive "Kräv mer" när det är tillgängligt).
 * DecisionChoices, inte handrullade knappar — samma delade knapplager som
 * resten av gemensam-beslutsmodell-migreringen (d934aa1e).
 */
export function IncomingBidCard({ bid, player, buyingClub, currentRound, choices, onChoose }: IncomingBidCardProps) {
  const roundsLeft = (bid.expiresRound ?? 0) - currentRound
  const isDreamClub = player.dreamClubId === buyingClub.id
  const loyalty = player.loyaltyScore

  return (
    <div
      className="card-sharp transfers-state-copper-strong"
      style={{ marginBottom: 16, padding: '12px 14px' }}
      data-entity-id={`bid:${bid.id}`}
      data-entity-source="IncomingBidCard"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <p className="transfers-list-name-lg" style={{ marginBottom: 2 }}>
            {player.firstName} {player.lastName}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {buyingClub.name} · Bud: {formatValue(bid.offerAmount)}
          </p>
        </div>
        <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {roundsLeft > 0 ? `Svar om ${roundsLeft} omg.` : 'Svar väntat'}
        </span>
      </div>

      {(isDreamClub || loyalty != null) && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {isDreamClub && <span className="tag tag-copper">Drömklubb</span>}
          {loyalty != null && <span className="tag" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Lojalitet {loyalty}/10</span>}
        </div>
      )}

      <DecisionChoices choices={choices} onChoose={onChoose} primaryChoiceId="accept" />
    </div>
  )
}
