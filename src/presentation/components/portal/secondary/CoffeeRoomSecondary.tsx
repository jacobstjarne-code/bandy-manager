/**
 * CoffeeRoomSecondary — Portal-kort som leder in till kafferums-scenen.
 *
 * D4 (A1-KAFFERUMMET-BLIR-EN-PLATS, 2026-07-19): kortet var en dubblering —
 * det renderade en trunkerad rad av samtalet inline, samtidigt som scenen
 * visade det fullt ut. Åtgärden: kortet blir en DÖRR, inte en kopia. Skal
 * (--bg-portal-surface + vänsterstripe) och sekundär-vikt oförändrade —
 * det är innehållet som byter roll, från citat-preview till lockrad+chevron.
 * Samtalet bor på ett ställe: i scenen.
 */

import type { CardRenderProps } from '../portalTypes'
import { getCoffeeRoomScene } from '../../../../domain/services/coffeeRoomService'
import { useGameStore } from '../../../store/gameStore'

export function CoffeeRoomSecondary({ game }: CardRenderProps) {
  const triggerCoffeeRoomScene = useGameStore(s => s.triggerCoffeeRoomScene)
  const scene = getCoffeeRoomScene(game)
  if (!scene || scene.exchanges.length === 0) return null

  const teaser = scene.question ? 'Sture har något på hjärtat i dag.' : 'Dörren står öppen.'

  return (
    <div
      className="card-tap"
      onClick={() => triggerCoffeeRoomScene()}
      style={{
        position: 'relative',
        background: 'var(--bg-portal-surface)',
        borderLeft: '2px solid var(--accent)',
        padding: '10px 32px 10px 12px',
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
      <div className="h-quote h-quote-light" style={{ lineHeight: 1.5 }}>
        {teaser}
      </div>
      {/* D4 — DS-chevron 16×16, radie 4, koppar */}
      <span
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 16,
          height: 16,
          borderRadius: 3,
          background: 'color-mix(in srgb, var(--accent) 16%, transparent)',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          lineHeight: 1,
        }}
      >
        ›
      </span>
    </div>
  )
}
