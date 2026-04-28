import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'

/** Secondary-kort: öppna bud + klubbnamn. */
export function OpenBidsSecondary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const managedId = game.managedClubId

  const openBids = game.transferBids.filter(
    b => b.direction === 'incoming' && b.status === 'pending' && b.sellingClubId === managedId
  )

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
        borderRadius: 6,
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
      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
        {buyingClub?.name ?? 'Okänd klubb'} · svar krävs
      </div>
    </div>
  )
}
