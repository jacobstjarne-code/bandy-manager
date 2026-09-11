import { describe, expect, it } from 'vitest'
import type { GameEventType } from '../../entities/GameEvent'
import type { ResolvedChoice } from '../../entities/SaveGame'
import { analyzeChoiceEntropy } from '../choiceEntropyService'

function choice(
  eventId: string,
  eventType: GameEventType,
  choiceId: string,
  madeByPlayer = true,
  resolutionId = `${eventId}:1`,
  decisionTemplateKey = `${eventType}:${choiceId}`,
): ResolvedChoice {
  return { resolutionId, eventId, eventType, decisionTemplateKey, choiceId, label: choiceId, madeByPlayer, decisionKind: 'decision' }
}

describe('analyzeChoiceEntropy', () => {
  it('grupperar på beslutsmall och godkänner exakt 80 procent', () => {
    const resolvedChoices = [
      ...Array.from({ length: 8 }, (_, i) => choice(`accept-${i}`, 'sponsorOffer', 'accept', true, undefined, 'sponsorOffer:accept|reject')),
      ...Array.from({ length: 2 }, (_, i) => choice(`reject-${i}`, 'sponsorOffer', 'reject', true, undefined, 'sponsorOffer:accept|reject')),
    ]
    const report = analyzeChoiceEntropy([{ id: 'save-1', resolvedChoices }])

    expect(report.rows).toHaveLength(1)
    expect(report.rows[0]).toMatchObject({
      eventType: 'sponsorOffer',
      decisionTemplateKey: 'sponsorOffer:accept|reject',
      total: 10,
      dominantChoiceId: 'accept',
      dominantShare: 0.8,
      passesDominanceGate: true,
    })
    expect(report.rows[0].normalizedEntropy).toBeCloseTo(0.7219, 4)
  })

  it('flaggar ett alternativ över 80 procent som dominant', () => {
    const resolvedChoices = [
      ...Array.from({ length: 9 }, (_, i) => choice(`convince-${i}`, 'hesitantPlayer', 'convince', true, undefined, 'hesitantPlayer:accept|convince')),
      choice('accept-0', 'hesitantPlayer', 'accept', true, undefined, 'hesitantPlayer:accept|convince'),
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
        choice('player', 'communityEvent', 'join', true, undefined, 'communityEvent:join|skip'),
        choice('auto', 'communityEvent', 'skip', false, undefined, 'communityEvent:join|skip'),
        legacy,
      ],
    }])

    expect(report.analyzedPlayerChoices).toBe(1)
    expect(report.excludedAutoChoices).toBe(1)
    expect(report.excludedLegacyOrUnknownChoices).toBe(1)
    expect(report.rows[0].choices.map(item => item.choiceId)).toEqual(['join'])
  })

  it('utesluter enknappskvittenser även när spelaren klickade själv', () => {
    const acknowledgement: ResolvedChoice = {
      resolutionId: 'voice-intro:1',
      eventId: 'voice-intro',
      eventType: 'journalistExclusive',
      choiceId: 'acknowledge',
      label: 'Noterat',
      madeByPlayer: true,
      decisionKind: 'acknowledgement',
      decisionTemplateKey: 'journalistExclusive:acknowledge',
    }
    const report = analyzeChoiceEntropy([{ id: 'save-1', resolvedChoices: [acknowledgement] }])

    expect(report.rows).toEqual([])
    expect(report.analyzedPlayerChoices).toBe(0)
    expect(report.excludedAcknowledgements).toBe(1)
  })

  it('deduplicerar samma resolutionspost mellan exporter men behåller flera steg i samma event', () => {
    const first = choice('same-event', 'sponsorOffer', 'accept', true, undefined, 'sponsorOffer:accept|reject')
    const secondStep = choice('same-event', 'sponsorOffer', 'reject', true, 'same-event:2', 'sponsorOffer:accept|reject')
    const report = analyzeChoiceEntropy([
      { id: 'same-save', resolvedChoices: [first] },
      { id: 'same-save', resolvedChoices: [first, secondStep] },
    ])

    expect(report.totalRecords).toBe(3)
    expect(report.analyzedPlayerChoices).toBe(2)
    expect(report.excludedDuplicateRecords).toBe(1)
    expect(report.rows[0].choices.map(item => item.count)).toEqual([1, 1])
  })

  it('håller två beslutsmallar inom samma breda eventtyp isär', () => {
    const report = analyzeChoiceEntropy([{ id: 'save-1', resolvedChoices: [
      ...Array.from({ length: 4 }, (_, i) => choice(`intro-${i}`, 'patronEvent', 'welcome', true, undefined, 'patronEvent:patron_intro')),
      choice('unhappy-promise', 'patronEvent', 'promise', true, undefined, 'patronEvent:promise|refuse'),
      choice('unhappy-refuse', 'patronEvent', 'refuse', true, undefined, 'patronEvent:promise|refuse'),
    ] }])

    expect(report.rows).toHaveLength(2)
    expect(report.rows.find(row => row.decisionTemplateKey === 'patronEvent:patron_intro')).toMatchObject({
      total: 4,
      dominantChoiceId: 'welcome',
      dominantShare: 1,
      passesDominanceGate: false,
    })
    expect(report.rows.find(row => row.decisionTemplateKey === 'patronEvent:promise|refuse')).toMatchObject({
      total: 2,
      dominantShare: 0.5,
      passesDominanceGate: true,
    })
  })

  it('gissar inte beslutsmall för äldre kvitton som bara har eventtyp', () => {
    const withoutTemplate = choice('legacy-template', 'patronEvent', 'welcome')
    delete withoutTemplate.decisionTemplateKey
    const report = analyzeChoiceEntropy([{ id: 'save-1', resolvedChoices: [withoutTemplate] }])

    expect(report.rows).toEqual([])
    expect(report.excludedLegacyOrUnknownChoices).toBe(1)
  })
})
