import { describe, it, expect } from 'vitest'
import { generateVarselEvent, bidReceivedEvent, generateMecenatInterventionEvent } from '../eventFactories'
import { checkMecenatRetirement } from '../../mecenatService'
import { generateWeeklyDecision } from '../../weeklyDecisionService'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { TransferBid } from '../../../entities/GameEvent'
import type { Mecenat } from '../../../entities/Mecenat'

const SYSTEMHANDELSE_IDS = new Set(['away_trip_bus', 'tifo_contribution', 'legacy_naming_arena'])
const KNOWN_NON_SYSTEMHANDELSE_IDS = new Set(['corner_extra_training', 'player_weekend_off', 'reporter_klacken'])

/**
 * O19 (SLUTTEST_KO.md, 2026-08-17) — märk de nio 5/5-systemhändelserna
 * (DOM_VARSLET_KLASSIFICERING_2026-08-17.md) i data. Ren datamärkning,
 * ingen räknare/cooldown läser fältet ännu — det här testet bevisar bara
 * att märkningen faktiskt sitter på rätt konstruktionsställen.
 */
function makeGame() {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

describe('O19: systemhandelse-märkning', () => {
  it('generateVarselEvent är märkt', () => {
    const event = generateVarselEvent([{ id: 'p1', firstName: 'Erik', lastName: 'Sundqvist' }], 'Älvkarleby kommun', 2)
    expect(event.systemhandelse).toBe(true)
  })

  it('bidReceivedEvent är märkt', () => {
    const game = makeGame()
    const player = game.players.find(p => p.clubId === game.managedClubId)!
    const bid: TransferBid = {
      id: 'bid1', playerId: player.id, buyingClubId: game.clubs[1].id, sellingClubId: game.managedClubId!,
      offerAmount: 100_000, offeredSalary: 10_000, contractYears: 2, direction: 'incoming', status: 'pending',
      createdRound: 1, expiresRound: 3,
    }
    const event = bidReceivedEvent(bid, game)
    expect(event.systemhandelse).toBe(true)
  })

  it('generateMecenatInterventionEvent är märkt', () => {
    const mec: Mecenat = {
      id: 'm1', name: 'Test Mecenat', business: 'Test AB', personality: 'showman',
      happiness: 40, isActive: true, goodwill: 50,
    } as Mecenat
    const event = generateMecenatInterventionEvent(mec, 2025, 5)
    expect(event.systemhandelse).toBe(true)
  })

  it('checkMecenatRetirement är märkt', () => {
    const game = makeGame()
    const mec: Mecenat = {
      id: 'm1', name: 'Test Mecenat', business: 'Test AB', personality: 'showman',
      happiness: 60, isActive: true, goodwill: 50,
      yearsActive: 8, retirementThreshold: 6, hasAnnouncedRetirement: false,
    } as Mecenat
    const withMecenat = { ...game, mecenater: [mec] }
    const event = checkMecenatRetirement(withMecenat)
    expect(event?.systemhandelse).toBe(true)
  })

  it('weeklyDecisionService: exakt de tre avsedda är märkta, ingen annan', () => {
    // currentEra: 'legacy' tvingas fram så legacy_naming_arena (era-gated) syns i poolen.
    const game = { ...makeGame(), currentEra: 'legacy' as const }
    const seenSystemhandelse = new Set<string>()
    const seenNonSystemhandelse = new Set<string>()
    // Poolen väljs deterministiskt (round*13 + season*7) % length — loopa rundor
    // för att träffa varje id minst en gång, ingen intern export behövs.
    for (let round = 1; round <= 60; round++) {
      const decision = generateWeeklyDecision(game, round)
      if (!decision) continue
      if (SYSTEMHANDELSE_IDS.has(decision.id)) {
        expect(decision.systemhandelse, `${decision.id} ska vara märkt`).toBe(true)
        seenSystemhandelse.add(decision.id)
      } else if (KNOWN_NON_SYSTEMHANDELSE_IDS.has(decision.id)) {
        expect(decision.systemhandelse, `${decision.id} ska INTE vara märkt`).toBeFalsy()
        seenNonSystemhandelse.add(decision.id)
      }
    }
    expect(seenSystemhandelse.size, 'alla tre avsedda id:n sågs över 60 rundor').toBe(SYSTEMHANDELSE_IDS.size)
    expect(seenNonSystemhandelse.size).toBeGreaterThan(0)
  })
})
