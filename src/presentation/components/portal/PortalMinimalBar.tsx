import type { DashboardCard } from './portalTypes'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface PortalMinimalBarProps {
  cards: DashboardCard[]
  game: SaveGame
}

/** Renderar 0-4 minimal-kort som en horisontell status-rad. */
export function PortalMinimalBar({ cards, game }: PortalMinimalBarProps) {
  if (cards.length === 0) return null

  return (
    <div style={{
      display: 'flex',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      marginBottom: 14,
      padding: '8px 10px',
      justifyContent: 'space-around',
    }}>
      {cards.map(card => {
        const Component = card.Component
        return <Component key={card.id} game={game} />
      })}
    </div>
  )
}
