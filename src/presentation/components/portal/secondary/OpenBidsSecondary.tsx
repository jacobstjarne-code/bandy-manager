import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import { getQueueableOpenBids } from '../../../../domain/services/portal/triggers/transferTriggers'

/**
 * Secondary-kort: öppna bud + klubbnamn. AUDIT DEL 2 (2026-08-11): läser
 * getQueueableOpenBids istf att filtrera game.transferBids själv — samma
 * källa som hasOpenBids-triggern, så ett bud som redan visas som eget
 * HÄNDELSE-kort (PortalEventSlot) aldrig också dyker upp här.
 */
export function OpenBidsSecondary({ game }: CardRenderProps) {
  const navigate = useNavigate()

  const openBids = getQueueableOpenBids(game)

  if (openBids.length === 0) return null

  const firstBid = openBids[0]
  const player = game.players.find(p => p.id === firstBid.playerId)
  const buyingClub = game.clubs.find(c => c.id === firstBid.buyingClubId)
  const amountTkr = Math.round(firstBid.offerAmount / 1000)

  return (
    <div
      style={{
        background: 'var(--bg-portal-surface)',
        border: '1px solid var(--bg-leather)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 10px',
        cursor: 'pointer',
      }}
      onClick={() => navigate('/game/transfers')}
    >
      <div style={{
        fontSize: 8,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        fontWeight: 600,
        marginBottom: 4,
      }}>
        💼 BUD{openBids.length > 1 ? ` (${openBids.length})` : ''}
      </div>
      <div style={{
        fontSize: 13,
        color: 'var(--text-light)',
        lineHeight: 1.3,
        fontWeight: 500,
      }}>
        {player ? player.lastName : '—'} · {amountTkr} tkr
      </div>
      <div className="h-micro" style={{ color: 'var(--text-muted)', marginTop: 2 }}>
        {buyingClub?.name ?? 'Okänd klubb'} · svar krävs
      </div>
    </div>
  )
}
