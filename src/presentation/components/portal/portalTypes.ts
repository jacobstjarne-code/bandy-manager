import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { DashboardCard } from '../../../domain/services/portal/dashboardCardBag'
import type { PlayoffSeriesContext } from '../../../domain/services/portal/playoffSeriesContext'
import type { EscalationSubState } from '../../../application/services/portalEscalationResolver'

/** Props som varje portal-kortkomponent tar emot. */
export interface CardRenderProps {
  game: SaveGame
  /** Pre-computed by PortalScreen — avoids repeated getPlayoffSeriesContext calls. */
  playoffCtx?: PlayoffSeriesContext | null
  /** Pre-computed by PortalScreen — avoids repeated getEscalationSubState calls. */
  escalationSubState?: EscalationSubState | null
}

// Re-export DashboardCard for use in presentation layer
export type { DashboardCard }
