import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import { FixtureStatus, PlayoffStatus } from '../../../domain/enums'
import { handlePlayoffStart } from '../playoffTransition'
import { handleSeasonEnd } from '../seasonEndProcessor'
import type { AdvanceResult } from '../advanceTypes'

export interface RoundContext {
  nextMatchday: number
  scheduledFixtures: Fixture[]
  scheduledLeagueFixtures: Fixture[]
  roundFixtures: Fixture[]
  currentLeagueRound: number | null
  isCupRound: boolean
  isPlayoffRound: boolean
  isSecondPassForManagedMatch: boolean
  baseSeed: number
}

export type PreRoundResult =
  | { kind: 'proceed'; context: RoundContext }
  | { kind: 'earlyReturn'; result: AdvanceResult }

export function derivePreRoundContext(
  game: SaveGame,
  seed?: number,
): PreRoundResult {
  const scheduledFixtures = game.fixtures.filter(f => f.status === FixtureStatus.Scheduled)
  const scheduledLeagueFixtures = scheduledFixtures.filter(f => !f.isCup)

  // Season-end / playoff-start guard
  if (scheduledLeagueFixtures.length === 0) {
    if (!game.playoffBracket) {
      return { kind: 'earlyReturn', result: handlePlayoffStart(game, seed) }
    }
    if (game.playoffBracket.status === PlayoffStatus.Completed) {
      const pendingCup = scheduledFixtures.filter(f => f.isCup)
      if (pendingCup.length === 0) {
        return { kind: 'earlyReturn', result: handleSeasonEnd(game, seed) }
      }
      // Cup still running — proceed to simulate
    } else {
      return { kind: 'earlyReturn', result: handleSeasonEnd(game, seed) }
    }
  }

  const nextMatchday = Math.min(...scheduledFixtures.map(f => f.matchday))

  const roundFixtures = game.fixtures.filter(f =>
    f.matchday === nextMatchday &&
    (f.status === FixtureStatus.Scheduled || f.status === FixtureStatus.Completed)
  )

  const isCupRound = roundFixtures.some(f => f.isCup)
  const isPlayoffRound = !isCupRound && game.playoffBracket !== null && nextMatchday > 26
  const currentLeagueRound = roundFixtures.find(f => !f.isCup && f.roundNumber <= 22)?.roundNumber ?? null

  // Second-pass detection (verbatim from roundProcessor)
  let aiCount = 0, aiCompletedCount = 0, hasManagedScheduled = false
  for (const f of roundFixtures) {
    const isManaged = f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId
    if (isManaged) {
      if (f.status === FixtureStatus.Scheduled) hasManagedScheduled = true
    } else {
      aiCount++
      if (f.status === FixtureStatus.Completed) aiCompletedCount++
    }
  }
  const isSecondPassForManagedMatch = aiCount > 0 && aiCompletedCount === aiCount && hasManagedScheduled

  const baseSeed = seed ?? (nextMatchday * 1000 + game.currentSeason * 7)

  return {
    kind: 'proceed',
    context: {
      nextMatchday,
      scheduledFixtures,
      scheduledLeagueFixtures,
      roundFixtures,
      currentLeagueRound,
      isCupRound,
      isPlayoffRound,
      isSecondPassForManagedMatch,
      baseSeed,
    },
  }
}
