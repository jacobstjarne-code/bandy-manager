/**
 * VictoryTrophy — pulsande trofé för SM-finalsegern (Lucide, B3: ingen emoji på ceremoninivå).
 * Pixel-värden från victory-mockup. Justera inte.
 */
import { Trophy } from 'lucide-react'

const TROPHY_KEYFRAMES = `
@keyframes scene-trophy-glow {
  0%,100% {
    filter: drop-shadow(0 4px 24px rgba(212,164,96,0.55))
            drop-shadow(0 0 40px rgba(212,164,96,0.30));
  }
  50% {
    filter: drop-shadow(0 4px 28px rgba(212,164,96,0.75))
            drop-shadow(0 0 50px rgba(212,164,96,0.45));
  }
}
`

export function VictoryTrophy() {
  return (
    <>
      <style>{TROPHY_KEYFRAMES}</style>
      <div
        style={{
          marginBottom: 16,
          lineHeight: 1,
          color: 'var(--gold)',
          animation: 'scene-trophy-glow 3s ease-in-out infinite',
        }}
      >
        <Trophy size={72} strokeWidth={1.5} />
      </div>
    </>
  )
}
