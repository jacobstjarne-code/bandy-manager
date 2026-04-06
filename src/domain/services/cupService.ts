import type { CupBracket, CupMatch } from '../entities/Cup'
import type { Fixture } from '../entities/Fixture'
import { FixtureStatus } from '../enums'

// Matchdays for cup rounds — between liga rounds, never overlapping
const CUP_MATCHDAYS: Record<number, number> = {
  1: 3,   // förstarunda: after liga omg 2
  2: 8,   // kvartsfinal: after liga omg 6
  3: 13,  // semifinal: after liga omg 10
  4: 19,  // final: after liga omg 15
}

export function generateCupFixtures(
  teamIds: string[],  // should be sorted by reputation desc — first 4 are top seeds (get byes)
  season: number,
  rand: () => number,
): { bracket: CupBracket; fixtures: Fixture[] } {
  // Top 4 teams get byes into round 2 (quarterfinals)
  // Bottom 8 teams play round 1 (play-in)
  const byeTeams = teamIds.slice(0, 4)
  const playInTeams = [...teamIds.slice(4)]

  // Shuffle play-in teams for random round 1 pairings
  for (let i = playInTeams.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[playInTeams[i], playInTeams[j]] = [playInTeams[j], playInTeams[i]]
  }

  const matches: CupMatch[] = []
  const fixtures: Fixture[] = []

  // Round 1: 4 matches among the bottom 8 teams
  const numR1Matches = Math.floor(playInTeams.length / 2)
  for (let i = 0; i < numR1Matches; i++) {
    const homeClubId = playInTeams[i * 2]
    const awayClubId = playInTeams[i * 2 + 1]
    const fixtureId = `cup-r1-m${i}`

    const fixture: Fixture = {
      id: fixtureId,
      leagueId: `league_${season}`,
      season,
      roundNumber: 1,
      matchday: CUP_MATCHDAYS[1],
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

  // Byes for top 4 teams — auto-advance to round 2 (no real match)
  for (let i = 0; i < byeTeams.length; i++) {
    const byeId = byeTeams[i]
    const byeMatch: CupMatch = {
      id: `cup-r1-bye${i}`,
      round: 1,
      fixtureId: `cup-r1-bye${i}`,
      homeClubId: byeId,
      awayClubId: 'BYE',
      winnerId: byeId,
      isBye: true,
    }
    matches.push(byeMatch)
  }

  const bracket: CupBracket = {
    season,
    matches,
    byeTeamIds: [...byeTeams],
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
  if (nextRound > 4) {
    return { updatedBracket: bracket, newFixtures: [] }
  }

  // Guard: don't generate if next round already exists in the bracket
  const nextRoundAlreadyExists = bracket.matches.some(m => m.round === nextRound)
  if (nextRoundAlreadyExists) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[cupService] Cup round ${nextRound} already exists — skipping duplicate generation`)
    }
    return { updatedBracket: bracket, newFixtures: [] }
  }

  // Collect winners from completed round — interleave bye-winners with match-winners
  const roundMatches = bracket.matches.filter(m => m.round === completedRound && m.winnerId)
  const byeWinners = roundMatches
    .filter(m => m.isBye)
    .map(m => m.winnerId!)
  const matchWinners = roundMatches
    .filter(m => !m.isBye)
    .map(m => m.winnerId!)

  let winners: string[]
  if (byeWinners.length > 0 && matchWinners.length > 0) {
    winners = []
    const maxLen = Math.max(byeWinners.length, matchWinners.length)
    for (let i = 0; i < maxLen; i++) {
      if (i < byeWinners.length) winners.push(byeWinners[i])
      if (i < matchWinners.length) winners.push(matchWinners[i])
    }
  } else {
    winners = roundMatches.map(m => m.winnerId!)
  }

  if (winners.length < 2) {
    // Not enough winners — cup might be over or something went wrong
    return { updatedBracket: bracket, newFixtures: [] }
  }

  const newMatches: CupMatch[] = []
  const newFixtures: Fixture[] = []

  for (let i = 0; i < Math.floor(winners.length / 2); i++) {
    const homeClubId = winners[i * 2]
    const awayClubId = winners[i * 2 + 1]
    const fixtureId = `cup-r${nextRound}-m${i}`

    const fixture: Fixture = {
      id: fixtureId,
      leagueId: `league_${season}`,
      season,
      roundNumber: nextRound,
      matchday: CUP_MATCHDAYS[nextRound],
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
  if (round === 1) return 'förstarundan'
  if (round === 2) return 'kvartsfinalen'
  if (round === 3) return 'semifinalen'
  return 'finalen'
}

export function getCupRoundLabel(round: number): string {
  if (round === 1) return 'FÖRSTARUNDA'
  if (round === 2) return 'KVARTSFINAL'
  if (round === 3) return 'SEMIFINAL'
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

  // Check if in final (round 4 match exists with managed club)
  const finalMatch = bracket.matches.find(m => m.round === 4 && !m.winnerId &&
    (m.homeClubId === managedClubId || m.awayClubId === managedClubId))
  if (finalMatch) {
    return { eliminated: false, isInFinal: true, won: false }
  }

  return { eliminated: false, isInFinal: false, won: false }
}
