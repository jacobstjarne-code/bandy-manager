import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { getNextOpponentTeaserFacts } from '../nextOpponentTeaserService'
import { FixtureStatus } from '../../enums'

const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 4 })

describe('getNextOpponentTeaserFacts — B3 (2026-07-19, datadelen)', () => {
  it('returnerar null utan schemalagd nästa match', () => {
    const game = { ...base, fixtures: base.fixtures.map(f => ({ ...f, status: FixtureStatus.Completed, homeScore: 1, awayScore: 1 })) }
    expect(getNextOpponentTeaserFacts(game)).toBeNull()
  })

  it('identifierar motståndare + hemma/borta korrekt', () => {
    const facts = getNextOpponentTeaserFacts(base)
    expect(facts).not.toBeNull()
    expect(facts!.opponentName).toBeTruthy()
    expect(typeof facts!.isHome).toBe('boolean')
  })

  it('räknar motståndarens form ur avslutade ligamatcher (max 5, äldst→nyast)', () => {
    const nextFixture = base.fixtures.filter(f => f.status === FixtureStatus.Scheduled).sort((a, b) => a.matchday - b.matchday)[0]
    const managedId = base.managedClubId
    const opponentId = nextFixture.homeClubId === managedId ? nextFixture.awayClubId : nextFixture.homeClubId

    // Bygg 3 avslutade matcher för motståndaren mot en tredje klubb: V, F, O
    const thirdClubId = base.clubs.find(c => c.id !== managedId && c.id !== opponentId)!.id
    const priorFixtures = [
      { id: 'prior1', homeClubId: opponentId, awayClubId: thirdClubId, matchday: 1, roundNumber: 1, season: 2025, isCup: false, status: FixtureStatus.Completed, homeScore: 3, awayScore: 1, date: '2025-10-01' },
      { id: 'prior2', homeClubId: thirdClubId, awayClubId: opponentId, matchday: 2, roundNumber: 2, season: 2025, isCup: false, status: FixtureStatus.Completed, homeScore: 4, awayScore: 0, date: '2025-10-08' },
      { id: 'prior3', homeClubId: opponentId, awayClubId: thirdClubId, matchday: 3, roundNumber: 3, season: 2025, isCup: false, status: FixtureStatus.Completed, homeScore: 2, awayScore: 2, date: '2025-10-15' },
    ] as never[]

    const game = { ...base, fixtures: [...priorFixtures, ...base.fixtures] }
    const facts = getNextOpponentTeaserFacts(game)
    expect(facts!.opponentForm).toEqual(['V', 'F', 'O'])
  })

  it('hittar tidigare möte denna säsong mellan de två klubbarna', () => {
    const nextFixture = base.fixtures.filter(f => f.status === FixtureStatus.Scheduled).sort((a, b) => a.matchday - b.matchday)[0]
    const managedId = base.managedClubId
    const opponentId = nextFixture.homeClubId === managedId ? nextFixture.awayClubId : nextFixture.homeClubId

    const priorMeeting = {
      id: 'prior_meeting', homeClubId: opponentId, awayClubId: managedId, matchday: 1, roundNumber: 1,
      season: 2025, isCup: false, status: FixtureStatus.Completed, homeScore: 2, awayScore: 4, date: '2025-10-01',
    } as never

    const game = { ...base, fixtures: [priorMeeting, ...base.fixtures] }
    const facts = getNextOpponentTeaserFacts(game)
    expect(facts!.previousMeetingThisSeason).not.toBeNull()
    expect(facts!.previousMeetingThisSeason!.managedScore).toBe(4)
    expect(facts!.previousMeetingThisSeason!.opponentScore).toBe(2)
    expect(facts!.previousMeetingThisSeason!.isHome).toBe(false)
  })

  it('returnerar null för tidigare möte om inget spelats denna säsong', () => {
    const facts = getNextOpponentTeaserFacts(base)
    expect(facts!.previousMeetingThisSeason).toBeNull()
  })
})
