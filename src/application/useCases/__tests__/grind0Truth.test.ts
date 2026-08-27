import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { advanceToNextEvent } from '../roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from '../../../../scripts/stress/fixtures'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import type { SaveGame } from '../../../domain/entities/SaveGame'

/**
 * Grind 0 — "sanningen" (SLUTTEST_KO.md, GRINDAR-sektionen). Jacobs order,
 * 2026-08-22: "Kör Grind 0 som en del av gate-sviten, inte som ett
 * engångsskript... allt som rör statistik ska passera den." Ersätter det
 * tidigare fristående skriptet `scripts/grind0-truth-sim.ts` (raderat i
 * samma commit) — samma logik, nu en del av `npm test` och alltså av CI:s
 * `check`-jobb (app-ci.yml) på varje push. Uppmätt körtid: ~4s för denna
 * 9-körningars svep, mot ~34s för hela vitest-sviten — ingen anledning att
 * schemalägga separat, den hänger med varje commit till en bråkdel av
 * kostnaden.
 *
 * Verifierar K1/K3/K4:s "Godkänd när"-påståenden (BLOCKERANDE-sektionen)
 * i en RIKTIG flersäsongskörning, inte isolerade unit-tester:
 *   K1 — careerStats.totalGames/totalGoals/totalAssists ökar, säsong för
 *        säsong, med EXAKT seasonStats+seasonCupStats (liga+cup) — aldrig
 *        dubbelt, aldrig glömt. Tre reella brott hittades och fixades här
 *        (a2c2b6f5): seasonCupStats nollställdes aldrig vid rollover,
 *        "flygande byten"-grenen för oanvända bänkspelare glömde
 *        careerStats.totalGames, Erik Ström-easter egget hade seasonsPlayed
 *        hårdkodad fel.
 *   K3 — seasonHistory.length == min(spelade säsonger, 10).
 *   K4 — worldSeed/ruleVersion permanenta, muteras aldrig efter skapande.
 * "Hall of Fame läser samma tal" (K1s andra påstående) är strukturellt
 * garanterat, inte runtime-testat — HistoryScreen.tsx/CeremonyRetirement.tsx/
 * retirementService.ts läser alla player.careerStats direkt, ingen egen
 * parallell summering (kod-läst 2026-08-21). Håller K1 håller det med.
 *
 * E-GRIND0-1 (2026-08-24) — K1:s jämförelsemetod bytt, rotorsak spårad och
 * fixad. Den gamla metoden snapshottade seasonStats/seasonCupStats i
 * TESTETS EGEN loop, EN GÅNG per externt advanceToNextEvent-anrop, och
 * antog att "anropet som returnerar seasonEnded:true spelar aldrig en
 * match". Det antagandet är falskt: roundProcessor.ts:1928 ("Auto-advance
 * playoff rounds when managed club is eliminated") REKURSERAR internt när
 * den hanterade klubben är slutspelsutslagen — en enda extern
 * advanceToNextEvent-retur kan då både spela en RIKTIG match för en annan
 * klubb OCH nå säsongsslut i samma anrop, osynligt för en extern
 * loop-snapshot tagen FÖRE anropet. careerStats och seasonStats+
 * seasonCupStats höll hela tiden ihop perfekt (verifierat instrumenterat,
 * steg för steg) — bara testets egen jämförelsepunkt var stale. Fixen läser
 * i stället den nya seasonHistory-posten (seasonEndProcessor.ts skriver nu
 * cupGames/cupGoals/cupAssists dit, läst från SAMMA `game`-parameter
 * handleSeasonEnd() faktiskt tar emot — som redan reflekterar en eventuell
 * tyst rekursion, eftersom rekursionen händer FÖRE handleSeasonEnd anropas,
 * inte efter). Se SLUTTEST_KO.md för fullständig spårning.
 */

const SEASONS = 2
const SEEDS = [1, 2, 3]
const CLUBS = [CLUB_TEMPLATES[0].id, CLUB_TEMPLATES[5].id, CLUB_TEMPLATES[9].id]

interface Discrepancy {
  kind: 'K1-careerStats' | 'K3-seasonHistory' | 'K4-worldSeed' | 'K4-ruleVersion'
  detail: string
}

