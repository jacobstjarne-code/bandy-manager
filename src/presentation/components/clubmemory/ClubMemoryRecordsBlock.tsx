import type { AllTimeRecords } from '../../../domain/entities/Narrative'

interface Props {
  records: AllTimeRecords
}

interface RecordCard {
  label: string
  value: string
  sub?: string
}

function buildCards(records: AllTimeRecords): RecordCard[] {
  const cards: RecordCard[] = []

  if (records.bestFinish) {
    const pos = records.bestFinish.position
    const posLabel = pos === 1 ? '1:a (Mästare)' : pos === 2 ? '2:a' : `${pos}:e`
    cards.push({
      label: 'Bästa placering',
      value: posLabel,
      sub: `Säsong ${records.bestFinish.season}`,
    })
  }

  if (records.mostGoalsSeason) {
    cards.push({
      label: 'Flest mål (säsong)',
      value: `${records.mostGoalsSeason.goals} mål`,
      sub: `${records.mostGoalsSeason.playerName}, ${records.mostGoalsSeason.season}`,
    })
  }

  if (records.mostAssistsSeason) {
    cards.push({
      label: 'Flest assist (säsong)',
      value: `${records.mostAssistsSeason.assists} assist`,
      sub: `${records.mostAssistsSeason.playerName}, ${records.mostAssistsSeason.season}`,
    })
  }

  if (records.highestRatingSeason) {
    cards.push({
      label: 'Högsta rating',
      value: `${records.highestRatingSeason.rating.toFixed(1)}`,
      sub: `${records.highestRatingSeason.playerName}, ${records.highestRatingSeason.season}`,
    })
  }

  if (records.biggestWin) {
    cards.push({
      label: 'Största seger',
      value: records.biggestWin.score,
      sub: `mot ${records.biggestWin.opponent}, ${records.biggestWin.season}`,
    })
  }

  if (records.championSeasons.length > 0) {
    cards.push({
      label: 'SM-guld',
      value: `${records.championSeasons.length}×`,
      sub: records.championSeasons.join(', '),
    })
  }

  if (records.cupWinSeasons.length > 0) {
    cards.push({
      label: 'Cupsegrar',
      value: `${records.cupWinSeasons.length}×`,
      sub: records.cupWinSeasons.join(', '),
    })
  }

  return cards
}

export function ClubMemoryRecordsBlock({ records }: Props) {
  const cards = buildCards(records)
  if (cards.length === 0) return null

  return (
    <div style={{
      marginTop: 28,
      paddingTop: 16,
      borderTop: '2px solid var(--border-dark)',
    }}>
      <div style={{
        fontSize: 9,
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '2px',
        color: 'var(--text-muted)',
        marginBottom: 12,
      }}>
        📊 Klubbens rekord
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
      }}>
        {cards.map((card, i) => (
          <div
            key={i}
            style={{
              padding: '10px 12px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-dark)',
              borderRadius: 6,
            }}
          >
            <div style={{
              fontSize: 8,
              fontWeight: 700,
              textTransform: 'uppercase' as const,
              letterSpacing: '1.5px',
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}>
              {card.label}
            </div>
            <div style={{
              fontFamily: 'Georgia, serif',
              fontSize: 13,
              color: 'var(--text-light)',
              lineHeight: 1.3,
            }}>
              {card.value}
            </div>
            {card.sub && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                {card.sub}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
