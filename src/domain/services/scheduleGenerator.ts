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

export interface MatchdaySlot {
  matchday: number
  type: 'league' | 'cup' | 'playoff'
  leagueRound?: number
  cupRound?: number
  date: string
}

// Cup rounds are inserted after these league rounds
const CUP_AFTER_LEAGUE_ROUND: Record<number, number> = {
  2: 1,   // Cup förstarunda after liga omg 2 → matchday 3
  6: 2,   // Cup kvartsfinal after liga omg 6 → matchday 8
  10: 3,  // Cup semifinal after liga omg 10 → matchday 13
  15: 4,  // Cup final after liga omg 15 → matchday 19
}

/**
 * Builds an ordered calendar of matchdays for a full season.
 * Liga omg 1-22 + 4 cup rounds = 26 matchdays. Playoff starts at 27+.
 */
export function buildSeasonCalendar(season: number): MatchdaySlot[] {
  const calendar: MatchdaySlot[] = []
  let day = 0

  for (let round = 1; round <= 22; round++) {
    day++
    calendar.push({
      matchday: day,
      type: 'league',
      leagueRound: round,
      date: getRoundDate(season, round),
    })

    const cupRound = CUP_AFTER_LEAGUE_ROUND[round]
    if (cupRound) {
      day++
      const d = new Date(getRoundDate(season, round))
      d.setDate(d.getDate() + 3)
      calendar.push({
        matchday: day,
        type: 'cup',
        cupRound,
        date: d.toISOString().slice(0, 10),
      })
    }
  }

  return calendar
}

/**
 * Returns the match date for a given round number and season.
 * Grundserie (rounds 1-22): okt-feb, tätare schema jan-feb.
 * Slutspel (rounds 23+): mars, 3-4 dagar mellan matcher.
 */
/** Returns the date of the third Saturday in March for a given year. */
function thirdSaturdayInMarch(year: number): string {
  const march1DayOfWeek = new Date(year, 2, 1).getDay() // 0=Sun, 6=Sat
  const firstSatDay = 1 + ((6 - march1DayOfWeek + 7) % 7)
  const thirdSatDay = firstSatDay + 14
  return `${year}-03-${String(thirdSatDay).padStart(2, '0')}`
}

export function getRoundDate(season: number, roundNumber: number): string {
  const smFinalDate = thirdSaturdayInMarch(season + 1)
  const ROUND_DATES: Record<number, string> = {
    1:  `${season}-10-08`,
    2:  `${season}-10-15`,
    3:  `${season}-10-22`,
    4:  `${season}-10-29`,
    5:  `${season}-11-05`,
    6:  `${season}-11-12`,
    7:  `${season}-11-26`,
    8:  `${season}-12-26`,
    9:  `${season}-12-30`,
    10: `${season + 1}-01-04`,
    11: `${season + 1}-01-09`,
    12: `${season + 1}-01-14`,
    13: `${season + 1}-01-18`,
    14: `${season + 1}-01-23`,
    15: `${season + 1}-01-28`,
    16: `${season + 1}-02-01`,
    17: `${season + 1}-02-05`,
    18: `${season + 1}-02-09`,
    19: `${season + 1}-02-13`,
    20: `${season + 1}-02-17`,
    21: `${season + 1}-02-21`,
    22: `${season + 1}-02-25`,
    23: `${season + 1}-02-28`,
    24: `${season + 1}-03-02`,
    25: `${season + 1}-03-04`,
    26: `${season + 1}-03-06`,
    27: `${season + 1}-03-08`,
    28: `${season + 1}-03-09`,
    29: `${season + 1}-03-11`,
    30: `${season + 1}-03-13`,
    31: `${season + 1}-03-15`,
    32: smFinalDate,
  }

  if (roundNumber in ROUND_DATES) return ROUND_DATES[roundNumber]

  const lastKnownRound = Math.max(...Object.keys(ROUND_DATES).map(Number))
  const lastDate = new Date(ROUND_DATES[lastKnownRound])
  lastDate.setDate(lastDate.getDate() + (roundNumber - lastKnownRound) * 3)
  return lastDate.toISOString().slice(0, 10)
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
