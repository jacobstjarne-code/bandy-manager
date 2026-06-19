import { shouldShowBurnoutMark, getBurnoutZone } from '../../../domain/services/managerProfileService'
import { BURNOUT_MARK } from '../../../domain/data/managerKaraktarText'
import type { CardRenderProps } from '../../../domain/services/portal/dashboardCardBag'

export function BurnoutMark({ game }: CardRenderProps) {
  const profile = game.managerProfile
  if (!profile) return null
  if (!shouldShowBurnoutMark(profile)) return null

  // Playtest-fynd 2: zon-tonade citat (Märkbar → Hög) i stället för en platt pool.
  // Eskaleringen följer burnoutScore; matchdagen roterar genom zonens pool så
  // varje ny visning ger en ny rad (no-repeat tills poolen cyklar).
  const zone = getBurnoutZone(profile.burnoutScore)
  if (zone === 'frisk') return null
  const quotes = BURNOUT_MARK.quotesByZone[zone]
  const helpers = BURNOUT_MARK.helpersByZone[zone]
  const round = game.currentMatchday
  const quote = quotes[round % quotes.length]
  const helper = helpers[round % helpers.length]
  const eyebrow = BURNOUT_MARK.eyebrow.replace('{manager}', `${profile.firstName} ${profile.lastName}`)

  return (
    <div className="portal-phasemark" style={{ borderColor: 'var(--danger)' }}>
      <div className="portal-phasemark-eyebrow" style={{ color: 'var(--danger)' }}>{eyebrow}</div>
      <div className="portal-phasemark-quote">"{quote}"</div>
      <div className="portal-phasemark-helper">{helper}</div>
    </div>
  )
}
