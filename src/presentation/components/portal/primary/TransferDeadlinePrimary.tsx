import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import { getQueueableOpenBids } from '../../../../domain/services/portal/triggers/transferTriggers'

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

  // AUDIT DEL 2 (2026-08-11), Berg-budets dubbelrendering: getQueueableOpenBids
  // istf rå transferBids-filtrering — ett bud som redan visas som eget
  // HÄNDELSE-kort (PortalEventSlot) ska inte också räknas här ("N öppna bud
  // kräver svar" + en "Hantera bud →"-knapp som pekar på samma sak).
  const openBids = getQueueableOpenBids(game)
  // Kontrollfall efter samma fix: om DET ENDA budet redan visas som eget
  // HÄNDELSE-kort blir openBids tom — men "Inga öppna bud just nu" vore då
  // ett falskt påstående (det FINNS ett öppet bud, det är bara redan
  // besvarat ovanför). rawOpenBidCount skiljer "genuint noll" från
  // "redan hanterat" utan att någon ny svensk text behöver skrivas —
  // den missvisande raden utelämnas helt i det tredje fallet istf att
  // ersättas med en påhittad mening.
  const rawOpenBidCount = game.transferBids.filter(
    b => b.direction === 'incoming' && b.status === 'pending' && b.sellingClubId === managedId
  ).length
  const allOpenBidsAlreadyShown = rawOpenBidCount > 0 && openBids.length === 0
  const bidLine = openBids.length > 0
    ? `${openBids.length} öppna bud kräver svar`
    : allOpenBidsAlreadyShown ? null : 'Inga öppna bud just nu'

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
      <div className="h-label" style={{ marginBottom: 8, color: 'var(--warning)' }}>
        ⏱ DEADLINE · {roundsLeft} OMGÅNG{roundsLeft !== 1 ? 'AR' : ''} KVAR
      </div>
      <div className="h-display-sm" style={{ color: 'var(--text-light)', marginBottom: 6 }}>
        Transferfönstret stänger
      </div>
      {(bidLine || recentSignings.length > 0) && (
        <div style={{
          fontSize: 12,
          color: 'var(--text-light-secondary)',
          lineHeight: 1.5,
          marginBottom: 10,
        }}>
          {bidLine}
          {bidLine && recentSignings.length > 0 && ' · '}
          {recentSignings.length > 0 && `${recentSignings.length} nyförvärv`}
        </div>
      )}
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
      {openBids.length > 0 && (
        <button
          onClick={() => navigate('/game/transfers')}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 12 }}
        >
          Hantera bud →
        </button>
      )}
    </div>
  )
}
