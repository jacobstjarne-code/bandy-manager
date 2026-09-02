import type { GameEventType } from '../entities/GameEvent'
import type { ResolvedChoice, SaveGame } from '../entities/SaveGame'
import { EVENT_TYPE_LABELS } from '../data/eventTypeLabels'

export const CHOICE_DOMINANCE_LIMIT = 0.8

export interface ChoiceCount {
  choiceId: string
  count: number
  share: number
}

export interface ChoiceEntropyRow {
  eventType: GameEventType
  total: number
  choices: ChoiceCount[]
  dominantChoiceId: string
  dominantShare: number
  normalizedEntropy: number
  passesDominanceGate: boolean
}

export interface ChoiceEntropyReport {
  rows: ChoiceEntropyRow[]
  totalRecords: number
  analyzedPlayerChoices: number
  excludedAutoChoices: number
  excludedLegacyOrUnknownChoices: number
  excludedDuplicateRecords: number
  possiblyTruncatedSaves: number
}

type ChoiceEntropySave = Pick<SaveGame, 'id' | 'resolvedChoices'>

function normalizedEntropy(counts: readonly number[]): number {
  if (counts.length <= 1) return 0
  const total = counts.reduce((sum, count) => sum + count, 0)
  if (total === 0) return 0
  const entropy = -counts.reduce((sum, count) => {
    if (count === 0) return sum
    const probability = count / total
    return sum + probability * Math.log(probability)
  }, 0)
  return entropy / Math.log(counts.length)
}

/**
 * U9 — lokal val-entropi från exporterade saves.
 *
 * Samma save kan exporteras flera gånger; `(save.id, eventId)` dedupliceras
 * därför innan fördelningen räknas. Bara explicit spelarattribuerade poster
 * med lagrad eventType ingår. Äldre poster och auto-resolutioner rapporteras
 * separat och får aldrig smyga in i spelarens valfördelning.
 */
export function analyzeChoiceEntropy(
  saves: readonly ChoiceEntropySave[],
  dominanceLimit = CHOICE_DOMINANCE_LIMIT,
): ChoiceEntropyReport {
  const seen = new Set<string>()
  const byEventType = new Map<GameEventType, Map<string, number>>()
  let totalRecords = 0
  let analyzedPlayerChoices = 0
  let excludedAutoChoices = 0
  let excludedLegacyOrUnknownChoices = 0
  let excludedDuplicateRecords = 0
  let possiblyTruncatedSaves = 0

  for (const save of saves) {
    if ((save.resolvedChoices?.length ?? 0) >= 200) possiblyTruncatedSaves++
    for (const choice of save.resolvedChoices ?? []) {
      totalRecords++
      const dedupeKey = `${save.id}\u0000${choice.eventId}`
      if (seen.has(dedupeKey)) {
        excludedDuplicateRecords++
        continue
      }
      seen.add(dedupeKey)

      if (choice.madeByPlayer === false) {
        excludedAutoChoices++
        continue
      }
      if (choice.madeByPlayer !== true || choice.eventType === undefined) {
        excludedLegacyOrUnknownChoices++
        continue
      }

      analyzedPlayerChoices++
      const choiceCounts = byEventType.get(choice.eventType) ?? new Map<string, number>()
      choiceCounts.set(choice.choiceId, (choiceCounts.get(choice.choiceId) ?? 0) + 1)
      byEventType.set(choice.eventType, choiceCounts)
    }
  }

  const rows = [...byEventType.entries()].map(([eventType, choiceCounts]): ChoiceEntropyRow => {
    const total = [...choiceCounts.values()].reduce((sum, count) => sum + count, 0)
    const choices = [...choiceCounts.entries()]
      .map(([choiceId, count]) => ({ choiceId, count, share: count / total }))
      .sort((a, b) => b.count - a.count || a.choiceId.localeCompare(b.choiceId))
    const dominant = choices[0]
    return {
      eventType,
      total,
      choices,
      dominantChoiceId: dominant.choiceId,
      dominantShare: dominant.share,
      normalizedEntropy: normalizedEntropy(choices.map(choice => choice.count)),
      passesDominanceGate: dominant.share <= dominanceLimit,
    }
  }).sort((a, b) => Number(a.passesDominanceGate) - Number(b.passesDominanceGate)
    || b.dominantShare - a.dominantShare
    || a.eventType.localeCompare(b.eventType))

  return {
    rows,
    totalRecords,
    analyzedPlayerChoices,
    excludedAutoChoices,
    excludedLegacyOrUnknownChoices,
    excludedDuplicateRecords,
    possiblyTruncatedSaves,
  }
}

export function isResolvedChoice(value: unknown): value is ResolvedChoice {
  if (typeof value !== 'object' || value === null) return false
  const choice = value as Record<string, unknown>
  return typeof choice.eventId === 'string'
    && typeof choice.choiceId === 'string'
    && typeof choice.label === 'string'
    && (choice.eventType === undefined
      || (typeof choice.eventType === 'string' && Object.hasOwn(EVENT_TYPE_LABELS, choice.eventType)))
    && (choice.madeByPlayer === undefined || typeof choice.madeByPlayer === 'boolean')
}
