import { describe, it, expect } from 'vitest'
import { newTextMetricsAccumulator, recordInboxTextMetrics, summarizeTextMetrics } from '../textMetrics'
import type { InboxItem } from '../../../src/domain/entities/Inbox'
import { InboxItemType } from '../../../src/domain/enums'

function item(overrides: Partial<InboxItem> = {}): InboxItem {
  return {
    id: `item_${Math.random()}`,
    date: '2026-01-01',
    type: InboxItemType.MatchResult,
    title: 't',
    body: 'Ett vanligt textmeddelande.',
    isRead: false,
    ...overrides,
  }
}

describe('recordInboxTextMetrics + summarizeTextMetrics — B6 (2026-07-19)', () => {
  it('räknar totalTexts och unika strängar', () => {
    const acc = newTextMetricsAccumulator()
    recordInboxTextMetrics([item({ body: 'A' }), item({ body: 'B' })], 1, acc)
    recordInboxTextMetrics([item({ body: 'A' })], 2, acc)
    const summary = summarizeTextMetrics(acc, 2)
    expect(summary.totalTexts).toBe(3)
    expect(summary.uniqueStrings).toBe(2)
    expect(summary.duplicateStrings).toBe(1) // 'A' förekom 2 ggr
    expect(summary.maxStringRepeats).toBe(2)
  })

  it('actionableRatio är andelen med expiresRound satt', () => {
    const acc = newTextMetricsAccumulator()
    recordInboxTextMetrics([
      item({ body: 'X', expiresRound: 5 }),
      item({ body: 'Y' }),
      item({ body: 'Z' }),
    ], 1, acc)
    const summary = summarizeTextMetrics(acc, 1)
    expect(summary.actionableRatio).toBeCloseTo(1 / 3)
  })

  it('räknar omgångsmellanrum mellan en karaktärs (fromRole) på-varandra-följande repliker', () => {
    const acc = newTextMetricsAccumulator()
    recordInboxTextMetrics([item({ body: 'X', fromRole: 'Henrik' })], 1, acc)
    recordInboxTextMetrics([item({ body: 'Y', fromRole: 'Henrik' })], 4, acc)
    recordInboxTextMetrics([item({ body: 'Z', fromRole: 'Henrik' })], 6, acc)
    const summary = summarizeTextMetrics(acc, 6)
    expect(summary.avgCharacterGapRounds).toBeCloseTo((3 + 2) / 2)
    expect(summary.maxCharacterGapRounds).toBe(3)
  })

  it('ignorerar items utan fromRole för karaktärsmåttet', () => {
    const acc = newTextMetricsAccumulator()
    recordInboxTextMetrics([item({ body: 'X' }), item({ body: 'Y' })], 1, acc)
    const summary = summarizeTextMetrics(acc, 1)
    expect(summary.avgCharacterGapRounds).toBeNull()
    expect(summary.maxCharacterGapRounds).toBeNull()
  })

  it('textsPerRoundAvg delar totalTexts på antal omgångar', () => {
    const acc = newTextMetricsAccumulator()
    recordInboxTextMetrics([item(), item(), item(), item()], 1, acc)
    const summary = summarizeTextMetrics(acc, 4)
    expect(summary.textsPerRoundAvg).toBe(1)
  })
})
