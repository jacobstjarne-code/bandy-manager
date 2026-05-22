import { useState } from 'react'
import { X } from 'lucide-react'
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
  const [years, setYears] = useState(2)

  return (
    <div onClick={onClose} className="transfers-modal-overlay">
      <div onClick={e => e.stopPropagation()} className="transfers-modal-box">
        <div className="transfers-modal-header">
          <div>
            <h3 className="transfers-modal-title">Förläng kontrakt</h3>
            <p className="transfers-modal-player-name">{player.firstName} {player.lastName}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost transfers-close-btn"><X size={16} /></button>
        </div>
        <div className="transfers-info-box" style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Nuvarande: {formatCurrency(player.salary)}/mån · kontrakt t.o.m. säsong {player.contractUntilSeason}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Lägsta acceptabelt: {formatCurrency(minSalary)}/mån
          </p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="transfers-label">Ny lön (kr/mån)</label>
          <input
            type="number"
            value={newSalary}
            onChange={e => setNewSalary(Number(e.target.value))}
            className="transfers-input"
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label className="transfers-label-lg">Antal år</label>
          <div className="transfers-year-btns">
            {[1, 2, 3].map(y => (
              <button
                key={y}
                onClick={() => setYears(y)}
                className={`btn ${years === y ? 'btn-copper' : 'btn-outline'} transfers-year-btn`}
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
          className="btn btn-copper transfers-cta-btn"
        >
          Förläng kontrakt
        </button>
      </div>
    </div>
  )
}
