import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import type { Mecenat } from '../../../entities/Mecenat'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { getDefaultRolloverChoice } from '../../deferredRolloverService'
import { generateMecenatInterventionEvent } from '../eventFactories'
import { generatePostAdvanceEvents } from '../postAdvanceEvents'
import { resolveEvent } from '../eventResolver'

function makeMecenat(overrides: Partial<Mecenat> = {}): Mecenat {
  return {
    id: 'mec_truth', name: 'Karin Berg', business: 'Berg AB', businessType: 'construction',
    age: 52, personality: 'tyst_kraft', wealth: 70, happiness: 30, silentShout: 0,
    demands: [], isActive: true, yearsActive: 2, lastInteractionRound: 0,
    ...overrides,
  }
}

function makeGame(mec = makeMecenat()) {
  const template = CLUB_TEMPLATES[0]
  const base = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  return {
    ...base,
    currentMatchday: 6,
    mecenater: [mec],
    players: base.players.map(player => ({ ...player, morale: 70, isFullTimePro: true, dayJob: undefined })),
    pendingEvents: [],
    resolvedEventIds: [],
  }
}

describe('mecenatInteraction — säsongs-ID och verklig interaktionstid', () => {
  it('kan återkomma nästa säsong men inte två gånger samma säsong', () => {
    const game = makeGame()
    const event = generatePostAdvanceEvents(game, [], 6, () => 0.99)
      .find(candidate => candidate.type === 'mecenatInteraction')!
    expect(event.id).toBe(`event_mec_intervention_mec_truth_s${game.currentSeason}_r6`)

    const sameSeason = generatePostAdvanceEvents({ ...game, resolvedEventIds: [event.id] }, [], 7, () => 0.99)
    expect(sameSeason.some(candidate => candidate.type === 'mecenatInteraction')).toBe(false)

    const nextSeason = generatePostAdvanceEvents({ ...game, currentSeason: game.currentSeason + 1, resolvedEventIds: [event.id] }, [], 7, () => 0.99)
    expect(nextSeason.find(candidate => candidate.type === 'mecenatInteraction')?.id)
      .toBe(`event_mec_intervention_mec_truth_s${game.currentSeason + 1}_r7`)
  })

  it('personlig inbjudan ger +18, kostar 5 000 kr och sätter canonical currentMatchday', () => {
    const game = makeGame()
    const mec = game.mecenater[0]
    const event = generateMecenatInterventionEvent(mec, game.currentSeason, 6)
    const financesBefore = game.clubs.find(club => club.id === game.managedClubId)!.finances
    const result = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'invite_right', undefined, true)
    expect(result.mecenater?.[0]).toMatchObject({ happiness: 48, lastInteractionRound: 6 })
    expect(result.clubs.find(club => club.id === game.managedClubId)?.finances).toBe(financesBefore - 5000)
  })

  it('gratisinbjudan ger +8 och räknas också som interaktion', () => {
    const game = makeGame()
    const event = generateMecenatInterventionEvent(game.mecenater[0], game.currentSeason, 6)
    const financesBefore = game.clubs.find(club => club.id === game.managedClubId)!.finances
    const result = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'invite_generic', undefined, true)
    expect(result.mecenater?.[0]).toMatchObject({ happiness: 38, lastInteractionRound: 6 })
    expect(result.clubs.find(club => club.id === game.managedClubId)?.finances).toBe(financesBefore)
  })

  it('rollover väljer det uttryckliga noOp-valet ignore', () => {
    const game = makeGame()
    const event = generateMecenatInterventionEvent(game.mecenater[0], game.currentSeason, 6)
    expect(getDefaultRolloverChoice(event)?.id).toBe('ignore')
  })
})
