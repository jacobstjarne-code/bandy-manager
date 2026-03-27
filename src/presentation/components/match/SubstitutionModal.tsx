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
      position: 'fixed', inset: 0, background: 'rgba(6,14,25,0.92)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', zIndex: 600, padding: '24px 16px',
    }}>
      <div style={{
        background: '#0e1f33', border: '1px solid #1e3450',
        borderRadius: 16, padding: '24px', width: '100%', maxWidth: 380,
        maxHeight: '80vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#F0F4F8' }}>
            {outId ? 'Välj in-spelare' : 'Välj ut-spelare'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4A6080', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        {!outId ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {starters.map(p => (
              <button key={p.id} onClick={() => setOutId(p.id)} style={{
                background: '#122235', border: '1px solid #1e3450', borderRadius: 8,
                padding: '10px 12px', color: '#F0F4F8', fontSize: 13,
                textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
              }}>
                <span>{p.firstName} {p.lastName}</span>
                <span style={{ color: p.fitness < 40 ? '#ef4444' : '#4A6080', fontSize: 11 }}>Fitness {p.fitness}</span>
              </button>
            ))}
          </div>
        ) : availableBench.length === 0 ? (
          <p style={{ color: '#4A6080', fontSize: 13 }}>Ingen tillgänglig på bänken.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {availableBench.map(p => (
              <button key={p.id} onClick={() => onConfirm(outId, p.id)} style={{
                background: '#122235', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8,
                padding: '10px 12px', color: '#F0F4F8', fontSize: 13,
                textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
              }}>
                <span>{p.firstName} {p.lastName}</span>
                <span style={{ color: '#C9A84C', fontSize: 11 }}>Sharpness {p.sharpness}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
