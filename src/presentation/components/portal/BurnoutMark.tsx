import { shouldShowBurnoutMark } from '../../../domain/services/managerProfileService'
import { BURNOUT_MARK } from '../../../domain/data/managerKaraktarText'
import type { CardRenderProps } from '../../../domain/services/portal/dashboardCardBag'

export function BurnoutMark({ game }: CardRenderProps) {
  const profile = game.managerProfile
  if (!profile) return null
  if (!shouldShowBurnoutMark(profile)) return null

  const seed = game.currentSeason * 997 + game.currentMatchday * 13
  const quote = BURNOUT_MARK.quotes[seed % BURNOUT_MARK.quotes.length]
  const helper = BURNOUT_MARK.helpers[seed % BURNOUT_MARK.helpers.length]
  const eyebrow = BURNOUT_MARK.eyebrow.replace('{manager}', `${profile.firstName} ${profile.lastName}`)

  return (
    <div className="portal-phasemark" style={{ borderColor: 'var(--danger)' }}>
      <div className="portal-phasemark-eyebrow" style={{ color: 'var(--danger)' }}>{eyebrow}</div>
      <div className="portal-phasemark-quote">"{quote}"</div>
      <div className="portal-phasemark-helper">{helper}</div>
    </div>
  )
}
