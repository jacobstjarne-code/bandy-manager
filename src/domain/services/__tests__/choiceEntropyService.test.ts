import { describe, expect, it } from 'vitest'
import type { GameEventType } from '../../entities/GameEvent'
import type { ResolvedChoice } from '../../entities/SaveGame'
import { analyzeChoiceEntropy } from '../choiceEntropyService'

function choice(
  eventId: string,
  eventType: GameEventType,
  choiceId: string,
  madeByPlayer = true,
): ResolvedChoice {
  return { eventId, eventType, choiceId, label: choiceId, madeByPlayer }
}

describe('analyzeChoiceEntropy', () => {
  it('grupperar på eventType och godkänner exakt 80 procent', () => {
    const resolvedChoices = [
      ...Array.from({ length: 8 }, (_, i) => choice(`accept-${i}`, 'sponsorOffer', 'accept')),
      ...Array.from({ length: 2 }, (_, i) => choice(`reject-${i}`, 'sponsorOffer', 'reject')),
    ]
    const report = analyzeChoiceEntropy([{ id: 'save-1', resolvedChoices }])

    expect(report.rows).toHaveLength(1)
    expect(report.rows[0]).toMatchObject({
      eventType: 'sponsorOffer',
      total: 10,
      dominantChoiceId: 'accept',
      dominantShare: 0.8,
      passesDominanceGate: true,
    })
    expect(report.rows[0].normalizedEntropy).toBeCloseTo(0.7219, 4)
  })

  it('flaggar ett alternativ över 80 procent som dominant', () => {
    const resolvedChoices = [
      ...Array.from({ length: 9 }, (_, i) => choice(`convince-${i}`, 'hesitantPlayer', 'convince')),
      choice('accept-0', 'hesitantPlayer', 'accept'),
    ]
    const row = analyzeChoiceEntropy([{ id: 'save-1', resolvedChoices }]).rows[0]

    expect(row.dominantShare).toBe(0.9)
    expect(row.passesDominanceGate).toBe(false)
  })

  it('utesluter auto-resolutioner och äldre poster utan säker attribution', () => {
    const legacy: ResolvedChoice = { eventId: 'legacy', choiceId: 'x', label: 'x' }
    const report = analyzeChoiceEntropy([{
      id: 'save-1',
      resolvedChoices: [
        choice('player', 'communityEvent', 'join', true),
        choice('auto', 'communityEvent', 'skip', false),
        legacy,
      ],
    }])

    expect(report.analyzedPlayerChoices).toBe(1)
    expect(report.excludedAutoChoices).toBe(1)
    expect(report.excludedLegacyOrUnknownChoices).toBe(1)
    expect(report.rows[0].choices.map(item => item.choiceId)).toEqual(['join'])
  })

  it('deduplicerar överlappande exporter av samma save via eventId', () => {
    const first = choice('same-event', 'sponsorOffer', 'accept')
    const report = analyzeChoiceEntropy([
      { id: 'same-save', resolvedChoices: [first] },
      { id: 'same-save', resolvedChoices: [first, choice('new-event', 'sponsorOffer', 'reject')] },
    ])

    expect(report.totalRecords).toBe(3)
    expect(report.analyzedPlayerChoices).toBe(2)
    expect(report.excludedDuplicateRecords).toBe(1)
    expect(report.rows[0].choices.map(item => item.count)).toEqual([1, 1])
  })
})