function runOne(clubId: string, seed: number): Discrepancy[] {
  let game: SaveGame = createNewGame({ managerName: `Grind0-${seed}`, clubId, seed })
  game = { ...game, pendingScreen: null }
  const discrepancies: Discrepancy[] = []
  const initialWorldSeed = game.worldSeed
  const initialRuleVersion = game.ruleVersion

  for (let season = 1; season <= SEASONS; season++) {
    let stepSeed = seed * 100_000 + season * 1_000
    let seasonDone = false
    let guardRounds = 0
    // K1: careerStats vid SÄSONGENS BÖRJAN (fångad en gång, inte per varv)
    // — jämförs mot careerStats vid säsongsslut. Ökningen ska exakt matcha
    // seasonHistory-postens games+cupGames/goals+cupGoals/assists+cupAssists
    // för säsongen som just avslutades (E-GRIND0-1: den posten skrivs av
    // seasonEndProcessor.ts från SAMMA game-parameter som handleSeasonEnd()
    // faktiskt tar emot, och reflekterar därför korrekt en eventuell tyst
    // extra-runda från roundProcessor.ts:1928:s auto-advance-rekursion — en
    // extern snapshot tagen FÖRE anropet kan inte det).
    const seasonStartCareer = new Map<string, { totalGames: number; totalGoals: number; totalAssists: number }>()
    for (const p of game.players) {
      seasonStartCareer.set(p.id, {
        totalGames: p.careerStats?.totalGames ?? 0,
        totalGoals: p.careerStats?.totalGoals ?? 0,
        totalAssists: p.careerStats?.totalAssists ?? 0,
      })
    }

    while (!seasonDone) {
      guardRounds++
      if (guardRounds > 2000) throw new Error(`season ${season} never ended — round guard tripped (${clubId} seed=${seed})`)

      game = autoSelectLineup(game)
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game

      if (result.seasonEnded) {
        for (const p of game.players) {
          const before = seasonStartCareer.get(p.id)
          if (!before) continue // ny spelare (youth intake) denna säsong — inget att jämföra
          const seasonEntry = (p.seasonHistory ?? []).find(h => h.season === season)
          if (!seasonEntry) continue // avstängd/inte spelklar hela säsongen — ingen post skriven, inget att jämföra

          const after = { totalGames: p.careerStats?.totalGames ?? 0, totalGoals: p.careerStats?.totalGoals ?? 0, totalAssists: p.careerStats?.totalAssists ?? 0 }
          const deltaGames = after.totalGames - before.totalGames
          const deltaGoals = after.totalGoals - before.totalGoals
          const deltaAssists = after.totalAssists - before.totalAssists
          const expectedGames = seasonEntry.games + (seasonEntry.cupGames ?? 0)
          const expectedGoals = seasonEntry.goals + (seasonEntry.cupGoals ?? 0)
          const expectedAssists = seasonEntry.assists + (seasonEntry.cupAssists ?? 0)
          if (deltaGames !== expectedGames || deltaGoals !== expectedGoals || deltaAssists !== expectedAssists) {
            discrepancies.push({
              kind: 'K1-careerStats',
              detail: `${p.firstName} ${p.lastName} (${p.id}), säsong ${season}: careerStats-delta(games=${deltaGames},goals=${deltaGoals},assists=${deltaAssists}) != liga+cup(games=${expectedGames},goals=${expectedGoals},assists=${expectedAssists})`,
            })
          }

          const expectedLen = Math.min(p.careerStats?.seasonsPlayed ?? 0, 10)
          const actualLen = p.seasonHistory?.length ?? 0
          if (actualLen !== expectedLen) {
            discrepancies.push({
              kind: 'K3-seasonHistory',
              detail: `${p.firstName} ${p.lastName} (${p.id}), säsong ${season}: seasonHistory.length=${actualLen}, förväntat min(seasonsPlayed=${p.careerStats?.seasonsPlayed}, 10)=${expectedLen}`,
            })
          }
        }

        if (game.worldSeed !== initialWorldSeed) {
          discrepancies.push({ kind: 'K4-worldSeed', detail: `säsong ${season}: worldSeed muterad ${initialWorldSeed} → ${game.worldSeed}` })
        }
        if (game.ruleVersion !== initialRuleVersion) {
          discrepancies.push({ kind: 'K4-ruleVersion', detail: `säsong ${season}: ruleVersion muterad ${initialRuleVersion} → ${game.ruleVersion}` })
        }

        seasonDone = true
      } else if (game.managerFired) {
        seasonDone = true
      } else {
        const resolved = autoResolvePendingScreen(game)
        if (resolved.unresolvable) throw new Error(`unresolvable pendingScreen: ${resolved.screenType} (${clubId} seed=${seed})`)
        game = resolved.game
      }
    }

    if (game.managerFired) break

    const resolved = autoResolvePendingScreen(game)
    game = resolved.game
  }

  return discrepancies
}

describe('Grind 0 — sanningen (K1/K3/K4 i en riktig flersäsongskörning)', () => {
  for (const clubId of CLUBS) {
    for (const seed of SEEDS) {
      it(`${clubId} seed=${seed}: ingen careerStats/seasonHistory/worldSeed-avvikelse över ${SEASONS} säsonger`, () => {
        const discrepancies = runOne(clubId, seed)
        expect(discrepancies, JSON.stringify(discrepancies, null, 2)).toHaveLength(0)
      })
    }
  }
})
