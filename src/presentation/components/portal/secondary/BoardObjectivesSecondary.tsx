import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import { BoardObjectivesList } from './BoardObjectivesList'

export function BoardObjectivesSecondary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const objectives = game.boardObjectives ?? []

  if (!objectives.some(o => o.status !== 'met')) return null

  return (
    <div style={{
      gridColumn: '1 / -1',
      background: 'var(--bg-portal-surface)',
      borderLeft: '2px solid var(--accent)',
      borderRadius: '0 8px 8px 0',
      padding: '12px 14px',
    }}>
      <div style={{
        fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase',
        color: 'var(--text-light-secondary)', fontWeight: 600,
        opacity: 0.85,
        marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 12, lineHeight: 1 }}>🎯</span>
        <span>Styrelsens krav</span>
      </div>

      <BoardObjectivesList
        objectives={objectives}
        max={2}
        onNavigate={() => navigate('/game/club', { state: { tab: 'orten', scrollTo: 'board-objectives' } })}
      />
    </div>
  )
}
