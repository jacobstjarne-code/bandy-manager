// matchCore.ts — Unified match simulation engine
export const MATCH_ENGINE_VERSION = '1.2.0'

// Global goal-rate modifier. Multipliceras in i ALLA fem målvägar (attack,
// transition, corner, freekick, penalty) för att bevara kalibrering när
// MATCH_TOTAL_GOAL_CAP höjs. Deriverat empiriskt: stress-test med cap=17
// och bas-rates gav 9.748 mål/match → GOAL_RATE_MOD = 9.12 / 9.748 = 0.936.
const GOAL_RATE_MOD = 0.936

// Två oberoende grindar i canScore(): båda måste vara uppfyllda
// för att en målscen ska kunna konvertera.
//
// MATCH_TOTAL_GOAL_CAP — empirisk gräns. 99:e percentilen i Elitserien
// herr (1 124 matcher) är 17 totalmål. Sätts något under 99:e percentilen
// som kompromiss för spelupplevelse. Höjs i motor v1.2.0 baserat på data.
//
// MATCH_GOAL_DIFFERENCE_CAP — designval. Förhindrar att spelet producerar
// matcher med målskillnad > 6, vilket bedöms försämra spelupplevelse i
// Bandy Manager. Verkliga Elitseriematcher har >6 i marginal i 11,9 %
// av fallen — detta är ett medvetet avkall. Bör testas via playtest.
const MATCH_TOTAL_GOAL_CAP    = 17  // empirisk 99:e percentil Elitserien (finding:049)
const MATCH_GOAL_DIFFERENCE_CAP = 6  // designval, se kommentar ovan

// Bumpa vid varje förändring som påverkar simuleringsutfall.
// Schema-kompatibla ändringar (utan utfallspåverkan) bumpar patch.
// Mekaniska förändringar bumpar minor. Kalibreringsförändringar bumpar major.
export const ENGINE_VERSION = '1.0.0'
// PENALTY_CAUSE_COMMENTARY — shown as step commentary when interactive penalty is triggered
const PENALTY_CAUSE_COMMENTARY: Array<(attacker: string) => string> = [
  (a) => `Straff! ${a} fälls i straffområdet — domaren tvekar inte.`,
  (a) => `Tydligt fall. ${a} hakas ner bakifrån. Straff.`,
  (a) => `Där! Foul på ${a} inne i området. Domaren pekar på prickern.`,
  () => `Domaren blåser — olaga hindrande i straffområdet. Straff.`,
  () => `Straff! Målvakten tog spelaren istället för bollen.`,
]

//
// Single source of truth for all match logic. Replaces matchStepByStep.ts and
// serves as the foundation for matchEngine.ts (fast/AI wrapper).
//
// Public API:
//   simulateFirstHalf(input)  → Generator<MatchStep>  steps 0-30
//   simulateSecondHalf(input) → Generator<MatchStep>  steps 31-60 + OT + penalties
//
// mode: 'full'  — commentary + interactions (used by MatchLiveScreen)
// mode: 'fast'  — no commentary, no interaction data (used by matchEngine/roundProcessor)
//
// matchProfile: rolled deterministically from seed at match start. Creates a
// per-match goal distribution (defensive / standard / open / chaotic) so that
// individual matches vary while the seasonal average stays ~10 goals/match.

import type { Player } from '../entities/Player'
import type { MatchEvent } from '../entities/Fixture'
import { MatchEventType, PlayerPosition, PlayerArchetype, WeatherCondition } from '../enums'
import { evaluateSquad } from './squadEvaluator'
import { getTacticModifiers } from './tacticModifiers'
import { mulberry32, fixtureSeed } from '../utils/random'
import { commentary, fillTemplate, pickCommentary, getTraitCommentary } from '../data/matchCommentary'
import { getConditionLabel, getIceQualityLabel } from './weatherService'
import {
  clamp, randRange, weightedPick, pickWeightedPlayer,
  SEQUENCE_TYPES, computeWeatherEffects, computeWeatherTacticInteraction,
  simulatePenalties, pickGoalCommentary, pickWeatherCommentary,
  GOAL_TIMING_BY_PERIOD, SUSP_TIMING_BY_PERIOD, PHASE_CONSTANTS, getTimingPeriod,
} from './matchUtils'
import type { MatchStep, StepByStepInput, SecondHalfInput } from './matchUtils'
import { shouldBeInteractive, buildCornerInteractionData } from './cornerInteractionService'
import type { CornerInteractionData } from './cornerInteractionService'
import { resolveAIPenaltyKeeperDive, resolvePenalty } from './penaltyInteractionService'
import type { PenaltyInteractionData } from './penaltyInteractionService'
import type { CounterInteractionData } from './counterAttackInteractionService'
import type { FreeKickInteractionData } from './freeKickInteractionService'
import type { LastMinutePressData } from './lastMinutePressService'

// ── Match profile ─────────────────────────────────────────────────────────────
// Rolled once per match from seed — creates natural goal distribution across a
// season while keeping the calibrated season average (~10 goals/match).

export type MatchProfile = 'defensive_battle' | 'standard' | 'open_game' | 'chaotic'

// goalMod per profile. The weighted expected value across the default profile
// weights (20/55/20/5) equals 1.0:
//   0.20×0.60 + 0.55×1.00 + 0.20×1.40 + 0.05×1.80 = 1.04 ≈ 1.0
export const PROFILE_GOAL_MODS: Record<MatchProfile, number> = {
  defensive_battle: 0.60,
  standard:         1.00,
  open_game:        1.25,  // was 1.40 — matchCore runs more steps/tick than matchEngine
  chaotic:          1.55,  // was 1.80
}

// Empirisk boost: verklig Elitserie-data visar 54.3% av mål i 2:a halvlek.
// Boost 1.19 ger exakt 54.3% share (1.19/2.19). Var 1.25 → för högt totalt.
const SECOND_HALF_BOOST = 1.19

// Deterministic profile selection from seed — both halves receive the same
// profile without needing to pass state between generators.
export function pickMatchProfileFromSeed(
  seed: number,
  opts: {
    isPlayoff?: boolean
    hasRivalry?: boolean
    isHeavyWeather?: boolean  // HeavySnow or Thaw
    largeCaDiff?: boolean     // CA difference >= 15
  } = {},
): MatchProfile {
  // Cheap hash — keeps the rand sequence unaffected
  const h = (((seed ^ (seed >>> 16)) * 0x45d9f3b) ^ ((seed * 0x9e3779b9) >>> 0)) >>> 0
  const r = (h & 0xffff) / 65535

  let wDefensive = 20
  let wStandard  = 55
  let wOpen      = 20
  let wChaotic   = 5

  if (opts.isHeavyWeather) { wDefensive += 15; wStandard -= 10; wOpen -= 5 }
  if (opts.hasRivalry)     { wChaotic += 10;  wDefensive += 5;  wStandard -= 10; wOpen -= 5 }
  if (opts.isPlayoff)      { wDefensive += 15; wStandard -= 5;  wOpen -= 10 }
  if (opts.largeCaDiff)    { wOpen += 15;     wDefensive -= 10 }

  wDefensive = Math.max(1, wDefensive)
  wStandard  = Math.max(1, wStandard)
  wOpen      = Math.max(1, wOpen)
  wChaotic   = Math.max(1, wChaotic)

  const total = wDefensive + wStandard + wOpen + wChaotic
  if (r * total < wDefensive) return 'defensive_battle'
  if (r * total < wDefensive + wStandard) return 'standard'
  if (r * total < wDefensive + wStandard + wOpen) return 'open_game'
  return 'chaotic'
}

// ── DREAM-004: Seasonal ice hardness modifier ─────────────────────────────────

function getIceHardnessMod(month: number): number {
  if (month === 1) return 1.05
  if (month === 2) return 1.03
  if (month === 12) return 1.0
  if (month === 11) return 0.98
  if (month === 10) return 0.95
  if (month === 3) return 0.97
  return 1.0
}

// ── Input type ────────────────────────────────────────────────────────────────

export interface MatchCoreInput extends StepByStepInput {
  /** 'full': commentary + interactions (MatchLiveScreen). 'fast': events only (matchEngine). */
  mode?: 'full' | 'fast'
}

// ── Match situation helpers ───────────────────────────────────────────────────

type MatchSituation = 'dominating_home' | 'dominating_away' | 'tight' | 'opened_up' | 'neutral'

function getMatchSituation(
  homeShots: number, awayShots: number,
  homeScore: number, awayScore: number,
  step: number,
): MatchSituation {
  const shotDiff = homeShots - awayShots
  const goalTotal = homeScore + awayScore
  if (shotDiff > 4 && step > 10)  return 'dominating_home'
  if (shotDiff < -4 && step > 10) return 'dominating_away'
  if (goalTotal >= 6 && step > 20) return 'opened_up'
  if (goalTotal <= 1 && step > 25) return 'tight'
  return 'neutral'
}

type SecondHalfMode = 'chasing' | 'controlling' | 'even_battle' | 'cruise'

function getSecondHalfMode(
  managedScore: number, opponentScore: number,
  step: number,
  _matchPhase: import('./matchUtils').MatchPhaseContext = 'regular',
): SecondHalfMode {
  const diff = managedScore - opponentScore
  const chasingThreshold = -1
  if (diff <= chasingThreshold) return 'chasing'
  if (diff >= 3)                return 'cruise'
  if (diff >= 1 && step > 45)   return 'controlling'
  return 'even_battle'
}

type RefStyle = 'strict' | 'lenient' | 'inconsistent'

// Sprint 28-B: Pick a legend commentary string and fill template vars.
// eventType: 'goal' | 'assist' | 'gk_save' | 'late_goal'
function pickLegendCommentary(
  player: import('../entities/Player').Player,
  eventType: 'goal' | 'assist' | 'gk_save' | 'late_goal',
  minute: number,
  rand: () => number,
): string {
  const pool =
    eventType === 'assist'   ? commentary.legend_assist   :
    eventType === 'gk_save'  ? commentary.legend_gk_save  :
    eventType === 'late_goal' ? commentary.legend_late     :
    commentary.legend_goal
  const template = pool[Math.floor(rand() * pool.length)]
  return fillTemplate(template, {
    lastName:   player.lastName,
    seasons:    String(player.careerStats?.seasonsPlayed ?? '?'),
    totalGoals: String(player.careerStats?.totalGoals    ?? '?'),
    minute:     String(minute),
  })
}

function pickRefStyle(rand: () => number): RefStyle {
  const r = rand()
  if (r < 0.33) return 'strict'
  if (r < 0.66) return 'lenient'
  return 'inconsistent'
}

// ── Penalty period/scoreline modifiers ───────────────────────────────────────
// Calibrated against SCORELINE_REFERENCE.md §1.3 (bandygrytan 648 penalty goals).
// Periodic distribution: 75-89 min has 22.5% of penalties = 1.35x the average period.

