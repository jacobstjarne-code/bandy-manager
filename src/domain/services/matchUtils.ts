import type { Player } from '../entities/Player'
import type { Fixture, MatchEvent, TeamSelection } from '../entities/Fixture'
import type { Weather } from '../entities/Weather'
import { WeatherCondition, IceQuality, PlayerPosition } from '../enums'
import type { Rivalry } from '../data/rivalries'
import { commentary, pickCommentary } from '../data/matchCommentary'

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
  fanMood?: number
  managedIsHome?: boolean
  storylines?: Array<{ playerId?: string; type: string; displayText: string }>
}

export function computeWeatherEffects(w: Weather) {
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

export function computeWeatherTacticInteraction(
  weather: Weather,
  tactic: { tempo: string; passingRisk: string; width: string; press: string },
): { extraBallControlPenalty: number; extraFatigue: number; extraInjuryRisk: number } {
  let extraBCP = 0
  let extraFatigue = 0
  let extraInjury = 0

  if (weather.condition === WeatherCondition.HeavySnow) {
    if (tactic.passingRisk === 'direct') extraBCP += 10
    if (tactic.tempo === 'high') extraFatigue += 0.15
    if (tactic.passingRisk === 'safe') extraBCP -= 5
  }

  if (weather.condition === WeatherCondition.Thaw) {
    if (tactic.tempo === 'high') {
      extraFatigue += 0.20
      extraInjury += 0.15
    }
    if (tactic.press === 'high') extraFatigue += 0.10
    if (tactic.width === 'narrow') extraBCP -= 3
  }

  if (weather.condition === WeatherCondition.Fog) {
    if (tactic.width === 'wide') extraBCP += 8
    if (tactic.passingRisk === 'direct') extraBCP += 5
    if (tactic.width === 'narrow' && tactic.passingRisk === 'safe') extraBCP -= 5
  }

  if (weather.temperature < -15) {
    if (tactic.tempo === 'high') extraInjury += 0.10
    if (tactic.press === 'high') extraFatigue += 0.10
  }

  if (weather.iceQuality === IceQuality.Excellent) {
    if (tactic.tempo === 'high') extraFatigue -= 0.05
    if (tactic.passingRisk === 'direct') extraBCP -= 3
  }

  return {
    extraBallControlPenalty: extraBCP,
    extraFatigue: Math.max(-0.10, extraFatigue),
    extraInjuryRisk: Math.max(0, extraInjury),
  }
}

export interface SimulateMatchResult {
  fixture: Fixture
}


export function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value))
}

export function randRange(rand: () => number, min: number, max: number): number {
  return rand() * (max - min) + min
}

export function weightedPick(rand: () => number, weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rand() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}

export function pickWeightedPlayer(rand: () => number, players: Player[], weights: number[]): Player {
  return players[weightedPick(rand, weights)]
}

export type SequenceType = 'attack' | 'transition' | 'corner' | 'halfchance' | 'foul' | 'lostball'

export const SEQUENCE_TYPES: SequenceType[] = ['attack', 'transition', 'corner', 'halfchance', 'foul', 'lostball']

