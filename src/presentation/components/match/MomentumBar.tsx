import type { MatchStep } from '../../../domain/services/matchSimulator'
import { BRYTPUNKT } from '../../../domain/data/matchLiveText'

/**
 * MomentumBar — ÄRLIG mot motortillståndet (DESIGN-BRIEF-MOTORKANSLA §2/§4.1).
 *
 * Nålen = `homeInitiative` (motorns reella initiativ-andel, som redan väger in post-paus-
 * urgency, kvitterings-momentum och alla multiplikatorer). INTE skott-proxyn momentumDiff.
 * Därför är de tre tvingande beteendena ärliga *by construction*:
 *  - 2H-avspark: jagande lagets urgency höjer dess homeWeight → nålen glider dit.
 *  - Kvittering: motorn nollar inte → homeInitiative håller kvar → nålen stannar (ingen 50/50-reset).
 *  - Sent: bandet (volatilitet) vidgas ur lateFactor + matchProfile — inte ur tick-historik.
 * Brytpunkts-etiketterna (§4.1-copy) speglar aktiv motordynamik, inte dekoration.
 */
interface MomentumBarProps {
  step: MatchStep
  homeShort: string
  awayShort: string
  history?: number[] // homeInitiative per visat steg (0..1) — kadens, inte proxy
}

// matchProfile → bandets bas-bredd (%): matchens inneboende öppenhet (namngiven motorvariabel)
const PROFILE_BAND_BASE: Record<string, number> = {
  defensive_battle: 5, standard: 9, open_game: 15, chaotic: 22,
}

export function MomentumBar({ step, homeShort, awayShort, history = [] }: MomentumBarProps) {
  const init = step.homeInitiative ?? 0.5
  const pct = Math.max(2, Math.min(98, init * 100))

  // Volatilitetsband: bredd ur lateFactor (det reella som vidgar sen utfallsvarians) + profil-bas.
  const bandBase = PROFILE_BAND_BASE[step.matchProfile ?? 'standard'] ?? 9
  const bandW = Math.min(64, bandBase + (step.lateFactor ?? 0) * 32)
  const bandLeft = Math.max(0, Math.min(100 - bandW, pct - bandW / 2))

  // Brytpunkt — ärlig: visas medan respektive motordynamik faktiskt är aktiv.
  // Copy ur BRYTPUNKT (Opus, matchLiveText.ts), {lag} interpolerat. Ingen variabel-tag.
  const chasing = step.homeScore < step.awayScore ? homeShort
    : step.awayScore < step.homeScore ? awayShort : null
  const equalizerShort = step.postEqualizerTeam === 'home' ? homeShort
    : step.postEqualizerTeam === 'away' ? awayShort : null
  const bp: { variant: string; icon: string; text: string } | null =
    (step.postEqualizerMomentum ?? 0) > 0 && equalizerShort
      ? { variant: 'amber', icon: '⟳', text: BRYTPUNKT.kvittering.replace('{lag}', equalizerShort) }
      : (step.postBreakUrgency ?? 0) > 0 && chasing
        ? { variant: 'accent', icon: '▲', text: BRYTPUNKT.postPaus.replace('{lag}', chasing) }
        : (step.lateFactor ?? 0) >= 0.34
          ? { variant: 'steel', icon: '◇', text: BRYTPUNKT.sent }
          : null

  // Liten kadens-historik (homeInitiative över tid) — strukturen, inte bruset.
  const hist = history.slice(-40)
  const histPts = hist.length >= 2
    ? hist.map((v, i) => `${(i / (hist.length - 1)) * 100},${(1 - Math.max(0, Math.min(1, v))) * 36 + 1}`).join(' ')
    : ''

  return (
    <div className="mbar-wrap">
      <div className="mbar-teams">
        <span className="h">{homeShort}</span>
        <span className="score">{step.homeScore}–{step.awayScore} <span className="min">{step.minute}'</span></span>
        <span className="a">{awayShort}</span>
      </div>
      <div className="mbar">
        <div className="mbar-fill" style={{ width: `${pct}%` }} />
        <div className="mbar-band" style={{ left: `${bandLeft}%`, width: `${bandW}%` }} />
        <div className="mbar-center" />
        <div className="mbar-needle" style={{ left: `${pct}%` }} />
      </div>
      {histPts && (
        <div className="mhist">
          <div className="mhist-axis" />
          <svg viewBox="0 0 100 38" preserveAspectRatio="none">
            <polyline points={histPts} fill="none" stroke="var(--accent)" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      )}
      {bp && (
        <div className={`bp ${bp.variant}`}>
          <span className="bp-icon">{bp.icon}</span>
          <span className="bp-txt">{bp.text}</span>
        </div>
      )}
    </div>
  )
}
