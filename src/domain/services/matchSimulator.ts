import type { Player } from '../entities/Player'
import type { Fixture, MatchEvent, MatchReport, TeamSelection } from '../entities/Fixture'
import type { Weather } from '../entities/Weather'
import { FixtureStatus, MatchEventType, PlayerPosition, WeatherCondition } from '../enums'
import { evaluateSquad } from './squadEvaluator'
import { getTacticModifiers } from './tacticModifiers'
import { commentary, fillTemplate, pickCommentary } from '../data/commentary'
import { getConditionLabel, getIceQualityLabel } from './weatherService'
import type { Rivalry } from '../data/rivalries'

export interface SimulateMatchInput {
  fixture: Fixture
  homeLineup: TeamSelection
  awayLineup: TeamSelection
  homePlayers: Player[]
  awayPlayers: Player[]
  homeAdvantage?: number
  seed?: number
  weather?: Weather
  homeClubName?: string
  awayClubName?: string
  isPlayoff?: boolean
  rivalry?: Rivalry
}

function computeWeatherEffects(w: Weather) {
  const penalty = w.condition === WeatherCondition.HeavySnow ? 20 :
                  w.condition === WeatherCondition.Thaw ? 22 :
                  w.condition === WeatherCondition.LightSnow ? 8 :
                  w.condition === WeatherCondition.Fog ? 5 : 0
  const speed = w.condition === WeatherCondition.HeavySnow ? 0.87 :
                w.condition === WeatherCondition.Thaw ? 0.82 :
                w.condition === WeatherCondition.LightSnow ? 0.93 : 1.0
  const goalMod = w.condition === WeatherCondition.HeavySnow ? 0.90 :
                  w.condition === WeatherCondition.Thaw ? 0.87 :
                  w.condition === WeatherCondition.Fog ? 0.92 : 1.0
  return { ballControlPenalty: penalty, speedModifier: speed, goalChanceModifier: goalMod }
}

export interface SimulateMatchResult {
  fixture: Fixture
}

// Mulberry32 seeded PRNG
function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return function (): number {
    s += 0x6d2b79f5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value))
}

function randRange(rand: () => number, min: number, max: number): number {
  return rand() * (max - min) + min
}

function weightedPick(rand: () => number, weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rand() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}

function pickWeightedPlayer(rand: () => number, players: Player[], weights: number[]): Player {
  return players[weightedPick(rand, weights)]
}

type SequenceType = 'attack' | 'transition' | 'corner' | 'halfchance' | 'foul' | 'lostball'

const SEQUENCE_TYPES: SequenceType[] = ['attack', 'transition', 'corner', 'halfchance', 'foul', 'lostball']

function pickGoalCommentary(
  scoringTeamScore: number,
  otherTeamScore: number,
  rand: () => number
): string {
  const isFirstGoal = scoringTeamScore === 1 && otherTeamScore === 0
  const wasTied = (scoringTeamScore - 1) === otherTeamScore
  const wasLosing = (scoringTeamScore - 1) < otherTeamScore
  const isNowTied = scoringTeamScore === otherTeamScore

  let pool: string[]
  if (isFirstGoal) pool = commentary.goalOpener
  else if (wasLosing && isNowTied) pool = commentary.goalEqualizer
  else if (wasLosing) pool = commentary.goalReducing
  else if (wasTied) pool = commentary.goalLead
  else pool = commentary.goalExtend

  return rand() > 0.5
    ? pickCommentary(pool, rand)
    : pickCommentary(commentary.goal, rand)
}

function pickWeatherCommentary(weather: Weather | undefined, rand: () => number): string | null {
  if (!weather) return null
  let pool: string[]
  if (weather.condition === WeatherCondition.HeavySnow || weather.condition === WeatherCondition.LightSnow) {
    pool = commentary.weatherSnow
  } else if (weather.condition === WeatherCondition.Fog) {
    pool = commentary.weatherFog
  } else if (weather.condition === WeatherCondition.Thaw || weather.temperature > 2) {
    pool = commentary.weatherMild
  } else if (weather.temperature < -5) {
    pool = commentary.weatherCold
  } else {
    pool = commentary.weatherGood
  }
  return pickCommentary(pool, rand)
}

