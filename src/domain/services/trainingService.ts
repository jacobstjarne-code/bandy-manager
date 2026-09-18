import type { Player } from '../entities/Player'
import type { TrainingFocus, TrainingEffects, TrainingSession } from '../entities/Training'
import { TrainingType, TrainingIntensity } from '../enums'
import { mulberry32 } from '../utils/random'
import { clamp } from '../utils/clamp'

// ── Base attribute boosts at Normal intensity ────────────────────────────────
const BASE_BOOSTS: Record<TrainingType, Partial<Record<string, number>>> = {
  [TrainingType.Skating]:     { skating: 0.3, acceleration: 0.2 },
  [TrainingType.BallControl]: { ballControl: 0.3, dribbling: 0.2 },
  [TrainingType.Passing]:     { passing: 0.3, vision: 0.15 },
  [TrainingType.Shooting]:    { shooting: 0.3, decisions: 0.1 },
  [TrainingType.Defending]:   { defending: 0.3, positioning: 0.2 },
  [TrainingType.CornerPlay]:  { cornerSkill: 0.4, passing: 0.15 },
  [TrainingType.Physical]:    { stamina: 0.3, acceleration: 0.15, workRate: 0.15 },
  [TrainingType.Tactical]:    { decisions: 0.2, positioning: 0.2, vision: 0.15 },
  [TrainingType.Recovery]:    {},
  [TrainingType.MatchPrep]:   {},
}

interface IntensityConfig {
  attributeMultiplier: number
  fitnessBase: number
  injuryRisk: number
  moraleEffect: number
  sharpnessEffect: number
}

const INTENSITY_CONFIG: Record<TrainingIntensity, IntensityConfig> = {
  // KÖRORDER 2026-09-18 §3.1: Lätts moraleEffect var +2 PER OMGÅNG som
  // grundvärde. Över en säsong blev det moral 74 → 96 gratis, och med det
  // +4,5 poäng, +161k och avsked 17 % → 4 %. Priset (attributeMultiplier 0,5)
  // är 0,15 attributpoäng per pass — osynligt inom samma säsong. Lätt var
  // alltså inte ett val utan ett rätt svar. Grundvärdet är nu 0; den vilade
  // moralvinsten finns kvar men bara där den är motiverad, se
  // trainingMoraleEffectFor.
  [TrainingIntensity.Light]:   { attributeMultiplier: 0.5, fitnessBase:  8, injuryRisk: 0.8, moraleEffect:  0, sharpnessEffect:  0 },
  [TrainingIntensity.Normal]:  { attributeMultiplier: 1.0, fitnessBase:  3, injuryRisk: 1.0, moraleEffect:  0, sharpnessEffect:  0 },
  [TrainingIntensity.Hard]:    { attributeMultiplier: 1.5, fitnessBase: -5, injuryRisk: 1.4, moraleEffect: -2, sharpnessEffect:  0 },
  [TrainingIntensity.Extreme]: { attributeMultiplier: 2.0, fitnessBase:-12, injuryRisk: 2.0, moraleEffect: -5, sharpnessEffect:  0 },
}

// Special overrides for Recovery and MatchPrep
const TYPE_OVERRIDES: Partial<Record<TrainingType, Partial<IntensityConfig>>> = {
  [TrainingType.Recovery]:  { fitnessBase: 8 },
  [TrainingType.MatchPrep]: { fitnessBase: 0, sharpnessEffect: 8 },
}

