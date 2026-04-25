import { describe, it, expect } from 'vitest'
import { applyPostRoundFlags } from '../processors/postRoundFlagsProcessor'
import { PendingScreen, InboxItemType } from '../../../domain/enums'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import { FixtureStatus } from '../../../domain/enums'

function makeGame(overrides: Partial<SaveGame>): SaveGame {
  return {
    clubs: [],
    players: [],
    inbox: [],
    managedClubId: 'club_a',
    currentSeason: 1,
    onboardingStep: 0,
    ...overrides,
  } as unknown as SaveGame
}

function makeFixture(overrides: Partial<Fixture>): Fixture {
  return {
    id: 'f1',
    homeClubId: 'club_a',
    awayClubId: 'club_b',
    matchday: 11,
    roundNumber: overrides.roundNumber ?? 1,
    status: FixtureStatus.Completed,
    isCup: overrides.isCup ?? false,
    homeScore: 2,
    awayScore: 1,
    events: [],
    ...overrides,
  } as Fixture
}

describe('applyPostRoundFlags', () => {
  it('triggers halvtidssummering at liga-omgång 11', () => {
    const game = makeGame({ pendingScreen: undefined })
    const fixture = makeFixture({ roundNumber: 11, isCup: false })
    const { updatedGame } = applyPostRoundFlags({ game, justCompletedManagedFixture: fixture, nextMatchday: 11 })
    expect(updatedGame.pendingScreen).toBe(PendingScreen.HalfTimeSummary)
  })

  it('does not trigger halvtidssummering for cup fixture at round 11', () => {
    const game = makeGame({ pendingScreen: undefined })
    const fixture = makeFixture({ roundNumber: 11, isCup: true })
    const { updatedGame } = applyPostRoundFlags({ game, justCompletedManagedFixture: fixture, nextMatchday: 11 })
    expect(updatedGame.pendingScreen).toBeUndefined()
  })

  it('does not re-trigger halvtidssummering if already set', () => {
    const game = makeGame({ pendingScreen: PendingScreen.HalfTimeSummary })
    const fixture = makeFixture({ roundNumber: 11, isCup: false })
    const { updatedGame } = applyPostRoundFlags({ game, justCompletedManagedFixture: fixture, nextMatchday: 11 })
    expect(updatedGame.pendingScreen).toBe(PendingScreen.HalfTimeSummary)
  })

  it('increments onboarding step when < 4 and fixture exists', () => {
    const game = makeGame({ onboardingStep: 2 })
    const fixture = makeFixture({})
    const { updatedGame } = applyPostRoundFlags({ game, justCompletedManagedFixture: fixture, nextMatchday: 5 })
    expect(updatedGame.onboardingStep).toBe(3)
  })

  it('does not increment onboarding step beyond 4', () => {
    const game = makeGame({ onboardingStep: 4 })
    const fixture = makeFixture({})
    const { updatedGame } = applyPostRoundFlags({ game, justCompletedManagedFixture: fixture, nextMatchday: 5 })
    expect(updatedGame.onboardingStep).toBe(4)
  })

  it('sets managerFired when finances hit game-over threshold', () => {
    const game = makeGame({
      clubs: [{ id: 'club_a', finances: -2_500_000 } as SaveGame['clubs'][0]],
    })
    const { updatedGame } = applyPostRoundFlags({ game, justCompletedManagedFixture: undefined, nextMatchday: 5 })
    expect(updatedGame.managerFired).toBe(true)
  })

  it('adds finance warning inbox item at license-denial threshold (not warned yet)', () => {
    const game = makeGame({
      clubs: [{ id: 'club_a', finances: -600_000 } as SaveGame['clubs'][0]],
      financeWarningGivenThisSeason: false,
    })
    const { updatedGame } = applyPostRoundFlags({ game, justCompletedManagedFixture: undefined, nextMatchday: 5 })
    const warningItem = updatedGame.inbox.find(i => i.type === InboxItemType.EconomicCrisis)
    expect(warningItem).toBeDefined()
    expect(updatedGame.financeWarningGivenThisSeason).toBe(true)
  })

  it('does not add finance warning twice in same season', () => {
    const game = makeGame({
      clubs: [{ id: 'club_a', finances: -600_000 } as SaveGame['clubs'][0]],
      financeWarningGivenThisSeason: true,
    })
    const { updatedGame } = applyPostRoundFlags({ game, justCompletedManagedFixture: undefined, nextMatchday: 5 })
    const warningItems = updatedGame.inbox.filter(i => i.type === InboxItemType.EconomicCrisis)
    expect(warningItems).toHaveLength(0)
  })
})
