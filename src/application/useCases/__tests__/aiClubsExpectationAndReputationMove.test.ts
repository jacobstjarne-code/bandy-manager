import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { advanceToNextEvent } from '../roundProcessor'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { autoSelectLineup, autoResolvePendingScreen } from '../../../../scripts/stress/fixtures'

/**
 * H4 Heros-uppföljning (Jacobs dom 2026-08-25): `generatePreSeasonMessage`s
 * stegkedja och `seasonReputationDelta` körde tidigare BARA den hanterade
 * klubben — elva AI-klubbars boardExpectation/reputation stod frusna i hela
 * karriären. Fixat i seasonEndProcessor.ts: båda loopar nu över ALLA tolv
 * klubbar. Detta test spelar en riktig, full säsong (samma mönster som
 * seasonCupStatsRollover.test.ts, grind0-disciplinen: en KÖRNING, inte bara
 * ett unit-test av den isolerade funktionen) och verifierar att minst en
 * AI-klubbs boardExpectation eller reputation faktiskt rört sig från sitt
 * genererade startvärde efter säsongsslutet.
 */
describe('AI-klubbars boardExpectation/reputation rör sig efter säsongsslut', () => {
  it('minst en AI-klubb har fått ett nytt boardExpectation eller reputation-värde efter en spelad säsong', () => {
    const managedClubId = CLUB_TEMPLATES[0].id
    let game: SaveGame = createNewGame({ managerName: 'Test', clubId: managedClubId, seed: 7 })
    game = { ...game, pendingScreen: null }

    const startState = new Map(
      game.clubs
        .filter(c => c.id !== managedClubId)
        .map(c => [c.id, { boardExpectation: c.boardExpectation, reputation: c.reputation }]),
    )

    let stepSeed = 600_000
    let guard = 0
    let seasonEnded = false

    while (!seasonEnded && guard++ < 200) {
      game = autoSelectLineup(game)
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game

      if (result.seasonEnded) {
        seasonEnded = true
        break
      }
      const resolved = autoResolvePendingScreen(game)
      if (resolved.unresolvable) throw new Error(`unresolvable pendingScreen: ${resolved.screenType}`)
      game = resolved.game
    }

    expect(seasonEnded, 'säsongen borde ha avslutats inom 200 rundor').toBe(true)

    const aiClubs = game.clubs.filter(c => c.id !== managedClubId)
    expect(aiClubs.length, 'elva AI-klubbar ska finnas kvar efter säsongsslut').toBe(11)

    const latestSummary = game.seasonSummaries.at(-1)
    const aiStrengthSnapshots = latestSummary?.standingsSnapshot
      ?.filter(row => row.clubId !== managedClubId)
      .map(row => row.squadStrength)
    expect(aiStrengthSnapshots).toHaveLength(11)
    expect(aiStrengthSnapshots?.every(value => typeof value === 'number' && value >= 0 && value <= 100)).toBe(true)

    const changed = aiClubs.filter(c => {
      const before = startState.get(c.id)
      if (!before) return false
      return c.boardExpectation !== before.boardExpectation || c.reputation !== before.reputation
    })

    expect(
      changed.length,
      `ingen AI-klubb ändrade boardExpectation/reputation efter en hel säsong — loopen når dem inte. Klubbar: ${JSON.stringify(aiClubs.map(c => ({ id: c.id, exp: c.boardExpectation, rep: c.reputation })))}`,
    ).toBeGreaterThan(0)
  }, 60000)
})
