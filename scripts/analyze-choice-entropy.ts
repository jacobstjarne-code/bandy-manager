/**
 * U9 — analysera val-entropi ur en eller flera exporterade save-filer.
 *
 * Kör:
 *   node_modules/.bin/vite-node scripts/analyze-choice-entropy.ts bandy-A.json bandy-B.json
 *   node_modules/.bin/vite-node scripts/analyze-choice-entropy.ts --json bandy-A.json
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import { analyzeChoiceEntropy, isResolvedChoice } from '../src/domain/services/choiceEntropyService'

const args = process.argv.slice(2)
const jsonOutput = args.includes('--json')
const paths = args.filter(arg => arg !== '--json')

if (paths.length === 0) {
  console.error('Ange minst en exporterad bandy-save (.json).')
  process.exitCode = 1
} else {
  const saves = paths.map(path => {
    const absolutePath = resolve(process.cwd(), path)
    const parsed = JSON.parse(readFileSync(absolutePath, 'utf8')) as unknown
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error(`${path}: roten är inte ett objekt`)
    }
    const candidate = parsed as Record<string, unknown>
    if (typeof candidate.id !== 'string') throw new Error(`${path}: save.id saknas`)
    if (candidate.resolvedChoices !== undefined
      && (!Array.isArray(candidate.resolvedChoices) || !candidate.resolvedChoices.every(isResolvedChoice))) {
      throw new Error(`${path}: resolvedChoices har ogiltigt format`)
    }
    return candidate as unknown as Pick<SaveGame, 'id' | 'resolvedChoices'>
  })

  const report = analyzeChoiceEntropy(saves)
  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(`Val-entropi: ${report.analyzedPlayerChoices} spelarval från ${paths.length} fil(er)`)
    console.log(`Uteslutna: ${report.excludedAutoChoices} auto, ${report.excludedLegacyOrUnknownChoices} äldre/okända, ${report.excludedDuplicateRecords} dubbletter`)
    if (report.possiblyTruncatedSaves > 0) {
      console.log(`Begränsning: ${report.possiblyTruncatedSaves} save(s) ligger på 200-posterscapen; äldre val kan ha fallit bort.`)
    }
    if (report.rows.length === 0) {
      console.log('Inga analyserbara spelarval ännu. Nya val måste göras efter U9-loggutökningen.')
    }
    for (const row of report.rows) {
      const status = row.passesDominanceGate ? 'GODKÄND' : 'DOMINANT'
      const distribution = row.choices
        .map(choiceRow => `${choiceRow.choiceId}=${choiceRow.count} (${(choiceRow.share * 100).toFixed(1)} %)`)
        .join(', ')
      console.log(`${status} ${row.eventType}: n=${row.total}, max=${(row.dominantShare * 100).toFixed(1)} %, H=${row.normalizedEntropy.toFixed(3)} — ${distribution}`)
    }
  }
}
