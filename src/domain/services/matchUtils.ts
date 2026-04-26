import type { Player } from '../entities/Player'
import type { Fixture, MatchEvent, TeamSelection } from '../entities/Fixture'
import type { Weather } from '../entities/Weather'
import { WeatherCondition, IceQuality, PlayerPosition } from '../enums'
import type { Rivalry } from '../data/rivalries'
import { commentary, pickCommentary } from '../data/matchCommentary'

// ── Match phase context ────────────────────────────────────────────────────
// Derived from fixture matchday: regular (1-26), quarterfinal (27-31),
// semifinal (32-36), final (37+). Drives all phase-specific probability tables.
export type MatchPhaseContext = 'regular' | 'quarterfinal' | 'semifinal' | 'final'

// Empirical goal-timing weights from 1124 Bandygrytan herr regular-season matches.
// Index = getTimingPeriod(minute). Normalized so weighted step-sum ≈ old TIMING_WEIGHTS total.
// Real data: 9.7 / 9.8 / 9.8 / 10.0 / 11.8 / 10.9 / 10.5 / 10.7 / 12.9 % per 10-min period.
export const GOAL_TIMING_BY_PERIOD: number[] = [
  0.954,  // 0–10 min   (9.7% of goals)
  0.964,  // 10–20 min  (9.8%)
  0.964,  // 20–30 min  (9.8%)
  0.984,  // 30–40 min  (10.0%)
  1.160,  // 40–50 min  (11.8%) ← halvtidsjakt
  1.072,  // 50–60 min  (10.9%)
  1.032,  // 60–70 min  (10.5%)
  1.052,  // 70–80 min  (10.7%)
  1.269,  // 80–90 min  (12.9%) ← slutryckning
]

// Empirical suspension-timing weights from same dataset.
// Real data: 4.5 / 6.6 / 8.5 / 9.7 / 11.8 / 10.0 / 11.6 / 12.5 / 16.5 % per 10-min period.
// Normalized so average ≈ 1.0 per step (preserves overall suspension rate).
export const SUSP_TIMING_BY_PERIOD: number[] = [
  0.447,  // 0–10 min   (4.5%)
  0.656,  // 10–20 min  (6.6%)
  0.844,  // 20–30 min  (8.5%)
  0.964,  // 30–40 min  (9.7%)
  1.172,  // 40–50 min  (11.8%)
  0.993,  // 50–60 min  (10.0%)
  1.152,  // 60–70 min  (11.6%)
  1.241,  // 70–80 min  (12.5%)
  1.639,  // 80–90 min  (16.5%) ← slutryckning
]

// Per-phase constants derived from Bandygrytan playoff data (KVF n=68, SF n=38, Final n=12).
// goalMod: avg mål/match vs regular 9.12 baseline.
// homeAdvDelta: additive on top of caller's homeAdvantage (neutral venues already zeroed).
// suspMod: phase avg / regular 3.77 avg.
// cornerTrailingMod / cornerLeadingMod: intra-phase ratio (trailing/leading vs even).
export const PHASE_CONSTANTS: Record<MatchPhaseContext, {
  goalMod: number
  homeAdvDelta: number
  suspMod: number
  cornerTrailingMod: number
  cornerLeadingMod: number
  cornerGoalMod: number
}> = {
  regular:     { goalMod: 1.000, homeAdvDelta: 0.00, suspMod: 1.00, cornerTrailingMod: 1.11, cornerLeadingMod: 0.90, cornerGoalMod: 1.00 },
  quarterfinal:{ goalMod: 0.966, homeAdvDelta: 0.06, suspMod: 0.84, cornerTrailingMod: 1.05, cornerLeadingMod: 0.81, cornerGoalMod: 0.78 },
  semifinal:   { goalMod: 0.920, homeAdvDelta: 0.05, suspMod: 0.94, cornerTrailingMod: 0.93, cornerLeadingMod: 0.86, cornerGoalMod: 0.75 },
  final:       { goalMod: 0.768, homeAdvDelta: 0.00, suspMod: 1.08, cornerTrailingMod: 0.58, cornerLeadingMod: 1.24, cornerGoalMod: 0.92 },
}

// Maps a match minute (0-90) to a 10-min period index (0-8) for timing lookups.
export function getTimingPeriod(minute: number): number {
  return Math.min(8, Math.floor(minute / 10))
}

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
  matchPhase?: MatchPhaseContext
  rivalry?: Rivalry
  fanMood?: number
  managedIsHome?: boolean
  storylines?: Array<{ playerId?: string; type: string; displayText: string }>
  fixtureMonth?: number  // 1-12, for seasonal ice hardness (DREAM-004)
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

export type SequenceType =
  | 'attack' | 'transition' | 'corner' | 'halfchance' | 'foul' | 'lostball'
  | 'tactical_shift' | 'player_duel' | 'atmosphere' | 'offside_call' | 'freekick_danger'

export const SEQUENCE_TYPES: SequenceType[] = [
  'attack', 'transition', 'corner', 'halfchance', 'foul', 'lostball',
  'tactical_shift', 'player_duel', 'atmosphere', 'offside_call', 'freekick_danger',
]

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

export type CommentaryType =
  | 'normal' | 'goal_context' | 'atmosphere' | 'situation'
  | 'player_duel' | 'referee' | 'tactical' | 'critical'

export interface MatchStep {
  step: number
  minute: number
  events: MatchEvent[]
  homeScore: number
  awayScore: number
  commentary: string
  commentaryType?: CommentaryType
  intensity: 'low' | 'medium' | 'high'
  activeSuspensions: { homeCount: number; awayCount: number }
  shotsHome: number
  shotsAway: number
  onTargetHome: number
  onTargetAway: number
  cornersHome: number
  cornersAway: number
  weatherNote?: string
  isDerbyComment?: boolean
  // Corner interaction (managed club corners only)
  cornerInteractionData?: import('./cornerInteractionService').CornerInteractionData
  // Penalty interaction (managed club attacking only)
  penaltyInteractionData?: import('./penaltyInteractionService').PenaltyInteractionData
  // Counter-attack interaction (managed club transition, max 2 per match)
  counterInteractionData?: import('./counterAttackInteractionService').CounterInteractionData
  // Free kick interaction (managed club dangerous foul, max 1 per match)
  freeKickInteractionData?: import('./freeKickInteractionService').FreeKickInteractionData
  // Last-minute press (automatic when trailing by 1 at step >= 55)
  lastMinutePressData?: import('./lastMinutePressService').LastMinutePressData
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
  matchPhase?: MatchPhaseContext
  rivalry?: Rivalry
  fanMood?: number
  managedIsHome?: boolean
  storylines?: Array<{ playerId?: string; type: string; displayText: string }>
  captainPlayerId?: string
  fanFavoritePlayerId?: string
  supporterContext?: { mood: number; members: number; leaderName: string }
  fixtureMonth?: number  // 1-12, for seasonal ice hardness (DREAM-004)
  matchContext?: {
    managedPosition?: number   // 1-12 i tabellen
    totalRounds?: number       // 22 för grundserie
    isFirstRound?: boolean     // säsongspremiär
  }
  // Second-half restart fields (optional — omit for full match from step 0)
  startStep?: number
  initialHomeScore?: number
  initialAwayScore?: number
  initialShotsHome?: number
  initialShotsAway?: number
  initialCornersHome?: number
  initialCornersAway?: number
  initialHomeSuspensions?: number
  initialAwaySuspensions?: number
  substitutions?: { outId: string; inId: string }[]
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

