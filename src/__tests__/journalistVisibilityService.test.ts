import { describe, it, expect } from 'vitest'
import {
  getJournalistCardSeverity,
  shouldShowJournalistCard,
  detectRelationshipEvent,
  getJournalistAttendanceModifier,
  getJournalistCommunityModifier,
} from '../domain/services/journalistVisibilityService'
import type { SaveGame } from '../domain/entities/SaveGame'

function makeGame(relationship: number, lastTriggered?: number): SaveGame {
  return {
    journalist: {
      name: 'Karin Bergström',
      outlet: 'Lokaltidningen',
      persona: 'analytical',
      style: 'neutral',
      relationship,
      memory: [],
      pressRefusals: 0,
      lastTriggeredRelationship: lastTriggered,
    },
  } as unknown as SaveGame
}

function makeGameNoJournalist(): SaveGame {
  return {} as SaveGame
}

describe('getJournalistCardSeverity', () => {
  it('cold vid 30', () => expect(getJournalistCardSeverity(makeGame(30))).toBe('cold'))
  it('cold vid 1',  () => expect(getJournalistCardSeverity(makeGame(1))).toBe('cold'))
  it('hidden vid 31', () => expect(getJournalistCardSeverity(makeGame(31))).toBe('hidden'))
  it('hidden vid 69', () => expect(getJournalistCardSeverity(makeGame(69))).toBe('hidden'))
  it('warm vid 70',  () => expect(getJournalistCardSeverity(makeGame(70))).toBe('warm'))
  it('warm vid 99',  () => expect(getJournalistCardSeverity(makeGame(99))).toBe('warm'))
  it('hidden utan journalist', () => expect(getJournalistCardSeverity(makeGameNoJournalist())).toBe('hidden'))
})

describe('shouldShowJournalistCard', () => {
  it('true vid cold', () => expect(shouldShowJournalistCard(makeGame(20))).toBe(true))
  it('true vid warm', () => expect(shouldShowJournalistCard(makeGame(80))).toBe(true))
  it('false vid neutral', () => expect(shouldShowJournalistCard(makeGame(50))).toBe(false))
  it('false utan journalist', () => expect(shouldShowJournalistCard(makeGameNoJournalist())).toBe(false))
})

describe('detectRelationshipEvent', () => {
  it('broken_under_20 när relation sjunker under 20', () =>
    expect(detectRelationshipEvent(makeGame(18, 25))).toBe('broken_under_20'))
  it('null om redan under 20 senast', () =>
    expect(detectRelationshipEvent(makeGame(15, 10))).toBeNull())
  it('recovered_above_75 när relation stiger över 75', () =>
    expect(detectRelationshipEvent(makeGame(80, 70))).toBe('recovered_above_75'))
  it('null om redan över 75 senast', () =>
    expect(detectRelationshipEvent(makeGame(82, 78))).toBeNull())
  it('null vid neutralt värde', () =>
    expect(detectRelationshipEvent(makeGame(50, 48))).toBeNull())
  it('null utan journalist', () =>
    expect(detectRelationshipEvent(makeGameNoJournalist())).toBeNull())
})

describe('getJournalistAttendanceModifier', () => {
  it('1.10 vid 70', () => expect(getJournalistAttendanceModifier(makeGame(70))).toBe(1.10))
  it('1.10 vid 100', () => expect(getJournalistAttendanceModifier(makeGame(100))).toBe(1.10))
  it('0.95 vid 30', () => expect(getJournalistAttendanceModifier(makeGame(30))).toBe(0.95))
  it('0.95 vid 0', () => expect(getJournalistAttendanceModifier(makeGame(0))).toBe(0.95))
  it('1.0 vid 50', () => expect(getJournalistAttendanceModifier(makeGame(50))).toBe(1.0))
  it('1.0 utan journalist', () => expect(getJournalistAttendanceModifier(makeGameNoJournalist())).toBe(1.0))
})

describe('getJournalistCommunityModifier', () => {
  it('+1 vid 70', () => expect(getJournalistCommunityModifier(makeGame(70))).toBe(1))
  it('-1 vid 30', () => expect(getJournalistCommunityModifier(makeGame(30))).toBe(-1))
  it('0 vid 50',  () => expect(getJournalistCommunityModifier(makeGame(50))).toBe(0))
  it('0 utan journalist', () => expect(getJournalistCommunityModifier(makeGameNoJournalist())).toBe(0))
})
