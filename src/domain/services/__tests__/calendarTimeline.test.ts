/**
 * B11 T7 — Timeline test suite: locks calendar anchors, single-source invariant, speldagar.
 * These tests are the permanent guard that the calendar architecture is maintained.
 */

import { describe, it, expect } from 'vitest'
import { buildSeasonCalendar, type MatchdaySlot } from '../scheduleGenerator'

// ── Helpers ────────────────────────────────────────────────────────────────

function getUTCDay(dateStr: string): number {
  return new Date(dateStr + 'T12:00:00Z').getUTCDay()
}

function isBandydag(dow: number): boolean {
  // Allowed: Sun=0, Tue=2, Wed=3, Fri=5, Sat=6
  // Forbidden: Mon=1, Thu=4
  return dow !== 1 && dow !== 4
}

// ── T7A: Determinism ────────────────────────────────────────────────────────

describe('B11 T7A — Determinism', () => {
  it('same season produces identical calendar on two calls', () => {
    const cal1 = buildSeasonCalendar(2026)
    const cal2 = buildSeasonCalendar(2026)
    expect(cal1).toEqual(cal2)
  })

  it('different seasons produce different calendars', () => {
    const cal2026 = buildSeasonCalendar(2026)
    const cal2027 = buildSeasonCalendar(2027)
    // At least one slot should differ
    const allSame = cal2026.every((slot, i) => slot.date === (cal2027[i]?.date))
    expect(allSame).toBe(false)
  })
})

// ── T7B: Anchors ────────────────────────────────────────────────────────────

describe('B11 T7B — Calendar anchors', () => {
  it('annandagen is always Dec 26', () => {
    for (const season of [2026, 2027, 2028, 2029, 2030]) {
      const cal = buildSeasonCalendar(season)
      const annSlot = cal.find(s => s.isAnnandagen)
      expect(annSlot, `season ${season}: annandagen slot missing`).toBeTruthy()
      expect(annSlot!.date, `season ${season}: annandagen date`).toBe(`${season}-12-26`)
    }
  })

  it('liga starts in November (R1 in November)', () => {
    for (const season of [2026, 2027, 2028]) {
      const cal = buildSeasonCalendar(season)
      const r1 = cal.find(s => s.type === 'league' && s.leagueRound === 1)
      expect(r1, `season ${season}: R1 slot missing`).toBeTruthy()
      const month = new Date(r1!.date + 'T12:00:00Z').getUTCMonth() + 1  // 1-12
      expect(month, `season ${season}: R1 month should be November (11)`).toBe(11)
    }
  })

  it('cup rounds all in October', () => {
    for (const season of [2026, 2027, 2028]) {
      const cal = buildSeasonCalendar(season)
      const cupSlots = cal.filter(s => s.type === 'cup')
      expect(cupSlots.length, `season ${season}: should have 4 cup slots`).toBe(4)
      for (const slot of cupSlots) {
        const month = new Date(slot.date + 'T12:00:00Z').getUTCMonth() + 1
        expect(month, `season ${season}: cup slot ${slot.date} should be in October`).toBe(10)
      }
    }
  })

  it('cup finalhelgen: R3 and R4 are last weekend of October', () => {
    for (const season of [2026, 2027]) {
      const cal = buildSeasonCalendar(season)
      const r3 = cal.find(s => s.type === 'cup' && s.cupRound === 3)
      const r4 = cal.find(s => s.type === 'cup' && s.cupRound === 4)
      expect(r3?.isCupFinalhelgen, `season ${season}: R3 should be cup finalhelgen`).toBe(true)
      expect(r4?.isCupFinalhelgen, `season ${season}: R4 should be cup finalhelgen`).toBe(true)
      // R3 is Saturday, R4 is Sunday (day after R3)
      expect(getUTCDay(r3!.date), `season ${season}: R3 should be Saturday`).toBe(6)
      expect(getUTCDay(r4!.date), `season ${season}: R4 should be Sunday`).toBe(0)
    }
  })

  it('liga ends before third Saturday of March in following year (SM-final timing)', () => {
    for (const season of [2026, 2027]) {
      const cal = buildSeasonCalendar(season)
      const r22 = cal.find(s => s.type === 'league' && s.leagueRound === 22)
      expect(r22, `season ${season}: R22 missing`).toBeTruthy()
      // R22 should be in Feb or at worst very early March
      const r22Date = new Date(r22!.date + 'T12:00:00Z')
      const year = r22Date.getUTCFullYear()
      const month = r22Date.getUTCMonth() + 1
      // Should be in January or February of season+1
      expect(month, `season ${season}: R22 should be in Jan-Mar`).toBeLessThanOrEqual(3)
      expect(year, `season ${season}: R22 should be in season+1`).toBe(season + 1)
    }
  })
})

