import { describe, it, expect, afterAll } from 'vitest'
import { buildPortal, makeSeed } from '../portalBuilder'
import { initCardBag, resetCardBag } from '../initCardBag'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'

/**
 * 3.2 (SLUTTEST_KO.md, 2026-08-17) — bekräftar att board_patience_minimal
 * faktiskt är registrerat och når spelaren via den RIKTIGA kortregistret
 * (initCardBag.ts), inte bara att komponenten/zon-funktionen existerar i
 * isolering. "Ingen produktionsyta läste boardPatience" var precis det här
 * ledet som saknades tidigare — komponenten kan vara perfekt och ändå aldrig
 * visas om den glöms i PORTAL_CARDS.
 */
describe('board_patience_minimal — registrerat i den riktiga portalen', () => {
  afterAll(() => {
    // Andra testfiler (t.ex. portalBuilder.test.ts) sätter sin egen mock-bag
    // via setCardBag — nollställ så nästa fil som anropar initCardBag() på
    // nytt får en färsk registrering istället för "redan initialiserad".
    resetCardBag()
  })

  it('syns i layout.minimal för ett fräscht spel (normal boardPatience)', () => {
    resetCardBag()
    initCardBag()
    const template = CLUB_TEMPLATES[0]
    const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
    const layout = buildPortal(game, makeSeed(game))

    expect(layout.minimal.map(c => c.id)).toContain('board_patience_minimal')
  })

  it('syns även när boardPatience är i ultimatum-zonen (låg vikt räcker inte att tappa bort den)', () => {
    resetCardBag()
    initCardBag()
    const template = CLUB_TEMPLATES[0]
    const game = { ...createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 }), boardPatience: 10 }
    const layout = buildPortal(game, makeSeed(game))

    expect(layout.minimal.map(c => c.id)).toContain('board_patience_minimal')
  })
})
