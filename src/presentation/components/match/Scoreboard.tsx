import type { Fixture } from '../../../domain/entities/Fixture'
import type { MatchWeather } from '../../../domain/entities/Weather'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { MatchStep } from '../../../domain/services/matchSimulator'
import { MatchEventType, IceQuality } from '../../../domain/enums'
import { getWeatherEmoji, getIceQualityLabel } from '../../../domain/services/weatherService'

interface Rivalry {
  name: string
}

interface ScoreboardProps {
  homeShort: string
  awayShort: string
  homeScore: number
  awayScore: number
  homeScoreFlash: boolean
  awayScoreFlash: boolean
  currentMinute: number
  matchDone: boolean
  rivalry: Rivalry | null
  matchWeather?: MatchWeather
  currentMatchStep: MatchStep | null
  displayedSteps: MatchStep[]
  fixture: Fixture
  game: SaveGame | null
}

export function Scoreboard({
  homeShort,
  awayShort,
  homeScore,
  awayScore,
  homeScoreFlash,
  awayScoreFlash,
  currentMinute,
  matchDone,
  rivalry,
  matchWeather,
  currentMatchStep,
  displayedSteps,
  fixture,
  game,
}: ScoreboardProps) {
  return (
    <div style={{
      background: 'var(--led-bg)',
      borderRadius: 8,
      border: '3px solid var(--led-border)',
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)',
      padding: '12px 16px',
      margin: '8px 12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
    }}>
      {/* Score row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontFamily: 'Courier New, monospace', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.85)', letterSpacing: '1.5px', margin: '0 0 2px', textTransform: 'uppercase' }}>
            {homeShort} <span style={{ color: 'var(--led-time)', fontSize: 12, fontWeight: 700 }}>H</span>
          </p>
          <span
            key={`home-${homeScore}`}
            style={{
              display: 'block',
              fontFamily: 'Courier New, monospace', fontWeight: 900, fontSize: 56,
              color: homeScoreFlash ? 'var(--led-score-flash)' : 'var(--led-score)',
              textShadow: homeScoreFlash
                ? '0 0 20px rgba(255,153,0,0.8), 0 0 40px rgba(255,153,0,0.4)'
                : '0 0 10px rgba(255,26,26,0.6), 0 0 20px rgba(255,26,26,0.3)',
              lineHeight: 1, letterSpacing: '4px',
              transition: 'color 0.3s ease, text-shadow 0.3s ease',
              animation: homeScoreFlash ? 'scaleFlash 400ms ease-out both' : undefined,
            }}
          >
            {homeScore}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ color: 'var(--led-score)', fontSize: 28, fontWeight: 900, opacity: 0.7, fontFamily: 'Courier New, monospace', lineHeight: 1 }}>–</span>
          <span style={{
            fontFamily: 'Courier New, monospace', fontWeight: 700, fontSize: 22,
            color: 'var(--led-time)',
            textShadow: '0 0 8px rgba(204,255,0,0.5)',
            lineHeight: 1,
          }}>
            {matchDone ? 'FT' : `${currentMinute}'`}
          </span>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ fontFamily: 'Courier New, monospace', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.85)', letterSpacing: '1.5px', margin: '0 0 2px', textTransform: 'uppercase' }}>
            <span style={{ color: 'var(--led-time)', fontSize: 12, fontWeight: 700 }}>G</span> {awayShort}
          </p>
          <span
            key={`away-${awayScore}`}
            style={{
              display: 'block',
              fontFamily: 'Courier New, monospace', fontWeight: 900, fontSize: 56,
              color: awayScoreFlash ? 'var(--led-score-flash)' : 'var(--led-score)',
              textShadow: awayScoreFlash
                ? '0 0 20px rgba(255,153,0,0.8), 0 0 40px rgba(255,153,0,0.4)'
                : '0 0 10px rgba(255,26,26,0.6), 0 0 20px rgba(255,26,26,0.3)',
              lineHeight: 1, letterSpacing: '4px',
              transition: 'color 0.3s ease, text-shadow 0.3s ease',
              animation: awayScoreFlash ? 'scaleFlash 400ms ease-out both' : undefined,
            }}
          >
            {awayScore}
          </span>
        </div>
      </div>

      {rivalry && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
          borderRadius: 99, background: 'rgba(220,50,30,0.2)',
          border: '1px solid rgba(220,100,30,0.4)', fontSize: 10, fontWeight: 700, color: 'var(--led-warn)',
        }}>
          🔥 {rivalry.name}
        </div>
      )}

      {matchWeather && (
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, fontFamily: 'Courier New, monospace' }}>
          {getWeatherEmoji(matchWeather.weather.condition)}{' '}
          {matchWeather.weather.temperature > 0 ? '+' : ''}{matchWeather.weather.temperature}°
          {' · '}
          <span style={{ color: matchWeather.weather.iceQuality === IceQuality.Poor ? 'var(--led-warn)' : 'inherit' }}>
            {getIceQualityLabel(matchWeather.weather.iceQuality)}
          </span>
          {matchWeather.weather.temperature <= -15 && ' ❄'}
        </p>
      )}

      {/* Arena name */}
      {game && (() => {
        const homeClub = game.clubs.find(c => c.id === fixture.homeClubId)
        return homeClub?.arenaName ? (
          <p style={{
            fontSize: 10,
            color: '#A89878',
            margin: 0,
            fontFamily: 'Courier New, monospace',
            letterSpacing: '1.5px',
            textShadow: '0 0 4px rgba(168,152,120,0.3)',
          }}>
            {homeClub.arenaName.toUpperCase()}
          </p>
        ) : null
      })()}

      {/* Suspensions */}
      {(() => {
        if (!currentMatchStep) return null
        const allEventsSoFar = displayedSteps.flatMap(s => s.events)
        const currentMin = currentMatchStep.minute
        const hasSusp = currentMatchStep.activeSuspensions.homeCount > 0 || currentMatchStep.activeSuspensions.awayCount > 0
        const homeSusp = allEventsSoFar
          .filter(e => e.type === MatchEventType.RedCard && e.clubId === fixture.homeClubId && currentMin - e.minute < 10)
          .map(e => {
            const p = e.playerId ? (game?.players ?? []).find(pl => pl.id === e.playerId) : null
            const remaining = 10 - (currentMin - e.minute)
            return p?.shirtNumber != null ? `#${p.shirtNumber} (${remaining}\u2032)` : '?'
          })
        const awaySusp = allEventsSoFar
          .filter(e => e.type === MatchEventType.RedCard && e.clubId === fixture.awayClubId && currentMin - e.minute < 10)
          .map(e => {
            const p = e.playerId ? (game?.players ?? []).find(pl => pl.id === e.playerId) : null
            const remaining = 10 - (currentMin - e.minute)
            return p?.shirtNumber != null ? `#${p.shirtNumber} (${remaining}\u2032)` : '?'
          })
        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
            width: '100%', padding: '4px 0 0',
            fontSize: 11, fontWeight: 700, fontFamily: 'Courier New, monospace',
            color: 'var(--led-warn)',
            minHeight: 20,
            opacity: hasSusp ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              {homeSusp.length > 0 && <span>⚠ {homeSusp.join(' ')}</span>}
            </div>
            <div style={{ width: 60, flexShrink: 0 }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              {awaySusp.length > 0 && <span>{awaySusp.join(' ')} ⚠</span>}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
