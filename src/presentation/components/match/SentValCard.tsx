import { SENT_VAL } from '../../../domain/data/matchLiveText'

/**
 * SentValCard — Spak B (SPEC-SPAK-AB B). Sent matchningsval som lever I commentary-
 * feeden (kort överst), inte overlay. All text ur SENT_VAL (matchLiveText.ts).
 * Mekaniken går via befintliga mentality-vägen (applyQuickTactic attack/defend) —
 * ingen ny matchCore-variabel. §2: push/shut speglar varandra ärligt, ingen lovar utfall.
 */
interface SentValCardProps {
  minute: number
  onPush: () => void
  onShut: () => void
}

export function SentValCard({ minute, onPush, onShut }: SentValCardProps) {
  return (
    <div className="late-card">
      <div className="late-eye">{SENT_VAL.eyebrow.replace('{minut}', String(minute))}</div>
      <div className="late-q">{SENT_VAL.question}</div>
      <div className="late-opts">
        <button className="late-opt push" onClick={onPush}>
          <div className="late-opt-t">{SENT_VAL.push.title}</div>
          <div className="late-opt-e">{SENT_VAL.push.effect}</div>
        </button>
        <button className="late-opt shut" onClick={onShut}>
          <div className="late-opt-t">{SENT_VAL.shut.title}</div>
          <div className="late-opt-e">{SENT_VAL.shut.effect}</div>
        </button>
      </div>
      <div className="late-gate">{SENT_VAL.gate}</div>
    </div>
  )
}
