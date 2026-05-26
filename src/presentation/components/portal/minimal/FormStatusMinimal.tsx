import type { CardRenderProps } from '../portalTypes'
import { Sparkline, MIN_POINTS } from '../../primitives/Sparkline'

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

  const snapForm = game.scoreSnapshots?.playerForm ?? []
  const formLast = snapForm[snapForm.length - 1] ?? 0
  const formPrev = snapForm[snapForm.length - 2] ?? 0
  const formTrendStroke = formLast > formPrev ? 'success' : formLast < formPrev ? 'danger' : 'accent'

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
      {snapForm.length >= MIN_POINTS && (
        <div style={{ marginTop: 3 }}>
          <Sparkline points={snapForm} stroke={formTrendStroke as 'success' | 'danger' | 'accent'} height={10} />
        </div>
      )}
    </div>
  )
}
