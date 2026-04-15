import type { Player } from '../entities/Player'
import type { Fixture, MatchEvent, MatchReport } from '../entities/Fixture'
import { FixtureStatus, MatchEventType, PlayerPosition, PlayerArchetype } from '../enums'
import { evaluateSquad } from './squadEvaluator'
import { getTacticModifiers } from './tacticModifiers'
import { mulberry32 } from '../utils/random'
import {
  clamp, randRange, weightedPick, pickWeightedPlayer,
  SEQUENCE_TYPES, computeWeatherEffects, computeWeatherTacticInteraction, simulatePenalties,
  GOAL_TIMING_BY_PERIOD, SUSP_TIMING_BY_PERIOD, PHASE_CONSTANTS, getTimingPeriod,
} from './matchUtils'
import type { SimulateMatchInput, SimulateMatchResult } from './matchUtils'

export function simulateMatch(input: SimulateMatchInput): SimulateMatchResult {
  const {
    fixture,
    homeLineup,
    awayLineup,
    homePlayers,
    awayPlayers,
    homeAdvantage = 0.14,
    seed,
    weather,
    isPlayoff = false,
    matchPhase = 'regular',
    rivalry,
    fanMood,
    managedIsHome,
  } = input

  const phaseConst = PHASE_CONSTANTS[matchPhase]

  const rand = mulberry32(seed ?? Date.now())

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
  let homeAttack = (homeEval.offenseScore * homeMods.offenseModifier) / 100
  const homeDefense = (homeEval.defenseScore * homeMods.defenseModifier) / 100
  const homeCorner = (homeEval.cornerScore * homeMods.cornerModifier) / 100
  const homeGK = homeEval.goalkeeperScore / 100
  const homeDisciplineRisk = (homeEval.disciplineRisk * homeMods.disciplineModifier) / 100

  let awayAttack = (awayEval.offenseScore * awayMods.offenseModifier) / 100
  const awayDefense = (awayEval.defenseScore * awayMods.defenseModifier) / 100
  const awayCorner = (awayEval.cornerScore * awayMods.cornerModifier) / 100
  const awayGK = awayEval.goalkeeperScore / 100
  const awayDisciplineRisk = (awayEval.disciplineRisk * awayMods.disciplineModifier) / 100

  // Apply weather modifiers (with tactic interaction)
  let weatherGoalMod = 1.0
  if (weather && weather.condition !== undefined) {
    const { ballControlPenalty, speedModifier, goalChanceModifier } = computeWeatherEffects(weather)
    const homeTacticWeather = computeWeatherTacticInteraction(weather, homeLineup.tactic)
    const awayTacticWeather = computeWeatherTacticInteraction(weather, awayLineup.tactic)
    homeAttack *= (1 - (ballControlPenalty + homeTacticWeather.extraBallControlPenalty) / 200) * speedModifier
    awayAttack *= (1 - (ballControlPenalty + awayTacticWeather.extraBallControlPenalty) / 200) * speedModifier
    weatherGoalMod = goalChanceModifier
  }

  // Playoff intensity modifiers
  if (isPlayoff) {
    // Better team wins more reliably — apply symmetric strength amplification
    const diff = (homeAttack - awayAttack) * 0.1
    homeAttack = clamp(homeAttack + diff, 0, 1)
    awayAttack = clamp(awayAttack - diff, 0, 1)
  }

  // Derby intensity modifiers
  let derbyFoulMult = 1.0
  let derbyChanceMult = 0.0
  let effectiveHomeAdvantage = fixture.isNeutralVenue ? 0 : homeAdvantage + phaseConst.homeAdvDelta
  // Fan mood affects home advantage (only when managed club plays at home)
  if (!fixture.isNeutralVenue && fanMood !== undefined && managedIsHome) {
    effectiveHomeAdvantage *= 1 + ((fanMood - 50) / 100) * 0.06
  }
  if (rivalry) {
    // Compress strength gap (underdogs perform better in derby)
    const avgAttack = (homeAttack + awayAttack) / 2
    homeAttack = avgAttack + (homeAttack - avgAttack) * 0.7
    awayAttack = avgAttack + (awayAttack - avgAttack) * 0.7
    // More fouls/suspensions
    derbyFoulMult = 1 + rivalry.intensity * 0.15
    // More open play (higher chance quality)
    derbyChanceMult = 0.05
    // Bigger home advantage in derby atmosphere (only if not neutral venue)
    if (!fixture.isNeutralVenue) {
      effectiveHomeAdvantage = homeAdvantage * (1 + rivalry.intensity * 0.1)
    }
  }

  // Match state
  let homeScore = 0
  let awayScore = 0
  const events: MatchEvent[] = []
  // Hard cap: max 13 total goals, max 6 goal difference
  const canScore = (attackingHome: boolean) => {
    if (homeScore + awayScore >= 13) return false
    const newDiff = attackingHome ? homeScore + 1 - awayScore : awayScore + 1 - homeScore
    return Math.abs(newDiff) <= 6
  }

  // Suspension tracking
  let homeActiveSuspensions = 0
  let awayActiveSuspensions = 0
  const homeSuspensionTimers: number[] = []
  const awaySuspensionTimers: number[] = []

  // Possession counters
  let homePossessionSteps = 0
  let awayPossessionSteps = 0

  // Shot counters
  let shotsHome = 0
  let shotsAway = 0
  let cornersHome = 0
  let cornersAway = 0

  // Per-player tracking for ratings
  const playerGoals: Record<string, number> = {}
  const playerAssists: Record<string, number> = {}
  const playerRedCards: Record<string, number> = {}
  const playerSaves: Record<string, number> = {}

  function addEvent(event: MatchEvent) {
    events.push(event)
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

  // Player selection helpers
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

  function getDefendingPlayer(starters: Player[]): Player | undefined {
    const nonGK = starters.filter(p => p.position !== PlayerPosition.Goalkeeper)
    if (nonGK.length === 0) return undefined
    return nonGK[Math.floor(rand() * nonGK.length)]
  }

  // Build sequence type weights modified by attacker's tactic
  function buildSequenceWeights(isHome: boolean): number[] {
    const tactic = isHome ? homeLineup.tactic : awayLineup.tactic
    const mods = isHome ? homeMods : awayMods

    let wAttack = 40
    let wTransition = 15
    let wCorner = 32
    let wHalfchance = 10
    let wFoul = 12
    let wLostball = 8

    // Tempo modifications
    if (tactic.tempo === 'high') {
      wAttack += 5
      wCorner += 3
      wFoul += 2
    } else if (tactic.tempo === 'low') {
      wAttack -= 5
      wLostball += 5
    }

    // Press modifications
    if (tactic.press === 'high') {
      wFoul += 5
      wTransition += 3
    }

    // Width modifications
    if (tactic.width === 'wide') {
      wCorner += 5
    }

    // Corner strategy
    if (tactic.cornerStrategy === 'aggressive') {
      wCorner += 3
    }

    // Passing risk
    if (tactic.passingRisk === 'direct') {
      wLostball += 5
      wAttack += 3
      wHalfchance -= 3
    }

    // Mentality
    if (tactic.mentality === 'offensive') {
      wAttack += 5
      wHalfchance += 3
    }

    // Suppress usage of mods to avoid unused variable lint error
    void mods

    return [
      Math.max(1, wAttack),
      Math.max(1, wTransition),
      Math.max(1, wCorner),
      Math.max(1, wHalfchance),
      Math.max(1, wFoul),
      Math.max(1, wLostball),
    ]
  }

  // Step through 60 match steps
  for (let step = 0; step < 60; step++) {
    const minute = Math.round(step * 1.5)
    const period = getTimingPeriod(minute)
    const goalMod = weatherGoalMod * phaseConst.goalMod * GOAL_TIMING_BY_PERIOD[period]

    // AI halftime tactical adjustment (applied once at step 30)
    if (step === 30) {
      const diff = homeScore - awayScore
      // Trailing by 2+: chase the game (offensive push)
      if (diff <= -2) {
        homeAttack = clamp(homeAttack * 1.18, 0, 1)
        awayAttack = clamp(awayAttack * 0.88, 0, 1)
      } else if (diff >= 2) {
        homeAttack = clamp(homeAttack * 0.88, 0, 1)
        awayAttack = clamp(awayAttack * 1.18, 0, 1)
      } else if (diff < 0) {
        homeAttack = clamp(homeAttack * 1.09, 0, 1)
      } else if (diff > 0) {
        awayAttack = clamp(awayAttack * 1.09, 0, 1)
      }
      // Man-advantage tactical boost
      if (homeActiveSuspensions > 0) awayAttack = clamp(awayAttack * 1.08, 0, 1)
      if (awayActiveSuspensions > 0) homeAttack = clamp(homeAttack * 1.08, 0, 1)
    }

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

    // Determine initiative (who attacks this step)
    const homePenaltyFactor = homeActiveSuspensions > 0 ? 0.75 : 1.0
    const awayPenaltyFactor = awayActiveSuspensions > 0 ? 0.75 : 1.0

    const homeWeight = homeAttack * (1 + homeMods.pressModifier * 0.2) * (1 + effectiveHomeAdvantage) * homePenaltyFactor
    const awayWeight = awayAttack * (1 + awayMods.pressModifier * 0.2) * awayPenaltyFactor

    const homeInitiative = homeWeight / (homeWeight + awayWeight)
    const isHomeAttacking = rand() < homeInitiative

    if (isHomeAttacking) {
      homePossessionSteps++
    } else {
      awayPossessionSteps++
    }

    const attackingStarters = isHomeAttacking ? homeStarters : awayStarters
    const defendingStarters = isHomeAttacking ? awayStarters : homeStarters
    const attackingClubId = isHomeAttacking ? fixture.homeClubId : fixture.awayClubId
    const defendingClubId = isHomeAttacking ? fixture.awayClubId : fixture.homeClubId

    const attAttack = isHomeAttacking ? homeAttack : awayAttack
    const defDefense = isHomeAttacking ? awayDefense : homeDefense
    const defGK = isHomeAttacking ? awayGK : homeGK
    const attCorner = isHomeAttacking ? homeCorner : awayCorner
    const attDiscipline = isHomeAttacking ? homeDisciplineRisk : awayDisciplineRisk
    const defDiscipline = isHomeAttacking ? awayDisciplineRisk : homeDisciplineRisk

    // Pick sequence type
    const seqWeights = buildSequenceWeights(isHomeAttacking)
    const seqIdx = weightedPick(rand, seqWeights)
    const seqType = SEQUENCE_TYPES[seqIdx]

    if (seqType === 'attack') {
      const base = attAttack * 0.6 - defDefense * 0.4 + randRange(rand, -0.2, 0.2)
      const chanceQuality = clamp(base * 1.2 + 0.15 + derbyChanceMult, 0.05, 0.95)

      if (chanceQuality > 0.10) {
        if (isHomeAttacking) { shotsHome++ } else { shotsAway++ }

        const shotResult = rand()
        const defenderGkStrength = defGK
        const goalThreshold = chanceQuality * 1.05 * (1 - defenderGkStrength * 0.30) * goalMod

        if (shotResult < goalThreshold && canScore(isHomeAttacking)) {
          // GOAL
          const scorer = getGoalScorer(attackingStarters)
          const assister = getAssistProvider(attackingStarters, scorer?.id)

          if (scorer) {
            if (isHomeAttacking) { homeScore++ } else { awayScore++ }
            trackGoal(scorer.id)
            addEvent({
              minute,
              type: MatchEventType.Goal,
              clubId: attackingClubId,
              playerId: scorer.id,
              secondaryPlayerId: assister?.id,
              description: `Mål av ${scorer.firstName} ${scorer.lastName}`,
            })
            if (assister) {
              trackAssist(assister.id)
              addEvent({
                minute,
                type: MatchEventType.Assist,
                clubId: attackingClubId,
                playerId: assister.id,
                secondaryPlayerId: scorer.id,
                description: `Assist av ${assister.firstName} ${assister.lastName}`,
              })
            }
          }
        } else if (shotResult < goalThreshold + 0.25) {
          const gk = getGK(defendingStarters)
          if (gk) {
            trackSave(gk.id)
            addEvent({
              minute,
              type: MatchEventType.Save,
              clubId: defendingClubId,
              playerId: gk.id,
              description: `Räddning av ${gk.firstName} ${gk.lastName}`,
            })
          }
        } else if (shotResult < goalThreshold + 0.45) {
          // Corner
          if (isHomeAttacking) { cornersHome++ } else { cornersAway++ }
          addEvent({
            minute,
            type: MatchEventType.Corner,
            clubId: attackingClubId,
            description: 'Hörnslag',
          })
        }
        // else: shot off target, no event
      }
    } else if (seqType === 'transition') {
      const chanceQuality = randRange(rand, 0.3, 0.7)

      if (chanceQuality > 0.05) {
        if (isHomeAttacking) { shotsHome++ } else { shotsAway++ }

        const shotResult = rand()
        const goalThreshold = chanceQuality * 0.58 * (1 - defGK * 0.35) * 1.15 * goalMod

        if (shotResult < goalThreshold && canScore(isHomeAttacking)) {
          const scorer = getGoalScorer(attackingStarters)
          const assister = getAssistProvider(attackingStarters, scorer?.id)

          if (scorer) {
            if (isHomeAttacking) { homeScore++ } else { awayScore++ }
            trackGoal(scorer.id)
            addEvent({
              minute,
              type: MatchEventType.Goal,
              clubId: attackingClubId,
              playerId: scorer.id,
              secondaryPlayerId: assister?.id,
              description: `Omställningsmål av ${scorer.firstName} ${scorer.lastName}`,
            })
            if (assister) {
              trackAssist(assister.id)
              addEvent({
                minute,
                type: MatchEventType.Assist,
                clubId: attackingClubId,
                playerId: assister.id,
                secondaryPlayerId: scorer.id,
                description: `Assist av ${assister.firstName} ${assister.lastName}`,
              })
            }
          }
        } else if (shotResult < goalThreshold + 0.25) {
          const gk = getGK(defendingStarters)
          if (gk) {
            trackSave(gk.id)
            addEvent({
              minute,
              type: MatchEventType.Save,
              clubId: defendingClubId,
              playerId: gk.id,
              description: `Räddning av ${gk.firstName} ${gk.lastName}`,
            })
          }
        }
      }
    } else if (seqType === 'corner') {
      if (isHomeAttacking) { cornersHome++ } else { cornersAway++ }

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
      const goalThreshold = clamp((cornerChance - defenseResist) * 0.30 * goalMod * cornerStateMod + 0.14, 0.10, 0.30)

      const r = rand()
      if (r < goalThreshold && canScore(isHomeAttacking)) {
        // Corner goal
        const scorer = getGoalScorer(attackingStarters)
        const assister = getAssistProvider(attackingStarters, scorer?.id)

        if (scorer) {
          if (isHomeAttacking) { homeScore++ } else { awayScore++ }
          addEvent({
            minute,
            type: MatchEventType.Corner,
            clubId: attackingClubId,
            description: 'Hörnmål',
          })
          trackGoal(scorer.id)
          addEvent({
            minute,
            type: MatchEventType.Goal,
            clubId: attackingClubId,
            playerId: scorer.id,
            secondaryPlayerId: assister?.id,
            description: `Hörnmål av ${scorer.firstName} ${scorer.lastName}`,
            isCornerGoal: true,
          })
          if (assister) {
            trackAssist(assister.id)
            addEvent({
              minute,
              type: MatchEventType.Assist,
              clubId: attackingClubId,
              playerId: assister.id,
              secondaryPlayerId: scorer.id,
              description: `Hörnassist av ${assister.firstName} ${assister.lastName}`,
            })
          }
        }
      } else if (r < goalThreshold + 0.3) {
        addEvent({
          minute,
          type: MatchEventType.Corner,
          clubId: attackingClubId,
          description: 'Hörnslag',
        })
      }
      // else: defended away
    } else if (seqType === 'halfchance') {
      if (isHomeAttacking) { shotsHome++ } else { shotsAway++ }
      const chanceQuality = randRange(rand, 0.05, 0.25) * (isPlayoff ? 1.05 : 1.0)
      const goalThreshold = chanceQuality * 0.63 * goalMod

      if (rand() < goalThreshold && canScore(isHomeAttacking)) { // matchEngine halfchance
        const scorer = getGoalScorer(attackingStarters)

        if (scorer) {
          if (isHomeAttacking) { homeScore++ } else { awayScore++ }
          trackGoal(scorer.id)
          addEvent({
            minute,
            type: MatchEventType.Goal,
            clubId: attackingClubId,
            playerId: scorer.id,
            description: `Halvchans av ${scorer.firstName} ${scorer.lastName}`,
          })
        }
      }
    } else if (seqType === 'foul') {
      // Defending team commits the foul
      const foulProb = defDiscipline * 0.6 + attDiscipline * 0.1

      const r = rand()
      if (r < foulProb * 0.62 * phaseConst.suspMod * SUSP_TIMING_BY_PERIOD[period] * derbyFoulMult) {
        // Suspension (red card equivalent)
        const suspPlayer = getDefendingPlayer(defendingStarters)
        if (suspPlayer) {
          const duration = 3 + Math.floor(rand() * 4) // 3-6 steps
          if (isHomeAttacking) {
            awayActiveSuspensions++
            awaySuspensionTimers.push(duration)
          } else {
            homeActiveSuspensions++
            homeSuspensionTimers.push(duration)
          }
          trackRed(suspPlayer.id)
          addEvent({
            minute,
            type: MatchEventType.RedCard,
            clubId: defendingClubId,
            playerId: suspPlayer.id,
            description: `Utvisning av ${suspPlayer.firstName} ${suspPlayer.lastName}`,
          })
        }
      }
    }
    // 'lostball': no event, possession implicitly stays or shifts
  }

  // Calculate possession percentages
  const totalSteps = homePossessionSteps + awayPossessionSteps
  const possessionHome = totalSteps > 0 ? Math.round((homePossessionSteps / totalSteps) * 100) : 50
  const possessionAway = 100 - possessionHome

  // Generate player ratings
  const playerRatings: Record<string, number> = {}

  const allStarterIds = [
    ...homeLineup.startingPlayerIds,
    ...awayLineup.startingPlayerIds,
  ]

  for (const playerId of allStarterIds) {
    playerRatings[playerId] = 6.0
  }

  // Apply stat-based adjustments
  for (const [playerId, goals] of Object.entries(playerGoals)) {
    if (playerRatings[playerId] !== undefined) {
      playerRatings[playerId] += goals * 0.8
    }
  }
  for (const [playerId, assists] of Object.entries(playerAssists)) {
    if (playerRatings[playerId] !== undefined) {
      playerRatings[playerId] += assists * 0.5
    }
  }
  for (const [playerId, reds] of Object.entries(playerRedCards)) {
    if (playerRatings[playerId] !== undefined) {
      playerRatings[playerId] -= reds * 1.2
    }
  }
  for (const [playerId, saves] of Object.entries(playerSaves)) {
    if (playerRatings[playerId] !== undefined) {
      playerRatings[playerId] += saves * 0.3
    }
  }

  // Goalkeeper clean sheet bonus
  const homeGkPlayer = getGK(homeStarters)
  const awayGkPlayer = getGK(awayStarters)
  if (homeGkPlayer && awayScore === 0 && homeLineup.startingPlayerIds.includes(homeGkPlayer.id)) {
    playerRatings[homeGkPlayer.id] = (playerRatings[homeGkPlayer.id] ?? 6.0) + 1.0
  }
  if (awayGkPlayer && homeScore === 0 && awayLineup.startingPlayerIds.includes(awayGkPlayer.id)) {
    playerRatings[awayGkPlayer.id] = (playerRatings[awayGkPlayer.id] ?? 6.0) + 1.0
  }

  // Win/loss adjustments
  const isHomeTied = homeScore === awayScore
  for (const playerId of homeLineup.startingPlayerIds) {
    if (!isHomeTied) {
      if (homeScore > awayScore) {
        playerRatings[playerId] = (playerRatings[playerId] ?? 6.0) + 0.3
      } else {
        playerRatings[playerId] = (playerRatings[playerId] ?? 6.0) - 0.2
      }
    }
  }
  for (const playerId of awayLineup.startingPlayerIds) {
    if (!isHomeTied) {
      if (awayScore > homeScore) {
        playerRatings[playerId] = (playerRatings[playerId] ?? 6.0) + 0.3
      } else {
        playerRatings[playerId] = (playerRatings[playerId] ?? 6.0) - 0.2
      }
    }
  }

  // Random variance ±0.5 per player
  for (const playerId of Object.keys(playerRatings)) {
    const randomVariance = (rand() - 0.5) * 1.0
    playerRatings[playerId] += randomVariance
  }

  // Clamp ratings
  for (const playerId of Object.keys(playerRatings)) {
    playerRatings[playerId] = clamp(playerRatings[playerId], 3.0, 10.0)
  }

  // Player of the match
  let playerOfTheMatchId: string | undefined
  let highestRating = -Infinity
  for (const [playerId, rating] of Object.entries(playerRatings)) {
    if (rating > highestRating) {
      highestRating = rating
      playerOfTheMatchId = playerId
    }
  }

  const report: MatchReport = {
    playerRatings,
    shotsHome,
    shotsAway,
    cornersHome,
    cornersAway,
    penaltiesHome: 0,
    penaltiesAway: 0,
    possessionHome,
    possessionAway,
    playerOfTheMatchId,
  }

  // Handle overtime + penalties for knockout matches that end in a draw
  let wentToOvertime = false
  let wentToPenalties = false
  let overtimeResult: 'home' | 'away' | undefined
  let penaltyResult: { home: number; away: number } | undefined

  if (fixture.isKnockout && homeScore === awayScore) {
    wentToOvertime = true
    // Overtime: 20 steps with reduced goal chance
    const otGoalMod = weatherGoalMod * 0.85
    for (let step = 0; step < 20; step++) {
      const homePenaltyFactor = homeActiveSuspensions > 0 ? 0.75 : 1.0
      const awayPenaltyFactor = awayActiveSuspensions > 0 ? 0.75 : 1.0
      const homeWeight = homeAttack * 1.15 * (1 + effectiveHomeAdvantage) * homePenaltyFactor
      const awayWeight = awayAttack * 1.15 * awayPenaltyFactor
      const isHomeAttacking = rand() < homeWeight / (homeWeight + awayWeight)

      const attackingStarters = isHomeAttacking ? homeStarters : awayStarters
      const attackingClubId = isHomeAttacking ? fixture.homeClubId : fixture.awayClubId
      const attAttack = isHomeAttacking ? homeAttack * 1.15 : awayAttack * 1.15
      const defDefense = isHomeAttacking ? awayDefense : homeDefense
      const defGK = isHomeAttacking ? awayGK : homeGK

      const chanceQuality = clamp(attAttack * 0.5 - defDefense * 0.3 + randRange(rand, -0.15, 0.25), 0.05, 0.90)
      const goalThreshold = chanceQuality * 0.40 * (1 - defGK * 0.35) * otGoalMod

      if (rand() < goalThreshold && canScore(isHomeAttacking)) {
        const scorer = getGoalScorer(attackingStarters)
        if (scorer) {
          if (isHomeAttacking) { homeScore++ } else { awayScore++ }
          trackGoal(scorer.id)
          const assister = getAssistProvider(attackingStarters, scorer.id)
          events.push({
            minute: 91 + step * 1.5,
            type: MatchEventType.Goal,
            clubId: attackingClubId,
            playerId: scorer.id,
            secondaryPlayerId: assister?.id,
            description: `Förlängningsmål av ${scorer.firstName} ${scorer.lastName}`,
          })
          if (assister) {
            trackAssist(assister.id)
            events.push({
              minute: 91 + step * 1.5,
              type: MatchEventType.Assist,
              clubId: attackingClubId,
              playerId: assister.id,
              description: `Assist av ${assister.firstName} ${assister.lastName}`,
            })
          }
          overtimeResult = isHomeAttacking ? 'home' : 'away'
          break
        }
      }
    }

    // Penalties if still tied after overtime
    if (homeScore === awayScore) {
      wentToPenalties = true
      const homeGKPlayer = homeStarters.find(p => p.position === PlayerPosition.Goalkeeper)
      const awayGKPlayer = awayStarters.find(p => p.position === PlayerPosition.Goalkeeper)
      const { homeGoals, awayGoals } = simulatePenalties(homeStarters, awayStarters, homeGKPlayer, awayGKPlayer, rand)
      penaltyResult = { home: homeGoals, away: awayGoals }
    }
  }

  const updatedFixture: Fixture = {
    ...fixture,
    homeScore,
    awayScore,
    status: FixtureStatus.Completed,
    homeLineup,
    awayLineup,
    events,
    report,
    wentToOvertime: wentToOvertime || undefined,
    wentToPenalties: wentToPenalties || undefined,
    overtimeResult,
    penaltyResult,
  }

  return { fixture: updatedFixture }
}
