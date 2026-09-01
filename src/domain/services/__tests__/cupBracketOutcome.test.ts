import { describe, expect, it } from 'vitest'
import type { CupBracket } from '../../entities/Cup'
import type { Fixture } from '../../entities/Fixture'
import { FixtureStatus } from '../../enums'
import { updateCupBracketAfterRound } from '../cupService'

function bracket(): CupBracket {
  return {
    season: 1,
    status: 'in_progress',
    matches: [{ id: 'm1', round: 1, homeClubId: 'home', awayClubId: 'away', fixtureId: 'fx' }],
  } as CupBracket
}

function fixture(overrides: Partial<Fixture>): Fixture {
  return {
    id: 'fx', season: 1, leagueId: 'cup', roundNumber: 1, matchday: 1,
    homeClubId: 'home', awayClubId: 'away', homeScore: 4, awayScore: 4,
    status: FixtureStatus.Completed, events: [], isCup: true, isKnockout: true,
    ...overrides,
  } as Fixture
}

describe('updateCupBracketAfterRound', () => {
  it('does not gift an undecided draw to the home club', () => {
    const updated = updateCupBracketAfterRound(bracket(), [fixture({})])
    expect(updated.matches[0].winnerId).toBeUndefined()
  })

  it('uses the penalty winner even while the raw score is level', () => {
    const updated = updateCupBracketAfterRound(bracket(), [fixture({ penaltyResult: { home: 3, away: 4 } })])
    expect(updated.matches[0].winnerId).toBe('away')
  })

  it('uses the overtime winner even while the raw score is level', () => {
    const updated = updateCupBracketAfterRound(bracket(), [fixture({ overtimeResult: 'home' })])
    expect(updated.matches[0].winnerId).toBe('home')
  })
})