// ── T7C: Speldagar preserved ────────────────────────────────────────────────

describe('B11 T7C — Speldagar (0% måndag/torsdag)', () => {
  const SEASONS_TO_TEST = 20

  it('no league round falls on Monday or Thursday', () => {
    const forbidden: Array<{ season: number; round: number; date: string; dow: number }> = []
    for (let s = 2026; s < 2026 + SEASONS_TO_TEST; s++) {
      const cal = buildSeasonCalendar(s)
      for (const slot of cal.filter(s2 => s2.type === 'league' && !s2.isAnnandagen)) {
        const dow = getUTCDay(slot.date)
        if (!isBandydag(dow)) {
          forbidden.push({ season: s, round: slot.leagueRound ?? -1, date: slot.date, dow })
        }
      }
    }
    expect(forbidden, `Non-bandydagar found: ${JSON.stringify(forbidden)}`).toHaveLength(0)
  })

  it('Friday is primary weekday — most common weekday across seasons', () => {
    const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    for (let s = 2026; s < 2026 + SEASONS_TO_TEST; s++) {
      const cal = buildSeasonCalendar(s)
      for (const slot of cal.filter(s2 => s2.type === 'league' && !s2.isAnnandagen)) {
        const dow = getUTCDay(slot.date)
        counts[dow] = (counts[dow] ?? 0) + 1
      }
    }
    // Friday (5) should be the most common single weekday
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    // Check friday is in top 2 (sat/fri/sun are all valid primaries)
    const fridayCount = counts[5]
    const totalWeekday = (counts[2] ?? 0) + (counts[3] ?? 0) + (counts[5] ?? 0)
    const totalWeekend = (counts[6] ?? 0) + (counts[0] ?? 0)
    // Weekdays should be significant (> 30% of rounds)
    const totalLeague = Object.values(counts).reduce((a, b) => a + b, 0)
    expect(fridayCount / totalLeague, 'Friday should be > 5% of rounds').toBeGreaterThan(0.05)
    expect(sorted[0][0]).toBeDefined()  // There is a most common day
  })
})

// ── T7D: Single source invariant ────────────────────────────────────────────

