import type { Player } from '../../../domain/entities/Player'
import type { Club } from '../../../domain/entities/Club'
import type { TransferBid } from '../../../domain/entities/GameEvent'
import { formatValue } from '../../utils/formatters'

interface IncomingBidCardProps {
  bid: TransferBid
  player: Player
  buyingClub: Club
  currentRound: number
  onAccept: () => void
  onReject: () => void
}

/**
 * AUDIT DEL 2 B1 (2026-08-09): förstaklasskort på Marknad för inkommande bud —
 * inte längre bara ett inbox-item. Motiv-fälten (dreamClub/lojalitet) är
 * strukturerad data, inte skriven prosa — Code skriver aldrig svensk speltext
 * (CLAUDE.md), så "motiv" visas som etiketter/siffror, samma register som
 * playerNotesService.ts:s formatMetadata ("Lojalitet X/10"), inte en ny mening.
 */
export function IncomingBidCard({ bid, player, buyingClub, currentRound, onAccept, onReject }: IncomingBidCardProps) {
  const roundsLeft = (bid.expiresRound ?? 0) - currentRound
  const isDreamClub = player.dreamClubId === buyingClub.id
  const loyalty = player.loyaltyScore

  return (
    <div className="card-sharp transfers-state-copper-strong" style={{ marginBottom: 16, padding: '12px 14px' }}>
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

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onReject}
          className="btn btn-outline"
          style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 600 }}
        >
          Avslå
        </button>
        <button
          onClick={onAccept}
          className="btn btn-copper"
          style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 600 }}
        >
          Acceptera
        </button>
      </div>
    </div>
  )
}
