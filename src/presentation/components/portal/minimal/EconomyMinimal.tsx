import type { CardRenderProps } from '../portalTypes'
import { formatFinanceAbs } from '../../../utils/formatters'

/** Minimal-kort: kassan-rad. */
export function EconomyMinimal({ game }: CardRenderProps) {
  const club = game.clubs.find(c => c.id === game.managedClubId)
  const finances = club?.finances ?? 0

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        color: 'var(--text-muted)',
        fontSize: 8,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: 2,
      }}>
        Kassa
      </div>
      <div className="h-num-sm" style={{ color: finances < 0 ? 'var(--danger)' : 'var(--text-light)' }}>
        {formatFinanceAbs(finances)}
      </div>
    </div>
  )
}
