import { useState } from 'react'
import type { Player } from '../../../domain/entities/Player'
import { positionShort } from '../../utils/formatters'

interface SubstitutionModalProps {
  starters: Player[]
  bench: Player[]
  onConfirm: (outId: string, inId: string) => void
  onClose: () => void
}

function fitnessColor(f: number): string {
  if (f >= 70) return 'var(--success)'
  if (f >= 40) return 'var(--warning)'
  return 'var(--danger)'
}

export function SubstitutionModal({ starters, bench, onConfirm, onClose }: SubstitutionModalProps) {
  const [outId, setOutId] = useState<string | null>(null)
  const availableBench = bench.filter(p => !p.isInjured && (p.suspensionGamesRemaining ?? 0) <= 0)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', zIndex: 600, padding: '24px 16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px', width: '100%', maxWidth: 380,
          maxHeight: '80vh', overflowY: 'auto',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            🔄 {outId ? 'Välj in-spelare' : 'Välj ut-spelare'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        {!outId ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {starters.map(p => (
              <button key={p.id} onClick={() => setOutId(p.id)} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8,
                padding: '8px 10px', color: 'var(--text-primary)', fontSize: 13,
                textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{p.lastName}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 5 }}>{positionShort(p.position)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.round(p.currentAbility)}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: fitnessColor(p.fitness) }}>⚡ {Math.round(p.fitness)}</span>
                </div>
              </button>
            ))}
          </div>
        ) : availableBench.length === 0 ? (
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>Ingen tillgänglig på bänken.</p>
            <button onClick={() => setOutId(null)} className="btn btn-ghost" style={{ fontSize: 12 }}>← Tillbaka</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button onClick={() => setOutId(null)} style={{
              background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11,
              cursor: 'pointer', textAlign: 'left', padding: '4px 0', marginBottom: 4,
            }}>← Tillbaka</button>
            {availableBench.map(p => (
              <button key={p.id} onClick={() => onConfirm(outId, p.id)} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--accent)', borderRadius: 8,
                padding: '8px 10px', color: 'var(--text-primary)', fontSize: 13,
                textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{p.lastName}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 5 }}>{positionShort(p.position)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.round(p.currentAbility)}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: fitnessColor(p.fitness) }}>⚡ {Math.round(p.fitness)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
