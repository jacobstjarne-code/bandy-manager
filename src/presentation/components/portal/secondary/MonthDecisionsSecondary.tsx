import type { CardRenderProps } from '../portalTypes'
import { selectDashboardDecisions } from '../../../../domain/services/decisionTierService'

/**
 * HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md) — det batchade
 * sekundärkortet. Domen §Visning: "Högst ETT primärt kort ... + ETT batchat
 * sekundärt (resten av månad, räknat)" och §2: "Batchas till ETT sekundärt
 * kort med räkning ('3 väntar'), inte tre likvärdiga kort."
 *
 * All text här är domens egen: rubriknivåns namn ("Denna månad", domens §2)
 * och räkneraden ("N väntar", domens ordagranna exempel). Ingen ny prosa.
 *
 * SKILT FRÅN deferred_queue-kortet (DeferredQueueSecondary): det räknar
 * `deferredDecisions` — beslut som throttlen trängt undan och som inte är
 * synliga alls. Det här räknar SYNLIGA månadsbeslut som ligger bakom det
 * primära kortet.
 */
export function MonthDecisionsSecondary({ game }: CardRenderProps) {
  const { batched } = selectDashboardDecisions(game)
  if (batched.length === 0) return null

  return (
    <div className="portal-secondary-card">
      <div className="portal-card-stripe portal-card-stripe-copper-dim" />
      <div className="portal-card-eyebrow">Denna månad</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)', lineHeight: 1.3 }}>
        {batched.length} väntar
      </div>
    </div>
  )
}
