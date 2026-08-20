/**
 * BatchStack — "skymtad stapel" (D1 punkt 4, dömd 2026-08-21, variant 1b:
 * docs/incoming/_arkiv-2026-08/Batch-av-tre-och-skuggkanon-D1p4-A14-2026-08-20.dc.html).
 *
 * Slår in ETT aktivt kort (children) i batch-kromet: rubrikrad ("📬 Att ta
 * ställning till" + räknare), två skymtade kanter bakom det aktiva kortet,
 * och tre punkter som visar var i stapeln spelaren är. "Beta av, inte
 * bläddra" — ingen sidled glidning, bara upp/ner.
 *
 * Renderas av PortalEventSlot BARA när getBatchSiblings (eventQueueService.ts)
 * hittar ≥1 syskon som delar triggerGroupId med det aktiva eventet. Ett
 * enskilt event (inget delat orsak) ser exakt ut som innan — ingen ny chrome.
 *
 * INGEN KONSUMENT FYLLER DENNA ÄNNU (samma mellanläge som B12 steg 2): inget
 * nuvarande konstruktionsställe sätter GameEvent.triggerGroupId, så
 * batch-läget aldrig triggas i verkligt spel förrän en generatorplats
 * medvetet taggar en samma-orsak-skur. Komponenten är byggd och testbar
 * (se PortalEventSlot.tsx), inte demonstrerad i levande data.
 */

interface Props {
  /** Antal ANDRA obesvarade kort i samma batch (inte räknat det aktiva). */
  siblingCount: number
  /** Totalt antal kort i batchen (aktivt + siblingCount), för punkterna. */
  totalInBatch: number
  children: React.ReactNode
}

export function BatchStack({ siblingCount, totalInBatch, children }: Props) {
  // Låst copy (domen): "Två till" / "En till". Sista kortet i stapeln visar
  // ingen räknartext — "Två till efter den här" har inget att räkna till.
  const counterText = siblingCount === 0 ? null : siblingCount === 1 ? 'En till' : `${siblingCount} till`
  const activeIndex = totalInBatch - 1 - siblingCount // 0-indexerad position i stapeln

  return (
    <div className="batch-stack">
      <div className="batch-stack-head">
        <span className="portal-card-eyebrow">📬 ATT TA STÄLLNING TILL</span>
        {counterText && <span className="batch-stack-counter">{counterText}</span>}
      </div>
      <div className="batch-stack-peek">
        {siblingCount >= 2 && <div className="batch-stack-sliver" />}
        {siblingCount >= 1 && <div className="batch-stack-sliver batch-stack-sliver-near" />}
        {children}
      </div>
      <div className="batch-stack-dots">
        {Array.from({ length: totalInBatch }).map((_, i) => (
          <span key={i} className={`batch-stack-dot${i === activeIndex ? ' is-active' : ''}`} />
        ))}
      </div>
    </div>
  )
}
