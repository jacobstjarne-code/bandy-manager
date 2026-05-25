import type { Fixture } from '../entities/Fixture'
import { RIVALRIES } from '../data/rivalries'
import { mulberry32 } from '../utils/random'

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
  weekday: number         // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  tipoffHour: number      // 13-19
  isAnnandagen?: boolean
  isFinaldag?: boolean
  isNyarsbandy?: boolean
  isCupFinalhelgen?: boolean
  isWindowDeadlineDay?: boolean
  /** True for the slot immediately after R6 — marks the landslagsuppehåll anchor.
   *  Player-selection mechanic (truppfrånvaro) is a future feature; this flag is the calendar hook. */
  isLandslagsuppehall?: boolean
}

// Cup played as concentrated October tournament, before liga starts November 1.
// All 4 rounds in October: R1 second weekend, R2 third weekend, R3+R4 last weekend (finalhelgen).
// Returns date + metadata for each cup round (matchday 1-4).
function getCupRoundDate(season: number, cupRound: number): { date: string; weekday: number; tipoffHour: number; isCupFinalhelgen?: boolean } {
  const oct1 = new Date(Date.UTC(season, 9, 1, 12))
  const oct1Dow = oct1.getUTCDay()
  // First Saturday of October
  const firstSatOct = new Date(oct1.getTime() + ((6 - oct1Dow + 7) % 7) * 86400000)

  if (cupRound === 1) {
    // Second Saturday of October (~Oct 8-14)
    const d = new Date(firstSatOct.getTime() + 7 * 86400000)
    return { date: d.toISOString().slice(0, 10), weekday: 6, tipoffHour: 14 }
  }
  if (cupRound === 2) {
    // Third Saturday of October (~Oct 15-21)
    const d = new Date(firstSatOct.getTime() + 14 * 86400000)
    return { date: d.toISOString().slice(0, 10), weekday: 6, tipoffHour: 14 }
  }
  // Cup finalhelgen — last weekend of October (fourth weekend)
  if (cupRound === 3) {
    // Last Saturday of October (semifinal)
    const d = new Date(firstSatOct.getTime() + 21 * 86400000)
    return { date: d.toISOString().slice(0, 10), weekday: 6, tipoffHour: 14, isCupFinalhelgen: true }
  }
  // cupRound === 4: final — Sunday after semifinal (last Sunday of October)
  const d = new Date(firstSatOct.getTime() + 22 * 86400000)
  return { date: d.toISOString().slice(0, 10), weekday: 0, tipoffHour: 14, isCupFinalhelgen: true }
}

// Allowed weekdays per round-type (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
type DayType = 'weekend' | 'tue_fri' | 'wed_fri' | 'fri_only' | 'mixed_VH' | 'tue_wed' | 'sun_only' | 'sat_only' | 'annandagen' | 'final'

const ROUND_DAY_TYPE: Record<number, DayType> = {
  1:  'fri_only',   // Säsongsstart, fredag
  2:  'weekend',
  3:  'tue_fri',
  4:  'weekend',
  5:  'wed_fri',
  6:  'weekend',
  7:  'tue_fri',    // Comeback efter landslagsuppehåll v.47
  8:  'weekend',
  9:  'mixed_VH',   // Sista omgång före jul
  10: 'annandagen', // Fixed Dec 26
  11: 'wed_fri',    // Mellandags-omgång, kan bli nyårsbandy
  12: 'weekend',    // Trettondedags-omgång
  13: 'tue_fri',
  14: 'weekend',
  15: 'tue_fri',
  16: 'weekend',
  17: 'tue_fri',
  18: 'weekend',
  19: 'fri_only',
  20: 'mixed_VH',
  21: 'weekend',
  22: 'mixed_VH',   // Säsongsavslut
  // Slutspel
  23: 'sun_only',
  24: 'tue_wed',
  25: 'fri_only',
  26: 'sat_only',
  27: 'tue_wed',
  28: 'fri_only',
  29: 'weekend',
  30: 'tue_wed',
  31: 'sat_only',
  32: 'final',      // Fixed — tredje lördagen i mars
}

