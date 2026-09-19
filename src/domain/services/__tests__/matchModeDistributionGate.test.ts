import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createHeadlessGame, autoSelectLineup } from '../../../../scripts/stress/fixtures'
import { simulateMatch } from '../matchEngine'
import { simulateFirstHalf, simulateSecondHalf } from '../matchCore'
import { mulberry32 } from '../../utils/random'

type Score = { home: number; away: number }

const REFERENCE_MEAN = 9.121886120996441
const REFERENCE_15_PLUS = 0.05427046263345195
const REFERENCE_4_MINUS = 0.05871886120996441
const RATE_TOLERANCE = 0.015
const MEAN_TOLERANCE = 0.30

describe.sequential('match mode and result-distribution gate', () => {
  const originalRandom = Math.random
  const fast: Score[] = []
  const full: Score[] = []

  beforeAll(() => {
    try {
      // Sixteen full league schedules give 2,112 fixed comparisons. This is
      // large enough for the ±1.5 percentage-point tail gates while keeping
      // the ordinary suite quick.
      for (let world = 0; world < 16; world++) {
        const worldSeed = 810000 + world
        Math.random = mulberry32(worldSeed)
        const game = createHeadlessGame(worldSeed)
        const selections = new Map(game.clubs.map(club => [
          club.id,
          autoSelectLineup({ ...game, managedClubId: club.id }).managedClubPendingLineup!,
        ]))
        const fixtures = game.fixtures.filter(fixture =>
          !fixture.isCup && !fixture.isKnockout && fixture.season === game.currentSeason
        )

        for (const [index, fixture] of fixtures.entries()) {
          const seed = worldSeed * 1000 + index
          const home = game.clubs.find(club => club.id === fixture.homeClubId)!
          const away = game.clubs.find(club => club.id === fixture.awayClubId)!
          const input = {
            fixture,
            homeLineup: selections.get(home.id)!,
            awayLineup: selections.get(away.id)!,
            homePlayers: game.players.filter(player => player.clubId === home.id),
            awayPlayers: game.players.filter(player => player.clubId === away.id),
            homeClubName: home.name,
            awayClubName: away.name,
            seed,
          }

          Math.random = mulberry32(seed + 123)
          const fastFixture = simulateMatch(input).fixture
          fast.push({ home: fastFixture.homeScore, away: fastFixture.awayScore })

          Math.random = mulberry32(seed + 123)
          const first = [...simulateFirstHalf({ ...input, mode: 'full' as const })]
          const half = first.at(-1)!
          const second = [...simulateSecondHalf({
            ...input,
            mode: 'full' as const,
            initialHomeScore: half.homeScore,
            initialAwayScore: half.awayScore,
            initialShotsHome: half.shotsHome,
            initialShotsAway: half.shotsAway,
            initialOnTargetHome: half.onTargetHome,
            initialOnTargetAway: half.onTargetAway,
            initialCornersHome: half.cornersHome,
            initialCornersAway: half.cornersAway,
            initialHomeSuspensions: half.activeSuspensions.homeCount,
            initialAwaySuspensions: half.activeSuspensions.awayCount,
            initialHomeSuspensionTimers: half.activeSuspensions.homeTimers,
            initialAwaySuspensionTimers: half.activeSuspensions.awayTimers,
            matchProfile: half.matchProfile,
          })]
          const last = second.at(-1)!
          full.push({ home: last.homeScore, away: last.awayScore })
        }
      }
    } finally {
      Math.random = originalRandom
    }
  }, 30_000)

  afterAll(() => {
    Math.random = originalRandom
  })

  it('gives every fixture the same result in fast and live mode', () => {
    expect(full).toEqual(fast)
  })

  it('keeps the mean and both tails inside the frozen Elitserien reference gates', () => {
    const totals = fast.map(score => score.home + score.away)
    const mean = totals.reduce((sum, total) => sum + total, 0) / totals.length
    const goals15Plus = totals.filter(total => total >= 15).length / totals.length
    const goals4Minus = totals.filter(total => total <= 4).length / totals.length

    expect(Math.abs(mean - REFERENCE_MEAN)).toBeLessThanOrEqual(MEAN_TOLERANCE)
    expect(Math.abs(goals15Plus - REFERENCE_15_PLUS)).toBeLessThanOrEqual(RATE_TOLERANCE)
    expect(Math.abs(goals4Minus - REFERENCE_4_MINUS)).toBeLessThanOrEqual(RATE_TOLERANCE)
  })
})
