/**
 * liggare-ny-community-shift (RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md §3):
 * en communityStanding-tröskelkorsning (30/50/70) skriver nu en
 * community_shift-post samma omgång den händer — mätt genom den riktiga
 * rundprocessorn (samma sanning spelaren faktiskt ser), inte en isolerad
 * beräkning. Startvärden/utfall är verifierade mot fast seed 3, club_forsbacka,
 * omgång 1 — se testens egna kommentarer för de faktiska cs-talen.
 */
import { describe, expect, it } from 'vitest'
import { createNewGame } from '../createNewGame'
import { advanceToNextEvent } from '../roundProcessor'
import type { SaveGame } from '../../../domain/entities/SaveGame'

function baseGame(communityStanding: number): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 3 })
  return { ...game, communityStanding }
}

describe('roundProcessor — community_shift-post vid faktisk tröskelkorsning', () => {
  it('49→50 (korsar 50-tröskeln): skriver en community_shift-post, direction up', () => {
    const result = advanceToNextEvent(baseGame(49), 1)

    expect(result.game.communityStanding).toBe(50)
    const entry = result.game.eventLedger?.find(e => e.type === 'community_shift')
    expect(entry).toMatchObject({
      type: 'community_shift',
      clubId: 'club_forsbacka',
      significance: 55,
      communityShift: { from: 49, to: 50, direction: 'up' },
    })
  })

  it('45→46 (ingen tröskel korsad): ingen community_shift-post skrivs', () => {
    const result = advanceToNextEvent(baseGame(45), 1)

    expect(result.game.communityStanding).toBe(46)
    expect(result.game.eventLedger?.find(e => e.type === 'community_shift')).toBeUndefined()
  })

  it('semanticKey är matchdagsspecifik — samma säsong kan i princip korsa flera gånger utan kollision', () => {
    const result = advanceToNextEvent(baseGame(49), 1)
    const entry = result.game.eventLedger?.find(e => e.type === 'community_shift')
    expect(entry?.semanticKey).toBe(`community_shift_club_forsbacka_s2025_m${result.game.currentMatchday}`)
  })
})
