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
    <div style={{ padding: '0 14px 16px' }}>
      {adviceItems.length > 0 && (
        <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
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
              color: item.severity === 'danger' ? 'var(--danger)'
                : item.severity === 'warning' ? 'var(--warning)'
                : item.severity === 'positive' ? 'var(--success)'
                : 'var(--text-secondary)',
            }}>
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              <span style={{ lineHeight: 1.4 }}>{item.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Taktik-grupper i kort */}
      {(() => {
        const groups = [
          { label: '⚔️ Spelplan', keys: ['mentality', 'tempo', 'press'] },
          { label: '🏒 Bollspel', keys: ['passingRisk', 'width', 'attackingFocus'] },
          { label: '📐 Fasta situationer', keys: ['cornerStrategy', 'penaltyKillStyle'] },
        ]
        return groups.map((group, gi) => {
          const rows = tacticRows.filter(r => group.keys.includes(r.key as string))
          if (rows.length === 0) return null
          return (
            <div key={gi} className="card-sharp" style={{ marginBottom: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                {group.label}
              </p>
              {rows.map(({ label, key, options }, ri) => (
                <div key={key as string} style={{ marginBottom: ri < rows.length - 1 ? 8 : 0 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 500 }}>{label}</p>
                  <SegmentedControl
                    options={options}
                    value={tacticState[key] as string}
                    onChange={v => onChange(key, v as Tactic[typeof key])}
                    explanation={tacticExplanations[key as string]?.[tacticState[key] as string]}
                  />
                </div>
              ))}
            </div>
          )
        })
      })()}

      {cornerSpec ? (
        <div style={{
          background: 'rgba(196,122,58,0.08)', border: '1px solid rgba(196,122,58,0.2)',
          borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--accent)',
          marginTop: 4, marginBottom: 12,
        }}>
          📐 {cornerSpec.firstName} {cornerSpec.lastName} är hörnspecialist (hörnfärdighet {Math.round(cornerSpec.attributes.cornerSkill)}) — aggressiv hörnstrategi rekommenderas!
        </div>
      ) : tacticState.cornerStrategy === 'aggressive' ? (
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--warning)',
          marginTop: 4, marginBottom: 12,
        }}>
          ⚠️ Ingen hörnspecialist i startelvan — aggressiva hörnor mindre effektiva
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={onBack} className="btn btn-outline" style={{
          flex: 1, padding: '13px', fontSize: 14,
        }}>
          ← Ändra uppställning
        </button>
        <button onClick={onNext} className="btn btn-copper" style={{
          flex: 2, padding: '13px', fontSize: 15, fontWeight: 700,
        }}>
          Nästa →
        </button>
      </div>
    </div>
  )
}
