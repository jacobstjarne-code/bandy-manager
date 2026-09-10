import { useEffect, useState } from 'react'
import '../styles/scene-seam.css'

export type SceneSeamTier = 'final' | 'semi' | 'quarter'

interface SceneSeamProps {
  tier: SceneSeamTier
  /** Den exakta CTA-texten spelaren just tryckte — spökas kvar under svepet. */
  ctaLabel: string
  /** Kallas när svepet är klart (eller direkt vid reduced-motion) — anroparen
   *  gör den faktiska navigeringen/monteringen av nästa scen. */
  onComplete: () => void
}

const SWEEP_MS = 260

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

const TIER_EYEBROW: Record<SceneSeamTier, string> = {
  final: '⬩ SM-FINAL ⬩',
  semi: '⬩ SEMIFINAL ⬩',
  quarter: '⬩ KVARTSFINAL ⬩',
}

/**
 * SceneSeam — gold-/koppar-överlämningen mellan ett primärkorts fyllda CTA
 * och nästa scens accent (DOM_POLISH_SMFINAL_SKARV_2026-09-10).
 *
 * Gold-disciplinen (R3+) tillåter aldrig två fyllda gold-ytor samtidigt. En
 * cross-fade av två redan färdiga vyer bryter mot den mitt i övergången —
 * CTA:ns fyllning och scenens accent skulle synas på skärmen på samma
 * gång. Överlämningen undviker det: fyllningen *sveper* uppåt och blir
 * stripe + eyebrow i stället för att dupliceras. Anroparen monterar
 * SceneSeam vid klick, väntar på onComplete, monterar sedan destinations-
 * scenen (som redan har sin egen accent-only gold/koppar — se
 * FinalIntroScreen.tsx) — ingen animation behöver korsa route-gränsen.
 *
 * tier="final" bär gold + illustration-plats i destinationsscenen;
 * "semi"/"quarter" bär koppar, typografiskt. Skarv-mekaniken är identisk,
 * bara accentfamiljen byter (R3-graderingen).
 */
export function SceneSeam({ tier, ctaLabel, onComplete }: SceneSeamProps) {
  const [swept, setSwept] = useState(() => prefersReducedMotion())

  useEffect(() => {
    if (swept) {
      // Reduced motion: hoppa svepet, men håll gold-accent-landningen ett
      // ögonblick innan navigeringen — en instant hoppning hade lästs som
      // en osynlig flash, inte en landning.
      const timeout = window.setTimeout(onComplete, 80)
      return () => window.clearTimeout(timeout)
    }
    const raf = window.requestAnimationFrame(() => setSwept(true))
    const timeout = window.setTimeout(onComplete, SWEEP_MS)
    return () => {
      window.cancelAnimationFrame(raf)
      window.clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isGold = tier === 'final'

  return (
    <div
      className={`scene-seam ${isGold ? 'scene-seam--gold' : 'scene-seam--copper'}${swept ? ' swept' : ''}`}
      aria-hidden="true"
    >
      <p className="scene-seam__eyebrow">{TIER_EYEBROW[tier]}</p>
      <div className="scene-seam__sweep" />
      <div className="scene-seam__front" />
      <div className="scene-seam__cta-ghost">{ctaLabel}</div>
    </div>
  )
}
