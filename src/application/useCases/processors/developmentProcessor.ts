import type { Fixture } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { TrainingIntensity, TrainingType } from '../../../domain/enums'
import { MENTOR_FORM_THRESHOLD } from '../../../domain/services/mentorshipConstants'
import { applyRoundDevelopment } from '../../../domain/services/playerDevelopmentService'

export interface ManagedDevelopmentResult {
  players: Player[]
  chemistryStats: Record<string, number>
}

/** Apply the managed club's match development, chemistry minutes and mentoring. */
export function processManagedDevelopment(
  game: SaveGame,
  players: Player[],
  simulatedFixtures: Fixture[],
  nextMatchday: number,
): ManagedDevelopmentResult {
  const chemistryStats = { ...(game.chemistryStats ?? {}) }
  const managedFixture = simulatedFixtures.find(
    fixture => fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId
  )
  const playedIds = new Set<string>()
  const starterIds = new Set<string>()
  const ratings: Record<string, number> = {}

  if (managedFixture) {
    const isHome = managedFixture.homeClubId === game.managedClubId
    const lineup = isHome ? managedFixture.homeLineup : managedFixture.awayLineup
    if (lineup) {
      for (const id of lineup.startingPlayerIds ?? []) { starterIds.add(id); playedIds.add(id) }
      for (const id of lineup.benchPlayerIds ?? []) playedIds.add(id)
    }

    const starters = Array.from(starterIds)
    for (let i = 0; i < starters.length; i++) {
      for (let j = i + 1; j < starters.length; j++) {
        const key = [starters[i], starters[j]].sort().join('|')
        chemistryStats[key] = (chemistryStats[key] ?? 0) + 90
      }
    }
    if (managedFixture.report?.playerRatings) {
      Object.assign(ratings, managedFixture.report.playerRatings)
    }
  }

  const trainingType = game.managedClubTraining?.type
  const focusBucket = trainingType === TrainingType.Tactical || trainingType === TrainingType.MatchPrep
    ? 'tactical'
    : trainingType === TrainingType.BallControl || trainingType === TrainingType.Passing || trainingType === TrainingType.Shooting
      ? 'technical'
      : 'physical'

  const intensityRaw = game.managedClubTraining?.intensity
  const burnoutSlowdownActive = (game.burnoutTrainingSlowdownUntilRound ?? 0) >= nextMatchday
  const intensityBucket = burnoutSlowdownActive
    ? 'light'
    : intensityRaw === TrainingIntensity.Light
      ? 'light'
      : intensityRaw === TrainingIntensity.Hard || intensityRaw === TrainingIntensity.Extreme
        ? 'heavy'
        : 'normal'

  let updatedPlayers = applyRoundDevelopment(
    players,
    game.managedClubId,
    focusBucket,
    intensityBucket,
    playedIds,
    starterIds,
    ratings,
    game.leadershipActions,
    nextMatchday,
  )

  const youthPlayerIds = new Set((game.youthTeam?.players ?? []).map(player => player.id))
  for (const mentorship of (game.mentorships ?? []).filter(item => item.isActive)) {
    if (youthPlayerIds.has(mentorship.youthPlayerId)) continue
    const mentor = updatedPlayers.find(player => player.id === mentorship.seniorPlayerId)
    if (!mentor || mentor.form < MENTOR_FORM_THRESHOLD) continue
    const developmentBoost = mentor.discipline / 20
    updatedPlayers = updatedPlayers.map(player => player.id === mentorship.youthPlayerId
      ? { ...player, developmentRate: Math.min(100, player.developmentRate + developmentBoost * 0.1) }
      : player
    )
  }

  return { players: updatedPlayers, chemistryStats }
}
