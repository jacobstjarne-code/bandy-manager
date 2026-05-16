import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import { BoardObjectivesList } from './BoardObjectivesList'

export function BoardObjectivesSecondary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const objectives = game.boardObjectives ?? []

  if (!objectives.some(o => o.status !== 'met')) return null

  return (
    <div
      className="portal-secondary-card"
      onClick={() => navigate('/game/club', { state: { tab: 'orten', scrollTo: 'board-objectives' } })}
    >
      <div className="portal-card-stripe portal-card-stripe-copper-dim" />
      <span className="portal-card-chevron">›</span>
      <div className="portal-card-eyebrow">Styrelsen</div>
      <BoardObjectivesList objectives={objectives} max={2} />
    </div>
  )
}
