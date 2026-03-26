import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { MatchEventType } from '../../domain/enums'

export function MatchResultScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)

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
  const won = myScore > theirScore
  const lost = myScore < theirScore

  const goalEvents = fixture.events.filter(e => e.type === MatchEventType.Goal)
  const homeGoals = goalEvents.filter(e => e.clubId === fixture.homeClubId)
  const awayGoals = goalEvents.filter(e => e.clubId === fixture.awayClubId)

  const potmId = fixture.report?.playerOfTheMatchId
  const potm = potmId ? game.players.find(p => p.id === potmId) : null
  const potmRating = potmId ? fixture.report?.playerRatings[potmId] : null

  const resultColor = won ? '#22c55e' : lost ? '#ef4444' : '#e2e8f0'
  const resultLabel = won ? 'SEGER' : lost ? 'FÖRLUST' : 'OAVGJORT'

  function handleContinue() {
    if ((game!.pendingEvents?.length ?? 0) > 0) {
      navigate('/game/events')
    } else {
      navigate('/game')
    }
  }

  const fadeIn = (delay: string) => ({
    animation: `fadeInUp 500ms ease-out ${delay} both` as const,
  })

  // B3: Result flavor text
  const margin = myScore - theirScore
  const totalGoals = (fixture.homeScore ?? 0) + (fixture.awayScore ?? 0)
  const flavorText = won
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
      position: 'fixed',
      inset: 0,
      background: 'rgba(6,14,25,0.97)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      zIndex: 500,
      overflowY: 'auto',
    }}>
      <div style={{
        background: '#0e1f33',
        border: '1px solid #1e3450',
        borderRadius: 16,
        padding: '28px 24px',
        width: '100%',
        maxWidth: 390,
      }}>
        {/* Round label */}
        <div style={{ marginBottom: 16, textAlign: 'center', ...fadeIn('0ms') }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '1.5px',
            textTransform: 'uppercase', color: '#4A6080',
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
          <span style={{ fontSize: 13, fontWeight: 600, color: '#8A9BB0', flex: 1, textAlign: 'left' }}>
            {homeClub?.shortName ?? homeClub?.name}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#8A9BB0', flex: 1, textAlign: 'right' }}>
            {awayClub?.shortName ?? awayClub?.name}
          </span>
        </div>

        {/* Big score */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: 16, marginBottom: 12, ...fadeIn('160ms'),
        }}>
          <span style={{ fontSize: 52, fontWeight: 800, color: resultColor, lineHeight: 1 }}>
            {fixture.homeScore}
          </span>
          <span style={{ fontSize: 28, color: '#4A6080', fontWeight: 300 }}>–</span>
          <span style={{ fontSize: 52, fontWeight: 800, color: resultColor, lineHeight: 1 }}>
            {fixture.awayScore}
          </span>
        </div>

        {/* Result pill */}
        <div style={{ textAlign: 'center', marginBottom: 20, ...fadeIn('280ms') }}>
          <span style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '1px',
            padding: '4px 12px', borderRadius: 20,
            background: won ? 'rgba(34,197,94,0.1)' : lost ? 'rgba(239,68,68,0.1)' : 'rgba(226,232,240,0.08)',
            border: `1px solid ${won ? 'rgba(34,197,94,0.3)' : lost ? 'rgba(239,68,68,0.3)' : 'rgba(226,232,240,0.2)'}`,
            color: resultColor,
          }}>
            {resultLabel}
          </span>
        </div>

        {/* B3: Flavor text */}
        <div style={{ textAlign: 'center', marginBottom: 16, ...fadeIn('360ms') }}>
          <span style={{ fontSize: 13, color: won ? '#22c55e' : lost ? '#ef4444' : '#8A9BB0', fontWeight: 600 }}>
            {flavorText}
          </span>
        </div>

        {/* B2: Key moments mini-timeline */}
        {keyMoments.length > 0 && (
          <div style={{ marginBottom: 20, ...fadeIn('480ms') }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#4A6080', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Nyckelmoment</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {keyMoments.map((e, i) => {
                const isHome = e.clubId === fixture.homeClubId
                const scorer = e.playerId ? game.players.find(p => p.id === e.playerId) : null
                const scorerName = scorer ? `${scorer.firstName[0]}. ${scorer.lastName}` : '?'
                const icon = e.type === MatchEventType.Goal
                  ? (e.isCornerGoal ? '📐' : '🔴')
                  : '🟥'
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    animation: `fadeInUp 400ms ease-out ${380 + i * 80}ms both`,
                  }}>
                    <span style={{ fontSize: 10, color: '#4A6080', width: 28, textAlign: 'right', flexShrink: 0 }}>{e.minute}'</span>
                    <span style={{ fontSize: 11 }}>{icon}</span>
                    <span style={{ fontSize: 11, color: '#8A9BB0', flex: 1, textAlign: isHome ? 'left' : 'right' }}>
                      {scorerName}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* B1: Goal scorers with per-scorer stagger */}
        {goalEvents.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              {homeGoals.map((e, i) => {
                const scorer = e.playerId ? game.players.find(p => p.id === e.playerId) : null
                return (
                  <div key={i} style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 2, animation: `fadeInUp 400ms ease-out ${600 + i * 100}ms both` }}>
                    {e.minute}' {scorer ? `${scorer.firstName[0]}. ${scorer.lastName}` : '?'}
                    {e.isCornerGoal ? ' 📐' : ''}
                  </div>
                )
              })}
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              {awayGoals.map((e, i) => {
                const scorer = e.playerId ? game.players.find(p => p.id === e.playerId) : null
                return (
                  <div key={i} style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 2, animation: `fadeInUp 400ms ease-out ${600 + i * 100}ms both` }}>
                    {e.isCornerGoal ? '📐 ' : ''}
                    {scorer ? `${scorer.firstName[0]}. ${scorer.lastName}` : '?'} {e.minute}'
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* POTM */}
        {potm && potmRating !== null && potmRating !== undefined && (
          <div style={{
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 16,
            fontSize: 12,
            color: '#C9A84C',
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
                    color: '#C9A84C',
                    background: 'rgba(201,168,76,0.07)',
                    border: '1px solid rgba(201,168,76,0.18)',
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
              fontSize: 12, color: '#4A6080',
            }}>
              {fixture.report.cornersHome !== undefined && (
                <span>Hörnor {fixture.report.cornersHome}–{fixture.report.cornersAway}</span>
              )}
              {fixture.report.shotsHome !== undefined && (
                <span>Skott {fixture.report.shotsHome}–{fixture.report.shotsAway}</span>
              )}
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
              background: 'var(--accent)', color: '#fff', border: 'none',
            }}
          >
            Fortsätt →
          </button>
        </div>
      </div>
    </div>
  )
}
