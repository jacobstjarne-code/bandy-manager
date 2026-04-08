import { useState } from 'react'
import type { Player } from '../../../domain/entities/Player'
import { formatCurrency } from '../../utils/formatters'

interface RenewContractModalProps {
  player: Player
  currentSeason: number
  minSalary: number
  error?: string | null
  onClose: () => void
  onConfirm: (playerId: string, newSalary: number, years: number) => void
}

export function RenewContractModal({ player, currentSeason, minSalary, error, onClose, onConfirm }: RenewContractModalProps) {
  const [newSalary, setNewSalary] = useState(player.salary)
  const [years, setYears] = useState(1)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 430,
        margin: '0 auto',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          padding: '20px 18px 24px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, fontFamily: 'var(--font-display)' }}>Förläng kontrakt</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{player.firstName} {player.lastName}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 32, height: 32, fontSize: 16, padding: 0 }}>✕</button>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 20, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Nuvarande: {formatCurrency(player.salary)}/mån · kontrakt t.o.m. säsong {player.contractUntilSeason}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Lägsta acceptabelt: {formatCurrency(minSalary)}/mån
          </p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Ny lön (kr/mån)</label>
          <input
            type="number"
            value={newSalary}
            onChange={e => setNewSalary(Number(e.target.value))}
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 15 }}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Antal år</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3].map(y => (
              <button
                key={y}
                onClick={() => setYears(y)}
                className={`btn ${years === y ? 'btn-copper' : 'btn-outline'}`}
                style={{ flex: 1, padding: '10px', fontSize: 15, fontWeight: 600 }}
              >
                {y} år
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Nytt slutdatum: säsong {currentSeason + years}</p>
        </div>
        {error && <p style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
        <button
          onClick={() => onConfirm(player.id, newSalary, years)}
          className="btn btn-copper"
          style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 600 }}
        >
          Förläng kontrakt
        </button>
      </div>
    </div>
  )
}
