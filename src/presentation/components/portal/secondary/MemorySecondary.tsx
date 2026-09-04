import { selectPortalMemory } from '../../../../domain/services/portal/portalMemoryService'
import type { CardRenderProps } from '../portalTypes'

export function MemorySecondary({ game }: CardRenderProps) {
  const memory = selectPortalMemory(game)
  if (!memory) return null

  return (
    <div className="portal-secondary-card" data-portal-memory-key={memory.postKey}>
      <div className="portal-card-stripe portal-card-stripe-copper-dim" />
      <div className="portal-card-eyebrow">
        {memory.emoji} {memory.kicker}
      </div>
      <p className="h-quote h-quote-light" style={{ lineHeight: 1.5, margin: 0 }}>
        {memory.text}
      </p>
    </div>
  )
}
