/**
 * Jacobs order 2026-08-25 (efter fjärde H4-mätningen): "AI-klubbarnas
 * förändring: bygg transfers och positionstrend, det är billigt och sant."
 * processAITransfers (aiTransferService.ts) beräknade redan denna data per
 * transfer och kastade den — game.aiTransferLog gör den bestående.
 *
 * AI-transfers kräver antingen en fri agent eller en säljande klubb med
 * >20 spelare (aiTransferService.ts:s sellerWilling-villkor) — vid
 * världsgenerering har ALLA klubbar exakt 16 spelare och noll fria agenter,
 * så en transfer kan strukturellt aldrig ske vid den allra första
 * säsongsövergången. Testet spelar därför riktiga säsonger (samma harness
 * som boardAssessmentAfterSeason.test.ts) tills kontrakt/pensioneringar/
 * trupptillväxt gjort en transfer möjlig — en isolerad handleSeasonEnd()-
 * körning på en nyskapad save hade aldrig kunnat bevisa att loggen skrivs.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { advanceToNextEvent } from '../roundProcessor'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { autoSelectLineup, autoResolvePendingScreen } from '../../../../scripts/stress/fixtures'

function playOneSeason(game: SaveGame, stepSeedBase: number): SaveGame {
  let stepSeed = stepSeedBase
  let guard = 0
  let seasonEnded = false
  while (!seasonEnded && guard++ < 200) {
    game = autoSelectLineup(game)
    const result = advanceToNextEvent(game, stepSeed++)
    game = result.game
    if (result.seasonEnded) { seasonEnded = true; break }
    const resolved = autoResolvePendingScreen(game)
    if (resolved.unresolvable) throw new Error(`unresolvable pendingScreen: ${resolved.screenType}`)
    game = resolved.game
  }
  if (!seasonEnded) throw new Error('säsongen avslutades aldrig inom 200 rundor')
  return game
}

describe('seasonEndProcessor — aiTransferLog', () => {
  it('en helt ny save har en tom, definierad aiTransferLog — inget odefinierat fält', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    expect(game.aiTransferLog).toEqual([])
  })

  it('över flera riktiga säsonger dyker minst en AI-transfer upp i game.aiTransferLog, formad korrekt och kapad vid 200', () => {
    let game: SaveGame = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 5 })
    game = { ...game, pendingScreen: null }

    let found = false
    for (let season = 0; season < 6 && !found; season++) {
      game = playOneSeason(game, 500_000 + season * 10_000)
      const log = game.aiTransferLog ?? []
      expect(log.length).toBeLessThanOrEqual(200)
      if (log.length > 0) {
        found = true
        for (const entry of log) {
          expect(entry.fromClubId).not.toBe(game.managedClubId)
          expect(entry.toClubId).not.toBe(game.managedClubId)
          expect(typeof entry.playerId).toBe('string')
          expect(typeof entry.playerName).toBe('string')
          expect(typeof entry.season).toBe('number')
          expect(typeof entry.fee).toBe('number')
        }
      }
    }

    expect(found, 'ingen AI-transfer loggades över sex säsonger — antingen mekaniken eller testets seed-antagande är fel').toBe(true)
  }, 120000)
})
