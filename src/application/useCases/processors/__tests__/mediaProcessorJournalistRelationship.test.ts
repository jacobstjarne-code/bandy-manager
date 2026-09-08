import { describe, expect, it } from 'vitest'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { createNewGame } from '../../createNewGame'
import { processJournalistRelationshipRound } from '../mediaProcessor'

function gameAtRelationship(relationship: number, lastTriggeredRelationship: number): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 17 })
  return {
    ...game,
    currentMatchday: 8,
    inbox: [],
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
      lastTriggeredRelationship,
    },
  }
}

describe('mediaProcessor — journalist relationship round', () => {
  it('freezes a newly broken relationship and acknowledges the crossing', () => {
    const game = gameAtRelationship(18, 25)
    const result = processJournalistRelationshipRound(game)

    expect(result.storylines).toContainEqual(expect.objectContaining({
      type: 'journalist_feud',
      displayText: 'Relationen är bruten. Det krävs tid och ärlighet för att vända.',
      resolved: true,
    }))
    expect(result.eventLedger).toContainEqual(expect.objectContaining({
      type: 'storyline_resolution',
    }))
    expect(result.inbox).toContainEqual(expect.objectContaining({
      id: `journalist_broken_${game.currentSeason}_${game.currentMatchday}`,
      title: 'Karin Bergström · Lokaltidningen',
    }))
    expect(result.journalist?.lastTriggeredRelationship).toBe(18)
  })

  it('freezes a recovered relationship and sends the established recovery message', () => {
    const game = gameAtRelationship(80, 70)
    const result = processJournalistRelationshipRound(game)

    expect(result.storylines).toContainEqual(expect.objectContaining({
      type: 'journalist_redemption',
      displayText: 'Bergström är på er sida nu. Det håller så länge du är lika öppen tillbaka.',
      resolved: true,
    }))
    expect(result.inbox).toContainEqual(expect.objectContaining({
      id: `journalist_recovered_${game.currentSeason}_${game.currentMatchday}`,
      body: 'Tack för intervjun igår. Det märktes att ni var ärliga. Jag tänkte ringa om ett uppslag — kan vi prata?',
    }))
    expect(result.journalist?.lastTriggeredRelationship).toBe(80)
  })

  it('returns the same game when no relationship threshold was crossed', () => {
    const game = gameAtRelationship(50, 48)
    expect(processJournalistRelationshipRound(game)).toBe(game)
  })
})
