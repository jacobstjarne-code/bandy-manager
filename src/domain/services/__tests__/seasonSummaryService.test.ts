import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { advanceToNextEvent } from '../../../application/useCases/advanceToNextEvent'
import { generateSeasonSummary } from '../seasonSummaryService'
import { FixtureStatus } from '../../enums'

function makeFullSeasonGame() {
  let game = createNewGame({ managerName: 'Jacob', clubId: 'club_sandviken', season: 2025, seed: 42 })
  for (let round = 1; round <= 22; round++) {
    // Set a lineup so managed club can advance
    const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId && !p.isInjured && p.suspensionGamesRemaining === 0)
    const sorted = [...managedPlayers].sort((a, b) => b.currentAbility - a.currentAbility)
    const starters = sorted.slice(0, 11)
    const bench = sorted.slice(11, 16)
    if (starters.length === 11) {
      game = {
        ...game,
        managedClubPendingLineup: {
          startingPlayerIds: starters.map(p => p.id),
          benchPlayerIds: bench.map(p => p.id),
          captainPlayerId: starters[0]?.id,
          tactic: game.clubs.find(c => c.id === game.managedClubId)!.activeTactic,
        },
      }
    }
    const result = advanceToNextEvent(game, round)
    game = result.game
  }
  return game
}

describe('generateSeasonSummary', () => {
  it('returns correct clubId and clubName', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    expect(summary.clubId).toBe('club_sandviken')
    expect(summary.clubName).toBeTruthy()
    expect(summary.season).toBe(2025)
  }, 60000)

  it('has non-zero points and position 1-12', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    expect(summary.finalPosition).toBeGreaterThanOrEqual(1)
    expect(summary.finalPosition).toBeLessThanOrEqual(12)
    expect(summary.points).toBeGreaterThan(0)
  }, 60000)

  it('homeRecord + awayRecord wins sum to total wins', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    expect(summary.homeRecord.wins + summary.awayRecord.wins).toBe(summary.wins)
  }, 60000)

  it('formTrend is one of the valid values', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    expect(['improving', 'stable', 'declining']).toContain(summary.formTrend)
  }, 60000)

  it('improving trend when second half > first half × 1.15', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    if (summary.secondHalfPoints > summary.firstHalfPoints * 1.15) {
      expect(summary.formTrend).toBe('improving')
    }
  }, 60000)

  it('narrativeSummary contains club name', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    expect(summary.narrativeSummary).toContain(summary.clubName)
  }, 60000)

  it('narrativeSummary is non-empty', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    expect(summary.narrativeSummary.length).toBeGreaterThan(20)
  }, 60000)

  it('longestWinStreak is non-negative integer', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    expect(summary.longestWinStreak).toBeGreaterThanOrEqual(0)
    expect(Number.isInteger(summary.longestWinStreak)).toBe(true)
  }, 60000)

  it('firstHalfPoints + secondHalfPoints equals total points', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    expect(summary.firstHalfPoints + summary.secondHalfPoints).toBe(summary.points)
  }, 60000)

  it('topScorer has goals >= 0', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    if (summary.topScorer) {
      expect(summary.topScorer.goals).toBeGreaterThan(0)
    }
  }, 60000)

  it('roundPoints array has 22 entries', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    expect(summary.roundPoints).toHaveLength(22)
  }, 60000)

  it('roundPoints is monotonically non-decreasing', () => {
    const game = makeFullSeasonGame()
    const summary = generateSeasonSummary(game)
    for (let i = 1; i < summary.roundPoints.length; i++) {
      expect(summary.roundPoints[i]).toBeGreaterThanOrEqual(summary.roundPoints[i-1])
    }
  }, 60000)
})

// Suppress unused import warning
void FixtureStatus
