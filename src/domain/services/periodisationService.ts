import type { Player } from '../entities/Player'

export type PeriodisationMode = 'bygg' | 'hall' | 'toppa' | 'vila'
export type ReactionType = 'warn' | 'good' | 'rust'

// D-SAB-001: Säsongsbage — periodisering magnituder (shared with playerStateProcessor)
export const BYGG_SEASON_FORM_RATE   = 1.5
export const BYGG_SEASON_FORM_CAP    = 88
export const BYGG_EXTRA_FITNESS_COST = 4
export const BYGG_INJURY_MULT        = 1.15
export const TOPPA_SPIKE_RATE        = 1.0
export const TOPPA_DECAY_RATE        = 1.7
export const TOPPA_SPIKE_ROUNDS      = 3
export const TOPPA_EXTRA_SHARPNESS   = 2.4
export const TOPPA_EXTRA_FITNESS_REC = 3
export const VILA_SEASON_FORM_DECAY  = 1.0
export const VILA_EXTRA_FITNESS_REC  = 5
export const VILA_SHARPNESS_PENALTY  = 3
// D-SAB-001: unified cap — squadEvaluator och bench-recovery använder samma värde
export const SEASON_FORM_FITNESS_SLACK = 3
export const RAMP_ROUNDS               = 3   // D-SAB-002: rundor av ramp-skydd efter skada
export const PROJECTION_HORIZON        = 10

export interface PeriodisationReaction {
  type: ReactionType
  text: string
}

export function getEffectiveMode(
  player: Player,
  teamMode: PeriodisationMode,
): PeriodisationMode {
  return (player.periodisationOverride as PeriodisationMode | null | undefined) ?? teamMode
}

export function getReaction(
  player: Player,
  effectiveMode: PeriodisationMode,
  currentMatchday: number = 0,
): PeriodisationReaction | null {
  const age = player.age
  const stamina = player.attributes.stamina
  const sharpness = player.sharpness
  const ca = player.currentAbility

  // Ramp-skydd vinner alltid — nyss skadad spelare ska inte drivas i Bygg/Toppa
  if (
    (effectiveMode === 'bygg' || effectiveMode === 'toppa') &&
    currentMatchday < ((player as { recentlyInjuredUntil?: number }).recentlyInjuredUntil ?? 0)
  ) {
    return { type: 'warn', text: 'Ramp först' }
  }

  if (effectiveMode === 'bygg') {
    if (age >= 33) return { type: 'warn', text: 'Tål inte Bygg' }
    if (stamina < 40) return { type: 'warn', text: 'Tål inte Bygg' }
    if (age <= 20) return { type: 'good', text: 'Bygger snabbt' }
  }

  if (effectiveMode === 'toppa') {
    if (age >= 33) return { type: 'warn', text: 'Orkar ej spiken' }
  }

  if (effectiveMode === 'vila') {
    if (age <= 20) return { type: 'rust', text: 'Behöver minuter' }
    if (sharpness >= 75 && ca >= 70) return { type: 'rust', text: 'Rostar av vila' }
  }

  return null
}

/**
 * Projects seasonForm avg forward from currentAvg for `horizon` rounds
 * under the given mode. First returned value = after round 1.
 */
export function projectSeasonForm(
  currentAvg: number,
  mode: PeriodisationMode,
  roundsInMode: number,
  horizon: number = PROJECTION_HORIZON,
): number[] {
  const result: number[] = []
  let sf = currentAvg
  for (let i = 0; i < horizon; i++) {
    const roundN = roundsInMode + i
    let delta = 0
    if (mode === 'bygg') {
      delta = sf < BYGG_SEASON_FORM_CAP ? BYGG_SEASON_FORM_RATE : 0
    } else if (mode === 'toppa') {
      delta = roundN < TOPPA_SPIKE_ROUNDS ? TOPPA_SPIKE_RATE : -TOPPA_DECAY_RATE
    } else if (mode === 'vila') {
      delta = -VILA_SEASON_FORM_DECAY
    }
    sf = Math.max(0, Math.min(100, sf + delta))
    result.push(Math.round(sf))
  }
  return result
}
