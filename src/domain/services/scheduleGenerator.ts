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

  return [...fixtures, ...secondHalf]
}
