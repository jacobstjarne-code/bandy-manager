import { describe, it, expect } from 'vitest'
import {
  getJournalistCardSeverity,
  shouldShowJournalistCard,
  detectRelationshipEvent,
  appendJournalistRelationshipStoryline,
  getJournalistRelationshipStoryText,
  isJournalistFeudRelapse,
  isJournalistRedemptionRelapse,
  getJournalistAttendanceModifier,
  getJournalistCommunityModifier,
} from '../domain/services/journalistVisibilityService'
import type { SaveGame } from '../domain/entities/SaveGame'
import { buildJournalistSceneData } from '../domain/data/scenes/journalistRelationshipScene'
import { buildStorylineResolutionLedgerEntry } from '../domain/services/storylineLedgerService'

function makeGame(relationship: number, lastTriggered?: number): SaveGame {
  return {
    currentSeason: 2026,
    currentMatchday: 8,
    managedClubId: 'club_forsbacka',
    fixtures: [],
    storylines: [],
    eventLedger: [],
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

function withRelationshipStory(
  game: SaveGame,
  type: 'journalist_feud' | 'journalist_redemption',
  season: number,
  clubId = game.managedClubId,
): SaveGame {
  const historicalStory = {
    id: `historical_${type}_${season}`,
    type,
    season,
    matchday: 12,
    clubId,
    description: 'historical',
    displayText: 'historical',
    resolved: true,
  } as const
  return {
    ...game,
    storylines: [historicalStory],
    eventLedger: [buildStorylineResolutionLedgerEntry(historicalStory, 16)!],
  }
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
    expect(result.eventLedger).toContainEqual(expect.objectContaining({
      type: 'storyline_resolution',
      semanticKey: 'storyline_resolution:journalist_feud:story_journalist_feud_2026_8',
      matchday: 8,
      subject: { kind: 'club', id: 'club_forsbacka' },
    }))
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
    expect(result.eventLedger).toContainEqual(expect.objectContaining({
      semanticKey: 'storyline_resolution:journalist_redemption:story_journalist_redemption_2026_8',
    }))
    expect(appendJournalistRelationshipStoryline(makeGame(82, 78), 'recovered_above_75').storylines).toEqual([])
  })

  it('läser en feud från en tidigare säsong som återfall och fryser den eskalerade texten', () => {
    const game = withRelationshipStory(makeGame(18, 25), 'journalist_feud', 2025)
    const text = 'Bruten igen. Bergström har sett det förr, och den här gången sitter det djupare.'

    expect(isJournalistFeudRelapse(game)).toBe(true)
    expect(getJournalistRelationshipStoryText(game, 'broken_under_20')).toBe(text)
    expect(appendJournalistRelationshipStoryline(game, 'broken_under_20').storylines?.at(-1)).toMatchObject({
      id: 'story_journalist_feud_2026_8',
      type: 'journalist_feud',
      description: text,
      displayText: text,
    })
    expect(buildJournalistSceneData(
      game.journalist!, game.currentSeason, game.eventLedger, game.managedClubId,
    ).outlookText)
      .toBe(text)
  })

  it('läser en redemption från en tidigare säsong som återfall med den skeptiska återfallstexten', () => {
    const game = withRelationshipStory(makeGame(80, 70), 'journalist_redemption', 2025)
    const text = 'Bergström kommer tillbaka, men inte hela vägen. En relation som brustit en gång läks aldrig riktigt blint igen.'

    expect(isJournalistRedemptionRelapse(game)).toBe(true)
    expect(getJournalistRelationshipStoryText(game, 'recovered_above_75')).toBe(text)
    expect(appendJournalistRelationshipStoryline(game, 'recovered_above_75').storylines?.at(-1)).toMatchObject({
      id: 'story_journalist_redemption_2026_8',
      type: 'journalist_redemption',
      description: text,
      displayText: text,
    })
    expect(buildJournalistSceneData(
      game.journalist!, game.currentSeason, game.eventLedger, game.managedClubId,
    ).outlookText)
      .toBe(text)
  })

  it('räknar inte samma säsongs post eller den andra relationstypen som återfall', () => {
    const sameSeasonFeud = withRelationshipStory(makeGame(18, 25), 'journalist_feud', 2026)
    const priorRedemption = withRelationshipStory(makeGame(18, 25), 'journalist_redemption', 2025)
    const otherClubFeud = withRelationshipStory(
      makeGame(18, 25), 'journalist_feud', 2025, 'club_other',
    )

    expect(isJournalistFeudRelapse(sameSeasonFeud)).toBe(false)
    expect(isJournalistFeudRelapse(priorRedemption)).toBe(false)
    expect(isJournalistFeudRelapse(otherClubFeud)).toBe(false)
    expect(getJournalistRelationshipStoryText(sameSeasonFeud, 'broken_under_20'))
      .toBe('Relationen är bruten. Det krävs tid och ärlighet för att vända.')
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
