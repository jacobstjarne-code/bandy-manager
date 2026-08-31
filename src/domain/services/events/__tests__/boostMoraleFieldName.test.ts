/**
 * 2.5 (choice-label-svepet), fjärde rundan (2026-08-23, O2-svepet) —
 * multiEffect-resolverns boostMorale-gren läser sub.amount (U3:s
 * standardfält), inte sub.value. generatePlayerPraiseEvent/
 * generateCoworkerBondEvent konstruerade sina subEffects med 'value'.
 * playerPraise: sub.amount blev undefined → resolverns default (?? 5)
 * levererade +5 moral trots att subtitlen lovade +3 — text som ljuger
 * åt spelarens fördel, samma fel som tvärtom. coworkerBond hade samma
 * fältmiss men syntes aldrig (dess value:5 råkar sammanfalla med
 * defaulten 5) — rättad ändå, samma latenta bugg.
 */
import { describe, it, expect } from 'vitest'
import { generatePlayerPraiseEvent, generateCoworkerBondEvent } from '../eventFactories'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { SaveGame } from '../../../entities/SaveGame'

function baseGame(): SaveGame {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

describe('generatePlayerPraiseEvent — "great"-valet ger exakt +3 moral, inte +5', () => {
  it('subtitlen lovar +3 moral båda — resolvern ska leverera exakt det', () => {
    let game = baseGame()
    const [praiser, praised] = game.players.filter(p => p.clubId === game.managedClubId)
    game = {
      ...game,
      players: game.players.map(p =>
        p.id === praiser.id || p.id === praised.id ? { ...p, morale: 50 } : p
      ),
    }
    const event = generatePlayerPraiseEvent(praiser, praised)
    expect(event.choices[0].subtitle).toBe('+3 moral båda')
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, event.id, 'great', undefined, true)

    const updatedPraiser = game.players.find(p => p.id === praiser.id)!
    const updatedPraised = game.players.find(p => p.id === praised.id)!
    expect(updatedPraiser.morale).toBe(53)
    expect(updatedPraised.morale).toBe(53)
  })
})

describe('generateCoworkerBondEvent — "great"-valet ger exakt +5 moral (redan rätt magnitud, fältet rättat ändå)', () => {
  it('subtitlen lovar +5 moral båda — resolvern ska leverera exakt det', () => {
    let game = baseGame()
    const [player1, player2] = game.players.filter(p => p.clubId === game.managedClubId)
    game = {
      ...game,
      players: game.players.map(p =>
        p.id === player1.id || p.id === player2.id ? { ...p, morale: 50 } : p
      ),
    }
    const event = generateCoworkerBondEvent(player1, player2, 'ICA Maxi')
    expect(event.choices[0].subtitle).toBe('+5 moral båda')
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, event.id, 'great', undefined, true)

    const updated1 = game.players.find(p => p.id === player1.id)!
    const updated2 = game.players.find(p => p.id === player2.id)!
    expect(updated1.morale).toBe(55)
    expect(updated2.morale).toBe(55)
  })
})
