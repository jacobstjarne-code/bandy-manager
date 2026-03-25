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
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
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
          gap: 16, marginBottom: 12,
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
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
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

        {/* Goal scorers */}
        {goalEvents.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {/* Home scorers */}
            <div style={{ flex: 1 }}>
              {homeGoals.map((e, i) => {
                const scorer = e.playerId ? game.players.find(p => p.id === e.playerId) : null
                return (
                  <div key={i} style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 2 }}>
                    {e.minute}' {scorer ? `${scorer.firstName[0]}. ${scorer.lastName}` : '?'}
                  </div>
                )
              })}
            </div>
            {/* Away scorers */}
            <div style={{ flex: 1, textAlign: 'right' }}>
              {awayGoals.map((e, i) => {
                const scorer = e.playerId ? game.players.find(p => p.id === e.playerId) : null
                return (
                  <div key={i} style={{ fontSize: 12, color: '#8A9BB0', marginBottom: 2 }}>
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
            marginBottom: 20,
            fontSize: 12,
            color: '#C9A84C',
            textAlign: 'center',
          }}>
            Matchens spelare: {potm.firstName} {potm.lastName} · {potmRating.toFixed(1)}
          </div>
        )}

        {/* Stats from report */}
        {fixture.report && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 16,
            fontSize: 12, color: '#4A6080', marginBottom: 24,
          }}>
            {fixture.report.shotsHome !== undefined && (
              <span>Skott {fixture.report.shotsHome}–{fixture.report.shotsAway}</span>
            )}
            {fixture.report.cornersHome !== undefined && (
              <span>Hörnor {fixture.report.cornersHome}–{fixture.report.cornersAway}</span>
            )}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
