import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { getDefaultRolloverChoice, getRolloverPolicy } from '../../deferredRolloverService'
import { resolveEvent } from '../eventResolver'
import { generatePatronEvents } from '../patronEvents'
import { patronVoiceId } from '../../voiceIntroductionService'

function makeGame(overrides: { influence?: number; goodwill?: number; happiness?: number } = {}) {
  const base = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 9 })
  const established = {
    ...base,
    currentSeason: 2026,
    currentMatchday: 6,
    patron: {
      id: 'patron_test',
      name: 'Patron Test',
      business: 'Testbolaget',
      influence: overrides.influence ?? 65,
      happiness: overrides.happiness ?? 50,
      goodwill: overrides.goodwill ?? 50,
      contribution: 100000,
      totalContributed: 200000,
      isActive: true,
      introducedSeason: 2026,
    },
  }
  const voiceId = patronVoiceId(established.managedClubId, established.patron.id)
  return {
    ...established,
    introducedVoices: {
      ...established.introducedVoices,
      [voiceId]: {
        provenance: 'observed' as const,
        source: 'event' as const,
        introducedSeason: 2025,
        introducedDate: '2025-10-01',
        nameSnapshot: established.patron.name,
        roleSnapshot: established.patron.business,
      },
    },
  }
}

describe('patronInfluence — text, state och variantprioritet håller ihop', () => {
  it('styrelseinbjudan ger exakt utlovad relation och inflytande', () => {
    const game = makeGame()
    const event = generatePatronEvents(game, 6, new Set(), () => 0)
      .find(candidate => candidate.id === 'patron_influence_60_2026')!
    const result = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'listen', undefined, true)

    expect(event.choices[0].subtitle).toBe('🤝 +20 relation · ⚠️ +10 inflytande')
    expect(result.patron?.happiness).toBe(70)
    expect(result.patron?.influence).toBe(75)
    expect(result.patron?.goodwill).toBe(50)
  })

  it('goodwill-krisen vinner över inflytandekortet och ursäkten reparerar rätt mätare', () => {
    const game = makeGame({ goodwill: 10 })
    const events = generatePatronEvents(game, 6, new Set(), () => 0)

    expect(events.filter(candidate => candidate.type === 'patronInfluence').map(candidate => candidate.id))
      .toEqual(['patron_ignored_2026'])
    const event = events.find(candidate => candidate.id === 'patron_ignored_2026')!
    const result = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'apologize', undefined, true)
    expect(event.choices[0].subtitle).toBe('🕰️ +20 tålamod')
    expect(result.patron?.goodwill).toBe(30)
    expect(result.patron?.happiness).toBe(50)
    expect(result.patron?.influence).toBe(65)
  })

  it('ignorera visar −50 och använder den gemensamma avhoppskedjan när relationen når noll', () => {
    const game = makeGame({ goodwill: 10, happiness: 40 })
    const event = generatePatronEvents(game, 6, new Set(), () => 0)
      .find(candidate => candidate.id === 'patron_ignored_2026')!
    const result = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'ignore', undefined, true)

    expect(event.choices[1].subtitle).toBe('🤝 -50 relation · ⚠️ patronen kan lämna')
    expect(result.patron?.happiness).toBe(0)
    expect(result.patron?.isActive).toBe(false)
    expect(result.patronWithdrawnSeason).toBe(2026)
    expect(result.pendingEvents?.some(candidate => candidate.type === 'patronWithdrawal')).toBe(true)
  })

  it('rinner ut vid rollover eftersom ingen variant har ett neutralt noOp-val', () => {
    const event = generatePatronEvents(makeGame(), 6, new Set(), () => 0)
      .find(candidate => candidate.type === 'patronInfluence')!

    expect(getRolloverPolicy('patronInfluence')).toBe('expire')
    expect(getDefaultRolloverChoice(event)).toBeNull()
  })
})
