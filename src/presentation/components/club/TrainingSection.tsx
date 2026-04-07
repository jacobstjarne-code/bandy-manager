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
  proCount?: number
  partTimeCount?: number
  avgFlexibility?: number
}

export function TrainingSection({ focus, recentSessions, trainingInjuriesThisSeason, onChangeFocus, proCount, partTimeCount, avgFlexibility }: TrainingSectionProps) {
  const effects = getTrainingEffects(focus)

  const attrLines = Object.entries(effects.attributeBoosts)
    .map(([attr, val]) => `${attributeLabel(attr)} +${val.toFixed(2)}`)
    .join(', ')

  return (
    <SectionCard title="🏋️ Daglig träning" stagger={1}>
      {/* Current selection summary */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
        padding: '6px 10px', borderRadius: 'var(--radius-sm)',
        background: 'rgba(196,122,58,0.08)', border: '1px solid rgba(196,122,58,0.2)',
      }}>
        <span style={{ fontSize: 18 }}>{trainingTypeEmoji(focus.type)}</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
            {trainingTypeLabel(focus.type)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
            · {trainingIntensityLabel(focus.intensity)}
          </span>
        </div>
        <span style={{ fontSize: 10, color: INTENSITY_COLOR[focus.intensity], fontWeight: 600 }}>
          {INTENSITY_TOOLTIP[focus.intensity]}
        </span>
      </div>

      {/* Step 1: Choose training type */}
      <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
        TRÄNINGSOMRÅDE
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {TRAINING_TYPES.map(type => {
          const isActive = focus.type === type
          return (
            <button
              key={type}
              onClick={() => onChangeFocus({ type, intensity: focus.intensity })}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 8px', borderRadius: 6,
                background: isActive ? 'rgba(196,122,58,0.15)' : 'var(--bg-elevated)',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 11, fontWeight: isActive ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 13 }}>{trainingTypeEmoji(type)}</span>
              {trainingTypeLabel(type)}
            </button>
          )
        })}
      </div>

      {/* Step 2: Choose intensity */}
      <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
        INTENSITET
      </p>
      <div style={{ display: 'flex', gap: 3, background: 'var(--bg)', borderRadius: 8, padding: 3, marginBottom: 8 }}>
        {TRAINING_INTENSITIES.map(intensity => {
          const active = focus.intensity === intensity
          const color = INTENSITY_COLOR[intensity]
          return (
            <button
              key={intensity}
              onClick={() => onChangeFocus({ type: focus.type, intensity })}
              style={{
                flex: 1, padding: '7px 4px', borderRadius: 6,
                background: active ? `${color}22` : 'transparent',
                border: active ? `1px solid ${color}` : '1px solid transparent',
                color: active ? color : 'var(--text-muted)',
                fontSize: 11, fontWeight: active ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              {trainingIntensityLabel(intensity)}
            </button>
          )
        })}
      </div>

      {/* Effects summary */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '8px 14px',
        marginBottom: (recentSessions && recentSessions.length > 0) ? 8 : 0,
      }}>
        {attrLines ? (
          <p style={{ fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Tränar: </span>{attrLines}
          </p>
        ) : (
          <p style={{ fontSize: 12, marginBottom: 4, color: 'var(--text-muted)' }}>Ingen attributträning</p>
        )}
        <p style={{ fontSize: 12 }}>
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
        </p>
      </div>

      {/* Job impact */}
      {partTimeCount != null && partTimeCount > 0 && (
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '8px 14px', marginBottom: 8,
          fontSize: 11, color: 'var(--text-secondary)',
        }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>👷 </span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{proCount ?? 0}</span> heltid · {' '}
          <span style={{ fontWeight: 600 }}>{partTimeCount}</span> deltid
          {avgFlexibility != null && <span style={{ color: 'var(--text-muted)' }}> (flex {avgFlexibility}%)</span>}
          {avgFlexibility != null && avgFlexibility < 65 && (
            <span style={{ color: 'var(--danger)' }}> — sämre träningseffekt</span>
          )}
        </div>
      )}

      {/* Recent sessions */}
      {recentSessions && recentSessions.length > 0 && (
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontSize: 11, color: 'var(--text-secondary)',
        }}>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>Senaste</p>
          {recentSessions.map((session, i) => (
            <p key={i} style={{ marginBottom: i < recentSessions.length - 1 ? 3 : 0 }}>
              Omg {session.roundNumber}: {trainingTypeLabel(session.focus.type)} ({trainingIntensityLabel(session.focus.intensity)})
              {session.injuryCount === 0
                ? <span style={{ color: 'var(--text-muted)' }}> — ok</span>
                : <span style={{ color: 'var(--warning)' }}> — ⚠️ {session.injuryCount} skada{session.injuryCount > 1 ? 'r' : ''}</span>}
            </p>
          ))}
        </div>
      )}

      {/* Training injuries this season */}
      <div style={{
        background: trainingInjuriesThisSeason > 0 ? 'rgba(176,80,64,0.06)' : 'var(--bg-elevated)',
        border: `1px solid ${trainingInjuriesThisSeason > 0 ? 'rgba(176,80,64,0.25)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)', padding: '6px 14px', marginTop: 6,
        fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color: 'var(--text-muted)' }}>Träningsskador denna säsong</span>
        <span style={{ fontWeight: 600, color: trainingInjuriesThisSeason > 0 ? 'var(--danger)' : 'var(--success)' }}>
          {trainingInjuriesThisSeason === 0 ? 'Inga' : `${trainingInjuriesThisSeason} st`}
        </span>
      </div>
    </SectionCard>
  )
}
