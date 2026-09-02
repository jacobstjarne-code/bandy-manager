import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import type { Mecenat } from '../../entities/Mecenat'
import type { SaveGame } from '../../entities/SaveGame'
import { getDefaultRolloverChoice, getRolloverPolicy } from '../deferredRolloverService'
import { resolveEvent } from '../events/eventResolver'
import { generateDinnerEvent, getDinnerResolution } from '../mecenatDinnerService'

function mecenat(overrides: Partial<Mecenat> = {}): Mecenat {
  return {
    id: 'mec_dinner',
    name: 'Karin Berg',
    gender: 'female',
    business: 'Berg AB',
    businessType: 'entrepreneur',
    wealth: 3,
    personality: 'tyst_kraft',
    influence: 60,
    happiness: 60,
    goodwill: 50,
    contribution: 60_000,
    totalContributed: 120_000,
    demands: [],
    socialExpectations: [],
    isActive: true,
    arrivedSeason: 2024,
    silentShout: 0,
    ...overrides,
  }
}

function game(overrides: Partial<SaveGame> = {}): SaveGame {
  const base = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 17 })
  return {
    ...base,
    currentMatchday: 20,
    communityStanding: 50,
    mecenater: [mecenat()],
    pendingEvents: [],
    deferredDecisions: [],
    resolvedEventIds: [],
    ...overrides,
  }
}

describe('mecenatDinner — O11:s text/state-kontrakt', () => {
  it('bär alla åtta verkliga trefrågorsutfall som resolverbara eventval', () => {
    const event = generateDinnerEvent(game(), 20)!
    expect(event.choices).toHaveLength(8)
    expect(event.choices.every(choice => choice.id.startsWith('final|') && choice.effect.type === 'multiEffect')).toBe(true)
    expect(event.choices.some(choice => choice.id === 'start')).toBe(false)

    const scene = JSON.parse(event.sponsorData!)
    for (const choice of event.choices) {
      const resolution = getDinnerResolution(scene, choice.id)
      expect(resolution?.chosenOptions).toHaveLength(3)
      expect(choice.label).toBe(resolution?.choiceLabel)
    }
  })

  it('markerar bara q2-vägen med verklig relationskostnad som kostsam', () => {
    const event = generateDinnerEvent(game(), 20)!
    const loyal = event.choices.find(choice => choice.id === 'final|q0_opt0|q1_opt0|q2_opt0')!
    const competitive = event.choices.find(choice => choice.id === 'final|q0_opt0|q1_opt0|q2_opt1')!

    expect(loyal.consequenceLevel).toBeUndefined()
    expect(loyal.costLabel).toBeUndefined()
    expect(competitive).toMatchObject({
      consequenceLevel: 'costly',
      costLabel: 'Kostar relationen till Karin Berg',
    })
  })

  it('slutvalet går genom den gemensamma effektmotorn och avslutar kortet', () => {
    const base = game()
    const event = generateDinnerEvent(base, 20)!
    const choiceId = 'final|q0_opt0|q1_opt0|q2_opt0'
    const choice = event.choices.find(candidate => candidate.id === choiceId)!
    const financesBefore = base.clubs.find(club => club.id === base.managedClubId)!.finances
    const resolved = resolveEvent({ ...base, pendingEvents: [event] }, event.id, choiceId, undefined, true)

    expect(resolved.mecenater?.[0]).toMatchObject({ happiness: 78, lastInteractionRound: 20 })
    expect(resolved.communityStanding).toBe(56)
    expect(resolved.clubs.find(club => club.id === base.managedClubId)?.finances).toBe(financesBefore)
    expect(resolved.pendingEvents).toEqual([])
    expect(resolved.resolvedEventIds).toContain(event.id)
    expect(resolved.resolvedChoices?.at(-1)).toMatchObject({
      eventId: event.id,
      choiceId,
      label: choice.label,
      madeByPlayer: true,
    })
    expect(resolved.sourceCooldowns?.mecenat).toEqual({ roundsLeft: 4, totalRounds: 4 })
  })

  it('ofullständiga eller okända sammansatta val nekas utan mutation', () => {
    const base = game()
    const event = generateDinnerEvent(base, 20)!
    const pending = { ...base, pendingEvents: [event] }

    expect(resolveEvent(pending, event.id, 'final|q0_opt0|q1_opt0', undefined, true)).toBe(pending)
    expect(resolveEvent(pending, event.id, 'final|q0_opt0|q1_opt0|okand', undefined, true)).toBe(pending)
  })

  it('samma säsongs middag blockeras även när den redan ligger deferred', () => {
    const base = game()
    const event = generateDinnerEvent(base, 20)!
    expect(generateDinnerEvent({ ...base, deferredDecisions: [event] }, 20)).toBeNull()
  })

  it('obesvarad middag rinner ut; introknappen är inte ett default-utfall', () => {
    const event = generateDinnerEvent(game(), 20)!
    expect(getRolloverPolicy('mecenatDinner')).toBe('expire')
    expect(getDefaultRolloverChoice(event)).toBeNull()
  })
})
