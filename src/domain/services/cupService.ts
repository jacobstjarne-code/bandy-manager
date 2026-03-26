import type { CupBracket, CupMatch } from '../entities/Cup'
import type { Fixture } from '../entities/Fixture'
import { FixtureStatus } from '../enums'

// Round numbers for cup fixtures (interleaved with league rounds)
const CUP_ROUND_NUMBERS: Record<number, number> = {
  1: 103,  // quarterfinals
  2: 107,  // semifinals
  3: 111,  // final
}

export function generateCupFixtures(
  teamIds: string[],
  season: number,
  rand: () => number,
): { bracket: CupBracket; fixtures: Fixture[] } {
  const clubIds = [...teamIds]

  // Shuffle clubs using seeded random
  for (let i = clubIds.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[clubIds[i], clubIds[j]] = [clubIds[j], clubIds[i]]
  }

  const matches: CupMatch[] = []
  const fixtures: Fixture[] = []

  // Generate quarterfinal pairings
  // If odd number of clubs, the last one gets a bye (handled by having fewer quarterfinals)
  const numQFMatches = Math.floor(clubIds.length / 2)
  const byeClubId = clubIds.length % 2 !== 0 ? clubIds[clubIds.length - 1] : null

  for (let i = 0; i < numQFMatches; i++) {
    const homeClubId = clubIds[i * 2]
    const awayClubId = clubIds[i * 2 + 1]
    const fixtureId = `cup-r1-m${i}`

    const fixture: Fixture = {
      id: fixtureId,
      leagueId: `league_${season}`,
      season,
      roundNumber: CUP_ROUND_NUMBERS[1],
      homeClubId,
      awayClubId,
      status: FixtureStatus.Scheduled,
      homeScore: 0,
      awayScore: 0,
      events: [],
      report: undefined,
      homeLineup: undefined,
      awayLineup: undefined,
      isCup: true,
      isKnockout: true,
    }

    const cupMatch: CupMatch = {
      id: fixtureId,
      round: 1,
      fixtureId,
      homeClubId,
      awayClubId,
    }

    matches.push(cupMatch)
    fixtures.push(fixture)
  }

  // If there's a bye club, add a placeholder match to represent the automatic advancement
  // This is handled implicitly — the bye club will be seeded into semifinals when QFs are complete.
  // Store byeClubId as a special match with no fixture needed.
  if (byeClubId) {
    const byeMatch: CupMatch = {
      id: `cup-r1-bye`,
      round: 1,
      fixtureId: `cup-r1-bye`,
      homeClubId: byeClubId,
      awayClubId: byeClubId,
      winnerId: byeClubId,  // auto-advance
    }
    matches.push(byeMatch)
  }

  const bracket: CupBracket = {
    season,
    matches,
    completed: false,
  }

  return { bracket, fixtures }
}

export function generateNextCupRound(
  bracket: CupBracket,
  completedRound: number,
  season: number,
): { updatedBracket: CupBracket; newFixtures: Fixture[] } {
  const nextRound = completedRound + 1
  if (nextRound > 3) {
    return { updatedBracket: bracket, newFixtures: [] }
  }

  // Collect winners from completed round
  const winners = bracket.matches
    .filter(m => m.round === completedRound && m.winnerId)
    .map(m => m.winnerId!)

  if (winners.length < 2) {
    // Not enough winners — cup might be over or something went wrong
    return { updatedBracket: bracket, newFixtures: [] }
  }

  const newMatches: CupMatch[] = []
  const newFixtures: Fixture[] = []
  const roundNumber = CUP_ROUND_NUMBERS[nextRound]

  for (let i = 0; i < Math.floor(winners.length / 2); i++) {
    const homeClubId = winners[i * 2]
    const awayClubId = winners[i * 2 + 1]
    const fixtureId = `cup-r${nextRound}-m${i}`

    const fixture: Fixture = {
      id: fixtureId,
      leagueId: `league_${season}`,
      season,
      roundNumber,
      homeClubId,
      awayClubId,
      status: FixtureStatus.Scheduled,
      homeScore: 0,
      awayScore: 0,
      events: [],
      report: undefined,
      homeLineup: undefined,
      awayLineup: undefined,
      isCup: true,
      isKnockout: true,
    }

    const cupMatch: CupMatch = {
      id: fixtureId,
      round: nextRound,
      fixtureId,
      homeClubId,
      awayClubId,
    }

    newMatches.push(cupMatch)
    newFixtures.push(fixture)
  }

  const updatedBracket: CupBracket = {
    ...bracket,
    matches: [...bracket.matches, ...newMatches],
  }

  return { updatedBracket, newFixtures }
}

export function updateCupBracketAfterRound(
  bracket: CupBracket,
  completedFixtures: Fixture[],
): CupBracket {
  const updatedMatches = bracket.matches.map(match => {
    if (match.winnerId) return match  // already decided

    const fixture = completedFixtures.find(f => f.id === match.fixtureId)
    if (!fixture || fixture.status !== FixtureStatus.Completed) return match

    let homeWon: boolean
    if (fixture.homeScore !== fixture.awayScore) {
      homeWon = fixture.homeScore > fixture.awayScore
    } else if (fixture.overtimeResult) {
      homeWon = fixture.overtimeResult === 'home'
    } else if (fixture.penaltyResult) {
      homeWon = fixture.penaltyResult.home > fixture.penaltyResult.away
    } else {
      homeWon = true // fallback
    }
    const winnerId = homeWon ? fixture.homeClubId : fixture.awayClubId

    return { ...match, winnerId }
  })

  return { ...bracket, matches: updatedMatches }
}

export function getCupRoundName(round: number): string {
  if (round === 1) return 'kvartsfinalen'
  if (round === 2) return 'semifinalen'
  return 'finalen'
}

export function getCupRoundLabel(round: number): string {
  if (round === 1) return 'KVARTSFINAL'
  if (round === 2) return 'SEMIFINAL'
  return 'FINAL'
}

export function getManagedClubCupStatus(
  bracket: CupBracket,
  managedClubId: string,
): { eliminated: boolean; eliminatedInRound?: number; isInFinal: boolean; won: boolean } {
  if (bracket.winnerId === managedClubId) {
    return { eliminated: false, isInFinal: false, won: true }
  }

  // Find the latest match where managed club was eliminated
  const allMatches = bracket.matches.filter(
    m => (m.homeClubId === managedClubId || m.awayClubId === managedClubId) && m.winnerId
  )

  for (const match of allMatches.sort((a, b) => b.round - a.round)) {
    if (match.winnerId !== managedClubId) {
      return { eliminated: true, eliminatedInRound: match.round, isInFinal: false, won: false }
    }
  }

  // Check if in final (round 3 match exists with managed club)
  const finalMatch = bracket.matches.find(m => m.round === 3 && !m.winnerId &&
    (m.homeClubId === managedClubId || m.awayClubId === managedClubId))
  if (finalMatch) {
    return { eliminated: false, isInFinal: true, won: false }
  }

  return { eliminated: false, isInFinal: false, won: false }
}
