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
  /**
   * Å4 (SLUTTEST_KO.md, 2026-08-18): primaryChoiceId="accept" var tidigare
   * ovillkorligt — tre inkommande bud gav tre samtidiga .btn-primary.
   * Bara kortet med mest brådskande svarsfrist ska vara primär; övriga
   * visar samma val men utan primär-styling (TransfersScreen sorterar och
   * sätter isPrimary bara på första kortet).
   */
  isPrimary: boolean
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
export function IncomingBidCard({ bid, player, buyingClub, currentRound, choices, onChoose, isPrimary }: IncomingBidCardProps) {
  const roundsLeft = (bid.expiresRound ?? 0) - currentRound
  const isDreamClub = player.dreamClubId === buyingClub.id
  const loyalty = player.loyaltyScore

  return (
    <div
      className="card-sharp transfers-state-copper-strong transfers-incoming-bid"
      data-entity-id={`bid:${bid.id}`}
      data-entity-source="IncomingBidCard"
    >
      <div className="transfers-incoming-header">
        <div>
          <p className="transfers-list-name-lg transfers-incoming-name">
            {player.firstName} {player.lastName}
          </p>
          <p className="transfers-incoming-meta">
            {buyingClub.name} · Bud: {formatValue(bid.offerAmount)}
          </p>
        </div>
        <span className="transfers-incoming-deadline">
          {roundsLeft > 0 ? `Svar om ${roundsLeft} omg.` : 'Svar väntat'}
        </span>
      </div>

      {(isDreamClub || loyalty != null) && (
        <div className="transfers-incoming-tags">
          {isDreamClub && <span className="tag tag-copper">Drömklubb</span>}
          {loyalty != null && <span className="tag transfers-loyalty-tag">Lojalitet {loyalty}/10</span>}
        </div>
      )}

      <DecisionChoices choices={choices} onChoose={onChoose} primaryChoiceId={isPrimary ? 'accept' : undefined} />
    </div>
  )
}
