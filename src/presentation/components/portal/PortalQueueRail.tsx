import type { SaveGame } from '../../../domain/entities/SaveGame'

interface Props {
  game: SaveGame
}

// Source labels and icons for deferred decision chips.
// Extend as new sources are added to deferredDecisions.
const SOURCE_META: Record<string, { icon: string; label: string; warm?: boolean }> = {
  communityEvent:    { icon: '🏘️', label: 'Orten' },
  hallDebate:        { icon: '🏛️', label: 'Kommunen' },
  journalistExclusive: { icon: '📰', label: 'Lokaltidningen', warm: true },
  playerMediaComment: { icon: '📰', label: 'Lokaltidningen', warm: true },
  sponsorOffer:      { icon: '💼', label: 'Sponsor', warm: true },
  academyEvent:      { icon: '🎓', label: 'Akademin' },
  supporterEvent:    { icon: '📣', label: 'Klacken' },
  weeklyDecision:    { icon: '🏒', label: 'Veckans beslut' },
}

function uniqueBySource<T extends { type?: string; source?: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter(item => {
    const key = item.source ?? item.type ?? 'unknown'
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function PortalQueueRail({ game }: Props) {
  const deferred = game.deferredDecisions ?? []
  if (deferred.length === 0) return null

  const items = deferred as Array<{ type?: string; source?: string }>
  const uniqueItems = uniqueBySource(items).slice(0, 4)
  const hasMore = uniqueItems.length < items.length
    ? items.length - uniqueItems.length
    : 0

  const countText = `${deferred.length} nästa veckan`

  return (
    <div className="portal-queue-rail">
      <div className="portal-queue-rail-head">
        <span className="portal-queue-rail-eyebrow">⏳ I kö</span>
        <span className="portal-queue-rail-count">
          <strong>{deferred.length}</strong> {countText.slice(String(deferred.length).length + 1)}
        </span>
      </div>
      <div className="portal-queue-chips">
        {uniqueItems.map((item, idx) => {
          const sourceKey = item.source ?? item.type ?? 'unknown'
          const meta = SOURCE_META[sourceKey]
          const icon = meta?.icon ?? '📋'
          const label = meta?.label ?? sourceKey
          const isWarm = meta?.warm ?? false
          return (
            <span
              key={idx}
              className={`portal-queue-chip${isWarm ? ' portal-queue-chip-warm' : ''}`}
            >
              <span className="portal-queue-chip-icon">{icon}</span>
              <span>{label}</span>
            </span>
          )
        })}
        {hasMore > 0 && (
          <span className="portal-queue-chip">+{hasMore} fler</span>
        )}
      </div>
    </div>
  )
}
