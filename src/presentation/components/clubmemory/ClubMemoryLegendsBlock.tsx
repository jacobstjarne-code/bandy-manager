import type { ClubLegend } from '../../../domain/entities/Narrative'

interface Props {
  legends: ClubLegend[]
}

export function ClubMemoryLegendsBlock({ legends }: Props) {
  if (legends.length === 0) return null

  return (
    <div className="club-memory-legends">
      <div className="club-memory-legends-header">
        ⭐ Klubbens legender
      </div>

      {legends.map((legend, i) => (
        <div
          key={legend.playerId ?? `${legend.name}-${i}`}
          className="club-memory-legend-card"
        >
          <div className="club-memory-legend-name">
            {legend.name}
          </div>
          <div className="club-memory-legend-meta">
            {legend.position} · {legend.seasons} säsonger · Pensionerad {legend.retiredSeason}
          </div>
          <div className="club-memory-legend-stats">
            {legend.totalGoals} mål · {legend.totalAssists} assist
            {legend.titles.length > 0 && ` · ${legend.titles.join(', ')}`}
          </div>
          {legend.memorableStory && (
            <div className="club-memory-legend-story">
              {legend.memorableStory}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
