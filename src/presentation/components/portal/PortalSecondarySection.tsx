import type { DashboardCard } from './portalTypes'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface PortalSecondarySectionProps {
  cards: DashboardCard[]
  game: SaveGame
}

/** Renderar 0-3 secondary-kort i ett 2-kolumns grid. */
export function PortalSecondarySection({ cards, game }: PortalSecondarySectionProps) {
  if (cards.length === 0) return null

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 6,
      marginBottom: 12,
    }}>
      {cards.map(card => {
        const Component = card.Component
        return <Component key={card.id} game={game} />
      })}
    </div>
  )
}
