import { useState } from 'react'
import { X } from 'lucide-react'
import type { Player } from '../../../domain/entities/Player'
import { formatSalary, formatContractUntil } from '../../utils/formatters'
import { Overlay } from '../primitives/Overlay'
import {
  getContractSalaryRange,
  getRequiredContractSalary,
  HOUSING_CLUB_COST_MONTHLY_KR,
  type ContractTermKey,
  type ContractTermOffer,
} from '../../../domain/services/contractNegotiationService'
import { contractTermSummaryText } from '../../../domain/data/contractTermText'
import { seasonSpanLabel } from '../../../domain/utils/seasonYear'
import { ContractTermChips } from './ContractTermChips'
import '../../styles/match-flow.css'

const PERF_DOTS = Array.from({ length: 8 })

interface RenewContractModalProps {
  player: Player
  currentSeason: number
  minSalary: number
  error?: string | null
  onClose: () => void
  onConfirm: (playerId: string, newSalary: number, years: number, terms: ContractTermOffer) => void
  // C-T8 (SPEC_FORHANDLING_TERMER_2026-09-04) §5 — bara de faktiskt
  // tillgängliga termerna visas; sponsornamnen slås upp av anroparen
  // (ContractsTab), som redan har hela sponsorlistan/patronen.
  availableTerms?: ContractTermKey[]
  jobGuaranteeSponsor?: { id: string; name: string }
  imageRightsSponsor?: { id: string; name: string }
}

export function RenewContractModal({
  player, currentSeason, minSalary, error, onClose, onConfirm,
  availableTerms = [], jobGuaranteeSponsor, imageRightsSponsor,
}: RenewContractModalProps) {
  const salaryRange = getContractSalaryRange(minSalary)
  // B3 (Designgranskning fresh-eyes 2026-09-03, blockerare): förvalet var
  // rått player.salary, som kan hamna UNDER minSalary om den senare stigit
  // sedan spelaren skrev sitt nuvarande kontrakt — förlängningen började då
  // som en förslagen sänkning. Max av båda garanterar "aldrig under
  // nuvarande, aldrig under lägsta accepterade".
  const [newSalary, setNewSalary] = useState(Math.max(player.salary, salaryRange.max))
  const [years, setYears] = useState(2)
  const [terms, setTerms] = useState<ContractTermOffer>({})
  const requiredSalary = getRequiredContractSalary(player, minSalary, years)

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
                Lönekrav: {formatSalary(salaryRange.min)}–{formatSalary(salaryRange.max)}
              </p>
            </div>
            <div className="transfers-form-group transfers-form-group--md">
              {/* B3 (Designgranskning fresh-eyes 2026-09-03): fältet visade rå
                  kr medan "Nuvarande"-raden ovan visar tkr/mån (DS §11: löner
                  alltid tkr/mån) — två enheter i samma kort. newSalary-staten
                  hålls fortfarande i kr internt (samma enhet som player.salary/
                  onConfirm förväntar), bara in/ut-konverteringen är i tkr. */}
              <label className="transfers-label">Ny lön (tkr/mån)</label>
              <input
                type="number"
                value={Math.round(newSalary / 1000)}
                onChange={e => setNewSalary(Number(e.target.value) * 1000)}
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
                    className={`btn ${years === y ? 'btn-primary' : 'btn-outline'} transfers-year-btn`}
                  >
                    {y} år
                  </button>
                ))}
              </div>
              <p className="transfers-contract-end">Nytt slutdatum: säsong {seasonSpanLabel(currentSeason + years)}</p>
            </div>
            <ContractTermChips
              availableTerms={availableTerms}
              terms={terms}
              onChange={setTerms}
              requiredSalary={requiredSalary}
              jobGuaranteeSponsor={jobGuaranteeSponsor}
              imageRightsSponsor={imageRightsSponsor}
            />
            <p className="transfers-term-summary">
              {contractTermSummaryText(newSalary, terms.housing ? HOUSING_CLUB_COST_MONTHLY_KR : 0, terms.signOnKr ?? 0)}
            </p>
            {error && <p className="transfers-modal-error">{error}</p>}
          </div>
        </div>
        <button
          onClick={() => onConfirm(player.id, newSalary, years, terms)}
          className="mf-stamp"
        >
          Förläng →
        </button>
      </div>
    </Overlay>
  )
}