function allowedDaysFor(dayType: DayType): number[] {
  switch (dayType) {
    case 'weekend':    return [6, 0]
    case 'tue_fri':    return [2, 5]
    case 'wed_fri':    return [3, 5]
    case 'fri_only':   return [5]
    case 'tue_wed':    return [2, 3]
    case 'mixed_VH':   return [2, 3, 5, 6, 0]
    case 'sun_only':   return [0]
    case 'sat_only':   return [6]
    case 'annandagen':
    case 'final':      return []
  }
}

function tipoffOptionsFor(weekday: number): number[] {
  if (weekday === 6) return [13, 14, 15, 17]  // Lördag
  if (weekday === 0) return [13, 15]           // Söndag
  if (weekday === 5) return [17, 19]           // Fredag
  return [19]                                  // Tisdag/onsdag
}

// Returns the next occurrence of `weekday` on or after `minDate` (UTC noon)
function nextWeekdayOnOrAfter(minDate: Date, weekday: number): Date {
  const dow = minDate.getUTCDay()
  const daysAhead = (weekday - dow + 7) % 7
  return new Date(minDate.getTime() + daysAhead * 86400000)
}


/**
 * Date windows per round: [minOffset, maxOffset] days from Nov 1 of the season year.
 * Ensures the season stays within a realistic calendar window (Nov–Feb).
 * Nov 1 = offset 0, Dec 26 = offset 55, Feb 28 ≈ offset 119.
 * Liga starts first bandy-day in November. Cup runs Aug–Oct before liga.
 * Landslagsuppehåll: pause ~10 days between R6 (offset ~34-42) and R7 (offset ~48-56),
 * roughly Dec 5-20 pause window.
 */
const ROUND_WINDOWS: Record<number, [number, number]> = {
  1:  [0,   7  ], // Nov 1-8
  2:  [5,   13 ], // Nov 6-14
  3:  [10,  18 ], // Nov 11-19
  4:  [15,  23 ], // Nov 16-24
  5:  [20,  28 ], // Nov 21-29
  6:  [26,  34 ], // Nov 27 - Dec 5
  7:  [38,  46 ], // Dec 9-17 (after landslagsuppehåll ~10 days)
  8:  [43,  51 ], // Dec 14-22
  9:  [48,  54 ], // Dec 19-25 (last round before Annandagen Dec 26)
  // R10 fixed Dec 26 = offset 55
  11: [57,  64 ], // Dec 28 - Jan 4
  12: [62,  70 ], // Jan 3-11
  13: [68,  76 ], // Jan 9-17
  14: [73,  81 ], // Jan 14-22
  15: [78,  86 ], // Jan 19-27
  16: [83,  91 ], // Jan 24 - Feb 1
  17: [88,  96 ], // Jan 29 - Feb 6
  18: [93,  101], // Feb 3-11
  19: [98,  106], // Feb 8-16
  20: [103, 111], // Feb 13-21
  21: [107, 115], // Feb 17-25
  22: [112, 119], // Feb 22 - Mar 1 (hard cap for season end)
}

/**
 * Pick a date for a round from its preferred window, respecting the sequential floor.
 * Returns the first valid bandydag of the correct type at or after max(window_start, floor).
 * Falls back to any bandydag if the day-type has none in range.
 */
