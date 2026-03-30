import type { Player } from '../entities/Player'
import type { TrainingFocus, TrainingEffects } from '../entities/Training'
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
  [TrainingIntensity.Light]:   { attributeMultiplier: 0.5, fitnessBase:  8, injuryRisk: 0.8, moraleEffect:  2, sharpnessEffect:  0 },
  [TrainingIntensity.Normal]:  { attributeMultiplier: 1.0, fitnessBase:  3, injuryRisk: 1.0, moraleEffect:  0, sharpnessEffect:  0 },
  [TrainingIntensity.Hard]:    { attributeMultiplier: 1.5, fitnessBase: -5, injuryRisk: 1.4, moraleEffect: -2, sharpnessEffect:  0 },
  [TrainingIntensity.Extreme]: { attributeMultiplier: 2.0, fitnessBase:-12, injuryRisk: 2.0, moraleEffect: -5, sharpnessEffect:  0 },
}

// Special overrides for Recovery and MatchPrep
const TYPE_OVERRIDES: Partial<Record<TrainingType, Partial<IntensityConfig>>> = {
  [TrainingType.Recovery]:  { fitnessBase: 15 },
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

  // Recovery gets bonus morale regardless of intensity
  const moraleEffect =
    focus.type === TrainingType.Recovery
      ? 3
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
): TrainingResult {
  const rand = mulberry32(seed)
  const effects = getTrainingEffects(focus)
  const facilityMultiplier = facilities / 100

  // Base injury chance per player per training session
  const BASE_INJURY_CHANCE: Record<TrainingIntensity, number> = {
    [TrainingIntensity.Light]:   0.02,
    [TrainingIntensity.Normal]:  0.04,
    [TrainingIntensity.Hard]:    0.08,
    [TrainingIntensity.Extreme]: 0.15,
  }
  const baseInjuryChance = BASE_INJURY_CHANCE[focus.intensity]

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
    updated.fitness = clamp(player.fitness + effects.fitnessChange + fitnessBonus, 0, 100)

    // Morale
    updated.morale = clamp(player.morale + effects.moraleEffect, 0, 100)

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

export function trainingTypeEmoji(type: TrainingType): string {
  const map: Record<TrainingType, string> = {
    [TrainingType.Skating]:     '⛸',
    [TrainingType.BallControl]: '🏒',
    [TrainingType.Passing]:     '🎯',
    [TrainingType.Shooting]:    '💥',
    [TrainingType.Defending]:   '🛡',
    [TrainingType.CornerPlay]:  '📐',
    [TrainingType.Physical]:    '💪',
    [TrainingType.Tactical]:    '🧠',
    [TrainingType.Recovery]:    '🛌',
    [TrainingType.MatchPrep]:   '⚡',
  }
  return map[type] ?? '🔴'
}

export function trainingTypeDescription(type: TrainingType): string {
  const map: Record<TrainingType, string> = {
    [TrainingType.Skating]:     'Skridskoåkning +0.3, Acceleration +0.2',
    [TrainingType.BallControl]: 'Bollkontroll +0.3, Dribbling +0.2',
    [TrainingType.Passing]:     'Passning +0.3, Vision +0.15',
    [TrainingType.Shooting]:    'Skott +0.3, Spelsinne +0.1',
    [TrainingType.Defending]:   'Försvar +0.3, Positionering +0.2',
    [TrainingType.CornerPlay]:  'Hörnspel +0.4, Passning +0.15',
    [TrainingType.Physical]:    'Kondition +0.3, Acceleration +0.15, Arbetsinsats +0.15',
    [TrainingType.Tactical]:    'Spelsinne +0.2, Positionering +0.2, Vision +0.15',
    [TrainingType.Recovery]:    'Kondition +15, Moral +3',
    [TrainingType.MatchPrep]:   'Skärpa +8, Moral +2',
  }
  return map[type] ?? ''
}
