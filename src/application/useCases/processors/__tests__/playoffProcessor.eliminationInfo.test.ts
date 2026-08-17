import { describe, it, expect } from 'vitest'
import { advanceToNextEvent } from '../../advanceToNextEvent'
import { createHeadlessGame, autoSelectLineup, autoResolvePendingScreen } from '../../../../../scripts/stress/fixtures'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { AdvanceResult } from '../../advanceTypes'

/**
 * A2 (långspelsaudit, 10 säsonger, 2026-08-17) — regressionstest för
 * game.lastPlayoffElimination.
 *
 * Buggen: AnslagOverlay.tsx renderade {motståndare}/{resultat} bokstavligt
 * efter en slutspelselimination (semifinalförlust år 7, SM-finalsilver år 8,
 * live 10-säsongersspeltest). Fixen resolvar motståndare/resultat EN gång i
 * playoffProcessor.ts, samma stund klubben registreras som utslagen, och
 * lagrar det på game.lastPlayoffElimination — inte härlett ur bracket-state
 * vid ett senare render-tillfälle.
 *
 * Detta test simulerar riktiga säsonger (samma headless-infrastruktur som
 * scripts/stress/*.ts) tills managed club faktiskt slås ut ur slutspelet,
 * och verifierar att lastPlayoffElimination sätts korrekt SAMMA omgång —
 * med ett riktigt motståndarnamn och ett riktigt matchresultat, inte
 * fallback-strängar eller en tom sträng.
 */
describe('playoffProcessor — lastPlayoffElimination (A2 regression)', () => {
  it('sätts opponentName + resultat samma omgång klubben slås ut ur slutspelet', () => {
    let found: {
      seed: number
      info: NonNullable<SaveGame['lastPlayoffElimination']>
      opponentClubName: string | undefined
    } | null = null

    for (let seed = 0; seed < 25 && !found; seed++) {
      let game: SaveGame = createHeadlessGame(seed)
      let stepSeed = seed * 100_000 + 1_000

      for (let round = 0; round < 45 && !found; round++) {
        game = autoSelectLineup(game)
        const result: AdvanceResult = advanceToNextEvent(game, stepSeed++)
        game = result.game

        if (game.lastPlayoffElimination) {
          const bracket = game.playoffBracket
          const allSeries = bracket
            ? [...bracket.quarterFinals, ...bracket.semiFinals, ...(bracket.final ? [bracket.final] : [])]
            : []
          const eliminatingSeries = allSeries.find(s => s.loserId === game.managedClubId && s.winnerId !== null)
          const opponentClub = eliminatingSeries
            ? game.clubs.find(c => c.id === eliminatingSeries.winnerId)
            : undefined
          found = { seed, info: game.lastPlayoffElimination, opponentClubName: opponentClub?.shortName ?? opponentClub?.name }
        }

        const resolved = autoResolvePendingScreen(game)
        if (resolved.unresolvable) break
        game = resolved.game
      }
    }

    expect(found, 'ingen playoff-elimination hittades inom sökrymden — bredda seed/round-loopen').not.toBeNull()
    const { info, opponentClubName } = found!

    // Motståndarnamnet ska vara det RIKTIGA klubbnamnet, inte den generiska fallbacken.
    expect(info.opponentName).toBe(opponentClubName)
    expect(info.opponentName).not.toBe('motståndaren')

    // Resultatet ska vara en riktig matchsiffra ("3–2"), inte tomt.
    expect(info.resultat).toMatch(/^\d+–\d+$/)

    // Rond-etiketten (PlayoffRound-enum-värdet) ska vara en av de tre giltiga.
    expect(['quarterFinal', 'semiFinal', 'final']).toContain(info.round)
  })
})
