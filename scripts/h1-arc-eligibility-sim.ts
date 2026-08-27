/**
 * H1-uppföljning (människoupplevelse-audit 7024f8a, 2026-08-24). Jacobs
 * order: pröva hypotesen om bågarnas smala triggervillkor, anta den inte.
 * "Är hungrig_breakthrough valbar i två av tjugo karriärer är villkoret
 * för smalt, och då är arcen byggd men osynlig i praktiken."
 *
 * Mäter VALBARHET, inte dragning: för var och en av arcService.ts:s
 * val-bärande arc-typer (hungrig_breakthrough, joker_redemption,
 * veteran_farewell, veteran_final_season, contract_drama — ledare_crisis
 * borttagen sedan Jacobs dom, se filens senare kommentar), en egen
 * predikatfunktion som speglar EXAKT samma villkor som
 * detectArcTriggers() (arcService.ts) använder — men UTAN hasArcType/
 * canAddArc-spärrarna (max 2 samtidiga icke-derby-arcer, en per spelare).
 * Skälet: en arc som är strukturellt omöjlig (fel truppsammansättning,
 * för smalt åldersfönster) ska räknas som "aldrig valbar" oavsett om en
 * ANNAN arc råkade uppta de två platserna den runda — annars mäter vi
 * konkurrens om platser, inte om villkoret någonsin var sant.
 *
 * Predikaten är en medveten DUPLICERING av arcService.ts:s villkor (inte
 * ett anrop till den faktiska, gatade funktionen) — ett engångsdiagnostik-
 * skript, samma genre som scripts/grind1-boardpatience-sim*.ts. Om
 * arcService.ts:s villkor ändras måste predikaten uppdateras manuellt;
 * de är inte en gate som körs i CI.
 *
 * Kör: node_modules/.bin/vite-node scripts/h1-arc-eligibility-sim.ts
 */

import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import { MatchEventType } from '../src/domain/enums'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { Fixture } from '../src/domain/entities/Fixture'

const CLUBS = ['club_malilla', 'club_skutskar', 'club_heros', 'club_slottsbron'] as const
const RUNS_PER_CLUB = 5 // 4 klubbar × 5 = 20 karriärer, Jacobs minimum
const SEASONS = 4

type ArcKey =
  | 'hungrig_breakthrough' | 'joker_redemption' | 'veteran_farewell'
  | 'veteran_final_season' | 'contract_drama'

// ledare_crisis borttagen (H1-uppföljning, 2026-08-24, Jacobs dom) —
// captainSpeech (postAdvanceEvents.ts) är kanon, se BACKLOG.md "Två läsare,
// en sanning". captainSpeech har ingen egen eligibility-fråga att simulera
// här: den triggar direkt på matchday-sorterade ligaresultat, redan
// verifierad av postAdvanceEventsCaptainSpeech.test.ts.
const ARC_KEYS: ArcKey[] = [
  'hungrig_breakthrough', 'joker_redemption', 'veteran_farewell',
  'veteran_final_season', 'contract_drama',
]

interface CareerEligibility {
  clubId: string
  seed: number
  eligibleRoundsByType: Record<ArcKey, number>
  everEligible: Record<ArcKey, boolean>
  crashed: boolean
  crashMsg: string | null
}

// ── Predikat, ett per arc-typ, speglar arcService.ts:s detectArcTriggers() ──

function isHungrigBreakthroughEligible(game: SaveGame, managedFixturesSorted: Fixture[]): boolean {
  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  // Åldersgräns 24 (var 21) — H1-uppföljning, 2026-08-24: matchar nu
  // characterPlayerService.ts:s tilldelningsgräns, se arcService.ts.
  const hungrigPlayers = managedPlayers.filter(p => p.trait === 'hungrig' && p.age <= 24)
  for (const p of hungrigPlayers) {
    let gamesWithoutGoal = 0
    for (const f of managedFixturesSorted) { // redan matchday DESC
      const isHome = f.homeClubId === game.managedClubId
      const lineup = isHome ? f.homeLineup : f.awayLineup
      const wasInLineup = lineup?.startingPlayerIds?.includes(p.id) || lineup?.benchPlayerIds?.includes(p.id)
      if (!wasInLineup) continue
      const scored = (f.events ?? []).some(e => e.type === 'goal' && e.playerId === p.id)
      if (scored) break
      gamesWithoutGoal++
    }
    if (gamesWithoutGoal >= 3) return true
  }
  return false
}

function isJokerRedemptionEligible(game: SaveGame, justCompletedFixture: Fixture | null): boolean {
  if (!justCompletedFixture) return false
  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const jokerPlayers = managedPlayers.filter(p => p.trait === 'joker')
  const events = justCompletedFixture.events ?? []
  return jokerPlayers.some(p => events.some(e => e.type === MatchEventType.Suspension && e.playerId === p.id))
}

function isVeteranFinalSeasonEligible(game: SaveGame, currentMatchday: number): boolean {
  if (currentMatchday > 1) return false // engångsfönster, matchar arcService.ts:s currentMatchday<=1
  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  return managedPlayers.some(p => p.age >= 34 && p.contractUntilSeason === game.currentSeason)
}

