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
  decisionTemplateKey: string
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
  excludedAcknowledgements: number
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
 * Samma save kan exporteras flera gånger; `(save.id, resolutionId)`
 * dedupliceras därför innan fördelningen räknas. Event-id räcker inte:
 * samma förhandling kan bära motbud och slutsvar som två mänskliga steg.
 * Bara explicit spelarattribuerade flervalsbeslut med lagrad eventType och
 * beslutsmallsidentitet ingår. Bred eventType får aldrig slå ihop olika
 * choice sets och därmed maskera ett dominant alternativ i en enskild mall.
 * Äldre poster, kvittenser och auto-resolutioner rapporteras separat och får
 * aldrig smyga in i spelarens valfördelning.
 */
export function analyzeChoiceEntropy(
  saves: readonly ChoiceEntropySave[],
  dominanceLimit = CHOICE_DOMINANCE_LIMIT,
): ChoiceEntropyReport {
  const seen = new Set<string>()
  const byTemplate = new Map<string, { eventType: GameEventType; choiceCounts: Map<string, number> }>()
  let totalRecords = 0
  let analyzedPlayerChoices = 0
  let excludedAutoChoices = 0
  let excludedAcknowledgements = 0
  let excludedLegacyOrUnknownChoices = 0
  let excludedDuplicateRecords = 0
  let possiblyTruncatedSaves = 0

  for (const save of saves) {
    if ((save.resolvedChoices?.length ?? 0) >= 200) possiblyTruncatedSaves++
    for (const choice of save.resolvedChoices ?? []) {
      totalRecords++
      // Nya poster har en egen resolutionsidentitet. Legacy-fallbacken bär
      // hela det observerade steget: ett transfermotbud och dess senare
      // slutsvar delar eventId men är två verkliga handlingar. Samma post i
      // två exporter av samma save har däremot samma choiceId + label.
      const recordIdentity = choice.resolutionId
        ?? `${choice.eventId}\u0000${choice.choiceId}\u0000${choice.label}`
      const dedupeKey = `${save.id}\u0000${recordIdentity}`
      if (seen.has(dedupeKey)) {
        excludedDuplicateRecords++
        continue
      }
      seen.add(dedupeKey)

      if (choice.madeByPlayer === false) {
        excludedAutoChoices++
        continue
      }
      if (choice.madeByPlayer !== true
        || choice.eventType === undefined
        || choice.decisionKind === undefined
        || choice.decisionTemplateKey === undefined) {
        excludedLegacyOrUnknownChoices++
        continue
      }
      if (choice.decisionKind === 'acknowledgement') {
        excludedAcknowledgements++
        continue
      }

      analyzedPlayerChoices++
      const template = byTemplate.get(choice.decisionTemplateKey) ?? {
        eventType: choice.eventType,
        choiceCounts: new Map<string, number>(),
      }
      template.choiceCounts.set(choice.choiceId, (template.choiceCounts.get(choice.choiceId) ?? 0) + 1)
      byTemplate.set(choice.decisionTemplateKey, template)
    }
  }

  const rows = [...byTemplate.entries()].map(([decisionTemplateKey, { eventType, choiceCounts }]): ChoiceEntropyRow => {
    const total = [...choiceCounts.values()].reduce((sum, count) => sum + count, 0)
    const choices = [...choiceCounts.entries()]
      .map(([choiceId, count]) => ({ choiceId, count, share: count / total }))
      .sort((a, b) => b.count - a.count || a.choiceId.localeCompare(b.choiceId))
    const dominant = choices[0]
    return {
      eventType,
      decisionTemplateKey,
      total,
      choices,
      dominantChoiceId: dominant.choiceId,
      dominantShare: dominant.share,
      normalizedEntropy: normalizedEntropy(choices.map(choice => choice.count)),
      passesDominanceGate: dominant.share <= dominanceLimit,
    }
  }).sort((a, b) => Number(a.passesDominanceGate) - Number(b.passesDominanceGate)
    || b.dominantShare - a.dominantShare
    || a.eventType.localeCompare(b.eventType)
    || a.decisionTemplateKey.localeCompare(b.decisionTemplateKey))

  return {
    rows,
    totalRecords,
    analyzedPlayerChoices,
    excludedAutoChoices,
    excludedAcknowledgements,
    excludedLegacyOrUnknownChoices,
    excludedDuplicateRecords,
    possiblyTruncatedSaves,
  }
}

export function isResolvedChoice(value: unknown): value is ResolvedChoice {
  if (typeof value !== 'object' || value === null) return false
  const choice = value as Record<string, unknown>
  return typeof choice.eventId === 'string'
    && (choice.resolutionId === undefined || typeof choice.resolutionId === 'string')
    && typeof choice.choiceId === 'string'
    && typeof choice.label === 'string'
    && (choice.eventType === undefined
      || (typeof choice.eventType === 'string' && Object.hasOwn(EVENT_TYPE_LABELS, choice.eventType)))
    && (choice.decisionTemplateKey === undefined || typeof choice.decisionTemplateKey === 'string')
    && (choice.madeByPlayer === undefined || typeof choice.madeByPlayer === 'boolean')
    && (choice.decisionKind === undefined
      || choice.decisionKind === 'decision'
      || choice.decisionKind === 'acknowledgement')
}
