import { useNavigate, useParams } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import type { SeasonSummary } from '../../domain/services/seasonSummaryService'
import { ClubBadge } from '../components/ClubBadge'
import { Card } from '../components/Card'
import { SectionLabel } from '../components/SectionLabel'

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
        <button onClick={() => navigate('/game/dashboard')} style={{ marginTop: 16, color: '#C9A84C', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
          ← Tillbaka
        </button>
      </div>
    )
  }

  const isHistorical = !!params.season
  const isChampion = summary.playoffResult === 'champion'
  const positionColor = summary.finalPosition <= 3 ? '#C9A84C' : summary.finalPosition >= 10 ? '#ef4444' : '#F0F4F8'

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid #1e3450' }}>
        <span style={{ fontSize: 13, color: '#8A9BB0' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: color ?? '#F0F4F8' }}>{value}</span>
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
          stroke="#C9A84C" strokeWidth="1" strokeDasharray="4,4" opacity="0.4"/>
        <text x={w - pad.r - 2} y={thresholdY - 3} fontSize="8" fill="#C9A84C" textAnchor="end" opacity="0.6">Topp 8</text>
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#C9A84C"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Dots at first and last */}
        {data.length > 0 && (
          <>
            <circle cx={pad.l} cy={pad.t + chartH - (data[0] / maxPts) * chartH} r="3" fill="#C9A84C"/>
            <circle cx={pad.l + chartW} cy={pad.t + chartH - (data[data.length-1] / maxPts) * chartH} r="3" fill="#C9A84C"/>
          </>
        )}
        {/* X-axis labels */}
        {[1, 6, 11, 16, 22].map(r => {
          const x = pad.l + ((r-1) / 21) * chartW
          return <text key={r} x={x} y={h - 2} fontSize="8" fill="#4A6080" textAnchor="middle">{r}</text>
        })}
      </svg>
    )
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
      background: '#0D1B2A',
    }}>
      <div style={{ padding: '0 16px 100px' }}>

        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(180deg, #061018 0%, #0D1B2A 100%)',
          padding: '24px 0 20px',
          textAlign: 'center',
          marginBottom: 16,
          position: 'relative',
        }}>
          <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: 16, left: 0, background: 'none', border: 'none', color: '#8A9BB0', fontSize: 22, cursor: 'pointer' }}>←</button>

          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#4A6080', marginBottom: 8 }}>
            ÅRSBOK
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <ClubBadge clubId={summary.clubId} name={summary.clubName} size={56} />
          </div>
          <p style={{ fontSize: 14, color: '#8A9BB0', marginBottom: 4 }}>{summary.clubName}</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '3px', color: '#F0F4F8', marginBottom: 8 }}>
            SÄSONG {summary.season}
          </h1>

          {/* Position badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{
              fontSize: 40,
              fontWeight: 900,
              color: positionColor,
              textShadow: summary.finalPosition <= 3 ? '0 0 20px rgba(201,168,76,0.5)' : 'none',
            }}>
              {summary.finalPosition}.
            </span>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 11, color: '#4A6080', textTransform: 'uppercase', letterSpacing: '1px' }}>plats</p>
              <p style={{ fontSize: 13, color: '#8A9BB0' }}>{summary.points} poäng</p>
            </div>
          </div>

          {/* Playoff result */}
          {summary.playoffResult && (
            <p style={{
              fontSize: 13,
              fontWeight: 700,
              color: isChampion ? '#C9A84C' : '#8A9BB0',
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
            background: summary.expectationVerdict === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
            border: `1px solid ${summary.expectationVerdict === 'failed' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
          }}>
            <span style={{ fontSize: 12 }}>{verdictIcon(summary.expectationVerdict)}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: summary.expectationVerdict === 'failed' ? '#ef4444' : '#22c55e' }}>
              {verdictText(summary)}
            </span>
          </div>
        </div>

        {/* NARRATIVE */}
        <Card stagger={1} style={{ borderLeft: '3px solid #C9A84C', background: 'rgba(201,168,76,0.05)' }}>
          <p style={{ fontSize: 15, fontStyle: 'italic', color: '#F0F4F8', lineHeight: 1.6 }}>
            "{summary.narrativeSummary}"
          </p>
        </Card>

        {/* SEASON'S BEST */}
        <Card stagger={2}>
          <SectionLabel>SÄSONGENS BÄSTA</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {summary.topScorer && (
              <AwardCard icon="🔴" title="Toppskyttar" name={summary.topScorer.name}
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
        </Card>

        {/* STATISTICS */}
        <Card stagger={3}>
          <SectionLabel>STATISTIK</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div>
              <StatRow label="Spelade" value={summary.wins + summary.draws + summary.losses} />
              <StatRow label="Vinster" value={summary.wins} color="#22c55e" />
              <StatRow label="Oavgjorda" value={summary.draws} />
              <StatRow label="Förluster" value={summary.losses} color="#ef4444" />
            </div>
            <div>
              <StatRow label="Mål gjorda" value={summary.goalsFor} />
              <StatRow label="Mål insläppta" value={summary.goalsAgainst} />
              <StatRow label="Hörnmål" value={summary.totalCornerGoals} />
              <StatRow label="Nollor" value={summary.totalCleanSheets} />
            </div>
          </div>
        </Card>

        {/* HOME vs AWAY */}
        <div className="card-stagger-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <Card style={{ marginBottom: 0 }}>
            <SectionLabel>HEMMA</SectionLabel>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>{summary.homeRecord.wins}</p>
            <p style={{ fontSize: 11, color: '#8A9BB0' }}>V</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 13, color: '#8A9BB0' }}>O: {summary.homeRecord.draws}</span>
              <span style={{ fontSize: 13, color: '#ef4444' }}>F: {summary.homeRecord.losses}</span>
            </div>
          </Card>
          <Card style={{ marginBottom: 0 }}>
            <SectionLabel>BORTA</SectionLabel>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>{summary.awayRecord.wins}</p>
            <p style={{ fontSize: 11, color: '#8A9BB0' }}>V</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 13, color: '#8A9BB0' }}>O: {summary.awayRecord.draws}</span>
              <span style={{ fontSize: 13, color: '#ef4444' }}>F: {summary.awayRecord.losses}</span>
            </div>
          </Card>
        </div>

        {/* STREAKS */}
        <Card stagger={5}>
          <SectionLabel>STREAKS OCH EXTREMER</SectionLabel>
          <StatRow label="Längsta vinstsvit" value={`${summary.longestWinStreak} matcher`} color="#22c55e" />
          <StatRow label="Längsta förlustsvit" value={`${summary.longestLossStreak} matcher`} color="#ef4444" />
          {summary.biggestWin && (
            <StatRow label="Största vinst" value={`${summary.biggestWin.score} mot ${summary.biggestWin.opponent} (omg ${summary.biggestWin.round})`} color="#22c55e" />
          )}
          {summary.worstLoss && (
            <StatRow label="Tyngsta förlust" value={`${summary.worstLoss.score} mot ${summary.worstLoss.opponent}`} color="#ef4444" />
          )}
        </Card>

        {/* POINTS CHART */}
        <Card stagger={6}>
          <SectionLabel>POÄNGKURVA</SectionLabel>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 11, color: '#8A9BB0' }}>Första halvan: </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: summary.formTrend === 'declining' ? '#22c55e' : '#F0F4F8' }}>{summary.firstHalfPoints} p</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#8A9BB0' }}>Andra halvan: </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: summary.formTrend === 'improving' ? '#22c55e' : '#F0F4F8' }}>{summary.secondHalfPoints} p</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#8A9BB0' }}>Trend: </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: summary.formTrend === 'improving' ? '#22c55e' : summary.formTrend === 'declining' ? '#ef4444' : '#F0F4F8' }}>
                {summary.formTrend === 'improving' ? '↑' : summary.formTrend === 'declining' ? '↓' : '→'}
              </span>
            </div>
          </div>
          <PointsChart />
        </Card>

        {/* YOUTH INTAKE */}
        {summary.youthIntakeCount > 0 && (
          <Card stagger={6}>
            <SectionLabel>UNGDOMSKULL</SectionLabel>
            <p style={{ fontSize: 14, color: '#F0F4F8', marginBottom: 8 }}>
              {summary.youthIntakeCount} nya spelare rekryterades
            </p>
            {summary.bestYouthProspect && (
              <div style={{ background: 'rgba(201,168,76,0.08)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(201,168,76,0.2)' }}>
                <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, marginBottom: 4 }}>BÄSTA PROSPEKT</p>
                <p style={{ fontSize: 14, fontWeight: 700 }}>{summary.bestYouthProspect.name}</p>
                <p style={{ fontSize: 12, color: '#8A9BB0' }}>
                  {summary.bestYouthProspect.position} · Potential: {summary.bestYouthProspect.potential}
                </p>
              </div>
            )}
          </Card>
        )}

        {/* COMMUNITY STANDING */}
        {summary.communityStandingEnd !== undefined && (
          <Card stagger={6}>
            <SectionLabel>ORTEN</SectionLabel>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#4A6080' }}>Lokalstöd vid säsongsslut</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: summary.communityStandingEnd > 70 ? '#22c55e' : summary.communityStandingEnd > 50 ? '#C9A84C' : summary.communityStandingEnd > 30 ? '#f59e0b' : '#ef4444' }}>
                {summary.communityStandingEnd}
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
              <div style={{
                height: '100%',
                width: `${summary.communityStandingEnd}%`,
                background: summary.communityStandingEnd > 70 ? '#22c55e' : summary.communityStandingEnd > 50 ? '#C9A84C' : summary.communityStandingEnd > 30 ? '#f59e0b' : '#ef4444',
                borderRadius: 3,
                transition: 'width 0.6s ease',
              }} />
            </div>
            {(summary.communityHighlights ?? []).length > 0 && (
              <p style={{ fontSize: 12, color: '#8A9BB0', marginTop: 8 }}>
                {summary.communityHighlights.join(' · ')}
              </p>
            )}
          </Card>
        )}

        {/* FINANCES */}
        <Card stagger={7}>
          <SectionLabel>EKONOMI</SectionLabel>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, color: '#4A6080' }}>Vid säsongsstart</p>
              <p style={{ fontSize: 16, fontWeight: 700 }}>{summary.startFinances.toLocaleString('sv-SE')} kr</p>
            </div>
            <span style={{ fontSize: 20, color: summary.financialChange >= 0 ? '#22c55e' : '#ef4444' }}>
              →
            </span>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: '#4A6080' }}>Vid säsongsslut</p>
              <p style={{ fontSize: 16, fontWeight: 700 }}>{summary.endFinances.toLocaleString('sv-SE')} kr</p>
            </div>
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: summary.financialChange >= 0 ? '#22c55e' : '#ef4444', marginTop: 8, textAlign: 'center' }}>
            {summary.financialChange >= 0 ? '+' : ''}{summary.financialChange.toLocaleString('sv-SE')} kr
          </p>
        </Card>

        {/* SÄSONGENS BERÄTTELSER */}
        {(summary.storyTriggers ?? []).length > 0 && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 12 }}>
              SÄSONGENS BERÄTTELSER
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(summary.storyTriggers ?? []).map((trigger, i) => (
                <div key={i} style={{
                  background: '#0e1f33',
                  border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: 10,
                  padding: '12px 14px',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#F0F4F8', marginBottom: 4 }}>
                    {trigger.headline}
                  </p>
                  <p style={{ fontSize: 12, color: '#8A9BB0', lineHeight: 1.5 }}>
                    {trigger.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEXT SEASON BUTTON (only if not historical view) */}
        {!isHistorical && (
          <div style={{ padding: '0 0 20px' }}>
            <button
              onClick={() => navigate('/game/history')}
              style={{
                width: '100%', padding: '13px', marginBottom: 10,
                background: 'transparent', border: '1px solid #1e3450',
                borderRadius: 12, color: '#8A9BB0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              📖 Se hela karriärhistoriken
            </button>
            <button
              onClick={handleNextSeason}
              style={{
                width: '100%',
                padding: '17px',
                background: '#C9A84C',
                color: '#0D1B2A',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(201,168,76,0.3)',
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
      background: 'rgba(201,168,76,0.06)',
      border: '1px solid rgba(201,168,76,0.15)',
      borderRadius: 8,
      padding: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 12 }}>{icon}</span>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#4A6080' }}>{title}</span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#F0F4F8', marginBottom: 2 }}>{name}</p>
      <p style={{ fontSize: 11, color: '#8A9BB0' }}>{value}</p>
    </div>
  )
}
