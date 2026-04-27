// Verifierar att SM-final-fixture har Studenternas-data
import { generatePlayoffFixtures } from '../domain/services/playoffService'
import { PlayoffRound } from '../domain/enums'
import type { PlayoffSeries } from '../domain/entities/Playoff'
import { pickFinaldagCommentary } from '../domain/services/specialDateService'
import { FINALDAG_COMMENTARY_3X30 } from '../domain/data/specialDateStrings'
import type { SpecialDateContext } from '../domain/data/specialDateStrings'

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

describe('FINALDAG_COMMENTARY_3x30 triggas vid extremt snöfall', () => {
  it('returnerar en 3x30-sträng när matchFormat är 3x30', () => {
    const ctx: SpecialDateContext = {
      isHomePlayer: true,
      homeClubName: 'Testlaget IF',
      awayClubName: 'Motlaget BK',
      arenaName: 'Studenternas IP',
      venueCity: 'Uppsala',
      isPlayerInFinal: true,
      weather: { tempC: -18, condition: 'heavySnow', matchFormat: '3x30' },
    }
    const result = pickFinaldagCommentary(ctx, 2026, 37)
    expect(FINALDAG_COMMENTARY_3X30).toContain(result)
  })
})
