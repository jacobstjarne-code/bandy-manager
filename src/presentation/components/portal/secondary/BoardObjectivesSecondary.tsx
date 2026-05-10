import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import { BoardObjectivesList } from './BoardObjectivesList'

export function BoardObjectivesSecondary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const objectives = game.boardObjectives ?? []

  if (!objectives.some(o => o.status !== 'met')) return null

  return (
    <div style={{
      position: 'relative',
      background: 'var(--bg-portal-surface)',
      border: '1px solid rgba(196,122,58,0.15)',
      borderRadius: 8,
      padding: '14px 16px 14px 18px',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'background 0.15s, border-color 0.15s',
    }}
      onClick={() => navigate('/game/club', { state: { tab: 'orten', scrollTo: 'board-objectives' } })}
    >
      {/* Left stripe — 2px copper */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 2,
        background: 'var(--copper)',
        borderRadius: '8px 0 0 8px',
      }} />

      {/* Chevron affordance */}
      <span style={{
        position: 'absolute', right: 14, top: 14,
        color: 'var(--text-muted)', fontSize: 14, opacity: 0.5,
        lineHeight: 1,
      }}>›</span>

      {/* Eyebrow label */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9, fontWeight: 600,
        letterSpacing: '2px', textTransform: 'uppercase',
        color: 'var(--copper)', opacity: 0.85,
        marginBottom: 10,
      }}>
        Styrelsen
      </div>

      <BoardObjectivesList
        objectives={objectives}
        max={2}
      />
    </div>
  )
}
