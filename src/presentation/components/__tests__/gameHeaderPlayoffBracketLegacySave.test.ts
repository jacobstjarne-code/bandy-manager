/**
 * sidofynd-gameheader-playoffbracket-legacy-save (Codex dagsrapport
 * 2026-09-03 §7, rapporterad → verifierad). REGRESSION: `bracket !== null`
 * fångade inte `undefined` — en save vars playoffBracket saknades helt
 * skulle nå `bracket.status` och krascha GameHeader. migrateSaveGame
 * backfyller redan undefined→null för varje riktig laddningsväg (verifierat
 * separat: saveGameMigration.ts:281, ovillkorat, körs för alla tre
 * migreringsingångarna i saveGameStorage.ts + gameStore.ts:s persist-
 * rehydrering) — kraschen är alltså inte reproducerbar via normal
 * spelgång idag, men kollen i sig var falsk trygghet. Fixat med `!= null`.
 */
import { describe, it, expect } from 'vitest'
import { isInPlayoffBracket } from '../GameHeader'
import { PlayoffStatus } from '../../../domain/enums'
import type { PlayoffBracket } from '../../../domain/entities/Playoff'

describe('GameHeader — isInPlayoffBracket', () => {
  it('undefined (den saknade-fält-legacy-saven) ger false, kraschar inte', () => {
    expect(() => isInPlayoffBracket(undefined)).not.toThrow()
    expect(isInPlayoffBracket(undefined)).toBe(false)
  })

  it('null (normalfallet utanför slutspel) ger false', () => {
    expect(isInPlayoffBracket(null)).toBe(false)
  })

  it('ett aktivt bracket (status ≠ Completed) ger true', () => {
    const bracket = { status: PlayoffStatus.InProgress } as PlayoffBracket
    expect(isInPlayoffBracket(bracket)).toBe(true)
  })

  it('ett avslutat bracket (status = Completed) ger false', () => {
    const bracket = { status: PlayoffStatus.Completed } as PlayoffBracket
    expect(isInPlayoffBracket(bracket)).toBe(false)
  })
})
