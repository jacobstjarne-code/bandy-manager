import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import { calcRoundIncome } from '../../../../domain/services/economyService'
import { formatFinanceAbs } from '../../../utils/formatters'

/** Secondary-kort: kassan + burnrate. */
export function EkonomiSecondary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const managedId = game.managedClubId
  const club = game.clubs.find(c => c.id === managedId)
  const squadPlayers = game.players.filter(p => p.clubId === managedId)
  const standing = game.standings.find(s => s.clubId === managedId)

  const legendSalaryCost = ((game.clubLegends ?? [])
    .filter(l => l.role === 'youth_coach' || l.role === 'scout').length) * 500

  const { netPerRound } = calcRoundIncome({
    club: club!,
    players: squadPlayers,
    sponsors: game.sponsors ?? [],
    communityActivities: game.communityActivities,
    fanMood: game.fanMood ?? 50,
    isHomeMatch: true,
    matchIsKnockout: false,
    matchIsCup: false,
    matchHasRivalry: false,
    standing: standing ?? null,
    rand: () => 0.5,
    legendSalaryCost,
  })

  const finances = club?.finances ?? 0
  const netSign = netPerRound >= 0 ? '+' : ''
  const netStr = `${netSign}${Math.round(netPerRound / 1000)} tkr/omg`

  return (
    <div
      style={{
        background: 'var(--bg-portal-surface)',
        border: '1px solid var(--bg-leather)',
        borderRadius: 6,
        padding: '8px 10px',
        cursor: 'pointer',
      }}
      onClick={() => navigate('/game/club', { state: { tab: 'ekonomi' } })}
    >
      <div style={{
        fontSize: 8,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        fontWeight: 600,
        marginBottom: 4,
      }}>
        💰 KASSA
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        fontWeight: 700,
        color: finances < 0 ? 'var(--danger)' : 'var(--text-light)',
        lineHeight: 1.3,
      }}>
        {formatFinanceAbs(finances)}
      </div>
      <div style={{
        fontSize: 9,
        color: netPerRound >= 0 ? 'var(--success)' : 'var(--danger)',
        marginTop: 2,
      }}>
        {netStr}
      </div>
    </div>
  )
}
