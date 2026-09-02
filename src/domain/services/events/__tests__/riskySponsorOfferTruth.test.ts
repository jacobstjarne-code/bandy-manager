import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { processGameEvents } from '../../../../application/useCases/processors/eventProcessor'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { GameEvent } from '../../../entities/GameEvent'
import type { SaveGame } from '../../../entities/SaveGame'
import { resolveEvent } from '../eventResolver'

function baseGame(): SaveGame {
  return createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
}

function riskyEvent(sponsorData: string): GameEvent {
  return {
    id: 'risky_sponsor_test',
    type: 'riskySponsorOffer',
    title: 'test',
    body: 'test',
    choices: [
      { id: 'accept', label: 'accept', effect: { type: 'acceptSponsor', sponsorData } },
      { id: 'reject', label: 'reject', effect: { type: 'noOp' } },
    ],
    resolved: false,
  }
}

const validSponsorData = JSON.stringify({
  id: 'risky_sponsor_test',
  name: 'Test AB',
  category: 'Test',
  weeklyIncome: 550,
  contractRounds: 44,
  signedRound: 8,
  tier: 'risky',
  triggeredBy: 'risky_offer',
  triggeredSeason: 1,
  expiresSeason: 3,
  riskMaturityRound: 14,
})

describe('riskySponsorOffer — deklarerad state-sanning', () => {
  it('accept lägger till sponsorn och samma sponsors mognadskontrakt', () => {
    const event = riskyEvent(validSponsorData)
    const before = { ...baseGame(), sponsors: [], pendingEvents: [event] }
    const after = resolveEvent(before, event.id, 'accept', () => 0.99, true)

    expect(after.sponsors?.find(sponsor => sponsor.id === 'risky_sponsor_test')).toMatchObject({
      weeklyIncome: 550,
      contractRounds: 44,
      tier: 'risky',
    })
    expect(after.riskySponsorContract).toEqual({
      sponsorId: 'risky_sponsor_test',
      riskMaturityRound: 14,
      season: before.currentSeason,
    })
    expect(after.pendingEvents).toHaveLength(0)
    expect(after.resolvedEventIds).toContain(event.id)
  })

  it('trasig accept-data kastar och lämnar event/state orört i stället för att kvittera en no-op', () => {
    const event = riskyEvent('{"id":"saknar resten"}')
    const before = { ...baseGame(), sponsors: [], pendingEvents: [event] }

    expect(() => resolveEvent(before, event.id, 'accept', () => 0.99, true)).toThrow('ofullständig sponsorData')
    expect(before.pendingEvents).toEqual([event])
    expect(before.sponsors).toEqual([])
  })

  it('ett pågående riskavtal blockerar både ett nytt kort och överskrivning vid resolution', () => {
    const activeContract = { sponsorId: 'existing', riskMaturityRound: 14, season: 1 }
    const withActiveRisk = { ...baseGame(), riskySponsorContract: activeContract }
    const generated = processGameEvents(withActiveRisk, [], null, 8, () => 0)
    expect(generated.gameEvents.some(event => event.type === 'riskySponsorOffer')).toBe(false)

    const event = riskyEvent(validSponsorData)
    const pending = { ...withActiveRisk, pendingEvents: [event] }
    expect(() => resolveEvent(pending, event.id, 'accept', () => 0.99, true)).toThrow('kan inte ersätta')
    expect(pending.riskySponsorContract).toBe(activeContract)
  })

  it('ett väntande dedikerat riskkort hindrar vanlig sponsoraccept från att skapa ett konkurrerande riskavtal', () => {
    const riskEvent = riskyEvent(validSponsorData)
    const ordinaryEvent: GameEvent = {
      id: 'ordinary_sponsor',
      type: 'sponsorOffer',
      title: 'test',
      body: 'test',
      sponsorData: JSON.stringify({
        id: 'ordinary', name: 'Ordinary AB', category: 'Test',
        weeklyIncome: 100, contractRounds: 10, signedRound: 8,
      }),
      choices: [
        { id: 'accept', label: 'accept', effect: { type: 'acceptSponsor' } },
        { id: 'reject', label: 'reject', effect: { type: 'noOp' } },
      ],
      resolved: false,
    }
    const before = { ...baseGame(), pendingEvents: [ordinaryEvent, riskEvent], riskySponsorContract: undefined }
    const after = resolveEvent(before, ordinaryEvent.id, 'accept', () => 0, true)

    expect(after.riskySponsorContract).toBeUndefined()
    expect(after.pendingEvents).toEqual([riskEvent])
  })
})
