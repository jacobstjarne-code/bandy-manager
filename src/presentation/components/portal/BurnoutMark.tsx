import { shouldShowBurnoutMark, getBurnoutZone, getManagerDisplayName } from '../../../domain/services/managerProfileService'
import { BURNOUT_MARK } from '../../../domain/data/managerKaraktarText'
import { pickBurnoutQuoteIndex, pickBurnoutHelperIndex } from '../../../domain/services/burnoutReliefService'
import type { CardRenderProps } from '../../../domain/services/portal/dashboardCardBag'

export function BurnoutMark({ game }: CardRenderProps) {
  const profile = game.managerProfile
  if (!profile) return null
  if (!shouldShowBurnoutMark(profile)) return null

  // A-H4a (SEXSÄSONGSAUDITEN 2026-08-26, docs/incoming/BANDY_MANAGER_AUDIT_
  // 6_SASONGER_2026-08-26.md #H4): den gamla `round % quotes.length` var
  // exakt den "platta pool"-lösning managerKaraktarText.ts:s egen kommentar
  // (rad 38-40) redan flaggade som en fallback som skulle migreras — en
  // envis burnout-zon (många omgångar i rad) fick den lilla poolen (5/2
  // rader) att cykla och kännas som tapet. pickBurnoutQuoteIndex/
  // pickBurnoutHelperIndex läser narrativeBeatLog och undviker rader som
  // redan visats DENNA säsong. Skrivsidan: roundProcessor.ts, samma
  // omgång som burnoutScore uppdateras.
  const zone = getBurnoutZone(profile.burnoutScore)
  if (zone === 'frisk') return null
  const quotes = BURNOUT_MARK.quotesByZone[zone]
  const helpers = BURNOUT_MARK.helpersByZone[zone]
  const quoteIdx = pickBurnoutQuoteIndex(game, zone, quotes.length)
  const helperIdx = pickBurnoutHelperIndex(game, zone, helpers.length)
  const quote = quotes[quoteIdx]
  const helper = helpers[helperIdx]
  const eyebrow = BURNOUT_MARK.eyebrow.replace('{manager}', getManagerDisplayName(game))

  return (
    <div className="portal-phasemark" style={{ borderColor: 'var(--danger)' }}>
      <div className="portal-phasemark-eyebrow" style={{ color: 'var(--danger)' }}>{eyebrow}</div>
      <div className="portal-phasemark-quote">"{quote}"</div>
      <div className="portal-phasemark-helper">{helper}</div>
    </div>
  )
}
