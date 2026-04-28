import type { CardRenderProps } from '../portalTypes'
import { getFormResults } from '../../../utils/formUtils'

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

  const standing = game.standings.find(s => s.clubId === opponentId)
  const recentForm = getFormResults(opponentId, game.fixtures, game.clubs)
  if (recentForm.length === 0) return null

  const formStr = recentForm.slice(-5).map(r => r.result).join(' ')

  return (
    <div style={{
      background: 'var(--bg-portal-surface)',
      border: '1px solid var(--bg-leather)',
      borderRadius: 6,
      padding: '8px 10px',
    }}>
      <div style={{
        fontSize: 8,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        fontWeight: 600,
        marginBottom: 4,
      }}>
        🆚 {opponent.name.split(' ')[0].toUpperCase()} FORM
      </div>
      <div style={{
        fontSize: 13,
        color: 'var(--text-light)',
        lineHeight: 1.3,
        fontWeight: 500,
      }}>
        {formStr || '—'}
      </div>
      {standing && (
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
          {standing.position}:a · {standing.points}p
        </div>
      )}
    </div>
  )
}
