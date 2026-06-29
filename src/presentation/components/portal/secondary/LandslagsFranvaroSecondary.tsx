import type { CardRenderProps } from '../portalTypes'
import { ABSENCE_SECONDARY_LINES } from '../../../../domain/data/landslagText'

export function LandslagsFranvaroSecondary({ game }: CardRenderProps) {
  const camp = game.activeNationalTeamCamp
  if (!camp) return null

  const absentPlayers = game.players.filter(p => camp.playerIds.includes(p.id))
  if (absentPlayers.length === 0) return null

  const seed = game.currentSeason * 13 + camp.startRound
  const template = ABSENCE_SECONDARY_LINES[seed % ABSENCE_SECONDARY_LINES.length]
  const firstName = absentPlayers[0]
  const nameStr = absentPlayers.length === 1
    ? `${firstName.firstName} ${firstName.lastName}`
    : absentPlayers.map(p => p.lastName).join(', ')

  const text = template
    .replace('{spelare}', nameStr)

  return (
    <div className="card-sharp" style={{ padding: '10px 12px', marginBottom: 8 }}>
      <div className="h-label" style={{ color: 'var(--cold, var(--text-muted))', marginBottom: 6 }}>
        VM-uppehåll
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
        {text}
      </p>
    </div>
  )
}
