import { describe, expect, it } from 'vitest'
import type { Fixture } from '../../entities/Fixture'
import { generateSilentMatchReport } from '../silentMatchReportService'

function penaltyFixture(home: number, away: number): Fixture {
  return {
    id: 'cup', leagueId: 'league', season: 1, roundNumber: 4, matchday: 24,
    homeClubId: 'home', awayClubId: 'away', status: 'completed',
    homeScore: 2, awayScore: 2, isCup: true, isKnockout: true,
    wentToPenalties: true, penaltyResult: { home, away }, events: [],
  } as Fixture
}

describe('generateSilentMatchReport — utslagsmatcher', () => {
  it('kallar en straffseger seger och inte poängdelning', () => {
    const report = generateSilentMatchReport(penaltyFixture(4, 3), 'Hemma', 'Borta', 'home')
    expect(report).toContain('efter straffar')
    expect(report).toContain('en dramatisk seger')
    expect(report).not.toContain('delade på poängen')
  })

  it('kallar samma match för förlust ur motståndarens perspektiv', () => {
    const report = generateSilentMatchReport(penaltyFixture(4, 3), 'Hemma', 'Borta', 'away')
    expect(report).toContain('ett bittert slutresultat')
    expect(report).not.toContain('Poängen kan visa sig')
  })
})
