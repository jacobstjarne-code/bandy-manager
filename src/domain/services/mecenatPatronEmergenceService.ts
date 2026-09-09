import type { SaveGame } from '../entities/SaveGame'
import { seasonalUnitRoll } from './seasonalRollService'

export type EmergenceKind = 'mecenat' | 'patron'

/**
 * DOM_MECENAT_PATRON_MODELLFORM_2026-09-08:
 *
 * Ankomst är ett enda seedat beslut per save och säsong. Sannolikheten
 * fortsätter hela vägen genom CS-skalan i stället för att bli en hård vägg
 * eller prövas om varje omgång. Golven är avsiktligt över noll; en klubb med
 * svagt ortsstöd kan fortfarande få stöd, bara klart mer sällan.
 */
const EMERGENCE_PROBABILITY: Record<EmergenceKind, { floor: number; ceiling: number }> = {
  mecenat: { floor: 0.02, ceiling: 0.32 },
  patron: { floor: 0.01, ceiling: 0.22 },
}

function clampCs(cs: number): number {
  return Math.max(0, Math.min(100, cs))
}

export function seasonalEmergenceProbability(kind: EmergenceKind, communityStanding: number): number {
  const { floor, ceiling } = EMERGENCE_PROBABILITY[kind]
  return floor + (ceiling - floor) * (clampCs(communityStanding) / 100)
}

/** Samma save+säsong+stödsort ger alltid samma utfall, oavsett antal anrop. */
export function seasonalEmergenceRoll(game: Pick<SaveGame, 'id' | 'worldSeed' | 'managedClubId' | 'currentSeason'>, kind: EmergenceKind): number {
  return seasonalUnitRoll(game, kind, 'emergence')
}

export function passesSeasonalEmergenceRoll(
  game: Pick<SaveGame, 'id' | 'worldSeed' | 'managedClubId' | 'currentSeason'>,
  kind: EmergenceKind,
  communityStanding: number,
): boolean {
  return seasonalEmergenceRoll(game, kind) < seasonalEmergenceProbability(kind, communityStanding)
}
