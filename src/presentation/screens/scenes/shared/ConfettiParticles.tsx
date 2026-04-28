/**
 * ConfettiParticles — 30 fallande konfetti-strån med deterministisk seed.
 * Pixel-värden från victory-mockup. Justera inte.
 */

import { useMemo } from 'react'

const FALL_KEYFRAMES = `
@keyframes scene-confetti-fall {
  from { transform: translateY(-20px) rotate(0deg); }
  to   { transform: translateY(800px) rotate(720deg); }
}
`

const CONFETTI_COLORS = ['#d4a460', '#b8884c', '#f0e8d8']

interface Props {
  seed: number
  count?: number
}

export function ConfettiParticles({ seed, count = 30 }: Props) {
  const confetti = useMemo(() => {
    let s = seed % 233280
    if (s <= 0) s = 1
    const rand = () => {
      s = (s * 9301 + 49297) % 233280
      return s / 233280
    }
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      left: rand() * 100,
      color: CONFETTI_COLORS[Math.floor(rand() * CONFETTI_COLORS.length)],
      duration: 4 + rand() * 4,
      delay: -rand() * 10,
      opacity: 0.6 + rand() * 0.4,
    }))
  }, [seed, count])

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <style>{FALL_KEYFRAMES}</style>
      {confetti.map(c => (
        <span
          key={c.key}
          style={{
            position: 'absolute',
            top: 0,
            left: `${c.left}%`,
            width: 4,
            height: 8,
            background: c.color,
            animation: `scene-confetti-fall ${c.duration}s linear infinite`,
            animationDelay: `${c.delay}s`,
            opacity: c.opacity,
          }}
        />
      ))}
    </div>
  )
}
