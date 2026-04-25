import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { Player } from '../../../domain/entities/Player'
import type { Club } from '../../../domain/entities/Club'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Weather } from '../../../domain/entities/Weather'
import type { Moment } from '../../../domain/entities/Moment'
import { FixtureStatus, MatchEventType } from '../../../domain/enums'
import { computeWeatherTacticInteraction } from '../../../domain/services/matchSimulator'
import { getTacticModifiers } from '../../../domain/services/tacticModifiers'
import { developPlayers } from '../../../domain/services/playerDevelopmentService'
import { mulberry32 } from '../../../domain/utils/random'
import { generateInjuryEntry, generateReturnFromInjuryEntry } from '../../../domain/services/narrativeService'
import { generateInjuryNarrative } from '../../../domain/data/injuryStories'

export interface PlayerStateResult {
  updatedPlayers: Player[]
  newlyInjured: Array<{ player: Player; days: number }>
  newlySuspended: Array<{ player: Player }>
}

function getPlayerRating(playerId: string, fixtures: Fixture[]): number | null {
  for (const fixture of fixtures) {
    if (fixture.report?.playerRatings[playerId] !== undefined) {
      return fixture.report.playerRatings[playerId]
    }
  }
  return null
}

export function applyPlayerStateUpdates(
  players: Player[],
  startersThisRound: Set<string>,
  benchThisRound: Set<string>,
  game: SaveGame,
  managedTacticMods: ReturnType<typeof getTacticModifiers> | null,
  managedFixtureWeather: Weather | undefined,
  managedClubForTactic: Club | undefined,
  baseSeed: number,
  nextRound: number,
  simulatedFixtures: Fixture[],
): PlayerStateResult {
  const localRand = mulberry32(baseSeed + 9999)

  // Player fitness / form / sharpness updates (start from training-updated players)
  const updatedPlayers = players.map(player => {
    let updated = { ...player }

    // ── Injury recovery (every round ≈ 7 days) ──────────────────────────
    if (updated.isInjured && updated.injuryDaysRemaining > 0) {
      updated.injuryDaysRemaining = Math.max(0, updated.injuryDaysRemaining - 7)
      if (updated.injuryDaysRemaining <= 0) {
        updated.isInjured = false
        updated.injuryDaysRemaining = 0
        updated.fitness = Math.max(30, updated.fitness - 15)
        updated.injuryNarrative = undefined
        // Narrative: recovery entry for managed players
        if (player.clubId === game.managedClubId) {
          const recoveryEntry = generateReturnFromInjuryEntry(game.currentSeason, nextRound)
          updated.narrativeLog = [...(updated.narrativeLog ?? []), recoveryEntry].slice(-20)
        }
      }
    }

    // ── Suspension recovery (decrement every round for all suspended players) ──
    if (updated.suspensionGamesRemaining > 0) {
      updated.suspensionGamesRemaining = Math.max(0, updated.suspensionGamesRemaining - 1)
    }

    if (startersThisRound.has(player.id)) {
      // Reduce fitness 15-25
      const baseFitnessLoss = 15 + Math.floor(localRand() * 10)
      const tacticFatigue = managedTacticMods && player.clubId === game.managedClubId
        ? managedTacticMods.fatigueRate
        : 1.0
      // Tactic × weather extra fatigue for managed players
      let weatherTacticFatigue = 1.0
      if (player.clubId === game.managedClubId && managedFixtureWeather && managedClubForTactic) {
        const twi = computeWeatherTacticInteraction(managedFixtureWeather, managedClubForTactic.activeTactic)
        weatherTacticFatigue = 1.0 + twi.extraFatigue
      }
      const fitnessLoss = Math.round(baseFitnessLoss * tacticFatigue * weatherTacticFatigue)
      updated.fitness = Math.max(0, updated.fitness - fitnessLoss)

      // Form update based on match rating
      const rating = getPlayerRating(player.id, simulatedFixtures)
      if (rating !== null) {
        if (rating >= 7) updated.form = Math.min(100, updated.form + 3)
        else if (rating <= 5) updated.form = Math.max(0, updated.form - 3)
        else updated.form = Math.min(100, updated.form + 1)
      }

      // Sharpness increases
      updated.sharpness = Math.min(100, updated.sharpness + 10)

    } else if (benchThisRound.has(player.id)) {
      updated.fitness = Math.min(100, updated.fitness + 5)
      updated.sharpness = Math.max(0, updated.sharpness - 5)
    } else {
      // Did not play
      updated.fitness = Math.min(100, updated.fitness + 8)
      updated.sharpness = Math.max(0, updated.sharpness - 3)
    }

    // Day job morale effects
    const isFullTimePro = player.isFullTimePro ?? false
    const flexibility = player.dayJob?.flexibility ?? 75
    if (!isFullTimePro && flexibility < 65) {
      // Check if played in last 2 completed fixtures for managed club
      const recentCompleted = simulatedFixtures
        .filter(f => f.status === FixtureStatus.Completed)
        .slice(-2)
      const playedRecently = recentCompleted.some(f =>
        (f.homeLineup?.startingPlayerIds ?? []).includes(player.id) ||
        (f.awayLineup?.startingPlayerIds ?? []).includes(player.id)
      )
      if (playedRecently) {
        // Hard week: day job + matches
        updated.morale = Math.max(0, updated.morale - 2)
      }
    }
    if (isFullTimePro && updated.fitness > 70) {
      updated.morale = Math.min(100, updated.morale + 1)
    }

    return updated
  })

  // Utvisning i bandy = 10 minuters penalty på isen (spelaren kommer tillbaka).
  // Det är INTE en spelande avstängning. Ingen suspensionGamesRemaining sätts.
  // Matchstraff är extremt sällsynt (~2% av utvisningar) och ger 1 match.
  const newlyInjured: Array<{ player: Player; days: number }> = []
  const newlySuspended: Array<{ player: Player }> = []

  for (const fixture of simulatedFixtures) {
    for (const event of fixture.events) {
      if (event.type === MatchEventType.RedCard && event.playerId) {
        // ~2% sannolikhet för matchstraff (grovt foul) → 1 match avstängd
        const isMatchPenalty = Math.random() < 0.02
        if (isMatchPenalty) {
          const idx = updatedPlayers.findIndex(p => p.id === event.playerId)
          if (idx !== -1) {
            const prev = updatedPlayers[idx].suspensionGamesRemaining
            updatedPlayers[idx] = { ...updatedPlayers[idx], suspensionGamesRemaining: 1 }
            if (prev === 0) {
              newlySuspended.push({ player: updatedPlayers[idx] })
            }
          }
        }
      }
    }
  }

  // Post-match injury check for every starter
  // ~5-8% base chance per match player with average fitness/proneness
  for (const playerId of startersThisRound) {
    const idx = updatedPlayers.findIndex(p => p.id === playerId)
    if (idx === -1) continue
    const player = updatedPlayers[idx]
    if (player.isInjured) continue

    // injury chance = base × proneness factor × fatigue factor
    // base 0.06 → ~6% for average player (proneness 50, fitness 70)
    const proneFactor = player.injuryProneness / 100        // 0–1
    const fatigueFactor = (100 - player.fitness) / 100 + 0.3 // 0.3–1.3
    let tacticInjuryMod = managedTacticMods && player.clubId === game.managedClubId
      ? 1.0 + (managedTacticMods.fatigueRate - 1.0) * 0.5
      : 1.0
    if (player.clubId === game.managedClubId && managedFixtureWeather && managedClubForTactic) {
      const twi = computeWeatherTacticInteraction(managedFixtureWeather, managedClubForTactic.activeTactic)
      tacticInjuryMod += twi.extraInjuryRisk
    }
    const injuryChance = 0.06 * Math.max(0.1, proneFactor) * fatigueFactor * tacticInjuryMod

    if (localRand() < injuryChance) {
      const days = 7 + Math.floor(localRand() * 28)  // 1–5 weeks
      const injuryTypes = ['knä', 'axel', 'vrist', 'huvud', 'rygg', 'hamstring']
      const injuryType = injuryTypes[Math.floor(localRand() * injuryTypes.length)]
      let injuredPlayer = { ...player, isInjured: true, injuryDaysRemaining: days }
      // Narrative: injury entry for managed players
      if (player.clubId === game.managedClubId) {
        const injuryEntry = generateInjuryEntry(game.currentSeason, nextRound, days)
        injuredPlayer.narrativeLog = [...(player.narrativeLog ?? []), injuryEntry].slice(-20)
        // DREAM-012: human injury narrative
        const { narrative, familyContext } = generateInjuryNarrative(player.familyContext, injuryType, localRand)
        injuredPlayer.injuryNarrative = narrative
        injuredPlayer.familyContext = familyContext
      }
      updatedPlayers[idx] = injuredPlayer
      newlyInjured.push({ player: updatedPlayers[idx], days })
    }
  }

  // Player development every 2 rounds (AI clubs only — managed club is handled per-round
  // by applyRoundDevelopment in roundProcessor with match context)
  let finalPlayers = updatedPlayers
  if (nextRound % 2 === 0) {
    const clubFacilities = Object.fromEntries(game.clubs.map(c => [c.id, c.facilities]))
    const aiPlayers = updatedPlayers.filter(p => p.clubId !== game.managedClubId)
    const devResult = developPlayers({
      players: aiPlayers,
      clubFacilities,
      weekNumber: nextRound,
    })
    finalPlayers = [
      ...devResult.updatedPlayers,
      ...updatedPlayers.filter(p => p.clubId === game.managedClubId),
    ]
  }

  return {
    updatedPlayers: finalPlayers,
    newlyInjured,
    newlySuspended,
  }
}

