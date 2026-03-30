import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { ClubBadge } from '../components/ClubBadge'
import { isRivalryMatch } from '../../domain/data/rivalries'

export function TabellScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const [expandedClubId, setExpandedClubId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'tabell' | 'statistik'>('tabell')

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
    if (position <= 3) return 'var(--accent)'
    if (position <= 8) return 'rgba(196,122,58,0.4)'
    if (position <= 10) return 'transparent'
    return 'rgba(239,68,68,0.6)'
  }

  const myRow = standings.find(s => s.clubId === managedClubId)
  const leaderPoints = standings[0]?.points ?? 0
  const eighthPoints = standings.find(s => s.position === 8)?.points ?? 0
  const myPoints = myRow?.points ?? 0
  const myPos = myRow?.position ?? 0
  const ptToLeader = leaderPoints - myPoints
  const ptToPlayoff = myPos <= 8 ? null : eighthPoints - myPoints

  return (
    <div style={{ padding: '20px 16px', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
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
        <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)' }}>Tabell</h1>
      </div>

      <div style={{ height: 12 }} />

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg-elevated)', borderRadius: 8, padding: 4 }}>
        {(['tabell', 'statistik'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '8px 0',
              background: activeTab === tab ? 'var(--accent)' : 'transparent',
              color: activeTab === tab ? 'var(--text-light)' : 'var(--text-muted)',
              border: 'none', borderRadius: 6, outline: 'none',
              fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {tab === 'tabell' ? 'TABELL' : 'STATISTIK'}
          </button>
        ))}
      </div>

      {activeTab === 'statistik' && (() => {
        const allPlayers = game!.players.filter(p => p.seasonStats.gamesPlayed > 0)
        if (allPlayers.length === 0) return (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '32px 16px' }}>
            Statistiken fylls på efter första omgången.
          </p>
        )
        const topScorers = [...allPlayers].sort((a, b) => b.seasonStats.goals - a.seasonStats.goals).slice(0, 10)
        const topAssisters = [...allPlayers].sort((a, b) => b.seasonStats.assists - a.seasonStats.assists).slice(0, 10)
        const topCornerGoals = [...allPlayers].sort((a, b) => b.seasonStats.cornerGoals - a.seasonStats.cornerGoals).slice(0, 10)
        const topRated = [...allPlayers].filter(p => p.seasonStats.gamesPlayed >= 5).sort((a, b) => b.seasonStats.averageRating - a.seasonStats.averageRating).slice(0, 10)
        const topPenaltyMin = [...allPlayers].sort((a, b) => (b.seasonStats.yellowCards * 5 + b.seasonStats.redCards * 10) - (a.seasonStats.yellowCards * 5 + a.seasonStats.redCards * 10)).slice(0, 10)

        function StatTable({ title, players, value, unit }: { title: string; players: typeof allPlayers; value: (p: typeof allPlayers[0]) => string | number; unit?: string }) {
          return (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>{title}</p>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                {players.map((p, i) => {
                  const club = game!.clubs.find(c => c.id === p.clubId)
                  const isManaged = p.clubId === game!.managedClubId
                  return (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 12px',
                      borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                      background: isManaged ? 'rgba(196,122,58,0.06)' : 'transparent',
                    }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 16, textAlign: 'right' }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: isManaged ? 700 : 500, color: isManaged ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {p.firstName} {p.lastName}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                          {club?.shortName ?? club?.name ?? '?'} · {p.age} år
                        </span>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent-dark)', fontFamily: 'var(--font-display)' }}>
                        {value(p)}{unit ? <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>{unit}</span> : null}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }

        return (
          <div>
            <StatTable title="⚽ Toppskytt" players={topScorers} value={p => p.seasonStats.goals} unit=" mål" />
            <StatTable title="🎯 Flest assist" players={topAssisters} value={p => p.seasonStats.assists} unit=" ast" />
            <StatTable title="🔄 Flest hörnmål" players={topCornerGoals} value={p => p.seasonStats.cornerGoals} unit=" hörn" />
            <StatTable title="⭐ Bäst snittbetyg (min 5 matcher)" players={topRated} value={p => p.seasonStats.averageRating.toFixed(1)} />
            <StatTable title="🟨 Flest utvisningsminuter" players={topPenaltyMin} value={p => p.seasonStats.yellowCards * 5 + p.seasonStats.redCards * 10} unit=" min" />
          </div>
        )
      })()}

      {activeTab === 'tabell' && (
      <>
      {/* Summary card for managed club */}
      {myRow && (
        <div className="card-sharp" style={{
          padding: '10px 14px',
          marginBottom: 12,
          fontSize: 12,
          color: 'var(--accent)',
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
        }}>
          <span style={{ fontWeight: 700 }}>{myPos}. plats</span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          {ptToPlayoff !== null && ptToPlayoff > 0 ? (
            <span>{ptToPlayoff}p till topp-8</span>
          ) : (
            <span>I slutspelszonen</span>
          )}
          <span style={{ color: 'var(--text-muted)' }}>·</span>
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
        background: 'linear-gradient(90deg, var(--bg-dark), var(--bg-dark-surface), var(--bg-dark))',
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
              {/* Zone divider: after position 8 (top 8 to playoffs) */}
              {row.position === 9 && (
                <div style={{
                  padding: '5px 10px',
                  borderTop: '1px solid rgba(196,122,58,0.4)',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: 'rgba(196,122,58,0.6)',
                  background: 'rgba(196,122,58,0.03)',
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
                    ? 'linear-gradient(90deg, rgba(196,122,58,0.12) 0%, rgba(196,122,58,0.04) 100%)'
                    : isTop3
                    ? 'rgba(196,122,58,0.05)'
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
                    color: isTop3 ? 'var(--accent)' : 'var(--text-muted)',
                  }}>
                    {row.position}
                  </span>
                  {posDiff !== null && posDiff !== 0 && (
                    <span style={{
                      fontSize: 9,
                      color: posDiff > 0 ? 'var(--success)' : 'var(--danger)',
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
                  color: isManaged ? 'var(--accent)' : 'var(--text-primary)',
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
                        background: result === 'W' ? 'var(--success)'
                          : result === 'L' ? 'var(--danger)'
                          : result === 'D' ? 'var(--accent)'
                          : 'var(--border)',
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
                  color: isManaged ? 'var(--accent)' : 'var(--text-primary)',
                }}>
                  {row.points}
                </span>
              </div>

              {/* Expansion row */}
              {expandedClubId === row.clubId && (() => {
                const fix = getNextMeeting(row.clubId)
                const isDerby = isRivalryMatch(row.clubId, managedClubId)
                const isHome = fix?.homeClubId === managedClubId

                const h2hFixtures = (game!.fixtures ?? []).filter(f =>
                  f.status === 'completed' &&
                  ((f.homeClubId === managedClubId && f.awayClubId === row.clubId) ||
                   (f.awayClubId === managedClubId && f.homeClubId === row.clubId))
                ).sort((a, b) => a.roundNumber - b.roundNumber)

                let h2hW = 0, h2hD = 0, h2hL = 0, h2hGF = 0, h2hGA = 0
                for (const f of h2hFixtures) {
                  const isH = f.homeClubId === managedClubId
                  const gf = isH ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
                  const ga = isH ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
                  h2hGF += gf; h2hGA += ga
                  if (gf > ga) h2hW++
                  else if (gf < ga) h2hL++
                  else h2hD++
                }

                const career = game!.rivalryHistory?.[row.clubId]

                return (
                  <div style={{
                    padding: '10px 10px 12px 59px',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    background: 'rgba(196,122,58,0.04)',
                    borderTop: '1px solid rgba(196,122,58,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}>
                    {fix ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Omgång {fix.roundNumber}</span>
                        <span>·</span>
                        <span>{isHome ? 'Hemma' : 'Borta'}</span>
                        {isDerby && <span>· 🔥 Derby</span>}
                      </div>
                    ) : (
                      <span>Inga fler möten denna säsong</span>
                    )}

                    {h2hFixtures.length > 0 && (
                      <div style={{ display: 'flex', gap: 10, fontSize: 11, flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-muted)' }}>I år:</span>
                        {h2hFixtures.map(f => {
                          const isH = f.homeClubId === managedClubId
                          const gf = isH ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
                          const ga = isH ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
                          const col = gf > ga ? 'var(--success)' : gf < ga ? 'var(--danger)' : 'var(--accent)'
                          return (
                            <span key={f.id} style={{ color: col, fontWeight: 700 }}>
                              {gf}–{ga}
                            </span>
                          )
                        })}
                        <span style={{ color: 'var(--text-muted)' }}>({h2hW}V {h2hD}O {h2hL}F, {h2hGF}–{h2hGA})</span>
                      </div>
                    )}

                    {career && (career.wins + career.losses + career.draws) >= 2 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Totalt: {career.wins}V {career.draws}O {career.losses}F
                        {career.currentStreak !== 0 && (
                          <span style={{ color: career.currentStreak > 0 ? 'var(--success)' : 'var(--danger)', marginLeft: 6 }}>
                            · {Math.abs(career.currentStreak)} raka {career.currentStreak > 0 ? 'segrar' : 'förluster'}
                          </span>
                        )}
                      </div>
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
      </>
      )}
    </div>
  )
}
