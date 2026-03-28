import { useState } from 'react'
import type { Player } from '../../../domain/entities/Player'

interface SubstitutionModalProps {
  starters: Player[]
  bench: Player[]
  onConfirm: (outId: string, inId: string) => void
  onClose: () => void
}

export function SubstitutionModal({ starters, bench, onConfirm, onClose }: SubstitutionModalProps) {
  const [outId, setOutId] = useState<string | null>(null)
  const availableBench = bench.filter(p => !p.isInjured && (p.suspensionGamesRemaining ?? 0) <= 0)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(14,13,11,0.96)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', zIndex: 600, padding: '24px 16px',
    }}>
      <div style={{
        background: 'var(--bg-dark-surface)', border: '1px solid rgba(196,186,168,0.15)',
        borderRadius: 16, padding: '24px', width: '100%', maxWidth: 380,
        maxHeight: '80vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-light)' }}>
            {outId ? 'Välj in-spelare' : 'Välj ut-spelare'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(245,241,235,0.35)', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        {!outId ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {starters.map(p => (
              <button key={p.id} onClick={() => setOutId(p.id)} style={{
                background: 'var(--bg-dark-surface)', border: '1px solid rgba(196,186,168,0.15)', borderRadius: 8,
                padding: '10px 12px', color: 'var(--text-light)', fontSize: 13,
                textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
              }}>
                <span>{p.firstName} {p.lastName}</span>
                <span style={{ color: p.fitness < 40 ? 'var(--danger)' : 'rgba(245,241,235,0.35)', fontSize: 11 }}>Fitness {p.fitness}</span>
              </button>
            ))}
          </div>
        ) : availableBench.length === 0 ? (
          <p style={{ color: 'rgba(245,241,235,0.35)', fontSize: 13 }}>Ingen tillgänglig på bänken.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {availableBench.map(p => (
              <button key={p.id} onClick={() => onConfirm(outId, p.id)} style={{
                background: 'var(--bg-dark-surface)', border: '1px solid rgba(196,122,58,0.3)', borderRadius: 8,
                padding: '10px 12px', color: 'var(--text-light)', fontSize: 13,
                textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
              }}>
                <span>{p.firstName} {p.lastName}</span>
                <span style={{ color: 'var(--accent)', fontSize: 11 }}>Sharpness {p.sharpness}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
