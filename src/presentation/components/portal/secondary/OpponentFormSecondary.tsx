import type { CardRenderProps } from '../portalTypes'
import { getFormResults } from '../../../utils/formUtils'
import { getCurrentLeaguePosition } from '../../../../domain/services/standingsService'
import { getRivalry } from '../../../../domain/data/rivalries'
import { ScoreBlock } from '../../primitives/ScoreBlock'
import type { ScoreBlockVariant } from '../../primitives/ScoreBlock'

function resultToVariant(result: 'V' | 'O' | 'F', opponentId: string, managedId: string): ScoreBlockVariant {
  if (getRivalry(managedId, opponentId)) return 'derby'
  if (result === 'V') return 'win'
  if (result === 'F') return 'loss'
  return 'draw'
}

/** Secondary-kort: motståndarens senaste 5 matcher. */
export function OpponentFormSecondary({ game }: CardRenderProps) {
  const managedId = game.managedClubId

  const nextFixture = game.fixtures
    .filter(f => f.status === 'scheduled' && (f.homeClubId === managedId || f.awayClubId === managedId))
    .sort((a, b) => a.matchday - b.matchday)[0] ?? null

  if (!nextFixture) return null

  const opponentId = nextFixture.homeClubId === managedId ? nextFixture.awayClubId : nextFixture.homeClubId
  const opponent = game.clubs.find(c => c.id === opponentId)
  if (!opponent) return null

  const opponentLeaguePosition = getCurrentLeaguePosition(opponentId, game)
  const recentForm = getFormResults(opponentId, game.fixtures, game.clubs)
  if (recentForm.length === 0) return null

  const last5 = recentForm.slice(0, 5)

  return (
    <div style={{
      background: 'var(--bg-portal-surface)',
      border: '1px solid var(--bg-leather)',
      borderRadius: 'var(--radius-md)',
      padding: '8px 10px',
    }}>
      <div style={{
        fontSize: 8,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        fontWeight: 600,
        marginBottom: 6,
      }}>
        🆚 {opponent.name.split(' ')[0].toUpperCase()} FORM
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {last5.map((r, i) => (
          <ScoreBlock
            key={i}
            score={r.score}
            label={r.opponent}
            variant={resultToVariant(r.result, r.opponentId ?? '', managedId)}
            compact
          />
        ))}
      </div>
      {opponentLeaguePosition !== null && (
        <div className="h-micro" style={{ color: 'var(--text-muted)', marginTop: 6 }}>
          {opponentLeaguePosition}:a · {game.standings.find(s => s.clubId === opponentId)?.points ?? 0}p
        </div>
      )}
    </div>
  )
}
