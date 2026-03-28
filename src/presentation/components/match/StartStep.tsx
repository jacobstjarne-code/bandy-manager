import type { Tactic } from '../../../domain/entities/Club'
import type { MatchWeather } from '../../../domain/entities/Weather'
import { getWeatherEmoji, getIceQualityLabel, getConditionLabel } from '../../../domain/services/weatherService'
import { tacticRows } from '../../utils/tacticData'

function tacticLabel(key: keyof Tactic, value: string): string {
  const row = tacticRows.find(r => r.key === key)
  const opt = row?.options.find(o => o.value === value)
  return opt?.label ?? value
}

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
      <div className="card-sharp" style={{ marginBottom: 10, padding: '12px 14px' }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>📋 Sammanfattning</p>
        {[
          { label: 'Startspelare', value: `${startingIds.length} valda ✓`, color: 'var(--success)' },
          { label: 'Mentalitet', value: tacticLabel('mentality', tacticState.mentality) },
          { label: 'Tempo', value: tacticLabel('tempo', tacticState.tempo) },
          { label: 'Press', value: tacticLabel('press', tacticState.press) },
          { label: 'Passning', value: tacticLabel('passingRisk', tacticState.passingRisk) },
          { label: 'Hörnstrategi', value: tacticLabel('cornerStrategy', tacticState.cornerStrategy) },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: row.color ?? 'var(--text-primary)' }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Weather */}
      {matchWeatherData && (
        <div className="card-sharp" style={{ marginBottom: 10, padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{getWeatherEmoji(matchWeatherData.weather.condition)}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {matchWeatherData.weather.temperature > 0 ? '+' : ''}{matchWeatherData.weather.temperature}° · {getConditionLabel(matchWeatherData.weather.condition)}
              </div>
              <div style={{ fontSize: 11, color: matchWeatherData.weather.iceQuality === 'poor' ? 'var(--danger)' : 'var(--text-muted)' }}>
                {getIceQualityLabel(matchWeatherData.weather.iceQuality)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live / Snabbsim toggle */}
      <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>🎮 Spelläge</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
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
