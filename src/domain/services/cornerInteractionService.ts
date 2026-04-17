import type { Player } from '../entities/Player'
import { PlayerPosition, PlayerArchetype } from '../enums'

export type CornerZone = 'near' | 'center' | 'far'
export type CornerDelivery = 'hard' | 'low' | 'short'

export interface CornerSetup {
  zone: CornerZone
  delivery: CornerDelivery
}

export interface CornerOutcome {
  type: 'goal' | 'saved' | 'wide' | 'cleared' | 'rebound'
  scorerId?: string
  scorerName?: string
  description: string
}

export interface CornerInteractionData {
  cornerTakerId: string
  cornerTakerName: string
  rusherIds: string[]
  topRusherName: string
  opponentPenaltyKill: 'passive' | 'active' | 'aggressive'
  isHome: boolean
  supporterBoost: number
  minute: number
}

export function resolveCorner(
  setup: CornerSetup,
  cornerTaker: Player,
  rushers: Player[],
  defenders: Player[],
  goalkeeper: Player | undefined,
  opponentPenaltyKill: 'passive' | 'active' | 'aggressive',
  isHome: boolean,
  supporterBoost: number,
  rand: () => number,
): CornerOutcome {
  const deliveryQuality =
    (cornerTaker.attributes.cornerSkill * 0.5 +
     cornerTaker.attributes.passing * 0.3 +
     cornerTaker.attributes.decisions * 0.2) / 100

  const zoneWeights: Record<CornerZone, { attr: 'shooting' | 'positioning' | 'skating'; archBonus: PlayerArchetype[] }> = {
    near: { attr: 'positioning', archBonus: [PlayerArchetype.Finisher] },
    center: { attr: 'shooting', archBonus: [PlayerArchetype.Finisher, PlayerArchetype.TwoWaySkater] },
    far: { attr: 'skating', archBonus: [PlayerArchetype.Dribbler, PlayerArchetype.TwoWaySkater] },
  }

  const zw = zoneWeights[setup.zone]
  const bestRusher = rushers
    .map(p => ({
      player: p,
      score: (p.attributes[zw.attr] * 0.4 +
              p.attributes.shooting * 0.3 +
              p.attributes.positioning * 0.2 +
              (p.form / 100) * 10) +
             (zw.archBonus.includes(p.archetype) ? 8 : 0),
    }))
    .sort((a, b) => b.score - a.score)[0]

  if (!bestRusher) {
    return { type: 'cleared', description: 'Ingen nådde bollen. Försvaret klarerade.' }
  }

  const deliveryMod: Record<CornerDelivery, number> = { hard: 1.0, low: 0.9, short: 0.75 }

  const defenseStrength = defenders.length > 0
    ? defenders.reduce((s, p) => s + p.attributes.defending * 0.4 + p.attributes.positioning * 0.4 + p.attributes.skating * 0.2, 0) / defenders.length / 100
    : 0.3

  const penaltyKillMod: Record<string, Record<CornerZone, number>> = {
    passive:    { near: 0.85, center: 0.90, far: 0.95 },
    active:     { near: 0.90, center: 0.85, far: 0.90 },
    aggressive: { near: 0.95, center: 0.90, far: 0.80 },
  }
  const pkMod = penaltyKillMod[opponentPenaltyKill]?.[setup.zone] ?? 0.90

  const gkSave = goalkeeper
    ? (goalkeeper.attributes.goalkeeping * 0.6 + goalkeeper.attributes.positioning * 0.4) / 100
    : 0.3

  const attackScore = deliveryQuality * deliveryMod[setup.delivery] * (bestRusher.score / 100)
  const homeBonus = isHome ? 0.03 : 0
  const supporterMod = supporterBoost * 0.005

  const goalChance = Math.max(0.03, Math.min(0.35,
    attackScore * 0.5 - defenseStrength * 0.25 * pkMod - gkSave * 0.20
    + homeBonus + supporterMod + (rand() * 0.10 - 0.05)
  ))

  const roll = rand()

  if (roll < goalChance) {
    return {
      type: 'goal', scorerId: bestRusher.player.id,
      scorerName: `${bestRusher.player.firstName[0]}. ${bestRusher.player.lastName}`,
      description: setup.delivery === 'hard'
        ? `${bestRusher.player.lastName} mötte bollen i full fart — MÅLLL!`
        : setup.delivery === 'low'
        ? `Perfekt tajming! ${bestRusher.player.lastName} styrde in bollen vid ${setup.zone === 'near' ? 'nära stolpen' : setup.zone === 'far' ? 'bortre stolpen' : 'straffpunkten'}.`
        : `Kort hörna — motståndaren överraskad! ${bestRusher.player.lastName} avslutade.`,
    }
  }
  if (roll < goalChance + 0.15) return { type: 'saved', description: `${bestRusher.player.lastName} nådde bollen men målvakten räddade.` }
  if (roll < goalChance + 0.30) return { type: 'wide', description: setup.delivery === 'hard' ? 'Hårt skott — ingen nådde fram.' : 'Tajmingen stämde inte.' }
  if (roll < goalChance + 0.55) return { type: 'cleared', description: 'Försvaret klarerade direkt.' }
  return { type: 'rebound', description: 'Retur! Bollen studsade tillbaka — nytt spelmoment.' }
}

export function shouldBeInteractive(
  minute: number, homeScore: number, awayScore: number,
  isManaged: boolean, cornersThisMatch: number, interactiveSoFar: number,
  rand: () => number,
): boolean {
  if (!isManaged) return false

  const MAX_INTERACTIVE = 3
  if (interactiveSoFar >= MAX_INTERACTIVE) return false

  // First corner of the match: always interactive
  if (cornersThisMatch === 0) return true

  // Critical moment: last 10 minutes AND close score
  const scoreDiff = Math.abs(homeScore - awayScore)
  if (minute >= 80 && scoreDiff <= 1) return true

  // Otherwise: 25% chance
  return rand() < 0.25
}

export function buildCornerInteractionData(
  cornerTaker: Player,
  attackingStarters: Player[],
  defendingStarters: Player[],
  isHome: boolean,
  supporterBoost: number,
  minute: number,
  homeScore: number,
  awayScore: number,
): CornerInteractionData {
  const rushers = attackingStarters
    .filter(p => p.position !== PlayerPosition.Goalkeeper && p.id !== cornerTaker.id)
    .sort((a, b) => b.attributes.shooting + b.attributes.positioning - a.attributes.shooting - a.attributes.positioning)
    .slice(0, 5)

  const defenderCount = defendingStarters.filter(p => p.position !== PlayerPosition.Goalkeeper).length
  const opponentPenaltyKill: 'passive' | 'active' | 'aggressive' =
    defenderCount >= 5 ? 'aggressive' : defenderCount >= 3 ? 'active' : 'passive'

  // Score gap affects defending intensity
  const managedScore = isHome ? homeScore : awayScore
  const oppScore = isHome ? awayScore : homeScore
  const effectivePK: 'passive' | 'active' | 'aggressive' =
    oppScore > managedScore + 1 ? 'aggressive' : opponentPenaltyKill

  const topRusher = rushers[0]

  return {
    cornerTakerId: cornerTaker.id,
    cornerTakerName: `${cornerTaker.firstName[0]}. ${cornerTaker.lastName}`,
    rusherIds: rushers.map(p => p.id),
    topRusherName: topRusher ? `${topRusher.firstName[0]}. ${topRusher.lastName}` : 'okänd',
    opponentPenaltyKill: effectivePK,
    isHome,
    supporterBoost,
    minute,
  }
}
