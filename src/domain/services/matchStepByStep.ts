import type { Player } from '../entities/Player'
import type { MatchEvent } from '../entities/Fixture'
import { MatchEventType, PlayerPosition, PlayerArchetype, WeatherCondition } from '../enums'
import { evaluateSquad } from './squadEvaluator'
import { getTacticModifiers } from './tacticModifiers'
import { mulberry32 } from '../utils/random'
import { commentary, fillTemplate, pickCommentary, getTraitCommentary } from '../data/matchCommentary'
import { getConditionLabel, getIceQualityLabel } from './weatherService'
import {
  clamp, randRange, weightedPick, pickWeightedPlayer,
  SEQUENCE_TYPES, computeWeatherEffects, computeWeatherTacticInteraction,
  simulatePenalties, pickGoalCommentary, pickWeatherCommentary,
  GOAL_TIMING_BY_PERIOD, SUSP_TIMING_BY_PERIOD, PHASE_CONSTANTS, getTimingPeriod,
} from './matchUtils'
import type { MatchStep, StepByStepInput } from './matchUtils'
import { shouldBeInteractive, buildCornerInteractionData } from './cornerInteractionService'
import type { CornerInteractionData } from './cornerInteractionService'
import { resolveAIPenaltyKeeperDive, resolvePenalty } from './penaltyInteractionService'
import type { PenaltyInteractionData } from './penaltyInteractionService'
import type { CounterInteractionData } from './counterAttackInteractionService'
import type { FreeKickInteractionData } from './freeKickInteractionService'
import type { LastMinutePressData } from './lastMinutePressService'

// ── Match situation helpers ────────────────────────────────────────────────

type MatchSituation = 'dominating_home' | 'dominating_away' | 'tight' | 'opened_up' | 'neutral'

function getMatchSituation(
  homeShots: number, awayShots: number,
  homeScore: number, awayScore: number,
  step: number,
): MatchSituation {
  const shotDiff = homeShots - awayShots
  const goalTotal = homeScore + awayScore
  if (shotDiff > 4 && step > 10) return 'dominating_home'
  if (shotDiff < -4 && step > 10) return 'dominating_away'
  if (goalTotal >= 6 && step > 20) return 'opened_up'
  if (goalTotal <= 1 && step > 25) return 'tight'
  return 'neutral'
}

type SecondHalfMode = 'chasing' | 'controlling' | 'even_battle' | 'cruise'

function getSecondHalfMode(
  managedScore: number, opponentScore: number,
  step: number,
  matchPhase: import('./matchUtils').MatchPhaseContext = 'regular',
): SecondHalfMode {
  const diff = managedScore - opponentScore
  // In knockouts the game is more decisive — chasing mode triggers one goal earlier
  const chasingThreshold = matchPhase === 'quarterfinal' ? -1 : -2
  if (diff <= chasingThreshold) return 'chasing'
  if (diff >= 3) return 'cruise'
  if (diff >= 1 && step > 45) return 'controlling'
  return 'even_battle'
}

type RefStyle = 'strict' | 'lenient' | 'inconsistent'

function pickRefStyle(rand: () => number): RefStyle {
  const r = rand()
  if (r < 0.33) return 'strict'
  if (r < 0.66) return 'lenient'
  return 'inconsistent'
}

