import { describe, it, expect } from 'vitest'
import { collectActiveMemories } from '../domain/services/clubMemoryService'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { Moment } from '../domain/entities/Moment'

const MANAGED_CLUB_ID = 'club_managed'

function makeMinimalGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    currentSeason: 3,
    currentMatchday: 10,
    currentDate: '2026-01-01',
    managedClubId: MANAGED_CLUB_ID,
    clubs: [],
    players: [],
    fixtures: [],
    inbox: [],
    phaseMarksSeen: [],
    ...overrides,
  } as unknown as SaveGame
}

// ── helpers ───────────────────────────────────────────────────────────────────

function makeMoment(overrides: Partial<Moment> = {}): Moment {
  return {
    id: 'm1',
    source: 'derby_win',
    matchday: 9,
    season: 3,
    title: 'Derby-seger',
    body: 'Vi vann derbyt.',
    ...overrides,
  }
}

// ── empty game ────────────────────────────────────────────────────────────────

describe('collectActiveMemories', () => {
  it('returns empty list for empty game', () => {
    const result = collectActiveMemories(makeMinimalGame())
    expect(result).toEqual([])
  })

  // ── sources ──────────────────────────────────────────────────────────────────

  it('maps derby_win moment → triumph', () => {
    const game = makeMinimalGame({ recentMoments: [makeMoment({ source: 'derby_win' })] })
    const result = collectActiveMemories(game)
    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('moment')
    expect(result[0].kind).toBe('triumph')
    expect(result[0].title).toBe('Derby-seger')
  })

  it('maps star_injury moment → scar', () => {
    const game = makeMinimalGame({ recentMoments: [makeMoment({ source: 'star_injury', title: 'Skada', body: '...' })] })
    const result = collectActiveMemories(game)
    expect(result[0].kind).toBe('scar')
  })

  it('maps nemesis_signed moment → tension', () => {
    const game = makeMinimalGame({ recentMoments: [makeMoment({ source: 'nemesis_signed', title: 'Nemesis värvad', body: '...' })] })
    const result = collectActiveMemories(game)
    expect(result[0].kind).toBe('tension')
  })

  it('includes klackEcho when currentWeight > 0 → triumph for derby_win', () => {
    const game = makeMinimalGame({
      klackEcho: {
        type: 'derby_win',
        resultMatchday: 8,
        initialWeight: 60,
        currentWeight: 40,
        decayPerRound: 15,
      },
    })
    const result = collectActiveMemories(game)
    expect(result.some(m => m.source === 'klack' && m.kind === 'triumph')).toBe(true)
  })

  it('excludes klackEcho when currentWeight = 0', () => {
    const game = makeMinimalGame({
      klackEcho: {
        type: 'derby_win',
        resultMatchday: 8,
        initialWeight: 60,
        currentWeight: 0,
        decayPerRound: 15,
      },
    })
    const result = collectActiveMemories(game)
    expect(result.some(m => m.source === 'klack')).toBe(false)
  })

  it('includes journalist memories (last 1-2 entries)', () => {
    const game = makeMinimalGame({
      journalist: {
        name: 'Lars',
        outlet: 'Gefle Dagblad',
        persona: 'analytical',
        style: 'neutral',
        relationship: 50,
        pressRefusals: 0,
        memory: [
          { season: 3, matchday: 5, event: 'good_answer', sentiment: 8 },
          { season: 3, matchday: 9, event: 'big_win', sentiment: 6 },
        ],
      },
    })
    const result = collectActiveMemories(game)
    const journalistMemories = result.filter(m => m.source === 'journalist')
    expect(journalistMemories).toHaveLength(2)
    // Both entries present; output is weight-sorted so we check by set
    const titles = new Set(journalistMemories.map(m => m.title))
    expect(titles).toContain('good_answer')
    expect(titles).toContain('big_win')
  })

  it('only includes last 2 journalist entries even if more exist', () => {
    const game = makeMinimalGame({
      journalist: {
        name: 'Lars',
        outlet: 'Gefle Dagblad',
        persona: 'analytical',
        style: 'neutral',
        relationship: 50,
        pressRefusals: 0,
        memory: [
          { season: 2, matchday: 1, event: 'refused_press', sentiment: -5 },
          { season: 3, matchday: 3, event: 'crisis', sentiment: -8 },
          { season: 3, matchday: 5, event: 'good_answer', sentiment: 7 },
          { season: 3, matchday: 9, event: 'big_win', sentiment: 9 },
        ],
      },
    })
    const result = collectActiveMemories(game)
    const journalistMemories = result.filter(m => m.source === 'journalist')
    expect(journalistMemories).toHaveLength(2)
  })

  it('includes nemesis with goalsAgainstUs >= 3 → tension', () => {
    const game = makeMinimalGame({
      nemesisTracker: {
        p1: { playerId: 'p1', name: 'Anders Ek', clubId: 'club_rival', goalsAgainstUs: 4 },
      },
    })
    const result = collectActiveMemories(game)
    expect(result.some(m => m.source === 'nemesis' && m.kind === 'tension')).toBe(true)
    expect(result.find(m => m.source === 'nemesis')?.subjectPlayerId).toBe('p1')
  })

  it('excludes nemesis with goalsAgainstUs < 3', () => {
    const game = makeMinimalGame({
      nemesisTracker: {
        p1: { playerId: 'p1', name: 'Anders Ek', clubId: 'club_rival', goalsAgainstUs: 2 },
      },
    })
    const result = collectActiveMemories(game)
    expect(result.some(m => m.source === 'nemesis')).toBe(false)
  })

  it('includes rival_sale within 5 rounds → scar', () => {
    const game = makeMinimalGame({ lastRivalSaleMatchday: 7 }) // currentMatchday=10, diff=3
    const result = collectActiveMemories(game)
    expect(result.some(m => m.source === 'rival_sale' && m.kind === 'scar')).toBe(true)
  })

  it('excludes rival_sale older than 5 rounds', () => {
    const game = makeMinimalGame({ lastRivalSaleMatchday: 4 }) // currentMatchday=10, diff=6
    const result = collectActiveMemories(game)
    expect(result.some(m => m.source === 'rival_sale')).toBe(false)
  })

  it('includes pendingFollowUps → neutral', () => {
    const game = makeMinimalGame({
      pendingFollowUps: [
        { id: 'fu1', triggerEventId: 'ev1', matchdaysDelay: 3, createdMatchday: 8, type: 'injury_recovery' },
      ],
    })
    const result = collectActiveMemories(game)
    expect(result.some(m => m.source === 'follow_up' && m.kind === 'neutral')).toBe(true)
  })

  it('includes unseen bandyLetters → triumph', () => {
    const game = makeMinimalGame({
      bandyLetters: [
        { id: 'bl1', senderName: 'Erik', senderAge: 12, senderOrigin: 'Sandviken', season: 3, text: 'Heja!', savedInArchive: false },
      ],
    })
    const result = collectActiveMemories(game)
    expect(result.some(m => m.source === 'letter' && m.kind === 'triumph')).toBe(true)
  })

  it('excludes archived bandyLetters', () => {
    const game = makeMinimalGame({
      bandyLetters: [
        { id: 'bl1', senderName: 'Erik', senderAge: 12, senderOrigin: 'Sandviken', season: 3, text: 'Heja!', savedInArchive: true },
      ],
    })
    const result = collectActiveMemories(game)
    expect(result.some(m => m.source === 'letter')).toBe(false)
  })

  it('includes boardObjectiveHistory → triumph for met, scar for failed', () => {
    const game = makeMinimalGame({
      boardObjectiveHistory: [
        { season: 2, objectiveId: 'top4', result: 'met', ownerReaction: 'Bra!' },
        { season: 3, objectiveId: 'youth', result: 'failed', ownerReaction: 'Synd.' },
      ],
    })
    const result = collectActiveMemories(game)
    const boardMemories = result.filter(m => m.source === 'board_history')
    expect(boardMemories.some(m => m.kind === 'triumph')).toBe(true)
    expect(boardMemories.some(m => m.kind === 'scar')).toBe(true)
  })

  it('includes economicCrisisState when phase != resolved → scar', () => {
    const game = makeMinimalGame({
      economicCrisisState: {
        startedSeason: 3,
        startedMatchday: 5,
        phase: 'pressure',
        eventsFired: [],
      },
    })
    const result = collectActiveMemories(game)
    expect(result.some(m => m.source === 'economic_crisis' && m.kind === 'scar')).toBe(true)
  })

  it('excludes economicCrisisState when phase = resolved', () => {
    const game = makeMinimalGame({
      economicCrisisState: {
        startedSeason: 3,
        startedMatchday: 5,
        phase: 'resolved',
        eventsFired: [],
        outcome: 'mecenat',
      },
    })
    const result = collectActiveMemories(game)
    expect(result.some(m => m.source === 'economic_crisis')).toBe(false)
  })

  // ── weight sorting ────────────────────────────────────────────────────────

  it('sorts memories by weight descending', () => {
    // moment (base 70, very recent) > rival_sale (base 65, older) scenario
    const game = makeMinimalGame({
      recentMoments: [makeMoment({ matchday: 10, source: 'derby_win' })],
      lastRivalSaleMatchday: 6,  // diff = 4, recency = max(0.2, 1-0.4) = 0.6
    })
    const result = collectActiveMemories(game)
    expect(result.length).toBeGreaterThanOrEqual(2)
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].weight).toBeGreaterThanOrEqual(result[i].weight)
    }
  })

  // ── snapshot test: rich game state ────────────────────────────────────────

  it('snapshot: rich game state produces expected memory stream', () => {
    const game = makeMinimalGame({
      recentMoments: [
        makeMoment({ id: 'derby', source: 'derby_win', matchday: 9, title: 'Derby-seger', body: 'Vi vann.' }),
      ],
      klackEcho: {
        type: 'top_team_win',
        resultMatchday: 8,
        initialWeight: 60,
        currentWeight: 30,
        decayPerRound: 15,
      },
      nemesisTracker: {
        p99: { playerId: 'p99', name: 'Jonas Berg', clubId: 'club_rival', goalsAgainstUs: 5 },
      },
      lastRivalSaleMatchday: 8,
      boardObjectiveHistory: [
        { season: 2, objectiveId: 'top4', result: 'met', ownerReaction: 'Bra!' },
      ],
    })

    const result = collectActiveMemories(game)

    // Verify all expected sources are present
    const sources = result.map(m => m.source)
    expect(sources).toContain('moment')
    expect(sources).toContain('klack')
    expect(sources).toContain('nemesis')
    expect(sources).toContain('rival_sale')
    expect(sources).toContain('board_history')

    // Verify weight ordering
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].weight).toBeGreaterThanOrEqual(result[i].weight)
    }

    // Snapshot the keys (not exact weights since they're deterministic but verbose)
    expect(result.map(m => m.source)).toMatchSnapshot()
    expect(result.map(m => m.kind)).toMatchSnapshot()
  })
})
