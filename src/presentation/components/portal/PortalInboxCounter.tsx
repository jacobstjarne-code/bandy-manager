import { useNavigate } from 'react-router-dom'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import {
  getActiveDecisionCount,
  getWaitingDecisionCount,
} from '../../../domain/services/decisionBudgetService'

interface Props {
  game: SaveGame
}

export function PortalInboxCounter({ game }: Props) {
  const navigate = useNavigate()

  const activeCount = getActiveDecisionCount(game)
  const waitingCount = getWaitingDecisionCount(game)
  const inboxCount = (game.inbox ?? []).filter(i => !i.isRead).length

  const parts: Array<React.ReactNode> = []

  if (activeCount > 0) {
    parts.push(<><strong>{activeCount}</strong> aktiv{activeCount === 1 ? '' : 'a'}</>)
  }
  if (waitingCount > 0) {
    parts.push(<><strong>{waitingCount}</strong> beslut väntar</>)
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
