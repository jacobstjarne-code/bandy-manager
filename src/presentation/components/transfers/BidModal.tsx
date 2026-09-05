import { useState } from 'react'
import { X } from 'lucide-react'
import type { Player } from '../../../domain/entities/Player'
import { RIVALRY_WARNING_PER_INTENSITY } from '../../../domain/data/transferResponseText'
import { formatValue } from '../../utils/formatters'
import { Overlay } from '../primitives/Overlay'
import {
  getRequiredContractSalary,
  HOUSING_CLUB_COST_MONTHLY_KR,
  type ContractTermKey,
  type ContractTermOffer,
} from '../../../domain/services/contractNegotiationService'
import { contractTermSummaryText } from '../../../domain/data/contractTermText'
import { ContractTermChips } from './ContractTermChips'
import '../../styles/match-flow.css'

const PERF_DOTS = Array.from({ length: 8 })

interface BidModalProps {
  player: Player
  managedClub: { transferBudget: number; finances: number }
  onClose: () => void
  onConfirm: (playerId: string, offerAmount: number, offeredSalary: number, contractYears: number, terms: ContractTermOffer) => void
  rivalry?: { name: string; intensity: number } | null
  mode?: 'transfer' | 'freeAgent'
  salaryRange?: { min: number; max: number }
  availableTransferBudget?: number
  // C-T8 (SPEC_FORHANDLING_TERMER_2026-09-04) §5 — bara friagent-läget: bud
  // på en annan klubbs spelare (transfer) rör sig genom playerAcceptsTransfer,
  // en helt separat mekanik som inte konsulterar termer, se
  // contractNegotiationService.ts.
  availableTerms?: ContractTermKey[]
  jobGuaranteeSponsor?: { id: string; name: string }
  imageRightsSponsor?: { id: string; name: string }
  minSalary?: number
}

export function BidModal({
  player, managedClub, onClose, onConfirm, rivalry, mode = 'transfer', salaryRange, availableTransferBudget,
  availableTerms = [], jobGuaranteeSponsor, imageRightsSponsor, minSalary,
}: BidModalProps) {
  const isFreeAgent = mode === 'freeAgent'
  const suggestedBid = Math.round((player.marketValue || 50000) / 5000) * 5000
  const [offerAmount, setOfferAmount] = useState(isFreeAgent ? 0 : suggestedBid)
  const [offeredSalary, setOfferedSalary] = useState(
    isFreeAgent && salaryRange ? salaryRange.max : Math.round(player.salary / 500) * 500,
  )
  const [contractYears, setContractYears] = useState(3)
  const [terms, setTerms] = useState<ContractTermOffer>({})
  const availableBudget = availableTransferBudget ?? managedClub.transferBudget
  const canAfford = isFreeAgent || (availableBudget >= offerAmount && managedClub.finances - offerAmount >= -100000)
  const requiredSalary = isFreeAgent && minSalary !== undefined ? getRequiredContractSalary(player, minSalary, contractYears) : 0

  return (
    <Overlay onClose={onClose} ariaLabel={`${isFreeAgent ? 'Värva' : 'Lägg bud på'} ${player.firstName} ${player.lastName}`} maxWidth={430} zIndex="var(--z-modal)" backdropPadding="20px">
      <div className="transfers-modal-box transfers-modal-shell">
        <div className="transfers-modal-header-sm transfers-modal-header-pad">
          <div>
            <h3 className="transfers-modal-title">{isFreeAgent ? 'Värva' : 'Lägg bud'}</h3>
            <p className="transfers-modal-player-name">{player.firstName} {player.lastName}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost transfers-close-btn"><X size={16} /></button>
        </div>
        <div className="transfers-modal-body">
          <div className="mf-margin" aria-hidden="true">
            {PERF_DOTS.map((_, i) => <div key={i} className="mf-perf" />)}
          </div>
          <div className="transfers-modal-content">
            <div className="transfers-info-box">
              {isFreeAgent && salaryRange
                ? `Lönekrav: ${Math.round(salaryRange.min / 1000)}–${Math.round(salaryRange.max / 1000)} tkr/mån`
                : `Marknadsvärde: ${formatValue(player.marketValue ?? 0)} · Tillgängligt: ${formatValue(availableBudget)}`}
            </div>
            {!isFreeAgent && (
              <div className="transfers-form-group">
                <label className="transfers-label">Budsumma (kr)</label>
                <input type="number" value={offerAmount} onChange={e => setOfferAmount(Number(e.target.value))} step={5000}
                  className="transfers-input" />
              </div>
            )}
            <div className="transfers-form-group">
              {/* B3 (Designgranskning fresh-eyes 2026-09-03): fältet visade rå
                  kr, DS §11 säger löner alltid tkr/mån (samma fix som
                  RenewContractModal.tsx). offeredSalary hålls fortfarande i kr
                  internt (samma enhet onConfirm förväntar), bara in/ut-
                  konverteringen är i tkr. */}
              <label className="transfers-label">Erbjuden lön (tkr/mån)</label>
              <input type="number" value={Math.round(offeredSalary / 1000)} onChange={e => setOfferedSalary(Number(e.target.value) * 1000)} step={1}
                className="transfers-input" />
            </div>
            <div className="transfers-form-group transfers-form-group--lg">
              <label className="transfers-label transfers-label--lg">Kontraktslängd</label>
              <div className="transfers-year-btns">
                {[1, 2, 3].map(y => (
                  <button
                    key={y}
                    onClick={() => setContractYears(y)}
                    className={`btn ${contractYears === y ? 'btn-primary' : 'btn-outline'} transfers-year-btn`}
                  >
                    {y} år
                  </button>
                ))}
              </div>
            </div>
            {isFreeAgent && (
              <>
                <ContractTermChips
                  availableTerms={availableTerms}
                  terms={terms}
                  onChange={setTerms}
                  requiredSalary={requiredSalary}
                  jobGuaranteeSponsor={jobGuaranteeSponsor}
                  imageRightsSponsor={imageRightsSponsor}
                />
                <p className="transfers-term-summary">
                  {contractTermSummaryText(offeredSalary, terms.housing ? HOUSING_CLUB_COST_MONTHLY_KR : 0, terms.signOnKr ?? 0)}
                </p>
              </>
            )}
            {!isFreeAgent && rivalry && (
              <div className="transfers-rivalry-warning">
                {(() => {
                  const pool = RIVALRY_WARNING_PER_INTENSITY[rivalry.intensity as 1 | 2 | 3]
                  return pool ? pool[0] : null
                })()}
              </div>
            )}
            {!isFreeAgent && availableBudget < offerAmount && <p className="transfers-error-text">Otillräcklig tillgänglig transferbudget</p>}
            {!isFreeAgent && availableBudget >= offerAmount && managedClub.finances - offerAmount < -100000 && <p className="transfers-error-text">Budet skulle föra kassan under −100 tkr</p>}
          </div>
        </div>
        <button
          onClick={() => canAfford && onConfirm(player.id, offerAmount, offeredSalary, contractYears, terms)}
          disabled={!canAfford}
          className="mf-stamp"
        >
          {isFreeAgent ? 'Värva →' : 'Lägg bud →'}
        </button>
      </div>
    </Overlay>
  )
}
