import type { InboxItem } from '../entities/Inbox'
import type { ManagerNarrativeEntry } from '../entities/ManagerProfile'
import type { Player } from '../entities/Player'

export type PersistedTextSource = 'inbox' | 'player_diary' | 'manager_diary'

export interface RepeatedTextRow {
  text: string
  count: number
  sources: PersistedTextSource[]
}

export interface TextRepetitionSourceSummary {
  source: PersistedTextSource
  totalTexts: number
  uniqueStrings: number
  duplicateStrings: number
  maxStringRepeats: number
}

export interface TextRepetitionReport {
  totalRecords: number
  analyzedTexts: number
  uniqueStrings: number
  duplicateStrings: number
  repeatedOccurrences: number
  maxStringRepeats: number
  excludedDuplicateRecords: number
  bySource: TextRepetitionSourceSummary[]
  repeats: RepeatedTextRow[]
}

/** Minsta källform som både en riktig save och CLI-validatorn kan garantera. */
export interface TextRepetitionSave {
  id: string
  inbox: Array<Pick<InboxItem, 'id' | 'title' | 'body'>>
  players: Array<{ id: string; diary?: Player['diary'] }>
  managerProfile?: { diary?: ManagerNarrativeEntry[] }
}

interface TextRecord {
  recordKey: string
  source: PersistedTextSource
  text: string
}

const SOURCES: PersistedTextSource[] = ['inbox', 'player_diary', 'manager_diary']

function diaryRecordKey(
  ownerId: string,
  entry: { season: number; matchday: number; type: string; text: string },
  occurrence: number,
): string {
  return `${ownerId}\u0000${entry.season}\u0000${entry.matchday}\u0000${entry.type}\u0000${entry.text}\u0000${occurrence}`
}

function collectRecords(save: TextRepetitionSave): TextRecord[] {
  const records: TextRecord[] = save.inbox.map(item => ({
    recordKey: `${save.id}\u0000inbox\u0000${item.id}`,
    source: 'inbox',
    // Samma exakta identitet som stress/textMetrics.ts. Rubriken behövs:
    // vissa riktiga poster har konstant eller tom body och varierar bara där.
    text: `${item.title}\n${item.body}`,
  }))

  for (const player of save.players) {
    const occurrences = new Map<string, number>()
    for (const entry of player.diary ?? []) {
      const base = `${entry.season}\u0000${entry.matchday}\u0000${entry.type}\u0000${entry.text}`
      const occurrence = occurrences.get(base) ?? 0
      occurrences.set(base, occurrence + 1)
      records.push({
        recordKey: `${save.id}\u0000player_diary\u0000${diaryRecordKey(player.id, entry, occurrence)}`,
        source: 'player_diary',
        text: entry.text,
      })
    }
  }

  const managerOccurrences = new Map<string, number>()
  for (const entry of save.managerProfile?.diary ?? []) {
    const base = `${entry.season}\u0000${entry.matchday}\u0000${entry.type}\u0000${entry.text}`
    const occurrence = managerOccurrences.get(base) ?? 0
    managerOccurrences.set(base, occurrence + 1)
    records.push({
      recordKey: `${save.id}\u0000manager_diary\u0000${diaryRecordKey('manager', entry, occurrence)}`,
      source: 'manager_diary',
      text: entry.text,
    })
  }

  return records
}

function summarizeCounts(source: PersistedTextSource, counts: Map<string, number>): TextRepetitionSourceSummary {
  const repeats = [...counts.values()]
  return {
    source,
    totalTexts: repeats.reduce((sum, count) => sum + count, 0),
    uniqueStrings: counts.size,
    duplicateStrings: repeats.filter(count => count > 1).length,
    maxStringRepeats: repeats.length > 0 ? Math.max(...repeats) : 0,
  }
}

/**
 * U9 — exakt textupprepning ur en eller flera riktiga save-exporter.
 *
 * Ingen trimning, case-foldning eller malltolkning görs: mätetalet är samma
 * exakta strängmått som stressverktygets `title + "\\n" + body`. De två
 * beständiga dagböckerna har bara `text` och mäts därför på det fältet.
 * `narrativeBeatLog` ingår avsiktligt inte — det är en intern gating-logg
 * utan spelarsynlig text. Överlappande exporter av samma save dedupliceras
 * på postidentitet innan textfrekvenserna räknas.
 */
export function analyzeTextRepetition(saves: readonly TextRepetitionSave[]): TextRepetitionReport {
  const seenRecords = new Set<string>()
  const counts = new Map<string, number>()
  const sourceCounts = new Map<PersistedTextSource, Map<string, number>>(
    SOURCES.map(source => [source, new Map<string, number>()]),
  )
  const textSources = new Map<string, Set<PersistedTextSource>>()
  let totalRecords = 0
  let excludedDuplicateRecords = 0

  for (const save of saves) {
    for (const record of collectRecords(save)) {
      totalRecords++
      if (seenRecords.has(record.recordKey)) {
        excludedDuplicateRecords++
        continue
      }
      seenRecords.add(record.recordKey)
      counts.set(record.text, (counts.get(record.text) ?? 0) + 1)
      const perSource = sourceCounts.get(record.source)!
      perSource.set(record.text, (perSource.get(record.text) ?? 0) + 1)
      const sources = textSources.get(record.text) ?? new Set<PersistedTextSource>()
      sources.add(record.source)
      textSources.set(record.text, sources)
    }
  }

  const repeats = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([text, count]): RepeatedTextRow => ({
      text,
      count,
      sources: SOURCES.filter(source => textSources.get(text)?.has(source)),
    }))
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text))
  const frequencies = [...counts.values()]

  return {
    totalRecords,
    analyzedTexts: frequencies.reduce((sum, count) => sum + count, 0),
    uniqueStrings: counts.size,
    duplicateStrings: repeats.length,
    repeatedOccurrences: frequencies.reduce((sum, count) => sum + Math.max(0, count - 1), 0),
    maxStringRepeats: frequencies.length > 0 ? Math.max(...frequencies) : 0,
    excludedDuplicateRecords,
    bySource: SOURCES.map(source => summarizeCounts(source, sourceCounts.get(source)!)),
    repeats,
  }
}

export function isTextRepetitionSave(value: unknown): value is TextRepetitionSave {
  if (typeof value !== 'object' || value === null) return false
  const save = value as Record<string, unknown>
  if (typeof save.id !== 'string' || !Array.isArray(save.inbox) || !Array.isArray(save.players)) return false

  const validInbox = save.inbox.every(value => {
    if (typeof value !== 'object' || value === null) return false
    const item = value as Record<string, unknown>
    return typeof item.id === 'string' && typeof item.title === 'string' && typeof item.body === 'string'
  })
  const validDiary = (value: unknown): boolean => value === undefined || (Array.isArray(value) && value.every(entry => {
    if (typeof entry !== 'object' || entry === null) return false
    const row = entry as Record<string, unknown>
    return typeof row.season === 'number' && typeof row.matchday === 'number'
      && typeof row.type === 'string' && typeof row.text === 'string'
  }))
  const validPlayers = save.players.every(value => {
    if (typeof value !== 'object' || value === null) return false
    const player = value as Record<string, unknown>
    return typeof player.id === 'string' && validDiary(player.diary)
  })
  if (!validInbox || !validPlayers) return false
  if (save.managerProfile === undefined) return true
  if (typeof save.managerProfile !== 'object' || save.managerProfile === null) return false
  return validDiary((save.managerProfile as Record<string, unknown>).diary)
}
