import { useState } from 'react'
import { X } from 'lucide-react'
import type { Player } from '../../../domain/entities/Player'
import { RIVALRY_WARNING_PER_INTENSITY } from '../../../domain/data/transferResponseText'
import { formatValue } from '../../utils/formatters'
import { Overlay } from '../primitives/Overlay'
import '../../styles/ledger.css'

const PERF_DOTS = Array.from({ length: 8 })

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
    <Overlay onClose={onClose} ariaLabel={`Lägg bud på ${player.firstName} ${player.lastName}`} maxWidth={430} zIndex="var(--z-modal)" backdropPadding="20px">
      <div
        className="transfers-modal-box"
        style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div className="transfers-modal-header-sm" style={{ padding: '16px 12px 12px' }}>
          <div>
            <h3 className="transfers-modal-title">Lägg bud</h3>
            <p className="transfers-modal-player-name">{player.firstName} {player.lastName}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost transfers-close-btn"><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <div className="lf-margin" aria-hidden="true">
            {PERF_DOTS.map((_, i) => <div key={i} className="lf-perf" />)}
          </div>
          <div style={{ flex: 1, padding: '4px 12px 16px 10px' }}>
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
            <div className="transfers-form-group transfers-form-group--lg">
              <label className="transfers-label transfers-label--lg">Kontraktslängd</label>
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
          </div>
        </div>
        <button
          onClick={() => canAfford && onConfirm(player.id, offerAmount, offeredSalary, contractYears)}
          disabled={!canAfford}
          className="lf-stamp"
          style={{ cursor: canAfford ? 'pointer' : 'not-allowed', opacity: canAfford ? 1 : 0.5 }}
        >
          Lägg bud →
        </button>
      </div>
    </Overlay>
  )
}
