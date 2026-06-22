import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getClubMemory, momentKind } from '../../../domain/services/clubMemoryService'
import { ClubMemorySeasonSection } from './ClubMemorySeasonSection'
import { ClubMemoryLegendsBlock } from './ClubMemoryLegendsBlock'
import { ClubMemoryRecordsBlock } from './ClubMemoryRecordsBlock'
import { ClubMemoryEmpty } from './ClubMemoryEmpty'

const KIND_LABEL: Record<string, string> = {
  triumph: 'Triumf',
  scar:    'Ärr',
  tension: 'Laddat',
  neutral: 'Noterat',
}

interface Props {
  game: SaveGame
}

export function ClubMemoryView({ game }: Props) {
  const clubMemory = getClubMemory(game)
  const recentMoments = game.recentMoments ?? []

  return (
    <div className="club-memory-container">

      {recentMoments.length > 0 && (
        <div className="moment-block">
          <div className="moment-block-header">Det som hänt</div>
          <div className="moment-block-subheader">Säsongen</div>
          {recentMoments.map(m => {
            const kind = momentKind(m.source)
            return (
              <div key={m.id} className={`moment-row ${kind}`}>
                <div className="moment-row-meta">
                  <span className={`moment-row-kt ${kind}`}>{KIND_LABEL[kind]}</span>
                  <span className="moment-row-matchday">Omg {m.matchday}</span>
                </div>
                <div className="moment-row-title">{m.title}</div>
                <div className="moment-row-body">{m.body}</div>
              </div>
            )
          })}
        </div>
      )}

      {clubMemory.totalEventsAcrossSeasons < 3 ? (
        recentMoments.length === 0 && <ClubMemoryEmpty />
      ) : (
        <>
          {clubMemory.seasons.map(seasonMemory => (
            <ClubMemorySeasonSection
              key={seasonMemory.season}
              seasonMemory={seasonMemory}
              activeAnniversaries={game.activeAnniversaries ?? []}
            />
          ))}

          {clubMemory.legends.length > 0 && (
            <ClubMemoryLegendsBlock legends={clubMemory.legends} />
          )}

          {clubMemory.records && (
            <ClubMemoryRecordsBlock records={clubMemory.records} />
          )}
        </>
      )}

    </div>
  )
}
