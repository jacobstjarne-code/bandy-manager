import type { CardRenderProps } from '../portalTypes'
import { Sparkline, MIN_POINTS } from '../../primitives/Sparkline'
import { trendStroke } from '../../../utils/formatters'

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
  const formTrendStroke = trendStroke(snapForm[snapForm.length - 1] ?? 0, snapForm[snapForm.length - 2] ?? 0)

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
      <div className="h-num-sm" style={{ color: formColor }}>
        {avgForm}
      </div>
      {snapForm.length >= MIN_POINTS && (
        <div style={{ marginTop: 3 }}>
          <Sparkline points={snapForm} stroke={formTrendStroke} height={10} />
        </div>
      )}
    </div>
  )
}
