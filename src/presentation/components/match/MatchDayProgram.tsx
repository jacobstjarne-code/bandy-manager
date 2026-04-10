import { useState } from 'react'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Club } from '../../../domain/entities/Club'
import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { MatchWeather } from '../../../domain/entities/Weather'
import { getRivalry } from '../../../domain/data/rivalries'

interface MatchDayProgramProps {
  fixture: Fixture
  opponent: Club
  managedClub: Club
  game: SaveGame
  myPlayers: Player[]
}

function FormDot({ result }: { result: 'W' | 'D' | 'L' }) {
  const color = result === 'W' ? 'var(--success)' : result === 'D' ? 'var(--accent)' : 'var(--danger)'
  return (
    <span style={{
      display: 'inline-block', width: 12, height: 12,
      borderRadius: '50%', background: color, flexShrink: 0,
    }} title={result} />
  )
}

export function MatchDayProgram({ fixture, opponent, managedClub, game, myPlayers }: MatchDayProgramProps) {
  const [open, setOpen] = useState(false)

  const isHome = fixture.homeClubId === game.managedClubId
  const matchWeatherEntry: MatchWeather | undefined = game.matchWeathers?.find(mw => mw.fixtureId === fixture.id)
  const weather = matchWeatherEntry?.weather
  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)
  const h2h = game.rivalryHistory?.[opponent.id]

  // My recent form (last 5 completed managed fixtures)
  const myRecentFixtures = game.fixtures
    .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .slice(-5)
  const myForm: ('W' | 'D' | 'L')[] = myRecentFixtures.map(f => {
    const myHome = f.homeClubId === game.managedClubId
    const my = myHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
    const opp = myHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
    return my > opp ? 'W' : my < opp ? 'L' : 'D'
  })

  // Opponent recent form (last 5 completed fixtures)
  const oppRecentFixtures = game.fixtures
    .filter(f => f.status === 'completed' && (f.homeClubId === opponent.id || f.awayClubId === opponent.id))
    .slice(-5)
  const oppForm: ('W' | 'D' | 'L')[] = oppRecentFixtures.map(f => {
    const oppHome = f.homeClubId === opponent.id
    const opp = oppHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
    const their = oppHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
    return opp > their ? 'W' : opp < their ? 'L' : 'D'
  })

  // Top scorer in my squad
  const topScorer = [...myPlayers].sort((a, b) => b.seasonStats.goals - a.seasonStats.goals)[0]
  const injuredCount = myPlayers.filter(p => p.isInjured).length
  const suspendedCount = myPlayers.filter(p => p.suspensionGamesRemaining > 0).length

  const opponentStanding = game.standings.find(s => s.clubId === opponent.id)
  const myStanding = game.standings.find(s => s.clubId === game.managedClubId)

  return (
    <div className="card-sharp" style={{ margin: '0 0 8px', padding: '10px 14px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
          📋 MATCHDAGSPROGRAM
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Always visible: headline */}
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{managedClub.shortName ?? managedClub.name}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>#{myStanding?.position ?? '—'}</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
          {isHome ? 'Hemma' : 'Borta'}
        </span>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{opponent.shortName ?? opponent.name}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>#{opponentStanding?.position ?? '—'}</span>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 12 }}>
          {/* H2H */}
          {h2h && (h2h.wins > 0 || h2h.losses > 0 || h2h.draws > 0) && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                INBÖRDES MÖTEN
              </p>
              <p style={{ fontSize: 12 }}>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>{h2h.wins}V</span>
                {' · '}
                <span style={{ color: 'var(--text-muted)' }}>{h2h.draws}O</span>
                {' · '}
                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{h2h.losses}F</span>
                {' · '}
                <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{h2h.currentStreak > 0 ? `${h2h.currentStreak} raka vinster` : h2h.currentStreak < 0 ? `${Math.abs(h2h.currentStreak)} raka förluster` : ''}</span>
              </p>
              {rivalry && (
                <p style={{ fontSize: 11, color: 'var(--warning)', marginTop: 2 }}>⚡ Derbymatch</p>
              )}
            </div>
          )}

          {/* Form comparison */}
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
              FORM (SENASTE 5)
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {myForm.length > 0 ? myForm.map((r, i) => <FormDot key={i} result={r} />) : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>}
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>vs</span>
              <div style={{ display: 'flex', gap: 4, flexDirection: 'row-reverse' }}>
                {oppForm.length > 0 ? oppForm.map((r, i) => <FormDot key={i} result={r} />) : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>}
              </div>
            </div>
          </div>

          {/* Weather */}
          {weather && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                VÄDER
              </p>
              <p style={{ fontSize: 12 }}>
                {weather.condition} · {weather.temperature}°C · {weather.windStrength} m/s vind
              </p>
            </div>
          )}

          {/* Squad status */}
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
              TRUPPEN
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {injuredCount > 0 && (
                <span style={{ fontSize: 11, color: 'var(--danger)' }}>🩹 {injuredCount} skadade</span>
              )}
              {suspendedCount > 0 && (
                <span style={{ fontSize: 11, color: 'var(--warning)' }}>⚠️ {suspendedCount} avstängda</span>
              )}
              {injuredCount === 0 && suspendedCount === 0 && (
                <span style={{ fontSize: 11, color: 'var(--success)' }}>✅ Alla tillgängliga</span>
              )}
              {topScorer && topScorer.seasonStats.goals > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  🎯 {topScorer.firstName} {topScorer.lastName} {topScorer.seasonStats.goals} mål
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
