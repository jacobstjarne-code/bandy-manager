import { describe, it, expect } from 'vitest'
import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { checkMutationGate, findBuilderChecks } from '../../tests/grind/mutationVerificationGate'

/**
 * Mutationsverifieringsgrinden — den andra strukturella fixen från
 * PASTAENDEKARTAN-omdiagnosen (2026-08-24, "NÄR, inte VAR"). Se
 * tests/grind/mutationVerificationGate.ts:s filhuvud för hela resonemanget.
 *
 * Samma disciplin som nivå 1/nivå 2: baseline-noll mot riktig kod + ett
 * meta-test som återskapar den historiska take_loan-buggen (gameAfter
 * mottagen men aldrig dereferererad) i en syntetisk fil och bevisar att
 * grinden faktiskt slår larm på den, inte bara att den råkar vara tyst idag.
 */

const REAL_FILE = join(__dirname, '../domain/services/seasonDecisionCaptureService.ts')

describe('Mutationsverifieringsgrinden', () => {
  it('baseline: alla byggare i seasonDecisionCaptureService.ts BUILDERS dereferererar gameAfter (H3-passet, 2026-08-24)', () => {
    const violations = checkMutationGate(REAL_FILE)
    expect(violations, JSON.stringify(violations, null, 2)).toHaveLength(0)
  })

  it('rapporterar antal byggare (facit: 8, ett per (event.type, choiceId)-par i O18 fält 2:s slutna mängd)', () => {
    const checks = findBuilderChecks(REAL_FILE)
    expect(checks.length).toBe(8)
    console.log(`Byggare: ${checks.map(c => `${c.eventType}/${c.choiceId}`).join(', ')}`)
  })

  it('meta: återskapar take_loan-buggen (gameAfter mottagen, aldrig dereferererad) — grinden ska fånga den', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mutation-gate-meta-'))
    const file = join(dir, 'fakeBuilders.ts')
    writeFileSync(file, `
      const BUILDERS = {
        criticalEconomy: {
          take_loan: (_gameBefore, gameAfter, event) => {
            // Historisk bugg: skrev meningen oavsett utfall, choiceId ensamt,
            // gameAfter mottagen men aldrig läst.
            return { eventId: event.id, sentence: 'Du tog lånet.' }
          },
        },
      }
    `)
    try {
      const violations = checkMutationGate(file)
      expect(violations.length, 'grinden missade den återskapade take_loan-buggen').toBeGreaterThan(0)
      expect(violations[0].detail).toMatch(/dereferererar den aldrig/)
    } finally {
      unlinkSync(file)
    }
  })

  it('meta: en byggare som medvetet inte behöver gameAfter ska prefixa den ("_gameAfter"), annars flaggas den', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mutation-gate-meta-'))
    const file = join(dir, 'fakeBuilders2.ts')
    writeFileSync(file, `
      const BUILDERS = {
        criticalEconomy: {
          sneaky: (gameBefore, gameAfter, event) => {
            return { eventId: event.id, sentence: 'Alltid sant, oavsett.' }
          },
        },
      }
    `)
    try {
      const violations = checkMutationGate(file)
      expect(violations.some(v => v.detail.includes('dereferererar den aldrig'))).toBe(true)
    } finally {
      unlinkSync(file)
    }
  })

  it('friskt: en byggare som verkligen dereferererar gameAfter flaggas inte', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mutation-gate-meta-'))
    const file = join(dir, 'fakeBuilders3.ts')
    writeFileSync(file, `
      const BUILDERS = {
        criticalEconomy: {
          take_loan: (_gameBefore, gameAfter, event) => {
            if (gameAfter.economicCrisisState?.outcome !== 'loan') return null
            return { eventId: event.id, sentence: 'Du tog lånet.' }
          },
        },
      }
    `)
    try {
      const violations = checkMutationGate(file)
      expect(violations).toHaveLength(0)
    } finally {
      unlinkSync(file)
    }
  })
})
