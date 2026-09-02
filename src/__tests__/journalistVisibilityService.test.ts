import { describe, it, expect } from 'vitest'
import {
  getJournalistCardSeverity,
  shouldShowJournalistCard,
  detectRelationshipEvent,
  appendJournalistRelationshipStoryline,
  getJournalistRelationshipStoryText,
  getJournalistAttendanceModifier,
  getJournalistCommunityModifier,
} from '../domain/services/journalistVisibilityService'
import type { SaveGame } from '../domain/entities/SaveGame'

function makeGame(relationship: number, lastTriggered?: number): SaveGame {
  return {
    currentSeason: 2026,
    currentMatchday: 8,
    managedClubId: 'club_forsbacka',
    fixtures: [],
    storylines: [],
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

describe('journalistens relationsstorylines', () => {
  it('fryser en feud-post bara vid en verklig ny ≤20-passering', () => {
    const game = makeGame(18, 25)
    const result = appendJournalistRelationshipStoryline(game, 'broken_under_20')

    expect(result.storylines).toEqual([{
      id: 'story_journalist_feud_2026_8',
      type: 'journalist_feud',
      season: 2026,
      matchday: 0,
      clubId: 'club_forsbacka',
      description: 'Relationen är bruten. Det krävs tid och ärlighet för att vända.',
      displayText: 'Relationen är bruten. Det krävs tid och ärlighet för att vända.',
      resolved: true,
    }])
    expect(appendJournalistRelationshipStoryline(makeGame(15, 10), 'broken_under_20').storylines).toEqual([])
  })

  it('fryser en redemption-post bara vid en verklig ny ≥75-passering', () => {
    const game = makeGame(80, 70)
    const result = appendJournalistRelationshipStoryline(game, 'recovered_above_75')
    const text = getJournalistRelationshipStoryText(game, 'recovered_above_75')

    expect(text).toBe('Bergström är på er sida nu. Det håller så länge du är lika öppen tillbaka.')
    expect(result.storylines?.[0]).toMatchObject({
      id: 'story_journalist_redemption_2026_8',
      type: 'journalist_redemption',
      clubId: 'club_forsbacka',
      description: text,
      displayText: text,
      resolved: true,
    })
    expect(appendJournalistRelationshipStoryline(makeGame(82, 78), 'recovered_above_75').storylines).toEqual([])
  })
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