function pickRoundDate(
  season: number,
  round: number,
  allowed: number[],
  floor: Date,
  rand: () => number,
): Date {
  const nov1 = new Date(Date.UTC(season, 10, 1, 12))  // Nov 1 = liga season base
  const [minOff, maxOff] = ROUND_WINDOWS[round] ?? [0, 200]
  const windowStart = new Date(nov1.getTime() + minOff * 86400000)
  const effectiveMin = floor > windowStart ? floor : windowStart
  // Collect all valid dates in [effectiveMin, windowEnd]
  const windowEnd = new Date(nov1.getTime() + maxOff * 86400000)
  const candidates: Date[] = []
  for (let d = new Date(effectiveMin); d <= windowEnd; d = new Date(d.getTime() + 86400000)) {
    if (allowed.includes(d.getUTCDay())) candidates.push(new Date(d))
  }
  if (candidates.length > 0) {
    return candidates[Math.floor(rand() * candidates.length)]
  }
  // Nothing in window after floor — use next valid occurrence of a random allowed day
  const pickedDay = allowed[Math.floor(rand() * allowed.length)]
  return nextWeekdayOnOrAfter(effectiveMin, pickedDay)
}

/**
 * Builds an ordered calendar of matchdays for a full season.
 * Cup rounds 1-4 (matchday 1-4): försäsong aug-okt.
 * Liga rounds 1-22 (matchday 5-26): okt-feb, always on bandydagar.
 * Playoff starts at matchday 27+.
 */
export function buildSeasonCalendar(season: number): MatchdaySlot[] {
  const calendar: MatchdaySlot[] = []
  let day = 0

  // CUP-MATCHDAGAR (matchday 1-4, august–october — before liga starts)
  for (let cupRound = 1; cupRound <= 4; cupRound++) {
    day++
    const { date, weekday, tipoffHour, isCupFinalhelgen } = getCupRoundDate(season, cupRound)
    calendar.push({ matchday: day, type: 'cup', cupRound, date, weekday, tipoffHour, isCupFinalhelgen })
  }

  // LIGA-MATCHDAGAR (matchday 5-26, november–february)
  let seqFloor = new Date(Date.UTC(season, 10, 1, 12)) // Sequential floor starts Nov 1

  for (let round = 1; round <= 22; round++) {
    day++

    // Annandagen — always Dec 26, fixed
    if (round === 10) {
      const annDate = `${season}-12-26`
      const annObj = new Date(annDate + 'T12:00:00Z')
      calendar.push({
        matchday: day,
        type: 'league',
        leagueRound: 10,
        date: annDate,
        weekday: annObj.getUTCDay(),
        tipoffHour: 13,
        isAnnandagen: true,
      })
      seqFloor = new Date(Date.UTC(season, 11, 28, 12))
      continue
    }

    const rand = mulberry32(season * 31337 + round * 7919)
    const dayType = ROUND_DAY_TYPE[round] ?? 'mixed_VH'
    const allowed = allowedDaysFor(dayType)
    const pickedDate = pickRoundDate(season, round, allowed, seqFloor, rand)
    const pickedDay = pickedDate.getUTCDay()

    const dateStr = pickedDate.toISOString().slice(0, 10)
    const tipoffHour = (() => {
      const opts = tipoffOptionsFor(pickedDay)
      return opts[Math.floor(rand() * opts.length)]
    })()

    const isWindowDeadlineDay = dateStr.endsWith('-01-31') ? true : undefined
    // R14 is the landslagsuppehåll (pause for VM / World Championship)
    const isLandslagsuppehall = round === 14 ? true : undefined
    calendar.push({
      matchday: day,
      type: 'league',
      leagueRound: round,
      date: dateStr,
      weekday: pickedDay,
      tipoffHour,
      isNyarsbandy: dateStr === `${season}-12-31` ? true : undefined,
      isWindowDeadlineDay,
      isLandslagsuppehall,
    })

    // Sequential floor: next round must start at least 2 days after this one
    seqFloor = new Date(pickedDate.getTime() + 2 * 86400000)
  }

  return calendar
}

/** Returns the date of the third Saturday in March for a given year. */
function thirdSaturdayInMarch(year: number): string {
  const march1DayOfWeek = new Date(Date.UTC(year, 2, 1)).getUTCDay()
  const firstSatDay = 1 + ((6 - march1DayOfWeek + 7) % 7)
  const thirdSatDay = firstSatDay + 14
  return `${year}-03-${String(thirdSatDay).padStart(2, '0')}`
}