export function simulateMatch(input: SimulateMatchInput): SimulateMatchResult {
  const {
    fixture,
    homeLineup,
    awayLineup,
    homePlayers,
    awayPlayers,
    homeAdvantage = 0.05,
    seed,
    weather,
    isPlayoff = false,
    rivalry,
  } = input

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

  // Apply weather modifiers
  let weatherGoalMod = 1.0
  if (weather && weather.condition !== undefined) {
    const { ballControlPenalty, speedModifier, goalChanceModifier } = computeWeatherEffects(weather)
    homeAttack *= (1 - ballControlPenalty / 200) * speedModifier
    awayAttack *= (1 - ballControlPenalty / 200) * speedModifier
    weatherGoalMod = goalChanceModifier
  }

  // Playoff intensity modifiers
  if (isPlayoff) {
    // Better team wins more reliably (reduce randomness by tightening strength differences)
    const homeStrengthBonus = (homeAttack - awayAttack) * 0.1
    homeAttack = clamp(homeAttack + homeStrengthBonus, 0, 1)
  }

  // Derby intensity modifiers
  let derbyFoulMult = 1.0
  let derbyChanceMult = 0.0
  let effectiveHomeAdvantage = homeAdvantage
  if (rivalry) {
    // Compress strength gap (underdogs perform better in derby)
    const avgAttack = (homeAttack + awayAttack) / 2
    homeAttack = avgAttack + (homeAttack - avgAttack) * 0.7
    awayAttack = avgAttack + (awayAttack - avgAttack) * 0.7
    // More fouls/suspensions
    derbyFoulMult = 1 + rivalry.intensity * 0.15
    // More open play (higher chance quality)
    derbyChanceMult = 0.05
    // Bigger home advantage in derby atmosphere
    effectiveHomeAdvantage = homeAdvantage * (1 + rivalry.intensity * 0.1)
  }

  // Match state
  let homeScore = 0
  let awayScore = 0
  const events: MatchEvent[] = []

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
  const playerYellowCards: Record<string, number> = {}
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

  function trackYellow(playerId: string) {
    playerYellowCards[playerId] = (playerYellowCards[playerId] ?? 0) + 1
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
      if (p.position === PlayerPosition.Forward) return 3
      if (p.position === PlayerPosition.Midfielder) return 2
      if (p.position === PlayerPosition.Half) return 1
      return 0.5
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
    let wCorner = 15
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
      const chanceQuality = clamp(base * 1.2 + 0.15 + 0.15 + derbyChanceMult, 0.05, 0.95)

      if (chanceQuality > 0.15) {
        if (isHomeAttacking) { shotsHome++ } else { shotsAway++ }

        const shotResult = rand()
        const defenderGkStrength = defGK
        const goalThreshold = chanceQuality * 0.45 * (1 - defenderGkStrength * 0.35) * weatherGoalMod

        if (shotResult < goalThreshold) {
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
              description: `Goal by ${scorer.firstName} ${scorer.lastName}`,
            })
            if (assister) {
              trackAssist(assister.id)
              addEvent({
                minute,
                type: MatchEventType.Assist,
                clubId: attackingClubId,
                playerId: assister.id,
                secondaryPlayerId: scorer.id,
                description: `Assist by ${assister.firstName} ${assister.lastName}`,
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
              description: `Save by ${gk.firstName} ${gk.lastName}`,
            })
          }
        } else if (shotResult < goalThreshold + 0.45) {
          // Corner
          if (isHomeAttacking) { cornersHome++ } else { cornersAway++ }
          addEvent({
            minute,
            type: MatchEventType.Corner,
            clubId: attackingClubId,
            description: 'Corner kick',
          })
        }
        // else: shot off target, no event
      }
    } else if (seqType === 'transition') {
      const chanceQuality = randRange(rand, 0.3, 0.7)

      if (chanceQuality > 0.05) {
        if (isHomeAttacking) { shotsHome++ } else { shotsAway++ }

        const shotResult = rand()
        const goalThreshold = chanceQuality * 0.28 * (1 - defGK * 0.4) * 1.15 * weatherGoalMod

        if (shotResult < goalThreshold) {
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
              description: `Transition goal by ${scorer.firstName} ${scorer.lastName}`,
            })
            if (assister) {
              trackAssist(assister.id)
              addEvent({
                minute,
                type: MatchEventType.Assist,
                clubId: attackingClubId,
                playerId: assister.id,
                secondaryPlayerId: scorer.id,
                description: `Assist by ${assister.firstName} ${assister.lastName}`,
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
              description: `Save by ${gk.firstName} ${gk.lastName}`,
            })
          }
        }
      }
    } else if (seqType === 'corner') {
      if (isHomeAttacking) { cornersHome++ } else { cornersAway++ }

      const cornerChance = attCorner * 0.7 + randRange(rand, 0, 0.3)
      const defenseResist = defDefense * 0.5 + defGK * 0.3 + randRange(rand, 0, 0.2)
      const goalThreshold = clamp((cornerChance - defenseResist) * 0.25 * weatherGoalMod + 0.08, 0.06, 0.18)

      const r = rand()
      if (r < goalThreshold) {
        // Corner goal
        const scorer = getGoalScorer(attackingStarters)
        const assister = getAssistProvider(attackingStarters, scorer?.id)

        if (scorer) {
          if (isHomeAttacking) { homeScore++ } else { awayScore++ }
          addEvent({
            minute,
            type: MatchEventType.Corner,
            clubId: attackingClubId,
            description: 'Corner kick leads to goal',
          })
          trackGoal(scorer.id)
          addEvent({
            minute,
            type: MatchEventType.Goal,
            clubId: attackingClubId,
            playerId: scorer.id,
            secondaryPlayerId: assister?.id,
            description: `Corner goal by ${scorer.firstName} ${scorer.lastName}`,
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
              description: `Corner assist by ${assister.firstName} ${assister.lastName}`,
            })
          }
        }
      } else if (r < goalThreshold + 0.3) {
        addEvent({
          minute,
          type: MatchEventType.Corner,
          clubId: attackingClubId,
          description: 'Corner kick',
        })
      }
      // else: defended away
    } else if (seqType === 'halfchance') {
      if (isHomeAttacking) { shotsHome++ } else { shotsAway++ }
      const chanceQuality = randRange(rand, 0.05, 0.25) * (isPlayoff ? 1.05 : 1.0)
      const goalThreshold = chanceQuality * 0.30 * weatherGoalMod

      if (rand() < goalThreshold) {
        const scorer = getGoalScorer(attackingStarters)

        if (scorer) {
          if (isHomeAttacking) { homeScore++ } else { awayScore++ }
          trackGoal(scorer.id)
          addEvent({
            minute,
            type: MatchEventType.Goal,
            clubId: attackingClubId,
            playerId: scorer.id,
            description: `Half-chance goal by ${scorer.firstName} ${scorer.lastName}`,
          })
        }
      }
    } else if (seqType === 'foul') {
      // Defending team commits the foul
      const foulProb = (attDiscipline) * 0.4 + (defDiscipline) * 0.3

      const r = rand()
      if (r < foulProb * 0.15 * (isPlayoff ? 1.2 : 1.0) * derbyFoulMult) {
        // Suspension (red card equivalent)
        const suspPlayer = getDefendingPlayer(defendingStarters)
        if (suspPlayer) {
          const duration = 3 + Math.floor(rand() * 3) // 3-5 steps
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
            description: `Red card for ${suspPlayer.firstName} ${suspPlayer.lastName}`,
          })
        }
      } else if (r < foulProb * 0.6 * (isPlayoff ? 1.2 : 1.0) * derbyFoulMult) {
        const yellowPlayer = getDefendingPlayer(defendingStarters)
        if (yellowPlayer) {
          trackYellow(yellowPlayer.id)
          addEvent({
            minute,
            type: MatchEventType.YellowCard,
            clubId: defendingClubId,
            playerId: yellowPlayer.id,
            description: `Yellow card for ${yellowPlayer.firstName} ${yellowPlayer.lastName}`,
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
  for (const [playerId, yellows] of Object.entries(playerYellowCards)) {
    if (playerRatings[playerId] !== undefined) {
      playerRatings[playerId] -= yellows * 0.4
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

  const updatedFixture: Fixture = {
    ...fixture,
    homeScore,
    awayScore,
    status: FixtureStatus.Completed,
    homeLineup,
    awayLineup,
    events,
    report,
  }

  return { fixture: updatedFixture }
}

// ── Step-by-step generator ──────────────────────────────────────────────

export interface MatchStep {
  step: number
  minute: number
  events: MatchEvent[]
  homeScore: number
  awayScore: number
  commentary: string
  intensity: 'low' | 'medium' | 'high'
  activeSuspensions: { homeCount: number; awayCount: number }
  shotsHome: number
  shotsAway: number
  cornersHome: number
  cornersAway: number
  weatherNote?: string
  isDerbyComment?: boolean
}

export interface StepByStepInput {
  fixture: Fixture
  homeLineup: TeamSelection
  awayLineup: TeamSelection
  homePlayers: Player[]
  awayPlayers: Player[]
  homeAdvantage?: number
  seed?: number
  weather?: Weather
  homeClubName?: string
  awayClubName?: string
  isPlayoff?: boolean
  rivalry?: Rivalry
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
    rivalry,
  } = input

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
  let homeAttackSbs = (homeEval.offenseScore * homeMods.offenseModifier) / 100
  const homeDefense = (homeEval.defenseScore * homeMods.defenseModifier) / 100
  const homeCorner = (homeEval.cornerScore * homeMods.cornerModifier) / 100
  const homeGK = homeEval.goalkeeperScore / 100
  const homeDisciplineRisk = (homeEval.disciplineRisk * homeMods.disciplineModifier) / 100

  let awayAttackSbs = (awayEval.offenseScore * awayMods.offenseModifier) / 100
  const awayDefense = (awayEval.defenseScore * awayMods.defenseModifier) / 100
  const awayCorner = (awayEval.cornerScore * awayMods.cornerModifier) / 100
  const awayGK = awayEval.goalkeeperScore / 100
  const awayDisciplineRisk = (awayEval.disciplineRisk * awayMods.disciplineModifier) / 100

  // Apply weather modifiers
  let weatherGoalModSbs = 1.0
  if (weather && weather.condition !== undefined) {
    const { ballControlPenalty, speedModifier, goalChanceModifier } = computeWeatherEffects(weather)
    homeAttackSbs *= (1 - ballControlPenalty / 200) * speedModifier
    awayAttackSbs *= (1 - ballControlPenalty / 200) * speedModifier
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
  let effectiveHomeAdvantageSbs = homeAdvantage
  if (rivalry) {
    const avgAttack = (homeAttackSbs + awayAttackSbs) / 2
    homeAttackSbs = avgAttack + (homeAttackSbs - avgAttack) * 0.7
    awayAttackSbs = avgAttack + (awayAttackSbs - avgAttack) * 0.7
    derbyFoulMult = 1 + rivalry.intensity * 0.15
    derbyChanceMult = 0.05
    effectiveHomeAdvantageSbs = homeAdvantage * (1 + rivalry.intensity * 0.1)
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

  // Per-player tracking for ratings (needed for final report)
  const playerGoals: Record<string, number> = {}
  const playerAssists: Record<string, number> = {}
  const playerYellowCards: Record<string, number> = {}
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

  function trackYellow(playerId: string) {
    playerYellowCards[playerId] = (playerYellowCards[playerId] ?? 0) + 1
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
      if (p.position === PlayerPosition.Forward) return 3
      if (p.position === PlayerPosition.Midfielder) return 2
      if (p.position === PlayerPosition.Half) return 1
      return 0.5
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

  function buildSequenceWeights(isHome: boolean): number[] {
    const tactic = isHome ? homeLineup.tactic : awayLineup.tactic
    const mods = isHome ? homeMods : awayMods

    let wAttack = 40
    let wTransition = 15
    let wCorner = 15
    let wHalfchance = 10
    let wFoul = 12
    let wLostball = 8

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

  for (let step = 0; step < 60; step++) {
    const minute = Math.round(step * 1.5)
    const stepEvents: MatchEvent[] = []

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

    // Pick sequence type
    const seqWeights = buildSequenceWeights(isHomeAttacking)
    const seqIdx = weightedPick(rand, seqWeights)
    const seqType = isOpeningStep ? 'neutral' : SEQUENCE_TYPES[seqIdx]

    // Track what happened for commentary selection
    let goalScored = false
    let cornerGoalScored = false
    let saveOccurred = false
    let suspensionOccurred = false
    let yellowCardOccurred = false
    let cornerOccurred = false
    let scorerPlayerId: string | undefined
    let gkPlayerId: string | undefined
    let suspendedPlayerId: string | undefined
    let yellowPlayerId: string | undefined

    if (seqType === 'attack') {
      const base = attAttack * 0.6 - defDefense * 0.4 + randRange(rand, -0.2, 0.2)
      const chanceQuality = clamp(base * 1.2 + 0.15 + 0.15 + derbyChanceMult, 0.05, 0.95)

      if (chanceQuality > 0.15) {
        if (isHomeAttacking) { shotsHome++ } else { shotsAway++ }

        const shotResult = rand()
        const defenderGkStrength = defGK
        const goalThreshold = chanceQuality * 0.45 * (1 - defenderGkStrength * 0.35) * weatherGoalMod

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
              description: `Goal by ${scorer.firstName} ${scorer.lastName}`,
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
                description: `Assist by ${assister.firstName} ${assister.lastName}`,
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
              description: `Save by ${gk.firstName} ${gk.lastName}`,
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
            description: 'Corner kick',
          }
          stepEvents.push(event)
          allEvents.push(event)
        }
      }
    } else if (seqType === 'transition') {
      const chanceQuality = randRange(rand, 0.3, 0.7)

      if (chanceQuality > 0.05) {
        if (isHomeAttacking) { shotsHome++ } else { shotsAway++ }

        const shotResult = rand()
        const goalThreshold = chanceQuality * 0.28 * (1 - defGK * 0.4) * 1.15 * weatherGoalMod

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
              description: `Transition goal by ${scorer.firstName} ${scorer.lastName}`,
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
                description: `Assist by ${assister.firstName} ${assister.lastName}`,
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
              description: `Save by ${gk.firstName} ${gk.lastName}`,
            }
            stepEvents.push(event)
            allEvents.push(event)
          }
        }
      }
    } else if (seqType === 'corner') {
      if (isHomeAttacking) { cornersHome++ } else { cornersAway++ }

      const cornerChance = attCorner * 0.7 + randRange(rand, 0, 0.3)
      const defenseResist = defDefense * 0.5 + defGK * 0.3 + randRange(rand, 0, 0.2)
      const goalThreshold = clamp((cornerChance - defenseResist) * 0.25 * weatherGoalMod + 0.08, 0.06, 0.18)

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
            description: 'Corner kick leads to goal',
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
            description: `Corner goal by ${scorer.firstName} ${scorer.lastName}`,
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
              description: `Corner assist by ${assister.firstName} ${assister.lastName}`,
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
          description: 'Corner kick',
        }
        stepEvents.push(event)
        allEvents.push(event)
      }
    } else if (seqType === 'halfchance') {
      if (isHomeAttacking) { shotsHome++ } else { shotsAway++ }
      const chanceQuality = randRange(rand, 0.05, 0.25) * (isPlayoff ? 1.05 : 1.0)
      const goalThreshold = chanceQuality * 0.30 * weatherGoalMod

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
            description: `Half-chance goal by ${scorer.firstName} ${scorer.lastName}`,
          }
          stepEvents.push(event)
          allEvents.push(event)
        }
      }
    } else if (seqType === 'foul') {
      const foulProb = (attDiscipline) * 0.4 + (defDiscipline) * 0.3

      const r = rand()
      if (r < foulProb * 0.15 * (isPlayoff ? 1.2 : 1.0) * derbyFoulMult) {
        const suspPlayer = getDefendingPlayer(defendingStarters)
        if (suspPlayer) {
          suspendedPlayerId = suspPlayer.id
          suspensionOccurred = true
          const duration = 3 + Math.floor(rand() * 3)
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
            description: `Red card for ${suspPlayer.firstName} ${suspPlayer.lastName}`,
          }
          stepEvents.push(event)
          allEvents.push(event)
        }
      } else if (r < foulProb * 0.6 * (isPlayoff ? 1.2 : 1.0) * derbyFoulMult) {
        const yellowPlayer = getDefendingPlayer(defendingStarters)
        if (yellowPlayer) {
          yellowPlayerId = yellowPlayer.id
          yellowCardOccurred = true
          trackYellow(yellowPlayer.id)
          const event: MatchEvent = {
            minute,
            type: MatchEventType.YellowCard,
            clubId: defendingClubId,
            playerId: yellowPlayer.id,
            description: `Yellow card for ${yellowPlayer.firstName} ${yellowPlayer.lastName}`,
          }
          stepEvents.push(event)
          allEvents.push(event)
        }
      }
    }

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
      result: homeScore > awayScore ? 'vinst' : homeScore < awayScore ? 'förlust' : 'oavgjort',
      rivalry: rivalry?.name ?? '',
    }

    if (step === 0) {
      if (rivalry) {
        commentaryText = fillTemplate(pickCommentary(commentary.derby_kickoff, rand), { ...templateVars, rivalry: rivalry.name })
        isDerbyStep = true
      } else {
        commentaryText = fillTemplate(pickCommentary(commentary.kickoff, rand), templateVars)
      }
    } else if (step === 30) {
      commentaryText = fillTemplate(pickCommentary(commentary.halfTime, rand), templateVars)
    } else if (cornerGoalScored && scorerPlayerId) {
      templateVars = { ...templateVars, player: findPlayerName(scorerPlayerId) }
      const cornerIntro = fillTemplate(pickCommentary(commentary.corner, rand), templateVars)
      let goalText: string
      if (weather && weather.condition === WeatherCondition.HeavySnow && rand() < 0.20) {
        goalText = fillTemplate(pickCommentary(commentary.weather_goal_heavySnow, rand), templateVars)
      } else if (weather && weather.condition === WeatherCondition.Thaw && rand() < 0.20) {
        goalText = fillTemplate(pickCommentary(commentary.weather_goal_thaw, rand), templateVars)
      } else {
        goalText = fillTemplate(pickCommentary(commentary.cornerGoal, rand), templateVars)
      }
      commentaryText = cornerIntro + ' ' + goalText
    } else if (goalScored && scorerPlayerId) {
      templateVars = { ...templateVars, player: findPlayerName(scorerPlayerId) }
      if (rivalry && rand() < 0.40) {
        commentaryText = fillTemplate(pickCommentary(commentary.derby_goal, rand), { ...templateVars, player: findPlayerName(scorerPlayerId), rivalry: rivalry.name })
        isDerbyStep = true
      } else if (weather && weather.condition === WeatherCondition.HeavySnow && rand() < 0.20) {
        commentaryText = fillTemplate(pickCommentary(commentary.weather_goal_heavySnow, rand), templateVars)
      } else if (weather && weather.condition === WeatherCondition.Thaw && rand() < 0.20) {
        commentaryText = fillTemplate(pickCommentary(commentary.weather_goal_thaw, rand), templateVars)
      } else {
        const scoringTeamScore = isHomeAttacking ? homeScore : awayScore
        const otherTeamScore = isHomeAttacking ? awayScore : homeScore
        commentaryText = fillTemplate(pickGoalCommentary(scoringTeamScore, otherTeamScore, rand), templateVars)
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
    } else if (yellowCardOccurred && yellowPlayerId) {
      templateVars = { ...templateVars, player: findPlayerName(yellowPlayerId) }
      commentaryText = fillTemplate(pickCommentary(commentary.yellowCard, rand), templateVars)
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
      } else {
        commentaryText = fillTemplate(pickCommentary(commentary.neutral, rand), templateVars)
      }
    }

    // Determine intensity
    let intensity: 'low' | 'medium' | 'high'
    if (goalScored || suspensionOccurred) {
      intensity = 'high'
    } else if (saveOccurred || cornerOccurred) {
      intensity = 'medium'
    } else {
      intensity = 'low'
    }

    // Weather note for step 0
    const stepWeatherNote = step === 0 ? openingWeatherNote : undefined

    yield {
      step,
      minute,
      events: stepEvents,
      homeScore,
      awayScore,
      commentary: commentaryText,
      intensity,
      activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions },
      shotsHome,
      shotsAway,
      cornersHome,
      cornersAway,
      weatherNote: stepWeatherNote,
      isDerbyComment: isDerbyStep || undefined,
    }
  }

  // Final step (step 60, minute 90) — full time
  const scoreStr = `${homeScore}–${awayScore}`
  const homeTeamRef = fixture.homeClubId
  const awayTeamRef = fixture.awayClubId
  const fullTimeVars: Record<string, string> = {
    team: homeTeamRef,
    opponent: awayTeamRef,
    score: scoreStr,
    minute: '90',
    player: '',
    goalkeeper: '',
    rivalry: rivalry?.name ?? '',
    result: homeScore > awayScore ? 'vinst' : homeScore < awayScore ? 'förlust' : 'oavgjort',
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
  }
}
