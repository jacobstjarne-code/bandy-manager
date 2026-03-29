import { RIVALRIES } from '../data/rivalries'

export interface ScheduleFixture {
  homeClubId: string
  awayClubId: string
  roundNumber: number
}

/**
 * Generates a double round-robin schedule for N teams using the circle method.
 * For N teams: N-1 rounds in the first half, N-1 rounds in the second half (swapping home/away).
 * Each round has N/2 matches. For 12 teams: 22 rounds, 6 matches per round, 132 total fixtures.
 *
 * If N is odd, a dummy team is added so every team gets a bye each round.
 */
export function generateSchedule(teamIds: string[], _season: number): ScheduleFixture[] {
  const ids = [...teamIds]
  const hasOdd = ids.length % 2 !== 0
  if (hasOdd) {
    ids.push('__bye__')
  }

  const n = ids.length
  const rounds = n - 1
  const matchesPerRound = n / 2

  const fixtures: ScheduleFixture[] = []

  // Circle method: fix ids[0], rotate ids[1..n-1]
  const fixed = ids[0]
  const rotating = ids.slice(1)

  for (let round = 0; round < rounds; round++) {
    const roundTeams = [fixed, ...rotating]

    for (let i = 0; i < matchesPerRound; i++) {
      const home = roundTeams[i]
      const away = roundTeams[n - 1 - i]

      // Skip fixtures involving the bye team
      if (home === '__bye__' || away === '__bye__') continue

      fixtures.push({
        homeClubId: home,
        awayClubId: away,
        roundNumber: round + 1,
      })
    }

    // Rotate: move last element of rotating to the front
    rotating.unshift(rotating.pop() as string)
  }

  // Second half: swap home/away for all first-half fixtures
  const secondHalf = fixtures.map((f) => ({
    homeClubId: f.awayClubId,
    awayClubId: f.homeClubId,
    roundNumber: f.roundNumber + rounds,
  }))

  const allFixtures = [...fixtures, ...secondHalf]
  return enforceAnnandagenDerbies(allFixtures, teamIds, rounds)
}

/**
 * Post-processes fixtures to ensure rivalry pairs meet in round 8 (Annandagen).
 * Uses a three-way swap: moves rivalry match to round 8, displaces the two
 * incumbent round-8 matches to vacated slots.
 */
function enforceAnnandagenDerbies(
  fixtures: ScheduleFixture[],
  teamIds: string[],
  firstHalfRounds: number,
): ScheduleFixture[] {
  const result = fixtures.map(f => ({ ...f }))
  const teamSet = new Set(teamIds)

  for (const rivalry of RIVALRIES) {
    const [a, b] = rivalry.clubIds
    if (!teamSet.has(a) || !teamSet.has(b)) continue

    // Already in round 8 — done
    if (result.some(f => f.roundNumber === 8 &&
      ((f.homeClubId === a && f.awayClubId === b) || (f.homeClubId === b && f.awayClubId === a)))) continue

    // Find first-half meeting of A vs B
    const matchAB = result.find(f =>
      f.roundNumber <= firstHalfRounds &&
      ((f.homeClubId === a && f.awayClubId === b) || (f.homeClubId === b && f.awayClubId === a))
    )
    if (!matchAB || matchAB.roundNumber === 8) continue

    const roundX = matchAB.roundNumber

    // Find A's and B's round-8 opponents
    const matchAC = result.find(f =>
      f.roundNumber === 8 && (f.homeClubId === a || f.awayClubId === a)
    )
    const matchBD = result.find(f =>
      f.roundNumber === 8 && (f.homeClubId === b || f.awayClubId === b)
    )
    if (!matchAC || !matchBD || matchAC === matchBD) continue

    const d = matchBD.homeClubId === b ? matchBD.awayClubId : matchBD.homeClubId

    // Move matchAB → round 8, matchAC → round X
    // Now find a home for matchBD: try round X first (B and D are both free there after the swap)
    const dInRoundX = result.some(f =>
      f !== matchAB && f !== matchAC && f !== matchBD &&
      f.roundNumber === roundX && (f.homeClubId === d || f.awayClubId === d)
    )

    let targetForBD: number | null = null
    if (!dInRoundX) {
      targetForBD = roundX
    } else {
      // Find any round where neither B nor D currently plays
      const maxRound = Math.max(...result.map(f => f.roundNumber))
      for (let z = 1; z <= maxRound; z++) {
        if (z === 8 || z === roundX) continue
        const bInZ = result.some(f => f !== matchBD && f.roundNumber === z && (f.homeClubId === b || f.awayClubId === b))
        const dInZ = result.some(f => f !== matchBD && f.roundNumber === z && (f.homeClubId === d || f.awayClubId === d))
        if (!bInZ && !dInZ) { targetForBD = z; break }
      }
    }

    if (targetForBD === null) continue // can't safely place, skip

    matchAB.roundNumber = 8
    matchAC.roundNumber = roundX
    matchBD.roundNumber = targetForBD
  }

  return result
}
