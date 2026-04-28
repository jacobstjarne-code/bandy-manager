import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'

/** Secondary-kort: skadade spelare + beräknad återkomst. */
export function InjuryStatusSecondary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const managedId = game.managedClubId
  const squadPlayers = game.players.filter(p => p.clubId === managedId)
  const injured = squadPlayers.filter(p => p.isInjured)

  if (injured.length === 0) return null

  const names = injured
    .slice(0, 2)
    .map(p => p.lastName)
    .join(', ')
  const extra = injured.length > 2 ? ` +${injured.length - 2}` : ''

  return (
    <div
      style={{
        background: 'var(--bg-portal-surface)',
        border: '1px solid var(--bg-leather)',
        borderRadius: 6,
        padding: '8px 10px',
        cursor: 'pointer',
      }}
      onClick={() => navigate('/game/squad')}
    >
      <div style={{
        fontSize: 8,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        fontWeight: 600,
        marginBottom: 4,
      }}>
        🩹 SKADELÄGE
      </div>
      <div style={{
        fontSize: 13,
        color: 'var(--text-light)',
        lineHeight: 1.3,
        fontWeight: 500,
      }}>
        {injured.length} borta
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
        {names}{extra}
      </div>
    </div>
  )
}
