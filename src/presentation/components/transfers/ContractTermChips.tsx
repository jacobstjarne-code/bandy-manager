import type { ContractTermKey, ContractTermOffer } from '../../../domain/services/contractNegotiationService'
import { SIGN_ON_STEP_KR } from '../../../domain/services/contractNegotiationService'
import { CONTRACT_TERM_CHIP_LABELS, contractTermChipSubtext } from '../../../domain/data/contractTermText'
import '../../styles/match-flow.css'

/**
 * SPEC_FORHANDLING_TERMER_2026-09-04 (C-T8) §5 — Villkor-raden, delad mellan
 * RenewContractModal och BidModal (freeAgent-läge): "samma resolver, samma
 * termer" (§4) betyder samma UI på båda ytorna, inte två implementationer.
 */
interface ContractTermChipsProps {
  availableTerms: ContractTermKey[]
  terms: ContractTermOffer
  onChange: (terms: ContractTermOffer) => void
  requiredSalary: number
  jobGuaranteeSponsor?: { id: string; name: string }
  imageRightsSponsor?: { id: string; name: string }
}

function isSelected(key: ContractTermKey, terms: ContractTermOffer): boolean {
  switch (key) {
    case 'signOnBonus': return !!terms.signOnKr
    case 'housing': return !!terms.housing
    case 'jobGuarantee': return !!terms.jobGuarantee
    case 'imageRights': return !!terms.imageRights
  }
}

export function ContractTermChips({
  availableTerms, terms, onChange, requiredSalary, jobGuaranteeSponsor, imageRightsSponsor,
}: ContractTermChipsProps) {
  const visibleTerms = availableTerms.filter(key =>
    key !== 'jobGuarantee' && key !== 'imageRights'
      ? true
      : key === 'jobGuarantee' ? !!jobGuaranteeSponsor : !!imageRightsSponsor
  )
  if (visibleTerms.length === 0) return null

  // §3A — steg om 10 tkr, tak 12 × required (ett årslönebelopp).
  const signOnMax = Math.max(SIGN_ON_STEP_KR, Math.round((requiredSalary * 12) / SIGN_ON_STEP_KR) * SIGN_ON_STEP_KR)

  function toggle(key: ContractTermKey) {
    const next: ContractTermOffer = { ...terms }
    switch (key) {
      case 'signOnBonus':
        if (next.signOnKr) delete next.signOnKr
        else next.signOnKr = SIGN_ON_STEP_KR
        break
      case 'housing':
        if (next.housing) delete next.housing
        else next.housing = true
        break
      case 'jobGuarantee':
        if (next.jobGuarantee) delete next.jobGuarantee
        else if (jobGuaranteeSponsor) next.jobGuarantee = { sponsorId: jobGuaranteeSponsor.id }
        break
      case 'imageRights':
        if (next.imageRights) delete next.imageRights
        else if (imageRightsSponsor) next.imageRights = { sponsorId: imageRightsSponsor.id }
        break
    }
    onChange(next)
  }

  function adjustSignOn(deltaKr: number) {
    const current = terms.signOnKr ?? SIGN_ON_STEP_KR
    const next = Math.min(signOnMax, Math.max(SIGN_ON_STEP_KR, current + deltaKr))
    onChange({ ...terms, signOnKr: next })
  }

  return (
    <div className="transfers-form-group transfers-form-group--md">
      <label className="transfers-label">Villkor</label>
      <div className="transfers-term-chips">
        {visibleTerms.map(key => (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={`btn ${isSelected(key, terms) ? 'btn-primary' : 'btn-outline'} transfers-term-chip`}
          >
            {CONTRACT_TERM_CHIP_LABELS[key]}
          </button>
        ))}
      </div>
      {visibleTerms.filter(key => isSelected(key, terms)).map(key => (
        <div key={key} className="transfers-term-subtext">
          <span>
            {contractTermChipSubtext(key, {
              signOnKr: terms.signOnKr,
              sponsorName: key === 'jobGuarantee' ? jobGuaranteeSponsor?.name : key === 'imageRights' ? imageRightsSponsor?.name : undefined,
            })}
          </span>
          {key === 'signOnBonus' && (
            <div className="transfers-term-stepper">
              <button type="button" onClick={() => adjustSignOn(-SIGN_ON_STEP_KR)} className="btn btn-outline transfers-term-stepper-btn">−</button>
              <button type="button" onClick={() => adjustSignOn(SIGN_ON_STEP_KR)} className="btn btn-outline transfers-term-stepper-btn">+</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
