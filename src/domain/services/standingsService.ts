import type { Fixture } from '../entities/Fixture'
import type { StandingRow } from '../entities/SaveGame'
import { FixtureStatus } from '../enums'

export function calculateStandings(teamIds: string[], fixtures: Fixture[]): StandingRow[] {
  const rowMap = new Map<string, StandingRow>()

  for (const id of teamIds) {
    rowMap.set(id, {
      clubId: id,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      position: 0,
    })
  }

  for (const fixture of fixtures) {
    if (fixture.status !== FixtureStatus.Completed) continue
    // PT-5: Exclude playoff/cup/knockout fixtures from league standings
    if (fixture.isKnockout || fixture.isCup) continue

    const home = rowMap.get(fixture.homeClubId)
    const away = rowMap.get(fixture.awayClubId)

    if (!home || !away) continue

    home.played += 1
    away.played += 1

    home.goalsFor += fixture.homeScore
    home.goalsAgainst += fixture.awayScore
    away.goalsFor += fixture.awayScore
    away.goalsAgainst += fixture.homeScore

    if (fixture.homeScore > fixture.awayScore) {
      home.wins += 1
      home.points += 2
      away.losses += 1
    } else if (fixture.homeScore < fixture.awayScore) {
      away.wins += 1
      away.points += 2
      home.losses += 1
    } else {
      home.draws += 1
      home.points += 1
      away.draws += 1
      away.points += 1
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst
    away.goalDifference = away.goalsFor - away.goalsAgainst
  }

  const rows = Array.from(rowMap.values())

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    return a.clubId.localeCompare(b.clubId)
  })

  rows.forEach((row, index) => {
    row.position = index + 1
  })

  return rows
}
