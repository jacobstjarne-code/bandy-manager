/**
 * B6 (2026-07-19) — textmått i stresstestet.
 *
 * Motivering: asymmetrin i mecenatkravens pooler (nio speltidsrader mot tre
 * i de tre andra kategorierna) upptäcktes manuellt. Detta måttet hade fångat
 * den automatiskt — samma klass av problem (obalanserad variation, samma
 * sträng som återkommer för ofta, en karaktär som är tyst för länge) är
 * annars osynlig tills en spelare råkar lägga märke till den.
 *
 * Mäter, per säsong, ur den headlessa simuleringens game.inbox:
 *   - hur ofta samma sträng (body) återkommer
 *   - antal texter per omgång
 *   - andel som kräver handling (proxy: InboxItem.expiresRound satt —
 *     "Decision items: expiry round (required on decision-bearing items)",
 *     redan etablerat fält, ingen ny tagging uppfunnen) kontra ren atmosfär
 *   - antal omgångar mellan en återkommande karaktärs repliker (proxy:
 *     InboxItem.fromRole — redan satt av doktor/assistenttränare-flödena;
 *     items utan fromRole kan inte attribueras till en karaktär och räknas
 *     inte in i det måttet)
 */

import type { InboxItem } from '../../src/domain/entities/Inbox'

export interface TextMetricsAccumulator {
  totalTexts: number
  roundsWithText: Set<number>
  stringCounts: Map<string, number>
  actionableCount: number
  atmosphereCount: number
  /** Senaste omgång varje karaktär (fromRole) syntes, för att räkna mellanrum. */
  characterLastRound: Map<string, number>
  /** Alla observerade mellanrum (omgångar) mellan en karaktärs på-varandra-följande repliker. */
  characterGaps: number[]
}

export function newTextMetricsAccumulator(): TextMetricsAccumulator {
  return {
    totalTexts: 0,
    roundsWithText: new Set(),
    stringCounts: new Map(),
    actionableCount: 0,
    atmosphereCount: 0,
    characterLastRound: new Map(),
    characterGaps: [],
  }
}

export function recordInboxTextMetrics(
  newItems: InboxItem[],
  round: number,
  acc: TextMetricsAccumulator,
): void {
  if (newItems.length === 0) return
  acc.roundsWithText.add(round)

  for (const item of newItems) {
    acc.totalTexts++

    const key = item.body
    acc.stringCounts.set(key, (acc.stringCounts.get(key) ?? 0) + 1)

    if (item.expiresRound !== undefined) acc.actionableCount++
    else acc.atmosphereCount++

    if (item.fromRole) {
      const last = acc.characterLastRound.get(item.fromRole)
      if (last !== undefined && round > last) {
        acc.characterGaps.push(round - last)
      }
      acc.characterLastRound.set(item.fromRole, round)
    }
  }
}

export interface TextMetricsSummary {
  totalTexts: number
  uniqueStrings: number
  duplicateStrings: number
  maxStringRepeats: number
  textsPerRoundAvg: number
  actionableRatio: number
  avgCharacterGapRounds: number | null
  maxCharacterGapRounds: number | null
}

export function summarizeTextMetrics(acc: TextMetricsAccumulator, totalRounds: number): TextMetricsSummary {
  const repeats = [...acc.stringCounts.values()]
  const duplicateStrings = repeats.filter(c => c > 1).length
  const maxStringRepeats = repeats.length > 0 ? Math.max(...repeats) : 0
  const actionableTotal = acc.actionableCount + acc.atmosphereCount

  return {
    totalTexts: acc.totalTexts,
    uniqueStrings: acc.stringCounts.size,
    duplicateStrings,
    maxStringRepeats,
    textsPerRoundAvg: totalRounds > 0 ? acc.totalTexts / totalRounds : 0,
    actionableRatio: actionableTotal > 0 ? acc.actionableCount / actionableTotal : 0,
    avgCharacterGapRounds: acc.characterGaps.length > 0
      ? acc.characterGaps.reduce((s, g) => s + g, 0) / acc.characterGaps.length
      : null,
    maxCharacterGapRounds: acc.characterGaps.length > 0 ? Math.max(...acc.characterGaps) : null,
  }
}
