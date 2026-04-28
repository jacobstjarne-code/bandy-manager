/**
 * VictoryScore — slutresultat + lagnamn + arena/åskådarinfo.
 * Pixel-värden från victory-mockup .victory-score / .victory-teams.
 */

interface Props {
  myScore: number
  theirScore: number
  homeName: string
  awayName: string
  arenaCapacity: string
}

export function VictoryScore({
  myScore,
  theirScore,
  homeName,
  awayName,
  arenaCapacity,
}: Props) {
  return (
    <>
      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 64,
          fontWeight: 800,
          color: 'var(--match-gold)',
          lineHeight: 1,
          letterSpacing: -2,
          marginBottom: 8,
          textShadow: '0 2px 30px rgba(212,164,96,0.30)',
        }}
      >
        {myScore}–{theirScore}
      </div>

      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 14,
          color: 'var(--text-light-secondary)',
          marginBottom: 4,
        }}
      >
        <strong style={{ color: 'var(--text-light)', fontWeight: 700 }}>
          {homeName}
        </strong>{' '}
        <span style={{ opacity: 0.5 }}>—</span>{' '}
        <strong style={{ color: 'var(--text-light)', fontWeight: 700 }}>
          {awayName}
        </strong>
      </div>

      <div
        style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 50,
        }}
      >
        {arenaCapacity}
      </div>
    </>
  )
}
