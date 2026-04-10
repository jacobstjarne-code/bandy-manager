import type { Player, PlayerAttributes } from '../entities/Player'
import { PlayerArchetype, PlayerPosition } from '../enums'
import { mulberry32 } from '../utils/random'
import { clamp } from '../utils/clamp'

function makeRng(seed: number) {
  const rand = mulberry32(seed)
  return {
    next: rand,
    float: (min: number, max: number) => rand() * (max - min) + min,
    int: (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min,
  }
}


export interface DevelopmentInput {
  players: Player[]
  clubFacilities: Record<string, number>
  weekNumber: number
  seed?: number
}

export interface NotableDevelopment {
  playerId: string
  attribute: keyof PlayerAttributes
  oldValue: number
  newValue: number
  type: 'improvement' | 'decline'
}

export interface DevelopmentResult {
  updatedPlayers: Player[]
  notableChanges: NotableDevelopment[]
}

function getAgeFactor(age: number): number {
  if (age <= 19) return 1.4
  if (age <= 22) return 1.1
  if (age <= 25) return 0.6
  if (age <= 28) return 0.3
  if (age <= 31) return -0.1
  if (age <= 33) return -0.25
  return -0.45
}

const ARCHETYPE_MULTIPLIERS: Record<PlayerArchetype, Partial<Record<keyof PlayerAttributes, number>>> = {
  [PlayerArchetype.Finisher]: {
    shooting: 2.5,
    acceleration: 1.8,
    decisions: 1.5,
    positioning: 1.5,
  },
  [PlayerArchetype.Playmaker]: {
    passing: 2.5,
    vision: 2.5,
    decisions: 2.0,
    ballControl: 1.5,
  },
  [PlayerArchetype.Dribbler]: {
    dribbling: 2.5,
    ballControl: 2.0,
    acceleration: 1.8,
    skating: 1.3,
  },
  [PlayerArchetype.TwoWaySkater]: {
    skating: 2.0,
    stamina: 2.0,
    defending: 1.5,
    workRate: 1.5,
  },
  [PlayerArchetype.DefensiveWorker]: {
    defending: 2.5,
    positioning: 2.0,
    workRate: 2.0,
    stamina: 1.5,
  },
  [PlayerArchetype.CornerSpecialist]: {
    cornerSkill: 3.0,
    passing: 2.0,
    vision: 1.5,
  },
  [PlayerArchetype.ReflexGoalkeeper]: {
    goalkeeping: 2.5,
    acceleration: 2.0,
    skating: 1.5,
  },
  [PlayerArchetype.PositionalGoalkeeper]: {
    goalkeeping: 2.5,
    positioning: 2.0,
    decisions: 2.0,
  },
  [PlayerArchetype.RawTalent]: {},
}

// Default multiplier for attributes not listed in archetype (non-GK outfield)
function getDefaultMultiplier(archetype: PlayerArchetype): number {
  switch (archetype) {
    case PlayerArchetype.TwoWaySkater:
      return 0.8
    case PlayerArchetype.RawTalent:
      return 0.4
    default:
      return 0.6
  }
}

// For GK archetypes the outfield attrs (non-goalkeeping) get 0.3
function getGKOutfieldMultiplier(): number {
  return 0.3
}

const GK_ARCHETYPES = new Set([PlayerArchetype.ReflexGoalkeeper, PlayerArchetype.PositionalGoalkeeper])

function getArchetypeMultiplier(archetype: PlayerArchetype, attr: keyof PlayerAttributes): number {
  if (archetype === PlayerArchetype.RawTalent) {
    // RawTalent handled separately
    return 0.4
  }

  const specific = ARCHETYPE_MULTIPLIERS[archetype][attr]
  if (specific !== undefined) return specific

  if (GK_ARCHETYPES.has(archetype)) {
    return getGKOutfieldMultiplier()
  }

  return getDefaultMultiplier(archetype)
}

function recalcCA(player: Player, baseChange: number, ageFactor: number): number {
  if (ageFactor >= 0) {
    // Scale CA growth: more room to grow (lower CA vs PA) → faster CA gain
    const paCeiling = player.potentialAbility
    const room = Math.max(0, paCeiling - player.currentAbility)
    const roomFactor = clamp(room / paCeiling, 0, 1)
    const delta = baseChange * 0.5 * (0.5 + roomFactor * 0.5)
    return clamp(player.currentAbility + delta, 5, 95)
  } else {
    const delta = ageFactor * 0.3
    return clamp(player.currentAbility + delta, 5, 95)
  }
}

export function developPlayers(input: DevelopmentInput): DevelopmentResult {
  const { players, clubFacilities, weekNumber, seed } = input
  const rng = makeRng(seed ?? (weekNumber * 997 + players.length * 31))

  const updatedPlayers: Player[] = []
  const notableChanges: NotableDevelopment[] = []

  for (const player of players) {
    // Skip injured players
    if (player.isInjured) {
      updatedPlayers.push(player)
      continue
    }

    const ageFactor = getAgeFactor(player.age)
    const developmentMod = (player.developmentRate / 100) * 0.6 + 0.4
    const facilities = clubFacilities[player.clubId] ?? 50
    const facilitiesMod = (facilities / 100) * 0.4 + 0.6
    const formMod = (player.form / 100) * 0.3 + 0.7

    const baseChange = ageFactor * developmentMod * facilitiesMod * formMod * 0.15

    const newAttributes = { ...player.attributes }
    const allKeys = Object.keys(newAttributes) as (keyof PlayerAttributes)[]

    if (ageFactor >= 0) {
      // Growth phase
      if (player.archetype === PlayerArchetype.RawTalent) {
        // Pick 2-3 random attributes for big boost, rest get 0.4
        const shuffled = [...allKeys].sort(() => rng.next() - 0.5)
        const boostCount = rng.int(2, 3)
        for (let i = 0; i < allKeys.length; i++) {
          const attr = shuffled[i]
          const oldVal = newAttributes[attr]
          let multiplier = i < boostCount ? 3.0 : 0.4
          const ceiling = player.potentialAbility * 0.95
          let effectiveChange = baseChange * multiplier + rng.float(-0.1, 0.1)
          if (oldVal >= ceiling - 5) {
            effectiveChange *= 0.2
          }
          if (oldVal > ceiling) {
            effectiveChange = Math.min(effectiveChange, 0)
          }
          const newVal = clamp(oldVal + effectiveChange, 1, 99)
          newAttributes[attr] = newVal
          // Compare rounded integers — a full integer point change is notable
          if (Math.abs(Math.round(newVal) - Math.round(oldVal)) >= 1) {
            notableChanges.push({
              playerId: player.id,
              attribute: attr,
              oldValue: Math.round(oldVal),
              newValue: Math.round(newVal),
              type: 'improvement',
            })
          }
        }
      } else {
        for (const attr of allKeys) {
          const oldVal = newAttributes[attr]
          const multiplier = getArchetypeMultiplier(player.archetype, attr)
          const ceiling = player.potentialAbility * 0.95
          let effectiveChange = baseChange * multiplier + rng.float(-0.1, 0.1)
          if (oldVal >= ceiling - 5) {
            effectiveChange *= 0.2
          }
          if (oldVal > ceiling) {
            effectiveChange = Math.min(effectiveChange, 0)
          }
          const newVal = clamp(oldVal + effectiveChange, 1, 99)
          newAttributes[attr] = newVal
          // Compare rounded integers — a full integer point change is notable
          if (Math.abs(Math.round(newVal) - Math.round(oldVal)) >= 1) {
            notableChanges.push({
              playerId: player.id,
              attribute: attr,
              oldValue: Math.round(oldVal),
              newValue: Math.round(newVal),
              type: 'improvement',
            })
          }
        }
      }
    } else {
      // Decline phase — apply equally to all attributes
      // One random attribute gets slightly more decline
      const randomDeclineAttr = allKeys[rng.int(0, allKeys.length - 1)]
      for (const attr of allKeys) {
        const oldVal = newAttributes[attr]
        const extraDecline = attr === randomDeclineAttr ? 1.5 : 1.0
        const effectiveChange = baseChange * extraDecline + rng.float(-0.05, 0.05)
        const newVal = clamp(oldVal + effectiveChange, 1, 99)
        newAttributes[attr] = newVal
        if (Math.abs(Math.round(newVal) - Math.round(oldVal)) >= 1) {
          notableChanges.push({
            playerId: player.id,
            attribute: attr,
            oldValue: Math.round(oldVal),
            newValue: Math.round(newVal),
            type: 'decline',
          })
        }
      }
    }

    const newCA = recalcCA(player, baseChange, ageFactor)

    updatedPlayers.push({
      ...player,
      currentAbility: newCA,
      attributes: newAttributes,
    })
  }

  return { updatedPlayers, notableChanges }
}

// ── Per-round development for managed club players ─────────────────────────

interface RoundDevelopmentContext {
  trainingFocus: string   // 'physical' | 'technical' | 'tactical'
  played: boolean
  wasStarter: boolean
  matchRating: number
  trainingIntensity: string // 'light' | 'normal' | 'heavy'
}

function calculateRoundDevelopment(
  player: Player,
  context: RoundDevelopmentContext,
): number {
  const age = player.age
  const devRate = player.developmentRate ?? 50
  const gap = player.potentialAbility - player.currentAbility

  let baseDelta = 0

  if (age <= 20) {
    baseDelta = context.played ? 0.15 + (devRate / 500) : 0.05
    if (context.wasStarter && context.matchRating >= 7.0) baseDelta += 0.1
  } else if (age <= 23) {
    baseDelta = context.played ? 0.08 + (devRate / 800) : 0.02
    if (context.wasStarter) baseDelta += 0.05
  } else if (age <= 29) {
    baseDelta = context.played ? 0.02 : -0.01
    if (context.matchRating >= 8.0) baseDelta += 0.03
  } else if (age <= 33) {
    baseDelta = context.played ? -0.02 : -0.05
    if (context.trainingIntensity === 'heavy') baseDelta += 0.02
  } else {
    baseDelta = -0.08 - (age - 33) * 0.02
    if (context.played) baseDelta += 0.03
  }

  // Cap growth by potential gap
  if (baseDelta > 0 && gap <= 2) baseDelta *= 0.1
  else if (baseDelta > 0 && gap <= 5) baseDelta *= 0.5

  // Training intensity modifier
  if (context.trainingIntensity === 'heavy') baseDelta += 0.02
  if (context.trainingIntensity === 'light') baseDelta -= 0.01

  return clamp(baseDelta, -0.3, 0.5)
}

/**
 * Apply per-round development to managed club players based on match context and training.
 * AI club players are handled separately by developPlayers (generic, every 2 rounds).
 */
export function applyRoundDevelopment(
  players: Player[],
  managedClubId: string,
  trainingFocus: string,
  trainingIntensity: string,
  playedPlayerIds: Set<string>,
  starterPlayerIds: Set<string>,
  playerRatings: Record<string, number>,
): Player[] {
  return players.map(player => {
    if (player.clubId !== managedClubId) return player
    if (player.isInjured) return player

    const context: RoundDevelopmentContext = {
      trainingFocus,
      played: playedPlayerIds.has(player.id),
      wasStarter: starterPlayerIds.has(player.id),
      matchRating: playerRatings[player.id] ?? 0,
      trainingIntensity,
    }

    const caChange = calculateRoundDevelopment(player, context)
    if (Math.abs(caChange) < 0.001) return player

    const newCA = clamp(player.currentAbility + caChange, 15, player.potentialAbility)
    return {
      ...player,
      currentAbility: Math.round(newCA * 10) / 10,
    }
  })
}

export function shouldRetire(player: Player, rand: () => number): boolean {
  const age = player.age
  // Position-based base retirement age
  const baseAge = player.position === PlayerPosition.Goalkeeper ? 39 : 37
  if (age < baseAge - 2) return false
  // Probability ramps up from baseAge-2 to baseAge+3
  const yearsOver = age - (baseAge - 2)
  const prob = Math.min(0.95, yearsOver * 0.20)
  return rand() < prob
}
