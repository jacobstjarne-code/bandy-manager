import type { Player } from '../entities/Player'

export type PeriodisationMode = 'bygg' | 'hall' | 'toppa' | 'vila'
export type ReactionType = 'warn' | 'good' | 'rust'

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
): PeriodisationReaction | null {
  const age = player.age
  const stamina = player.attributes.stamina
  const sharpness = player.sharpness
  const ca = player.currentAbility

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
