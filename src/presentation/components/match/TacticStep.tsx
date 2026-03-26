import type { Tactic } from '../../../domain/entities/Club'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { MatchWeather } from '../../../domain/entities/Weather'
import { PlayerArchetype } from '../../../domain/enums'
import { SegmentedControl } from '../SegmentedControl'
import { tacticRows, tacticExplanations } from '../../utils/tacticData'
import { getDetailedWeatherAdvice } from '../../utils/weatherAdvice'

interface TacticStepProps {
  tacticState: Tactic
  matchWeatherData: MatchWeather | undefined
  startingIds: string[]
  game: SaveGame
  onChange: <K extends keyof Tactic>(key: K, value: Tactic[K]) => void
  onBack: () => void
  onNext: () => void
}

export function TacticStep({ tacticState, matchWeatherData, startingIds, game, onChange, onBack, onNext }: TacticStepProps) {
  const adviceItems = getDetailedWeatherAdvice(matchWeatherData, tacticState)

  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const cornerSpec = managedPlayers.find(
    p => p.archetype === PlayerArchetype.CornerSpecialist && startingIds.includes(p.id)
  )

  return (
    <div style={{ padding: '0 16px 24px' }}>
      {adviceItems.length > 0 && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {adviceItems.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px',
              background: item.severity === 'danger' ? 'rgba(239,68,68,0.08)'
                : item.severity === 'warning' ? 'rgba(245,158,11,0.08)'
                : item.severity === 'positive' ? 'rgba(34,197,94,0.06)'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${item.severity === 'danger' ? 'rgba(239,68,68,0.25)'
                : item.severity === 'warning' ? 'rgba(245,158,11,0.25)'
                : item.severity === 'positive' ? 'rgba(34,197,94,0.2)'
                : 'var(--border)'}`,
              borderRadius: 8, fontSize: 12,
              color: item.severity === 'danger' ? '#ef4444'
                : item.severity === 'warning' ? '#f59e0b'
                : item.severity === 'positive' ? '#22c55e'
                : 'var(--text-secondary)',
            }}>
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              <span style={{ lineHeight: 1.4 }}>{item.text}</span>
            </div>
          ))}
        </div>
      )}

      {tacticRows.map(({ label, key, options }) => (
        <div key={key as string} style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
          <SegmentedControl
            options={options}
            value={tacticState[key] as string}
            onChange={v => onChange(key, v as Tactic[typeof key])}
            explanation={tacticExplanations[key as string]?.[tacticState[key] as string]}
          />
        </div>
      ))}

      {cornerSpec ? (
        <div style={{
          background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#C9A84C',
          marginTop: 4, marginBottom: 12,
        }}>
          📐 {cornerSpec.firstName} {cornerSpec.lastName} är hörnspecialist (hörnfärdighet {cornerSpec.attributes.cornerSkill}) — aggressiv hörnstrategi rekommenderas!
        </div>
      ) : tacticState.cornerStrategy === 'aggressive' ? (
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#f59e0b',
          marginTop: 4, marginBottom: 12,
        }}>
          ⚠️ Ingen hörnspecialist i startelvan — aggressiva hörnor mindre effektiva
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={onBack} style={{
          flex: 1, padding: '13px', background: 'var(--bg-elevated)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
        }}>
          ← Tillbaka
        </button>
        <button onClick={onNext} style={{
          flex: 2, padding: '13px', background: 'var(--accent)',
          border: 'none', borderRadius: 'var(--radius)',
          color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}>
          Nästa →
        </button>
      </div>
    </div>
  )
}
