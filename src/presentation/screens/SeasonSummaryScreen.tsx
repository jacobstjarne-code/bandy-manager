import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import type { SeasonSummary } from '../../domain/services/seasonSummaryService'
import { ClubBadge } from '../components/ClubBadge'
import { SectionLabel } from '../components/SectionLabel'
import { csColor, formatCurrency } from '../utils/formatters'
import { shareSeasonImage } from '../utils/seasonShareImage'

export function SeasonSummaryScreen() {
  const navigate = useNavigate()
  const params = useParams<{ season?: string }>()
  const { game, clearSeasonSummary } = useGameStore()

  if (!game) return null

  // Determine which summary to show
  let summary: SeasonSummary | null = null
  if (params.season) {
    const seasonNum = parseInt(params.season, 10)
    summary = game.seasonSummaries?.find(s => s.season === seasonNum) ?? null
  } else {
    // Show latest
    const summaries = game.seasonSummaries ?? []
    summary = summaries.length > 0 ? summaries[summaries.length - 1] : null
  }

  if (!summary) {
    return (
      <div style={{ padding: 20, color: 'var(--text-secondary)' }}>
        Ingen säsongssammanfattning tillgänglig.
        <button onClick={() => navigate('/game/dashboard')} style={{ marginTop: 16, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
          ← Tillbaka
        </button>
      </div>
    )
  }

  const isHistorical = !!params.season
  const isChampion = summary.playoffResult === 'champion'
  const positionColor = summary.finalPosition <= 3 ? 'var(--accent)' : summary.finalPosition >= 10 ? 'var(--danger)' : 'var(--text-primary)'

  function playoffResultLabel(r: SeasonSummary['playoffResult']): string {
    switch (r) {
      case 'champion': return '🏆 Svenska mästare'
      case 'finalist': return '🥈 Finalist'
      case 'semifinal': return '4:e i semifinal'
      case 'quarterfinal': return 'Kvartsfinalist'
      case 'didNotQualify': return 'Ej kvalad till slutspel'
      default: return ''
    }
  }

  function verdictIcon(v: SeasonSummary['expectationVerdict']): string {
    if (v === 'exceeded') return '✅'
    if (v === 'met') return '✅'
    return '❌'
  }

  function verdictText(s: SeasonSummary): string {
    if (s.expectationVerdict === 'exceeded') return 'Styrelsen är mer än nöjd'
    if (s.expectationVerdict === 'met') return 'Styrelsen är nöjd'
    return 'Styrelsen är besviken'
  }

  function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6, marginBottom: 6, borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: color ?? 'var(--text-primary)' }}>{value}</span>
      </div>
    )
  }

  // Cumulative points chart SVG
  function PointsChart() {
    const data = summary!.roundPoints
    if (!data || data.length === 0) return null
    const maxPts = Math.max(...data, 66) // 22 wins × 3 = 66 max
    const w = 280, h = 80
    const pad = { l: 8, r: 8, t: 8, b: 16 }
    const chartW = w - pad.l - pad.r
    const chartH = h - pad.t - pad.b

    const points = data.map((pts, i) => {
      const x = pad.l + (i / 21) * chartW
      const y = pad.t + chartH - (pts / maxPts) * chartH
      return `${x},${y}`
    }).join(' ')

    // Top-8 threshold line (roughly at 33 points for 22 rounds)
    const threshold8 = 33
    const thresholdY = pad.t + chartH - (threshold8 / maxPts) * chartH

    return (
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }}>
        {/* Background */}
        <rect x="0" y="0" width={w} height={h} fill="transparent"/>
        {/* Threshold line (top 8 approx) */}
        <line x1={pad.l} y1={thresholdY} x2={w - pad.r} y2={thresholdY}
          stroke="var(--accent)" strokeWidth="1" strokeDasharray="4,4" opacity="0.4"/>
        <text x={w - pad.r - 2} y={thresholdY - 3} fontSize="8" fill="var(--accent)" textAnchor="end" opacity="0.6">Topp 8</text>
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Dots at first and last */}
        {data.length > 0 && (
          <>
            <circle cx={pad.l} cy={pad.t + chartH - (data[0] / maxPts) * chartH} r="3" fill="var(--accent)"/>
            <circle cx={pad.l + chartW} cy={pad.t + chartH - (data[data.length-1] / maxPts) * chartH} r="3" fill="var(--accent)"/>
          </>
        )}
        {/* X-axis labels */}
        {[1, 6, 11, 16, 22].map(r => {
          const x = pad.l + ((r-1) / 21) * chartW
          return <text key={r} x={x} y={h - 2} fontSize="8" fill="rgba(26,26,24,0.35)" textAnchor="middle">{r}</text>
        })}
      </svg>
    )
  }

  const [sharing, setSharing] = useState(false)

  async function handleShare() {
    if (!summary) return
    setSharing(true)
    await shareSeasonImage(summary)
    setSharing(false)
  }

  const handleNextSeason = () => {
    clearSeasonSummary()
    if (game.managerFired) {
      navigate('/game/game-over', { replace: true })
    } else {
      navigate('/game/board-meeting', { replace: true })
    }
  }

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      background: 'var(--bg)',
    }}>
      <div style={{ padding: '0 16px 100px' }}>

        {/* HEADER */}
        <div style={{
          background: 'var(--bg)',
          padding: '16px 0 12px',
          textAlign: 'center',
          marginBottom: 16,
          position: 'relative',
        }}>
          <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: 16, left: 0, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>←</button>

          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            ÅRSBOK
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <ClubBadge clubId={summary.clubId} name={summary.clubName} size={56} />
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>{summary.clubName}</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '3px', color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-display)' }}>
            SÄSONG {summary.season}/{summary.season + 1}
          </h1>

          {/* Position badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{
              fontSize: 32,
              fontWeight: 900,
              color: positionColor,
              textShadow: summary.finalPosition <= 3 ? '0 0 20px rgba(196,122,58,0.5)' : 'none',
            }}>
              {summary.finalPosition}.
            </span>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>plats</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{summary.points} poäng</p>
            </div>
          </div>

          {/* Playoff result */}
          {summary.playoffResult && (
            <p style={{
              fontSize: 13,
              fontWeight: 700,
              color: isChampion ? 'var(--accent)' : 'var(--text-secondary)',
              marginBottom: 8,
            }}>
              {playoffResultLabel(summary.playoffResult)}
            </p>
          )}

          {/* Board verdict */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 99,
            background: summary.expectationVerdict === 'failed' ? 'rgba(176,80,64,0.15)' : 'rgba(90,154,74,0.15)',
            border: `1px solid ${summary.expectationVerdict === 'failed' ? 'rgba(176,80,64,0.4)' : 'rgba(90,154,74,0.4)'}`,
          }}>
            <span style={{ fontSize: 12 }}>{verdictIcon(summary.expectationVerdict)}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: summary.expectationVerdict === 'failed' ? 'var(--danger)' : 'var(--success)' }}>
              {verdictText(summary)}
            </span>
          </div>
        </div>

        {/* NARRATIVE */}
        <div className="card-sharp card-stagger-1" style={{ padding: '10px 14px', marginBottom: 8, borderLeft: '3px solid var(--accent)', background: 'rgba(196,122,58,0.05)' }}>
          <p style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            "{summary.narrativeSummary}"
          </p>
        </div>

        {/* DIN SÄSONG — merged timeline */}
        {(() => {
          type TimelineItem = {
            round: number
            icon: string
            headline: string
            body: string
            relatedPlayerName?: string
          }
          const items: TimelineItem[] = []

          // keyMoments
          for (const m of summary.keyMoments ?? []) {
            const icon = m.type === 'derbyWin' ? '🔥'
              : m.type === 'derbyLoss' ? '😶'
              : m.type === 'hatTrick' ? '🎩'
              : m.type === 'bigWin' ? '✅'
              : m.type === 'bigLoss' ? '❌'
              : m.type === 'comeback' ? '💪'
              : m.type === 'lateWinner' ? '⚡'
              : '🏒'
            const relatedPlayer = m.relatedPlayerId ? game.players.find(p => p.id === m.relatedPlayerId) : null
            items.push({
              round: m.round,
              icon,
              headline: m.headline,
              body: m.body,
              relatedPlayerName: relatedPlayer ? `${relatedPlayer.firstName} ${relatedPlayer.lastName}` : undefined,
            })
          }

          // arc storylines
          const seasonStorylines = game.storylines?.filter(s => s.season === summary.season) ?? []
          const storylineEmoji = (type: string): string => {
            switch (type) {
              case 'rescued_from_unemployment': return '🏭'
              case 'went_fulltime_pro': return '⭐'
              case 'returned_to_club': return '🏠'
              case 'captain_rallied_team': return '💪'
              case 'underdog_season': return '🎯'
              case 'gala_winner': return '🏆'
              case 'left_for_bigger_club': return '👋'
              case 'journalist_feud': return '📰'
              case 'relegation_escape': return '😅'
              default: return '📖'
            }
          }
          for (const sl of seasonStorylines) {
            const p = sl.playerId ? game.players.find(pl => pl.id === sl.playerId) : null
            items.push({
              round: sl.matchday ?? 99,
              icon: storylineEmoji(sl.type),
              headline: sl.displayText,
              body: '',
              relatedPlayerName: p ? `${p.firstName} ${p.lastName}` : undefined,
            })
          }

          items.sort((a, b) => a.round - b.round)
          const topItems = items.slice(0, 7)

          if (topItems.length === 0) return null

          return (
            <div style={{ marginBottom: 8 }}>
              <p style={{
                fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase',
                color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 6,
              }}>
                🏒 DIN SÄSONG
              </p>
              {topItems.map((item, i) => (
                <div key={i} className="card-round" style={{ padding: '10px 12px', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--bg-dark)', color: 'var(--text-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-body)',
                    }}>
                      O{item.round}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {item.icon} {item.headline}
                      </p>
                      {item.body && (
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2, lineHeight: 1.4 }}>
                          {item.body}
                        </p>
                      )}
                      {item.relatedPlayerName && (
                        <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>{item.relatedPlayerName}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })()}

        {/* SEASON'S BEST */}
        <div className="card-sharp card-stagger-2" style={{ padding: '10px 14px', marginBottom: 8 }}>
          <SectionLabel>SÄSONGENS BÄSTA</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {summary.topScorer && (
              <AwardCard icon="🏒" title="Toppskyttar" name={summary.topScorer.name}
                value={`${summary.topScorer.goals} mål, ${summary.topScorer.assists} ass`} />
            )}
            {summary.topAssister && (
              <AwardCard icon="🅰️" title="Mest assist" name={summary.topAssister.name}
                value={`${summary.topAssister.assists} assist`} />
            )}
            {summary.topRated && (
              <AwardCard icon="⭐" title="Högst betyg" name={summary.topRated.name}
                value={`${summary.topRated.avgRating} snitt (${summary.topRated.games} matcher)`} />
            )}
            {summary.mostImproved && (
              <AwardCard icon="📈" title="Mest förbättrad" name={summary.mostImproved.name}
                value={`${summary.mostImproved.startCA} → ${summary.mostImproved.endCA} (+${summary.mostImproved.caGain})`} />
            )}
            {summary.youngPlayer && (
              <AwardCard icon="🌟" title={`Bästa U21 (${summary.youngPlayer.age} år)`} name={summary.youngPlayer.name}
                value={`${summary.youngPlayer.goals} mål · ${summary.youngPlayer.avgRating} snitt`} />
            )}
          </div>
        </div>

        {/* CUP RESULT */}
        {summary.cupResult && summary.cupResult !== 'eliminated' && (
          <div className="card-sharp card-stagger-2" style={{ padding: '10px 14px', marginBottom: 8 }}>
            <SectionLabel>SVENSKA CUPEN</SectionLabel>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <span style={{ fontSize: summary.cupResult === 'winner' ? 32 : 24 }}>
                {summary.cupResult === 'winner' ? '🏆' : summary.cupResult === 'finalist' ? '🥈' : '🏒'}
              </span>
              <p style={{
                fontSize: summary.cupResult === 'winner' ? 16 : 14,
                fontWeight: 700,
                color: summary.cupResult === 'winner' ? 'var(--accent)' : 'var(--text-primary)',
                marginTop: 6,
                fontFamily: 'var(--font-display)',
              }}>
                {summary.cupResult === 'winner' ? 'CUPVINNARE!' : summary.cupResult === 'finalist' ? 'Cupfinalist' : summary.cupResult === 'semifinal' ? 'Cupsemifinalist' : 'Cupkvartsfinalist'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Svenska Cupen {summary.season}/{summary.season + 1}
              </p>
            </div>
          </div>
        )}

        {/* STATISTICS */}
        <div className="card-sharp card-stagger-3" style={{ padding: '10px 14px', marginBottom: 8 }}>
          <SectionLabel>STATISTIK</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div>
              <StatRow label="Spelade" value={summary.wins + summary.draws + summary.losses} />
              <StatRow label="Vinster" value={summary.wins} color="var(--success)" />
              <StatRow label="Oavgjorda" value={summary.draws} />
              <StatRow label="Förluster" value={summary.losses} color="var(--danger)" />
            </div>
            <div>
              <StatRow label="Mål gjorda" value={summary.goalsFor} />
              <StatRow label="Mål insläppta" value={summary.goalsAgainst} />
              <StatRow label="Hörnmål" value={summary.totalCornerGoals} />
              <StatRow label="Nollor" value={summary.totalCleanSheets} />
            </div>
          </div>
        </div>

        {/* HOME vs AWAY */}
        <div className="card-stagger-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
          <div className="card-sharp" style={{ padding: '10px 14px' }}>
            <SectionLabel>HEMMA</SectionLabel>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>{summary.homeRecord.wins}</p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>V</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>O: {summary.homeRecord.draws}</span>
              <span style={{ fontSize: 13, color: 'var(--danger)' }}>F: {summary.homeRecord.losses}</span>
            </div>
          </div>
          <div className="card-sharp" style={{ padding: '10px 14px' }}>
            <SectionLabel>BORTA</SectionLabel>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>{summary.awayRecord.wins}</p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>V</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>O: {summary.awayRecord.draws}</span>
              <span style={{ fontSize: 13, color: 'var(--danger)' }}>F: {summary.awayRecord.losses}</span>
            </div>
          </div>
        </div>

        {/* STREAKS */}
        <div className="card-sharp card-stagger-5" style={{ padding: '10px 14px', marginBottom: 8 }}>
          <SectionLabel>STREAKS OCH EXTREMER</SectionLabel>
          <StatRow label="Längsta vinstsvit" value={`${summary.longestWinStreak} matcher`} color="var(--success)" />
          <StatRow label="Längsta förlustsvit" value={`${summary.longestLossStreak} matcher`} color="var(--danger)" />
          {summary.biggestWin && (
            <StatRow label="Största vinst" value={`${summary.biggestWin.score} mot ${summary.biggestWin.opponent} (omg ${summary.biggestWin.round})`} color="var(--success)" />
          )}
          {summary.worstLoss && (
            <StatRow label="Tyngsta förlust" value={`${summary.worstLoss.score} mot ${summary.worstLoss.opponent}`} color="var(--danger)" />
          )}
        </div>

        {/* POINTS CHART */}
        <div className="card-sharp card-stagger-6" style={{ padding: '10px 14px', marginBottom: 8 }}>
          <SectionLabel>POÄNGKURVA</SectionLabel>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Första halvan: </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: summary.formTrend === 'declining' ? 'var(--success)' : 'var(--text-primary)' }}>{summary.firstHalfPoints} p</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Andra halvan: </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: summary.formTrend === 'improving' ? 'var(--success)' : 'var(--text-primary)' }}>{summary.secondHalfPoints} p</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Trend: </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: summary.formTrend === 'improving' ? 'var(--success)' : summary.formTrend === 'declining' ? 'var(--danger)' : 'var(--text-primary)' }}>
                {summary.formTrend === 'improving' ? '↑' : summary.formTrend === 'declining' ? '↓' : '→'}
              </span>
            </div>
          </div>
          <PointsChart />
        </div>

        {/* YOUTH INTAKE */}
        {summary.youthIntakeCount > 0 && (
          <div className="card-sharp card-stagger-6" style={{ padding: '10px 14px', marginBottom: 8 }}>
            <SectionLabel>UNGDOMSKULL</SectionLabel>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>
              {summary.youthIntakeCount} nya spelare rekryterades
            </p>
            {summary.bestYouthProspect && (
              <div style={{ background: 'rgba(196,122,58,0.08)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(196,122,58,0.2)' }}>
                <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>BÄSTA PROSPEKT</p>
                <p style={{ fontSize: 14, fontWeight: 700 }}>{summary.bestYouthProspect.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {summary.bestYouthProspect.position} · Potential: {summary.bestYouthProspect.potential}
                </p>
              </div>
            )}
          </div>
        )}

        {/* COMMUNITY STANDING */}
        {summary.communityStandingEnd !== undefined && (
          <div className="card-sharp card-stagger-6" style={{ padding: '10px 14px', marginBottom: 8 }}>
            <SectionLabel>ORTEN</SectionLabel>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lokalstöd vid säsongsslut</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: csColor(summary.communityStandingEnd) }}>
                {summary.communityStandingEnd}
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(26,26,24,0.08)', borderRadius: 3 }}>
              <div style={{
                height: '100%',
                width: `${summary.communityStandingEnd}%`,
                background: csColor(summary.communityStandingEnd),
                borderRadius: 3,
                transition: 'width 0.6s ease',
              }} />
            </div>
            {(summary.communityHighlights ?? []).length > 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                {summary.communityHighlights.join(' · ')}
              </p>
            )}
          </div>
        )}

        {/* FINANCES */}
        <div className="card-sharp card-stagger-7" style={{ padding: '10px 14px', marginBottom: 8 }}>
          <SectionLabel>EKONOMI</SectionLabel>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vid säsongsstart</p>
              <p style={{ fontSize: 16, fontWeight: 700 }}>{formatCurrency(summary.startFinances)}</p>
            </div>
            <span style={{ fontSize: 20, color: summary.financialChange >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              →
            </span>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vid säsongsslut</p>
              <p style={{ fontSize: 16, fontWeight: 700 }}>{formatCurrency(summary.endFinances)}</p>
            </div>
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: summary.financialChange >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: 8, textAlign: 'center' }}>
            {summary.financialChange >= 0 ? '+' : ''}{formatCurrency(Math.abs(summary.financialChange))}
          </p>
        </div>


        {/* NEXT SEASON BUTTON (only if not historical view) */}
        {!isHistorical && (
          <div style={{ padding: '0 0 20px' }}>
            <button
              onClick={handleShare}
              disabled={sharing}
              style={{
                width: '100%', padding: '13px', marginBottom: 10,
                background: 'transparent', border: '1px solid rgba(196,122,58,0.4)',
                borderRadius: 12, color: 'var(--accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {sharing ? 'Genererar bild...' : '📤 Dela din säsong'}
            </button>
            <button
              onClick={() => navigate('/game/history')}
              style={{
                width: '100%', padding: '13px', marginBottom: 10,
                background: 'transparent', border: '1px solid var(--border)',
                borderRadius: 12, color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              📖 Se hela karriärhistoriken
            </button>
            <button
              onClick={handleNextSeason}
              style={{
                width: '100%',
                padding: '17px',
                background: 'var(--accent)',
                color: 'var(--text-light)',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(196,122,58,0.3)',
              }}
            >
              Starta säsong {summary.season + 1} →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AwardCard({ icon, title, name, value }: { icon: string; title: string; name: string; value: string }) {
  return (
    <div style={{
      background: 'rgba(196,122,58,0.06)',
      border: '1px solid rgba(196,122,58,0.15)',
      borderRadius: 8,
      padding: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 12 }}>{icon}</span>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>{title}</span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{name}</p>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{value}</p>
    </div>
  )
}