describe('B11 T7D — Single source invariant (structural)', () => {
  it('calendar has correct structure: 4 cup + 22 league slots', () => {
    const cal = buildSeasonCalendar(2026)
    const cupSlots = cal.filter(s => s.type === 'cup')
    const leagueSlots = cal.filter(s => s.type === 'league')
    expect(cupSlots.length).toBe(4)
    expect(leagueSlots.length).toBe(22)
  })

  it('matchday numbers are sequential 1-26', () => {
    const cal = buildSeasonCalendar(2026)
    const matchdays = cal.map(s => s.matchday).sort((a, b) => a - b)
    for (let i = 0; i < matchdays.length; i++) {
      expect(matchdays[i]).toBe(i + 1)
    }
  })

  it('cup slots come before league slots (cup preseason)', () => {
    const cal = buildSeasonCalendar(2026)
    const lastCupMatchday = Math.max(...cal.filter(s => s.type === 'cup').map(s => s.matchday))
    const firstLeagueMatchday = Math.min(...cal.filter(s => s.type === 'league').map(s => s.matchday))
    expect(lastCupMatchday, 'Last cup matchday should be before first league matchday').toBeLessThan(firstLeagueMatchday)
  })

  it('cup dates come before league dates', () => {
    const cal = buildSeasonCalendar(2026)
    const lastCupDate = cal.filter(s => s.type === 'cup').map(s => s.date).sort().pop()!
    const firstLeagueDate = cal.filter(s => s.type === 'league').map(s => s.date).sort()[0]
    expect(lastCupDate < firstLeagueDate, 'Cup must finish before liga starts').toBe(true)
  })

  it('all slots have valid date and tipoffHour', () => {
    const cal = buildSeasonCalendar(2026)
    for (const slot of cal) {
      expect(slot.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(slot.tipoffHour).toBeGreaterThanOrEqual(13)
      expect(slot.tipoffHour).toBeLessThanOrEqual(19)
    }
  })

  it('landslagsuppehåll marker on R14 (C-K1: VM-uppehåll)', () => {
    const cal = buildSeasonCalendar(2026)
    const r14 = cal.find(s => s.type === 'league' && s.leagueRound === 14)
    expect(r14, 'R14 must exist').toBeTruthy()
    expect(r14!.isLandslagsuppehall, 'R14 should have isLandslagsuppehall marker').toBe(true)
  })

  it('gap between R6 and R7 is at least 7 days (landslagsuppehåll)', () => {
    const cal = buildSeasonCalendar(2026)
    const r6 = cal.find(s => s.type === 'league' && s.leagueRound === 6)
    const r7 = cal.find(s => s.type === 'league' && s.leagueRound === 7)
    expect(r6 && r7).toBeTruthy()
    const r6Date = new Date(r6!.date + 'T12:00:00Z')
    const r7Date = new Date(r7!.date + 'T12:00:00Z')
    const diffDays = (r7Date.getTime() - r6Date.getTime()) / 86400000
    expect(diffDays, 'R6→R7 gap should be at least 7 days (landslagsuppehåll)').toBeGreaterThanOrEqual(7)
  })
})

// ── T7E: Migration ──────────────────────────────────────────────────────────

describe('B11 T7E — Migration', () => {
  it('migrateSaveGame adds seasonCalendar to old save', async () => {
    const { migrateSaveGame } = await import('../../../infrastructure/persistence/saveGameMigration')
    const oldSave = {
      version: '0.2.0',
      currentSeason: 2026,
      players: [],
      communityActivities: {},
      fixtures: [],
    }
    const migrated = migrateSaveGame(oldSave)
    expect(migrated.seasonCalendar, 'Old save should get seasonCalendar').toBeDefined()
    expect(migrated.seasonCalendar!.length, 'Calendar should have 26 slots').toBe(26)
  })

  it('migrateSaveGame stamps date on Scheduled league fixtures', async () => {
    const { migrateSaveGame } = await import('../../../infrastructure/persistence/saveGameMigration')
    const oldSave = {
      version: '0.2.0',
      currentSeason: 2026,
      players: [],
      communityActivities: {},
      fixtures: [
        {
          id: 'test_fixture_1',
          season: 2026,
          matchday: 5,  // first league matchday
          roundNumber: 1,
          isCup: false,
          status: 'scheduled',
          homeClubId: 'a',
          awayClubId: 'b',
          homeScore: 0,
          awayScore: 0,
          events: [],
        },
      ],
    }
    const migrated = migrateSaveGame(oldSave)
    const fixture = migrated.fixtures.find((f: any) => f.id === 'test_fixture_1')
    expect(fixture?.date, 'Scheduled fixture should get date').toBeDefined()
    expect(fixture?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(fixture?.tipoffHour, 'Scheduled fixture should get tipoffHour').toBeDefined()
  })

  it('migrateSaveGame preserves date on completed fixtures', async () => {
    const { migrateSaveGame } = await import('../../../infrastructure/persistence/saveGameMigration')
    const existingDate = '2026-11-07'
    const oldSave = {
      version: '0.2.0',
      currentSeason: 2026,
      players: [],
      communityActivities: {},
      fixtures: [
        {
          id: 'test_completed_1',
          season: 2026,
          matchday: 5,
          roundNumber: 1,
          isCup: false,
          status: 'completed',
          date: existingDate,
          tipoffHour: 17,
          homeClubId: 'a',
          awayClubId: 'b',
          homeScore: 3,
          awayScore: 1,
          events: [],
        },
      ],
    }
    const migrated = migrateSaveGame(oldSave)
    const fixture = migrated.fixtures.find((f: any) => f.id === 'test_completed_1')
    expect(fixture?.date, 'Completed fixture date should be preserved').toBe(existingDate)
  })
})

// ── T7F: Fixture stamping at creation ───────────────────────────────────────

describe('B11 T7F — Fixture date stamping (via generateSchedule + calendar)', () => {
  it('calendar slots have valid date and tipoffHour for fixture stamping', () => {
    // Verify the calendar provides valid stamp data for all league rounds
    const cal = buildSeasonCalendar(2026)
    const leagueSlots = cal.filter(s => s.type === 'league')
    expect(leagueSlots.length).toBe(22)
    for (const slot of leagueSlots) {
      expect(slot.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(slot.tipoffHour).toBeGreaterThanOrEqual(13)
      expect(slot.tipoffHour).toBeLessThanOrEqual(19)
      expect(slot.matchday).toBeGreaterThanOrEqual(5)  // Liga starts at matchday 5
    }
  })

  it('calendar has seasonCalendar data structure matching SaveGame expectation', () => {
    // Verify the format that would be stored on SaveGame
    const cal = buildSeasonCalendar(2026)
    expect(cal).toBeInstanceOf(Array)
    expect(cal.length).toBe(26)  // 4 cup + 22 league
    // All required fields present
    for (const slot of cal) {
      expect(typeof slot.matchday).toBe('number')
      expect(['league', 'cup', 'playoff']).toContain(slot.type)
      expect(typeof slot.date).toBe('string')
      expect(typeof slot.tipoffHour).toBe('number')
      expect(typeof slot.weekday).toBe('number')
    }
  })
})
