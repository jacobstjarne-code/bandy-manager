// Verifierar att SM-final-fixture har Studenternas-data
import { generatePlayoffFixtures } from '../domain/services/playoffService'
import { PlayoffRound } from '../domain/enums'
import type { PlayoffSeries } from '../domain/entities/Playoff'

describe('SM-final fixture', () => {
  it('har arenaName = Studenternas IP och isFinaldag = true', () => {
    const mockSeries: PlayoffSeries = {
      id: 'playoff_final_s2026',
      round: PlayoffRound.Final,
      homeClubId: 'club_a',
      awayClubId: 'club_b',
      fixtures: [],
      homeWins: 0,
      awayWins: 0,
      winnerId: null,
      loserId: null,
    }
    const fixtures = generatePlayoffFixtures(mockSeries, 2026, 37, 37)
    expect(fixtures).toHaveLength(1)
    const finalFixture = fixtures[0]
    expect(finalFixture.arenaName).toBe('Studenternas IP')
    expect(finalFixture.venueCity).toBe('Uppsala')
    expect(finalFixture.isFinaldag).toBe(true)
  })
})
