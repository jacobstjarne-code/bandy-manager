import type { Tactic } from '../../../domain/entities/Club'
import type { MatchWeather } from '../../../domain/entities/Weather'
import { getWeatherEmoji, getIceQualityLabel, getConditionLabel } from '../../../domain/services/weatherService'

interface StartStepProps {
  startingIds: string[]
  tacticState: Tactic
  matchWeatherData: MatchWeather | undefined
  useLiveMode: boolean
  lineupError: string | null
  onSetLiveMode: (v: boolean) => void
  onBack: () => void
  onPlay: () => void
}

export function StartStep({ startingIds, tacticState, matchWeatherData, useLiveMode, lineupError, onSetLiveMode, onBack, onPlay }: StartStepProps) {
  return (
    <div style={{ padding: '0 16px 24px' }}>
      {/* Summary */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px', marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 10 }}>Sammanfattning</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Startspelare</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>{startingIds.length} valda ✓</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Mentalitet</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{tacticState.mentality}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Tempo</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{tacticState.tempo}</span>
        </div>
      </div>

      {/* Weather */}
      {matchWeatherData && (
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 16, border: `1px solid ${matchWeatherData.effects.cancelled ? 'var(--danger)' : 'var(--border)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{getWeatherEmoji(matchWeatherData.weather.condition)}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {matchWeatherData.weather.temperature > 0 ? '+' : ''}{matchWeatherData.weather.temperature}° · {getConditionLabel(matchWeatherData.weather.condition)}
              </div>
              <div style={{ fontSize: 12, color: matchWeatherData.weather.iceQuality === 'poor' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                {getIceQualityLabel(matchWeatherData.weather.iceQuality)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live / Snabbsim toggle */}
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 8 }}>Spelläge</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => onSetLiveMode(true)} style={{
          flex: 1, padding: '12px 8px',
          background: useLiveMode ? 'rgba(196,122,58,0.12)' : 'var(--bg-elevated)',
          border: '2px solid ' + (useLiveMode ? 'var(--accent)' : 'var(--border)'),
          borderRadius: 'var(--radius)', cursor: 'pointer',
        }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>🎙</div>
          <div style={{ fontSize: 13, fontWeight: useLiveMode ? 700 : 500, color: useLiveMode ? 'var(--accent)' : 'var(--text-secondary)' }}>Live</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Följ händelserna</div>
        </button>
        <button onClick={() => onSetLiveMode(false)} style={{
          flex: 1, padding: '12px 8px',
          background: !useLiveMode ? 'rgba(196,122,58,0.12)' : 'var(--bg-elevated)',
          border: '2px solid ' + (!useLiveMode ? 'var(--accent)' : 'var(--border)'),
          borderRadius: 'var(--radius)', cursor: 'pointer',
        }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>⏩</div>
          <div style={{ fontSize: 13, fontWeight: !useLiveMode ? 700 : 500, color: !useLiveMode ? 'var(--accent)' : 'var(--text-secondary)' }}>Snabbsim</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Direkt resultat</div>
        </button>
      </div>

      {lineupError && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>
          {lineupError}
        </div>
      )}

      <button onClick={onBack} className="btn btn-outline" style={{
        width: '100%', padding: '12px', fontSize: 13, marginBottom: 10,
      }}>
        ← Ändra taktik
      </button>
      <button onClick={onPlay} className="btn btn-copper" style={{
        width: '100%', padding: '16px', fontSize: 17, fontWeight: 700, letterSpacing: '0.3px',
      }}>
        Lycka till! →
      </button>
    </div>
  )
}
