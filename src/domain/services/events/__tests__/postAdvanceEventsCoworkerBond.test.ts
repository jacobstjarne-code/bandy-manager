import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import type { SaveGame } from '../../../entities/SaveGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { coworkerBondEventId, generateCoworkerBondEvent } from '../eventFactories'
import { generatePostAdvanceEvents } from '../postAdvanceEvents'

function coworkerGame(): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
  const [player1, player2] = game.players.filter(p => p.clubId === game.managedClubId)
  return {
    ...game,
    fixtures: [],
    players: game.players.map(p => {
      if (p.clubId !== game.managedClubId) return p
      if (p.id === player1.id) {
        return { ...p, morale: 50, isFullTimePro: false, dayJob: { title: 'Lärare', flexibility: 70, weeklyIncome: 1000 } }
      }
      if (p.id === player2.id) {
        return { ...p, morale: 50, isFullTimePro: false, dayJob: { title: 'Ekonom', flexibility: 70, weeklyIncome: 1000 } }
      }
      return { ...p, morale: 50, isFullTimePro: true, dayJob: undefined }
    }),
  }
}

describe('coworker bond — ankare och ködedup', () => {
  it('har ordningsoberoende event-id för samma spelarpar', () => {
    const game = coworkerGame()
    const [player1, player2] = game.players.filter(p => p.clubId === game.managedClubId && !p.isFullTimePro)

    expect(generateCoworkerBondEvent(player1, player2, 'Sandvikens kommun').id)
      .toBe(generateCoworkerBondEvent(player2, player1, 'Sandvikens kommun').id)
  })

  it('genererar inte om samma par-kort ligger i deferredDecisions', () => {
    const game = coworkerGame()
    const [player1, player2] = game.players.filter(p => p.clubId === game.managedClubId && !p.isFullTimePro)
    const deferred = generateCoworkerBondEvent(player1, player2, 'Sandvikens kommun')

    const generated = generatePostAdvanceEvents({ ...game, deferredDecisions: [deferred] }, [], 4, () => 0)

    expect(generated.some(event => event.id === coworkerBondEventId(player1.id, player2.id))).toBe(false)
  })

  it('skapar högst ett arbetsplatsbeat i samma omgång även med tre kollegor', () => {
    const base = coworkerGame()
    const managed = base.players.filter(p => p.clubId === base.managedClubId)
    const colleagueIds = new Set(managed.slice(0, 3).map(p => p.id))
    const game = {
      ...base,
      players: base.players.map(p => colleagueIds.has(p.id)
        ? { ...p, isFullTimePro: false, dayJob: { title: 'Lärare', flexibility: 70, weeklyIncome: 1000 } }
        : p),
    }

    const generated = generatePostAdvanceEvents(game, [], 4, () => 0)
    const coworkerEvents = generated.filter(event => event.id.startsWith('event_bond_'))

    expect(coworkerEvents).toHaveLength(1)
  })
})
