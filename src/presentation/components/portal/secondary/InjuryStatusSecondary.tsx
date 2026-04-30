import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'

/** Secondary-kort: skadeläge med namn + veckor kvar per spelare. */
export function InjuryStatusSecondary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const injured = game.players
    .filter(p => p.clubId === game.managedClubId && p.isInjured)
    .sort((a, b) => b.injuryDaysRemaining - a.injuryDaysRemaining)

  if (injured.length === 0) return null

  const weeksLeft = (days: number) => {
    const w = Math.ceil(days / 7)
    return w <= 0 ? 'snart tillbaka' : `${w}v kvar`
  }

  const top = injured.slice(0, 3)

  // Stjärnspelaren bland skadade (högst form + ability)
  const topPlayer = injured[0]
  const isKeyPlayer = topPlayer && ((topPlayer.form ?? 50) + (topPlayer.currentAbility ?? 50)) > 130
  const contextLine = isKeyPlayer
    ? `${topPlayer.lastName} är en av era bästa — det märks.`
    : injured.length >= 4
    ? `${injured.length} borta är för många.`
    : null

  return (
    <div
      style={{
        background: 'var(--bg-portal-surface)',
        border: '1px solid var(--bg-leather)',
        borderRadius: 6,
        padding: '8px 10px',
        cursor: 'pointer',
      }}
      onClick={() => navigate('/game/squad')}
    >
      <div style={{
        fontSize: 8,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'var(--danger)',
        fontWeight: 600,
        marginBottom: 5,
      }}>
        🩹 {injured.length === 1 ? 'SKADAD' : `${injured.length} SKADADE`}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {top.map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 500 }}>
              {p.lastName}
            </span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 6 }}>
              {weeksLeft(p.injuryDaysRemaining)}
            </span>
          </div>
        ))}
        {injured.length > 3 && (
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>
            +{injured.length - 3} till →
          </div>
        )}
      </div>
      {contextLine && (
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic', lineHeight: 1.4 }}>
          {contextLine}
        </div>
      )}
    </div>
  )
}
