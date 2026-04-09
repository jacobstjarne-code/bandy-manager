import { useNavigate } from 'react-router-dom'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { generateBriefing } from '../../../domain/services/dailyBriefingService'

export function DailyBriefing({ game }: { game: SaveGame }) {
  const navigate = useNavigate()
  const briefing = generateBriefing(game)
  if (!briefing) return null
  const clickable = !!briefing.navigateTo
  return (
    <div
      className="card-round"
      style={{ margin: '0 0 6px', padding: '8px 12px', cursor: clickable ? 'pointer' : 'default' }}
      onClick={clickable ? () => navigate(briefing.navigateTo!.path, briefing.navigateTo!.state ? { state: briefing.navigateTo!.state } : undefined) : undefined}
    >
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, fontFamily: 'var(--font-body)', margin: 0 }}>
        {briefing.text}
        {clickable && <span style={{ color: 'var(--accent)', marginLeft: 4 }}>→</span>}
      </p>
    </div>
  )
}