export function getTrainingEffects(focus: TrainingFocus): TrainingEffects {
  const intensityCfg = { ...INTENSITY_CONFIG[focus.intensity] }
  const typeOverride = TYPE_OVERRIDES[focus.type]
  if (typeOverride) {
    Object.assign(intensityCfg, typeOverride)
  }

  const baseBoosts = BASE_BOOSTS[focus.type]
  const attributeBoosts: Partial<Record<string, number>> = {}
  for (const [attr, base] of Object.entries(baseBoosts)) {
    attributeBoosts[attr] = (base as number) * intensityCfg.attributeMultiplier
  }

  // KÖRORDER 2026-09-18 §3.1: Recovery gav +1 moral PER OMGÅNG oavsett läge —
  // samma pump som Lätt, bara via typen i stället för intensiteten. Mätningen
  // efter att Lätt stängts visade att den ensam bar +17,3 moral per säsong,
  // långt över acceptansens +5. Grundvärdet är därför 0 här också, och vilans
  // moralvinst delas ut villkorat i trainingMoraleEffectFor.
  const moraleEffect =
    focus.type === TrainingType.Recovery
      ? 0
      : focus.type === TrainingType.MatchPrep
      ? 2
      : intensityCfg.moraleEffect

  // MatchPrep special sharpness
  const sharpnessEffect =
    focus.type === TrainingType.MatchPrep ? 8 : intensityCfg.sharpnessEffect

  return {
    attributeBoosts: attributeBoosts as TrainingEffects['attributeBoosts'],
    fitnessChange: intensityCfg.fitnessBase,
    injuryRiskModifier: intensityCfg.injuryRisk,
    moraleEffect,
    sharpnessEffect,
  }
}

/**
 * KÖRORDER 2026-09-18 §3.1 — Lätt trängning ger moral bara där vilan betyder
 * något. En sliten spelare mår bra av ett lugnt pass; en ung, pigg spelare blir
 * understimulerad av det. Hård och Extreme är oförändrade (deras moralpris ska
 * kännas oavsett kondition).
 */
export const LIGHT_TRAINING_TIRED_FITNESS = 55
export const LIGHT_TRAINING_UNDERSTIMULATED_FITNESS = 75
export const LIGHT_TRAINING_UNDERSTIMULATED_MAX_AGE = 24

export function trainingMoraleEffectFor(player: Player, focus: TrainingFocus, baseEffect: number): number {
  // Både Lätt (intensitet) och Recovery (typ) är "vila" och behandlas lika —
  // acceptansen i §3 kräver uttryckligen "Recovery samma".
  const isRestful = focus.intensity === TrainingIntensity.Light || focus.type === TrainingType.Recovery
  if (!isRestful) return baseEffect
  // Samma zon som Squad Pulse markerar som sliten — spelaren känner igen läget.
  if (player.fitness < LIGHT_TRAINING_TIRED_FITNESS) return baseEffect + 2
  if (player.age <= LIGHT_TRAINING_UNDERSTIMULATED_MAX_AGE && player.fitness > LIGHT_TRAINING_UNDERSTIMULATED_FITNESS) {
    return baseEffect - 1
  }
  return baseEffect
}

/**
 * KÖRORDER 2026-09-18 §3.2 — konditionsvinsten av ett pass är en andel av
 * avståndet till taket i stället för ett platt påslag. Platt +8 varje omgång
 * gjorde Lätt/Recovery till en pump som fungerade lika bra på en utvilad trupp
 * som på en sliten. Nu är +8 vid kondition 50 fortfarande +8, men bara +2,4 vid 85.
 *
 * Bara VINSTER skalas. Hårds −5 och Extremes −12 är en kostnad, och att göra den
 * billigare för en redan sliten spelare vore fel håll.
 *
 * Detta är inte dubbel avtagning mot fitnessRecoveryService: den skalar
 * ÅTERHÄMTNINGEN efter arbetsbelastning, den här skalar TRÄNINGENS påslag. Två
 * skilda kanaler som båda planar ut nära taket, vilket är avsikten — taket ska
 * vara svårt att nå oavsett vilken väg man tar dit.
 */
export function trainingFitnessGainFor(fitnessBase: number, currentFitness: number): number {
  if (fitnessBase <= 0) return fitnessBase
  const headroomFactor = Math.min(1, Math.max(0, (100 - currentFitness) / 50))
  return fitnessBase * headroomFactor
}

