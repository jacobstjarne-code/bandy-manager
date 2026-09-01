import { describe, it, expect } from 'vitest'
import { scanPreservationDeletions, readPreservedNames } from '../../tests/grind/preservationGate'

/**
 * GRIND 2 (SPEC_SANNINGSGRINDAR_2026-08-31.md) — bevarandetext-raderingsgrinden.
 * Se tests/grind/preservationGate.ts för rotorsak och metod: `d0d4d923`
 * raderade fyra bevarandelistade textpooler osynligt när filen de bodde i
 * togs bort av en annan anledning. Denna grind hade stoppat den raderingen
 * i CI, med namnet på det som togs bort.
 *
 * Baseline är 0 — varje namn i BEVARANDELISTA.mds maskinläsbara block är
 * antingen bevarad text-utan-yta (ska finnas orört i src/) eller en pool
 * som fått en yta (och då ska namnet tas bort ur blocket samtidigt, inte
 * lämnas kvar för grinden att fela på).
 */
describe('BEVARANDETEXT-RADERINGSGRINDEN — ingen bevarandelistad pool försvinner osynligt', () => {
  it('varje namn i BEVARANDELISTA.mds maskinläsbara block finns kvar i src/', () => {
    const violations = scanPreservationDeletions()
    if (violations.length > 0) {
      throw new Error(
        `${violations.length} bevarandelistad(e) export(er) hittas inte längre i src/:\n` +
        violations.map(v => `  - ${v.name}`).join('\n') +
        '\n\nÅterställ ur git-historiken (git log -S"<namn>"), eller — om exporten medvetet ' +
        'fick en yta och slutade vara text-utan-yta — ta bort raden ur BEVARANDELISTA.mds ' +
        '```bevarandelista-block i samma commit.',
      )
    }
    expect(violations).toEqual([])
  })

  it('blocket i BEVARANDELISTA.md går att läsa och är inte tomt', () => {
    const names = readPreservedNames()
    expect(names.length).toBeGreaterThan(0)
  })
})

describe('preservationGate — mönstret fångar den historiska raderingen', () => {
  it('flaggar ett namn som saknas helt i den svepta koden', async () => {
    const { stripComments } = await import('../../tests/grind/forbudslistan')
    const pattern = /\bHALL_DEBATE_SIDEKICK\b/
    const codeWithoutIt = "export const SOMETHING_ELSE = ['a', 'b']"
    expect(pattern.test(stripComments(codeWithoutIt))).toBe(false)
  })

  it('ignorerar namnet när det bara nämns i en kommentar (räknas ändå som borttaget)', async () => {
    const { stripComments } = await import('../../tests/grind/forbudslistan')
    const pattern = /\bHALL_DEBATE_SIDEKICK\b/
    const onlyComment = "// HALL_DEBATE_SIDEKICK togs bort här\nconst x = 1"
    expect(pattern.test(stripComments(onlyComment))).toBe(false)
  })

  it('hittar namnet när det faktiskt finns kvar som kod', async () => {
    const { stripComments } = await import('../../tests/grind/forbudslistan')
    const pattern = /\bHALL_DEBATE_SIDEKICK\b/
    const stillThere = "export const HALL_DEBATE_SIDEKICK = ['a', 'b']"
    expect(pattern.test(stripComments(stillThere))).toBe(true)
  })
})
