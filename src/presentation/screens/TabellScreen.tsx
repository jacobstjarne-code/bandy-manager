import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { ClubBadge } from '../components/ClubBadge'
import { isRivalryMatch } from '../../domain/data/rivalries'

export function TabellScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const [expandedClubId, setExpandedClubId] = useState<string | null>(null)

  if (!game) return null

  const standings = [...game.standings].sort((a, b) => a.position - b.position)
  const managedClubId = game.managedClubId

  const lastSummary = (game.seasonSummaries ?? []).slice(-1)[0]
  const lastSnapshot = lastSummary?.standingsSnapshot ?? []

  function clubName(clubId: string): string {
    return game!.clubs.find(c => c.id === clubId)?.shortName
      ?? game!.clubs.find(c => c.id === clubId)?.name
      ?? clubId
  }

  function getFormGuide(clubId: string): ('W' | 'D' | 'L')[] {
    const completed = (game!.fixtures ?? [])
      .filter(f => f.status === 'completed' && (f.homeClubId === clubId || f.awayClubId === clubId))
      .sort((a, b) => b.roundNumber - a.roundNumber)
      .slice(0, 5)
    return completed.map(f => {
      const isHome = f.homeClubId === clubId
      const score = isHome ? f.homeScore : f.awayScore
      const opp = isHome ? f.awayScore : f.homeScore
      if (score > opp) return 'W'
      if (score < opp) return 'L'
      if (f.penaltyResult) return (isHome ? f.penaltyResult.home > f.penaltyResult.away : f.penaltyResult.away > f.penaltyResult.home) ? 'W' : 'L'
      if (f.overtimeResult) return f.overtimeResult === (isHome ? 'home' : 'away') ? 'W' : 'L'
      return 'D'
    }).reverse()
  }

  function getNextMeeting(clubId: string) {
    return (game!.fixtures ?? [])
      .filter(f =>
        f.status !== 'completed' &&
        ((f.homeClubId === managedClubId && f.awayClubId === clubId) ||
         (f.awayClubId === managedClubId && f.homeClubId === clubId))
      )
      .sort((a, b) => a.roundNumber - b.roundNumber)[0] ?? null
  }

  function getRowBorderColor(position: number): string {
    if (position <= 3) return '#C9A84C'
    if (position <= 6) return 'rgba(201,168,76,0.4)'
    if (position <= 10) return 'transparent'
    return 'rgba(239,68,68,0.6)'
  }

  const myRow = standings.find(s => s.clubId === managedClubId)
  const leaderPoints = standings[0]?.points ?? 0
  const sixthPoints = standings.find(s => s.position === 6)?.points ?? 0
  const myPoints = myRow?.points ?? 0
  const myPos = myRow?.position ?? 0
  const ptToLeader = leaderPoints - myPoints
  const ptToPlayoff = myPos <= 6 ? null : sixthPoints - myPoints

  return (
    <div style={{ padding: '20px 16px', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 22,
            cursor: 'pointer',
            padding: 0,
            lineHeight: 1,
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Tabell</h1>
      </div>

      {/* Summary card for managed club */}
      {myRow && (
        <div style={{
          background: 'rgba(201,168,76,0.06)',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 12,
          fontSize: 12,
          color: '#C9A84C',
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
        }}>
          <span style={{ fontWeight: 700 }}>{myPos}. plats</span>
          <span style={{ color: '#4A6080' }}>·</span>
          {ptToPlayoff !== null && ptToPlayoff > 0 ? (
            <span>{ptToPlayoff}p till slutspel</span>
          ) : (
            <span>I slutspelszonen</span>
          )}
          <span style={{ color: '#4A6080' }}>·</span>
          <span>{ptToLeader > 0 ? `${ptToLeader}p till ledaren` : 'Serieledare'}</span>
        </div>
      )}

      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '24px 32px 1fr 22px 52px 32px 28px',
        gap: 4,
        padding: '6px 10px',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        color: 'var(--text-muted)',
        marginBottom: 4,
        background: 'linear-gradient(90deg, #0D1B2A, #122235, #0D1B2A)',
        borderRadius: 6,
      }}>
        <span>#</span>
        <span></span>
        <span>Lag</span>
        <span style={{ textAlign: 'center' }}>S</span>
        <span style={{ textAlign: 'center' }}>Form</span>
        <span style={{ textAlign: 'center' }}>MS</span>
        <span style={{ textAlign: 'right' }}>P</span>
      </div>

      <div className="card-stagger-1" style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}>
        {standings.map((row, i) => {
          const isManaged = row.clubId === managedClubId
          const isTop3 = row.position <= 3
          const goalDiff = row.goalDifference >= 0
            ? `+${row.goalDifference}`
            : String(row.goalDifference)
          const lastPos = lastSnapshot.find(s => s.clubId === row.clubId)?.position
          const posDiff = lastPos != null ? lastPos - row.position : null
          const form = getFormGuide(row.clubId)

          return (
            <div key={row.clubId}>
              {/* Zone divider: after position 6 */}
              {row.position === 7 && (
                <div style={{
                  padding: '5px 10px',
                  borderTop: '1px solid rgba(201,168,76,0.4)',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: 'rgba(201,168,76,0.6)',
                  background: 'rgba(201,168,76,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span>━━</span><span>Slutspelsstrecket</span><span>━━</span>
                </div>
              )}

              {/* Zone divider: after position 10 */}
              {row.position === 11 && (
                <div style={{
                  padding: '5px 10px',
                  borderTop: '1px solid rgba(239,68,68,0.5)',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: 'rgba(239,68,68,0.5)',
                  background: 'rgba(239,68,68,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span>━━</span><span>Nedflyttning</span><span>━━</span>
                </div>
              )}

              {/* Table row */}
              <div
                onClick={() => setExpandedClubId(prev => prev === row.clubId ? null : row.clubId)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '24px 32px 1fr 22px 52px 32px 28px',
                  gap: 4,
                  padding: '10px 10px',
                  alignItems: 'center',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  borderLeft: `3px solid ${getRowBorderColor(row.position)}`,
                  background: isManaged
                    ? 'linear-gradient(90deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 100%)'
                    : isTop3
                    ? 'rgba(201,168,76,0.05)'
                    : row.position >= 11
                    ? 'rgba(239,68,68,0.04)'
                    : 'transparent',
                  cursor: 'pointer',
                }}
              >
                {/* Position */}
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: isTop3 ? '#C9A84C' : 'var(--text-muted)',
                  }}>
                    {row.position}
                  </span>
                  {posDiff !== null && posDiff !== 0 && (
                    <span style={{
                      fontSize: 9,
                      color: posDiff > 0 ? '#22c55e' : '#ef4444',
                      lineHeight: 1,
                    }}>
                      {posDiff > 0 ? '▲' : '▼'}
                    </span>
                  )}
                </span>

                {/* Club badge */}
                <ClubBadge clubId={row.clubId} name={clubName(row.clubId)} size={24} />

                {/* Club name */}
                <span style={{
                  fontSize: 13,
                  fontWeight: isManaged ? 700 : 500,
                  color: isManaged ? '#C9A84C' : 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {isManaged ? '★ ' : ''}{clubName(row.clubId)}{isRivalryMatch(row.clubId, managedClubId) ? ' 🔥' : ''}
                </span>

                {/* Played */}
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
                  {row.played}
                </span>

                {/* Form dots */}
                <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  {Array.from({ length: 5 }, (_, i) => {
                    const result = form[i]
                    return (
                      <div key={i} style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: result === 'W' ? '#22c55e'
                          : result === 'L' ? '#ef4444'
                          : result === 'D' ? '#e2a84c'
                          : '#1e3450',
                      }} />
                    )
                  })}
                </div>

                {/* Goal diff */}
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign: 'center',
                  color: row.goalDifference > 0
                    ? 'var(--success)'
                    : row.goalDifference < 0
                    ? 'var(--danger)'
                    : 'var(--text-secondary)',
                }}>
                  {goalDiff}
                </span>

                {/* Points */}
                <span style={{
                  fontSize: 14,
                  fontWeight: 800,
                  textAlign: 'right',
                  color: isManaged ? '#C9A84C' : 'var(--text-primary)',
                }}>
                  {row.points}
                </span>
              </div>

              {/* Expansion row */}
              {expandedClubId === row.clubId && (() => {
                const fix = getNextMeeting(row.clubId)
                const isDerby = isRivalryMatch(row.clubId, managedClubId)
                const isHome = fix?.homeClubId === managedClubId
                return (
                  <div style={{
                    padding: '8px 10px 10px 59px',
                    fontSize: 12,
                    color: '#8A9BB0',
                    background: 'rgba(201,168,76,0.04)',
                    borderTop: '1px solid rgba(201,168,76,0.1)',
                  }}>
                    {fix ? (
                      <>
                        <span style={{ color: '#C9A84C', fontWeight: 600 }}>Omgång {fix.roundNumber}</span>
                        {' · '}
                        <span>{isHome ? 'Hemma' : 'Borta'}</span>
                        {isDerby && <span> · 🔥 Derby</span>}
                      </>
                    ) : (
                      <span>Inga fler möten denna säsong</span>
                    )}
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
        S = Spelade · MS = Målskillnad · P = Poäng · Form: ●grön=seger ●röd=förlust ●gul=oavgjort
      </p>
    </div>
  )
}
