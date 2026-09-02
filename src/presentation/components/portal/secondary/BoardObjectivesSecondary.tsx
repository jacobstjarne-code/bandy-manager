import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import type { BoardObjective } from '../../../../domain/entities/Community'
import { BoardObjectivesList } from './BoardObjectivesList'

/**
 * Mål i riskläge ägs av PortalObjectiveAlert på samma skärm. De ska inte
 * samtidigt dupliceras i sekundärkortet; övriga öppna mål kan fortfarande
 * använda den ordinarie kortplatsen.
 */
export function getSecondaryBoardObjectives(objectives: BoardObjective[]): BoardObjective[] {
  return objectives.filter(o => o.status !== 'at_risk')
}

export function BoardObjectivesSecondary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const objectives = getSecondaryBoardObjectives(game.boardObjectives ?? [])

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
