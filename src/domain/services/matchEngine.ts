// matchEngine.ts — AI/fast-sim wrapper around matchCore.
//
// Runs both halves in 'fast' mode (no commentary, no UI interaction data),
// collects all events, computes player ratings, and returns a completed Fixture.
//
// This is the only file that should be used by roundProcessor/matchSimProcessor
// for simulating AI-vs-AI and managed-club-simulated matches.

import type { Player } from '../entities/Player'
import type { Fixture, MatchReport } from '../entities/Fixture'
import { FixtureStatus, MatchEventType, PlayerPosition } from '../enums'
import type { MatchEvent } from '../entities/Fixture'
import type { SimulateMatchInput, SimulateMatchResult, MatchStep } from './matchUtils'
import { clamp } from './matchUtils'
import { simulateFirstHalf, simulateSecondHalf, pickMatchProfileFromSeed } from './matchCore'
import { fixtureSeed } from '../utils/random'
import { evaluateSquad } from './squadEvaluator'
import { WeatherCondition } from '../enums'

export function simulateMatch(input: SimulateMatchInput): SimulateMatchResult {
  const {
    fixture,
    homeLineup,
    awayLineup,
    homePlayers,
    awayPlayers,
    homeAdvantage,
    seed,
    weather,
    homeClubName,
    awayClubName,
    isPlayoff,
    matchPhase,
    rivalry,
    fanMood,
    managedIsHome,
    storylines,
    fixtureMonth,
  } = input

  // ── Run first half (fast mode) ───────────────────────────────────────────
  const firstHalfInput = {
    fixture,
    homeLineup,
    awayLineup,
    homePlayers,
    awayPlayers,
    homeAdvantage,
    seed,
    weather,
    homeClubName,
    awayClubName,
    isPlayoff,
    matchPhase,
    rivalry,
    fanMood,
    managedIsHome,
    storylines,
    fixtureMonth,
    mode: 'fast' as const,
  }

  let lastFirstHalfStep: MatchStep | null = null
  const firstHalfEvents: MatchEvent[] = []

  for (const step of simulateFirstHalf(firstHalfInput)) {
    lastFirstHalfStep = step
    firstHalfEvents.push(...step.events)
  }

  // ── Run second half (fast mode) with state from first half ───────────────
  const fhs = lastFirstHalfStep
  const secondHalfInput = {
    ...firstHalfInput,
    initialHomeScore:       fhs?.homeScore       ?? 0,
    initialAwayScore:       fhs?.awayScore        ?? 0,
    initialShotsHome:       fhs?.shotsHome        ?? 0,
    initialShotsAway:       fhs?.shotsAway        ?? 0,
    initialCornersHome:     fhs?.cornersHome      ?? 0,
    initialCornersAway:     fhs?.cornersAway      ?? 0,
    initialHomeSuspensions: fhs?.activeSuspensions.homeCount ?? 0,
    initialAwaySuspensions: fhs?.activeSuspensions.awayCount ?? 0,
  }

  let lastStep: MatchStep | null = null
  const secondHalfEvents: MatchEvent[] = []

  for (const step of simulateSecondHalf(secondHalfInput)) {
    lastStep = step
    secondHalfEvents.push(...step.events)
  }

  const allEvents = [...firstHalfEvents, ...secondHalfEvents]
  const finalStep = lastStep ?? lastFirstHalfStep

  const homeScore   = finalStep?.homeScore    ?? 0
  const awayScore   = finalStep?.awayScore    ?? 0
  const shotsHome   = finalStep?.shotsHome    ?? 0
  const shotsAway   = finalStep?.shotsAway    ?? 0
  const onTargetHome = finalStep?.onTargetHome ?? 0
  const onTargetAway = finalStep?.onTargetAway ?? 0
  const cornersHome = finalStep?.cornersHome  ?? 0
  const cornersAway = finalStep?.cornersAway  ?? 0

  // ── Compute player ratings from collected events ─────────────────────────
  const playerGoals:    Record<string, number> = {}
  const playerAssists:  Record<string, number> = {}
  const playerRedCards: Record<string, number> = {}
  const playerSaves:    Record<string, number> = {}

  for (const ev of allEvents) {
    if (ev.type === MatchEventType.Goal    && ev.playerId) playerGoals[ev.playerId]    = (playerGoals[ev.playerId]    ?? 0) + 1
    if (ev.type === MatchEventType.Assist  && ev.playerId) playerAssists[ev.playerId]  = (playerAssists[ev.playerId]  ?? 0) + 1
    if (ev.type === MatchEventType.RedCard && ev.playerId) playerRedCards[ev.playerId] = (playerRedCards[ev.playerId] ?? 0) + 1
    if (ev.type === MatchEventType.Save    && ev.playerId) playerSaves[ev.playerId]    = (playerSaves[ev.playerId]    ?? 0) + 1
  }

  const playerRatings: Record<string, number> = {}
  const allStarterIds = [...homeLineup.startingPlayerIds, ...awayLineup.startingPlayerIds]
  for (const id of allStarterIds) playerRatings[id] = 6.0

  for (const [id, goals]   of Object.entries(playerGoals))    if (playerRatings[id] !== undefined) playerRatings[id] += goals   * 0.8
  for (const [id, assists] of Object.entries(playerAssists))  if (playerRatings[id] !== undefined) playerRatings[id] += assists  * 0.5
  for (const [id, reds]    of Object.entries(playerRedCards)) if (playerRatings[id] !== undefined) playerRatings[id] -= reds     * 1.2
  for (const [id, saves]   of Object.entries(playerSaves))    if (playerRatings[id] !== undefined) playerRatings[id] += saves    * 0.3

  // Goalkeeper clean sheet bonus
  const homeStarters = homeLineup.startingPlayerIds.map(id => homePlayers.find(p => p.id === id)).filter((p): p is Player => p !== undefined)
  const awayStarters = awayLineup.startingPlayerIds.map(id => awayPlayers.find(p => p.id === id)).filter((p): p is Player => p !== undefined)
  const homeGkPlayer = homeStarters.find(p => p.position === PlayerPosition.Goalkeeper)
  const awayGkPlayer = awayStarters.find(p => p.position === PlayerPosition.Goalkeeper)
  if (homeGkPlayer && awayScore === 0 && homeLineup.startingPlayerIds.includes(homeGkPlayer.id)) {
    playerRatings[homeGkPlayer.id] = (playerRatings[homeGkPlayer.id] ?? 6.0) + 1.0
  }
  if (awayGkPlayer && homeScore === 0 && awayLineup.startingPlayerIds.includes(awayGkPlayer.id)) {
    playerRatings[awayGkPlayer.id] = (playerRatings[awayGkPlayer.id] ?? 6.0) + 1.0
  }

  // Win/loss adjustments
  const isHomeTied = homeScore === awayScore
  for (const id of homeLineup.startingPlayerIds) {
    if (!isHomeTied) playerRatings[id] = (playerRatings[id] ?? 6.0) + (homeScore > awayScore ? 0.3 : -0.2)
  }
  for (const id of awayLineup.startingPlayerIds) {
    if (!isHomeTied) playerRatings[id] = (playerRatings[id] ?? 6.0) + (awayScore > homeScore ? 0.3 : -0.2)
  }

  // Seeded random variance ±0.5 — use a simple deterministic hash of the seed
  const seedVal = seed ?? fixtureSeed(fixture.id)
  let rngState  = seedVal
  const fastRand = () => {
    rngState = (rngState * 1664525 + 1013904223) >>> 0
    return rngState / 4294967296
  }
  for (const id of Object.keys(playerRatings)) {
    playerRatings[id] += (fastRand() - 0.5) * 1.0
    playerRatings[id]  = clamp(playerRatings[id], 3.0, 10.0)
  }

  // Player of the match
  let playerOfTheMatchId: string | undefined
  let highestRating = -Infinity
  for (const [id, rating] of Object.entries(playerRatings)) {
    if (rating > highestRating) { highestRating = rating; playerOfTheMatchId = id }
  }

  // Possession estimate from shot counts (rough but sufficient for report)
  const totalShots    = shotsHome + shotsAway
  const possessionHome = totalShots > 0 ? Math.round((shotsHome / totalShots) * 100) : 50
  const possessionAway = 100 - possessionHome

  // Saves: count Save events per club (defending club = club making the save)
  const savesHome = allEvents.filter(e => e.type === MatchEventType.Save && e.clubId === fixture.homeClubId).length
  const savesAway = allEvents.filter(e => e.type === MatchEventType.Save && e.clubId === fixture.awayClubId).length

  // Re-derive matchProfile deterministically (same inputs → same result as matchCore)
  const isHeavyWeather = weather?.condition === WeatherCondition.HeavySnow || weather?.condition === WeatherCondition.Thaw
  const hasRivalry = rivalry != null
  const homeEvalForProfile = evaluateSquad(homeStarters, homeLineup.tactic)
  const awayEvalForProfile = evaluateSquad(awayStarters, awayLineup.tactic)
  const largeCaDiff = Math.abs(homeEvalForProfile.offenseScore - awayEvalForProfile.offenseScore) >= 15
  const matchProfile = pickMatchProfileFromSeed(seedVal, { isPlayoff: isPlayoff ?? false, hasRivalry, isHeavyWeather, largeCaDiff })

  const report: MatchReport = {
    playerRatings,
    shotsHome,
    shotsAway,
    onTargetHome,
    onTargetAway,
    savesHome,
    savesAway,
    cornersHome,
    cornersAway,
    penaltiesHome: 0,
    penaltiesAway: 0,
    possessionHome,
    possessionAway,
    playerOfTheMatchId,
    matchProfile,
  }

  // Overtime / penalty metadata from events and last step
  const wentToOvertime  = lastStep?.phase === 'overtime' || finalStep?.phase === 'overtime' || undefined
  const wentToPenalties = finalStep?.phase === 'penalties' || undefined
  const overtimeResult  = (() => {
    for (const step of [lastStep, finalStep]) {
      if (step?.overtimeResult) return step.overtimeResult
    }
    return undefined
  })()
  const penaltyResult   = finalStep?.penaltyFinalResult

  const updatedFixture: Fixture = {
    ...fixture,
    homeScore,
    awayScore,
    status: FixtureStatus.Completed,
    homeLineup,
    awayLineup,
    events: allEvents,
    report,
    wentToOvertime:  wentToOvertime  || undefined,
    wentToPenalties: wentToPenalties || undefined,
    overtimeResult,
    penaltyResult,
  }

  return { fixture: updatedFixture }
}
