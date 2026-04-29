import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import { getFormResults } from '../../../utils/formUtils'

/** Secondary-kort: tabellposition + formdottar + poängkontext. */
export function TabellSecondary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const managedId = game.managedClubId
  const standing = game.standings.find(s => s.clubId === managedId)
  const recentForm = getFormResults(managedId, game.fixtures, game.clubs).slice(-5)

  const dotColor = (r: 'V' | 'O' | 'F') =>
    r === 'V' ? 'var(--success)' : r === 'F' ? 'var(--danger)' : 'var(--accent)'

  const posLabel = (pos: number) => {
    if (pos === 1) return '1:a'
    if (pos === 2) return '2:a'
    if (pos === 3) return '3:e'
    return `${pos}:e`
  }

  // Playoff-zon är topp 8 i 12-lagsserien
  const inPlayoffZone = standing ? standing.position <= 8 : null
  const ptsDiff = (() => {
    if (!standing) return null
    const sorted = [...game.standings].sort((a, b) => b.points - a.points)
    if (inPlayoffZone) {
      const ninth = sorted[8]
      if (!ninth) return null
      const diff = standing.points - ninth.points
      return diff > 0 ? `+${diff}p till 9:a` : diff === 0 ? 'på gränsen' : `${diff}p från 9:a`
    } else {
      const eighth = sorted[7]
      if (!eighth) return null
      const diff = eighth.points - standing.points
      return `${diff}p till slutspel`
    }
  })()

  return (
    <div
      style={{
        background: 'var(--bg-portal-surface)',
        border: '1px solid var(--bg-leather)',
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
            color: 'var(--text-light)',
            lineHeight: 1.1,
          }}>
            {posLabel(standing.position)}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>
            {standing.points}p · {standing.wins}V {standing.draws}O {standing.losses}F
          </div>
          {recentForm.length > 0 && (
            <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
              {Array.from({ length: 5 }, (_, i) => {
                const r = recentForm[i]
                return (
                  <div key={i} style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: r ? dotColor(r.result) : 'var(--bg-portal-elevated)',
                  }} />
                )
              })}
            </div>
          )}
          {ptsDiff && (
            <div style={{ fontSize: 9, color: inPlayoffZone ? 'var(--success)' : 'var(--warning)', marginTop: 4 }}>
              {ptsDiff}
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--text-light)' }}>—</div>
      )}
    </div>
  )
}
