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
import { getCoffeeRoomScene } from './coffeeRoomService'

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

/**
 * Resolves whether the concrete pending scene in a save requires a player
 * choice. PendingScene deliberately stores only the scene id, so this is the
 * single adapter between scene state and the generic interrupt classifier.
 */
export function isPendingSceneActionable(game: SaveGame): boolean {
  const sceneId = game.pendingScene?.sceneId
  if (!sceneId) return false

  if (sceneId === 'sunday_training' || sceneId === 'valet') {
    return classifyInterrupt({ category: 'scene', sceneChoices: ['choice'] }) === 'actionable'
  }

  if (sceneId === 'coffee_room') {
    const hasQuestion = getCoffeeRoomScene(game)?.question != null
    return classifyInterrupt({
      category: 'scene',
      sceneChoices: hasQuestion ? ['choice'] : [],
    }) === 'actionable'
  }

  return false
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
  // Phase marks are the markable PortalPhase values not yet in phaseMarksSeen.
  // 2026-07-19: uppdaterad till sjufasmodellens fem faktiskt markerbara faser
  // (annandagen/vinterkris/våroffensiv/slutspurt/playoff) + spectator (egen
  // markör, PortalSpectatorMark.tsx). 'early'/'mid'/'endgame' fanns aldrig
  // markerbara i praktiken (early/mid saknade PHASEMARK_LABELS-post; endgame
  // är nu retirerad) — listan speglar nu vad som verkligen kan visas.
  const ALL_MARKABLE_PHASES: import('../data/seasonPhases').PortalPhase[] = [
    'annandagen', 'vinterkris', 'våroffensiv', 'slutspurt', 'playoff', 'spectator',
  ]
  const seen = new Set(game.phaseMarksSeen ?? [])
  const unseenPhases = ALL_MARKABLE_PHASES.filter(p => !seen.has(p))
  for (const _ of unseenPhases) {
    tally('phase_mark', { category: 'phase_mark' })
  }

  // ── scene ─────────────────────────────────────────────────────────────────
  if (game.pendingScene) {
    tally('scene', {
      category: 'scene',
      sceneChoices: isPendingSceneActionable(game) ? ['pending'] : [],
    })
  }

  return result
}
