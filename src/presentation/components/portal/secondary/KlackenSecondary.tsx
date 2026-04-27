import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import { getKlackDisplay } from '../../../../domain/services/klackPresenter'

/** Secondary-kort: klackens stämning inför hemmamatch. */
export function KlackenSecondary({ game }: CardRenderProps) {
  const navigate = useNavigate()

  const nextFixture = game.fixtures
    .filter(f => f.status === 'scheduled' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => a.matchday - b.matchday)[0] ?? null

  const currentMatchday = nextFixture?.matchday ?? 0
  const klack = getKlackDisplay(game, currentMatchday)
  const sg = game.supporterGroup

  if (!sg || !klack) return null

  const moodColor = sg.mood >= 70
    ? 'var(--success)'
    : sg.mood >= 40
    ? 'var(--text-muted)'
    : 'var(--danger)'

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderLeft: '2px solid var(--accent)',
        padding: '10px 12px',
        marginBottom: 0,
        borderRadius: '0 6px 6px 0',
        cursor: 'pointer',
        gridColumn: 'span 2',
      }}
      onClick={() => navigate('/game/club', { state: { tab: 'orten' } })}
    >
      <div style={{
        fontSize: 8,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'var(--accent)',
        fontWeight: 600,
        marginBottom: 4,
      }}>
        📯 {sg.name}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 12,
        color: 'var(--text-secondary)',
        fontStyle: 'italic',
        lineHeight: 1.5,
      }}>
        {klack.type === 'mood' ? klack.body : klack.type === 'event' ? klack.body : (klack as { quote?: string }).quote ?? ''}
      </div>
      <div style={{ fontSize: 9, color: moodColor, marginTop: 4 }}>
        mood {sg.mood} · {sg.members} medlemmar
      </div>
    </div>
  )
}