// ── WEAK-006/DEV-009: Captain morale cascade ──────────────────────────────

export function applyCaptainMoraleCascade(
  players: Player[],
  game: SaveGame,
  nextMatchday: number,
  existingNewInboxItems: InboxItem[],
): { updatedPlayers: Player[]; captainCrisisMoment: Moment | null } {
  if (!game.captainPlayerId) return { updatedPlayers: players, captainCrisisMoment: null }
  const captain = players.find(p => p.id === game.captainPlayerId)
  if (!captain || captain.morale >= 40) return { updatedPlayers: players, captainCrisisMoment: null }

  const alreadySentId = `inbox_captain_crisis_r${nextMatchday}_${game.currentSeason}`
  const alreadySent = existingNewInboxItems.some(i => i.id === alreadySentId) || game.inbox.some(i => i.id === alreadySentId)
  if (alreadySent) return { updatedPlayers: players, captainCrisisMoment: null }

  const updatedPlayers = players.map(p => {
    if (p.clubId !== game.managedClubId || p.id === captain.id) return p
    return { ...p, morale: Math.max(0, p.morale - 5) }
  })
  return {
    updatedPlayers,
    captainCrisisMoment: {
      id: alreadySentId,
      source: 'captain_crisis',
      matchday: nextMatchday,
      season: game.currentSeason,
      title: 'Omklädningsrummet är tyst',
      body: `Kapten ${captain.firstName} ${captain.lastName} har inte sagt mycket denna vecka. Det märks i hela truppen.`,
      subjectPlayerId: captain.id,
    },
  }
}