/**
 * KÖRORDER 2026-09-18 §3.4 — Extreme får ett uttalat syfte: kortsiktig toppning.
 * Den var tidigare bara sämre (88 % avsked, moral 7,6) utan att vara bra på
 * något, alltså ett dött läge enligt grindregeln. Nu är de tre första
 * omgångarna priset man betalar för attributspiken; därefter fördubblas moral-
 * och skadekostnaden. Samma spik-och-förfall-mönster som periodiseringens toppa.
 */
export const EXTREME_GRACE_ROUNDS = 3

export function extremeOverreachMultiplier(consecutiveExtremeRounds: number): number {
  return consecutiveExtremeRounds >= EXTREME_GRACE_ROUNDS ? 2 : 1
}

/** Antal omgångar i rad som avslutats med Extreme, ur `game.trainingHistory`. */
export function countConsecutiveExtremeRounds(history: readonly TrainingSession[]): number {
  let n = 0
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].focus.intensity !== TrainingIntensity.Extreme) break
    n++
  }
  return n
}

// ── Age factor for attribute boosts ─────────────────────────────────────────
function getAgeFactor(age: number): number {
  if (age <= 22) return 1.3
  if (age <= 28) return 1.0
  return 0.6
}

export interface TrainingResult {
  updatedPlayers: Player[]
  injuredPlayerIds: string[]   // player IDs who got injured during training
  notifications: string[]
}

export function applyTrainingToSquad(
  players: Player[],
  clubId: string,
  focus: TrainingFocus,
  facilities: number,           // 0–100
  seed: number,
  /** §3.4 — omgångar i rad på Extreme FÖRE denna. 0 för AI-klubbar. */
  consecutiveExtremeRounds = 0,
): TrainingResult {
  const rand = mulberry32(seed)
  const effects = getTrainingEffects(focus)
  const overreach = focus.intensity === TrainingIntensity.Extreme
    ? extremeOverreachMultiplier(consecutiveExtremeRounds)
    : 1
  const facilityMultiplier = facilities / 100

  // Base injury chance per player per training session
  const BASE_INJURY_CHANCE: Record<TrainingIntensity, number> = {
    [TrainingIntensity.Light]:   0.02,
    [TrainingIntensity.Normal]:  0.04,
    [TrainingIntensity.Hard]:    0.08,
    [TrainingIntensity.Extreme]: 0.15,
  }
  // §3.4 — efter EXTREME_GRACE_ROUNDS omgångar i rad på Extreme fördubblas priset.
  const baseInjuryChance = BASE_INJURY_CHANCE[focus.intensity] * overreach

  const injuredPlayerIds: string[] = []
  const updatedPlayers = players.map(player => {
    if (player.clubId !== clubId) return player

    const ageFactor = getAgeFactor(player.age)
    const updated = { ...player }

    // Day job flexibility modifier: non-pros benefit less from training
    const isFullTimePro = player.isFullTimePro ?? false
    const flexibility = player.dayJob?.flexibility ?? 75
    const dayJobModifier = isFullTimePro ? 1.05 : flexibility / 100

    // Apply attribute boosts
    for (const [attr, boost] of Object.entries(effects.attributeBoosts)) {
      const key = attr as keyof typeof player.attributes
      if (key in player.attributes) {
        const delta = (boost as number) * ageFactor * facilityMultiplier * dayJobModifier
        updated.attributes = {
          ...updated.attributes,
          [key]: clamp(player.attributes[key] + delta, 0, 100),
        }
      }
    }

    // Fitness — fulltime pros recover +2 extra per round
    const fitnessBonus = isFullTimePro ? 2 : 0
    const fitnessGain = trainingFitnessGainFor(effects.fitnessChange, player.fitness)
    updated.fitness = clamp(player.fitness + fitnessGain + fitnessBonus, 0, 100)

    // Morale
    updated.morale = clamp(player.morale + trainingMoraleEffectFor(player, focus, effects.moraleEffect) * overreach, 0, 100)

    // Sharpness
    if (effects.sharpnessEffect !== 0) {
      updated.sharpness = clamp(player.sharpness + effects.sharpnessEffect, 0, 100)
    }

    // Injury check (skip already injured players)
    if (!player.isInjured) {
      const injuryChance =
        baseInjuryChance *
        effects.injuryRiskModifier *
        (player.injuryProneness / 100) *
        ((100 - player.fitness) / 100 + 0.5) // fitness factor: low fitness = higher risk
      if (rand() < injuryChance) {
        const weeksOut = 1 + Math.floor(rand() * 4)  // 1–4 weeks
        updated.isInjured = true
        updated.injuryDaysRemaining = weeksOut * 7
        injuredPlayerIds.push(player.id)
      }
    }

    return updated
  })

  const notifications: string[] = [`Truppen tränade ${trainingTypeLabel(focus.type)} (${trainingIntensityLabel(focus.intensity)}).`]

  return { updatedPlayers, injuredPlayerIds, notifications }
}

