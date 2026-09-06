/**
 * Stable instance identity for a named, recurring voice.
 *
 * The canonical roster owns which prefixes may be produced. Keeping the
 * persisted key as a string lets that roster land independently without
 * coupling saves to a presentation enum.
 */
export type VoiceId = string

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
}
