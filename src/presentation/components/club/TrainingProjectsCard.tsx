import type { TrainingProject } from '../../../domain/entities/Training'
import { PROJECT_DEFINITIONS } from '../../../domain/services/trainingProjectService'
import { SectionCard } from '../SectionCard'

const RISK_LABEL: Record<string, string> = {
  none: 'Ingen', low: 'Låg', medium: 'Medel', high: 'Hög',
}
const RISK_COLOR: Record<string, string> = {
  none: 'var(--success)', low: 'var(--success)', medium: 'var(--warning)', high: 'var(--danger)',
}

interface TrainingProjectsCardProps {
  projects: TrainingProject[]
  onStart: (type: string, intensity: 'normal' | 'hard') => void
  onCancel: (id: string) => void
}

export function TrainingProjectsCard({ projects, onStart, onCancel }: TrainingProjectsCardProps) {
  const active = projects.filter(p => p.status === 'active')
  const recent = projects.filter(p => p.status === 'completed').slice(-2)
  const freeSlots = 3 - active.length

  return (
    <SectionCard title="⚡ Träningsprojekt" stagger={2}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
        Riktade insatser som ger <strong>snabbare utveckling</strong> inom ett specifikt område.
      </p>

      {/* Active projects */}
      {active.map(p => {
        const def = PROJECT_DEFINITIONS.find(d => d.type === p.type)
        if (!def) return null
        const progress = (p.roundsTotal - p.roundsRemaining) / p.roundsTotal
        return (
          <div key={p.id} style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            marginBottom: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{def.emoji} {def.label}</span>
              <button
                onClick={() => onCancel(p.id)}
                style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Avbryt
              </button>
            </div>
            {/* Progress bar */}
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${progress * 100}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
              <span>{def.effectDescription}</span>
              <span>{p.roundsRemaining} omg kvar · {p.intensity === 'hard' ? '⚡ Intensiv' : 'Normal'}</span>
            </div>
          </div>
        )
      })}

      {/* Recent completed */}
      {recent.map(p => {
        const def = PROJECT_DEFINITIONS.find(d => d.type === p.type)
        if (!def) return null
        return (
          <div key={p.id} style={{
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            marginBottom: 8,
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}>
            ✓ {def.emoji} {def.label} klar · {def.effectDescription}
            {(p.injuredPlayerIds?.length ?? 0) > 0 && (
              <span style={{ color: 'var(--warning)' }}> · ⚠️ {p.injuredPlayerIds!.length} skadad</span>
            )}
          </div>
        )
      })}

      {/* Available projects — compact rows */}
      {freeSlots > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {PROJECT_DEFINITIONS.map(def => {
            const alreadyActive = active.some(p => p.type === def.type)
            if (alreadyActive) return null
            return (
              <div key={def.type} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                borderTop: '1px solid var(--border)',
                padding: '8px 0',
              }}>
                <span style={{ fontWeight: 700, fontSize: 13, flex: 1, minWidth: 0 }}>{def.emoji} {def.label}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                  <button
                    className="btn btn-copper"
                    onClick={() => onStart(def.type, 'normal')}
                    style={{ fontSize: 11, padding: '3px 8px' }}
                  >
                    Starta · {def.roundsNormal} omg
                  </button>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => onStart(def.type, 'hard')}
                      style={{ fontSize: 11, padding: '3px 8px', color: 'var(--danger)' }}
                    >
                      ⚡ {def.roundsHard} omg
                    </button>
                    <span style={{ fontSize: 10, color: RISK_COLOR[def.injuryRisk] }}>
                      {RISK_LABEL[def.injuryRisk]}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}
