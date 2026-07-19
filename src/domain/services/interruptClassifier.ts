/**
 * interruptClassifier.ts
 *
 * Pure classification functions for game interrupts (portal cards / overlays).
 * Does NOT modify game state or throttle behaviour — that is roundProcessor's job.
 *
 * Audit finding (2026-05-21): roundProcessor already has
 *   MAX_ATMOSPHERIC_PER_ROUND=2 + MAX_LOW_IN_QUEUE=5 with spill-to-inbox,
 *   but only for low-prio events. Anslag / weekly_decision / phase_mark bypass
 *   throttling entirely. This classifier covers all categories and provides the
 *   measurement instrument Design needs to decide throttle policy — but CHANGES
 *   NOTHING in roundProcessor until Design decides.
 */

import type { SaveGame } from '../entities/SaveGame'

// ── Types ────────────────────────────────────────────────────────────────────

export type InterruptKind = 'actionable' | 'informational'

export type InterruptCategory =
  | 'anslag'
  | 'event'
  | 'weekly_decision'
  | 'phase_mark'
  | 'scene'

export interface InterruptItem {
  category: InterruptCategory
  /** event with choices → actionable */
  hasChoices?: boolean
  /** scene with sceneChoices → actionable */
  sceneChoices?: unknown[]
}

// ── Classification ───────────────────────────────────────────────────────────

/**
 * Classifies a single interrupt as actionable (requires A/B choice) or
 * informational (player just acknowledges / auto-dismisses).
 *
 * Rules (Design may tighten via throttle policy later):
 * - weekly_decision → actionable (always has A/B choice)
 * - event with hasChoices=true → actionable
 * - event without choices (atmospheric) → informational
 * - anslag → informational (season chapter overlay, no decision)
 * - phase_mark → informational (checkpoint marker)
 * - scene with sceneChoices (length > 0) → actionable; otherwise informational
 */
export function classifyInterrupt(item: InterruptItem): InterruptKind {
  switch (item.category) {
    case 'weekly_decision':
      return 'actionable'

    case 'event':
      return item.hasChoices ? 'actionable' : 'informational'

    case 'anslag':
      return 'informational'

    case 'phase_mark':
      return 'informational'

    case 'scene':
      return (item.sceneChoices && item.sceneChoices.length > 0)
        ? 'actionable'
        : 'informational'

    default:
      return 'informational'
  }
}

// ── Queue measurement ────────────────────────────────────────────────────────

export interface InterruptCount {
  total: number
  actionable: number
  informational: number
}

/**
 * Counts what is ACTUALLY pending in game state right now, broken down by
 * InterruptCategory and InterruptKind. This is the measurement instrument —
 * it reveals whether the "eight" interrupts seen in audit are mostly
 * informational (→ should go to inbox per FM principle) or actual decisions.
 *
 * Pure function — no side effects on game state.
 */
export function countPendingInterrupts(game: SaveGame): Record<InterruptCategory, InterruptCount> {
  const zero = (): InterruptCount => ({ total: 0, actionable: 0, informational: 0 })

  const result: Record<InterruptCategory, InterruptCount> = {
    anslag: zero(),
    event: zero(),
    weekly_decision: zero(),
    phase_mark: zero(),
    scene: zero(),
  }

  function tally(category: InterruptCategory, item: InterruptItem) {
    const kind = classifyInterrupt(item)
    result[category].total++
    if (kind === 'actionable') result[category].actionable++
    else result[category].informational++
  }

  // ── events ────────────────────────────────────────────────────────────────
  for (const ev of (game.pendingEvents ?? [])) {
    if (!ev.resolved) {
      tally('event', {
        category: 'event',
        hasChoices: Array.isArray(ev.choices) && ev.choices.length > 0,
      })
    }
  }

  // ── weekly_decision ───────────────────────────────────────────────────────
  if (game.pendingWeeklyDecision) {
    tally('weekly_decision', { category: 'weekly_decision' })
  }

  // ── anslag — count unseen keys ────────────────────────────────────────────
  // We don't import all anslag keys here to stay lightweight; the number of
  // pending anslag is approximated as the ones computeNextAnslag would return.
  // Since computeNextAnslag returns at most 1 at a time, we check if there is
  // a next pending anslag by looking at whether seenAnslag is a subset of all
  // known anslag. As a practical instrument we count 0 or 1 — the caller can
  // invoke computeNextAnslag separately if it needs the exact key.
  // For a simple count we treat pendingAnslag as binary: 0 or 1 pending.
  // Design can refine this later.
  // (We import computeNextAnslag lazily to avoid circular dependency.)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { computeNextAnslag } = require('./anslagService') as { computeNextAnslag: (g: SaveGame) => unknown }
    if (computeNextAnslag(game) !== null) {
      tally('anslag', { category: 'anslag' })
    }
  } catch {
    // If anslagService is unavailable (e.g. test environments without it),
    // skip anslag count silently.
  }

  // ── phase_mark ────────────────────────────────────────────────────────────
  // Phase marks are season phases not yet in phaseMarksSeen.
  // All valid SeasonPhase values listed explicitly to avoid dynamic imports.
  const ALL_SEASON_PHASES: import('../data/seasonPhases').SeasonPhase[] = [
    'early', 'mid', 'endgame', 'playoff', 'spectator',
  ]
  const seen = new Set(game.phaseMarksSeen ?? [])
  const unseenPhases = ALL_SEASON_PHASES.filter(p => !seen.has(p))
  for (const _ of unseenPhases) {
    tally('phase_mark', { category: 'phase_mark' })
  }

  // ── scene ─────────────────────────────────────────────────────────────────
  if (game.pendingScene) {
    const choices = (game.sceneChoices != null)
      // sceneChoices is Record<string, string> — a pending scene that already
      // has a choice recorded counts as resolved; otherwise actionable if scene
      // has choices at all. We treat pendingScene as potentially actionable
      // since we can't cheaply inspect its choice list without importing
      // sceneTriggerService. Conservative: mark as informational unless
      // sceneChoices record is empty (meaning no choice yet made).
      ? Object.keys(game.sceneChoices)
      : []
    const alreadyChosen = choices.includes(game.pendingScene.sceneId)
    tally('scene', {
      category: 'scene',
      // If no choice has been made for this scene yet, treat as potentially
      // actionable — worst-case over-count, safe for Design's audit purpose.
      sceneChoices: alreadyChosen ? [] : ['pending'],
    })
  }

  return result
}
