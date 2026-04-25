import { describe, it, expect, vi } from 'vitest'
import { FixtureStatus, PlayoffStatus } from '../../../domain/enums'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'

vi.mock('../playoffTransition', () => ({
  handlePlayoffStart: vi.fn().mockReturnValue({ newGame: null, screen: null }),
}))
vi.mock('../seasonEndProcessor', () => ({
  handleSeasonEnd: vi.fn().mockReturnValue({ newGame: null, screen: null }),
}))

import { derivePreRoundContext } from '../processors/preRoundContextProcessor'

function makeFixture(overrides: Partial<Fixture>): Fixture {
  return {
    id: overrides.id ?? 'f1',
    homeClubId: overrides.homeClubId ?? 'club_a',
    awayClubId: overrides.awayClubId ?? 'club_b',
    matchday: overrides.matchday ?? 1,
    roundNumber: overrides.roundNumber ?? 1,
    status: overrides.status ?? FixtureStatus.Scheduled,
    isCup: overrides.isCup ?? false,
    homeScore: overrides.homeScore ?? null,
    awayScore: overrides.awayScore ?? null,
    events: [],
    ...overrides,
  } as Fixture
}

function makeGame(overrides: Partial<SaveGame>): SaveGame {
  return {
    fixtures: [],
    managedClubId: 'club_a',
    currentSeason: 1,
    playoffBracket: null,
    ...overrides,
  } as unknown as SaveGame
}

describe('derivePreRoundContext', () => {
  it('returns earlyReturn for playoff start when no league fixtures and no bracket', () => {
    const game = makeGame({
      fixtures: [makeFixture({ status: FixtureStatus.Completed, isCup: false })],
      playoffBracket: null,
    })
    const result = derivePreRoundContext(game)
    expect(result.kind).toBe('earlyReturn')
  })

  it('returns earlyReturn for season end when bracket completed and no cup fixtures', () => {
    const game = makeGame({
      fixtures: [makeFixture({ status: FixtureStatus.Completed, isCup: false })],
      playoffBracket: { status: PlayoffStatus.Completed } as SaveGame['playoffBracket'],
    })
    const result = derivePreRoundContext(game)
    expect(result.kind).toBe('earlyReturn')
  })

  it('proceeds when cup still running after bracket completed', () => {
    const game = makeGame({
      fixtures: [
        makeFixture({ id: 'cup1', status: FixtureStatus.Scheduled, isCup: true, matchday: 5 }),
      ],
      playoffBracket: { status: PlayoffStatus.Completed } as SaveGame['playoffBracket'],
    })
    const result = derivePreRoundContext(game)
    expect(result.kind).toBe('proceed')
  })

  it('detects isSecondPass when all AI fixtures completed but managed fixture still scheduled', () => {
    const game = makeGame({
      managedClubId: 'club_a',
      fixtures: [
        makeFixture({ id: 'ai1', homeClubId: 'club_b', awayClubId: 'club_c', matchday: 1, status: FixtureStatus.Completed }),
        makeFixture({ id: 'managed', homeClubId: 'club_a', awayClubId: 'club_b', matchday: 1, status: FixtureStatus.Scheduled }),
      ],
    })
    const result = derivePreRoundContext(game)
    expect(result.kind).toBe('proceed')
    if (result.kind === 'proceed') {
      expect(result.context.isSecondPassForManagedMatch).toBe(true)
    }
  })

  it('isSecondPass false on first pass (managed not yet simmed, AI not yet done)', () => {
    const game = makeGame({
      managedClubId: 'club_a',
      fixtures: [
        makeFixture({ id: 'ai1', homeClubId: 'club_b', awayClubId: 'club_c', matchday: 1, status: FixtureStatus.Scheduled }),
        makeFixture({ id: 'managed', homeClubId: 'club_a', awayClubId: 'club_d', matchday: 1, status: FixtureStatus.Scheduled }),
      ],
    })
    const result = derivePreRoundContext(game)
    expect(result.kind).toBe('proceed')
    if (result.kind === 'proceed') {
      expect(result.context.isSecondPassForManagedMatch).toBe(false)
    }
  })

  it('correctly sets isCupRound, isPlayoffRound, currentLeagueRound for a cup matchday', () => {
    const game = makeGame({
      fixtures: [
        // Cup round at matchday 3 — next to play
        makeFixture({ id: 'cup1', isCup: true, matchday: 3, roundNumber: 1 }),
        // Future league rounds — keeps scheduledLeagueFixtures.length > 0 (no early return)
        makeFixture({ id: 'l5', isCup: false, matchday: 5, roundNumber: 5 }),
        makeFixture({ id: 'l6', isCup: false, matchday: 6, roundNumber: 6 }),
      ],
      playoffBracket: null,
    })
    const result = derivePreRoundContext(game)
    expect(result.kind).toBe('proceed')
    if (result.kind === 'proceed') {
      expect(result.context.isCupRound).toBe(true)
      expect(result.context.isPlayoffRound).toBe(false)
      expect(result.context.currentLeagueRound).toBe(null)
      expect(result.context.nextMatchday).toBe(3)
    }
  })

  it('correctly sets currentLeagueRound for a league round', () => {
    const game = makeGame({
      fixtures: [
        makeFixture({ id: 'l4', isCup: false, matchday: 4, roundNumber: 4 }),
        makeFixture({ id: 'l5', isCup: false, matchday: 5, roundNumber: 5 }),
      ],
      playoffBracket: null,
    })
    const result = derivePreRoundContext(game)
    expect(result.kind).toBe('proceed')
    if (result.kind === 'proceed') {
      expect(result.context.isCupRound).toBe(false)
      expect(result.context.currentLeagueRound).toBe(4)
    }
  })
})
