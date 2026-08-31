import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { checkMecenatRetirement } from '../../mecenatService'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { Mecenat } from '../../../entities/SaveGame'

/**
 * Instrument-svepet (2.5, 2026-08-17) hittade detta mekaniskt: checkMecenatRetirement
 * (mecenatService.ts) konstruerade 'listen'/'offer_tribute' med
 * { type: 'mecenatHappiness', value: 5 } utan targetMecenatId. Sedan vakten
 * breddades (ed94218f, samma commit-serie) hade DETTA choice kraschat live —
 * regressionen fångades innan den nådde main via instrumentkörningen, inte i
 * produktion. Fixad till 'noOp' eftersom den riktiga effekten redan sköttes
 * av eventResolver.ts:s post-switch-block (event_mecenat_retire_-specialgrenen).
 */
function makeMecenat(overrides: Partial<Mecenat> = {}): Mecenat {
  return {
    id: 'mec-1',
    name: 'Test Mecenat',
    age: 72,
    isActive: true,
    happiness: 50,
    yearsActive: 8,
    retirementThreshold: 6,
    hasAnnouncedRetirement: false,
    demands: [],
    ...overrides,
  } as Mecenat
}

describe('mecenat-avgångsvalet — kraschar inte, applicerar rätt effekt via post-switch-blocket', () => {
  for (const choiceId of ['listen', 'plan_succession', 'offer_tribute']) {
    it(`'${choiceId}' kraschar inte`, () => {
      const template = CLUB_TEMPLATES[0]
      let game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
      game = { ...game, mecenater: [makeMecenat()] }
      const event = checkMecenatRetirement(game)!
      expect(event).toBeTruthy()
      game = { ...game, pendingEvents: [event] }
      expect(() => resolveEvent(game, event.id, choiceId, undefined, true)).not.toThrow()
    })
  }

  it("'listen' höjer happiness med 5 och sätter hasAnnouncedRetirement", () => {
    const template = CLUB_TEMPLATES[0]
    let game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
    game = { ...game, mecenater: [makeMecenat({ happiness: 50 })] }
    const event = checkMecenatRetirement(game)!
    game = { ...game, pendingEvents: [event] }
    game = resolveEvent(game, event.id, 'listen', undefined, true)

    const mec = game.mecenater!.find(m => m.id === 'mec-1')!
    expect(mec.happiness).toBe(55)
    expect(mec.hasAnnouncedRetirement).toBe(true)
    expect(mec.retirementThreshold).toBe(7)
  })

  it("'offer_tribute' höjer happiness med 5, communityStanding med 3, drar 25000 kr", () => {
    const template = CLUB_TEMPLATES[0]
    let game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
    game = { ...game, mecenater: [makeMecenat({ happiness: 50 })], communityStanding: 50 }
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const financesBefore = club.finances
    const event = checkMecenatRetirement(game)!
    game = { ...game, pendingEvents: [event] }
    game = resolveEvent(game, event.id, 'offer_tribute', undefined, true)

    const mec = game.mecenater!.find(m => m.id === 'mec-1')!
    expect(mec.happiness).toBe(55)
    expect(game.communityStanding).toBe(53)
    const clubAfter = game.clubs.find(c => c.id === game.managedClubId)!
    expect(clubAfter.finances).toBe(financesBefore - 25000)
  })
})
