import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getClubMemory } from '../../../domain/services/clubMemoryService'
import { ClubMemorySeasonSection } from './ClubMemorySeasonSection'
import { ClubMemoryLegendsBlock } from './ClubMemoryLegendsBlock'
import { ClubMemoryRecordsBlock } from './ClubMemoryRecordsBlock'
import { ClubMemoryEmpty } from './ClubMemoryEmpty'

interface Props {
  game: SaveGame
}

export function ClubMemoryView({ game }: Props) {
  const clubMemory = getClubMemory(game)

  if (clubMemory.totalEventsAcrossSeasons < 3) {
    return (
      <div style={{ padding: 14 }}>
        <ClubMemoryEmpty />
      </div>
    )
  }

  return (
    <div style={{ padding: 14 }}>
      {clubMemory.seasons.map(seasonMemory => (
        <ClubMemorySeasonSection
          key={seasonMemory.season}
          seasonMemory={seasonMemory}
        />
      ))}

      {clubMemory.legends.length > 0 && (
        <ClubMemoryLegendsBlock legends={clubMemory.legends} />
      )}

      {clubMemory.records && (
        <ClubMemoryRecordsBlock records={clubMemory.records} />
      )}
    </div>
  )
}
