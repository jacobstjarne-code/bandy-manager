import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { DashboardCard } from '../../../domain/services/portal/dashboardCardBag'

/** Props som varje portal-kortkomponent tar emot. */
export interface CardRenderProps {
  game: SaveGame
}

// Re-export DashboardCard for use in presentation layer
export type { DashboardCard }