function isVeteranFarewellEligible(game: SaveGame, currentMatchday: number): boolean {
  if (currentMatchday < 15) return false
  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  return managedPlayers.some(p => p.trait === 'veteran' && p.age >= 30 && p.contractUntilSeason === game.currentSeason)
}

// contract_drama omskrivet mot faktisk state (H1-uppföljning, 2026-08-24,
// Jacobs dom) — speglar arcService.ts:s nya villkor: game.transferBids
// (inte inbox-textmatchning mot "spekulationer", som aldrig producerades).
function isContractDramaEligible(game: SaveGame): boolean {
  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const biddedPlayerIds = new Set(
    game.transferBids
      .filter(b => b.direction === 'incoming' && b.status === 'pending' && b.sellingClubId === game.managedClubId)
      .map(b => b.playerId)
  )
  return managedPlayers.some(
    p => biddedPlayerIds.has(p.id) && p.contractUntilSeason === game.currentSeason && p.form > 65
  )
}

function runOne(clubId: string, seed: number): CareerEligibility {
  let game: SaveGame = createNewGame({ managerName: `H1Arc-${seed}`, clubId, seed })
  game = { ...game, pendingScreen: null }

  const eligibleRoundsByType: Record<ArcKey, number> = Object.fromEntries(ARC_KEYS.map(k => [k, 0])) as Record<ArcKey, number>
  const everEligible: Record<ArcKey, boolean> = Object.fromEntries(ARC_KEYS.map(k => [k, false])) as Record<ArcKey, boolean>
  const seenFixtures = new Set<string>()

  try {
    for (let season = 1; season <= SEASONS; season++) {
      let stepSeed = seed * 100_000 + season * 1_000
      let seasonDone = false
      let guardRounds = 0

      while (!seasonDone) {
        guardRounds++
        if (guardRounds > 2000) throw new Error(`season ${season} never ended — round guard tripped`)

        game = autoSelectLineup(game)
        const result = advanceToNextEvent(game, stepSeed++)
        game = result.game

        const managedFixturesUnsorted = game.fixtures.filter(
          f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
        )
        const managedFixturesSorted = managedFixturesUnsorted.slice().sort((a, b) => (b.matchday ?? 0) - (a.matchday ?? 0))

        const last = managedFixturesSorted[0]
        const justCompletedFixture = last && !seenFixtures.has(last.id) ? last : null
        if (last) seenFixtures.add(last.id)

        const currentMatchday = justCompletedFixture?.matchday ?? 0

        const checks: Record<ArcKey, boolean> = {
          hungrig_breakthrough: isHungrigBreakthroughEligible(game, managedFixturesSorted),
          joker_redemption: isJokerRedemptionEligible(game, justCompletedFixture),
          veteran_farewell: isVeteranFarewellEligible(game, currentMatchday),
          veteran_final_season: isVeteranFinalSeasonEligible(game, currentMatchday),
          contract_drama: isContractDramaEligible(game),
        }
        for (const k of ARC_KEYS) {
          if (checks[k]) {
            eligibleRoundsByType[k]++
            everEligible[k] = true
          }
        }

        if (result.seasonEnded || game.managerFired) {
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
    return {
      clubId, seed, eligibleRoundsByType, everEligible,
      crashed: true, crashMsg: e instanceof Error ? e.message : String(e),
    }
  }

  return { clubId, seed, eligibleRoundsByType, everEligible, crashed: false, crashMsg: null }
}

function main(): void {
  const results: CareerEligibility[] = []
  for (const clubId of CLUBS) {
    for (let i = 0; i < RUNS_PER_CLUB; i++) {
      results.push(runOne(clubId, 50_000 + CLUBS.indexOf(clubId) * 1000 + i))
    }
  }

  const valid = results.filter(r => !r.crashed)
  const crashed = results.filter(r => r.crashed)

  console.log(`\n=== H1 bågeligibilitet — ${valid.length} giltiga karriärer (${CLUBS.length} klubbar × ${RUNS_PER_CLUB}, ${SEASONS} säsonger var), ${crashed.length} kraschade ===\n`)

  for (const k of ARC_KEYS) {
    const everCount = valid.filter(r => r.everEligible[k]).length
    const totalRounds = valid.reduce((sum, r) => sum + r.eligibleRoundsByType[k], 0)
    const avgRoundsPerCareer = (totalRounds / valid.length).toFixed(1)
    console.log(`${k}: valbar i ${everCount}/${valid.length} karriärer (${Math.round(100 * everCount / valid.length)}%), snitt ${avgRoundsPerCareer} valbara rundor/karriär`)
  }

  console.log('\n--- Per klubb ---')
  for (const clubId of CLUBS) {
    const clubResults = valid.filter(r => r.clubId === clubId)
    if (clubResults.length === 0) continue
    const line = ARC_KEYS.map(k => `${k}=${clubResults.filter(r => r.everEligible[k]).length}/${clubResults.length}`).join(' ')
    console.log(`${clubId}: ${line}`)
  }

  if (crashed.length > 0) {
    console.log('\n--- Kraschade körningar ---')
    for (const r of crashed) console.log(`  ${r.clubId} seed=${r.seed}: ${r.crashMsg}`)
  }
}

main()
