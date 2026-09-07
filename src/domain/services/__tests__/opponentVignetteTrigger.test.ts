import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { isFirstMeetingWithOpponent } from '../opponentVignetteTrigger'
import { FixtureStatus } from '../../enums'

/**
 * matchflode-forbered-linjar ingrepp 3: "första mötet" kan bara vara sant
 * under managerkarriärens allra första säsong (fast dubbel round-robin,
 * 22 omgångar/12 lag — varje klubbpar möts garanterat inom den). Testerna
 * verifierar det direkt, inte via en gissad mock-fixturelista.
 */
describe('isFirstMeetingWithOpponent — liggarfritt, säsongssäkert', () => {
  it('en färsk karriär (säsong 1, inga spelade matcher) är "första mötet" mot alla motståndare', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 3 })
    const otherClubIds = game.clubs.map(c => c.id).filter(id => id !== game.managedClubId)
    for (const opponentId of otherClubIds) {
      expect(isFirstMeetingWithOpponent(game, opponentId)).toBe(true)
    }
  })

  it('efter en spelad match mot en specifik motståndare är den INTE längre "första mötet" mot den klubben (men fortfarande mot en tredje klubb)', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 3 })
    const firstFixture = base.fixtures
      .filter(f => f.homeClubId === base.managedClubId || f.awayClubId === base.managedClubId)
      .sort((a, b) => a.matchday - b.matchday)[0]
    const opponentId = firstFixture.homeClubId === base.managedClubId ? firstFixture.awayClubId : firstFixture.homeClubId
    const thirdClubId = base.clubs.map(c => c.id).find(id => id !== base.managedClubId && id !== opponentId)!

    expect(isFirstMeetingWithOpponent(base, opponentId)).toBe(true)

    const afterFirstMatch = {
      ...base,
      fixtures: base.fixtures.map(f =>
        f.id === firstFixture.id
          ? { ...f, status: FixtureStatus.Completed, homeScore: 3, awayScore: 2 }
          : f,
      ),
    }
    expect(isFirstMeetingWithOpponent(afterFirstMatch, opponentId)).toBe(false)
    expect(isFirstMeetingWithOpponent(afterFirstMatch, thirdClubId)).toBe(true)
  })

  it('en avslutad säsong (durabelt seasonSummaries, oavsett fixtures) gör "första mötet" alltid falskt — dubbel round-robin garanterar att alla redan mötts', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 3 })
    const gameAfterOneSeason = { ...base, seasonSummaries: [{ season: 2025 } as never] }
    const otherClubIds = base.clubs.map(c => c.id).filter(id => id !== base.managedClubId)
    for (const opponentId of otherClubIds) {
      expect(isFirstMeetingWithOpponent(gameAfterOneSeason, opponentId)).toBe(false)
    }
  })
})
