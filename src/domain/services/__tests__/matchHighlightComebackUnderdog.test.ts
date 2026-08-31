import { describe, it, expect } from 'vitest'
import { selectMatchOfTheSeason } from '../matchHighlightService'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import { FixtureStatus, MatchEventType } from '../../enums'
import type { Fixture } from '../../entities/Fixture'
import type { SaveGame } from '../../entities/SaveGame'

/**
 * O9 (DOMLOGG_2026-08-31.md): "MOMENT_MALL-mallarna finns men
 * selectMatchOfTheSeason producerar aldrig kategorierna" — comeback och
 * underdog_upset saknade en trigger helt. Regressionstest på bägge.
 */
function baseFixture(id: string, homeId: string, awayId: string, homeScore: number, awayScore: number): Fixture {
  return {
    id,
    leagueId: 'l1',
    season: 2026,
    roundNumber: 10,
    matchday: 10,
    homeClubId: homeId,
    awayClubId: awayId,
    status: FixtureStatus.Completed,
    homeScore,
    awayScore,
    events: [],
    isCup: false,
    isKnockout: false,
  } as Fixture
}

describe('selectMatchOfTheSeason — comeback och underdog_upset (O9)', () => {
  it('comeback: trailade vid paus men vann → category comeback', () => {
    const template = CLUB_TEMPLATES[0]
    const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
    const managedId = game.managedClubId
    const oppId = game.clubs.find(c => c.id !== managedId)!.id

    const f: Fixture = {
      ...baseFixture('f1', managedId, oppId, 3, 2),
      events: [
        { minute: 10, type: MatchEventType.Goal, clubId: oppId },
        { minute: 60, type: MatchEventType.Goal, clubId: managedId },
        { minute: 70, type: MatchEventType.Goal, clubId: managedId },
        { minute: 80, type: MatchEventType.Goal, clubId: managedId },
      ] as Fixture['events'],
    }
    const testGame: SaveGame = { ...game, fixtures: [f], currentSeason: 2026 }
    const highlight = selectMatchOfTheSeason(testGame)
    expect(highlight).not.toBeNull()
    expect(highlight!.category).toBe('comeback')
  })

  it('underdog_upset: slog en klubb med markant högre rykte', () => {
    const template = CLUB_TEMPLATES[0]
    const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
    const managedId = game.managedClubId
    const oppTemplate = game.clubs.find(c => c.id !== managedId)!

    const clubsWithGap = game.clubs.map(c => {
      if (c.id === managedId) return { ...c, reputation: 40 }
      if (c.id === oppTemplate.id) return { ...c, reputation: 90 }
      return c
    })

    const f = baseFixture('f1', managedId, oppTemplate.id, 2, 1)
    const testGame: SaveGame = { ...game, clubs: clubsWithGap, fixtures: [f], currentSeason: 2026 }
    const highlight = selectMatchOfTheSeason(testGame)
    expect(highlight).not.toBeNull()
    expect(highlight!.category).toBe('underdog_upset')
  })

  it('ingen underdog_upset när ryktegapet är litet', () => {
    const template = CLUB_TEMPLATES[0]
    const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
    const managedId = game.managedClubId
    const oppTemplate = game.clubs.find(c => c.id !== managedId)!

    const clubsNoGap = game.clubs.map(c => {
      if (c.id === managedId) return { ...c, reputation: 60 }
      if (c.id === oppTemplate.id) return { ...c, reputation: 65 }
      return c
    })

    const f = baseFixture('f1', managedId, oppTemplate.id, 2, 1)
    const testGame: SaveGame = { ...game, clubs: clubsNoGap, fixtures: [f], currentSeason: 2026 }
    const highlight = selectMatchOfTheSeason(testGame)
    // 2-1 med litet ryktegap ger score < 20 (ingen kategori-triggning alls) → null
    expect(highlight === null || highlight!.category !== 'underdog_upset').toBe(true)
  })
})
