import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { PlayerLink } from '../components/PlayerLink'
import { ordinal } from '../utils/formatters'
import type { SeasonSummary } from '../../domain/entities/SeasonSummary'
import { shareSeasonImage } from '../utils/seasonShareImage'

function RecordRow({ label, value, sub, isLast }: { label: string; value: string; sub: string; isLast?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      paddingBottom: isLast ? 0 : 10, marginBottom: isLast ? 0 : 10,
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
    }}>
      <div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</p>
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{value}</span>
    </div>
  )
}

function playoffLabel(result: string | null | undefined): string {
  if (result === 'champion') return '🏆 SVENSKA MÄSTARE!'
  if (result === 'finalist') return '🥈 SM-final (förlust)'
  if (result === 'semifinal') return 'Semifinal'
  if (result === 'quarterfinal') return 'Kvartsfinal'
  if (result === 'didNotQualify') return 'Ej kvalificerad'
  return '—'
}

function cupLabel(result: string | null | undefined): string | null {
  if (result === 'winner') return '🏆 Cupmästare!'
  if (result === 'finalist') return '🥈 Cupfinal'
  if (result === 'semifinal') return 'Cupsemifinalen'
  if (result === 'quarter') return 'Cupkvartsfinalen'
  if (result === 'eliminated') return null
  return null
}

function formatFinances(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} mkr`
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)} tkr`
  return `${n} kr`
}

