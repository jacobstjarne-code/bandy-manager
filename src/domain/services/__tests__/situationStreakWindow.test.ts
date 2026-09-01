/**
 * Påståendesvepet #24 (MASTER.md, 2026-08-24): getSituation räknade
 * tidigare segersvit/förlustsvit ur `form`, ett 5-matchers fönster satt
 * FÖRE räkningen (`completedLeague.slice(0, 5)`) — en verklig svit på 6+
 * matcher kunde aldrig visas som mer än "5 RAKA SEGRAR/FÖRLUSTER", taket
 * satt av fönstret, inte av den faktiska sviten.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { getSituation } from '../situationService'
import { FixtureStatus } from '../../enums'
import type { SaveGame } from '../../entities/SaveGame'
import type { Fixture } from '../../entities/Fixture'

function makeWinStreakGame(streakLength: number): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
  const opponentId = game.clubs.find(c => c.id !== game.managedClubId)!.id

  // matchday descending = most recent first (getSituation sorts b-a).
  const completedFixtures: Fixture[] = Array.from({ length: streakLength }, (_, i) => ({
    id: `won_fx_${i}`,
    season: game.currentSeason,
    matchday: streakLength - i,
    roundNumber: streakLength - i,
    homeClubId: game.managedClubId,
    awayClubId: opponentId,
    homeScore: 3,
    awayScore: 1,
    status: FixtureStatus.Completed,
    isCup: false,
  } as unknown as Fixture))

  const nextFixture: Fixture = {
    id: 'next_fx',
    season: game.currentSeason,
    matchday: streakLength + 1,
    roundNumber: streakLength + 1,
    homeClubId: game.managedClubId,
    awayClubId: opponentId,
    homeScore: 0,
    awayScore: 0,
    status: FixtureStatus.Scheduled,
    isCup: false,
  } as unknown as Fixture

  return {
    ...game,
    playoffBracket: null,
    fixtures: [...completedFixtures, nextFixture],
  }
}

describe('getSituation — M24: segersvit räknas ur HELA completedLeague, inte ett 5-fönster', () => {
  it('en verklig svit på 7 raka segrar visas som "7 RAKA SEGRAR", inte cappad till 5', () => {
    const game = makeWinStreakGame(7)
    const situation = getSituation(game)
    expect(situation.label).toBe('7 RAKA SEGRAR')
    expect(situation.body).toContain('7 raka segrar')
  })

  it('en svit på exakt 5 fortfarande visas korrekt (regression, ingen off-by-one)', () => {
    const game = makeWinStreakGame(5)
    const situation = getSituation(game)
    expect(situation.label).toBe('5 RAKA SEGRAR')
  })

  it('en svit på 12 (mer än en hel säsongs 5-fönster skulle tillåta) visas som "12 RAKA SEGRAR"', () => {
    const game = makeWinStreakGame(12)
    const situation = getSituation(game)
    expect(situation.label).toBe('12 RAKA SEGRAR')
  })

  it('en efterföljande slutspelsförlust ändrar inte den avslutade ligans segersvit', () => {
    const game = makeWinStreakGame(7)
    const playoff = {
      id: 'playoff_loss', season: game.currentSeason, matchday: 30, roundNumber: 25,
      homeClubId: game.managedClubId, awayClubId: game.clubs.find(c => c.id !== game.managedClubId)!.id,
      homeScore: 1, awayScore: 4, status: FixtureStatus.Completed,
      isCup: false, isKnockout: true,
    } as unknown as Fixture
    const situation = getSituation({ ...game, fixtures: [...game.fixtures, playoff] })
    expect(situation.label).toBe('7 RAKA SEGRAR')
  })
})
