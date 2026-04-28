import type { CardRenderProps } from '../portalTypes'

/** Minimal-kort: trupp tillgänglighet (17/19 tillgängliga). */
export function SquadStatusMinimal({ game }: CardRenderProps) {
  const squadPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const injuredCount = squadPlayers.filter(p => p.isInjured).length
  const readyCount = Math.max(0, squadPlayers.length - injuredCount)

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        color: 'var(--text-muted)',
        fontSize: 8,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: 2,
      }}>
        Trupp
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        color: injuredCount > 0 ? 'var(--warning)' : 'var(--text-light)',
        fontSize: 13,
        fontWeight: 600,
      }}>
        {readyCount}/{squadPlayers.length}
      </div>
    </div>
  )
}
