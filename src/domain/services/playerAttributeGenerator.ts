import type { PlayerAttributes } from '../entities/Player'
import { PlayerArchetype } from '../enums'
import { clamp } from '../utils/clamp'
import { getArchetypeMultiplier } from './playerDevelopmentService'

export const PLAYER_ATTRIBUTE_KEYS: readonly (keyof PlayerAttributes)[] = [
  'skating',
  'acceleration',
  'stamina',
  'ballControl',
  'passing',
  'shooting',
  'dribbling',
  'vision',
  'decisions',
  'workRate',
  'positioning',
  'defending',
  'cornerSkill',
  'goalkeeping',
  'cornerRecovery',
]

const GK_ARCHETYPES = new Set<PlayerArchetype>([
  PlayerArchetype.ReflexGoalkeeper,
  PlayerArchetype.PositionalGoalkeeper,
])

export interface AttributeGeneratorRandom {
  next: () => number
}

export interface GeneratePlayerAttributesInput {
  currentAbility: number
  archetype: PlayerArchetype
  rng: AttributeGeneratorRandom
}

/**
 * Samma viktade projektion används åt båda håll: generatorn formar
 * attributen mot den och test/instrumentering kan härleda CA tillbaka.
 */
export function calculateArchetypeWeightedAbility(
  attributes: PlayerAttributes,
  archetype: PlayerArchetype,
): number {
  let weightedTotal = 0
  let totalWeight = 0

  for (const attribute of PLAYER_ATTRIBUTE_KEYS) {
    const weight = getArchetypeMultiplier(archetype, attribute)
    weightedTotal += attributes[attribute] * weight
    totalWeight += weight
  }

  return totalWeight === 0 ? 0 : weightedTotal / totalWeight
}

export function normalizePlayerAttributesToAbility(
  attributes: PlayerAttributes,
  archetype: PlayerArchetype,
  currentAbility: number,
): PlayerAttributes {
  const target = clamp(currentAbility, 1, 99)
  const values = { ...attributes }

  // En gemensam förskjutning bevarar profilens form. Upprepa när ett
  // extremvärde slår i tak/golv så de övriga attributen tar återstående del.
  for (let pass = 0; pass < 8; pass++) {
    const actual = calculateArchetypeWeightedAbility(values, archetype)
    const correction = target - actual
    if (Math.abs(correction) < 0.01) break
    for (const attribute of PLAYER_ATTRIBUTE_KEYS) {
      values[attribute] = clamp(values[attribute] + correction, 1, 99)
    }
  }

  const rounded = {} as PlayerAttributes
  for (const attribute of PLAYER_ATTRIBUTE_KEYS) {
    rounded[attribute] = Math.round(values[attribute])
  }

  // Avrundning efter klampning kan flytta den viktade projektionen mer än
  // en hel CA-poäng nära 1/99. Justera ett helt attributsteg åt gången och
  // välj steget som faktiskt minskar felet; då gäller invarianten även för
  // verkliga (icke tiotalsjämna) CA-värden.
  for (let pass = 0; pass < 300; pass++) {
    const actual = calculateArchetypeWeightedAbility(rounded, archetype)
    const direction = target > actual ? 1 : -1
    const currentError = Math.abs(target - actual)
    if (currentError <= 0.25) break

    let bestAttribute: keyof PlayerAttributes | null = null
    let bestError = currentError
    for (const attribute of PLAYER_ATTRIBUTE_KEYS) {
      const candidateValue = rounded[attribute] + direction
      if (candidateValue < 1 || candidateValue > 99) continue
      rounded[attribute] = candidateValue
      const candidateError = Math.abs(target - calculateArchetypeWeightedAbility(rounded, archetype))
      rounded[attribute] -= direction
      if (candidateError < bestError) {
        bestError = candidateError
        bestAttribute = attribute
      }
    }

    if (!bestAttribute) break
    rounded[bestAttribute] += direction
  }
  return rounded
}

/**
 * Kanonisk attributgenerator för värld, ungdomsintag och uppflyttning.
 *
 * CA är den ackumulerade förmågeaxeln och har redan åldersanpassats av den
 * väg som skapade spelaren. Att applicera getAgeFactor här igen skulle
 * dubbelräkna ålder. Attributprofilens form kommer i stället direkt från
 * samma arketypmultiplikatorer som den fortsatta utvecklingen använder.
 * marketValueService.ageCurve är avsiktligt en separat värdeaxel.
 */
export function generatePlayerAttributes({
  currentAbility,
  archetype,
  rng,
}: GeneratePlayerAttributesInput): PlayerAttributes {
  const target = clamp(currentAbility, 1, 99)
  const weights = PLAYER_ATTRIBUTE_KEYS.map(attribute => getArchetypeMultiplier(archetype, attribute))
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  const weightedWeightCentre = weights.reduce((sum, weight) => sum + weight * weight, 0) / totalWeight
  const isGoalkeeper = GK_ARCHETYPES.has(archetype)

  const values = {} as Record<keyof PlayerAttributes, number>
  for (let index = 0; index < PLAYER_ATTRIBUTE_KEYS.length; index++) {
    const attribute = PLAYER_ATTRIBUTE_KEYS[index]
    const profile = (weights[index] - weightedWeightCentre) * 9
    const noise = (rng.next() - 0.5) * 4
    const incompatiblePenalty = !isGoalkeeper && attribute === 'goalkeeping' ? -12 : 0
    values[attribute] = target + profile + noise + incompatiblePenalty
  }

  // Raw talent har samma utvecklingsprofil i motorn (jämn låg vikt) men ska
  // fortfarande vara ojämn: spetsen väljs här och round-trip-normaliseras
  // därefter, i stället för att ha en separat ungdomsformel.
  if (archetype === PlayerArchetype.RawTalent) {
    const shuffled = [...PLAYER_ATTRIBUTE_KEYS]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    const boostCount = 2 + Math.floor(rng.next() * 2)
    for (let index = 0; index < boostCount; index++) {
      values[shuffled[index]] += 14 + rng.next() * 8
    }
  }

  return normalizePlayerAttributesToAbility(values, archetype, target)
}
