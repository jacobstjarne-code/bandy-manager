/**
 * CoffeeRoomSecondary — Portal-kort som leder in till kafferums-scenen.
 * Visar emoji + kort preview, klickbart för att öppna full scen.
 */

import type { CardRenderProps } from '../portalTypes'
import { getCoffeeRoomScene } from '../../../../domain/services/coffeeRoomService'
import { useGameStore } from '../../../store/gameStore'

export function CoffeeRoomSecondary({ game }: CardRenderProps) {
  const triggerCoffeeRoomScene = useGameStore(s => s.triggerCoffeeRoomScene)
  const scene = getCoffeeRoomScene(game)
  if (!scene || scene.exchanges.length === 0) return null

  const previewText = scene.exchanges[0][1]
  const truncated = previewText.length > 90 ? previewText.slice(0, 88) + '…' : previewText

  return (
    <div
      onClick={() => triggerCoffeeRoomScene()}
      style={{
        background: 'var(--bg-portal-surface)',
        borderLeft: '2px solid var(--accent)',
        padding: '10px 12px',
        marginBottom: 0,
        borderRadius: '0 6px 6px 0',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          fontSize: 8,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        ☕ Kafferummet
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 12,
          color: 'var(--text-light-secondary)',
          fontStyle: 'italic',
          lineHeight: 1.5,
        }}
      >
        "{truncated}"
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>
        Klicka för att lyssna →
      </div>
    </div>
  )
}
