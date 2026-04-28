/**
 * CoffeeRoomScene — recurring scen, kafferummet.
 * 1-3 utbyten mellan klubbens funktionärer, fade-in i sekvens.
 *
 * Pixel-värden från docs/mockups/kafferummet_mockup.html. Justera inte.
 */

import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getCoffeeRoomScene } from '../../../domain/services/coffeeRoomService'
import { SceneHeader } from './shared/SceneHeader'
import { CoffeeExchange } from './shared/CoffeeExchange'
import { SceneCTA } from './shared/SceneCTA'

interface Props {
  game: SaveGame
  onComplete: () => void
}

export function CoffeeRoomScene({ game, onComplete }: Props) {
  const scene = getCoffeeRoomScene(game)

  if (!scene) {
    // Fallback: stäng scenen direkt om data försvinner mellan trigger och render
    return (
      <div style={{ padding: 24 }}>
        <SceneCTA label="Tillbaka" onClick={onComplete} />
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--bg-scene)',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '18px 24px 0' }}>
        <SceneHeader
          genre="I DETTA ÖGONBLICK"
          title={scene.meta.title}
          subtitle={scene.meta.subtitle}
          emoji="☕"
          subtitleMarginBottom={20}
        />
      </div>

      <div
        style={{
          flex: 1,
          padding: '8px 20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {scene.exchanges.map((ex, i) => (
          <div key={i} style={{ display: 'contents' }}>
            <CoffeeExchange exchange={ex} delay={i * 400} />
            {i < scene.exchanges.length - 1 && (
              <div
                style={{
                  alignSelf: 'center',
                  width: '30%',
                  borderBottom: '1px solid var(--border-dark)',
                  opacity: 0.5,
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: '16px 20px 24px', position: 'relative', zIndex: 1 }}>
        <SceneCTA label="Tillbaka till dashboarden" onClick={onComplete} />
      </div>
    </div>
  )
}
