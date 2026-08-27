import { describe, it, expect } from 'vitest'
import { scanStandingPositionReads } from '../../tests/grind/standingPositionReadGate'

/**
 * PÅSTÅENDEKARTAN, LÄST-FÖRE-INITIERING (2026-08-26, sjätte arten). Se
 * tests/grind/standingPositionReadGate.ts för rotorsak och metod — en
 * kodbas-bred variant av samma "billiga nivå 2"-grep som forbudslistan.ts,
 * eftersom detta mönster kan dyka upp i VILKEN NY FUNKTION som helst, inte
 * bara i redan kända filer.
 *
 * Baseline är 0. Ett brott betyder antingen en ny, oskyddad läsning av
 * standing.position (fixa med safeStandingPosition) eller en legitimt
 * säker ny läsning som INTE lagts till i undantagslistan än (lägg till
 * den, med en verifierad anledning — inte en gissning).
 */
describe('PÅSTÅENDEKARTAN — standing.position läst-före-initiering-grinden', () => {
  it('inga onoterade läsningar av standing.position i src/', () => {
    const violations = scanStandingPositionReads()
    if (violations.length > 0) {
      throw new Error(
        `${violations.length} fil(er) läser standing.position rått, utanför undantagslistan:\n` +
        violations.map(v => `  - ${v.file} (${v.count}×)`).join('\n') +
        '\n\nAnvänd safeStandingPosition (standingsService.ts), eller lägg till filen i ALLOWLIST med en verifierad anledning.',
      )
    }
    expect(violations).toEqual([])
  })
})

describe('standingPositionReadGate — mönstret fångar den historiska buggen', () => {
  it('fångar den råa formen (bestFinish-buggens form, förenklad)', async () => {
    const { stripComments } = await import('../../tests/grind/forbudslistan')
    const RAW_PATTERN = /\.find\([^)]*clubId[^)]*\)\s*\??\.\s*position\b/g
    const bug = "const pos = game.standings.find(s => s.clubId === game.managedClubId)?.position ?? 8"
    expect(stripComments(bug).match(RAW_PATTERN)).not.toBeNull()
  })

  it('ger INTE falskt utslag på player.position (PlayerPosition, helt orelaterat fält)', () => {
    const RAW_PATTERN = /\.find\([^)]*clubId[^)]*\)\s*\??\.\s*position\b/g
    const notABug = "const pos = player.position"
    expect(notABug.match(RAW_PATTERN)).toBeNull()
    const alsoNotABug = "const gk = players.find(p => p.position === PlayerPosition.Goalkeeper)"
    expect(alsoNotABug.match(RAW_PATTERN)).toBeNull()
  })
})
