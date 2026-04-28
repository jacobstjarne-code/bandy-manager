import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import { getRivalry } from '../../../../domain/data/rivalries'
import { getRoundDate } from '../../../../domain/services/scheduleGenerator'

/**
 * Primary-kort för derbymatchdag.
 * Mock-referens: "Derby"-tillståndet i portal_bag_mockup.html.
 *
 * CSS från mock:
 * .primary-card.derby {
 *   background: linear-gradient(135deg, var(--bg-elevated) 0%, rgba(160,72,72,0.15) 100%);
 *   border-color: var(--danger);
 *   padding: 16px (primary-card default);
 * }
 */
export function DerbyPrimary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const managedId = game.managedClubId

  const nextFixture = game.fixtures
    .filter(f => f.status === 'scheduled' && (f.homeClubId === managedId || f.awayClubId === managedId))
    .sort((a, b) => a.matchday - b.matchday)[0] ?? null

  if (!nextFixture) return null

  const opponentId = nextFixture.homeClubId === managedId ? nextFixture.awayClubId : nextFixture.homeClubId
  const opponent = game.clubs.find(c => c.id === opponentId)
  if (!opponent) return null

  const isHome = nextFixture.homeClubId === managedId
  const rivalry = getRivalry(managedId, opponentId)
  const rivalryName = rivalry?.name ?? 'Derbyt'

  // H2H-historik från rivalryHistory
  const h2h = game.rivalryHistory?.[opponentId]
  const histStr = h2h ? `V${h2h.wins} O${h2h.draws} F${h2h.losses}` : '—'

  // Klacken
  const sg = game.supporterGroup
  const klackInfo = sg ? `${sg.name} · mood ${sg.mood}` : null

  const roundDateStr = nextFixture.isCup ? '' : getRoundDate(nextFixture.season, nextFixture.roundNumber)
  const matchDate = roundDateStr ? new Date(roundDateStr) : null
  const MONTHS = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']
  const DAYS = ['Sön','Mån','Tis','Ons','Tor','Fre','Lör']
  const dateStr = matchDate
    ? `${DAYS[matchDate.getDay()]} ${matchDate.getDate()} ${MONTHS[matchDate.getMonth()]}`
    : ''

  const club = game.clubs.find(c => c.id === managedId)
  const arenaName = isHome ? (club?.arenaName ?? 'Hemmaplan') : (opponent.arenaName ?? 'Bortaplan')

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--bg-elevated) 0%, rgba(160,72,72,0.15) 100%)',
      border: '1px solid var(--danger)',
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
        color: 'var(--danger)',
      }}>
        🔥 {rivalryName} · IMORGON
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        fontWeight: 700,
        lineHeight: 1.2,
        color: 'var(--text-primary)',
        marginBottom: 6,
      }}>
        {opponent.name} · {isHome ? 'Hemma' : 'Borta'}
      </div>
      <div style={{
        fontSize: 12,
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
        marginBottom: 10,
      }}>
        {dateStr} · {arenaName}
        {klackInfo && ` · ${klackInfo}`}
      </div>
      <div style={{
        display: 'flex',
        gap: 12,
        fontSize: 10,
        color: 'var(--text-muted)',
        marginTop: 8,
        paddingTop: 8,
        borderTop: '1px solid var(--border)',
      }}>
        <span><strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Historik:</strong> {histStr}</span>
        {h2h?.lastResult && (
          <span><strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Senast:</strong> {h2h.lastResult === 'win' ? 'V' : h2h.lastResult === 'loss' ? 'F' : 'O'}</span>
        )}
      </div>
      <button
        onClick={() => navigate('/game/match')}
        style={{
          width: '100%',
          marginTop: 12,
          background: 'linear-gradient(135deg, var(--accent-dark) 0%, var(--accent-deep) 100%)',
          color: 'var(--text-light)',
          border: 'none',
          padding: '12px 14px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.5px',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        Sätt lineup för derbyt →
      </button>
    </div>
  )
}
