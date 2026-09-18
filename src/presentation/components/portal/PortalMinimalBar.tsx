import type { DashboardCard } from './portalTypes'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getBoardPatienceZone } from '../../../domain/services/portal/boardPatienceZone'
import { BoardPatienceMinimal } from './minimal/BoardPatienceMinimal'

interface PortalMinimalBarProps {
  cards: DashboardCard[]
  game: SaveGame
}

/** Renderar 0-4 minimal-kort som en horisontell status-rad. */
export function PortalMinimalBar({ cards, game }: PortalMinimalBarProps) {
  if (cards.length === 0) return null
  const showBoardUltimatum = cards.some(card => card.id === 'board_patience_minimal')
    && getBoardPatienceZone(game).zone === 'ultimatum'
  const inlineCards = showBoardUltimatum
    ? cards.filter(card => card.id !== 'board_patience_minimal')
    : cards

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: showBoardUltimatum ? 10 : 0,
      background: 'var(--bg-portal-surface)',
      border: '1px solid var(--bg-leather)',
      borderRadius: 'var(--radius-md)',
      marginBottom: 14,
      padding: '8px 10px',
    }}>
      {showBoardUltimatum && (
        <div style={{
          borderLeft: '3px solid var(--danger)',
          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
          background: 'var(--bg-portal-elevated)',
          padding: '10px 12px',
        }}>
          <BoardPatienceMinimal game={game} prominent />
        </div>
      )}
      {inlineCards.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {inlineCards.map(card => {
            const Component = card.Component
            return <Component key={card.id} game={game} />
          })}
        </div>
      )}
    </div>
  )
}