export function* simulateMatchStepByStep(input: StepByStepInput): Generator<MatchStep> {
  const {
    fixture,
    homeLineup,
    awayLineup,
    homePlayers,
    awayPlayers,
    homeAdvantage = 0.05,
    seed,
    weather,
    homeClubName,
    awayClubName,
    isPlayoff = false,
    matchPhase = 'regular',
    rivalry,
    fanMood,
    managedIsHome,
  } = input

  const phaseConst = PHASE_CONSTANTS[matchPhase]
  const captainPlayerId = input.captainPlayerId
  const fanFavoritePlayerId = input.fanFavoritePlayerId
  const supporterCtx = input.supporterContext

  const rand = mulberry32(seed ?? Date.now())

  // Match-level constants set once
  const refStyle: RefStyle = pickRefStyle(rand)

  // Resolve starters
  const homeStarters = homeLineup.startingPlayerIds
    .map(id => homePlayers.find(p => p.id === id))
    .filter((p): p is Player => p !== undefined)

  const awayStarters = awayLineup.startingPlayerIds
    .map(id => awayPlayers.find(p => p.id === id))
    .filter((p): p is Player => p !== undefined)

  // Evaluate squads
  const homeEval = evaluateSquad(homeStarters, homeLineup.tactic)
  const awayEval = evaluateSquad(awayStarters, awayLineup.tactic)

  // Get tactic modifiers
  const homeMods = getTacticModifiers(homeLineup.tactic)
  const awayMods = getTacticModifiers(awayLineup.tactic)

  // Composite scores (0-1 scale)
  let homeAttackSbs = (homeEval.offenseScore * homeMods.offenseModifier) / 100
  const homeDefense = (homeEval.defenseScore * homeMods.defenseModifier) / 100
  const homeCorner = (homeEval.cornerScore * homeMods.cornerModifier) / 100
  const homeGK = homeEval.goalkeeperScore / 100
  const homeDisciplineRisk = (homeEval.disciplineRisk * homeMods.disciplineModifier) / 100
  const homeTacticalDiscipline = homeEval.tacticalDiscipline / 100  // 0-1
  const homeCornerRecovery = homeEval.cornerRecoveryScore / 100     // 0-1

  let awayAttackSbs = (awayEval.offenseScore * awayMods.offenseModifier) / 100
  const awayDefense = (awayEval.defenseScore * awayMods.defenseModifier) / 100
  const awayCorner = (awayEval.cornerScore * awayMods.cornerModifier) / 100
  const awayGK = awayEval.goalkeeperScore / 100
  const awayDisciplineRisk = (awayEval.disciplineRisk * awayMods.disciplineModifier) / 100
  const awayTacticalDiscipline = awayEval.tacticalDiscipline / 100  // 0-1
  const awayCornerRecovery = awayEval.cornerRecoveryScore / 100     // 0-1

  // Apply weather modifiers (with tactic interaction)
  let weatherGoalModSbs = 1.0
  if (weather && weather.condition !== undefined) {
    const { ballControlPenalty, speedModifier, goalChanceModifier } = computeWeatherEffects(weather)
    const homeTacticWeatherSbs = computeWeatherTacticInteraction(weather, homeLineup.tactic)
    const awayTacticWeatherSbs = computeWeatherTacticInteraction(weather, awayLineup.tactic)
    homeAttackSbs *= (1 - (ballControlPenalty + homeTacticWeatherSbs.extraBallControlPenalty) / 200) * speedModifier
    awayAttackSbs *= (1 - (ballControlPenalty + awayTacticWeatherSbs.extraBallControlPenalty) / 200) * speedModifier
    weatherGoalModSbs = goalChanceModifier
  }

  // Playoff intensity modifiers
  if (isPlayoff) {
    const homeStrengthBonusSbs = (homeAttackSbs - awayAttackSbs) * 0.1
    homeAttackSbs = clamp(homeAttackSbs + homeStrengthBonusSbs, 0, 1)
  }

  // Derby intensity modifiers
  let derbyFoulMult = 1.0
  let derbyChanceMult = 0.0
  let effectiveHomeAdvantageSbs = fixture.isNeutralVenue ? 0 : homeAdvantage + phaseConst.homeAdvDelta
  // Fan mood affects home advantage (only when managed club plays at home)
  if (!fixture.isNeutralVenue && fanMood !== undefined && managedIsHome) {
    effectiveHomeAdvantageSbs *= 1 + ((fanMood - 50) / 100) * 0.06
  }
  if (rivalry) {
    const avgAttack = (homeAttackSbs + awayAttackSbs) / 2
    homeAttackSbs = avgAttack + (homeAttackSbs - avgAttack) * 0.7
    awayAttackSbs = avgAttack + (awayAttackSbs - avgAttack) * 0.7
    derbyFoulMult = 1 + rivalry.intensity * 0.15
    derbyChanceMult = 0.05
    if (!fixture.isNeutralVenue) {
      effectiveHomeAdvantageSbs = (homeAdvantage + phaseConst.homeAdvDelta) * (1 + rivalry.intensity * 0.1)
    }
  }

  // Alias for use in the loop
  const homeAttack = homeAttackSbs
  const awayAttack = awayAttackSbs
  const weatherGoalMod = weatherGoalModSbs
  const effectiveHomeAdvantage = effectiveHomeAdvantageSbs

  // Opening weather note
  let openingWeatherNote: string | undefined
  if (weather) {
    const tempStr = `${weather.temperature > 0 ? '+' : ''}${weather.temperature}°`
    const condText = getConditionLabel(weather.condition)
    const iceText = getIceQualityLabel(weather.iceQuality)
    openingWeatherNote = `${tempStr} i ${weather.region}. ${condText}. ${iceText}.`
  }

  // Match state
  let homeScore = 0
  let awayScore = 0

  // Suspension tracking
  let homeActiveSuspensions = 0
  let awayActiveSuspensions = 0
  const homeSuspensionTimers: number[] = []
  const awaySuspensionTimers: number[] = []

  // Counters
  let shotsHome = 0
  let shotsAway = 0
  let cornersHome = 0
  let cornersAway = 0
  let interactiveCornersUsed = 0
  let interactiveCountersUsed = 0
  let interactiveFreeKicksUsed = 0
  let lastMinutePressTriggered = false

  // Momentum tracking (last 5 steps)
  const recentHomeShots: number[] = []
  const recentAwayShots: number[] = []
  let prevMomentumDiff = 0
  let situationalInterval = randRange(rand, 8, 12) | 0

  // Per-player tracking for ratings (needed for final report)
  const playerGoals: Record<string, number> = {}
  const playerAssists: Record<string, number> = {}
  const playerRedCards: Record<string, number> = {}
  const playerSaves: Record<string, number> = {}

  // All events accumulated for final report
  const allEvents: MatchEvent[] = []

  // Combined player lookup
  const allPlayers = [...homePlayers, ...awayPlayers]

  function findPlayerName(playerId: string): string {
    const p = allPlayers.find(pl => pl.id === playerId)
    return p ? `${p.firstName} ${p.lastName}` : playerId
  }

  function trackGoal(playerId: string) {
    playerGoals[playerId] = (playerGoals[playerId] ?? 0) + 1
  }

  function trackAssist(playerId: string) {
    playerAssists[playerId] = (playerAssists[playerId] ?? 0) + 1
  }

  function trackRed(playerId: string) {
    playerRedCards[playerId] = (playerRedCards[playerId] ?? 0) + 1
  }

  function trackSave(playerId: string) {
    playerSaves[playerId] = (playerSaves[playerId] ?? 0) + 1
  }

  function getGoalScorer(starters: Player[]): Player | undefined {
    const nonGK = starters.filter(p => p.position !== PlayerPosition.Goalkeeper)
    if (nonGK.length === 0) return undefined
    const weights = nonGK.map(p => {
      let w = p.position === PlayerPosition.Forward ? 3 :
        p.position === PlayerPosition.Midfielder ? 2 :
        p.position === PlayerPosition.Half ? 1 : 0.5
      if (p.isCharacterPlayer) {
        if (p.trait === 'hungrig') w *= 1.4
        else if (p.trait === 'veteran') w *= 1.2
        else if (p.trait === 'lokal') w *= 1.2
        else if (p.trait === 'ledare') w *= 1.1
        else if (p.trait === 'joker') w *= rand() < 0.3 ? 2.8 : 0.6
      }
      return w
    })
    return pickWeightedPlayer(rand, nonGK, weights)
  }

  function getAssistProvider(starters: Player[], excludeId?: string): Player | undefined {
    const nonGK = starters.filter(p =>
      p.position !== PlayerPosition.Goalkeeper && p.id !== excludeId
    )
    if (nonGK.length === 0) return undefined
    const weights = nonGK.map(p => {
      if (p.position === PlayerPosition.Midfielder) return 2
      if (p.position === PlayerPosition.Half) return 2
      if (p.position === PlayerPosition.Defender) return 1
      return 1.5
    })
    return pickWeightedPlayer(rand, nonGK, weights)
  }

  function getGK(starters: Player[]): Player | undefined {
    return starters.find(p => p.position === PlayerPosition.Goalkeeper)
  }

  // Profile-weighted foul selection. The scoreline drives profile relevance:
  // - 'situation' and 'intensitet': fire disproportionately in close games (|margin| ≤ 1)
  // - 'intensitet': almost never fouls when the game is decided (|margin| > 2)
  // - 'volym': elevated baseline, margin-agnostic
  // - 'ren': below-average regardless
  function getDefendingPlayer(
    starters: Player[],
    attackScore: number,
    defendScore: number,
  ): Player | undefined {
    const nonGK = starters.filter(p => p.position !== PlayerPosition.Goalkeeper)
    if (nonGK.length === 0) return undefined
    const margin = Math.abs(attackScore - defendScore)
    const isClose = margin <= 1
    const isDecided = margin > 2
    const weights = nonGK.map(p => {
      switch (p.suspensionProfile) {
        case 'situation':   return isClose ? 2.2 : 0.8
        case 'intensitet':  return isDecided ? 0.2 : isClose ? 3.0 : 1.0
        case 'volym':       return 1.6
        case 'ren':         return 0.45
        default:            return 1.0
      }
    })
    const total = weights.reduce((s, w) => s + w, 0)
    let r = rand() * total
    for (let i = 0; i < nonGK.length; i++) {
      r -= weights[i]
      if (r <= 0) return nonGK[i]
    }
    return nonGK[nonGK.length - 1]
  }

  function buildSequenceWeights(isHome: boolean, step: number, situation: MatchSituation): number[] {
    const tactic = isHome ? homeLineup.tactic : awayLineup.tactic
    const mods = isHome ? homeMods : awayMods

    let wAttack = 40
    let wTransition = 15
    let wCorner = 28
    let wHalfchance = 10
    let wFoul = 12
    let wLostball = 8
    // New variation sequences — lower base weights
    let wTacticalShift = 4
    let wPlayerDuel = 6
    let wAtmosphere = 5
    let wOffside = 4
    let wFreekick = 5

    if (tactic.tempo === 'high') {
      wAttack += 5
      wCorner += 3
      wFoul += 2
    } else if (tactic.tempo === 'low') {
      wAttack -= 5
      wLostball += 5
    }

    if (tactic.press === 'high') {
      wFoul += 5
      wTransition += 3
    }

    if (tactic.width === 'wide') {
      wCorner += 5
    }

    if (tactic.cornerStrategy === 'aggressive') {
      wCorner += 3
    }

    if (tactic.passingRisk === 'direct') {
      wLostball += 5
      wAttack += 3
      wHalfchance -= 3
    }

    if (tactic.mentality === 'offensive') {
      wAttack += 5
      wHalfchance += 3
    }

    // Situation-based adjustments
    if (step < 5 || step > 55) wAtmosphere += 4
    if (step >= 30 && step <= 35) wTacticalShift += 3
    if (situation === 'tight') wPlayerDuel += 4
    if (step >= 30) wOffside += 2

    void mods

    return [
      Math.max(1, wAttack),
      Math.max(1, wTransition),
      Math.max(1, wCorner),
      Math.max(1, wHalfchance),
      Math.max(1, wFoul),
      Math.max(1, wLostball),
      Math.max(1, wTacticalShift),
      Math.max(1, wPlayerDuel),
      Math.max(1, wAtmosphere),
      Math.max(1, wOffside),
      Math.max(1, wFreekick),
    ]
  }

  for (let step = 0; step < 60; step++) {
    const minute = Math.round(step * 1.5)
    const stepEvents: MatchEvent[] = []

    // B3: Ice degrades in second half (step > 30)
    const period = getTimingPeriod(minute)
    let stepGoalMod = weatherGoalMod * phaseConst.goalMod * GOAL_TIMING_BY_PERIOD[period]
    if (weather && step > 30) {
      const base = 0.03
      const snowExtra = weather.condition === WeatherCondition.HeavySnow ? 0.02 : 0
      const thawExtra = weather.condition === WeatherCondition.Thaw ? 0.03 : 0
      const iceDegradation = base + snowExtra + thawExtra
      const degradationPenalty = iceDegradation * (step - 30) * 0.5
      stepGoalMod = Math.max(0.60, stepGoalMod - degradationPenalty / 100)
    }

    // Second half mode — apply goal/foul multipliers (Sprint C)
    let secondHalfGoalMod = 1.0
    let secondHalfFoulMod = 1.0
    if (step >= 30 && managedIsHome !== undefined) {
      const managedScore = managedIsHome ? homeScore : awayScore
      const opponentScore = managedIsHome ? awayScore : homeScore
      const mode = getSecondHalfMode(managedScore, opponentScore, step, matchPhase)
      const managedTD = managedIsHome ? homeTacticalDiscipline : awayTacticalDiscipline
      if (mode === 'chasing') {
        secondHalfGoalMod = 1.08
        secondHalfFoulMod = 1.15
      } else if (mode === 'controlling') {
        secondHalfGoalMod = 0.92
        // Low tactical discipline = they gamble with suspensions even when leading.
        // Max +25% extra foul risk for a team with tacticalDiscipline near 0.
        secondHalfFoulMod = 1.0 + (1.0 - managedTD) * 0.25
      } else if (mode === 'even_battle') {
        // Tension builds toward end
        secondHalfGoalMod = step >= 50 ? 1.04 : 1.0
        secondHalfFoulMod = 1.10
      }
    }
    stepGoalMod *= secondHalfGoalMod

    // Update suspension timers
    for (let i = homeSuspensionTimers.length - 1; i >= 0; i--) {
      homeSuspensionTimers[i]--
      if (homeSuspensionTimers[i] <= 0) {
        homeSuspensionTimers.splice(i, 1)
        homeActiveSuspensions = Math.max(0, homeActiveSuspensions - 1)
      }
    }
    for (let i = awaySuspensionTimers.length - 1; i >= 0; i--) {
      awaySuspensionTimers[i]--
      if (awaySuspensionTimers[i] <= 0) {
        awaySuspensionTimers.splice(i, 1)
        awayActiveSuspensions = Math.max(0, awayActiveSuspensions - 1)
      }
    }

    // Determine initiative
    const homePenaltyFactor = homeActiveSuspensions > 0 ? 0.75 : 1.0
    const awayPenaltyFactor = awayActiveSuspensions > 0 ? 0.75 : 1.0

    const homeWeight = homeAttack * (1 + homeMods.pressModifier * 0.2) * (1 + effectiveHomeAdvantage) * homePenaltyFactor
    const awayWeight = awayAttack * (1 + awayMods.pressModifier * 0.2) * awayPenaltyFactor

    const homeInitiative = homeWeight / (homeWeight + awayWeight)
    const isHomeAttacking = rand() < homeInitiative

    const attackingStarters = isHomeAttacking ? homeStarters : awayStarters
    const defendingStarters = isHomeAttacking ? awayStarters : homeStarters
    const attackingClubId = isHomeAttacking ? fixture.homeClubId : fixture.awayClubId
    const defendingClubId = isHomeAttacking ? fixture.awayClubId : fixture.homeClubId

    const attackingTeamName = isHomeAttacking
      ? (homePlayers[0]?.clubId ?? fixture.homeClubId)
      : (awayPlayers[0]?.clubId ?? fixture.awayClubId)
    void attackingTeamName

    const attAttack = isHomeAttacking ? homeAttack : awayAttack
    const defDefense = isHomeAttacking ? awayDefense : homeDefense
    const defGK = isHomeAttacking ? awayGK : homeGK
    const attCorner = isHomeAttacking ? homeCorner : awayCorner
    const attDiscipline = isHomeAttacking ? homeDisciplineRisk : awayDisciplineRisk
    const defDiscipline = isHomeAttacking ? awayDisciplineRisk : homeDisciplineRisk

    // Steps 0–1 are the opening — force neutral, no goals or cards
    const isOpeningStep = step <= 1

    // Match situation for commentary/weights
    const situation = getMatchSituation(shotsHome, shotsAway, homeScore, awayScore, step)

    // Pick sequence type
    const seqWeights = buildSequenceWeights(isHomeAttacking, step, situation)
    const seqIdx = weightedPick(rand, seqWeights)
    const seqType = isOpeningStep ? 'neutral' : SEQUENCE_TYPES[seqIdx]

    // Track what happened for commentary selection
    let goalScored = false
    let cornerGoalScored = false
    let saveOccurred = false
    let suspensionOccurred = false
    let cornerOccurred = false
    let cornerInteractionData: CornerInteractionData | undefined
    let penaltyInteractionData: PenaltyInteractionData | undefined
    let counterInteractionData: CounterInteractionData | undefined
    let freeKickInteractionData: FreeKickInteractionData | undefined
    let lastMinutePressData: LastMinutePressData | undefined
    let scorerPlayerId: string | undefined
    let gkPlayerId: string | undefined
    let suspendedPlayerId: string | undefined

    if (seqType === 'attack') {
      const base = attAttack * 0.6 - defDefense * 0.4 + randRange(rand, -0.2, 0.2)
      const chanceQuality = clamp(base * 1.2 + 0.15 + 0.15 + derbyChanceMult, 0.05, 0.95)

      if (chanceQuality > 0.10) {
        if (isHomeAttacking) { shotsHome++ } else { shotsAway++ }

        const shotResult = rand()
        const defenderGkStrength = defGK
        const goalThreshold = chanceQuality * 0.45 * (1 - defenderGkStrength * 0.35) * stepGoalMod

        if (shotResult < goalThreshold) {
          const scorer = getGoalScorer(attackingStarters)
          const assister = getAssistProvider(attackingStarters, scorer?.id)

          if (scorer) {
            if (isHomeAttacking) { homeScore++ } else { awayScore++ }
            scorerPlayerId = scorer.id
            goalScored = true
            trackGoal(scorer.id)
            const event: MatchEvent = {
              minute,
              type: MatchEventType.Goal,
              clubId: attackingClubId,
              playerId: scorer.id,
              secondaryPlayerId: assister?.id,
              description: `Mål av ${scorer.firstName} ${scorer.lastName}`,
            }
            stepEvents.push(event)
            allEvents.push(event)
            if (assister) {
              trackAssist(assister.id)
              const assistEvent: MatchEvent = {
                minute,
                type: MatchEventType.Assist,
                clubId: attackingClubId,
                playerId: assister.id,
                secondaryPlayerId: scorer.id,
                description: `Assist av ${assister.firstName} ${assister.lastName}`,
              }
              stepEvents.push(assistEvent)
              allEvents.push(assistEvent)
            }
          }
        } else if (shotResult < goalThreshold + 0.25) {
          const gk = getGK(defendingStarters)
          if (gk) {
            gkPlayerId = gk.id
            saveOccurred = true
            trackSave(gk.id)
            const event: MatchEvent = {
              minute,
              type: MatchEventType.Save,
              clubId: defendingClubId,
              playerId: gk.id,
              description: `Räddning av ${gk.firstName} ${gk.lastName}`,
            }
            stepEvents.push(event)
            allEvents.push(event)
          }
        } else if (shotResult < goalThreshold + 0.45) {
          cornerOccurred = true
          if (isHomeAttacking) { cornersHome++ } else { cornersAway++ }
          const event: MatchEvent = {
            minute,
            type: MatchEventType.Corner,
            clubId: attackingClubId,
            description: 'Hörnslag',
          }
          stepEvents.push(event)
          allEvents.push(event)
        }
      }
    } else if (seqType === 'transition') {
      // Counter-attack interaction: managed team attacking, max 2 per match
      const isManagedTransition = managedIsHome !== undefined && (managedIsHome === isHomeAttacking)
      if (isManagedTransition && interactiveCountersUsed < 2 && rand() < 0.08) {
        const runner = attackingStarters
          .filter(p => p.position !== PlayerPosition.Goalkeeper)
          .sort((a, b) => b.attributes.skating - a.attributes.skating)[0]
        const support = attackingStarters
          .filter(p => p.position !== PlayerPosition.Goalkeeper && p.id !== runner?.id)
          .sort((a, b) => b.attributes.passing - a.attributes.passing)[0]
        if (runner && support) {
          interactiveCountersUsed++
          counterInteractionData = {
            minute,
            runnerName: `${runner.firstName} ${runner.lastName}`,
            runnerId: runner.id,
            runnerSpeed: runner.attributes.skating,
            supportName: `${support.firstName} ${support.lastName}`,
            supportId: support.id,
            defendersBeat: (1 + Math.floor(rand() * 3)) as 1 | 2 | 3,
          }
        }
      }

      const chanceQuality = randRange(rand, 0.3, 0.7)

      if (chanceQuality > 0.05) {
        if (isHomeAttacking) { shotsHome++ } else { shotsAway++ }

        const shotResult = rand()
        const goalThreshold = chanceQuality * 0.28 * (1 - defGK * 0.4) * 1.15 * stepGoalMod

        if (shotResult < goalThreshold) {
          const scorer = getGoalScorer(attackingStarters)
          const assister = getAssistProvider(attackingStarters, scorer?.id)

          if (scorer) {
            if (isHomeAttacking) { homeScore++ } else { awayScore++ }
            scorerPlayerId = scorer.id
            goalScored = true
            trackGoal(scorer.id)
            const event: MatchEvent = {
              minute,
              type: MatchEventType.Goal,
              clubId: attackingClubId,
              playerId: scorer.id,
              secondaryPlayerId: assister?.id,
              description: `Omställningsmål av ${scorer.firstName} ${scorer.lastName}`,
            }
            stepEvents.push(event)
            allEvents.push(event)
            if (assister) {
              trackAssist(assister.id)
              const assistEvent: MatchEvent = {
                minute,
                type: MatchEventType.Assist,
                clubId: attackingClubId,
                playerId: assister.id,
                secondaryPlayerId: scorer.id,
                description: `Assist av ${assister.firstName} ${assister.lastName}`,
              }
              stepEvents.push(assistEvent)
              allEvents.push(assistEvent)
            }
          }
        } else if (shotResult < goalThreshold + 0.25) {
          const gk = getGK(defendingStarters)
          if (gk) {
            gkPlayerId = gk.id
            saveOccurred = true
            trackSave(gk.id)
            const event: MatchEvent = {
              minute,
              type: MatchEventType.Save,
              clubId: defendingClubId,
              playerId: gk.id,
              description: `Räddning av ${gk.firstName} ${gk.lastName}`,
            }
            stepEvents.push(event)
            allEvents.push(event)
          }
        }
      }
    } else if (seqType === 'corner') {
      if (isHomeAttacking) { cornersHome++ } else { cornersAway++ }

      // Check if this corner should be interactive (managed club only)
      const isManagedCorner = managedIsHome !== undefined
        ? (managedIsHome === isHomeAttacking)
        : false
      const totalCornersThisMatch = cornersHome + cornersAway
      if (isManagedCorner && shouldBeInteractive(minute, homeScore, awayScore, true, totalCornersThisMatch, interactiveCornersUsed)) {
        // Build corner interaction data for the UI — skip simulated goal resolution
        interactiveCornersUsed++
        const gk = getGK(defendingStarters)
        const cornerTaker = attackingStarters
          .filter(p => p.position !== PlayerPosition.Goalkeeper)
          .sort((a, b) => b.attributes.cornerSkill - a.attributes.cornerSkill)[0]
        if (cornerTaker) {
          const sgMood = (input as StepByStepInput & { supporterMood?: number }).supporterMood ?? 50
          cornerInteractionData = buildCornerInteractionData(
            cornerTaker,
            attackingStarters,
            defendingStarters,
            isHomeAttacking,
            sgMood,
            minute,
            homeScore,
            awayScore,
          )
          cornerOccurred = true
          const cornerEvent: MatchEvent = {
            minute,
            type: MatchEventType.Corner,
            clubId: attackingClubId,
            description: 'Hörna',
          }
          stepEvents.push(cornerEvent)
          allEvents.push(cornerEvent)
          void gk
        }
      }

      if (!cornerInteractionData) {
      const cornerSpecialist = attackingStarters.find(p => p.archetype === PlayerArchetype.CornerSpecialist)
      const specialistBonus = cornerSpecialist
        ? (cornerSpecialist.attributes.cornerSkill > 75 ? 0.25 : 0.15)
        : 0
      const attackingScore = isHomeAttacking ? homeScore : awayScore
      const defendingScore = isHomeAttacking ? awayScore : homeScore
      const cornerStateMod = attackingScore < defendingScore
        ? phaseConst.cornerTrailingMod
        : attackingScore > defendingScore
          ? phaseConst.cornerLeadingMod
          : 1.0
      const cornerChance = attCorner * 0.7 + randRange(rand, 0, 0.3) + specialistBonus
      const defenseResist = defDefense * 0.5 + defGK * 0.3 + randRange(rand, 0, 0.2)
      const goalThreshold = clamp((cornerChance - defenseResist) * 0.25 * stepGoalMod * cornerStateMod + 0.08, 0.06, 0.18)

      const r = rand()
      if (r < goalThreshold) {
        const scorer = getGoalScorer(attackingStarters)
        const assister = getAssistProvider(attackingStarters, scorer?.id)

        if (scorer) {
          if (isHomeAttacking) { homeScore++ } else { awayScore++ }
          scorerPlayerId = scorer.id
          goalScored = true
          cornerGoalScored = true
          cornerOccurred = true
          const cornerEvent: MatchEvent = {
            minute,
            type: MatchEventType.Corner,
            clubId: attackingClubId,
            description: 'Hörnmål',
          }
          stepEvents.push(cornerEvent)
          allEvents.push(cornerEvent)
          trackGoal(scorer.id)
          const event: MatchEvent = {
            minute,
            type: MatchEventType.Goal,
            clubId: attackingClubId,
            playerId: scorer.id,
            secondaryPlayerId: assister?.id,
            description: `Hörnmål av ${scorer.firstName} ${scorer.lastName}`,
            isCornerGoal: true,
          }
          stepEvents.push(event)
          allEvents.push(event)
          if (assister) {
            trackAssist(assister.id)
            const assistEvent: MatchEvent = {
              minute,
              type: MatchEventType.Assist,
              clubId: attackingClubId,
              playerId: assister.id,
              secondaryPlayerId: scorer.id,
              description: `Hörnassist av ${assister.firstName} ${assister.lastName}`,
            }
            stepEvents.push(assistEvent)
            allEvents.push(assistEvent)
          }
        }
      } else if (r < goalThreshold + 0.3) {
        cornerOccurred = true
        const event: MatchEvent = {
          minute,
          type: MatchEventType.Corner,
          clubId: attackingClubId,
          description: 'Hörnslag',
        }
        stepEvents.push(event)
        allEvents.push(event)

        // Post-corner counter window. Attackers pushed forward for the corner —
        // if their defenders have low cornerRecovery they're slow to get back.
        // Max ~9% counter chance for a team with cornerRecovery near 0.
        const cornerAttackerRecovery = isHomeAttacking ? homeCornerRecovery : awayCornerRecovery
        const counterChance = (1.0 - cornerAttackerRecovery) * 0.09
        if (counterChance > 0.01 && rand() < counterChance) {
          const counterScorer = getGoalScorer(defendingStarters)
          if (counterScorer) {
            if (isHomeAttacking) { awayScore++ } else { homeScore++ }
            const counterClubId = isHomeAttacking ? fixture.awayClubId : fixture.homeClubId
            scorerPlayerId = counterScorer.id
            goalScored = true
            trackGoal(counterScorer.id)
            const counterGoalEvent: MatchEvent = {
              minute,
              type: MatchEventType.Goal,
              clubId: counterClubId,
              playerId: counterScorer.id,
              description: `Kontring av ${counterScorer.firstName} ${counterScorer.lastName}`,
            }
            stepEvents.push(counterGoalEvent)
            allEvents.push(counterGoalEvent)
          }
        }
      }
      } // end if (!pendingInteractionData)
    } else if (seqType === 'halfchance') {
      if (isHomeAttacking) { shotsHome++ } else { shotsAway++ }
      // Playoff/knockout matches have slightly higher half-chance quality (top players)
      const halfchancePlayoffBonus = isPlayoff ? 1.05 : 1.0
      const chanceQuality = randRange(rand, 0.05, 0.25) * halfchancePlayoffBonus
      const goalThreshold = chanceQuality * 0.30 * stepGoalMod

      if (rand() < goalThreshold) {
        const scorer = getGoalScorer(attackingStarters)

        if (scorer) {
          if (isHomeAttacking) { homeScore++ } else { awayScore++ }
          scorerPlayerId = scorer.id
          goalScored = true
          trackGoal(scorer.id)
          const event: MatchEvent = {
            minute,
            type: MatchEventType.Goal,
            clubId: attackingClubId,
            playerId: scorer.id,
            description: `Halvchans av ${scorer.firstName} ${scorer.lastName}`,
          }
          stepEvents.push(event)
          allEvents.push(event)
        }
      }
    } else if (seqType === 'foul') {
      // In bandy: no yellow cards, only 10-minute suspensions
      const foulProb = (attDiscipline) * 0.4 + (defDiscipline) * 0.3

      const r = rand()
      const foulThreshold = foulProb * 0.55 * phaseConst.suspMod * SUSP_TIMING_BY_PERIOD[period] * derbyFoulMult * secondHalfFoulMod
      if (r < foulThreshold) {
        // Penalty check: ~20% of fouls in attack zone → straff
        const isAttackZoneFoul = rand() < 0.35
        const isPenalty = isAttackZoneFoul && rand() < 0.20

        // Free kick interaction: dangerous foul in attack zone, managed attacking, not penalty, max 1
        if (isAttackZoneFoul && !isPenalty && interactiveFreeKicksUsed < 1 && rand() < 0.15) {
          const isManagedAttacking = managedIsHome !== undefined ? (managedIsHome === isHomeAttacking) : false
          if (isManagedAttacking) {
            const kicker = attackingStarters
              .filter(p => p.position !== PlayerPosition.Goalkeeper)
              .sort((a, b) => (b.attributes.shooting + b.attributes.passing) - (a.attributes.shooting + a.attributes.passing))[0]
            if (kicker) {
              interactiveFreeKicksUsed++
              freeKickInteractionData = {
                minute,
                kickerName: `${kicker.firstName} ${kicker.lastName}`,
                kickerId: kicker.id,
                kickerShooting: kicker.attributes.shooting,
                kickerPassing: kicker.attributes.passing,
                distanceMeters: 20 + Math.round(rand() * 8),
                wallSize: 3 + Math.round(rand() * 2),
              }
            }
          }
        }

        if (isPenalty) {
          const isManagedAttacking = managedIsHome !== undefined ? (managedIsHome === isHomeAttacking) : false
          const shooter = getGoalScorer(attackingStarters)
          const gk = getGK(defendingStarters)

          if (shooter && gk) {
            const penEvent: MatchEvent = {
              minute,
              type: MatchEventType.Penalty,
              clubId: attackingClubId,
              description: 'Straff',
            }
            stepEvents.push(penEvent)
            allEvents.push(penEvent)

            if (isManagedAttacking) {
              // Interactive — MatchLiveScreen will resolve via UI
              penaltyInteractionData = {
                minute,
                shooterName: `${shooter.firstName} ${shooter.lastName}`,
                shooterId: shooter.id,
                shooterSkill: shooter.currentAbility,
                keeperName: `${gk.firstName} ${gk.lastName}`,
                keeperSkill: gk.currentAbility,
              }
            } else {
              // AI penalty — auto-resolve
              const mentality = isHomeAttacking ? homeLineup.tactic.mentality : awayLineup.tactic.mentality
              const keeperDive = resolveAIPenaltyKeeperDive(mentality ?? 'offensive', rand)
              const aiDir = rand() < 0.4 ? 'left' : rand() < 0.7 ? 'right' : 'center'
              const aiHeight = rand() < 0.65 ? 'low' : 'high'
              const penData: PenaltyInteractionData = {
                minute,
                shooterName: `${shooter.firstName} ${shooter.lastName}`,
                shooterId: shooter.id,
                shooterSkill: shooter.currentAbility,
                keeperName: `${gk.firstName} ${gk.lastName}`,
                keeperSkill: gk.currentAbility,
              }
              const outcome = resolvePenalty(penData, aiDir as 'left' | 'center' | 'right', aiHeight as 'low' | 'high', keeperDive, rand)
              if (outcome.type === 'goal') {
                if (isHomeAttacking) { homeScore++ } else { awayScore++ }
                scorerPlayerId = shooter.id
                goalScored = true
                trackGoal(shooter.id)
                const goalEvent: MatchEvent = {
                  minute,
                  type: MatchEventType.Goal,
                  clubId: attackingClubId,
                  playerId: shooter.id,
                  description: `Strafftmål av ${shooter.firstName} ${shooter.lastName}`,
                }
                stepEvents.push(goalEvent)
                allEvents.push(goalEvent)
              }
            }
          }
        } else {
          // Normal suspension — defending team commits foul, profile-weighted by scoreline
          const attackScore = isHomeAttacking ? homeScore : awayScore
          const defendScore = isHomeAttacking ? awayScore : homeScore
          const suspPlayer = getDefendingPlayer(defendingStarters, attackScore, defendScore)
          if (suspPlayer) {
            suspendedPlayerId = suspPlayer.id
            suspensionOccurred = true
            const duration = 3 + Math.floor(rand() * 4) // 3-6 steps ≈ 5-10 min
            if (isHomeAttacking) {
              awayActiveSuspensions++
              awaySuspensionTimers.push(duration)
            } else {
              homeActiveSuspensions++
              homeSuspensionTimers.push(duration)
            }
            trackRed(suspPlayer.id)
            const event: MatchEvent = {
              minute,
              type: MatchEventType.RedCard,
              clubId: defendingClubId,
              playerId: suspPlayer.id,
              description: `Utvisning av ${suspPlayer.firstName} ${suspPlayer.lastName}`,
            }
            stepEvents.push(event)
            allEvents.push(event)
          }
        }
      }
      // No yellow cards in bandy — only suspensions
    }
    // Variation sequences — no game state change, pure commentary triggers
    // (tactical_shift, player_duel, atmosphere, offside_call, freekick_danger)
    // These are handled in commentary selection below.

    // Build score string
    const scoreStr = `${homeScore}–${awayScore}`

    // Get team name references (use club names if provided, fall back to IDs)
    const homeTeamRef = homeClubName ?? fixture.homeClubId
    const awayTeamRef = awayClubName ?? fixture.awayClubId
    const attackingTeam = isHomeAttacking ? homeTeamRef : awayTeamRef
    const defendingTeam = isHomeAttacking ? awayTeamRef : homeTeamRef

    // Get GK name for save commentary
    const savingGK = gkPlayerId ? findPlayerName(gkPlayerId) : ''

    // Pick commentary
    let commentaryText: string
    let isDerbyStep = false
    let templateVars: Record<string, string> = {
      team: attackingTeam,
      opponent: defendingTeam,
      score: scoreStr,
      minute: String(minute),
      player: scorerPlayerId ? findPlayerName(scorerPlayerId) : '',
      goalkeeper: savingGK,
      intensity: 'intensiv',
      result: homeScore > awayScore ? 'en seger' : homeScore < awayScore ? 'ingenting' : 'en poäng',
      rivalry: rivalry?.name ?? '',
    }

    if (step === 0) {
      if (rivalry) {
        commentaryText = fillTemplate(pickCommentary(commentary.derby_kickoff, rand), { ...templateVars, rivalry: rivalry.name })
        isDerbyStep = true
      } else if (matchPhase === 'final') {
        commentaryText = fillTemplate(pickCommentary(commentary.final_kickoff, rand), templateVars)
      } else if (matchPhase === 'semifinal') {
        commentaryText = fillTemplate(pickCommentary(commentary.semifinal_kickoff, rand), templateVars)
      } else if (matchPhase === 'quarterfinal') {
        commentaryText = fillTemplate(pickCommentary(commentary.quarterfinal_kickoff, rand), templateVars)
      } else if (supporterCtx && rand() < 0.30) {
        const supporterVars = { ...templateVars, leader: supporterCtx.leaderName, members: String(supporterCtx.members) }
        commentaryText = fillTemplate(pickCommentary(commentary.supporter_kickoff, rand), supporterVars)
      } else {
        commentaryText = fillTemplate(pickCommentary(commentary.kickoff, rand), templateVars)
      }
    } else if (step === 30) {
      if (supporterCtx && rand() < 0.25) {
        const supporterVars = { ...templateVars, leader: supporterCtx.leaderName, members: String(supporterCtx.members) }
        commentaryText = fillTemplate(pickCommentary(commentary.supporter_halfTime, rand), supporterVars)
      } else {
        commentaryText = fillTemplate(pickCommentary(commentary.halfTime, rand), templateVars)
      }
    } else if (cornerGoalScored && scorerPlayerId) {
      templateVars = { ...templateVars, player: findPlayerName(scorerPlayerId) }
      const cornerIntro = fillTemplate(pickCommentary(commentary.corner, rand), templateVars)
      let goalText: string
      if (weather && weather.condition === WeatherCondition.HeavySnow && rand() < 0.20) {
        goalText = fillTemplate(pickCommentary(commentary.weather_goal_heavySnow, rand), templateVars)
      } else if (weather && weather.condition === WeatherCondition.Thaw && rand() < 0.20) {
        goalText = fillTemplate(pickCommentary(commentary.weather_goal_thaw, rand), templateVars)
      } else if (rand() < 0.30) {
        goalText = fillTemplate(pickCommentary(commentary.cornerVariant, rand), templateVars)
      } else {
        goalText = fillTemplate(pickCommentary(commentary.cornerGoal, rand), templateVars)
      }
      commentaryText = cornerIntro + ' ' + goalText
    } else if (goalScored && scorerPlayerId) {
      templateVars = { ...templateVars, player: findPlayerName(scorerPlayerId) }
      if (matchPhase === 'final' && rand() < 0.60) {
        commentaryText = fillTemplate(pickCommentary(commentary.final_goal, rand), templateVars)
      } else if (matchPhase === 'semifinal' && rand() < 0.50) {
        commentaryText = fillTemplate(pickCommentary(commentary.semifinal_goal, rand), templateVars)
      } else if (rivalry && rand() < 0.40) {
        commentaryText = fillTemplate(pickCommentary(commentary.derby_goal, rand), { ...templateVars, player: findPlayerName(scorerPlayerId), rivalry: rivalry.name })
        isDerbyStep = true
      } else if (input.storylines && scorerPlayerId && rand() < 0.30) {
        const scorerStories = input.storylines.filter(s => s.playerId === scorerPlayerId)
        const scorerName = findPlayerName(scorerPlayerId)
        const storylineCommentary: Record<string, string> = {
          rescued_from_unemployment: `MÅL! ${scorerName} — mannen som nästan förlorade allt. Nu gör han säsongens viktigaste mål!`,
          went_fulltime_pro: `MÅL! ${scorerName} har gått hela vägen från deltid till proffs — och levererar!`,
          returned_to_club: `MÅL! ${scorerName} — hemkomsten kunde inte ha börjat bättre!`,
          captain_rallied_team: `MÅL! Kaptenen visar vägen — ${scorerName} sätter den!`,
          gala_winner: `MÅL! Galafavoriten ${scorerName} fortsätter imponera!`,
          underdog_season: `MÅL! I underdogens säsong kliver ${scorerName} fram igen!`,
        }
        const matchedStory = scorerStories.find(s => storylineCommentary[s.type])
        if (matchedStory) {
          commentaryText = storylineCommentary[matchedStory.type]
        } else {
          commentaryText = fillTemplate(pickGoalCommentary(isHomeAttacking ? homeScore : awayScore, isHomeAttacking ? awayScore : homeScore, rand, minute), templateVars)
        }
      } else if (scorerPlayerId && rand() < 0.40) {
        // Contextual commentary (THE_BOMB 1.3)
        const scorerPlayer = allPlayers.find(p => p.id === scorerPlayerId)
        const scorerIsManaged = managedIsHome ? isHomeAttacking : !isHomeAttacking
        const scorerName = findPlayerName(scorerPlayerId)
        const currentMargin = Math.abs(homeScore - awayScore)
        let contextual: string | null = null
        if (scorerIsManaged && scorerPlayer?.promotedFromAcademy && scorerPlayer.age <= 22) {
          contextual = `MÅL! ${scorerName} — egenodlad talent! Akademin levererar när det gäller!`
        } else if (scorerIsManaged && captainPlayerId && scorerPlayerId === captainPlayerId) {
          contextual = `MÅL! Kaptenen kliver fram! Det är därför ${scorerName} bär bindeln!`
        } else if (scorerIsManaged && fanFavoritePlayerId && scorerPlayerId === fanFavoritePlayerId) {
          contextual = `MÅL! Klackfavoriten ${scorerName}! Hör hur läktaren skanderar!`
        } else if (scorerIsManaged && scorerPlayer?.dayJob && !scorerPlayer.isFullTimePro) {
          contextual = `MÅL! ${scorerName} — ${scorerPlayer.dayJob.title} på dagarna, målskytt på kvällarna!`
        } else if (scorerIsManaged && minute >= 80 && currentMargin <= 1) {
          contextual = `SLUTMINUTERNA! ${scorerName} slår till! Stämningen är ELEKTRISK!`
        } else if (weather && (weather.condition === WeatherCondition.HeavySnow || weather.condition === WeatherCondition.Thaw) && rand() < 0.50) {
          contextual = fillTemplate(pickCommentary(
            weather.condition === WeatherCondition.HeavySnow ? commentary.weather_goal_heavySnow : commentary.weather_goal_thaw,
            rand
          ), templateVars)
        }
        if (contextual) {
          commentaryText = contextual
        } else {
          const scoringTeamScore = isHomeAttacking ? homeScore : awayScore
          const otherTeamScore = isHomeAttacking ? awayScore : homeScore
          commentaryText = fillTemplate(pickGoalCommentary(scoringTeamScore, otherTeamScore, rand, minute), templateVars)
        }
      } else if (weather && weather.condition === WeatherCondition.HeavySnow && rand() < 0.20) {
        commentaryText = fillTemplate(pickCommentary(commentary.weather_goal_heavySnow, rand), templateVars)
      } else if (weather && weather.condition === WeatherCondition.Thaw && rand() < 0.20) {
        commentaryText = fillTemplate(pickCommentary(commentary.weather_goal_thaw, rand), templateVars)
      } else {
        const scoringTeamScore = isHomeAttacking ? homeScore : awayScore
        const otherTeamScore = isHomeAttacking ? awayScore : homeScore
        commentaryText = fillTemplate(pickGoalCommentary(scoringTeamScore, otherTeamScore, rand, minute), templateVars)
      }
      // Add late supporter commentary for tight matches
      if (supporterCtx && step >= 47 && Math.abs(homeScore - awayScore) <= 1) {
        const isManaged = managedIsHome ? homeScore >= awayScore : awayScore >= homeScore
        const supArr = isManaged ? commentary.supporter_late_home : commentary.supporter_late_silent
        const supVars = { ...templateVars, leader: supporterCtx.leaderName, members: String(supporterCtx.members) }
        if (rand() < 0.15) commentaryText += ' ' + fillTemplate(pickCommentary(supArr, rand), supVars)
      }
      // Trait override (50% chance)
      if (scorerPlayerId && rand() < 0.5) {
        const traitComment = getTraitCommentary(scorerPlayerId, 'goal', allPlayers)
        if (traitComment) commentaryText = traitComment
      }
    } else if (saveOccurred && gkPlayerId) {
      templateVars = { ...templateVars, goalkeeper: findPlayerName(gkPlayerId) }
      commentaryText = fillTemplate(pickCommentary(commentary.save, rand), templateVars)
    } else if (suspensionOccurred && suspendedPlayerId) {
      templateVars = { ...templateVars, player: findPlayerName(suspendedPlayerId) }
      if (rivalry && rand() < 0.50) {
        commentaryText = fillTemplate(pickCommentary(commentary.derby_suspension, rand), { ...templateVars, player: findPlayerName(suspendedPlayerId) })
        isDerbyStep = true
      } else {
        commentaryText = fillTemplate(pickCommentary(commentary.suspension, rand), templateVars)
      }
      // Trait override (50% chance)
      if (rand() < 0.5) {
        const traitComment = getTraitCommentary(suspendedPlayerId, 'suspension', allPlayers)
        if (traitComment) commentaryText = traitComment
      }
    } else if (cornerOccurred && !goalScored) {
      commentaryText = fillTemplate(pickCommentary(commentary.corner, rand), templateVars)
    } else if ((homeActiveSuspensions > 0 || awayActiveSuspensions > 0) && (seqType === 'attack' || seqType === 'transition')) {
      const powerPlayTeam = awayActiveSuspensions > 0 ? homeTeamRef : awayTeamRef
      const powerPlayOpponent = awayActiveSuspensions > 0 ? awayTeamRef : homeTeamRef
      templateVars = { ...templateVars, team: powerPlayTeam, opponent: powerPlayOpponent }
      commentaryText = fillTemplate(pickCommentary(commentary.powerPlayGood, rand), templateVars)
    } else if (weather && (step === 15 || step === 30 || step === 45)) {
      // Weather-specific atmospheric commentary at milestone steps
      commentaryText = pickWeatherCommentary(weather, rand) ?? fillTemplate(pickCommentary(commentary.neutral, rand), templateVars)
    } else if (seqType === 'tactical_shift') {
      commentaryText = fillTemplate(pickCommentary(commentary.tactical_shift, rand), templateVars)
    } else if (seqType === 'player_duel') {
      const duelPlayer = getGoalScorer(attackingStarters)
      const duelVars = { ...templateVars, player: duelPlayer ? findPlayerName(duelPlayer.id) : attackingTeam }
      commentaryText = fillTemplate(pickCommentary(commentary.player_duel, rand), duelVars)
    } else if (seqType === 'atmosphere') {
      commentaryText = fillTemplate(pickCommentary(commentary.atmosphere, rand), templateVars)
    } else if (seqType === 'offside_call') {
      const offsidePlayer = getGoalScorer(attackingStarters)
      const offsideVars = { ...templateVars, player: offsidePlayer ? findPlayerName(offsidePlayer.id) : attackingTeam }
      commentaryText = fillTemplate(pickCommentary(commentary.offside_call, rand), offsideVars)
    } else if (seqType === 'freekick_danger') {
      const fkPlayer = getGoalScorer(attackingStarters)
      const fkVars = { ...templateVars, player: fkPlayer ? findPlayerName(fkPlayer.id) : attackingTeam }
      commentaryText = fillTemplate(pickCommentary(commentary.freekick_danger, rand), fkVars)
    } else {
      // Derby neutral override: 30% chance on every 10th step when no event
      if (rivalry && step % 10 === 0 && !goalScored && !saveOccurred && !suspensionOccurred && !cornerOccurred && rand() < 0.30) {
        commentaryText = fillTemplate(pickCommentary(commentary.derby_neutral, rand), { ...templateVars, rivalry: rivalry.name })
        isDerbyStep = true
      } else if (weather && !goalScored && !saveOccurred && !cornerOccurred && rand() < 0.30) {
        // 30% chance for weather miss commentary on neutral/miss steps in bad weather
        if (weather.condition === WeatherCondition.HeavySnow) {
          commentaryText = pickCommentary(commentary.weather_miss_heavySnow, rand)
        } else if (weather.condition === WeatherCondition.Thaw) {
          commentaryText = pickCommentary(commentary.weather_miss_thaw, rand)
        } else if (weather.condition === WeatherCondition.Fog) {
          commentaryText = pickCommentary(commentary.weather_miss_fog, rand)
        } else {
          commentaryText = fillTemplate(pickCommentary(commentary.neutral, rand), templateVars)
        }
      } else if (step === 31 && weather && !goalScored && !saveOccurred && !cornerOccurred && (weather.condition === WeatherCondition.HeavySnow || weather.condition === WeatherCondition.Thaw)) {
        commentaryText = weather.condition === WeatherCondition.HeavySnow
          ? pickCommentary(commentary.iceDeterioration_snow, rand)
          : pickCommentary(commentary.iceDeterioration_thaw, rand)
      } else if (step === 31 && !goalScored && !saveOccurred && !cornerOccurred) {
        commentaryText = fillTemplate(pickCommentary(commentary.secondHalf, rand), templateVars)
      } else {
        commentaryText = fillTemplate(pickCommentary(commentary.neutral, rand), templateVars)
      }
    }

    // ── Situational commentary injection (Sprint B) ────────────────────────
    // Inject situation/season/momentum commentary as a suffix, max 1 per injection
    // Injected only on non-event steps so it doesn't drown out goals/saves
    if (!goalScored && !suspensionOccurred && !cornerOccurred) {
      // Momentum tracking
      recentHomeShots.push(shotsHome)
      recentAwayShots.push(shotsAway)
      if (recentHomeShots.length > 5) recentHomeShots.shift()
      if (recentAwayShots.length > 5) recentAwayShots.shift()
      const momentumDiff = (recentHomeShots[recentHomeShots.length - 1] ?? 0) - (recentAwayShots[recentAwayShots.length - 1] ?? 0)
      const momentumSwing = Math.abs(momentumDiff - prevMomentumDiff)

      // Season context at kickoff (step 0)
      if (step === 0 && rand() < 0.40) {
        const ctx = input.matchContext
        const round = fixture.roundNumber ?? 0
        const managedPos = ctx?.managedPosition
        let ctxLine: string | null = null
        if (ctx?.isFirstRound) {
          ctxLine = fillTemplate(pickCommentary(commentary.context_season_opener, rand), templateVars)
        } else if (fixture.isCup && rand() < 0.7) {
          ctxLine = fillTemplate(pickCommentary(commentary.context_cup_final, rand), templateVars)
        } else if (managedPos && managedPos <= 3 && round >= 16) {
          ctxLine = fillTemplate(pickCommentary(commentary.context_title_race, rand), templateVars)
        } else if (managedPos && managedPos >= 10 && round >= 18) {
          ctxLine = fillTemplate(pickCommentary(commentary.context_relegation, rand), templateVars)
        }
        if (ctxLine) commentaryText = ctxLine
      }

      // Situational commentary every situationalInterval steps
      if (step > 5 && step % situationalInterval === 0 && situation !== 'neutral') {
        situationalInterval = randRange(rand, 8, 12) | 0
        let sitLine: string | null = null
        if (situation === 'dominating_home') {
          sitLine = fillTemplate(pickCommentary(commentary.situational_dominating, rand),
            { ...templateVars, team: homeTeamRef, opponent: awayTeamRef })
        } else if (situation === 'dominating_away') {
          sitLine = fillTemplate(pickCommentary(commentary.situational_dominating, rand),
            { ...templateVars, team: awayTeamRef, opponent: homeTeamRef })
        } else if (situation === 'tight') {
          sitLine = fillTemplate(pickCommentary(commentary.situational_tight, rand), templateVars)
        } else if (situation === 'opened_up') {
          sitLine = fillTemplate(pickCommentary(commentary.situational_opened_up, rand), templateVars)
        }
        if (sitLine && rand() < 0.70) commentaryText = sitLine
      }

      // Momentum swing commentary
      if (step >= 10 && momentumSwing >= 3 && rand() < 0.50) {
        const homeHasMomentum = momentumDiff > prevMomentumDiff
        const swingPool = homeHasMomentum ? commentary.momentum_swing_home : commentary.momentum_swing_away
        const swingVars = homeHasMomentum
          ? { ...templateVars, team: homeTeamRef, opponent: awayTeamRef }
          : { ...templateVars, team: awayTeamRef, opponent: homeTeamRef }
        commentaryText = fillTemplate(pickCommentary(swingPool, rand), swingVars)
      }
      prevMomentumDiff = momentumDiff

      // Referee line (low probability, adds flavour) — checked outside event filter


      // Playoff general atmosphere commentary — every ~8 steps during knockout phases
      if (matchPhase !== 'regular' && step > 5 && step % 8 === 0 && rand() < 0.45) {
        commentaryText = fillTemplate(pickCommentary(commentary.playoff_general, rand), templateVars)
      }

      // Protecting lead / chasing commentary (late game, Sprint B)
      if (step >= 45 && managedIsHome !== undefined && rand() < 0.20) {
        const managedScore = managedIsHome ? homeScore : awayScore
        const opponentScore = managedIsHome ? awayScore : homeScore
        const mode = getSecondHalfMode(managedScore, opponentScore, step, matchPhase)
        if (mode === 'controlling') {
          commentaryText = fillTemplate(pickCommentary(commentary.context_protecting_lead, rand),
            { ...templateVars, team: managedIsHome ? homeTeamRef : awayTeamRef })
        } else if (mode === 'chasing') {
          commentaryText = fillTemplate(pickCommentary(commentary.context_comeback_chasing, rand),
            { ...templateVars, team: managedIsHome ? homeTeamRef : awayTeamRef })
        }
      }
    }

    // Suspension context commentary (Sprint B) — replaces basic suspension text
    if (suspensionOccurred && suspendedPlayerId && rand() < 0.35) {
      const managedIsDefending = managedIsHome !== undefined ? (managedIsHome !== isHomeAttacking) : false
      const scoreDiff = managedIsHome ? (homeScore - awayScore) : (awayScore - homeScore)
      const suspName = findPlayerName(suspendedPlayerId)
      if (managedIsDefending && scoreDiff < 0) {
        // We're defending and losing — frustration
        commentaryText = fillTemplate(pickCommentary(commentary.context_suspension_frustration, rand),
          { ...templateVars, player: suspName, score: scoreStr })
      } else if (managedIsDefending && scoreDiff > 0) {
        // Tactical stop
        commentaryText = fillTemplate(pickCommentary(commentary.context_suspension_tactical, rand),
          { ...templateVars, player: suspName })
      }
    }

    // Referee line (low probability, replaces commentary after suspension)
    let isRefCommentary = false
    if (suspensionOccurred && rand() < 0.20) {
      const refPool = refStyle === 'strict' ? commentary.referee_strict
        : refStyle === 'lenient' ? commentary.referee_lenient
        : commentary.referee_inconsistent
      commentaryText = fillTemplate(pickCommentary(refPool, rand), templateVars)
      isRefCommentary = true
    }

    // Determine intensity — factoring in match minute and score state
    let intensity: 'low' | 'medium' | 'high'
    if (goalScored || suspensionOccurred) {
      intensity = 'high'
    } else if (saveOccurred || cornerOccurred) {
      intensity = 'medium'
    } else {
      intensity = 'low'
    }
    // Late game: boost intensity when close or in final 7 minutes
    const scoreDiff = Math.abs(homeScore - awayScore)
    if (minute >= 83) {
      // Final 7 minutes always at least medium
      if (intensity === 'low') intensity = 'medium'
      // Close game (within 1) in final minutes → high
      if (scoreDiff <= 1) intensity = 'high'
    } else if (minute >= 70 && scoreDiff <= 1 && intensity === 'low') {
      intensity = 'medium'
    }

    // Weather note for step 0
    const stepWeatherNote = step === 0 ? openingWeatherNote : undefined

    // Attendance announcement — random step between 47-56 (minute ~70-84)
    const attendanceStep = 47 + (seed ? (seed % 10) : 3)
    if (step === attendanceStep && !goalScored && !suspensionOccurred && input.fixture.attendance) {
      const att = input.fixture.attendance
      const isDerby = !!input.rivalry
      const isCold = input.weather && input.weather.temperature < -10
      const isSnow = input.weather && (input.weather.condition as string) === 'heavySnow'

      if (isDerby) {
        const derbyLines = [
          `Publiksiffran annonseras: ${att} åskådare! Derbystämning på läktarna.`,
          `${att} åskådare har samlats för derbyt. Stämningen är elektrisk.`,
          `Det är derby — och ${att} har kommit för att se det. Underbara scener.`,
        ]
        commentaryText = derbyLines[Math.floor(rand() * derbyLines.length)]
      } else if (att > 5000) {
        const bigLines = [
          `Lapp på luckan! ${att} åskådare — läktarna svämmar över.`,
          `${att} åskådare! Arenan sjuder. Så här ska det vara.`,
          `Speaker meddelar: ${att} åskådare. En av de största publiksiffrorna på länge.`,
        ]
        commentaryText = bigLines[Math.floor(rand() * bigLines.length)]
      } else if (att > 1000) {
        const goodLines = [
          `Publiksiffran annonseras: ${att} åskådare. Fin uppslutning idag.`,
          `${att} har tagit sig till planen. Bandyintresset är starkt.`,
          `Speaker meddelar: ${att} åskådare. Det värmer.`,
        ]
        commentaryText = goodLines[Math.floor(rand() * goodLines.length)]
      } else if (isCold) {
        const coldLines = [
          `${att} tappra har vågat sig ut trots kylan. Respekt.`,
          `Publiksiffran annonseras: ${att} åskådare. Inte illa med ${input.weather!.temperature}°C.`,
          `${att} åskådare hukar bakom termosarna. Det krävs kärlek för att stå här idag.`,
        ]
        commentaryText = coldLines[Math.floor(rand() * coldLines.length)]
      } else if (isSnow) {
        commentaryText = `${att} åskådare trotsade snöfallet. Bandyfolket är ett härdat släkte.`
      } else if (att < 80) {
        const quietLines = [
          `Publiksiffran annonseras: ${att} åskådare. Tyst på läktarna idag.`,
          `${att} åskådare. Man önskar att det var fler. Men de som kom är lojala.`,
        ]
        commentaryText = quietLines[Math.floor(rand() * quietLines.length)]
      } else {
        const defaultLines = [
          `Publiksiffran annonseras: ${att} åskådare på plats.`,
          `${att} har tagit sig till planen idag. Bra uppslutning.`,
          `Speaker meddelar: ${att} åskådare. Bandyintresset lever.`,
        ]
        commentaryText = defaultLines[Math.floor(rand() * defaultLines.length)]
      }
    }

    // Last-minute press: automatic trigger when trailing by 1, step >= 55, once per match
    if (!lastMinutePressTriggered && step >= 55 && managedIsHome !== undefined) {
      const managedGoalsNow = managedIsHome ? homeScore : awayScore
      const oppGoalsNow = managedIsHome ? awayScore : homeScore
      const diff = managedGoalsNow - oppGoalsNow
      if (diff === -1) {
        lastMinutePressTriggered = true
        const stepsLeft = 60 - step
        const managedStartersNow = managedIsHome ? homeStarters : awayStarters
        const avgFatigue = managedStartersNow.reduce((s, p) => s + (100 - p.morale), 0) / Math.max(1, managedStartersNow.length)
        lastMinutePressData = { minute, scoreDiff: diff, stepsLeft, fatigueLevel: Math.round(avgFatigue) }
      }
    }

    // Determine commentaryType for visual styling in CommentaryFeed
    const commentaryType: import('./matchUtils').CommentaryType = (() => {
      if (isRefCommentary) return 'referee'
      if (seqType === 'atmosphere') return 'atmosphere'
      if (seqType === 'player_duel') return 'player_duel'
      if (seqType === 'tactical_shift') return 'tactical'
      if (goalScored && scorerPlayerId) return 'goal_context'
      if (situation !== 'neutral' && !goalScored && !suspensionOccurred
        && !saveOccurred && !cornerOccurred) return 'situation'
      return 'normal'
    })()

    yield {
      step,
      minute,
      events: stepEvents,
      homeScore,
      awayScore,
      commentary: commentaryText,
      commentaryType,
      intensity,
      activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions },
      shotsHome,
      shotsAway,
      cornersHome,
      cornersAway,
      weatherNote: stepWeatherNote,
      isDerbyComment: isDerbyStep || undefined,
      cornerInteractionData,
      penaltyInteractionData,
      counterInteractionData,
      freeKickInteractionData,
      lastMinutePressData,
    }
  }

  // Final step (step 60, minute 90) — full time
  const scoreStr = `${homeScore}–${awayScore}`
  const homeTeamRef = homeClubName ?? fixture.homeClubId
  const awayTeamRef = awayClubName ?? fixture.awayClubId
  const fullTimeVars: Record<string, string> = {
    team: homeTeamRef,
    opponent: awayTeamRef,
    score: scoreStr,
    minute: '90',
    player: '',
    goalkeeper: '',
    rivalry: rivalry?.name ?? '',
    result: homeScore > awayScore ? 'en seger' : homeScore < awayScore ? 'ingenting' : 'en poäng',
  }
  const fullTimeText = rivalry
    ? fillTemplate(pickCommentary(commentary.derby_fullTime, rand), { ...fullTimeVars, rivalry: rivalry.name })
    : fillTemplate(pickCommentary(commentary.fullTime, rand), fullTimeVars)

  yield {
    step: 60,
    minute: 90,
    events: [],
    homeScore,
    awayScore,
    commentary: fullTimeText,
    intensity: 'high',
    activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions },
    shotsHome,
    shotsAway,
    cornersHome,
    cornersAway,
    weatherNote: undefined,
    isDerbyComment: rivalry ? true : undefined,
    phase: 'regular',
  }

  // ── Overtime (for knockout matches tied after 90) ────────────────────────
  if (!fixture.isKnockout || homeScore !== awayScore) return

  // Overtime announcement step
  yield {
    step: 61,
    minute: 90,
    events: [],
    homeScore,
    awayScore,
    commentary: pickCommentary(commentary.overtimeStart, rand),
    intensity: 'high',
    activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions },
    shotsHome,
    shotsAway,
    cornersHome,
    cornersAway,
    phase: 'overtime',
  }

  // 20 overtime steps (minutes 91-120), slightly reduced goal chance
  const otGoalMod = weatherGoalMod * 0.85
  const otHomeAttack = homeAttack * 1.15
  const otAwayAttack = awayAttack * 1.15

  for (let step = 62; step < 82; step++) {
    const minute = 91 + Math.round((step - 62) * 1.5)
    const stepEvents: MatchEvent[] = []

    // Determine initiative
    const homePenaltyFactor = homeActiveSuspensions > 0 ? 0.75 : 1.0
    const awayPenaltyFactor = awayActiveSuspensions > 0 ? 0.75 : 1.0
    const homeWeight = otHomeAttack * (1 + effectiveHomeAdvantage) * homePenaltyFactor
    const awayWeight = otAwayAttack * awayPenaltyFactor
    const isHomeAttacking = rand() < homeWeight / (homeWeight + awayWeight)

    const attackingStarters = isHomeAttacking ? homeStarters : awayStarters
    const attackingClubId = isHomeAttacking ? fixture.homeClubId : fixture.awayClubId
    const attAttack = isHomeAttacking ? otHomeAttack : otAwayAttack
    const defDefense = isHomeAttacking ? awayDefense : homeDefense
    const defGK = isHomeAttacking ? awayGK : homeGK

    let goalScored = false
    let scorerPlayerId: string | undefined

    const r = rand()
    const chanceQuality = clamp(attAttack * 0.5 - defDefense * 0.3 + randRange(rand, -0.15, 0.25), 0.05, 0.90)
    const goalThreshold = chanceQuality * 0.40 * (1 - defGK * 0.35) * otGoalMod

    if (r < goalThreshold) {
      const scorer = getGoalScorer(attackingStarters)
      const assister = getAssistProvider(attackingStarters, scorer?.id)
      if (scorer) {
        if (isHomeAttacking) { homeScore++ } else { awayScore++ }
        scorerPlayerId = scorer.id
        goalScored = true
        trackGoal(scorer.id)
        const event: MatchEvent = {
          minute,
          type: MatchEventType.Goal,
          clubId: attackingClubId,
          playerId: scorer.id,
          secondaryPlayerId: assister?.id,
          description: `Förlängningsmål av ${scorer.firstName} ${scorer.lastName}`,
        }
        stepEvents.push(event)
        allEvents.push(event)
        if (assister) {
          trackAssist(assister.id)
          const assistEvent: MatchEvent = {
            minute,
            type: MatchEventType.Assist,
            clubId: attackingClubId,
            playerId: assister.id,
            secondaryPlayerId: scorer.id,
            description: `Assist av ${assister.firstName} ${assister.lastName}`,
          }
          stepEvents.push(assistEvent)
          allEvents.push(assistEvent)
        }
      }
    }

    const otScoreStr = `${homeScore}–${awayScore}`
    const attackingTeam = isHomeAttacking ? homeTeamRef : awayTeamRef
    let commentaryText: string
    if (goalScored && scorerPlayerId) {
      commentaryText = fillTemplate(pickCommentary(commentary.overtimeGoal, rand), { player: findPlayerName(scorerPlayerId), score: otScoreStr, team: attackingTeam, opponent: '', minute: String(minute), goalkeeper: '', rivalry: '', result: '' })
    } else if (step === 81) {
      commentaryText = fillTemplate(pickCommentary(commentary.overtimeEnd, rand), { score: otScoreStr, team: '', opponent: '', minute: '120', player: '', goalkeeper: '', rivalry: '', result: '' })
    } else {
      commentaryText = fillTemplate(pickCommentary(commentary.overtimeNoGoal, rand), { team: attackingTeam, opponent: '', score: otScoreStr, minute: String(minute), player: '', goalkeeper: '', rivalry: '', result: '' })
    }

    yield {
      step,
      minute,
      events: stepEvents,
      homeScore,
      awayScore,
      commentary: commentaryText,
      intensity: goalScored ? 'high' : 'medium',
      activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions },
      shotsHome,
      shotsAway,
      cornersHome,
      cornersAway,
      phase: 'overtime',
      overtimeResult: goalScored ? (isHomeAttacking ? 'home' : 'away') : undefined,
    }

    if (goalScored) {
      // Overtime decided — yield done step with result
      yield {
        step: 82,
        minute: 120,
        events: [],
        homeScore,
        awayScore,
        commentary: `Matchen är avgjord i förlängningen! ${homeScore}–${awayScore}.`,
        intensity: 'high',
        activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions },
        shotsHome,
        shotsAway,
        cornersHome,
        cornersAway,
        phase: 'overtime',
        overtimeResult: isHomeAttacking ? 'home' : 'away',
      }
      return
    }
  }

  // ── Penalties (still tied after overtime) ───────────────────────────────
  const homeGKPlayer = homeStarters.find(p => p.position === PlayerPosition.Goalkeeper)
  const awayGKPlayer = awayStarters.find(p => p.position === PlayerPosition.Goalkeeper)
  const { rounds: penRounds, homeGoals: penHome, awayGoals: penAway } = simulatePenalties(
    homeStarters, awayStarters, homeGKPlayer, awayGKPlayer, rand
  )

  // Announcement step
  yield {
    step: 83,
    minute: 120,
    events: [],
    homeScore,
    awayScore,
    commentary: pickCommentary(commentary.penaltyStart, rand),
    intensity: 'high',
    activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions },
    shotsHome,
    shotsAway,
    cornersHome,
    cornersAway,
    phase: 'penalties',
  }

  // Yield one step per penalty round
  let runningHome = 0
  let runningAway = 0
  for (const penRound of penRounds) {
    if (penRound.homeScored) runningHome++
    if (penRound.awayScored) runningAway++
    const isLastRound = penRound === penRounds[penRounds.length - 1]

    yield {
      step: 84 + penRound.round - 1,
      minute: 120,
      events: [],
      homeScore,
      awayScore,
      commentary: isLastRound
        ? (runningHome > runningAway
          ? fillTemplate(pickCommentary(commentary.penaltyWinHome, rand), { team: homeTeamRef, penHome: String(runningHome), penAway: String(runningAway), score: `${homeScore}–${awayScore}`, opponent: awayTeamRef, minute: '120', player: '', goalkeeper: '', rivalry: '', result: '' })
          : fillTemplate(pickCommentary(commentary.penaltyWinAway, rand), { team: awayTeamRef, penHome: String(runningHome), penAway: String(runningAway), score: `${homeScore}–${awayScore}`, opponent: homeTeamRef, minute: '120', player: '', goalkeeper: '', rivalry: '', result: '' })
        )
        : `Omgång ${penRound.round}: ${penRound.homeShooterName} ${penRound.homeScored ? '✅' : '❌'} · ${penRound.awayShooterName} ${penRound.awayScored ? '✅' : '❌'} — Straffar: ${runningHome}-${runningAway}`,
      intensity: isLastRound ? 'high' : 'medium',
      activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions },
      shotsHome,
      shotsAway,
      cornersHome,
      cornersAway,
      phase: 'penalties',
      penaltyRound: penRound,
      penaltyHomeTotal: runningHome,
      penaltyAwayTotal: runningAway,
      penaltyDone: isLastRound,
      penaltyFinalResult: isLastRound ? { home: penHome, away: penAway } : undefined,
    }
  }
}
