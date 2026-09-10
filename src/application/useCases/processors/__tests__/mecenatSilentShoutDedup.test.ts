import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { processGameEvents } from '../eventProcessor'
import { generateMecenat, generateSilentShoutEvent } from '../../../../domain/services/mecenatService'
import { mulberry32 } from '../../../../domain/utils/random'
import type { SaveGame } from '../../../../domain/entities/SaveGame'

const zeroRand = () => 0

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 11 })
  const mecenat = {
    ...generateMecenat(base.managedClubId, base.currentSeason, mulberry32(1)),
    id: 'mecenat_anna',
    name: 'Anna Johansson',
    isActive: true,
    happiness: 80,
    silentShout: 95,
    lastInteractionRound: 5,
  }
  return { ...base, mecenater: [mecenat], ...overrides }
}

describe('silentShout — en producent och kanonisk dedupe', () => {
  it('ger samma stabila id för samma mecenat och tröskelvariant', () => {
    const mecenat = makeGame().mecenater![0]
    const first = generateSilentShoutEvent(mecenat, 'Test Spelare', zeroRand)
    const second = generateSilentShoutEvent(mecenat, 'Test Spelare', zeroRand)

    expect(first?.id).toBe('event_shout_threat_mecenat_anna')
    expect(second?.id).toBe(first?.id)
  })

  it('producerar exakt ett hotkort när varianten inte förekommit', () => {
    const result = processGameEvents(makeGame(), [], null, 6, zeroRand)
    const threats = result.gameEvents.filter(event => event.id === 'event_shout_threat_mecenat_anna')

    expect(threats).toHaveLength(1)
  })

  it('producerar inte varianten igen när dess id redan är löst', () => {
    const result = processGameEvents(makeGame({
      resolvedEventIds: ['event_shout_threat_mecenat_anna'],
    }), [], null, 6, zeroRand)

    expect(result.gameEvents.some(event => event.id === 'event_shout_threat_mecenat_anna')).toBe(false)
  })

  it('känner igen ett tidsstämplat id från en äldre save som samma variant', () => {
    const result = processGameEvents(makeGame({
      resolvedEventIds: ['event_shout_threat_mecenat_anna_1789034375396'],
    }), [], null, 6, zeroRand)

    expect(result.gameEvents.some(event => event.id === 'event_shout_threat_mecenat_anna')).toBe(false)
  })

  it('submit lovar bara den deklarerade relationseffekten', () => {
    const event = generateSilentShoutEvent(makeGame().mecenater![0], 'Test Spelare', zeroRand)
    const submit = event?.choices.find(choice => choice.id === 'submit')

    expect(submit?.subtitle).toBe('gläder mecenaten · kontrollfreak vinner')
    expect(submit?.effect).toEqual({
      type: 'mecenatHappiness',
      targetMecenatId: 'mecenat_anna',
      amount: 20,
    })
  })
})
