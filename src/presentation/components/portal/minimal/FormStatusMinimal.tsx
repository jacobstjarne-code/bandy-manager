import type { CardRenderProps } from '../portalTypes'

/** Minimal-kort: genomsnittlig form i truppen. */
export function FormStatusMinimal({ game }: CardRenderProps) {
  const squadPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const avgForm = squadPlayers.length > 0
    ? Math.round(squadPlayers.reduce((s, p) => s + p.form, 0) / squadPlayers.length)
    : 0

  const formColor = avgForm >= 70
    ? 'var(--success)'
    : avgForm >= 50
    ? 'var(--text-light)'
    : 'var(--danger)'

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        color: 'var(--text-muted)',
        fontSize: 8,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: 2,
      }}>
        Form
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        color: formColor,
        fontSize: 13,
        fontWeight: 600,
      }}>
        {avgForm}
      </div>
    </div>
  )
}
