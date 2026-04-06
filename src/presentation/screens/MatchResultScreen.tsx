import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { MatchEventType } from '../../domain/enums'

export function MatchResultScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const advance = useGameStore(s => s.advance)

  if (!game || !game.lastCompletedFixtureId) {
    navigate('/game', { replace: true })
    return null
  }

  const fixture = game.fixtures.find(f => f.id === game.lastCompletedFixtureId)
  if (!fixture) {
    navigate('/game', { replace: true })
    return null
  }

  const homeClub = game.clubs.find(c => c.id === fixture.homeClubId)
  const awayClub = game.clubs.find(c => c.id === fixture.awayClubId)
  const isHome = fixture.homeClubId === game.managedClubId
  const myScore = isHome ? fixture.homeScore : fixture.awayScore
  const theirScore = isHome ? fixture.awayScore : fixture.homeScore

  // Determine actual winner including OT/penalties
  const penResult = fixture.penaltyResult
  const otResult = fixture.overtimeResult
  const wonByPenalties = penResult
    ? (isHome ? penResult.home > penResult.away : penResult.away > penResult.home)
    : false
  const lostByPenalties = penResult
    ? (isHome ? penResult.home < penResult.away : penResult.away < penResult.home)
    : false
  const wonByOT = otResult
    ? (isHome ? otResult === 'home' : otResult === 'away')
    : false
  const lostByOT = otResult
    ? (isHome ? otResult === 'away' : otResult === 'home')
    : false

  const won = myScore > theirScore || wonByOT || wonByPenalties
  const lost = myScore < theirScore || lostByOT || lostByPenalties

  const potmId = fixture.report?.playerOfTheMatchId
  const potm = potmId ? game.players.find(p => p.id === potmId) : null
  const potmRating = potmId ? fixture.report?.playerRatings[potmId] : null

  const resultColor = won ? 'var(--success)' : lost ? 'var(--danger)' : 'var(--accent)'
  const resultLabel = wonByPenalties ? 'SEGER (straffar)'
    : lostByPenalties ? 'FÖRLUST (straffar)'
    : wonByOT ? 'SEGER (förl.)'
    : lostByOT ? 'FÖRLUST (förl.)'
    : won ? 'SEGER' : lost ? 'FÖRLUST' : 'OAVGJORT'

  function handleContinue() {
    const result = advance()
    if (!result) navigate('/game', { replace: true })
  }

  const fadeIn = (delay: string) => ({
    animation: `fadeInUp 500ms ease-out ${delay} both` as const,
  })

  // B3: Result flavor text
  const margin = myScore - theirScore
  const totalGoals = (fixture.homeScore ?? 0) + (fixture.awayScore ?? 0)
  const flavorText = wonByPenalties ? '🎯 Kalla nerver i straffarna'
    : lostByPenalties ? '😔 Straffarna avgjorde'
    : wonByOT ? '⏱️ Avgjort i sista stund'
    : lostByOT ? '⏱️ Förlängt lidande'
    : won
    ? margin >= 3 ? '💪 Dominant insats'
      : totalGoals >= 8 ? '🔥 Målrik historia'
      : margin === 1 ? '😅 Knapp seger'
      : '✅ Klar vinst'
    : lost
    ? margin <= -3 ? '💣 Svår dag på jobbet'
      : margin === -1 ? '😤 Nära men inte nog'
      : '❌ Klar förlust'
    : totalGoals >= 8 ? '🎢 Dramatiskt kryss'
    : '🤝 Rättvis poängdelning'

  // B2: Key moments (goals + red cards)
  const keyMoments = fixture.events
    .filter(e => e.type === MatchEventType.Goal || e.type === MatchEventType.RedCard)
    .sort((a, b) => a.minute - b.minute)

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      background: 'var(--bg)',
      padding: '20px 16px 90px',
    }}>
      <div className="card-sharp" style={{
        padding: '16px 14px',
        width: '100%',
        maxWidth: 390,
        margin: '0 auto',
      }}>
        {/* Round label */}
        <div style={{ marginBottom: 10, textAlign: 'center', ...fadeIn('0ms') }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '1.5px',
            textTransform: 'uppercase', color: 'var(--text-muted)',
          }}>
            {fixture.roundNumber <= 22
              ? `Omgång ${fixture.roundNumber}`
              : fixture.roundNumber <= 25 ? 'Kvartsfinal'
              : fixture.roundNumber <= 28 ? 'Semifinal'
              : 'Final'}
          </span>
        </div>

        {/* Club names */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, ...fadeIn('80ms') }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', flex: 1, textAlign: 'left' }}>
            {homeClub?.shortName ?? homeClub?.name}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', flex: 1, textAlign: 'right' }}>
            {awayClub?.shortName ?? awayClub?.name}
          </span>
        </div>

        {/* Big score */}
        {(() => {
          // Determine winner for individual score colors
          const homeWon = penResult ? penResult.home > penResult.away
            : otResult ? otResult === 'home'
            : (fixture.homeScore ?? 0) > (fixture.awayScore ?? 0)
          const awayWon = penResult ? penResult.away > penResult.home
            : otResult ? otResult === 'away'
            : (fixture.awayScore ?? 0) > (fixture.homeScore ?? 0)
          const homeColor = homeWon ? 'var(--success)' : awayWon ? 'var(--danger)' : 'var(--accent)'
          const awayColor = awayWon ? 'var(--success)' : homeWon ? 'var(--danger)' : 'var(--accent)'
          return (
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              gap: 16, marginBottom: penResult ? 4 : 12, ...fadeIn('160ms'),
            }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: homeColor, lineHeight: 1, fontFamily: 'var(--font-display)' }}>
                {fixture.homeScore}
              </span>
              <span style={{ fontSize: 24, color: 'var(--text-muted)', fontWeight: 300 }}>–</span>
              <span style={{ fontSize: 32, fontWeight: 800, color: awayColor, lineHeight: 1, fontFamily: 'var(--font-display)' }}>
                {fixture.awayScore}
              </span>
            </div>
          )
        })()}

        {/* OT / Penalty info */}
        {(fixture.wentToOvertime || penResult) && (
          <div style={{ textAlign: 'center', marginBottom: 12, ...fadeIn('200ms') }}>
            {penResult && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                Straffar: {penResult.home}–{penResult.away}
              </p>
            )}
            {fixture.wentToOvertime && !penResult && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Avgjort i förlängning</p>
            )}
          </div>
        )}

        {/* Result pill */}
        <div style={{ textAlign: 'center', marginBottom: 12, ...fadeIn('280ms') }}>
          <span style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '1px',
            padding: '4px 12px', borderRadius: 20,
            background: won ? 'rgba(90,154,74,0.12)' : lost ? 'rgba(176,80,64,0.12)' : 'rgba(245,241,235,0.08)',
            border: `1px solid ${won ? 'rgba(90,154,74,0.3)' : lost ? 'rgba(176,80,64,0.3)' : 'rgba(245,241,235,0.2)'}`,
            color: resultColor,
          }}>
            {resultLabel}
          </span>
        </div>

        {/* B3: Flavor text */}
        <div style={{ textAlign: 'center', marginBottom: 10, ...fadeIn('360ms') }}>
          <span style={{ fontSize: 13, color: won ? 'var(--success)' : lost ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: 600 }}>
            {flavorText}
          </span>
        </div>

        {/* B2: Key moments mini-timeline */}
        {keyMoments.length > 0 && (
          <div style={{ marginBottom: 12, ...fadeIn('480ms') }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Nyckelmoment</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {keyMoments.map((e, i) => {
                const isHome = e.clubId === fixture.homeClubId
                const scorer = e.playerId ? game.players.find(p => p.id === e.playerId) : null
                const scorerName = scorer ? `${scorer.firstName[0]}. ${scorer.lastName}` : '?'
                const icon = e.type === MatchEventType.Goal
                  ? (e.isCornerGoal ? '📐' : '🏒')
                  : '⏱️'
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: isHome ? 'flex-start' : 'flex-end',
                    gap: 6,
                    animation: `fadeInUp 400ms ease-out ${380 + i * 80}ms both`,
                  }}>
                    {isHome && <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 24, textAlign: 'right', flexShrink: 0 }}>{e.minute}'</span>}
                    {isHome && <span style={{ fontSize: 11 }}>{icon}</span>}
                    <span style={{ fontSize: 11, color: e.type === MatchEventType.RedCard ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      {scorerName}
                    </span>
                    {!isHome && <span style={{ fontSize: 11 }}>{icon}</span>}
                    {!isHome && <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 24, textAlign: 'left', flexShrink: 0 }}>{e.minute}'</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}


        {/* POTM */}
        {potm && potmRating !== null && potmRating !== undefined && (
          <div style={{
            background: 'rgba(196,122,58,0.08)',
            border: '1px solid rgba(196,122,58,0.2)',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 16,
            fontSize: 12,
            color: 'var(--accent)',
            textAlign: 'center',
            ...fadeIn('800ms'),
          }}>
            ⭐ Matchens spelare: {potm.firstName} {potm.lastName} · {potmRating.toFixed(1)}
          </div>
        )}

        {/* Stats from report */}
        {fixture.report && (
          <div style={{ marginBottom: 20, ...fadeIn('900ms') }}>
            {(() => {
              const cornerGoals = fixture.events.filter(
                e => e.type === MatchEventType.Goal && e.isCornerGoal &&
                     (e.clubId === game.managedClubId)
              ).length
              if (cornerGoals > 0) {
                return (
                  <div style={{
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'var(--accent)',
                    background: 'rgba(196,122,58,0.07)',
                    border: '1px solid rgba(196,122,58,0.18)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    marginBottom: 10,
                  }}>
                    📐 {cornerGoals} hörnmål — {fixture.report.cornersHome}–{fixture.report.cornersAway} hörnor totalt
                  </div>
                )
              }
              return null
            })()}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 16,
              fontSize: 12, color: 'var(--text-secondary)',
            }}>
              {fixture.report.cornersHome !== undefined && (
                <span>Hörnor {fixture.report.cornersHome}–{fixture.report.cornersAway}</span>
              )}
              {fixture.report.shotsHome !== undefined && (
                <span>Skott {fixture.report.shotsHome}–{fixture.report.shotsAway}</span>
              )}
              {(() => {
                const homeReds = fixture.events.filter(e => e.type === MatchEventType.RedCard && e.clubId === fixture.homeClubId).length
                const awayReds = fixture.events.filter(e => e.type === MatchEventType.RedCard && e.clubId === fixture.awayClubId).length
                return (homeReds > 0 || awayReds > 0) ? <span>Utvisningar {homeReds}–{awayReds}</span> : null
              })()}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, ...fadeIn('1000ms') }}>
          <button
            onClick={() => navigate('/game/match', { state: { showReport: true } })}
            style={{
              width: '100%', padding: '13px 16px', borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          >
            Se fullständig rapport →
          </button>
          <button
            onClick={handleContinue}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: 'var(--accent)', color: 'var(--text-light)', border: 'none',
            }}
          >
            Fortsätt →
          </button>
        </div>
      </div>
    </div>
  )
}
