import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { verifyFiringCalibrationReport } from './firing-calibration-acceptance'

const DEFAULT_REPORT = 'docs/matningar/AVSKEDSKALIBRERING_FORMELL_10000_2026-09-07.json'
const reportPath = resolve(process.argv[2] ?? DEFAULT_REPORT)

let report: unknown
try {
  report = JSON.parse(await readFile(reportPath, 'utf8'))
} catch (error) {
  console.error(`Kunde inte läsa kalibreringsrapporten ${reportPath}: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 2
  process.exit()
}

const acceptance = verifyFiringCalibrationReport(report)
for (const summary of acceptance.summaries) {
  console.log(`${summary.clubName}: ${(summary.firingRate * 100).toFixed(2)} %`)
}

if (!acceptance.ok) {
  console.error('\nAVSKEDSKALIBRERING UNDERKÄND')
  for (const issue of acceptance.issues) console.error(`- ${issue}`)
  process.exitCode = 1
} else {
  console.log('\nAVSKEDSKALIBRERING GODKÄND')
}

