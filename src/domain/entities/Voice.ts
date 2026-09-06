/**
 * Stable instance identity for a named, recurring voice.
 *
 * The canonical roster owns which prefixes may be produced. The suffix is a
 * club-scoped instance identity, while the prefix is intentionally closed so
 * ambient and system voices cannot accidentally enter the gate.
 */
export const GATED_VOICE_KINDS = [
  'assistant_coach',
  'board',
  'local_press',
  'patron',
  'sponsor',
  'klack_leader',
] as const

/** Canonical roster class. Ambient/system voices deliberately do not occur here. */
export type VoiceKind = typeof GATED_VOICE_KINDS[number]

/** Club-scoped instance id for one member of the canonical gated roster. */
export type VoiceId = `${VoiceKind}:${string}`

export function isVoiceId(value: string): value is VoiceId {
  return GATED_VOICE_KINDS.some(kind => value.startsWith(`${kind}:`))
}

/**
 * A permanent gate record. Deliberately no matchday: absolute matchday
 * values are rebased at season rollover, while an introduction is history.
 */
export type VoiceIntroductionRecord = (
  | {
      provenance: 'observed'
      source: 'onboarding' | 'event'
      introducedSeason: number
      introducedDate: string
    }
  | {
      provenance: 'legacy_assumed'
      source: 'migration'
    }
) & {
  /** Frozen identity for later callbacks after the live entity has left. */
  nameSnapshot?: string
  roleSnapshot?: string
}

export type IntroducedVoiceRegistry = Record<VoiceId, VoiceIntroductionRecord>

/**
 * Presentation budget for the active period. Unlike the permanent registry,
 * this is intentionally keyed to the live season/matchday and reads as empty
 * as soon as either axis changes.
 */
export interface VoiceIntroductionBudget {
  season: number
  matchday: number
  used: number
  /**
   * Period-only latch: these voices were introduced in this matchday and may
   * not make their first substantive statement until the next one. This list
   * is reset with the budget and never enters the permanent registry.
   */
  introducedVoiceIds?: VoiceId[]
}
