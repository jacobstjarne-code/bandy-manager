/**
 * VictoryTrophy — pulsande trofé-emoji för SM-finalsegern.
 * Pixel-värden från victory-mockup. Justera inte.
 */

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
          fontSize: 72,
          marginBottom: 16,
          lineHeight: 1,
          animation: 'scene-trophy-glow 3s ease-in-out infinite',
        }}
      >
        {'\u{1F3C6}'}
      </div>
    </>
  )
}
