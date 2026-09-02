import { useState } from 'react'
import { X } from 'lucide-react'
import type { Player } from '../../../domain/entities/Player'
import { formatSalary, formatContractUntil } from '../../utils/formatters'
import { Overlay } from '../primitives/Overlay'
import '../../styles/match-flow.css'

const PERF_DOTS = Array.from({ length: 8 })

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
    <Overlay onClose={onClose} ariaLabel={`Förläng kontrakt med ${player.firstName} ${player.lastName}`} maxWidth={430} zIndex="var(--z-modal)" backdropPadding="20px">
      <div className="transfers-modal-box transfers-modal-shell">
        <div className="transfers-modal-header transfers-modal-header-pad">
          <div>
            <h3 className="transfers-modal-title">Förläng kontrakt</h3>
            <p className="transfers-modal-player-name">{player.firstName} {player.lastName}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost transfers-close-btn"><X size={16} /></button>
        </div>
        <div className="transfers-modal-body">
          <div className="mf-margin" aria-hidden="true">
            {PERF_DOTS.map((_, i) => <div key={i} className="mf-perf" />)}
          </div>
          <div className="transfers-modal-content">
            <div className="transfers-info-box transfers-info-box--lg">
              <p className="transfers-info-primary">
                Nuvarande: {formatSalary(player.salary)} · kontrakt {formatContractUntil(player.contractUntilSeason)}
              </p>
              <p className="transfers-info-subtext">
                Lägsta acceptabelt: {formatSalary(minSalary)}
              </p>
            </div>
            <div className="transfers-form-group transfers-form-group--md">
              <label className="transfers-label">Ny lön (kr/mån)</label>
              <input
                type="number"
                value={newSalary}
                onChange={e => setNewSalary(Number(e.target.value))}
                className="transfers-input"
              />
            </div>
            <div className="transfers-form-group transfers-form-group--xl">
              <label className="transfers-label transfers-label--lg">Antal år</label>
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
              <p className="transfers-contract-end">Nytt slutdatum: säsong {currentSeason + years}</p>
            </div>
            {error && <p className="transfers-modal-error">{error}</p>}
          </div>
        </div>
        <button
          onClick={() => onConfirm(player.id, newSalary, years)}
          className="mf-stamp"
        >
          Förläng →
        </button>
      </div>
    </Overlay>
  )
}
