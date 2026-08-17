import { describe, it, expect } from 'vitest'
import { generateSupporterEvents } from '../supporterEvents'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { SupporterGroup } from '../../../entities/Community'

/**
 * 2.5 (choice-label-svepet, 2026-08-17) — 'sture'-valets subtitle var en
 * enkelfnutad sträng med ${elin} i sig, inte en mall-literal. Interpolerade
 * aldrig — spelaren såg bokstavligen "${elin} besviken" i UI. Samma felklass
 * som råa {token}-fynd (2.2), men rawTokenGate.ts (DOM-grind mot /dev/scenes-
 * fixturer) fångade den inte eftersom supporter_conflict_-eventet aldrig var
 * med bland de handkonstruerade pendingEvents i DevScenesScreen.tsx — grinden
 * skannar bara rendered DOM för de events någon manuellt lagt in som fixture,
 * inte det fulla universet av event-fabriker.
 */
function makeSupporterGroup(): SupporterGroup {
  return {
    name: 'Järnkurvan',
    founded: 1990,
    members: 40,
    mood: 60,
    leader: { name: 'Sture', role: 'leader' },
    veteran: { name: 'Rolf', role: 'veteran' },
    youth: { name: 'Elin', role: 'youth' },
    family: { name: 'Tommy', role: 'family' },
    tifoDone: true,
  }
}

describe("supporter_conflict_ — 'sture'-valets subtitle interpolerar namnet", () => {
  it("subtitle innehåller det riktiga namnet, inte den råa mall-strängen ${elin}", () => {
    const template = CLUB_TEMPLATES[0]
    const game = { ...createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 }), supporterGroup: makeSupporterGroup() }
    const events = generateSupporterEvents(game, 9, new Set(), () => 0)
    const conflictEvent = events.find(e => e.id.startsWith('supporter_conflict_'))!
    const stureChoice = conflictEvent.choices.find(c => c.id === 'sture')!

    expect(stureChoice.subtitle).not.toContain('${elin}')
    expect(stureChoice.subtitle).toContain('Elin')
  })
})
