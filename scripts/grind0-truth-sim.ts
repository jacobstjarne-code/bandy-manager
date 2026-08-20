/**
 * Grind 0-verifiering (SLUTTEST_KO.md) — "sanningen". Aldrig körd innan
 * detta pass (Jacobs uppdrag, 2026-08-21): "automatiserad tvåsäsongskörning
 * som jämför varje berättad siffra, varje namn och varje permanent
 * tillstånd mot save-state. Den är en simulering, inget bygge."
 *
 * Scope, ärligt avgränsat: "varje berättad siffra" är obegränsat stort om
 * det tas bokstavligt (varje skärm, varje sträng). De KONKRETA, TESTBARA
 * påståendena är K1–K4:s egna "Godkänd när"-rader (BLOCKERANDE-sektionen,
 * SLUTTEST_KO.md) — Grind 0 stänger uttryckligen just K1–K4 + etapp 1/2/4,
 * inget bredare. Detta skript verifierar dem i en RIKTIG flersäsongskörning
 * (inte K1/K3:s isolerade unit-tester):
 *
 *   K1 — careerStats.totalGames/totalGoals/totalAssists ökar INKREMENTELLT,
 *        match för match, hela säsongen (statsProcessor.ts, verifierat med
 *        en fristående round-för-round-spårning under detta pass) — inte
 *        vid rollover. Rollover-anropet i sig spelar ALDRIG en match
 *        (seasonEndProcessor.ts returnerar roundPlayed:null i det anropet),
 *        så det korrekta påståendet är att careerStats INTE ändras av
 *        själva rollover-anropet (before===after på den kallelsen), och att
 *        säsongens TOTALA careerStats-ökning (från säsongsstart till
 *        säsongsslut) exakt matchar seasonStats+seasonCupStats (liga+cup)
 *        vid samma tidpunkt. Ett första utkast av detta skript testade FEL
 *        påstående (delta vid SISTA anropet == hela säsongens seasonStats)
 *        och rapporterade 3811 falska avvikelser — roten var skriptets egen
 *        modell av NÄR ökningen sker, inte spelkoden. Rättat efter att en
 *        fristående spårning (round för round) visade att careerStats redan
 *        var komplett vid rollover-anropet.
 *        "Hall of Fame läser samma tal" är strukturellt garanterat, inte
 *        runtime-testat här — HistoryScreen.tsx/CeremonyRetirement.tsx/
 *        retirementService.ts läser alla player.careerStats direkt, ingen
 *        egen parallell summering (kod-läst, 2026-08-21) — om check K1
 *        håller håller Hall of Fame automatiskt, det finns ingen andra
 *        källa den skulle kunna glida isär mot.
 *   K3 — seasonHistory.length == min(spelade säsonger, 10) (.slice(-10)
 *        i seasonEndProcessor.ts, avsiktlig kapning — inte en bugg).
 *   K4 — worldSeed/ruleVersion oförändrade från createNewGame till
 *        säsongsslut (permanenta fält, ska ALDRIG muteras efter skapande).
 *
 * Kör: node_modules/.bin/vite-node scripts/grind0-truth-sim.ts
 */

import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import { CLUB_TEMPLATES } from '../src/domain/services/worldGenerator'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const SEASONS = 2
const SEEDS = [1, 2, 3]
const CLUBS = [CLUB_TEMPLATES[0].id, CLUB_TEMPLATES[5].id, CLUB_TEMPLATES[9].id]

interface Discrepancy {
  kind: 'K1-careerStats' | 'K3-seasonHistory' | 'K4-worldSeed' | 'K4-ruleVersion' | 'crash'
  detail: string
}