// Fallback playoff dates (rounds 23-32): fixed anchors around SM-final in march
function playoffRoundDate(season: number, roundNumber: number): string {
  if (roundNumber === 32) return thirdSaturdayInMarch(season + 1)
  const y1 = season + 1
  const PLAYOFF_ANCHORS: Record<number, string> = {
    23: `${y1}-02-28`, 24: `${y1}-03-02`, 25: `${y1}-03-04`,
    26: `${y1}-03-06`, 27: `${y1}-03-08`, 28: `${y1}-03-09`,
    29: `${y1}-03-11`, 30: `${y1}-03-13`, 31: `${y1}-03-15`,
  }
  return PLAYOFF_ANCHORS[roundNumber] ?? `${y1}-03-${String(15 + (roundNumber - 31) * 3).padStart(2, '0')}`
}

/**
 * Returns the match date for a given round number and season.
 * League rounds (1-22) use buildSeasonCalendar (seeded RNG, sequential, bandydagar).
 * Playoff rounds (23+) use fixed anchor dates.
 */
export function getRoundDate(season: number, roundNumber: number): string {
  if (roundNumber >= 1 && roundNumber <= 22) {
    const calendar = buildSeasonCalendar(season)
    const slot = calendar.find(s => s.type === 'league' && s.leagueRound === roundNumber)
    if (slot) return slot.date
  }
  return playoffRoundDate(season, roundNumber)
}

/**
 * Stamps a fixture array with date + tipoffHour from a calendar slot lookup.
 * Used at generation time in createNewGame, seasonEndProcessor, and cupProcessor.
 */
export function stampFixturesFromCalendar(fixtures: Fixture[], calendar: MatchdaySlot[]): Fixture[] {
  return fixtures.map(f => {
    const slot = calendar.find(s => s.matchday === f.matchday)
    return slot ? { ...f, date: slot.date, tipoffHour: slot.tipoffHour } : f
  })
}

/**
 * Post-processes fixtures to ensure rivalry pairs meet in round 10 (Annandagen, Dec 26).
 * Uses a three-way swap: moves rivalry match to round 10, displaces the two
 * incumbent round-10 matches to vacated slots.
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

    // Already in round 10 — done
    if (result.some(f => f.roundNumber === 10 &&
      ((f.homeClubId === a && f.awayClubId === b) || (f.homeClubId === b && f.awayClubId === a)))) continue

    // Find first-half meeting of A vs B
    const matchAB = result.find(f =>
      f.roundNumber <= firstHalfRounds &&
      ((f.homeClubId === a && f.awayClubId === b) || (f.homeClubId === b && f.awayClubId === a))
    )
    if (!matchAB || matchAB.roundNumber === 10) continue

    const roundX = matchAB.roundNumber

    // Find A's and B's round-10 opponents
    const matchAC = result.find(f =>
      f.roundNumber === 10 && (f.homeClubId === a || f.awayClubId === a)
    )
    const matchBD = result.find(f =>
      f.roundNumber === 10 && (f.homeClubId === b || f.awayClubId === b)
    )
    if (!matchAC || !matchBD || matchAC === matchBD) continue

    const d = matchBD.homeClubId === b ? matchBD.awayClubId : matchBD.homeClubId

    // Move matchAB → round 10, matchAC → round X
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
        if (z === 10 || z === roundX) continue
        const bInZ = result.some(f => f !== matchBD && f.roundNumber === z && (f.homeClubId === b || f.awayClubId === b))
        const dInZ = result.some(f => f !== matchBD && f.roundNumber === z && (f.homeClubId === d || f.awayClubId === d))
        if (!bInZ && !dInZ) { targetForBD = z; break }
      }
    }

    if (targetForBD === null) continue // can't safely place, skip

    matchAB.roundNumber = 10
    matchAC.roundNumber = roundX
    matchBD.roundNumber = targetForBD
  }

  return result
}
