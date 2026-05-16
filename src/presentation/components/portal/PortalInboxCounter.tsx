import { useNavigate } from 'react-router-dom'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getActiveDecisionCount } from '../../../domain/services/decisionBudgetService'

interface Props {
  game: SaveGame
}

export function PortalInboxCounter({ game }: Props) {
  const navigate = useNavigate()

  const activeCount = getActiveDecisionCount(game)
  const deferredCount = (game.deferredDecisions ?? []).length
  const inboxCount = (game.inbox ?? []).filter(i => !i.isRead).length

  const parts: Array<React.ReactNode> = []

  if (activeCount > 0) {
    parts.push(<><strong>{activeCount}</strong> aktiv{activeCount === 1 ? '' : 'a'}</>)
  }
  if (deferredCount > 0) {
    parts.push(<><strong>{deferredCount}</strong> i kö</>)
  }
  if (inboxCount > 0) {
    parts.push(<><strong>{inboxCount}</strong> notis{inboxCount === 1 ? '' : 'er'} i inboxen</>)
  }

  if (parts.length === 0) return null

  return (
    <div
      className="portal-inbox-row"
      onClick={() => navigate('/game/inbox')}
    >
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && <span className="portal-inbox-sep">·</span>}
          {part}
        </span>
      ))}
    </div>
  )
}
