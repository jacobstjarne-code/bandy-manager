import { describe, expect, it } from 'vitest'
import type { Fixture } from '../domain/entities/Fixture'
import type { SaveGame } from '../domain/entities/SaveGame'
import { generateMatchStory } from '../domain/utils/matchStory'
import { getRecentMatchRatings } from '../presentation/components/playerCardUtils'

function fixture(): Fixture {
  return {
    id: 'semi', leagueId: 'league', season: 1, roundNumber: 3, matchday: 25,
    homeClubId: 'home', awayClubId: 'away', status: 'completed',
    homeScore: 2, awayScore: 2, isCup: true, isKnockout: true,
    penaltyResult: { home: 5, away: 4 }, events: [],
    report: { playerRatings: { p1: 7.2 } },
  } as Fixture
}

describe('utslagsutfall på berättande ytor', () => {
  it('matchberättelsen säger straffseger och strafförlust, aldrig oavgjort', () => {
    const base = { clubs: [
      { id: 'home', shortName: 'Hemma' }, { id: 'away', shortName: 'Borta' },
    ], players: [] } as unknown as SaveGame
    expect(generateMatchStory(fixture(), { ...base, managedClubId: 'home' })).toContain('Seger efter straffar')
    expect(generateMatchStory(fixture(), { ...base, managedClubId: 'away' })).toContain('Förlust efter straffar')
  })

  it('spelarkortets formrad bokför straffsegern som V', () => {
    const clubs = [{ id: 'home', shortName: 'Hemma' }, { id: 'away', shortName: 'Borta' }] as never
    expect(getRecentMatchRatings([fixture()], clubs, 'p1', 'home')[0].result).toBe('V')
    expect(getRecentMatchRatings([fixture()], clubs, 'p1', 'away')[0].result).toBe('F')
  })
})
