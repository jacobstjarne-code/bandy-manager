import type { SaveGame } from '../entities/SaveGame'
import { FixtureStatus } from '../enums'

/**
 * Generates a 2–4 sentence Swedish narrative about the completed season.
 * Used in SeasonSummaryScreen at the top.
 */
export function generateSeasonNarrative(game: SaveGame): string {
  const managedClubId = game.managedClubId
  const club = game.clubs.find(c => c.id === managedClubId)
  const managedPlayers = game.players.filter(p => p.clubId === managedClubId)

  const standing = game.standings.find(s => s.clubId === managedClubId)
  const finalPosition = standing?.position ?? 12
  const totalTeams = game.clubs.length

  // Completed league fixtures for managed club
  const clubFixtures = game.fixtures.filter(f =>
    f.status === FixtureStatus.Completed &&
    f.season === game.currentSeason &&
    f.roundNumber <= 22 &&
    (f.homeClubId === managedClubId || f.awayClubId === managedClubId)
  ).sort((a, b) => a.roundNumber - b.roundNumber)

  const sentences: string[] = []

  // Sentence 1: Season result
  const bracket = game.playoffBracket
  const isChampion = bracket?.champion === managedClubId
  const isFinalist = bracket?.final?.loserId === managedClubId

  if (isChampion) {
    sentences.push(`Historisk säsong — ${club?.name ?? 'Klubben'} vann SM-guldet ${game.currentSeason}.`)
  } else if (isFinalist) {
    sentences.push(`${club?.name ?? 'Klubben'} tog sig hela vägen till SM-finalen men fick nöja sig med silvermedaljen.`)
  } else if (finalPosition <= 3) {
    sentences.push(`${club?.name ?? 'Klubben'} levererade en stark säsong och slutade på ${finalPosition}:e plats.`)
  } else if (finalPosition >= totalTeams - 2) {
    sentences.push(`En tung säsong — ${club?.name ?? 'Klubben'} slutade på ${finalPosition}:e plats i botten av tabellen.`)
  } else {
    sentences.push(`${club?.name ?? 'Klubben'} avslutade grundserien på ${finalPosition}:e plats.`)
  }

  // Sentence 2: Top scorer
  const sortedByGoals = [...managedPlayers].sort((a, b) => b.seasonStats.goals - a.seasonStats.goals)
  const topScorer = sortedByGoals[0]
  if (topScorer && topScorer.seasonStats.goals >= 3) {
    const name = `${topScorer.firstName} ${topScorer.lastName}`
    sentences.push(`${name} avslutade säsongen som lagets skyttekung med ${topScorer.seasonStats.goals} mål.`)
  }

  // Sentence 3: Best win or notable result
  let bestWinSentence = ''
  let bestWinDiff = 0
  for (const f of clubFixtures) {
    const isHome = f.homeClubId === managedClubId
    const clubScore = isHome ? f.homeScore : f.awayScore
    const oppScore = isHome ? f.awayScore : f.homeScore
    const diff = clubScore - oppScore
    if (diff > bestWinDiff) {
      bestWinDiff = diff
      const oppId = isHome ? f.awayClubId : f.homeClubId
      const oppName = game.clubs.find(c => c.id === oppId)?.shortName ?? 'motståndaren'
      bestWinSentence = `Säsongens höjdpunkt var ${clubScore}–${oppScore}-segern mot ${oppName}.`
    }
  }
  if (bestWinDiff >= 3 && bestWinSentence) {
    sentences.push(bestWinSentence)
  }

  // Sentence 4: Board mood
  const boardPatience = game.boardPatience ?? 70
  if (boardPatience >= 80) {
    sentences.push('Styrelsen uttrycker sin stora tillfredställelse med årets insats.')
  } else if (boardPatience >= 55) {
    sentences.push('Styrelsen är nöjd med säsongens insats.')
  } else if (boardPatience <= 30) {
    sentences.push('Styrelsen kräver tydlig förbättring inför nästa säsong.')
  } else {
    sentences.push('Styrelsen förväntar sig bättre resultat framöver.')
  }

  return sentences.slice(0, 4).join(' ')
}