function runOne(clubId: string, seed: number): { discrepancies: Discrepancy[]; seasonsCompleted: number } {
  let game: SaveGame = createNewGame({ managerName: `Grind0-${seed}`, clubId, seed })
  game = { ...game, pendingScreen: null }
  const discrepancies: Discrepancy[] = []
  const initialWorldSeed = game.worldSeed
  const initialRuleVersion = game.ruleVersion
  let seasonsCompleted = 0

  try {
    for (let season = 1; season <= SEASONS; season++) {
      let stepSeed = seed * 100_000 + season * 1_000
      let seasonDone = false
      let guardRounds = 0
      // K1: careerStats vid SÄSONGENS BÖRJAN (fångad en gång, inte per varv)
      // — jämförs mot careerStats vid säsongsslut. Ökningen ska exakt matcha
      // seasonStats+seasonCupStats (liga+cup) vid samma tidpunkt.
      const seasonStartCareer = new Map<string, { totalGames: number; totalGoals: number; totalAssists: number }>()
      for (const p of game.players) {
        seasonStartCareer.set(p.id, {
          totalGames: p.careerStats?.totalGames ?? 0,
          totalGoals: p.careerStats?.totalGoals ?? 0,
          totalAssists: p.careerStats?.totalAssists ?? 0,
        })
      }
      // Snapshot varje spelares seasonStats/seasonCupStats precis innan den
      // sista rundan som kan trigga rollover — uppdateras varje varv, håller
      // alltid "senaste kända läge före ett season-end-anrop". Rollover-
      // anropet spelar aldrig en match (roundPlayed:null), så vid det anropet
      // är detta redan säsongens KOMPLETTA totaler.
      let preRolloverSeason = new Map<string, { games: number; goals: number; assists: number; cupGames: number; cupGoals: number; cupAssists: number }>()

      while (!seasonDone) {
        guardRounds++
        if (guardRounds > 2000) throw new Error(`season ${season} never ended — round guard tripped`)

        for (const p of game.players) {
          preRolloverSeason.set(p.id, {
            games: p.seasonStats?.gamesPlayed ?? 0,
            goals: p.seasonStats?.goals ?? 0,
            assists: p.seasonStats?.assists ?? 0,
            cupGames: p.seasonCupStats?.gamesPlayed ?? 0,
            cupGoals: p.seasonCupStats?.goals ?? 0,
            cupAssists: p.seasonCupStats?.assists ?? 0,
          })
        }

        game = autoSelectLineup(game)
        const result = advanceToNextEvent(game, stepSeed++)
        game = result.game

        if (result.seasonEnded) {
          // K1: careerStats-ökning (säsongsstart → säsongsslut) ska vara
          // EXAKT säsongens seasonStats+seasonCupStats (liga+cup), för varje
          // spelare som fanns med hela säsongen.
          for (const p of game.players) {
            const before = seasonStartCareer.get(p.id)
            const seasonBefore = preRolloverSeason.get(p.id)
            if (!before || !seasonBefore) continue // ny spelare (youth intake) denna säsong — inget att jämföra
            const after = { totalGames: p.careerStats?.totalGames ?? 0, totalGoals: p.careerStats?.totalGoals ?? 0, totalAssists: p.careerStats?.totalAssists ?? 0 }
            const deltaGames = after.totalGames - before.totalGames
            const deltaGoals = after.totalGoals - before.totalGoals
            const deltaAssists = after.totalAssists - before.totalAssists
            const expectedGames = seasonBefore.games + seasonBefore.cupGames
            const expectedGoals = seasonBefore.goals + seasonBefore.cupGoals
            const expectedAssists = seasonBefore.assists + seasonBefore.cupAssists
            if (deltaGames !== expectedGames || deltaGoals !== expectedGoals || deltaAssists !== expectedAssists) {
              discrepancies.push({
                kind: 'K1-careerStats',
                detail: `${p.firstName} ${p.lastName} (${p.id}), säsong ${season}: careerStats-delta(games=${deltaGames},goals=${deltaGoals},assists=${deltaAssists}) != liga+cup(games=${expectedGames},goals=${expectedGoals},assists=${expectedAssists})`,
              })
            }

            // K3: seasonHistory-längd == min(spelade säsonger, 10).
            const expectedLen = Math.min(p.careerStats?.seasonsPlayed ?? 0, 10)
            const actualLen = p.seasonHistory?.length ?? 0
            if (actualLen !== expectedLen) {
              discrepancies.push({
                kind: 'K3-seasonHistory',
                detail: `${p.firstName} ${p.lastName} (${p.id}), säsong ${season}: seasonHistory.length=${actualLen}, förväntat min(seasonsPlayed=${p.careerStats?.seasonsPlayed}, 10)=${expectedLen}`,
              })
            }
          }

          // K4: permanenta fält oförändrade.
          if (game.worldSeed !== initialWorldSeed) {
            discrepancies.push({ kind: 'K4-worldSeed', detail: `säsong ${season}: worldSeed muterad ${initialWorldSeed} → ${game.worldSeed}` })
          }
          if (game.ruleVersion !== initialRuleVersion) {
            discrepancies.push({ kind: 'K4-ruleVersion', detail: `säsong ${season}: ruleVersion muterad ${initialRuleVersion} → ${game.ruleVersion}` })
          }

          seasonsCompleted++
          seasonDone = true
        } else if (game.managerFired) {
          seasonDone = true
        } else {
          const resolved = autoResolvePendingScreen(game)
          if (resolved.unresolvable) throw new Error(`unresolvable pendingScreen: ${resolved.screenType}`)
          game = resolved.game
        }
      }

      if (game.managerFired) break

      const resolved = autoResolvePendingScreen(game)
      game = resolved.game
    }
  } catch (e) {
    discrepancies.push({ kind: 'crash', detail: e instanceof Error ? e.message : String(e) })
  }

  return { discrepancies, seasonsCompleted }
}

function main(): void {
  console.log('\n=== Grind 0 — sanningen: K1/K3/K4 i en riktig flersäsongskörning ===\n')
  let totalRuns = 0
  let totalDiscrepancies = 0

  for (const clubId of CLUBS) {
    for (const seed of SEEDS) {
      totalRuns++
      const { discrepancies, seasonsCompleted } = runOne(clubId, seed)
      const label = `${clubId} seed=${seed}`
      if (discrepancies.length === 0) {
        console.log(`OK   ${label} — ${seasonsCompleted}/${SEASONS} säsonger, inga avvikelser`)
      } else {
        console.log(`FAIL ${label} — ${seasonsCompleted}/${SEASONS} säsonger, ${discrepancies.length} avvikelse(r):`)
        for (const d of discrepancies) console.log(`  [${d.kind}] ${d.detail}`)
        totalDiscrepancies += discrepancies.length
      }
    }
  }

  console.log(`\n--- Sammanfattning: ${totalRuns} körningar, ${totalDiscrepancies} totala avvikelser ---`)
  console.log(totalDiscrepancies === 0
    ? 'Grind 0 (K1/K3/K4-delen): INGEN avvikelse funnen.'
    : 'Grind 0 (K1/K3/K4-delen): AVVIKELSER FUNNA — se ovan.')
}

main()
