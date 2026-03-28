import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { PlayerLink } from '../components/PlayerLink'
import { ordinal } from '../utils/formatters'

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

export function HistoryScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)

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
          <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Klubbhistorik</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {game.clubs.find(c => c.id === game.managedClubId)?.name}
          </p>
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="card-round" style={{
          padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)',
        }}>
          <p style={{ fontSize: 22, marginBottom: 12 }}>📖</p>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Ingen historik ännu.</p>
          <p style={{ fontSize: 13 }}>Spela din första säsong för att bygga klubbens historia.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
          {summaries.map((s, i) => {
            const isGold = s.playoffResult === 'champion'
            const cup = cupLabel(s.cupResult)
            return (
              <div
                key={s.season}
                className={`card-round card-stagger-${Math.min(i + 1, 6)}`}
                style={{
                  background: isGold ? 'linear-gradient(135deg, rgba(196,122,58,0.12), rgba(196,122,58,0.04))' : undefined,
                  border: isGold ? '1px solid rgba(196,122,58,0.4)' : undefined,
                  padding: '16px',
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
                      🔴 Toppskytt:{' '}
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
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                    📋 {s.narrativeSummary}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Hall of Fame */}
      <div className="card-round" style={{ padding: '18px 16px' }}>
        <p style={{
          fontSize: 12, fontWeight: 700, letterSpacing: '2px',
          textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 18,
          borderBottom: '1px solid rgba(196,122,58,0.25)', paddingBottom: 10,
        }}>
          ── Hall of Fame ──
        </p>

        {topGoalScorers.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p className="leather-bar texture-leather" style={{ color: 'var(--text-light-secondary)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>
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
            <p className="leather-bar texture-leather" style={{ color: 'var(--text-light-secondary)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>
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
            <p className="leather-bar texture-leather" style={{ color: 'var(--text-light-secondary)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>
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
