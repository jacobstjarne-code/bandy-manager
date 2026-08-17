import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * A3 (2026-08-17): fjärde gången i serien (efter respondToIncomingBid/resolveEvent
 * m.fl.) som två kodvägar leder till samma tillståndsändring och bara en bär
 * städningen. saveLiveMatchResult/concedeWalkover muterade playoffBracket direkt
 * utan att gå via processPlayoffRound, så staleEventIds-mekanismen (H-02) och
 * isPlayoffNarrativeCardStillValid-filtret aldrig triggades för den vägen —
 * spelaren kunde se ett slutspelskort som redan var inaktuellt.
 *
 * Detta test kan inte verifiera SEMANTISK korrekthet (att en ny anropare
 * faktiskt filtrerar pendingEvents/deferredDecisions rätt) — det är inte
 * mekaniskt kontrollerbart över en asymmetrisk kedja (matchActions.ts
 * applicerar grinden direkt vid mutationsstället, roundProcessor.ts applicerar
 * den ett steg upp från playoffProcessor.ts). Vad det GARANTERAR: om en NY fil
 * börjar anropa advancePlayoffRound/updateSeriesAfterMatch failar testet,
 * vilket tvingar en medveten uppdatering av allowlistan här — istället för att
 * den nya vägen tyst saknar grinden, vilket är precis hur denna bugg uppstod.
 */

const SRC_ROOT = join(__dirname, '../../..')

const KNOWN_CALLERS = new Set([
  'application/useCases/processors/playoffProcessor.ts',
  'presentation/store/actions/matchActions.ts',
])

const CALL_PATTERN = /\b(advancePlayoffRound|updateSeriesAfterMatch)\s*\(/

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '__tests__') continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      walk(full, out)
    } else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith('.test.ts') && !entry.endsWith('.test.tsx')) {
      out.push(full)
    }
  }
  return out
}

describe('playoffBracket-mutationsvägar', () => {
  it('advancePlayoffRound/updateSeriesAfterMatch anropas bara från kända, grindade platser', () => {
    const files = walk(SRC_ROOT)
    const callers = files
      .filter(f => !f.endsWith('domain/services/playoffService.ts'))
      .filter(f => CALL_PATTERN.test(readFileSync(f, 'utf-8')))
      .map(f => relative(SRC_ROOT, f).replace(/\\/g, '/'))
      .sort()

    expect(
      callers,
      'En ny anropare av advancePlayoffRound/updateSeriesAfterMatch upptäcktes. ' +
      'Denna funktion muterar playoffBracket, vilket kan göra befintliga ' +
      'playoff-narrativkort (pendingEvents/deferredDecisions) inaktuella — se ' +
      'JSDoc-kommentaren vid båda funktionerna i playoffService.ts. Innan denna ' +
      'lista uppdateras: bekräfta att den nya anroparen filtrerar ' +
      'game.pendingEvents/deferredDecisions via isPlayoffNarrativeCardStillValid ' +
      '(direkt, som matchActions.ts, eller ett steg upp i anropskedjan, som ' +
      'roundProcessor.ts gör för playoffProcessor.ts) innan den läggs till här.'
    ).toEqual([...KNOWN_CALLERS].sort())
  })

  it('matchActions.ts filtrerar direkt vid mutationsstället (isPlayoffNarrativeCardStillValid)', () => {
    const content = readFileSync(join(SRC_ROOT, 'presentation/store/actions/matchActions.ts'), 'utf-8')
    expect(content).toContain('isPlayoffNarrativeCardStillValid')
  })

  it('roundProcessor.ts filtrerar ett steg upp för playoffProcessor.ts (isPlayoffNarrativeCardStillValid)', () => {
    const content = readFileSync(join(SRC_ROOT, 'application/useCases/roundProcessor.ts'), 'utf-8')
    expect(content).toContain('isPlayoffNarrativeCardStillValid')
  })
})
