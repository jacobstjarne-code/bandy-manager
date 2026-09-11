import type { GameEvent } from '../entities/GameEvent'
import type { SaveGame } from '../entities/SaveGame'

export function getEventContextLabel(event: GameEvent, game: SaveGame): string | undefined {
  const fixture = event.relatedFixtureId ? game.fixtures.find(f => f.id === event.relatedFixtureId) : undefined
  if (fixture) {
    const opponentId = fixture.homeClubId === game.managedClubId ? fixture.awayClubId : fixture.homeClubId
    const opponent = game.clubs.find(c => c.id === opponentId)
    const venue = fixture.homeClubId === game.managedClubId ? 'hemma' : 'borta'
    const date = fixture.date ? ` · ${fixture.date}` : ''
    return `Gäller ${opponent?.shortName ?? opponent?.name ?? 'motståndaren'} ${venue}${date}`
  }
  if (event.occurredAt && (event.occurredAt.season !== game.currentSeason || event.occurredAt.matchday < game.currentMatchday)) {
    return `Från ${event.occurredAt.date}`
  }
  // Old saves have no occurrence timestamp; the known milestone is still
  // a truthful anchor. Never manufacture today's date for their old prose.
  if (event.type === 'seasonGoalHalfway') return 'Avstämning vid halva serien'
  return undefined
}
