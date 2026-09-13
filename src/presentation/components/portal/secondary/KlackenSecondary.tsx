import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import { getKlackDisplay } from '../../../../domain/services/klackPresenter'

/** Secondary-kort: klackens stämning inför hemmamatch. */
export function KlackenSecondary({ game }: CardRenderProps) {
  const navigate = useNavigate()

  // Efterklangen måste läsa samma kanoniska tidsaxel som resolvern skriver.
  // Nästa fixtures matchday kan hoppa över cup-/kalenderluckor och förbruka
  // hela uppföljningsfönstret innan kortet ens fått visas.
  const klack = getKlackDisplay(game, game.currentMatchday)
  const sg = game.supporterGroup

  if (!sg || !klack) return null

  const moodColor = sg.mood >= 70
    ? 'var(--success)'
    : sg.mood >= 40
    ? 'var(--text-muted)'
    : 'var(--danger)'

  return (
    <div
      className="card-tap"
      style={{
        background: 'var(--bg-portal-surface)',
        borderLeft: '2px solid var(--accent)',
        padding: '10px 12px',
        marginBottom: 0,
        borderRadius: '0 6px 6px 0',
        cursor: 'pointer',
      }}
      onClick={() => navigate('/game/club', { state: { tab: 'orten', section: 'klack' } })}
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
      <div className="h-quote h-quote-light" style={{ lineHeight: 1.5 }}>
        {klack.type === 'mood' ? klack.body : klack.type === 'event' ? klack.body : (klack as { quote?: string }).quote ?? ''}
      </div>
      {klack.type === 'person' && (
        <div className="h-micro" style={{ color: 'var(--text-light-secondary)', marginTop: 3 }}>
          {klack.character.name} · {klack.role === 'leader' ? 'klackledare' : klack.role === 'veteran' ? 'veteran' : klack.role === 'youth' ? 'ung supporter' : 'familjeläktaren'}
        </div>
      )}
      <div className="h-micro" style={{ color: moodColor, marginTop: 4 }}> {/* ds-exempt: moodColor dynamisk */}
        Stämning {sg.mood} · {sg.members} medlemmar
      </div>
    </div>
  )
}
