import { TrainingType, TrainingIntensity } from '../../../domain/enums'
import {
  getTrainingEffects,
  trainingTypeLabel,
  trainingTypeEmoji,
  trainingIntensityLabel,
} from '../../../domain/services/trainingService'
import type { TrainingFocus } from '../../../domain/entities/Training'
import { attributeLabel } from '../../utils/formatters'
import { SectionCard } from '../SectionCard'

const TRAINING_TYPES = Object.values(TrainingType)
const TRAINING_INTENSITIES = [
  TrainingIntensity.Light,
  TrainingIntensity.Normal,
  TrainingIntensity.Hard,
  TrainingIntensity.Extreme,
]

const INTENSITY_COLOR: Record<TrainingIntensity, string> = {
  [TrainingIntensity.Light]:   'var(--success)',
  [TrainingIntensity.Normal]:  'var(--text-primary)',
  [TrainingIntensity.Hard]:    'var(--warning)',
  [TrainingIntensity.Extreme]: 'var(--danger)',
}

const INTENSITY_TOOLTIP: Record<TrainingIntensity, string> = {
  [TrainingIntensity.Light]:   'Låg risk, långsam utveckling',
  [TrainingIntensity.Normal]:  'Balanserat',
  [TrainingIntensity.Hard]:    'Snabb utveckling, hög skaderisk',
  [TrainingIntensity.Extreme]: 'Maximal utveckling, mycket hög skaderisk ⚠️',
}

function injuryRiskLabel(modifier: number): string {
  if (modifier <= 0.8) return 'Låg'
  if (modifier <= 1.0) return 'Normal'
  if (modifier <= 1.4) return 'Hög'
  return 'Mycket hög ⚠️'
}

function moraleLabel(n: number): string {
  if (n > 0) return `+${n}`
  if (n < 0) return `${n}`
  return 'Ingen påverkan'
}

interface TrainingSectionProps {
  focus: TrainingFocus
  recentSessions?: { roundNumber: number; focus: TrainingFocus; injuryCount: number }[]
  trainingInjuriesThisSeason: number
  onChangeFocus: (focus: TrainingFocus) => void
  proCount?: number       // number of full-time pros in squad
  partTimeCount?: number  // number of part-time players
  avgFlexibility?: number // average flexibility of part-time players
}

