/**
 * SnowParticles — 18 fallande snöflingor med deterministisk seed.
 * Pixel-värden från training-mockup. Justera inte.
 */

import { useMemo } from 'react'

const SNOW_KEYFRAMES = `
@keyframes scene-snowfall {
  from { transform: translateY(-10px); }
  to   { transform: translateY(800px); }
}
`

interface Props {
  seed: number
  count?: number
}

export function SnowParticles({ seed, count = 18 }: Props) {
  const flakes = useMemo(() => {
    let s = seed % 233280
    if (s <= 0) s = 1
    const rand = () => {
      s = (s * 9301 + 49297) % 233280
      return s / 233280
    }
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      size: 2 + rand() * 3,
      left: rand() * 100,
      duration: 5 + rand() * 5,
      delay: -rand() * 10,
      opacity: 0.3 + rand() * 0.4,
    }))
  }, [seed, count])

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <style>{SNOW_KEYFRAMES}</style>
      {flakes.map(f => (
        <span
          key={f.key}
          style={{
            position: 'absolute',
            top: 0,
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            background: 'rgba(245,241,235,0.35)',
            borderRadius: '50%',
            animation: `scene-snowfall ${f.duration}s linear infinite`,
            animationDelay: `${f.delay}s`,
            opacity: f.opacity,
          }}
        />
      ))}
    </div>
  )
}
