import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'

/**
 * Primary-kort för transfer-deadline-period.
 * Mock-referens: "Transfer-deadline"-tillståndet i portal_bag_mockup.html.
 *
 * CSS från mock:
 * .primary-card.deadline {
 *   background: linear-gradient(135deg, var(--bg-elevated) 0%, rgba(200,146,60,0.15) 100%);
 *   border-color: var(--warning);
 *   padding: 16px;
 * }
 */
export function TransferDeadlinePrimary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const managedId = game.managedClubId

  // Räkna omgångar kvar till deadline (omg 15)
  const completedLeague = game.fixtures.filter(f => f.status === 'completed' && !f.isCup)
  const currentRound = completedLeague.length > 0
    ? Math.max(...completedLeague.map(f => f.roundNumber))
    : 0
  const DEADLINE_ROUND = 15
  const roundsLeft = Math.max(0, DEADLINE_ROUND - currentRound)

  // Öppna inkommande bud
  const openBids = game.transferBids.filter(
    b => b.direction === 'incoming' && b.status === 'pending' && b.sellingClubId === managedId
  )

  // Senaste nyförvärv (accepterade bud)
  const recentSignings = game.transferBids.filter(
    b => b.status === 'accepted' && b.buyingClubId === managedId
  ).slice(-2)

  // Lönebud-andel
  const squadPlayers = game.players.filter(p => p.clubId === managedId)
  const club = game.clubs.find(c => c.id === managedId)
  const wageBudget = club?.wageBudget ?? 0
  const usedWage = squadPlayers.reduce((sum, p) => sum + (p.salary ?? 0), 0)
  const wagePct = wageBudget > 0 ? Math.round((usedWage / wageBudget) * 100) : 0

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--bg-portal-elevated) 0%, rgba(200,146,60,0.15) 100%)',
      border: '1px solid var(--warning)',
      borderRadius: 8,
      padding: 16,
      marginBottom: 14,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        fontSize: 9,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        fontWeight: 700,
        marginBottom: 8,
        color: 'var(--warning)',
      }}>
        ⏱ DEADLINE · {roundsLeft} OMGÅNG{roundsLeft !== 1 ? 'AR' : ''} KVAR
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        fontWeight: 700,
        lineHeight: 1.2,
        color: 'var(--text-light)',
        marginBottom: 6,
      }}>
        Transferfönstret stänger
      </div>
      <div style={{
        fontSize: 12,
        color: 'var(--text-light-secondary)',
        lineHeight: 1.5,
        marginBottom: 10,
      }}>
        {openBids.length > 0
          ? `${openBids.length} öppna bud kräver svar`
          : 'Inga öppna bud just nu'}
        {recentSignings.length > 0 && ` · ${recentSignings.length} nyförvärv`}
      </div>
      <div style={{
        display: 'flex',
        gap: 12,
        fontSize: 10,
        color: 'var(--text-muted)',
        marginTop: 8,
        paddingTop: 8,
        borderTop: '1px solid var(--bg-leather)',
      }}>
        <span>
          <strong style={{ color: 'var(--text-light-secondary)', fontWeight: 600 }}>Lönebudget:</strong> {wagePct}% använd
        </span>
        <span>
          <strong style={{ color: 'var(--text-light-secondary)', fontWeight: 600 }}>Spelare:</strong> {squadPlayers.length}
        </span>
      </div>
      <button
        onClick={() => navigate('/game/transfers')}
        className="btn btn-primary"
        style={{ width: '100%', marginTop: 12 }}
      >
        Hantera bud →
      </button>
    </div>
  )
}
