import type { SaveGame } from '../../../domain/entities/SaveGame'
import {
  getActiveDecisionCount,
  MAX_ACTIVE_DECISIONS,
} from '../../../domain/services/decisionBudgetService'

interface Props {
  game: SaveGame
}

export function PortalActiveBudget({ game }: Props) {
  const activeCount = getActiveDecisionCount(game)
  if (activeCount === 0) return null

  const isSeason1Round1 = game.currentSeason === 1 && game.currentMatchday === 1
  const eyebrow = activeCount === 1 ? 'Veckans fråga' : 'Veckans frågor'

  return (
    <div className="portal-active-section">
      <span className="portal-active-eyebrow">{eyebrow}</span>
      <span className="portal-active-budget">
        {[...Array(MAX_ACTIVE_DECISIONS)].map((_, i) => {
          const isOn = i < activeCount
          const isLocked = !isOn && isSeason1Round1
          return (
            <span
              key={i}
              className={`portal-budget-dot ${
                isOn ? 'portal-budget-dot-on' : isLocked ? 'portal-budget-dot-locked' : 'portal-budget-dot-off'
              }`}
            />
          )
        })}
      </span>
    </div>
  )
}
