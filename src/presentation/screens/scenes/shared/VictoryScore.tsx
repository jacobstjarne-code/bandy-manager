import { ScoreBlock } from '../../../components/primitives/ScoreBlock'

interface Props {
  homeScore: number
  awayScore: number
  homeName: string
  awayName: string
  arenaCapacity: string
}

export function VictoryScore({
  homeScore,
  awayScore,
  homeName,
  awayName,
  arenaCapacity,
}: Props) {
  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <ScoreBlock
          score={`${homeScore}–${awayScore}`}
          variant="gold"
          size="hero"
          label="Slutresultat"
        />
      </div>

      <div
        className="h-quote h-quote-light"
        style={{
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
