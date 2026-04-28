import { useMemo, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { buildPortal, makeSeed } from '../../domain/services/portal/portalBuilder'
import { getSeasonalTone } from '../../domain/services/portal/seasonalTone'
import { initCardBag } from '../../domain/services/portal/initCardBag'
import { PortalSecondarySection } from '../components/portal/PortalSecondarySection'
import { PortalMinimalBar } from '../components/portal/PortalMinimalBar'

// Initialisera bag-of-cards en gång vid modulimport
initCardBag()

export function PortalScreen() {
  const game = useGameStore(s => s.game)

  if (!game) return (
    <div style={{ padding: 20 }}>
      <div className="shimmer" style={{ height: 160, borderRadius: 3, marginBottom: 10 }} />
      <div className="shimmer" style={{ height: 80, borderRadius: 3, marginBottom: 10 }} />
      <div className="shimmer" style={{ height: 80, borderRadius: 3 }} />
    </div>
  )

  const seed = makeSeed(game)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const layout = useMemo(() => buildPortal(game, seed), [game, seed])

  // Sätt CSS-vars för seasonal tone
  useEffect(() => {
    const tone = getSeasonalTone(game.currentDate)
    document.documentElement.style.setProperty('--bg-portal', tone.bgPrimary)
    document.documentElement.style.setProperty('--bg-portal-surface', tone.bgSurface)
    document.documentElement.style.setProperty('--bg-portal-elevated', tone.bgElevated)
    document.documentElement.style.setProperty('--accent-portal', tone.accentTone)
    return () => {
      document.documentElement.style.removeProperty('--bg-portal')
      document.documentElement.style.removeProperty('--bg-portal-surface')
      document.documentElement.style.removeProperty('--bg-portal-elevated')
      document.documentElement.style.removeProperty('--accent-portal')
    }
  }, [game.currentDate])

  const Primary = layout.primary.Component

  return (
    <div
      className="screen-enter texture-wood card-stack"
      style={{ background: 'var(--bg-portal)', padding: '14px', minHeight: '100%' }}
    >
      <Primary game={game} />
      <PortalSecondarySection cards={layout.secondary} game={game} />
      <PortalMinimalBar cards={layout.minimal} game={game} />
      <div
        style={{
          display: 'block',
          textAlign: 'center',
          background: 'transparent',
          border: '1px dashed var(--border)',
          color: 'var(--text-muted)',
          padding: 8,
          borderRadius: 6,
          marginBottom: 14,
          fontSize: 10,
          cursor: 'pointer',
        }}
        onClick={() => {/* TODO: expandera MoreInfoFold */}}
      >
        + Akademi · Cup · Klacken · Andra matcher
      </div>
    </div>
  )
}
