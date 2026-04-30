import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { getFormResults } from '../../../utils/formUtils'

function getContextLine(game: SaveGame): string | null {
  const managedId = game.managedClubId
  const standing = game.standings.find(s => s.clubId === managedId)
  if (!standing) return null

  const completedLeague = game.fixtures.filter(
    f => f.status === 'completed' && !f.isCup &&
      (f.homeClubId === managedId || f.awayClubId === managedId)
  ).length

  if (completedLeague === 0) return 'Säsongen börjar nu. Alla lag på noll.'

  const sorted = [...game.standings].sort((a, b) => b.points - a.points)
  const pos = standing.position
  const pts = standing.points
  const eighth = sorted[7]

  if (eighth) {
    const gap = pts - eighth.points
    if (pos <= 8 && gap <= 2) {
      const ninthClub = game.clubs.find(c => c.id === sorted[8]?.clubId)
      const ninthName = ninthClub?.shortName ?? ninthClub?.name.split(' ')[0] ?? ''
      return `${gap === 0 ? 'Precis på strecket' : `${gap}p över strecket`}${ninthName ? ` mot ${ninthName}` : ''}.`
    }
    if (pos > 8 && eighth.points - pts <= 4) {
      const eighthClub = game.clubs.find(c => c.id === eighth.clubId)
      const eighthName = eighthClub?.shortName ?? eighthClub?.name.split(' ')[0] ?? 'åttan'
      return `${eighth.points - pts}p upp till ${eighthName} på strecket.`
    }
  }

  if (pos === 1 && sorted[1]) {
    const gap = pts - sorted[1].points
    const secondClub = game.clubs.find(c => c.id === sorted[1].clubId)
    const secondName = secondClub?.shortName ?? secondClub?.name.split(' ')[0] ?? 'tvåan'
    return gap >= 3 ? `${gap}p ner till ${secondName}.` : `Tätt om toppen mot ${secondName}.`
  }

  return null
}

/** Secondary-kort: tabellposition + formdottar + poängkontext. */
export function TabellSecondary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const managedId = game.managedClubId
  const standing = game.standings.find(s => s.clubId === managedId)
  const recentForm = getFormResults(managedId, game.fixtures, game.clubs).slice(-5)
  const contextLine = getContextLine(game)

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
          {contextLine ? (
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 5, fontStyle: 'italic', lineHeight: 1.4 }}>
              {contextLine}
            </div>
          ) : ptsDiff ? (
            <div style={{ fontSize: 9, color: inPlayoffZone ? 'var(--success)' : 'var(--warning)', marginTop: 4 }}>
              {ptsDiff}
            </div>
          ) : null}
        </>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--text-light)' }}>—</div>
      )}
    </div>
  )
}
