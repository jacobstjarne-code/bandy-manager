import { useState } from 'react'
import { X } from 'lucide-react'
import type { Sponsor } from '../../../domain/entities/Sponsor'
import type { SponsorCounterResult } from '../../../domain/services/sponsorCounterService'
import '../../styles/ledger.css'

const PERF_DOTS = Array.from({ length: 8 })

/**
 * SponsorCounterModal — DOM_SPONSOR_MOTBUD_2026-08-31.md. Rider BidModal-
 * mönstret (domens ord): "konfigurera-sen-bekräfta" med fri Y-inmatning,
 * inte ett fördefinierat val. Öppnas av EventCardInline när choiceId==='counter'
 * fångas FÖRE resolveEvent.
 *
 * Text (titel, resultatmeddelanden, knappar) levererad av Opus 2026-09-01
 * (grind-1-sveps stale-fynd, MASTER_OPPET.md) — SVENSK TEXT-regeln
 * (CLAUDE.md): Code skriver aldrig svensk speltext.
 */

interface SponsorCounterModalProps {
  sponsor: Sponsor
  onClose: () => void
  /** Rullar tärningen, RÖR INTE game-state (se gameStore.ts:s rotorsak-
   *  kommentar för varför preview/commit är delade). */
  onPreview: (requestedWeeklyIncome: number) => SponsorCounterResult | null
  /** Applicerar det REDAN AVGJORDA utfallet — kallas när spelaren stänger
   *  modalen EFTER att ha läst slutbeskedet, inte vid inskick. */
  onCommit: (requestedWeeklyIncome: number, outcome: SponsorCounterResult['outcome']) => void
}

export function SponsorCounterModal({ sponsor, onClose, onPreview, onCommit }: SponsorCounterModalProps) {
  const suggestedAsk = Math.round((sponsor.weeklyIncome * 1.2) / 500) * 500
  const [requestedAmount, setRequestedAmount] = useState(suggestedAsk)
  const [result, setResult] = useState<SponsorCounterResult | null>(null)
  const isValid = requestedAmount > sponsor.weeklyIncome

  function handleSubmit() {
    if (!isValid) return
    const outcome = onPreview(requestedAmount)
    setResult(outcome)
  }

  function handleDismiss() {
    if (result) onCommit(requestedAmount, result.outcome)
    onClose()
  }

  return (
    <div onClick={handleDismiss} className="transfers-modal-overlay">
      <div
        onClick={e => e.stopPropagation()}
        className="transfers-modal-box"
        style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div className="transfers-modal-header-sm" style={{ padding: '16px 12px 12px' }}>
          <div>
            <h3 className="transfers-modal-title">Motbud</h3>
            <p className="transfers-modal-player-name">{sponsor.name}</p>
          </div>
          <button onClick={handleDismiss} className="btn btn-ghost transfers-close-btn"><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <div className="lf-margin" aria-hidden="true">
            {PERF_DOTS.map((_, i) => <div key={i} className="lf-perf" />)}
          </div>
          <div style={{ flex: 1, padding: '4px 12px 16px 10px' }}>
            {result ? (
              <div className="transfers-info-box">
                {result.outcome === 'accepted'
                  ? `De går med på det — ${requestedAmount.toLocaleString('sv-SE')} kr/vecka. Kontraktet skrivs om.`
                  : result.outcome === 'stood_firm'
                  ? `De står fast vid sitt bud. ${sponsor.weeklyIncome.toLocaleString('sv-SE')} kr/vecka ligger kvar — ta det eller lämna det.`
                  : 'De drar sig ur. Erbjudandet är borta.'}
              </div>
            ) : (
              <>
                <div className="transfers-info-box">
                  Ursprungserbjudande: {sponsor.weeklyIncome.toLocaleString('sv-SE')} kr/vecka · {sponsor.personality ?? 'local'}
                </div>
                <div className="transfers-form-group">
                  <label className="transfers-label">Kräv (kr/vecka)</label>
                  <input type="number" value={requestedAmount} onChange={e => setRequestedAmount(Number(e.target.value))} step={500}
                    className="transfers-input" />
                </div>
                {!isValid && <p className="transfers-error-text">Motbudet måste vara högre än ursprungserbjudandet</p>}
              </>
            )}
          </div>
        </div>
        {result ? (
          <button onClick={handleDismiss} className="lf-stamp">OK</button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="lf-stamp"
            style={{ cursor: isValid ? 'pointer' : 'not-allowed', opacity: isValid ? 1 : 0.5 }}
          >
            Skicka →
          </button>
        )}
      </div>
    </div>
  )
}
