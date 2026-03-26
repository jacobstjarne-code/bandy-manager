import type { SaveGame } from '../entities/SaveGame'
import { FixtureStatus } from '../enums'

export function buildDoctorContext(game: SaveGame): string {
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (!managedClub) return 'Ingen klubb hittades.'

  const standing = game.standings.find(s => s.clubId === game.managedClubId)
  const leaguePosition = standing?.position ?? '?'

  // Next round number
  const scheduledFixtures = game.fixtures.filter(
    f => f.status === FixtureStatus.Scheduled &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )
  const nextRound = scheduledFixtures.length > 0
    ? Math.min(...scheduledFixtures.map(f => f.roundNumber))
    : null

  // Squad overview: top 5 players by rating
  const squadPlayers = game.players
    .filter(p => p.clubId === game.managedClubId)
    .sort((a, b) => b.currentAbility - a.currentAbility)
    .slice(0, 5)

  const squadLines = squadPlayers.map(p =>
    `  ${p.firstName} ${p.lastName} (${p.position}, CA ${p.currentAbility}, form ${p.form}, fitness ${p.fitness}, morale ${p.morale}${p.isInjured ? ', SKADAD' : ''})`
  ).join('\n')

  // Recent results: last 3 completed fixtures for managed club
  const completedFixtures = game.fixtures
    .filter(f =>
      f.status === FixtureStatus.Completed &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    )
    .sort((a, b) => b.roundNumber - a.roundNumber)
    .slice(0, 3)

  const resultLines = completedFixtures.map(f => {
    const isHome = f.homeClubId === game.managedClubId
    const homeClub = game.clubs.find(c => c.id === f.homeClubId)
    const awayClub = game.clubs.find(c => c.id === f.awayClubId)
    const score = `${f.homeScore}-${f.awayScore}`
    const venue = isHome ? 'Hemma' : 'Borta'
    const opponent = isHome ? awayClub?.name : homeClub?.name
    const won = isHome ? f.homeScore > f.awayScore : f.awayScore > f.homeScore
    const drew = f.homeScore === f.awayScore
    const result = won ? 'V' : drew ? 'O' : 'F'
    return `  Rond ${f.roundNumber} ${venue} mot ${opponent}: ${score} (${result})`
  }).join('\n')

  // Next opponent
  const nextFixture = nextRound !== null
    ? scheduledFixtures.find(f => f.roundNumber === nextRound)
    : null

  let nextOpponentInfo = 'Inga fler matcher schemalagda.'
  if (nextFixture) {
    const isHome = nextFixture.homeClubId === game.managedClubId
    const opponentId = isHome ? nextFixture.awayClubId : nextFixture.homeClubId
    const opponent = game.clubs.find(c => c.id === opponentId)
    const opponentStanding = game.standings.find(s => s.clubId === opponentId)
    const venue = isHome ? 'hemma' : 'borta'

    // Opponent's recent form
    const opponentRecent = game.fixtures
      .filter(f =>
        f.status === FixtureStatus.Completed &&
        (f.homeClubId === opponentId || f.awayClubId === opponentId)
      )
      .sort((a, b) => b.roundNumber - a.roundNumber)
      .slice(0, 3)

    const opponentWins = opponentRecent.filter(f => {
      const opponentHome = f.homeClubId === opponentId
      return opponentHome ? f.homeScore > f.awayScore : f.awayScore > f.homeScore
    }).length

    const form = opponentWins >= 2 ? 'bra form' : opponentWins === 1 ? 'ojämn form' : 'dålig form'
    nextOpponentInfo = `${opponent?.name ?? opponentId} (${venue}, tabellplats ${opponentStanding?.position ?? '?'}, ${form})`
  }

  // Weather for next fixture
  let weatherInfo = ''
  if (nextFixture) {
    const weather = game.matchWeathers.find(w => w.fixtureId === nextFixture.id)
    if (weather) {
      weatherInfo = `\nVäder nästa match: ${weather.weather.condition}, temperatur ${weather.weather.temperature}°C`
    }
  }

  // Tactic
  const tactic = managedClub.activeTactic
  const tacticInfo = `Mentalitet: ${tactic.mentality}, Tempo: ${tactic.tempo}, Press: ${tactic.press}, Passningsstil: ${tactic.passingRisk}, Bredd: ${tactic.width}, Anfallsfokus: ${tactic.attackingFocus}`

  const fanMood = game.fanMood ?? 50
  const fanMoodLabel = fanMood >= 70 ? 'hög' : fanMood >= 40 ? 'medel' : 'låg'

  return `Säsong: ${game.currentSeason}
Rond: ${nextRound ?? 'säsongsslut'}
Klubb: ${managedClub.name}
Tabellplats: ${leaguePosition} av ${game.standings.length}
Supporterstämning: ${fanMoodLabel} (${fanMood}/100)

Trupp – topp 5 spelare:
${squadLines || '  Inga spelare hittades'}

Senaste resultat:
${resultLines || '  Inga avklarade matcher'}

Nästa motståndare: ${nextOpponentInfo}${weatherInfo}

Nuvarande taktik:
${tacticInfo}`
}
