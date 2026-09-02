/**
 * U9 — retrospektiv avskedsfrekvens från riktiga save-exporter.
 *
 * Kör:
 *   npm run analyze:firing-frequency -- bandy-A.json bandy-B.json
 *   npm run analyze:firing-frequency -- --json bandy-A.json
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { BOARD_EXPECTATION_LEVEL_LABEL } from '../src/domain/services/boardService'
import {
  analyzeFiringFrequency,
  isFiringAnalysisSave,
} from '../src/domain/services/firingFrequencyService'

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
    if (!isFiringAnalysisSave(parsed)) {
      throw new Error(`${path}: ogiltig save eller ofullständigt retrospektivt underlag`)
    }
    return parsed
  })

  const report = analyzeFiringFrequency(saves)
  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    const overall = report.firingRate === null ? '—' : `${(report.firingRate * 100).toFixed(1)} %`
    console.log(`Avskedsfrekvens: ${report.firings}/${report.analyzedManagerSeasons} manager-säsonger (${overall})`)
    console.log(`Uteslutna: ${report.excludedUnknownHistoricalSeasons} äldre säsonger utan belagt utfall, ${report.excludedDuplicateRecords} överlappande exportposter`)
    console.log(`Terminala avsked utan season-truth: ${report.terminalFiringsWithoutSeasonTruth}`)
    for (const row of report.rows) {
      const reasons = Object.entries(row.reasons)
        .filter(([, count]) => count > 0)
        .map(([reason, count]) => `${reason}=${count}`)
        .join(', ')
      console.log(`${BOARD_EXPECTATION_LEVEL_LABEL[row.clubProfile]}: ${row.firings}/${row.observedManagerSeasons} (${(row.firingRate * 100).toFixed(1)} %)${reasons ? ` — ${reasons}` : ''}`)
    }
    if (report.analyzedManagerSeasons === 0) {
      console.log('Inga säsonger med fruset boardTruth eller explicita terminala avsked hittades.')
    }
  }
}