export function pickGoalCommentary(
  scoringTeamScore: number,
  otherTeamScore: number,
  rand: () => number,
  minute = 0,
): string {
  const isFirstGoal = scoringTeamScore === 1 && otherTeamScore === 0
  const wasTied = (scoringTeamScore - 1) === otherTeamScore
  const wasLosing = (scoringTeamScore - 1) < otherTeamScore
  const isNowTied = scoringTeamScore === otherTeamScore
  const isLate = minute > 75

  // Late-goal variant with 35% probability when after minute 75
  if (isLate && rand() < 0.35) {
    return pickCommentary(commentary.goalLate, rand)
  }

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

export function pickWeatherCommentary(weather: Weather | undefined, rand: () => number): string | null {
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

export interface PenaltyRound {
  round: number
  homeShooterId: string
  homeShooterName: string
  homeScored: boolean
  awayShooterId: string
  awayShooterName: string
  awayScored: boolean
}

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
  // Corner interaction (managed club corners only)
  cornerInteractionData?: import('./cornerInteractionService').CornerInteractionData
  // Overtime/penalty metadata
  phase?: 'regular' | 'overtime' | 'penalties'
  penaltyRound?: PenaltyRound
  penaltyHomeTotal?: number
  penaltyAwayTotal?: number
  penaltyDone?: boolean
  overtimeResult?: 'home' | 'away'
  penaltyFinalResult?: { home: number; away: number }
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
  fanMood?: number
  managedIsHome?: boolean
  storylines?: Array<{ playerId?: string; type: string; displayText: string }>
}

export interface SecondHalfInput extends StepByStepInput {
  // State carried over from first half
  initialHomeScore: number
  initialAwayScore: number
  initialShotsHome: number
  initialShotsAway: number
  initialCornersHome: number
  initialCornersAway: number
  initialHomeSuspensions: number
  initialAwaySuspensions: number
  // homeLineup.tactic / awayLineup.tactic already contain updated tactics
  substitutions?: { outId: string; inId: string }[]
}

export function simulatePenalties(
  homeStarters: Player[],
  awayStarters: Player[],
  homeGK: Player | undefined,
  awayGK: Player | undefined,
  rand: () => number,
): { rounds: PenaltyRound[]; homeGoals: number; awayGoals: number } {
  // Build shooter order: 5 best outfielders by shooting, then rest
  function getShooterOrder(starters: Player[]): Player[] {
    const nonGK = starters.filter(p => p.position !== PlayerPosition.Goalkeeper)
    return [...nonGK].sort((a, b) => b.attributes.shooting - a.attributes.shooting)
  }
  const homeShooters = getShooterOrder(homeStarters)
  const awayShooters = getShooterOrder(awayStarters)

  function shootProb(shooter: Player, gk: Player | undefined): number {
    const base = (shooter.attributes.shooting * 0.4 + shooter.attributes.decisions * 0.3 + (shooter.morale ?? 50) * 0.3) / 100
    const gkBonus = gk ? (gk.attributes.goalkeeping / 100) * 0.15 : 0
    const specialistBonus = shooter.attributes.shooting > 75 ? 0.05 : 0
    return Math.max(0.30, Math.min(0.95, 0.70 + (base - 0.50) * 0.6 - gkBonus + specialistBonus))
  }

  const rounds: PenaltyRound[] = []
  let homeGoals = 0
  let awayGoals = 0

  // Standard 5 rounds
  for (let i = 0; i < 5; i++) {
    const homeShooter = homeShooters[i % homeShooters.length]
    const awayShooter = awayShooters[i % awayShooters.length]
    const homeScored = rand() < shootProb(homeShooter, awayGK)
    const awayScored = rand() < shootProb(awayShooter, homeGK)
    if (homeScored) homeGoals++
    if (awayScored) awayGoals++
    rounds.push({
      round: i + 1,
      homeShooterId: homeShooter.id,
      homeShooterName: `${homeShooter.firstName} ${homeShooter.lastName}`,
      homeScored,
      awayShooterId: awayShooter.id,
      awayShooterName: `${awayShooter.firstName} ${awayShooter.lastName}`,
      awayScored,
    })
    // Early finish: if one side can't catch up after round 3
    const remaining = 4 - i
    if (homeGoals > awayGoals + remaining || awayGoals > homeGoals + remaining) break
  }

  // Sudden death if still tied
  if (homeGoals === awayGoals) {
    let sdRound = rounds.length + 1
    while (sdRound <= 20) {
      const homeShooter = homeShooters[(sdRound - 1) % homeShooters.length]
      const awayShooter = awayShooters[(sdRound - 1) % awayShooters.length]
      const homeScored = rand() < shootProb(homeShooter, awayGK)
      const awayScored = rand() < shootProb(awayShooter, homeGK)
      if (homeScored) homeGoals++
      if (awayScored) awayGoals++
      rounds.push({
        round: sdRound,
        homeShooterId: homeShooter.id,
        homeShooterName: `${homeShooter.firstName} ${homeShooter.lastName}`,
        homeScored,
        awayShooterId: awayShooter.id,
        awayShooterName: `${awayShooter.firstName} ${awayShooter.lastName}`,
        awayScored,
      })
      if (homeGoals !== awayGoals) break
      sdRound++
    }
  }

  return { rounds, homeGoals, awayGoals }
}

