import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import { getFormResults } from '../../../utils/formUtils'

/** Secondary-kort: tabellposition + poäng + senaste 5 matcher. */
export function TabellSecondary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const managedId = game.managedClubId
  const standing = game.standings.find(s => s.clubId === managedId)

  const recentForm = getFormResults(managedId, game.fixtures, game.clubs)
  const formStr = recentForm.slice(-5).map(r => r.result).join(' ')

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '8px 10px',
        cursor: 'pointer',
      }}
      onClick={() => navigate('/game/tabell')}
    >
      <div style={{
        fontSize: 8,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        fontWeight: 600,
        marginBottom: 4,
      }}>
        📊 TABELL
      </div>
      {standing ? (
        <>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
          }}>
            {standing.position}:a
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
            {standing.points}p · form: {formStr || '—'}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>—</div>
      )}
    </div>
  )
}
