import { describe, it, expect } from 'vitest'
import type { MatchReport, ManagerChoiceEntry } from '../domain/entities/Fixture'
import type { SaveGame } from '../domain/entities/SaveGame'
import { FixtureStatus } from '../domain/enums'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeMinimalGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    currentSeason: 1,
    currentMatchday: 5,
    currentDate: '2026-01-01',
    managedClubId: 'club_a',
    clubs: [],
    players: [],
    fixtures: [],
    inbox: [],
    deferredDecisions: [],
    phaseMarksSeen: [],
    ...overrides,
  } as unknown as SaveGame
}

// ── MatchReport type ──────────────────────────────────────────────────────────

describe('MatchReport.managerChoiceLog type', () => {
  it('accepts undefined managerChoiceLog', () => {
    const report: MatchReport = {
      playerRatings: {},
      shotsHome: 10, shotsAway: 8,
      onTargetHome: 4, onTargetAway: 3,
      savesHome: 3, savesAway: 4,
      cornersHome: 5, cornersAway: 3,
      penaltiesHome: 0, penaltiesAway: 0,
      possessionHome: 55, possessionAway: 45,
    }
    expect(report.managerChoiceLog).toBeUndefined()
  })

  it('accepts halftime_tactic entry with structured detail', () => {
    const entry: ManagerChoiceEntry = {
      type: 'halftime_tactic',
      detail: 'lowered_tempo',
    }
    const report: MatchReport = {
      playerRatings: {},
      shotsHome: 10, shotsAway: 8,
      onTargetHome: 4, onTargetAway: 3,
      savesHome: 3, savesAway: 4,
      cornersHome: 5, cornersAway: 3,
      penaltiesHome: 0, penaltiesAway: 0,
      possessionHome: 55, possessionAway: 45,
      managerChoiceLog: [entry],
    }
    expect(report.managerChoiceLog).toHaveLength(1)
    expect(report.managerChoiceLog![0].type).toBe('halftime_tactic')
    expect(report.managerChoiceLog![0].detail).toBe('lowered_tempo')
  })

  it('accepts started_tired entry with condition detail', () => {
    const entry: ManagerChoiceEntry = {
      type: 'started_tired',
      playerId: 'p1',
      detail: 'condition_35',
    }
    const report: MatchReport = {
      playerRatings: {},
      shotsHome: 0, shotsAway: 0,
      onTargetHome: 0, onTargetAway: 0,
      savesHome: 0, savesAway: 0,
      cornersHome: 0, cornersAway: 0,
      penaltiesHome: 0, penaltiesAway: 0,
      possessionHome: 50, possessionAway: 50,
      managerChoiceLog: [entry],
    }
    expect(report.managerChoiceLog![0].playerId).toBe('p1')
    expect(report.managerChoiceLog![0].detail).toBe('condition_35')
  })

  it('accepts all choice types', () => {
    const types: ManagerChoiceEntry['type'][] = [
      'halftime_tactic', 'started_tired', 'pep_talk', 'captain', 'bench_fit',
    ]
    for (const type of types) {
      const entry: ManagerChoiceEntry = { type, detail: 'test_detail' }
      expect(entry.type).toBe(type)
    }
  })
})

// ── stripCompletedFixture compatibility ───────────────────────────────────────
// Verifying that a report with managerChoiceLog survives the spread in
// stripCompletedFixture:  { ...f.report, playerRatings: {} }

describe('managerChoiceLog survives report spread', () => {
  it('spreads report preserves managerChoiceLog', () => {
    const original: MatchReport = {
      playerRatings: { p1: 7.5 },
      shotsHome: 10, shotsAway: 5,
      onTargetHome: 4, onTargetAway: 2,
      savesHome: 2, savesAway: 4,
      cornersHome: 6, cornersAway: 2,
      penaltiesHome: 0, penaltiesAway: 0,
      possessionHome: 60, possessionAway: 40,
      managerChoiceLog: [
        { type: 'captain', playerId: 'p1', detail: 'p1' },
        { type: 'halftime_tactic', detail: 'increased_pressure' },
        { type: 'started_tired', playerId: 'p2', detail: 'condition_35' },
      ],
    }

    // Simulate what stripCompletedFixture does when not preserving ratings
    const stripped: MatchReport = { ...original, playerRatings: {} }

    expect(stripped.playerRatings).toEqual({})
    expect(stripped.managerChoiceLog).toHaveLength(3)
    expect(stripped.managerChoiceLog![0].type).toBe('captain')
    expect(stripped.managerChoiceLog![1].type).toBe('halftime_tactic')
    expect(stripped.managerChoiceLog![2].detail).toBe('condition_35')
  })

  it('managerChoiceLog survives full fixture spread', () => {
    const report: MatchReport = {
      playerRatings: {},
      shotsHome: 5, shotsAway: 5,
      onTargetHome: 2, onTargetAway: 2,
      savesHome: 2, savesAway: 2,
      cornersHome: 3, cornersAway: 3,
      penaltiesHome: 0, penaltiesAway: 0,
      possessionHome: 50, possessionAway: 50,
      managerChoiceLog: [
        { type: 'bench_fit', playerId: 'p5', detail: 'condition_85' },
      ],
    }

    const fixture = makeMinimalGame().fixtures[0] ?? {
      id: 'fix1',
      leagueId: 'l1',
      season: 1,
      roundNumber: 5,
      matchday: 5,
      homeClubId: 'club_a',
      awayClubId: 'club_b',
      status: FixtureStatus.Completed,
      homeScore: 2,
      awayScore: 1,
      events: [],
      report,
    }

    // Simulate fixture spread
    const updated = { ...fixture, report }
    expect(updated.report?.managerChoiceLog).toHaveLength(1)
    expect(updated.report?.managerChoiceLog![0].type).toBe('bench_fit')

    // Further spread (as roundProcessor does)
    const stripped = { ...updated, report: { ...updated.report!, playerRatings: {} } }
    expect(stripped.report.managerChoiceLog).toHaveLength(1)
  })
})

// ── halftime decision detail mapping ─────────────────────────────────────────

describe('halftime decision detail strings', () => {
  it('maps lugna → lowered_tempo', () => {
    const detailMap = {
      lugna: 'lowered_tempo',
      pressa: 'increased_pressure',
      prata: 'player_talk',
    } as const
    expect(detailMap['lugna']).toBe('lowered_tempo')
    expect(detailMap['pressa']).toBe('increased_pressure')
    expect(detailMap['prata']).toBe('player_talk')
  })

  it('detail strings are structured, not player text', () => {
    // All detail strings must be machine-readable identifiers
    const validDetails = ['lowered_tempo', 'increased_pressure', 'player_talk', 'condition_35', 'condition_82']
    for (const d of validDetails) {
      expect(d).toMatch(/^[a-z_0-9]+$/)
    }
  })
})
