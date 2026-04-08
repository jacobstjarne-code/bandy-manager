import type { SaveGame } from '../../../domain/entities/SaveGame'
import { generateBriefing } from '../../../domain/services/dailyBriefingService'

export function DailyBriefing({ game }: { game: SaveGame }) {
  const briefing = generateBriefing(game)
  if (!briefing) return null
  return (
    <div className="card-round" style={{ margin: '0 0 6px', padding: '8px 12px' }}>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, fontFamily: 'var(--font-body)', margin: 0 }}>
        {briefing.text}
      </p>
    </div>
  )
}
