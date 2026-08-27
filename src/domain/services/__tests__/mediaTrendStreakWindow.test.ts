/**
 * Påståendesvepet #24, andra instansen (E-M24-1, MASTER.md, 2026-08-24):
 * generateTrendArticles räknade segersvit/förlustsvit ur `completedManaged
 * .slice(0, 5)`, samma 5-matchers fönster-cap som situationService.ts hade
 * (fixad 2026-08-26, situationStreakWindow.test.ts). En verklig svit på 6+
 * kunde här aldrig visas som mer än "5 raka segrar/förluster".
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { generateTrendArticles } from '../mediaService'
import { FixtureStatus } from '../../enums'
import type { SaveGame } from '../../entities/SaveGame'
import type { Fixture } from '../../entities/Fixture'

const alwaysInclude = () => 0 // < 0.6 gate always passes

function makeStreakGame(streakLength: number, result: 'win' | 'loss'): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
  const opponentId = game.clubs.find(c => c.id !== game.managedClubId)!.id

  const completedFixtures: Fixture[] = Array.from({ length: streakLength }, (_, i) => ({
    id: `streak_fx_${i}`,
    season: game.currentSeason,
    matchday: streakLength - i,
    roundNumber: streakLength - i,
    homeClubId: game.managedClubId,
    awayClubId: opponentId,
    homeScore: result === 'win' ? 3 : 0,
    awayScore: result === 'win' ? 1 : 2,
    status: FixtureStatus.Completed,
    isCup: false,
  } as unknown as Fixture))

  return { ...game, fixtures: completedFixtures }
}

describe('generateTrendArticles — E-M24-1: svit räknas ur HELA completedManaged, inte ett 5-fönster', () => {
  it('en verklig segersvit på 7 ger "7 raka segrar", inte cappad till 5', () => {
    const game = makeStreakGame(7, 'win')
    const items = generateTrendArticles(game, 7, alwaysInclude)
    expect(items[0]?.title).toContain('7 raka segrar')
  })

  it('en förlustsvit på 12 ger "12 raka förluster", inte cappad till 5', () => {
    const game = makeStreakGame(12, 'loss')
    const items = generateTrendArticles(game, 12, alwaysInclude)
    expect(items[0]?.title).toContain('12 raka förluster')
  })

  it('en svit på exakt 5 fortfarande visas korrekt (regression, ingen off-by-one)', () => {
    const game = makeStreakGame(5, 'win')
    const items = generateTrendArticles(game, 5, alwaysInclude)
    expect(items[0]?.title).toContain('5 raka segrar')
  })
})