// ── AI training focus selection ──────────────────────────────────────────────
// Picks a focus based on the weakest attribute group in the squad
export function selectAiTrainingFocus(players: Player[], clubId: string): TrainingFocus {
  const squadPlayers = players.filter(p => p.clubId === clubId && !p.isInjured)
  if (squadPlayers.length === 0) {
    return { type: TrainingType.Physical, intensity: TrainingIntensity.Normal }
  }

  function avgAttr(keys: (keyof typeof squadPlayers[0]['attributes'])[]): number {
    const total = squadPlayers.reduce((sum, p) => {
      return sum + keys.reduce((s, k) => s + p.attributes[k], 0) / keys.length
    }, 0)
    return total / squadPlayers.length
  }

  const groups: { type: TrainingType; keys: (keyof typeof squadPlayers[0]['attributes'])[] }[] = [
    { type: TrainingType.Skating,     keys: ['skating', 'acceleration'] },
    { type: TrainingType.BallControl, keys: ['ballControl', 'dribbling'] },
    { type: TrainingType.Passing,     keys: ['passing', 'vision'] },
    { type: TrainingType.Shooting,    keys: ['shooting', 'decisions'] },
    { type: TrainingType.Defending,   keys: ['defending', 'positioning'] },
    { type: TrainingType.Physical,    keys: ['stamina', 'workRate'] },
  ]

  let weakest = groups[0]
  let lowestAvg = avgAttr(groups[0].keys)

  for (const group of groups.slice(1)) {
    const avg = avgAttr(group.keys)
    if (avg < lowestAvg) {
      lowestAvg = avg
      weakest = group
    }
  }

  return { type: weakest.type, intensity: TrainingIntensity.Normal }
}

// ── Label helpers ────────────────────────────────────────────────────────────
export function trainingTypeLabel(type: TrainingType): string {
  const map: Record<TrainingType, string> = {
    [TrainingType.Skating]:     'Skridskoåkning',
    [TrainingType.BallControl]: 'Bollkontroll',
    [TrainingType.Passing]:     'Passning',
    [TrainingType.Shooting]:    'Skott',
    [TrainingType.Defending]:   'Försvar',
    [TrainingType.CornerPlay]:  'Hörnspel',
    [TrainingType.Physical]:    'Fysik',
    [TrainingType.Tactical]:    'Taktik',
    [TrainingType.Recovery]:    'Vila',
    [TrainingType.MatchPrep]:   'Matchförberedelse',
  }
  return map[type] ?? type
}

export function trainingIntensityLabel(intensity: TrainingIntensity): string {
  const map: Record<TrainingIntensity, string> = {
    [TrainingIntensity.Light]:   'Lätt',
    [TrainingIntensity.Normal]:  'Normal',
    [TrainingIntensity.Hard]:    'Hård',
    [TrainingIntensity.Extreme]: 'Extrem',
  }
  return map[intensity] ?? intensity
}

