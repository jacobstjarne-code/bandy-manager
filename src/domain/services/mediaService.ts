import type { SaveGame, InboxItem } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
import { FixtureStatus, InboxItemType } from '../enums'

function mediaItem(title: string, date: string, id: string): InboxItem {
  return {
    id,
    date,
    type: InboxItemType.Media,
    title,
    body: '',
    isRead: false,
  }
}

function countRecentResults(game: SaveGame, lastN: number): { wins: number; losses: number } {
  const completed = game.fixtures
    .filter(f =>
      f.status === FixtureStatus.Completed &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    )
    .sort((a, b) => b.roundNumber - a.roundNumber)
    .slice(0, lastN)

  let wins = 0
  let losses = 0
  for (const f of completed) {
    const isHome = f.homeClubId === game.managedClubId
    const myScore = isHome ? f.homeScore : f.awayScore
    const theirScore = isHome ? f.awayScore : f.homeScore
    if ((myScore ?? 0) > (theirScore ?? 0)) wins++
    else if ((myScore ?? 0) < (theirScore ?? 0)) losses++
  }
  return { wins, losses }
}

export function generateMediaHeadlines(
  game: SaveGame,
  simulatedFixtures: Fixture[],
  round: number,
  rand: () => number,
): InboxItem[] {
  const managedFixture = simulatedFixtures.find(
    f => (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
         f.status === FixtureStatus.Completed
  )
  if (!managedFixture) return []

  // 30% chance per round
  if (rand() > 0.30) return []

  const isHome = managedFixture.homeClubId === game.managedClubId
  const myScore = isHome ? (managedFixture.homeScore ?? 0) : (managedFixture.awayScore ?? 0)
  const theirScore = isHome ? (managedFixture.awayScore ?? 0) : (managedFixture.homeScore ?? 0)
  const myClub = game.clubs.find(c => c.id === game.managedClubId)
  const opponentClub = game.clubs.find(c => c.id === (isHome ? managedFixture.awayClubId : managedFixture.homeClubId))

  const id = `inbox_media_r${round}_${game.currentSeason}`
  const { wins, losses } = countRecentResults(game, 5)

  if (myScore >= theirScore + 4) {
    return [mediaItem(
      `MÅLKALAS! ${myClub?.name} krossade ${opponentClub?.name} med ${myScore}–${theirScore}`,
      game.currentDate, id
    )]
  }

  if (theirScore >= myScore + 4) {
    return [mediaItem(
      `KOLLAPSEN: ${myClub?.name} förnedrade av ${opponentClub?.name} — ${myScore}–${theirScore}`,
      game.currentDate, id
    )]
  }

  if (myScore > theirScore && wins >= 4) {
    return [mediaItem(
      `${myClub?.name} i strålande form — ${wins} raka segrar`,
      game.currentDate, id
    )]
  }

  if (theirScore > myScore && losses >= 3) {
    return [mediaItem(
      `Kris i ${myClub?.name}? Tredje raka förlusten`,
      game.currentDate, id
    )]
  }

  // POTM highlight
  const potmId = managedFixture.report?.playerOfTheMatchId
  if (potmId && rand() > 0.5) {
    const potm = game.players.find(p => p.id === potmId)
    const rating = managedFixture.report?.playerRatings?.[potmId]
    if (potm && rating && rating >= 8.0) {
      return [mediaItem(
        `"Otrolig insats" — ${potm.firstName} ${potm.lastName} hyllas efter ${rating.toFixed(1)}-betyg`,
        game.currentDate, id
      )]
    }
  }

  return []
}