export function TrainingSection({ focus, recentSessions, trainingInjuriesThisSeason, onChangeFocus, proCount, partTimeCount, avgFlexibility }: TrainingSectionProps) {
  const effects = getTrainingEffects(focus)

  const attrLines = Object.entries(effects.attributeBoosts)
    .map(([attr, val]) => `${attributeLabel(attr)} +${val.toFixed(2)}`)
    .join(', ')

  return (
    <SectionCard title="🏋️ Daglig träning" stagger={1}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
        Grundträningen som sker <strong>automatiskt varje omgång</strong>.
      </p>
      {/* Type list — each row: emoji + label + intensity segmented control */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {TRAINING_TYPES.map(type => {
          const typeActive = focus.type === type
          return (
            <div
              key={type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                background: typeActive ? 'rgba(196,122,58,0.08)' : 'var(--bg-elevated)',
                border: `1px solid ${typeActive ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{trainingTypeEmoji(type)}</span>
              <span style={{
                fontSize: 12, fontWeight: 600, flexShrink: 0, minWidth: 80,
                color: typeActive ? 'var(--accent)' : 'var(--text-primary)',
              }}>
                {trainingTypeLabel(type)}
              </span>
              {/* Segmented intensity control */}
              <div style={{ display: 'flex', gap: 3, background: 'var(--bg)', borderRadius: 8, padding: 3, flex: 1 }}>
                {TRAINING_INTENSITIES.map(intensity => {
                  const active = typeActive && focus.intensity === intensity
                  const color = INTENSITY_COLOR[intensity]
                  return (
                    <button
                      key={intensity}
                      onClick={() => onChangeFocus({ type, intensity })}
                      style={{
                        flex: 1,
                        padding: '5px 2px',
                        borderRadius: 6,
                        background: active ? `${color}22` : 'transparent',
                        border: active ? `1px solid ${color}` : '1px solid transparent',
                        color: active ? color : 'var(--text-muted)',
                        fontSize: 10,
                        fontWeight: active ? 700 : 400,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {trainingIntensityLabel(intensity)}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, textAlign: 'center' }}>
        {INTENSITY_TOOLTIP[focus.intensity]}
      </p>

      {/* Effects summary */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 14px',
        marginBottom: (recentSessions && recentSessions.length > 0) ? 16 : 0,
      }}>
        {attrLines ? (
          <p style={{ fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>Tränar: </span>{attrLines}
          </p>
        ) : (
          <p style={{ fontSize: 13, marginBottom: 6, color: 'var(--text-muted)' }}>
            Ingen attributträning
          </p>
        )}
        <p style={{ fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>Kondition: </span>
          <span style={{ color: effects.fitnessChange >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {effects.fitnessChange >= 0 ? '+' : ''}{effects.fitnessChange}
          </span>
          {'  '}
          <span style={{ color: 'var(--text-muted)' }}>Skaderisk: </span>
          <span style={{ color: effects.injuryRiskModifier > 1.0 ? 'var(--warning)' : 'var(--success)' }}>
            {injuryRiskLabel(effects.injuryRiskModifier)}
          </span>
          {'  '}
          <span style={{ color: 'var(--text-muted)' }}>Moral: </span>
          <span style={{ color: effects.moraleEffect > 0 ? 'var(--success)' : effects.moraleEffect < 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
            {moraleLabel(effects.moraleEffect)}
          </span>
          {effects.sharpnessEffect > 0 && (
            <>
              {'  '}
              <span style={{ color: 'var(--text-muted)' }}>Skärpa: </span>
              <span style={{ color: 'var(--success)' }}>+{effects.sharpnessEffect}</span>
            </>
          )}
        </p>
      </div>

      {/* Job impact on training */}
      {partTimeCount != null && partTimeCount > 0 && (
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          marginBottom: 12,
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>👷 Jobbpåverkan</p>
          <p>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{proCount ?? 0}</span> heltidsproffs (full träningseffekt) · {' '}
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{partTimeCount}</span> deltidsspelare
            {avgFlexibility != null && (
              <span style={{ color: 'var(--text-muted)' }}> (snitt flex {avgFlexibility}%)</span>
            )}
          </p>
          {avgFlexibility != null && avgFlexibility < 65 && (
            <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>
              ⚠️ Låg flexibilitet — deltidsspelare får sämre träningseffekt
            </p>
          )}
        </div>
      )}

      {/* Recent sessions */}
      {recentSessions && recentSessions.length > 0 && (
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          fontSize: 12,
          color: 'var(--text-secondary)',
        }}>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>Senaste träningar</p>
          {recentSessions.map((session, i) => (
            <p key={i} style={{ marginBottom: i < recentSessions.length - 1 ? 6 : 0 }}>
              Omgång {session.roundNumber}: {trainingTypeLabel(session.focus.type)} ({trainingIntensityLabel(session.focus.intensity)})
              {session.injuryCount === 0
                ? <span style={{ color: 'var(--text-muted)' }}> — Inga skador</span>
                : <span style={{ color: 'var(--warning)' }}> — ⚠️ {session.injuryCount} skada{session.injuryCount > 1 ? 'r' : ''}</span>}
            </p>
          ))}
        </div>
      )}

      {/* Training injuries this season */}
      <div style={{
        background: trainingInjuriesThisSeason > 0 ? 'rgba(176,80,64,0.06)' : 'var(--bg-elevated)',
        border: `1px solid ${trainingInjuriesThisSeason > 0 ? 'rgba(176,80,64,0.25)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '8px 14px',
        marginTop: 8,
        fontSize: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ color: 'var(--text-muted)' }}>Träningsskador denna säsong</span>
        <span style={{ fontWeight: 600, color: trainingInjuriesThisSeason > 0 ? 'var(--danger)' : 'var(--success)' }}>
          {trainingInjuriesThisSeason === 0 ? 'Inga' : `${trainingInjuriesThisSeason} st`}
        </span>
      </div>
    </SectionCard>
  )
}
