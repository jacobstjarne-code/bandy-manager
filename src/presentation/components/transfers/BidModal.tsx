import { useState } from 'react'
import { X } from 'lucide-react'
import type { Player } from '../../../domain/entities/Player'
import { RIVALRY_WARNING_PER_INTENSITY } from '../../../domain/data/transferResponseText'

function formatValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mkr`
  if (v >= 1_000) return `${Math.round(v / 1_000)} tkr`
  return `${v} kr`
}

interface BidModalProps {
  player: Player
  managedClub: { transferBudget: number; finances: number }
  onClose: () => void
  onConfirm: (playerId: string, offerAmount: number, offeredSalary: number, contractYears: number) => void
  rivalry?: { name: string; intensity: number } | null
}

export function BidModal({ player, managedClub, onClose, onConfirm, rivalry }: BidModalProps) {
  const suggestedBid = Math.round((player.marketValue || 50000) / 5000) * 5000
  const [offerAmount, setOfferAmount] = useState(suggestedBid)
  const [offeredSalary, setOfferedSalary] = useState(Math.round(player.salary / 500) * 500)
  const [contractYears, setContractYears] = useState(3)
  const canAfford = managedClub.transferBudget >= offerAmount && managedClub.finances - offerAmount >= -100000

  return (
    <div onClick={onClose} className="transfers-modal-overlay">
      <div onClick={e => e.stopPropagation()} className="transfers-modal-box">
        <div className="transfers-modal-header-sm">
          <div>
            <h3 className="transfers-modal-title">Lägg bud</h3>
            <p className="transfers-modal-player-name">{player.firstName} {player.lastName}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost transfers-close-btn"><X size={16} /></button>
        </div>
        <div className="transfers-info-box">
          Marknadsvärde: {formatValue(player.marketValue ?? 0)} · Transferbudget: {formatValue(managedClub.transferBudget)}
        </div>
        <div className="transfers-form-group">
          <label className="transfers-label">Budsumma (kr)</label>
          <input type="number" value={offerAmount} onChange={e => setOfferAmount(Number(e.target.value))} step={5000}
            className="transfers-input" />
        </div>
        <div className="transfers-form-group">
          <label className="transfers-label">Erbjuden lön (kr/mån)</label>
          <input type="number" value={offeredSalary} onChange={e => setOfferedSalary(Number(e.target.value))} step={1000}
            className="transfers-input" />
        </div>
        <div className="transfers-form-group-lg">
          <label className="transfers-label-lg">Kontraktslängd</label>
          <div className="transfers-year-btns">
            {[1, 2, 3].map(y => (
              <button
                key={y}
                onClick={() => setContractYears(y)}
                className={`btn ${contractYears === y ? 'btn-copper' : 'btn-outline'} transfers-year-btn`}
              >
                {y} år
              </button>
            ))}
          </div>
        </div>
        {rivalry && (
          <div className="transfers-rivalry-warning">
            {(() => {
              const pool = RIVALRY_WARNING_PER_INTENSITY[rivalry.intensity as 1 | 2 | 3]
              return pool ? pool[0] : null
            })()}
          </div>
        )}
        {managedClub.transferBudget < offerAmount && <p className="transfers-error-text">Otillräcklig transferbudget</p>}
        {managedClub.transferBudget >= offerAmount && managedClub.finances - offerAmount < -100000 && <p className="transfers-error-text">Budet skulle föra kassan under −100 000 kr</p>}
        <button
          onClick={() => canAfford && onConfirm(player.id, offerAmount, offeredSalary, contractYears)}
          disabled={!canAfford}
          className={`btn ${canAfford ? 'btn-copper' : 'btn-ghost'} transfers-cta-btn`}
          style={{ cursor: canAfford ? 'pointer' : 'not-allowed', opacity: canAfford ? 1 : 0.5 }}
        >
          Lägg bud
        </button>
      </div>
    </div>
  )
}