function getPenaltyPeriodMod(minute: number): number {
  if (minute < 15) return 0.55   // 8.8% share
  if (minute < 30) return 0.89   // 14.2%
  if (minute < 45) return 0.90   // 14.4%
  if (minute < 60) return 1.08   // 17.3%
  if (minute < 75) return 0.98   // 15.6%
  if (minute < 90) return 1.35   // 22.5% — late-game peak
  return 0.73                     // 7.3% overtime
}

// Scoreline bias from attacking team's perspective.
// Leading 3.04/kmin, Tied 2.57/kmin, Trailing 2.53/kmin (snitt 2.71).
function getScorelinePenaltyMod(diff: number): number {
  if (diff > 0) return 1.12   // leading — defensive fouls in box most common
  if (diff === 0) return 0.95  // tied
  return 0.93                  // trailing
}

// ── Core generator ────────────────────────────────────────────────────────────
// Internal generator that both simulateFirstHalf and simulateSecondHalf delegate
// to. endStep controls how far the loop runs before yielding fullTime/OT/penalties.

function* simulateMatchCore(
  input: MatchCoreInput,
  startStep: number,
  endStep: number,  // exclusive: loop runs while step < endStep
  emitFullTime: boolean,  // true for second half, false for first half
): Generator<MatchStep> {
  const isFast = input.mode === 'fast'

  const {
    fixture,
    homeLineup,
    awayLineup,
    homePlayers,
    awayPlayers,
    homeAdvantage = 0.14,  // matchEngine calibrated value (was 0.05 in matchStepByStep)
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
  const captainPlayerId    = input.captainPlayerId
  const fanFavoritePlayerId = input.fanFavoritePlayerId
  const supporterCtx       = input.supporterContext
  const iceHardnessMod     = getIceHardnessMod(input.fixtureMonth ?? 1)

  const rand = mulberry32(seed ?? fixtureSeed(fixture.id))

  // Match profile — same result for both halves sharing the same seed
  const hasRivalry     = !!rivalry
  const isHeavyWeather = weather?.condition === WeatherCondition.HeavySnow
    || weather?.condition === WeatherCondition.Thaw
  const homeEvalTemp = evaluateSquad(
    homeLineup.startingPlayerIds.map(id => homePlayers.find(p => p.id === id)).filter((p): p is Player => p !== undefined),
    homeLineup.tactic,
  )
  const awayEvalTemp = evaluateSquad(
    awayLineup.startingPlayerIds.map(id => awayPlayers.find(p => p.id === id)).filter((p): p is Player => p !== undefined),
    awayLineup.tactic,
  )
  const largeCaDiff = Math.abs(homeEvalTemp.offenseScore - awayEvalTemp.offenseScore) >= 15
  const profile = pickMatchProfileFromSeed(seed ?? 0, { isPlayoff, hasRivalry, isHeavyWeather, largeCaDiff })
  const profileGoalMod = PROFILE_GOAL_MODS[profile]

  // Ref style (full mode only)
  const refStyle: RefStyle = isFast ? 'lenient' : (input.refStyle as RefStyle ?? pickRefStyle(rand))

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

  // Tactic modifiers
  const homeMods = getTacticModifiers(homeLineup.tactic)
  const awayMods = getTacticModifiers(awayLineup.tactic)

  // Composite scores (0-1 scale)
  let homeAttack = (homeEval.offenseScore * homeMods.offenseModifier) / 100
  const homeDefense = (homeEval.defenseScore * homeMods.defenseModifier) / 100
  const homeCorner  = (homeEval.cornerScore  * homeMods.cornerModifier)  / 100
  const homeGK      = homeEval.goalkeeperScore / 100
  const homeDisciplineRisk = (homeEval.disciplineRisk * homeMods.disciplineModifier) / 100
  const homeTacticalDiscipline = homeEval.tacticalDiscipline / 100
  const homeCornerRecovery     = homeEval.cornerRecoveryScore / 100

  let awayAttack = (awayEval.offenseScore * awayMods.offenseModifier) / 100
  const awayDefense = (awayEval.defenseScore * awayMods.defenseModifier) / 100
  const awayCorner  = (awayEval.cornerScore  * awayMods.cornerModifier)  / 100
  const awayGK      = awayEval.goalkeeperScore / 100
  const awayDisciplineRisk = (awayEval.disciplineRisk * awayMods.disciplineModifier) / 100
  const awayTacticalDiscipline = awayEval.tacticalDiscipline / 100
  const awayCornerRecovery     = awayEval.cornerRecoveryScore / 100

  // Weather modifiers
  let weatherGoalMod = 1.0
  if (weather?.condition !== undefined) {
    const { ballControlPenalty, speedModifier, goalChanceModifier } = computeWeatherEffects(weather)
    const homeTW = computeWeatherTacticInteraction(weather, homeLineup.tactic)
    const awayTW = computeWeatherTacticInteraction(weather, awayLineup.tactic)
    homeAttack *= (1 - (ballControlPenalty + homeTW.extraBallControlPenalty) / 200) * speedModifier
    awayAttack *= (1 - (ballControlPenalty + awayTW.extraBallControlPenalty) / 200) * speedModifier
    weatherGoalMod = goalChanceModifier
  }

  // Playoff intensity
  if (isPlayoff) {
    const diff = (homeAttack - awayAttack) * 0.1
    homeAttack = clamp(homeAttack + diff, 0, 1)
    awayAttack = clamp(awayAttack - diff, 0, 1)
  }

  // Derby modifiers
  let derbyFoulMult  = 1.0
  let derbyChanceMult = 0.0
  let effectiveHomeAdvantage = fixture.isNeutralVenue ? 0 : homeAdvantage + phaseConst.homeAdvDelta
  if (!fixture.isNeutralVenue && fanMood !== undefined && managedIsHome) {
    effectiveHomeAdvantage *= 1 + ((fanMood - 50) / 100) * 0.06
  }
  if (rivalry) {
    const avg = (homeAttack + awayAttack) / 2
    homeAttack = avg + (homeAttack - avg) * 0.7
    awayAttack = avg + (awayAttack - avg) * 0.7
    derbyFoulMult   = 1 + rivalry.intensity * 0.15
    derbyChanceMult = 0.05
    if (!fixture.isNeutralVenue) {
      effectiveHomeAdvantage = (homeAdvantage + phaseConst.homeAdvDelta) * (1 + rivalry.intensity * 0.1)
    }
  }

  // Opening weather note (full mode)
  let openingWeatherNote: string | undefined
  if (!isFast && weather) {
    const tempStr = `${weather.temperature > 0 ? '+' : ''}${weather.temperature}°`
    openingWeatherNote = `${tempStr} i ${weather.region}. ${getConditionLabel(weather.condition)}. ${getIceQualityLabel(weather.iceQuality)}.`
  }

  const canScore = (attackingHome: boolean, hs: number, as_: number): boolean => {
    if (hs + as_ >= MATCH_TOTAL_GOAL_CAP) return false
    const newDiff = attackingHome ? hs + 1 - as_ : as_ + 1 - hs
    return Math.abs(newDiff) <= MATCH_GOAL_DIFFERENCE_CAP
  }

  // Match state — seeded from SecondHalfInput if provided
  let homeScore = input.initialHomeScore ?? 0
  let awayScore = input.initialAwayScore ?? 0

  // Suspension tracking
  let homeActiveSuspensions = input.initialHomeSuspensions ?? 0
  let awayActiveSuspensions = input.initialAwaySuspensions ?? 0
  const homeSuspensionTimers: number[] = []
  const awaySuspensionTimers: number[] = []

  // Counters
  let shotsHome   = input.initialShotsHome   ?? 0
  let shotsAway   = input.initialShotsAway   ?? 0
  let onTargetHome = 0
  let onTargetAway = 0
  let cornersHome = input.initialCornersHome ?? 0
  let cornersAway = input.initialCornersAway ?? 0
  let interactiveCornersUsed  = 0
  let interactiveCountersUsed = 0
  let interactiveFreeKicksUsed = 0
  let lastMinutePressTriggered = false

  // Momentum tracking (full mode only)
  const recentHomeShots: number[] = []
  const recentAwayShots: number[] = []
  let prevMomentumDiff = 0
  let situationalInterval = randRange(rand, 8, 12) | 0

  // Player stat tracking (for ratings post-match, needed by matchEngine wrapper)
  const playerGoals:    Record<string, number> = {}
  const playerAssists:  Record<string, number> = {}
  const playerRedCards: Record<string, number> = {}
  const playerSaves:    Record<string, number> = {}

  // All events accumulated for fixture report
  const allEvents: MatchEvent[] = []

  const allPlayers = [...homePlayers, ...awayPlayers]

  function findPlayerName(playerId: string): string {
    const p = allPlayers.find(pl => pl.id === playerId)
    return p ? `${p.firstName} ${p.lastName}` : playerId
  }

  function trackGoal(id: string)   { playerGoals[id]    = (playerGoals[id]    ?? 0) + 1 }
  function trackAssist(id: string) { playerAssists[id]  = (playerAssists[id]  ?? 0) + 1 }
  function trackRed(id: string)    { playerRedCards[id] = (playerRedCards[id] ?? 0) + 1 }
  function trackSave(id: string)   { playerSaves[id]    = (playerSaves[id]    ?? 0) + 1 }

  function getGoalScorer(starters: Player[]): Player | undefined {
    const nonGK = starters.filter(p => p.position !== PlayerPosition.Goalkeeper)
    if (nonGK.length === 0) return undefined
    const weights = nonGK.map(p => {
      let w = p.position === PlayerPosition.Forward   ? 3
            : p.position === PlayerPosition.Midfielder ? 2
            : p.position === PlayerPosition.Half       ? 1
            : 0.5
      if (p.isCharacterPlayer) {
        if      (p.trait === 'hungrig') w *= 1.4
        else if (p.trait === 'veteran') w *= 1.2
        else if (p.trait === 'lokal')   w *= 1.2
        else if (p.trait === 'ledare')  w *= 1.1
        else if (p.trait === 'joker')   w *= rand() < 0.3 ? 2.8 : 0.6
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
      if (p.position === PlayerPosition.Half)       return 2
      if (p.position === PlayerPosition.Defender)   return 1
      return 1.5
    })
    return pickWeightedPlayer(rand, nonGK, weights)
  }

  function getGK(starters: Player[]): Player | undefined {
    return starters.find(p => p.position === PlayerPosition.Goalkeeper)
  }

  // Profile-weighted foul selection (scoreline-driven, from matchStepByStep)
  function getDefendingPlayer(
    starters: Player[],
    attackScore: number,
    defendScore: number,
  ): Player | undefined {
    const nonGK = starters.filter(p => p.position !== PlayerPosition.Goalkeeper)
    if (nonGK.length === 0) return undefined
    const margin  = Math.abs(attackScore - defendScore)
    const isClose   = margin <= 1
    const isDecided = margin > 2
    const weights = nonGK.map(p => {
      switch (p.suspensionProfile) {
        case 'situation':  return isClose ? 2.2 : 0.8
        case 'intensitet': return isDecided ? 0.2 : isClose ? 3.0 : 1.0
        case 'volym':      return 1.6
        case 'ren':        return 0.45
        default:           return 1.0
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
    const mods   = isHome ? homeMods          : awayMods

    let wAttack       = 40
    let wTransition   = 15
    let wCorner       = 40  // calibrated: 8.83 corners/team/match
    let wHalfchance   = 10
    let wFoul         = 24  // Sprint 25b.2: doubled for suspension calibration (was 12)
    let wLostball     = 8
    let wTacticalShift = 4
    let wPlayerDuel   = 6
    let wAtmosphere   = 5
    let wOffside      = 4
    let wFreekick     = 5

    if (tactic.tempo === 'high')   { wAttack += 5; wCorner += 3; wFoul += 2 }
    else if (tactic.tempo === 'low') { wAttack -= 5; wLostball += 5 }
    if (tactic.press === 'high')   { wFoul += 5; wTransition += 3 }
    if (tactic.width === 'wide')   { wCorner += 5 }
    if (tactic.cornerStrategy === 'aggressive') { wCorner += 3 }
    if (tactic.passingRisk === 'direct') { wLostball += 5; wAttack += 3; wHalfchance -= 3 }
    if (tactic.mentality === 'offensive') { wAttack += 5; wHalfchance += 3 }

    if (step < 5 || step > 55)  wAtmosphere   += 4
    if (step >= 30 && step <= 35) wTacticalShift += 3
    if (situation === 'tight')  wPlayerDuel   += 4
    if (step >= 30)             wOffside      += 2

    void mods  // used via tactic above

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

  const homeTeamRef = homeClubName ?? fixture.homeClubId
  const awayTeamRef = awayClubName ?? fixture.awayClubId

  // ── Penalty trigger helper ────────────────────────────────────────────────────
  // Reusable closure for all penalty trigger sites (attack, corner, etc).
  // For interactive penalties (managed team), returns penaltyInteractionData without
  // scoring — MatchLiveScreen resolves the outcome. For AI, auto-resolves immediately.
  function resolvePenaltyTrigger(
    attackingStarters: Player[],
    defendingStarters: Player[],
    isHomeAttacking: boolean,
    minute: number,
    attackingClubId: string,
    curHomeScore: number,
    curAwayScore: number,
  ): {
    goalScored: boolean
    scorerPlayerId: string | undefined
    penaltyInteractionData: PenaltyInteractionData | undefined
    penaltyCauseText: string
    events: MatchEvent[]
  } {
    const events: MatchEvent[] = []
    const isManagedAttacking = managedIsHome !== undefined ? (managedIsHome === isHomeAttacking) : false
    const shooter = getGoalScorer(attackingStarters)
    const gk      = getGK(defendingStarters)
    if (!shooter || !gk) {
      return { goalScored: false, scorerPlayerId: undefined, penaltyInteractionData: undefined, penaltyCauseText: '', events }
    }
    const penEvent: MatchEvent = { minute, type: MatchEventType.Penalty, clubId: attackingClubId, description: 'Straff' }
    events.push(penEvent)
    if (!isFast && isManagedAttacking) {
      // Interactive — MatchLiveScreen resolves outcome, no goal scored yet
      const causeIdx = Math.floor(rand() * PENALTY_CAUSE_COMMENTARY.length)
      const causeText = PENALTY_CAUSE_COMMENTARY[causeIdx](`${shooter.firstName} ${shooter.lastName}`)
      return {
        goalScored: false,
        scorerPlayerId: undefined,
        penaltyInteractionData: {
          minute,
          shooterName:  `${shooter.firstName} ${shooter.lastName}`,
          shooterId:    shooter.id,
          shooterSkill: shooter.currentAbility,
          keeperName:   `${gk.firstName} ${gk.lastName}`,
          keeperSkill:  gk.currentAbility,
        },
        penaltyCauseText: causeText,
        events,
      }
    }
    // AI auto-resolve
    const mentality  = isHomeAttacking ? homeLineup.tactic.mentality : awayLineup.tactic.mentality
    const keeperDive = resolveAIPenaltyKeeperDive(mentality ?? 'offensive', rand)
    const aiDir      = rand() < 0.4 ? 'left' : rand() < 0.7 ? 'right' : 'center'
    const aiHeight   = rand() < 0.65 ? 'low' : 'high'
    const penData: PenaltyInteractionData = {
      minute,
      shooterName:  `${shooter.firstName} ${shooter.lastName}`,
      shooterId:    shooter.id,
      shooterSkill: shooter.currentAbility,
      keeperName:   `${gk.firstName} ${gk.lastName}`,
      keeperSkill:  gk.currentAbility,
    }
    const outcome = resolvePenalty(penData, aiDir as 'left' | 'center' | 'right', aiHeight as 'low' | 'high', keeperDive, rand)
    if (outcome.type === 'goal' && canScore(isHomeAttacking, curHomeScore, curAwayScore)) {
      trackGoal(shooter.id)
      const ge: MatchEvent = {
        minute, type: MatchEventType.Goal, clubId: attackingClubId,
        playerId: shooter.id,
        description: `Straffmål av ${shooter.firstName} ${shooter.lastName}`,
        isPenaltyGoal: true,
      }
      events.push(ge)
      return { goalScored: true, scorerPlayerId: shooter.id, penaltyInteractionData: undefined, penaltyCauseText: '', events }
    }
    return { goalScored: false, scorerPlayerId: undefined, penaltyInteractionData: undefined, penaltyCauseText: '', events }
  }

  // ── Main loop ───────────────────────────────────────────────────────────────

  for (let step = startStep; step < endStep; step++) {
    const minute = Math.round(step * 1.5)
    const stepEvents: MatchEvent[] = []

    // Substitution commentary at second-half start (step 31, full mode)
    if (!isFast && step === 31 && input.substitutions?.length) {
      const managedClubId = managedIsHome ? fixture.homeClubId : fixture.awayClubId
      for (const sub of input.substitutions) {
        const inName  = findPlayerName(sub.inId)
        const outName = findPlayerName(sub.outId)
        stepEvents.push({
          type:              MatchEventType.Substitution,
          clubId:            managedClubId,
          playerId:          sub.inId,
          secondaryPlayerId: sub.outId,
          minute:            45,
          description:       `🔄 ${inName} IN för ${outName}`,
        })
      }
    }

    // Ice degrades in second half (full mode physics; keep in fast mode too for accuracy)
    const period = getTimingPeriod(minute)
    let stepGoalMod = weatherGoalMod * phaseConst.goalMod * GOAL_TIMING_BY_PERIOD[period]
    if (weather && step > 30) {
      const base       = 0.03
      const snowExtra  = weather.condition === WeatherCondition.HeavySnow ? 0.02 : 0
      const thawExtra  = weather.condition === WeatherCondition.Thaw ? 0.03 : 0
      const iceDeg     = base + snowExtra + thawExtra
      const penalty    = iceDeg * (step - 30) * 0.5
      stepGoalMod = Math.max(0.60, stepGoalMod - penalty / 100)
    }

    // Apply match profile multiplier
    stepGoalMod *= profileGoalMod

    // DREAM-004: seasonal ice hardness
    stepGoalMod *= iceHardnessMod

    // Per-lag mode i 2:a halvlek — kör alltid, oberoende av managed-status.
    // Mode appliceras separat på varje lags attack (nedan) och på foul-threshold.
    let homeModeAttackMult = 1.0
    let awayModeAttackMult = 1.0
    let homeModeFoulMult   = 1.0
    let awayModeFoulMult   = 1.0

    if (step >= 30) {
      const homeMode = getSecondHalfMode(homeScore, awayScore, step, matchPhase)
      const awayMode = getSecondHalfMode(awayScore, homeScore, step, matchPhase)

      const applyMode = (mode: SecondHalfMode, td: number): { attack: number; foul: number } => {
        if (mode === 'chasing')     return { attack: 1.22, foul: 1.25 }
        if (mode === 'controlling') return { attack: 0.88, foul: 1.0 + (1.0 - td) * 0.25 }
        if (mode === 'even_battle') return { attack: step >= 50 ? 1.04 : 1.0, foul: 1.10 }
        // cruise
        return { attack: 0.92, foul: 1.0 }
      }

      const homeModeFx = applyMode(homeMode, homeTacticalDiscipline)
      const awayModeFx = applyMode(awayMode, awayTacticalDiscipline)

      homeModeAttackMult = homeModeFx.attack
      awayModeAttackMult = awayModeFx.attack
      homeModeFoulMult   = homeModeFx.foul
      awayModeFoulMult   = awayModeFx.foul
    }

    // Global second-half boost — only in second half (emitFullTime = true), not overtime
    if (emitFullTime) stepGoalMod *= SECOND_HALF_BOOST

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
    const homePenaltyFactor   = homeActiveSuspensions > 0 ? 0.65 : 1.0
    const awayPenaltyFactor   = awayActiveSuspensions > 0 ? 0.65 : 1.0
    const homePowerplayBoost  = awayActiveSuspensions > 0 ? 1.20 : 1.0
    const awayPowerplayBoost  = homeActiveSuspensions > 0 ? 1.20 : 1.0

    // Trailing boost / leading brake in second half (Sprint 25f)
    const trailingBoost = (diff: number) => diff < 0 ? Math.min(-diff, 3) * 0.16 : 0
    const leadingBrake  = (diff: number) => diff > 0 ? Math.min(diff, 3) * 0.12 : 0
    const homeTrailBoost = trailingBoost(homeScore - awayScore)
    const awayTrailBoost = trailingBoost(awayScore - homeScore)
    const homeLeadBrake  = leadingBrake(homeScore - awayScore)
    const awayLeadBrake  = leadingBrake(awayScore - homeScore)
    const effectiveHomeAttack = step >= 30
      ? clamp(homeAttack * (1 + homeTrailBoost) * (1 - homeLeadBrake) * homeModeAttackMult, 0, 1)
      : homeAttack
    const effectiveAwayAttack = step >= 30
      ? clamp(awayAttack * (1 + awayTrailBoost) * (1 - awayLeadBrake) * awayModeAttackMult, 0, 1)
      : awayAttack

    const homeWeight = effectiveHomeAttack * (1 + homeMods.pressModifier * 0.2) * (1 + effectiveHomeAdvantage) * homePenaltyFactor * homePowerplayBoost
    const awayWeight = effectiveAwayAttack * (1 + awayMods.pressModifier * 0.2) * awayPenaltyFactor * awayPowerplayBoost

    const homeInitiative  = homeWeight / (homeWeight + awayWeight)
    const isHomeAttacking = rand() < homeInitiative

    const attackingStarters = isHomeAttacking ? homeStarters : awayStarters
    const defendingStarters = isHomeAttacking ? awayStarters : homeStarters
    const attackingClubId   = isHomeAttacking ? fixture.homeClubId : fixture.awayClubId
    const defendingClubId   = isHomeAttacking ? fixture.awayClubId : fixture.homeClubId

    const attAttack      = isHomeAttacking ? homeAttack : awayAttack
    const defDefense     = isHomeAttacking ? awayDefense : homeDefense
    const defGK          = isHomeAttacking ? awayGK  : homeGK
    const attCorner      = isHomeAttacking ? homeCorner : awayCorner
    const attDiscipline  = isHomeAttacking ? homeDisciplineRisk : awayDisciplineRisk
    const defDiscipline  = isHomeAttacking ? awayDisciplineRisk : homeDisciplineRisk

    const isOpeningStep = step <= 1

    // Match situation (used by sequence weights and commentary)
    const situation = getMatchSituation(shotsHome, shotsAway, homeScore, awayScore, step)

    // Pick sequence type
    const seqWeights = buildSequenceWeights(isHomeAttacking, step, situation)
    const seqIdx     = weightedPick(rand, seqWeights)
    const seqType    = isOpeningStep ? 'neutral' : SEQUENCE_TYPES[seqIdx]

    // Event flags
    let goalScored        = false
    let cornerGoalScored  = false
    let saveOccurred      = false
    let suspensionOccurred = false
    let cornerOccurred    = false
    let wasSituationalStep = false  // true only when a situational line was actually injected
    let scorerPlayerId:    string | undefined
    let assisterPlayerId:  string | undefined
    let gkPlayerId:        string | undefined
    let suspendedPlayerId: string | undefined

    // Interaction data (full mode only)
    let cornerInteractionData:   CornerInteractionData   | undefined
    let penaltyInteractionData:  PenaltyInteractionData  | undefined
    let counterInteractionData:  CounterInteractionData  | undefined
    let freeKickInteractionData: FreeKickInteractionData | undefined
    let lastMinutePressData:     LastMinutePressData      | undefined
    let penaltyCauseText = ''

    // ── Sequence resolution ──────────────────────────────────────────────────

    if (seqType === 'attack') {
      const base         = attAttack * 0.6 - defDefense * 0.4 + randRange(rand, -0.2, 0.2)
      const chanceQuality = clamp(base * 1.2 + 0.15 + 0.15 + derbyChanceMult, 0.05, 0.95)

      // Standalone penalty trigger — fires before shot resolution for high-quality chances.
      // Base 0.19 calibrated for ~5.4% penaltyGoalPct (finding:047 — 0.13 gav 3.6%, skalat 1.46x).
      // Spec sanity check assumed 150 steps; engine runs 60 → 10x correction over spec's 0.012.
      // Period and scoreline mods applied per bandygrytan distribution.
      // Flag skips normal shot resolution for this step (penalty replaces shot).
      let penaltyFiredThisStep = false
      if (chanceQuality > 0.40) {
        const scoreDiff = isHomeAttacking ? homeScore - awayScore : awayScore - homeScore
        const penProb = 0.19 * GOAL_RATE_MOD * getPenaltyPeriodMod(minute) * getScorelinePenaltyMod(scoreDiff)
        if (rand() < penProb) {
          const result = resolvePenaltyTrigger(attackingStarters, defendingStarters, isHomeAttacking, minute, attackingClubId, homeScore, awayScore)
          for (const ev of result.events) { stepEvents.push(ev); allEvents.push(ev) }
          if (result.goalScored) {
            if (isHomeAttacking) { homeScore++ } else { awayScore++ }
            scorerPlayerId = result.scorerPlayerId
            goalScored = true
          }
          if (result.penaltyInteractionData) penaltyInteractionData = result.penaltyInteractionData
          if (result.penaltyCauseText) penaltyCauseText = result.penaltyCauseText
          penaltyFiredThisStep = true
        }
      }

      if (!penaltyFiredThisStep && chanceQuality > 0.10) {
        if (isHomeAttacking) { shotsHome++ } else { shotsAway++ }

        const shotResult   = rand()
        // matchEngine-calibrated multiplier (1.05). GOAL_RATE_MOD kompenserar för cap-höjning.
        const goalThreshold = chanceQuality * 1.05 * GOAL_RATE_MOD * (1 - defGK * 0.35) * stepGoalMod

        if (shotResult < goalThreshold && canScore(isHomeAttacking, homeScore, awayScore)) {
          if (isHomeAttacking) { onTargetHome++ } else { onTargetAway++ }
          const scorer  = getGoalScorer(attackingStarters)
          const assister = getAssistProvider(attackingStarters, scorer?.id)
          if (scorer) {
            if (isHomeAttacking) { homeScore++ } else { awayScore++ }
            scorerPlayerId = scorer.id
            goalScored = true
            trackGoal(scorer.id)
            const ev: MatchEvent = { minute, type: MatchEventType.Goal, clubId: attackingClubId, playerId: scorer.id, secondaryPlayerId: assister?.id, description: `Mål av ${scorer.firstName} ${scorer.lastName}` }
            stepEvents.push(ev); allEvents.push(ev)
            if (assister) {
              assisterPlayerId = assister.id
              trackAssist(assister.id)
              const ae: MatchEvent = { minute, type: MatchEventType.Assist, clubId: attackingClubId, playerId: assister.id, secondaryPlayerId: scorer.id, description: `Assist av ${assister.firstName} ${assister.lastName}` }
              stepEvents.push(ae); allEvents.push(ae)
            }
          }
        } else if (shotResult < goalThreshold + 0.25) {
          if (isHomeAttacking) { onTargetHome++ } else { onTargetAway++ }
          const gk = getGK(defendingStarters)
          if (gk) {
            gkPlayerId = gk.id
            saveOccurred = true
            trackSave(gk.id)
            const ev: MatchEvent = { minute, type: MatchEventType.Save, clubId: defendingClubId, playerId: gk.id, description: `Räddning av ${gk.firstName} ${gk.lastName}` }
            stepEvents.push(ev); allEvents.push(ev)
          }
        } else if (shotResult < goalThreshold + 0.45) {
          cornerOccurred = true
          if (isHomeAttacking) { cornersHome++ } else { cornersAway++ }
          const ev: MatchEvent = { minute, type: MatchEventType.Corner, clubId: attackingClubId, description: 'Hörnslag' }
          stepEvents.push(ev); allEvents.push(ev)
        }
      }
    } else if (seqType === 'transition') {
      // Counter-attack interaction (full mode, managed team attacking, max 2/match)
      if (!isFast) {
        const isManagedTransition = managedIsHome !== undefined && (managedIsHome === isHomeAttacking)
        if (isManagedTransition && interactiveCountersUsed < 2 && rand() < 0.20) {
          const runner  = attackingStarters.filter(p => p.position !== PlayerPosition.Goalkeeper).sort((a, b) => b.attributes.skating - a.attributes.skating)[0]
          const support = attackingStarters.filter(p => p.position !== PlayerPosition.Goalkeeper && p.id !== runner?.id).sort((a, b) => b.attributes.passing - a.attributes.passing)[0]
          if (runner && support) {
            interactiveCountersUsed++
            counterInteractionData = {
              minute,
              runnerName:    `${runner.firstName} ${runner.lastName}`,
              runnerId:      runner.id,
              runnerSpeed:   runner.attributes.skating,
              supportName:   `${support.firstName} ${support.lastName}`,
              supportId:     support.id,
              defendersBeat: (1 + Math.floor(rand() * 3)) as 1 | 2 | 3,
            }
          }
        }
      }

      const chanceQuality = randRange(rand, 0.3, 0.7)
      if (chanceQuality > 0.05) {
        if (isHomeAttacking) { shotsHome++ } else { shotsAway++ }
        const shotResult   = rand()
        // matchEngine-calibrated (0.58, was 0.28)
        const goalThreshold = chanceQuality * 0.58 * GOAL_RATE_MOD * (1 - defGK * 0.4) * 1.15 * stepGoalMod

        if (shotResult < goalThreshold && canScore(isHomeAttacking, homeScore, awayScore)) {
          if (isHomeAttacking) { onTargetHome++ } else { onTargetAway++ }
          const scorer   = getGoalScorer(attackingStarters)
          const assister = getAssistProvider(attackingStarters, scorer?.id)
          if (scorer) {
            if (isHomeAttacking) { homeScore++ } else { awayScore++ }
            scorerPlayerId = scorer.id
            goalScored = true
            trackGoal(scorer.id)
            const ev: MatchEvent = { minute, type: MatchEventType.Goal, clubId: attackingClubId, playerId: scorer.id, secondaryPlayerId: assister?.id, description: `Omställningsmål av ${scorer.firstName} ${scorer.lastName}` }
            stepEvents.push(ev); allEvents.push(ev)
            if (assister) {
              assisterPlayerId = assister.id
              trackAssist(assister.id)
              const ae: MatchEvent = { minute, type: MatchEventType.Assist, clubId: attackingClubId, playerId: assister.id, secondaryPlayerId: scorer.id, description: `Assist av ${assister.firstName} ${assister.lastName}` }
              stepEvents.push(ae); allEvents.push(ae)
            }
          }
        } else if (shotResult < goalThreshold + 0.25) {
          if (isHomeAttacking) { onTargetHome++ } else { onTargetAway++ }
          const gk = getGK(defendingStarters)
          if (gk) {
            gkPlayerId = gk.id
            saveOccurred = true
            trackSave(gk.id)
            const ev: MatchEvent = { minute, type: MatchEventType.Save, clubId: defendingClubId, playerId: gk.id, description: `Räddning av ${gk.firstName} ${gk.lastName}` }
            stepEvents.push(ev); allEvents.push(ev)
          }
        }
      }
    } else if (seqType === 'corner') {
      if (isHomeAttacking) { cornersHome++ } else { cornersAway++ }

      // Interactive corner (full mode, managed club only)
      if (!isFast) {
        const isManagedCorner = managedIsHome !== undefined ? (managedIsHome === isHomeAttacking) : false
        const totalCornersThisMatch = cornersHome + cornersAway
        if (isManagedCorner && shouldBeInteractive(minute, homeScore, awayScore, true, totalCornersThisMatch, interactiveCornersUsed, rand)) {
          interactiveCornersUsed++
          const gk         = getGK(defendingStarters)
          const cornerTaker = attackingStarters.filter(p => p.position !== PlayerPosition.Goalkeeper).sort((a, b) => b.attributes.cornerSkill - a.attributes.cornerSkill)[0]
          if (cornerTaker) {
            const sgMood = (input as MatchCoreInput & { supporterMood?: number }).supporterMood ?? 50
            cornerInteractionData = buildCornerInteractionData(
              cornerTaker, attackingStarters, defendingStarters,
              isHomeAttacking, sgMood, minute, homeScore, awayScore,
            )
            cornerOccurred = true
            const ev: MatchEvent = { minute, type: MatchEventType.Corner, clubId: attackingClubId, description: 'Hörna' }
            stepEvents.push(ev); allEvents.push(ev)
            void gk
          }
        }
      }

      if (!cornerInteractionData) {
        const cornerSpecialist = attackingStarters.find(p => p.archetype === PlayerArchetype.CornerSpecialist)
        const specialistBonus  = cornerSpecialist ? (cornerSpecialist.attributes.cornerSkill > 75 ? 0.25 : 0.15) : 0
        const attackingScore   = isHomeAttacking ? homeScore : awayScore
        const defendingScore   = isHomeAttacking ? awayScore : homeScore
        const cornerStateMod   = attackingScore < defendingScore ? phaseConst.cornerTrailingMod
                               : attackingScore > defendingScore ? phaseConst.cornerLeadingMod
                               : 1.0
        const cornerChance  = attCorner * 0.7 + randRange(rand, 0, 0.3) + specialistBonus
        const defenseResist = defDefense * 0.5 + defGK * 0.3 + randRange(rand, 0, 0.2)
        // matchEngine-calibrated (base +0.105, clamp 0.07-0.30 — was +0.14, clamp 0.10-0.30)
        // Both base and clamp scale with SECOND_HALF_BOOST so corner share stays proportional.
        // phaseConst.goalMod applied to cornerBase and clamp floor so cornerGoalPct scales
        // with regular goals across phases without double-counting SECOND_HALF_BOOST (Sprint 25e).
        // Base reduced 0.14→0.105 to bring grundserie cornerGoalPct toward target 22.2% (Sprint 25e.2).
        const phaseGoalMod   = phaseConst.goalMod
        const phaseCornerMod = phaseConst.cornerGoalMod
        const cornerBase     = emitFullTime ? 0.105 * SECOND_HALF_BOOST * phaseGoalMod * phaseCornerMod : 0.105 * phaseGoalMod * phaseCornerMod
        const cornerClampMax = emitFullTime ? 0.30 * SECOND_HALF_BOOST : 0.30
        const cornerClampMin = emitFullTime ? 0.07 * SECOND_HALF_BOOST * phaseGoalMod * phaseCornerMod : 0.07 * phaseGoalMod * phaseCornerMod
        const goalThreshold = clamp(
          (cornerChance - defenseResist) * 0.30 * stepGoalMod * cornerStateMod + cornerBase,
          cornerClampMin,
          cornerClampMax,
        ) * GOAL_RATE_MOD

        const r = rand()
        if (r < goalThreshold && canScore(isHomeAttacking, homeScore, awayScore)) {
          const scorer   = getGoalScorer(attackingStarters)
          const assister = getAssistProvider(attackingStarters, scorer?.id)
          if (scorer) {
            if (isHomeAttacking) { homeScore++ } else { awayScore++ }
            scorerPlayerId    = scorer.id
            goalScored        = true
            cornerGoalScored  = true
            cornerOccurred    = true
            const ce: MatchEvent = { minute, type: MatchEventType.Corner, clubId: attackingClubId, description: 'Hörnmål' }
            stepEvents.push(ce); allEvents.push(ce)
            trackGoal(scorer.id)
            const ev: MatchEvent = { minute, type: MatchEventType.Goal, clubId: attackingClubId, playerId: scorer.id, secondaryPlayerId: assister?.id, description: `Hörnmål av ${scorer.firstName} ${scorer.lastName}`, isCornerGoal: true }
            stepEvents.push(ev); allEvents.push(ev)
            if (assister) {
              assisterPlayerId = assister.id
              trackAssist(assister.id)
              const ae: MatchEvent = { minute, type: MatchEventType.Assist, clubId: attackingClubId, playerId: assister.id, secondaryPlayerId: scorer.id, description: `Hörnassist av ${assister.firstName} ${assister.lastName}` }
              stepEvents.push(ae); allEvents.push(ae)
            }
          }
        } else if (r < goalThreshold + 0.3) {
          cornerOccurred = true
          const ev: MatchEvent = { minute, type: MatchEventType.Corner, clubId: attackingClubId, description: 'Hörnslag' }
          stepEvents.push(ev); allEvents.push(ev)

          // Post-corner counter (low cornerRecovery = vulnerability)
          const cornerAttackerRecovery = isHomeAttacking ? homeCornerRecovery : awayCornerRecovery
          const counterChance = (1.0 - cornerAttackerRecovery) * 0.09
          if (counterChance > 0.01 && rand() < counterChance && canScore(!isHomeAttacking, homeScore, awayScore)) {
            const counterScorer  = getGoalScorer(defendingStarters)
            if (counterScorer) {
              if (isHomeAttacking) { awayScore++ } else { homeScore++ }
              const counterClubId = isHomeAttacking ? fixture.awayClubId : fixture.homeClubId
              scorerPlayerId = counterScorer.id
              goalScored = true
              trackGoal(counterScorer.id)
              // WEAK-005: narrative commentary when slow defender exposed on counter
              const attackingDefenders = attackingStarters.filter(p =>
                p.position === PlayerPosition.Defender || p.position === PlayerPosition.Half
              )
              const slowestRecovery = attackingDefenders.length > 0
                ? Math.min(...attackingDefenders.map(p => p.attributes.cornerRecovery ?? 50))
                : 100
              let counterDesc = `Kontring av ${counterScorer.firstName} ${counterScorer.lastName}`
              if (slowestRecovery < 50 && attackingDefenders.length > 0) {
                const slowest = attackingDefenders.find(p => (p.attributes.cornerRecovery ?? 50) === slowestRecovery)
                if (slowest) counterDesc = `${slowest.lastName} hinner inte tillbaka! Kontring av ${counterScorer.firstName} ${counterScorer.lastName}`
              }
              const cg: MatchEvent = { minute, type: MatchEventType.Goal, clubId: counterClubId, playerId: counterScorer.id, description: counterDesc }
              stepEvents.push(cg); allEvents.push(cg)
            }
          }
        }
      }
    } else if (seqType === 'halfchance') {
      if (isHomeAttacking) { shotsHome++ } else { shotsAway++ }
      const halfchancePlayoffBonus = isPlayoff ? 1.05 : 1.0
      const chanceQuality  = randRange(rand, 0.05, 0.25) * halfchancePlayoffBonus
      // matchEngine-calibrated (0.63, was 0.30)
      const goalThreshold  = chanceQuality * 0.63 * GOAL_RATE_MOD * stepGoalMod
      const shotResult     = rand()

      if (shotResult < goalThreshold && canScore(isHomeAttacking, homeScore, awayScore)) {
        if (isHomeAttacking) { onTargetHome++ } else { onTargetAway++ }
        const scorer = getGoalScorer(attackingStarters)
        if (scorer) {
          if (isHomeAttacking) { homeScore++ } else { awayScore++ }
          scorerPlayerId = scorer.id
          goalScored = true
          trackGoal(scorer.id)
          const ev: MatchEvent = { minute, type: MatchEventType.Goal, clubId: attackingClubId, playerId: scorer.id, description: `Halvchans av ${scorer.firstName} ${scorer.lastName}` }
          stepEvents.push(ev); allEvents.push(ev)
        }
      } else if (shotResult < goalThreshold + 0.45) {
        // On target — GK makes the save (~45% of non-scoring halfchances hit the target)
        if (isHomeAttacking) { onTargetHome++ } else { onTargetAway++ }
        const gk = getGK(defendingStarters)
        if (gk) {
          gkPlayerId = gk.id
          saveOccurred = true
          trackSave(gk.id)
          const ev: MatchEvent = { minute, type: MatchEventType.Save, clubId: defendingClubId, playerId: gk.id, description: `Räddning av ${gk.firstName} ${gk.lastName}` }
          stepEvents.push(ev); allEvents.push(ev)
        }
      }
    } else if (seqType === 'foul') {
      const foulProb = attDiscipline * 0.4 + defDiscipline * 0.3
      const r        = rand()
      const activeFoulMult = isHomeAttacking ? homeModeFoulMult : awayModeFoulMult
      const foulThreshold = foulProb * 1.46 * phaseConst.suspMod * SUSP_TIMING_BY_PERIOD[period] * derbyFoulMult * activeFoulMult  // Sprint 25b.2.2: was 1.25 (0.55 pre-25b.2)

      if (r < foulThreshold) {
        const isAttackZoneFoul = rand() < 0.70

        // Free kick interaction (full mode, managed attacking, max 1/match)
        if (!isFast && isAttackZoneFoul && interactiveFreeKicksUsed < 1 && rand() < 0.15) {
          const isManagedAttacking = managedIsHome !== undefined ? (managedIsHome === isHomeAttacking) : false
          if (isManagedAttacking) {
            const kicker = attackingStarters.filter(p => p.position !== PlayerPosition.Goalkeeper).sort((a, b) => (b.attributes.shooting + b.attributes.passing) - (a.attributes.shooting + a.attributes.passing))[0]
            if (kicker) {
              interactiveFreeKicksUsed++
              freeKickInteractionData = {
                minute,
                kickerName:     `${kicker.firstName} ${kicker.lastName}`,
                kickerId:       kicker.id,
                kickerShooting: kicker.attributes.shooting,
                kickerPassing:  kicker.attributes.passing,
                distanceMeters: 20 + Math.round(rand() * 8),
                wallSize:       3  + Math.round(rand() * 2),
              }
            }
          }
        }

        // All fouls in foul sequences become suspensions — penalties handled separately in attack sequences
        const attackScore  = isHomeAttacking ? homeScore : awayScore
        const defendScore  = isHomeAttacking ? awayScore : homeScore
        const suspPlayer   = getDefendingPlayer(defendingStarters, attackScore, defendScore)
        if (suspPlayer) {
          suspendedPlayerId  = suspPlayer.id
          suspensionOccurred = true
          const duration     = 3 + Math.floor(rand() * 4)
          if (isHomeAttacking) {
            awayActiveSuspensions++
            awaySuspensionTimers.push(duration)
          } else {
            homeActiveSuspensions++
            homeSuspensionTimers.push(duration)
          }
          trackRed(suspPlayer.id)
          const ev: MatchEvent = { minute, type: MatchEventType.RedCard, clubId: defendingClubId, playerId: suspPlayer.id, description: `Utvisning av ${suspPlayer.firstName} ${suspPlayer.lastName}` }
          stepEvents.push(ev); allEvents.push(ev)
        }
      }
    }
    // Variation sequences (tactical_shift, player_duel, atmosphere, offside_call, freekick_danger):
    // no game-state change — handled in commentary section below.

    // ── Commentary (full mode only) ───────────────────────────────────────────

    const scoreStr      = `${homeScore}–${awayScore}`
    const attackingTeam = isHomeAttacking ? homeTeamRef : awayTeamRef
    const defendingTeam = isHomeAttacking ? awayTeamRef : homeTeamRef
    const savingGK      = gkPlayerId ? findPlayerName(gkPlayerId) : ''

    let commentaryText = penaltyCauseText   // penalty cause overrides default if set
    let isDerbyStep    = false

    if (!isFast) {
      if (penaltyCauseText) {
        // Commentary already set — skip normal derivation for this step
      } else {
      let templateVars: Record<string, string> = {
        team:      attackingTeam,
        opponent:  defendingTeam,
        score:     scoreStr,
        minute:    String(minute),
        player:    scorerPlayerId ? findPlayerName(scorerPlayerId) : '',
        goalkeeper: savingGK,
        intensity: 'intensiv',
        result:    homeScore > awayScore ? 'en seger' : homeScore < awayScore ? 'ingenting' : 'en poäng',
        rivalry:   rivalry?.name ?? '',
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
        } else if (supporterCtx && supporterCtx.members <= 30 && rand() < 0.50) {
          const sv = { ...templateVars, leader: supporterCtx.leaderName, members: String(supporterCtx.members) }
          commentaryText = fillTemplate(pickCommentary(commentary.supporter_attendance_low, rand), sv)
        } else if (input.ownScandalThisSeason && supporterCtx && rand() < 0.20) {
          const sv = { ...templateVars, leader: supporterCtx.leaderName, members: String(supporterCtx.members) }
          commentaryText = fillTemplate(pickCommentary(commentary.supporter_scandal_recent, rand), sv)
        } else if (supporterCtx && rand() < 0.30) {
          const sv = { ...templateVars, leader: supporterCtx.leaderName, members: String(supporterCtx.members) }
          commentaryText = fillTemplate(pickCommentary(commentary.supporter_kickoff, rand), sv)
        } else {
          commentaryText = fillTemplate(pickCommentary(commentary.kickoff, rand), templateVars)
        }
      } else if (step === 30) {
        if (input.ownScandalThisSeason && supporterCtx && rand() < 0.20) {
          const sv = { ...templateVars, leader: supporterCtx.leaderName, members: String(supporterCtx.members) }
          commentaryText = fillTemplate(pickCommentary(commentary.supporter_scandal_recent, rand), sv)
        } else if (supporterCtx && rand() < 0.25) {
          const sv = { ...templateVars, leader: supporterCtx.leaderName, members: String(supporterCtx.members) }
          commentaryText = fillTemplate(pickCommentary(commentary.supporter_halfTime, rand), sv)
        } else {
          commentaryText = fillTemplate(pickCommentary(commentary.halfTime, rand), templateVars)
        }
      } else if (cornerGoalScored && scorerPlayerId) {
        templateVars = { ...templateVars, player: findPlayerName(scorerPlayerId) }
        const cornerIntro = fillTemplate(pickCommentary(commentary.corner, rand), templateVars)
        let goalText: string
        if (weather?.condition === WeatherCondition.HeavySnow && rand() < 0.20) {
          goalText = fillTemplate(pickCommentary(commentary.weather_goal_heavySnow, rand), templateVars)
        } else if (weather?.condition === WeatherCondition.Thaw && rand() < 0.20) {
          goalText = fillTemplate(pickCommentary(commentary.weather_goal_thaw, rand), templateVars)
        } else if (rand() < 0.30) {
          goalText = fillTemplate(pickCommentary(commentary.cornerVariant, rand), templateVars)
        } else {
          goalText = fillTemplate(pickCommentary(commentary.cornerGoal, rand), templateVars)
        }
        commentaryText = cornerIntro + ' ' + goalText
      } else if (goalScored && scorerPlayerId) {
        templateVars = { ...templateVars, player: findPlayerName(scorerPlayerId) }
        const scorerPlayer    = allPlayers.find(p => p.id === scorerPlayerId)
        const scorerIsManaged = managedIsHome !== undefined ? (managedIsHome ? isHomeAttacking : !isHomeAttacking) : false
        const scorerName      = findPlayerName(scorerPlayerId)
        const currentMargin   = Math.abs(homeScore - awayScore)

        // Sprint 28-B: Legend commentary — fires before all other pools (70% chance).
        // Scorer legend takes precedence; fall through to assister legend if scorer isn't one.
        if (scorerIsManaged && scorerPlayer?.isClubLegend && rand() < 0.70) {
          const eventType = (minute >= 80 && currentMargin <= 1) ? 'late_goal' : 'goal'
          commentaryText = pickLegendCommentary(scorerPlayer, eventType, minute, rand)
        } else if (scorerIsManaged && assisterPlayerId && rand() < 0.70) {
          const assisterPlayer = allPlayers.find(p => p.id === assisterPlayerId)
          if (assisterPlayer?.isClubLegend) {
            commentaryText = pickLegendCommentary(assisterPlayer, 'assist', minute, rand)
          }
        } else if (matchPhase === 'final' && rand() < 0.60) {
          commentaryText = fillTemplate(pickCommentary(commentary.final_goal, rand), templateVars)
        } else if (matchPhase === 'semifinal' && rand() < 0.50) {
          commentaryText = fillTemplate(pickCommentary(commentary.semifinal_goal, rand), templateVars)
        } else if (rivalry && rand() < 0.40) {
          commentaryText = fillTemplate(pickCommentary(commentary.derby_goal, rand), { ...templateVars, rivalry: rivalry.name })
          isDerbyStep = true
        } else if (input.storylines && rand() < 0.30) {
          const scorerStories = input.storylines.filter(s => s.playerId === scorerPlayerId)
          const storylineMap: Record<string, string> = {
            rescued_from_unemployment: `MÅL! ${scorerName} — mannen som nästan förlorade allt. Nu gör han säsongens viktigaste mål!`,
            went_fulltime_pro:         `MÅL! ${scorerName} har gått hela vägen från deltid till proffs — och levererar!`,
            returned_to_club:          `MÅL! ${scorerName} — hemkomsten kunde inte ha börjat bättre!`,
            captain_rallied_team:      `MÅL! Kaptenen visar vägen — ${scorerName} sätter den!`,
            gala_winner:               `MÅL! Galafavoriten ${scorerName} fortsätter imponera!`,
            underdog_season:           `MÅL! I underdogens säsong kliver ${scorerName} fram igen!`,
          }
          const matchedStory = scorerStories.find(s => storylineMap[s.type])
          if (matchedStory) {
            commentaryText = storylineMap[matchedStory.type]
          } else {
            commentaryText = fillTemplate(pickGoalCommentary(isHomeAttacking ? homeScore : awayScore, isHomeAttacking ? awayScore : homeScore, rand, minute), templateVars)
          }
        } else if (rand() < 0.40) {
          // Contextual commentary (THE BOMB 1.3)
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
              rand,
            ), templateVars)
          }
          commentaryText = contextual ?? fillTemplate(pickGoalCommentary(isHomeAttacking ? homeScore : awayScore, isHomeAttacking ? awayScore : homeScore, rand, minute), templateVars)
        } else if (weather?.condition === WeatherCondition.HeavySnow && rand() < 0.20) {
          commentaryText = fillTemplate(pickCommentary(commentary.weather_goal_heavySnow, rand), templateVars)
        } else if (weather?.condition === WeatherCondition.Thaw && rand() < 0.20) {
          commentaryText = fillTemplate(pickCommentary(commentary.weather_goal_thaw, rand), templateVars)
        } else {
          commentaryText = fillTemplate(pickGoalCommentary(isHomeAttacking ? homeScore : awayScore, isHomeAttacking ? awayScore : homeScore, rand, minute), templateVars)
        }

        // Supporter goal reaction
        if (supporterCtx && managedIsHome !== undefined) {
          const managedScored = managedIsHome === isHomeAttacking
          const sv = { ...templateVars, leader: supporterCtx.leaderName, members: String(supporterCtx.members) }
          if (managedScored && rand() < 0.35) {
            commentaryText += ' ' + fillTemplate(pickCommentary(commentary.supporter_goal_home, rand), sv)
          } else if (!managedScored && rand() < 0.25) {
            commentaryText += ' ' + fillTemplate(pickCommentary(commentary.supporter_goal_conceded, rand), sv)
          }
        }
        // Late supporter commentary
        if (supporterCtx && step >= 47 && Math.abs(homeScore - awayScore) <= 1) {
          const isManaged = managedIsHome ? homeScore >= awayScore : awayScore >= homeScore
          const supArr    = isManaged ? commentary.supporter_late_home : commentary.supporter_late_silent
          const sv        = { ...templateVars, leader: supporterCtx.leaderName, members: String(supporterCtx.members) }
          if (rand() < 0.15) commentaryText += ' ' + fillTemplate(pickCommentary(supArr, rand), sv)
        }
        // Trait override (50%)
        if (scorerPlayerId && rand() < 0.5) {
          const tc = getTraitCommentary(scorerPlayerId, 'goal', allPlayers)
          if (tc) commentaryText = tc
        }
      } else if (saveOccurred && gkPlayerId) {
        templateVars = { ...templateVars, goalkeeper: findPlayerName(gkPlayerId) }
        // Sprint 28-B: Legend GK save commentary (70% override)
        const gkPlayer    = allPlayers.find(p => p.id === gkPlayerId)
        const gkIsManaged = managedIsHome !== undefined ? (managedIsHome ? !isHomeAttacking : isHomeAttacking) : false
        if (gkIsManaged && gkPlayer?.isClubLegend && rand() < 0.70) {
          commentaryText = pickLegendCommentary(gkPlayer, 'gk_save', minute, rand)
        } else {
          commentaryText = fillTemplate(pickCommentary(commentary.save, rand), templateVars)
        }
      } else if (suspensionOccurred && suspendedPlayerId) {
        templateVars = { ...templateVars, player: findPlayerName(suspendedPlayerId) }
        if (rivalry && rand() < 0.50) {
          commentaryText = fillTemplate(pickCommentary(commentary.derby_suspension, rand), { ...templateVars, rivalry: rivalry.name })
          isDerbyStep = true
        } else {
          commentaryText = fillTemplate(pickCommentary(commentary.suspension, rand), templateVars)
        }
        if (rand() < 0.5) {
          const tc = getTraitCommentary(suspendedPlayerId, 'suspension', allPlayers)
          if (tc) commentaryText = tc
        }
      } else if (cornerOccurred && !goalScored) {
        commentaryText = fillTemplate(pickCommentary(commentary.corner, rand), templateVars)
      } else if ((homeActiveSuspensions > 0 || awayActiveSuspensions > 0) && (seqType === 'attack' || seqType === 'transition')) {
        const ppTeam     = awayActiveSuspensions > 0 ? homeTeamRef : awayTeamRef
        const ppOpponent = awayActiveSuspensions > 0 ? awayTeamRef : homeTeamRef
        templateVars = { ...templateVars, team: ppTeam, opponent: ppOpponent }
        commentaryText = fillTemplate(pickCommentary(commentary.powerPlayGood, rand), templateVars)
      } else if (weather && (step === 15 || step === 30 || step === 45)) {
        commentaryText = pickWeatherCommentary(weather, rand) ?? fillTemplate(pickCommentary(commentary.neutral, rand), templateVars)
      } else if (seqType === 'tactical_shift') {
        commentaryText = fillTemplate(pickCommentary(commentary.tactical_shift, rand), templateVars)
      } else if (seqType === 'player_duel') {
        const dp   = getGoalScorer(attackingStarters)
        const dv   = { ...templateVars, player: dp ? findPlayerName(dp.id) : attackingTeam }
        commentaryText = fillTemplate(pickCommentary(commentary.player_duel, rand), dv)
      } else if (seqType === 'atmosphere') {
        commentaryText = fillTemplate(pickCommentary(commentary.atmosphere, rand), templateVars)
      } else if (seqType === 'offside_call') {
        const op   = getGoalScorer(attackingStarters)
        const ov   = { ...templateVars, player: op ? findPlayerName(op.id) : attackingTeam }
        commentaryText = fillTemplate(pickCommentary(commentary.offside_call, rand), ov)
      } else if (seqType === 'freekick_danger') {
        const fp   = getGoalScorer(attackingStarters)
        const fv   = { ...templateVars, player: fp ? findPlayerName(fp.id) : attackingTeam }
        commentaryText = fillTemplate(pickCommentary(commentary.freekick_danger, rand), fv)
      } else {
        if (rivalry && step % 10 === 0 && !goalScored && !saveOccurred && !suspensionOccurred && !cornerOccurred && rand() < 0.30) {
          commentaryText = fillTemplate(pickCommentary(commentary.derby_neutral, rand), { ...templateVars, rivalry: rivalry.name })
          isDerbyStep = true
        } else if (weather && !goalScored && !saveOccurred && !cornerOccurred && rand() < 0.30) {
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

      // ── Situational commentary injection ──────────────────────────────────
      if (!goalScored && !suspensionOccurred && !cornerOccurred) {
        recentHomeShots.push(shotsHome)
        recentAwayShots.push(shotsAway)
        if (recentHomeShots.length > 5) recentHomeShots.shift()
        if (recentAwayShots.length > 5) recentAwayShots.shift()
        const momentumDiff  = (recentHomeShots[recentHomeShots.length - 1] ?? 0) - (recentAwayShots[recentAwayShots.length - 1] ?? 0)
        const momentumSwing = Math.abs(momentumDiff - prevMomentumDiff)

        // Season context at kickoff
        if (step === 0 && rand() < 0.40) {
          const ctx       = input.matchContext
          const round     = fixture.roundNumber ?? 0
          const mPos      = ctx?.managedPosition
          let ctxLine: string | null = null
          if (ctx?.isFirstRound) {
            ctxLine = fillTemplate(pickCommentary(commentary.context_season_opener, rand), templateVars)
          } else if (fixture.isCup && rand() < 0.7) {
            ctxLine = fillTemplate(pickCommentary(commentary.context_cup_final, rand), templateVars)
          } else if (mPos && mPos <= 3 && round >= 16) {
            ctxLine = fillTemplate(pickCommentary(commentary.context_title_race, rand), templateVars)
          } else if (mPos && mPos >= 10 && round >= 18) {
            ctxLine = fillTemplate(pickCommentary(commentary.context_relegation, rand), templateVars)
          }
          if (ctxLine) commentaryText = ctxLine
        }

        // Situational commentary every situationalInterval steps
        if (step > 5 && step % situationalInterval === 0 && situation !== 'neutral') {
          situationalInterval = randRange(rand, 8, 12) | 0
          let sitLine: string | null = null
          if (situation === 'dominating_home') {
            sitLine = fillTemplate(pickCommentary(commentary.situational_dominating, rand), { ...templateVars, team: homeTeamRef, opponent: awayTeamRef })
          } else if (situation === 'dominating_away') {
            sitLine = fillTemplate(pickCommentary(commentary.situational_dominating, rand), { ...templateVars, team: awayTeamRef, opponent: homeTeamRef })
          } else if (situation === 'tight') {
            sitLine = fillTemplate(pickCommentary(commentary.situational_tight, rand), templateVars)
          } else if (situation === 'opened_up') {
            sitLine = fillTemplate(pickCommentary(commentary.situational_opened_up, rand), templateVars)
          }
          if (sitLine && rand() < 0.70) { commentaryText = sitLine; wasSituationalStep = true }
        }

        // Momentum swing
        if (step >= 10 && momentumSwing >= 3 && rand() < 0.50) {
          const homeHasMomentum = momentumDiff > prevMomentumDiff
          const swingPool = homeHasMomentum ? commentary.momentum_swing_home : commentary.momentum_swing_away
          const swingVars = homeHasMomentum
            ? { ...templateVars, team: homeTeamRef, opponent: awayTeamRef }
            : { ...templateVars, team: awayTeamRef, opponent: homeTeamRef }
          commentaryText = fillTemplate(pickCommentary(swingPool, rand), swingVars)
        }
        prevMomentumDiff = momentumDiff

        if (matchPhase !== 'regular' && step > 5 && step % 8 === 0 && rand() < 0.45) {
          commentaryText = fillTemplate(pickCommentary(commentary.playoff_general, rand), templateVars)
        }

        if (step >= 45 && managedIsHome !== undefined && rand() < 0.20) {
          const ms   = managedIsHome ? homeScore : awayScore
          const os   = managedIsHome ? awayScore : homeScore
          const mode = getSecondHalfMode(ms, os, step, matchPhase)
          if (mode === 'controlling') {
            commentaryText = fillTemplate(pickCommentary(commentary.context_protecting_lead, rand), { ...templateVars, team: managedIsHome ? homeTeamRef : awayTeamRef })
          } else if (mode === 'chasing') {
            commentaryText = fillTemplate(pickCommentary(commentary.context_comeback_chasing, rand), { ...templateVars, team: managedIsHome ? homeTeamRef : awayTeamRef })
          }
        }
      }

      // Suspension context commentary
      if (suspensionOccurred && suspendedPlayerId && rand() < 0.35) {
        const managedIsDefending = managedIsHome !== undefined ? (managedIsHome !== isHomeAttacking) : false
        const scoreDiff = managedIsHome ? (homeScore - awayScore) : (awayScore - homeScore)
        const suspName  = findPlayerName(suspendedPlayerId)
        if (managedIsDefending && scoreDiff < 0) {
          commentaryText = fillTemplate(pickCommentary(commentary.context_suspension_frustration, rand), { ...templateVars, player: suspName, score: scoreStr })
        } else if (managedIsDefending && scoreDiff > 0) {
          commentaryText = fillTemplate(pickCommentary(commentary.context_suspension_tactical, rand), { ...templateVars, player: suspName })
        }
      }

      // Referee line (after suspension)
      let isRefCommentary = false
      if (suspensionOccurred && rand() < 0.20) {
        const refPool  = refStyle === 'strict' ? commentary.referee_strict
                       : refStyle === 'lenient' ? commentary.referee_lenient
                       : commentary.referee_inconsistent
        commentaryText = fillTemplate(pickCommentary(refPool, rand), templateVars)
        isRefCommentary = true
      }

      // Attendance announcement
      const attendanceStep = 47 + ((seed ?? 0) % 10 > 0 ? (seed ?? 0) % 10 : 3)
      if (step === attendanceStep && !goalScored && !suspensionOccurred && fixture.attendance) {
        const att    = fixture.attendance
        const isDerby = !!rivalry
        const isCold  = weather && weather.temperature < -10
        const isSnow  = weather && (weather.condition as string) === 'heavySnow'
        if (isDerby) {
          commentaryText = [`Publiksiffran annonseras: ${att} åskådare! Derbystämning på läktarna.`, `${att} åskådare har samlats för derbyt. Stämningen är elektrisk.`, `Det är derby — och ${att} har kommit för att se det. Underbara scener.`][Math.floor(rand() * 3)]
        } else if (att > 5000) {
          commentaryText = [`Lapp på luckan! ${att} åskådare — läktarna svämmar över.`, `${att} åskådare! Arenan sjuder.`, `Speaker meddelar: ${att} åskådare. En av de största publiksiffrorna på länge.`][Math.floor(rand() * 3)]
        } else if (att > 1000) {
          commentaryText = [`Publiksiffran annonseras: ${att} åskådare. Fin uppslutning idag.`, `${att} har tagit sig till planen. Bandyintresset är starkt.`, `Speaker meddelar: ${att} åskådare. Det värmer.`][Math.floor(rand() * 3)]
        } else if (isCold) {
          commentaryText = [`${att} tappra har vågat sig ut trots kylan. Respekt.`, `Publiksiffran annonseras: ${att} åskådare. Inte illa med ${weather!.temperature}°C.`, `${att} åskådare hukar bakom termosarna.`][Math.floor(rand() * 3)]
        } else if (isSnow) {
          commentaryText = `${att} åskådare trotsade snöfallet. Bandyfolket är ett härdat släkte.`
        } else if (att < 80) {
          commentaryText = [`Publiksiffran annonseras: ${att} åskådare. Tyst på läktarna idag.`, `${att} åskådare. Man önskar att det var fler. Men de som kom är lojala.`][Math.floor(rand() * 2)]
        } else {
          commentaryText = [`Publiksiffran annonseras: ${att} åskådare på plats.`, `${att} har tagit sig till planen idag. Bra uppslutning.`, `Speaker meddelar: ${att} åskådare. Bandyintresset lever.`][Math.floor(rand() * 3)]
        }
      }

      // Last-minute press trigger
      if (!lastMinutePressTriggered && step >= 55 && managedIsHome !== undefined) {
        const mg   = managedIsHome ? homeScore : awayScore
        const og   = managedIsHome ? awayScore : homeScore
        if (mg - og === -1) {
          lastMinutePressTriggered = true
          const stepsLeft        = 60 - step
          const managedStartersNow = managedIsHome ? homeStarters : awayStarters
          const avgFatigue       = managedStartersNow.reduce((s, p) => s + (100 - p.morale), 0) / Math.max(1, managedStartersNow.length)
          lastMinutePressData    = { minute, scoreDiff: mg - og, stepsLeft, fatigueLevel: Math.round(avgFatigue) }
        }
      }

      // Determine commentaryType
      void isRefCommentary  // used above
      } // end else (non-penalty commentary)
    } // end if (!isFast)

    // ── Intensity ──────────────────────────────────────────────────────────
    let intensity: 'low' | 'medium' | 'high'
    if (goalScored || suspensionOccurred) intensity = 'high'
    else if (saveOccurred || cornerOccurred) intensity = 'medium'
    else intensity = 'low'
    const scoreDiff = Math.abs(homeScore - awayScore)
    if (minute >= 83) {
      if (intensity === 'low') intensity = 'medium'
      if (scoreDiff <= 1) intensity = 'high'
    } else if (minute >= 70 && scoreDiff <= 1 && intensity === 'low') {
      intensity = 'medium'
    }

    const commentaryType: import('./matchUtils').CommentaryType = (() => {
      if (penaltyCauseText)             return 'critical'
      if (seqType === 'atmosphere')     return 'atmosphere'
      if (seqType === 'player_duel')    return 'player_duel'
      if (seqType === 'tactical_shift') return 'tactical'
      if (goalScored && scorerPlayerId) return 'goal_context'
      if (wasSituationalStep) return 'situation'
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
      onTargetHome,
      onTargetAway,
      cornersHome,
      cornersAway,
      weatherNote: (!isFast && step === 0) ? openingWeatherNote : undefined,
      isDerbyComment: isDerbyStep || undefined,
      cornerInteractionData,
      penaltyInteractionData,
      counterInteractionData,
      freeKickInteractionData,
      lastMinutePressData,
    }
  } // end main loop

  // ── Full time + overtime + penalties (second half only) ──────────────────

  if (!emitFullTime) return

  const scoreStrFT = `${homeScore}–${awayScore}`
  const ftVars: Record<string, string> = {
    team: homeTeamRef, opponent: awayTeamRef, score: scoreStrFT,
    minute: '90', player: '', goalkeeper: '', rivalry: rivalry?.name ?? '',
    result: homeScore > awayScore ? 'en seger' : homeScore < awayScore ? 'ingenting' : 'en poäng',
  }
  const fullTimeText = isFast ? scoreStrFT
    : rivalry
      ? fillTemplate(pickCommentary(commentary.derby_fullTime, rand), { ...ftVars, rivalry: rivalry.name })
      : fillTemplate(pickCommentary(commentary.fullTime, rand), ftVars)

  yield {
    step: 60, minute: 90, events: [], homeScore, awayScore,
    commentary: fullTimeText, intensity: 'high',
    activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions },
    shotsHome, shotsAway, onTargetHome, onTargetAway, cornersHome, cornersAway, phase: 'regular',
  }

  if (!fixture.isKnockout || homeScore !== awayScore) return

  // Overtime announcement
  yield {
    step: 61, minute: 90, events: [], homeScore, awayScore,
    commentary: isFast ? 'Förlängning' : pickCommentary(commentary.overtimeStart, rand),
    intensity: 'high',
    activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions },
    shotsHome, shotsAway, onTargetHome, onTargetAway, cornersHome, cornersAway, phase: 'overtime',
  }

  // 20 overtime steps
  const otGoalMod     = weatherGoalMod * profileGoalMod * 0.85
  const otHomeAttack  = homeAttack * 1.15
  const otAwayAttack  = awayAttack * 1.15

  for (let step = 62; step < 82; step++) {
    const minute     = 91 + Math.round((step - 62) * 1.5)
    const stepEvents: MatchEvent[] = []
    const hPF        = homeActiveSuspensions > 0 ? 0.75 : 1.0
    const aPF        = awayActiveSuspensions > 0 ? 0.75 : 1.0
    const hW         = otHomeAttack * (1 + effectiveHomeAdvantage) * hPF
    const aW         = otAwayAttack * aPF
    const isHA       = rand() < hW / (hW + aW)

    const attackStarters = isHA ? homeStarters : awayStarters
    const attackClubId   = isHA ? fixture.homeClubId : fixture.awayClubId
    const attAtt         = isHA ? otHomeAttack : otAwayAttack
    const defDef         = isHA ? awayDefense : homeDefense
    const defGKot        = isHA ? awayGK : homeGK

    let otGoalScored = false
    let otScorerPlayerId: string | undefined

    const chQ   = clamp(attAtt * 0.5 - defDef * 0.3 + randRange(rand, -0.15, 0.25), 0.05, 0.90)
    const gT    = chQ * 0.40 * GOAL_RATE_MOD * (1 - defGKot * 0.35) * otGoalMod
    const r     = rand()

    if (r < gT && canScore(isHA, homeScore, awayScore)) {
      const scorer   = getGoalScorer(attackStarters)
      const assister = getAssistProvider(attackStarters, scorer?.id)
      if (scorer) {
        if (isHA) { homeScore++ } else { awayScore++ }
        otScorerPlayerId = scorer.id
        otGoalScored = true
        trackGoal(scorer.id)
        const ev: MatchEvent = { minute, type: MatchEventType.Goal, clubId: attackClubId, playerId: scorer.id, secondaryPlayerId: assister?.id, description: `Förlängningsmål av ${scorer.firstName} ${scorer.lastName}` }
        stepEvents.push(ev); allEvents.push(ev)
        if (assister) {
          trackAssist(assister.id)
          const ae: MatchEvent = { minute, type: MatchEventType.Assist, clubId: attackClubId, playerId: assister.id, secondaryPlayerId: scorer.id, description: `Assist av ${assister.firstName} ${assister.lastName}` }
          stepEvents.push(ae); allEvents.push(ae)
        }
      }
    }

    const otScoreStr  = `${homeScore}–${awayScore}`
    const attackTeam  = isHA ? homeTeamRef : awayTeamRef
    let otCommentary: string
    if (isFast) {
      otCommentary = otGoalScored ? otScoreStr : ''
    } else if (otGoalScored && otScorerPlayerId) {
      otCommentary = fillTemplate(pickCommentary(commentary.overtimeGoal, rand), { player: findPlayerName(otScorerPlayerId), score: otScoreStr, team: attackTeam, opponent: '', minute: String(minute), goalkeeper: '', rivalry: '', result: '' })
    } else if (step === 81) {
      otCommentary = fillTemplate(pickCommentary(commentary.overtimeEnd, rand), { score: otScoreStr, team: '', opponent: '', minute: '120', player: '', goalkeeper: '', rivalry: '', result: '' })
    } else {
      otCommentary = fillTemplate(pickCommentary(commentary.overtimeNoGoal, rand), { team: attackTeam, opponent: '', score: otScoreStr, minute: String(minute), player: '', goalkeeper: '', rivalry: '', result: '' })
    }

    yield {
      step, minute, events: stepEvents, homeScore, awayScore,
      commentary: otCommentary,
      intensity: otGoalScored ? 'high' : 'medium',
      activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions },
      shotsHome, shotsAway, onTargetHome, onTargetAway, cornersHome, cornersAway, phase: 'overtime',
      overtimeResult: otGoalScored ? (isHA ? 'home' : 'away') : undefined,
    }

    if (otGoalScored) {
      yield {
        step: 82, minute: 120, events: [], homeScore, awayScore,
        commentary: `Matchen är avgjord i förlängningen! ${homeScore}–${awayScore}.`,
        intensity: 'high',
        activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions },
        shotsHome, shotsAway, onTargetHome, onTargetAway, cornersHome, cornersAway, phase: 'overtime',
        overtimeResult: isHA ? 'home' : 'away',
      }
      return
    }
  }

  // Penalties
  const homeGKPlayer = homeStarters.find(p => p.position === PlayerPosition.Goalkeeper)
  const awayGKPlayer = awayStarters.find(p => p.position === PlayerPosition.Goalkeeper)
  const { rounds: penRounds, homeGoals: penHome, awayGoals: penAway } = simulatePenalties(
    homeStarters, awayStarters, homeGKPlayer, awayGKPlayer, rand,
  )

  yield {
    step: 83, minute: 120, events: [], homeScore, awayScore,
    commentary: isFast ? 'Straffar' : pickCommentary(commentary.penaltyStart, rand),
    intensity: 'high',
    activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions },
    shotsHome, shotsAway, onTargetHome, onTargetAway, cornersHome, cornersAway, phase: 'penalties',
  }

  let runningHome = 0
  let runningAway = 0
  for (const penRound of penRounds) {
    if (penRound.homeScored) runningHome++
    if (penRound.awayScored) runningAway++
    const isLastRound = penRound === penRounds[penRounds.length - 1]
    const penCommentary = isFast
      ? `${runningHome}-${runningAway}`
      : isLastRound
        ? (runningHome > runningAway
          ? fillTemplate(pickCommentary(commentary.penaltyWinHome, rand), { team: homeTeamRef, penHome: String(runningHome), penAway: String(runningAway), score: `${homeScore}–${awayScore}`, opponent: awayTeamRef, minute: '120', player: '', goalkeeper: '', rivalry: '', result: '' })
          : fillTemplate(pickCommentary(commentary.penaltyWinAway, rand), { team: awayTeamRef, penHome: String(runningHome), penAway: String(runningAway), score: `${homeScore}–${awayScore}`, opponent: homeTeamRef, minute: '120', player: '', goalkeeper: '', rivalry: '', result: '' })
        )
        : `Omgång ${penRound.round}: ${penRound.homeShooterName} ${penRound.homeScored ? '✅' : '❌'} · ${penRound.awayShooterName} ${penRound.awayScored ? '✅' : '❌'} — Straffar: ${runningHome}-${runningAway}`

    yield {
      step: 84 + penRound.round - 1, minute: 120, events: [], homeScore, awayScore,
      commentary: penCommentary,
      intensity: isLastRound ? 'high' : 'medium',
      activeSuspensions: { homeCount: homeActiveSuspensions, awayCount: awayActiveSuspensions },
      shotsHome, shotsAway, onTargetHome, onTargetAway, cornersHome, cornersAway, phase: 'penalties',
      penaltyRound: penRound,
      penaltyHomeTotal: runningHome,
      penaltyAwayTotal: runningAway,
      penaltyDone: isLastRound,
      penaltyFinalResult: isLastRound ? { home: penHome, away: penAway } : undefined,
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Yields steps 0–30 (first half + halftime step).
 * Used by MatchLiveScreen before the halftime UI.
 */
export function* simulateFirstHalf(input: MatchCoreInput): Generator<MatchStep> {
  yield* simulateMatchCore(input, 0, 31, false)
}

/**
 * Yields steps 31–60 + fulltime + overtime + penalties.
 * Used by MatchLiveScreen after the halftime UI with updated tactics/substitutions.
 *
 * Pass the state from the end of the first half via initialHomeScore,
 * initialAwayScore, initialShotsHome, etc. (SecondHalfInput fields).
 */
export function* simulateSecondHalf(input: MatchCoreInput & Partial<SecondHalfInput>): Generator<MatchStep> {
  yield* simulateMatchCore(input, 31, 60, true)
}

/**
 * Regenerate steps from an arbitrary mid-match position.
 * Used for quick tactic changes during live matches.
 * fromStep: first step to generate (inclusive).
 * inSecondHalf: true if fromStep >= 31 (emits fulltime at end).
 */
export function* simulateFromMidMatch(
  input: MatchCoreInput & Partial<SecondHalfInput>,
  fromStep: number,
  inSecondHalf: boolean,
): Generator<MatchStep> {
  yield* simulateMatchCore(input, fromStep, inSecondHalf ? 60 : 31, inSecondHalf)
}
