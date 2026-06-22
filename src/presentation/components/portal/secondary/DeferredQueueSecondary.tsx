import type { CardRenderProps } from '../portalTypes'
import { getDeferredDecisionCount } from '../../../../domain/services/decisionBudgetService'

export function DeferredQueueSecondary({ game }: CardRenderProps) {
  const count = getDeferredDecisionCount(game)
  if (count === 0) return null

  return (
    <div className="portal-secondary-card">
      <div className="portal-card-stripe portal-card-stripe-copper-dim" />
      <div className="portal-card-eyebrow">Beslutskö</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
        {count} {count === 1 ? 'beslut väntar' : 'beslut väntar'}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
        Frigörs automatiskt när budget öppnas
      </div>
    </div>
  )
}
