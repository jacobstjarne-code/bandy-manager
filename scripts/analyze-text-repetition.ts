/**
 * U9 — analysera exakt textupprepning ur en eller flera exporterade saves.
 *
 * Kör:
 *   npm run analyze:text-repetition -- bandy-A.json bandy-B.json
 *   npm run analyze:text-repetition -- --json bandy-A.json
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  analyzeTextRepetition,
  isTextRepetitionSave,
} from '../src/domain/services/textRepetitionService'

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
    if (!isTextRepetitionSave(parsed)) {
      throw new Error(`${path}: ogiltig save eller ogiltiga persistenta textfält`)
    }
    return parsed
  })

  const report = analyzeTextRepetition(saves)
  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(`Exakt textupprepning: ${report.analyzedTexts} texter, ${report.uniqueStrings} unika`)
    console.log(`Dubblettsträngar: ${report.duplicateStrings}; extra förekomster: ${report.repeatedOccurrences}; högsta upprepning: ${report.maxStringRepeats}x`)
    console.log(`Överlappande exportposter uteslutna: ${report.excludedDuplicateRecords}`)
    for (const source of report.bySource) {
      console.log(`${source.source}: ${source.totalTexts} texter, ${source.duplicateStrings} dubblettsträngar, max ${source.maxStringRepeats}x`)
    }

    const visibleRows = report.repeats.slice(0, 20)
    for (const row of visibleRows) {
      console.log(`${row.count}x [${row.sources.join(', ')}] ${JSON.stringify(row.text)}`)
    }
    if (report.repeats.length > visibleRows.length) {
      console.log(`… ${report.repeats.length - visibleRows.length} ytterligare dubblettsträngar; använd --json för hela listan.`)
    }
    if (report.analyzedTexts === 0) {
      console.log('Exporten innehåller inga bevarade inkorgs- eller dagbokstexter att analysera.')
    }
    console.log('Avgränsning: en save är ett nulägessnapshot; redan gallrade inkorgsposter kan inte återskapas.')
  }
}