function JourneyGraph({ summaries }: { summaries: SeasonSummary[] }) {
  if (summaries.length < 2) return null

  const chronological = [...summaries].reverse()
  const W = 300
  const H = 100
  const padL = 28
  const padR = 12
  const padT = 10
  const padB = 24

  const maxPos = Math.max(...chronological.map(s => s.finalPosition), 6)
  const minPos = 1

  const xStep = (W - padL - padR) / (chronological.length - 1)

  function xOf(i: number) { return padL + i * xStep }
  function yOf(pos: number) {
    return padT + ((pos - minPos) / (maxPos - minPos)) * (H - padT - padB)
  }

  const points = chronological.map((s, i) => `${xOf(i)},${yOf(s.finalPosition)}`).join(' ')

  return (
    <div className="card-sharp" style={{ padding: '10px 14px 8px', marginBottom: 8 }}>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
        Resan — tabellposition per säsong
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Horizontal grid lines for pos 1, middle, maxPos */}
        {[1, Math.ceil((maxPos + 1) / 2), maxPos].map(pos => (
          <line key={pos} x1={padL} x2={W - padR} y1={yOf(pos)} y2={yOf(pos)}
            stroke="var(--border)" strokeWidth="0.8" strokeDasharray="3,3" />
        ))}
        {/* Y axis labels */}
        {[1, Math.ceil((maxPos + 1) / 2), maxPos].map(pos => (
          <text key={pos} x={padL - 4} y={yOf(pos) + 3.5} textAnchor="end"
            fontSize="7" fill="var(--text-muted)" fontFamily="system-ui,sans-serif">
            {pos}
          </text>
        ))}
        {/* Line */}
        <polyline points={points} fill="none" stroke="rgba(196,122,58,0.7)" strokeWidth="1.8" strokeLinejoin="round" />
        {/* Dots + season labels */}
        {chronological.map((s, i) => {
          const cx = xOf(i)
          const cy = yOf(s.finalPosition)
          const isChamp = s.playoffResult === 'champion'
          return (
            <g key={s.season}>
              <circle cx={cx} cy={cy} r={isChamp ? 5 : 3.5}
                fill={isChamp ? 'rgba(196,122,58,0.9)' : 'var(--bg-elevated)'}
                stroke={isChamp ? 'rgba(196,122,58,1)' : 'rgba(196,122,58,0.6)'}
                strokeWidth="1.5" />
              <text x={cx} y={H - 4} textAnchor="middle"
                fontSize="6.5" fill="var(--text-muted)" fontFamily="system-ui,sans-serif">
                {s.season}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function HistoryScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null)

  if (!game) return null

  const summaries = [...(game.seasonSummaries ?? [])].reverse()
  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)

  // Hall of Fame — top 5 per category
  const topGoalScorers = [...managedPlayers]
    .filter(p => p.careerStats.totalGoals > 0)
    .sort((a, b) => b.careerStats.totalGoals - a.careerStats.totalGoals)
    .slice(0, 5)

  const topByGames = [...managedPlayers]
    .filter(p => p.careerStats.totalGames > 0)
    .sort((a, b) => b.careerStats.totalGames - a.careerStats.totalGames)
    .slice(0, 5)

  const topByRating = [...managedPlayers]
    .filter(p => p.careerStats.totalGames >= 10 && p.careerStats.totalGames > 0)
    .map(p => ({
      p,
      avg: p.careerStats.totalGames > 0
        ? (p.seasonStats.averageRating * p.seasonStats.gamesPlayed + 6.5 * Math.max(0, p.careerStats.totalGames - p.seasonStats.gamesPlayed)) / p.careerStats.totalGames
        : 0,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5)

  return (
    <div style={{ padding: '20px 16px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 22, cursor: 'pointer', padding: 0, lineHeight: 1 }}
        >
          ←
        </button>
        <div>
  <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>Klubbhistorik</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {game.clubs.find(c => c.id === game.managedClubId)?.name}
          </p>
        </div>
      </div>

      <JourneyGraph summaries={game.seasonSummaries ?? []} />

      {summaries.length > 0 && (
        <button
          onClick={() => shareSeasonImage(summaries[0])}
          style={{
            width: '100%', padding: '13px', marginBottom: 8,
            background: 'transparent', border: '1px solid rgba(196,122,58,0.4)',
            borderRadius: 12, color: 'var(--accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          📤 Dela senaste säsongen
        </button>
      )}

      {summaries.length === 0 ? (
        <div className="card-sharp" style={{
          padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)',
        }}>
          <p style={{ fontSize: 22, marginBottom: 12 }}>📖</p>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Ingen historik ännu.</p>
          <p style={{ fontSize: 13 }}>Spela din första säsong för att bygga klubbens historia.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
          {summaries.map((s, i) => {
            const isGold = s.playoffResult === 'champion'
            const cup = cupLabel(s.cupResult)
            return (
              <div
                key={s.season}
                className={`card-sharp card-stagger-${Math.min(i + 1, 6)}`}
                style={{
                  background: isGold ? 'linear-gradient(135deg, rgba(196,122,58,0.12), rgba(196,122,58,0.04))' : undefined,
                  border: isGold ? '1px solid rgba(196,122,58,0.4)' : undefined,
                  padding: '10px 14px',
                }}
              >
                <p style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '1.2px',
                  textTransform: 'uppercase', color: isGold ? 'var(--accent)' : 'var(--text-muted)',
                  marginBottom: 10,
                }}>
                  ── Säsong {s.season} ──
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <p style={{ fontSize: 14 }}>
                    📊 <strong>{ordinal(s.finalPosition)} plats</strong>{' '}
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>({s.points}p, {s.wins}V {s.draws}O {s.losses}F)</span>
                    {s.finalPosition <= 3 && <span style={{ marginLeft: 6 }}>{['🥇','🥈','🥉'][s.finalPosition - 1]}</span>}
                  </p>
                  <p style={{ fontSize: 14 }}>
                    🏒 SM: <span style={{ color: isGold ? 'var(--accent)' : 'var(--text-primary)', fontWeight: isGold ? 700 : 500 }}>
                      {playoffLabel(s.playoffResult)}
                    </span>
                  </p>
                  {cup && <p style={{ fontSize: 14 }}>🏆 Cup: {cup}</p>}
                  {s.topScorer && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      🏒 Toppskytt:{' '}
                      <PlayerLink playerId={s.topScorer.playerId} name={s.topScorer.name} />
                      {' '}({s.topScorer.goals} mål)
                    </p>
                  )}
                  {s.topRated && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      ⭐ Bästa betyg:{' '}
                      <PlayerLink playerId={s.topRated.playerId} name={s.topRated.name} />
                      {' '}({s.topRated.avgRating.toFixed(1)})
                    </p>
                  )}
                  {s.mostImproved && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      📈 Mest förbättrad:{' '}
                      <PlayerLink playerId={s.mostImproved.playerId} name={s.mostImproved.name} />
                      {' '}(+{s.mostImproved.caGain})
                    </p>
                  )}
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    💰 Ekonomi: {formatFinances(s.startFinances)} → {formatFinances(s.endFinances)}{' '}
                    <span style={{ color: s.financialChange >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                      ({s.financialChange >= 0 ? '+' : ''}{formatFinances(s.financialChange)})
                    </span>
                  </p>
                  {s.standingsSnapshot && s.standingsSnapshot.length > 0 && (
                    <button
                      onClick={() => setExpandedSeason(expandedSeason === s.season ? null : s.season)}
                      style={{
                        marginTop: 4, background: 'none', border: 'none',
                        color: 'var(--accent)', fontSize: 11, cursor: 'pointer',
                        padding: 0, textAlign: 'left', fontWeight: 600,
                      }}
                    >
                      {expandedSeason === s.season ? '▲ Dölj tabell' : '▼ Visa ligatabell'}
                    </button>
                  )}
                  {expandedSeason === s.season && s.standingsSnapshot && (
                    <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                      {s.standingsSnapshot
                        .slice()
                        .sort((a, b) => a.position - b.position)
                        .map(row => {
                          const club = game.clubs.find(c => c.id === row.clubId)
                          const isManaged = row.clubId === game.managedClubId
                          return (
                            <div key={row.clubId} style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '3px 0', borderBottom: '1px solid rgba(26,26,24,0.06)',
                              background: isManaged ? 'rgba(196,122,58,0.06)' : 'transparent',
                            }}>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 16, textAlign: 'right' }}>{row.position}.</span>
                              <span style={{ fontSize: 11, flex: 1, color: isManaged ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: isManaged ? 700 : 400 }}>
                                {club?.shortName ?? club?.name ?? row.clubId}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', minWidth: 24, textAlign: 'right' }}>{row.points}p</span>
                            </div>
                          )
                        })}
                    </div>
                  )}
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                    📋 {s.narrativeSummary}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* All-time Records */}
      {game.allTimeRecords && (
        <div className="card-sharp" style={{ padding: '10px 14px', marginBottom: 8 }}>
          <p style={{
            fontSize: 8, fontWeight: 700, letterSpacing: '2px',
            textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 18,
            borderBottom: '1px solid rgba(196,122,58,0.25)', paddingBottom: 10,
          }}>
            ── Rekord ──
          </p>
          {game.allTimeRecords.bestFinish && (
            <RecordRow label="Bästa tabellplacering" value={`${ordinal(game.allTimeRecords.bestFinish.position)} plats`} sub={`Säsong ${game.allTimeRecords.bestFinish.season}`} />
          )}
          {game.allTimeRecords.mostGoalsSeason && (
            <RecordRow label="Flest mål en säsong" value={`${game.allTimeRecords.mostGoalsSeason.goals} mål`} sub={`${game.allTimeRecords.mostGoalsSeason.playerName} · ${game.allTimeRecords.mostGoalsSeason.season}`} />
          )}
          {game.allTimeRecords.mostAssistsSeason && (
            <RecordRow label="Flest assist en säsong" value={`${game.allTimeRecords.mostAssistsSeason.assists} assist`} sub={`${game.allTimeRecords.mostAssistsSeason.playerName} · ${game.allTimeRecords.mostAssistsSeason.season}`} />
          )}
          {game.allTimeRecords.highestRatingSeason && (
            <RecordRow label="Högst snittbetyg en säsong" value={`${game.allTimeRecords.highestRatingSeason.rating.toFixed(1)}`} sub={`${game.allTimeRecords.highestRatingSeason.playerName} · ${game.allTimeRecords.highestRatingSeason.season}`} />
          )}
          {game.allTimeRecords.biggestWin && (
            <RecordRow label="Största seger" value={game.allTimeRecords.biggestWin.score} sub={`vs ${game.allTimeRecords.biggestWin.opponent} · ${game.allTimeRecords.biggestWin.season}`} />
          )}
          {game.allTimeRecords.championSeasons.length > 0 && (
            <RecordRow label="SM-guld" value={`${game.allTimeRecords.championSeasons.length}×`} sub={game.allTimeRecords.championSeasons.join(', ')} />
          )}
          {(game.allTimeRecords.cupWinSeasons ?? []).length > 0 && (
            <RecordRow label="Cupsegrar" value={`${game.allTimeRecords.cupWinSeasons!.length}×`} sub={game.allTimeRecords.cupWinSeasons!.join(', ')} isLast />
          )}
          {game.allTimeRecords.championSeasons.length === 0 && (game.allTimeRecords.cupWinSeasons ?? []).length === 0 && (
            <RecordRow label="Titlar" value="—" sub="Inga titlar ännu" isLast />
          )}
        </div>
      )}

      {/* Hall of Fame */}
      <div className="card-sharp" style={{ padding: '18px 16px' }}>
        <p style={{
          fontSize: 8, fontWeight: 700, letterSpacing: '2px',
          textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 18,
          borderBottom: '1px solid rgba(196,122,58,0.25)', paddingBottom: 10,
        }}>
          ── Hall of Fame ──
        </p>

        {topGoalScorers.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 8 }}>
              🎯 Flest mål i karriären
            </p>
            {topGoalScorers.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 16 }}>{i + 1}.</span>
                <PlayerLink playerId={p.id} name={`${p.firstName} ${p.lastName}`} style={{ fontSize: 13 }} />
                <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{p.careerStats.totalGoals}</span>
              </div>
            ))}
          </div>
        )}

        {topByGames.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 8 }}>
              🏒 Flest matcher
            </p>
            {topByGames.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 16 }}>{i + 1}.</span>
                <PlayerLink playerId={p.id} name={`${p.firstName} ${p.lastName}`} style={{ fontSize: 13 }} />
                <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{p.careerStats.totalGames}</span>
              </div>
            ))}
          </div>
        )}

        {topByRating.length > 0 && (
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 8 }}>
              ⭐ Bästa snittbetyg (min 10 matcher)
            </p>
            {topByRating.map(({ p, avg }, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < topByRating.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 16 }}>{i + 1}.</span>
                <PlayerLink playerId={p.id} name={`${p.firstName} ${p.lastName}`} style={{ fontSize: 13 }} />
                <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{avg.toFixed(1)}</span>
              </div>
            ))}
          </div>
        )}

        {topGoalScorers.length === 0 && topByGames.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Inga spelare att visa ännu.</p>
        )}
      </div>
    </div>
  )
}
