import { useState } from 'react'
import type { FreeKickInteractionData, FreeKickOutcome, FreeKickChoice } from '../../../domain/services/freeKickInteractionService'

interface FreeKickInteractionProps {
  data: FreeKickInteractionData
  outcome: FreeKickOutcome | null
  onChoose: (choice: FreeKickChoice) => void
}

const CHOICES: { choice: FreeKickChoice; icon: string; label: string; sub: string }[] = [
  { choice: 'shoot', icon: '🥊', label: 'Skjut direkt', sub: 'Hög risk/reward' },
  { choice: 'chipPass', icon: '🪁', label: 'Lyftboll', sub: 'Hörna vid miss' },
  { choice: 'layOff', icon: '🤝', label: 'Kort frispark', sub: 'Låg risk' },
]

export function FreeKickInteraction({ data, outcome, onChoose }: FreeKickInteractionProps) {
  const [choice, setChoice] = useState<FreeKickChoice>('shoot')
  const [confirmed, setConfirmed] = useState(false)

  function handleConfirm() {
    if (confirmed) return
    setConfirmed(true)
    onChoose(choice)
  }

  return (
    <div style={{ margin: '6px 0' }}>
      <div className="card-sharp" style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            🎯 FARLIGT FRISLAG — {data.minute}:e minuten
          </p>
          <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>{data.distanceMeters}m</span>
        </div>

        <div style={{ padding: '6px 8px', background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{data.kickerName}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mur: {data.wallSize} man</span>
          </div>
        </div>

        {!outcome && (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {CHOICES.map(({ choice: c, icon, label, sub }) => (
                <button key={c} onClick={() => setChoice(c)} style={{
                  flex: 1, padding: '8px 4px',
                  background: choice === c ? 'rgba(196,122,58,0.12)' : 'var(--bg-elevated)',
                  border: `2px solid ${choice === c ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', cursor: 'pointer',
                }}>
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
                  <div style={{ fontSize: 11, fontWeight: choice === c ? 700 : 500, color: choice === c ? 'var(--accent)' : 'var(--text-secondary)' }}>{label}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{sub}</div>
                </button>
              ))}
            </div>

            <button
              onClick={handleConfirm}
              className="btn btn-copper"
              style={{ width: '100%', padding: '11px', fontSize: 13, fontWeight: 700, letterSpacing: '0.3px' }}
            >
              UTFÖRS FRISPARKEN →
            </button>
          </>
        )}

        {outcome && (
          <div style={{
            padding: '8px 10px',
            background: outcome.type === 'goal' ? 'rgba(196,122,58,0.12)' : 'var(--bg-elevated)',
            borderRadius: 4,
            borderLeft: outcome.type === 'goal' ? '3px solid var(--accent)' : 'none',
          }}>
            <p style={{ fontSize: 12, fontWeight: outcome.type === 'goal' ? 700 : 500, color: outcome.type === 'goal' ? 'var(--accent)' : 'var(--text-secondary)', margin: 0 }}>
              {outcome.description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
