import type { AllTimeRecords } from '../../../domain/entities/Narrative'
import { seasonSpanLabel } from '../../../domain/utils/seasonYear'

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
      sub: `Säsong ${seasonSpanLabel(records.bestFinish.season)}`,
    })
  }

  if (records.mostGoalsSeason) {
    cards.push({
      label: 'Flest mål (säsong)',
      value: `${records.mostGoalsSeason.goals} mål`,
      sub: `${records.mostGoalsSeason.playerName}, ${seasonSpanLabel(records.mostGoalsSeason.season)}`,
    })
  }

  if (records.mostAssistsSeason) {
    cards.push({
      label: 'Flest assist (säsong)',
      value: `${records.mostAssistsSeason.assists} assist`,
      sub: `${records.mostAssistsSeason.playerName}, ${seasonSpanLabel(records.mostAssistsSeason.season)}`,
    })
  }

  if (records.highestRatingSeason) {
    cards.push({
      label: 'Högsta rating',
      value: `${records.highestRatingSeason.rating.toFixed(1)}`,
      sub: `${records.highestRatingSeason.playerName}, ${seasonSpanLabel(records.highestRatingSeason.season)}`,
    })
  }

  if (records.biggestWin) {
    cards.push({
      label: 'Största seger',
      value: records.biggestWin.score,
      sub: `mot ${records.biggestWin.opponent}, ${seasonSpanLabel(records.biggestWin.season)}`,
    })
  }

  if (records.championSeasons.length > 0) {
    cards.push({
      label: 'SM-guld',
      value: `${records.championSeasons.length}×`,
      sub: records.championSeasons.map(seasonSpanLabel).join(', '),
    })
  }

  if (records.cupWinSeasons.length > 0) {
    cards.push({
      label: 'Cupsegrar',
      value: `${records.cupWinSeasons.length}×`,
      sub: records.cupWinSeasons.map(seasonSpanLabel).join(', '),
    })
  }

  return cards
}

export function ClubMemoryRecordsBlock({ records }: Props) {
  const cards = buildCards(records)
  if (cards.length === 0) return null

  return (
    <div className="club-memory-records">
      <div className="club-memory-records-header">
        📊 Klubbens rekord
      </div>

      <div className="club-memory-records-grid">
        {cards.map((card, i) => (
          <div key={i} className="club-memory-record-card">
            <div className="club-memory-record-label">
              {card.label}
            </div>
            <div className="club-memory-record-value">
              {card.value}
            </div>
            {card.sub && (
              <div className="club-memory-record-sub">
                {card.sub}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
