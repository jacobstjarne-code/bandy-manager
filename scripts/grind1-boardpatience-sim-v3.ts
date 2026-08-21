/**
 * Grind 1 v3 (2026-08-23, Jacobs Grind 1-dom): svarar på två utredningskrav
 * FÖRE nästa koefficientrunda.
 *
 * 1) Verifierar vad trainerArc.consecutiveLosses faktiskt mäter (kod läst,
 *    inte gissad — se rapport): exkluderar cup (!f.isCup), inkluderar
 *    slutspel (roundNumber 23+, samma !isCup-gren), nollställs vid oavgjort
 *    (trainerArcService.ts:55-58) och vid säsongsslut (checkSeasonEndArc,
 *    trainerArcService.ts:166). Ingen säsongsgräns-läcka i koden.
 *
 * 2) Rapporterar FULL fördelning av slutplacering (histogram 1-12) — och
 *    fixar en mätbugg i v2-scriptet, se kommentar vid `finalPosition` nedan.
 *
 * Sidofynd, verifierat via grep: `managerFired` sätts ENDAST på två ställen
 * — seasonEndProcessor.ts:971/982 (boardPatience<=15/consecutiveFailures>=3/
 * licenseDenial, utvärderas EN gång per säsong, vid säsongsslut) och
 * postRoundFlagsProcessor.ts:38 (konkurs, utvärderas VARJE omgång, hela
 * säsongen). Två helt olika tidsupplösningar bakom samma flagga — det är
 * grunden för BACKLOG-noten "Två läsare, en sanning". I DENNA körning
 * klassificerades 0 avsked som bankruptcy (se firedReason-fördelningen),
 * så samtliga avsked nedan är äkta säsongsslut-utvärderingar av en HELT
 * spelad säsong, aldrig ett avbrott mitt i.
 *
 * Kör: node_modules/.bin/vite-node scripts/grind1-boardpatience-sim-v3.ts
 */

import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { evaluateFinanceStatus } from '../src/domain/services/economyService'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const CLUBS = ['club_skutskar', 'club_heros'] as const
const RUNS_PER_CLUB = 100
const SEASONS = 3

type FiredReason = 'boardPatience<=15' | 'consecutiveFailures>=3' | 'bankruptcy' | 'licenseDenial' | null

interface SeasonSample {
  season: number
  position: number
  wins: number
  draws: number
  losses: number
  fired: boolean
  maxLosingStreak: number
  boardPatience: number
}

interface RunResult {
  clubId: string
  seed: number
  fired: boolean
  firedSeason: number | null
  firedReason: FiredReason
  samples: SeasonSample[]
  crashed: boolean
  crashMsg: string | null
}

function classifyFiredReason(game: SaveGame): FiredReason {
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (managedClub) {
    const finStatus = evaluateFinanceStatus(managedClub.finances)
    if (finStatus.status === 'game-over') return 'bankruptcy'
  }
  if ((game.boardPatience ?? 70) <= 15) return 'boardPatience<=15'
  if ((game.consecutiveFailures ?? 0) >= 3) return 'consecutiveFailures>=3'
  return 'licenseDenial'
}

function runOne(clubId: string, seed: number): RunResult {
  let game: SaveGame = createNewGame({ managerName: `Grind1v3-${seed}`, clubId, seed })
  game = { ...game, pendingScreen: null }

  const samples: SeasonSample[] = []
  let fired = false
  let firedSeason: number | null = null
  let firedReason: FiredReason = null

  try {
    for (let season = 1; season <= SEASONS; season++) {
      let stepSeed = seed * 100_000 + season * 1_000
      let seasonDone = false
      let guardRounds = 0
      let seasonMaxStreak = 0
      let wins = 0, draws = 0, losses = 0
      const seenFixtures = new Set<string>()

      while (!seasonDone) {
        guardRounds++
        if (guardRounds > 2000) throw new Error(`season ${season} never ended — round guard tripped`)

        game = autoSelectLineup(game)
        const result = advanceToNextEvent(game, stepSeed++)
        game = result.game
        seasonMaxStreak = Math.max(seasonMaxStreak, game.trainerArc?.consecutiveLosses ?? 0)

        // W/D/L räknat live, INTE ur game.fixtures efter loopen — samma
        // klass av bugg som positionsfyndet nedan skulle drabba den
        // (fixtures-arrayet byts ut vid säsongsslut, se not vid samples.push).
        const last = game.fixtures
          .filter(f => f.status === 'completed' && !f.isCup && (f.homeClubId === clubId || f.awayClubId === clubId))
          .sort((a, b) => b.roundNumber - a.roundNumber)[0]
        if (last && !seenFixtures.has(last.id)) {
          seenFixtures.add(last.id)
          const isHome = last.homeClubId === clubId
          const my = isHome ? (last.homeScore ?? 0) : (last.awayScore ?? 0)
          const their = isHome ? (last.awayScore ?? 0) : (last.homeScore ?? 0)
          if (my > their) wins++
          else if (my < their) losses++
          else draws++
        }

        if (result.seasonEnded || game.managerFired) {
          seasonDone = true
        } else {
          const resolved = autoResolvePendingScreen(game)
          if (resolved.unresolvable) throw new Error(`unresolvable pendingScreen: ${resolved.screenType}`)
          game = resolved.game
        }
      }

      // BUG HITTAD 2026-08-23 (v3, denna fil): game.standings nollställs och
      // omordnas alfabetiskt av seasonEndProcessor.ts:s
      // `calculateStandings(updatedClubs.map(c => c.id), [])` som en del av
      // NÄSTA säsongs (ospelade) tabell — läsning av standing.position HÄR
      // (efter att loopen brutit, precis som v2-scriptet gjorde) gav därför
      // varje klubbs ALFABETISKA rang, inte dess verkliga slutplacering.
      // Det förklarade v2:s "0% varians i slutplacering"-fynd fullständigt
      // (Heros = alfabetiskt 4:a, Skutskär = alfabetiskt 9:a — matchade
      // exakt). Den ÄKTA slutplaceringen finns i SeasonSummary.finalPosition,
      // satt i seasonEndProcessor.ts:1391 FRÅN standings-arrayet SOM SKICKADES
      // IN (game.standings, före överskrivningen), inte det som skrivs ut.
      const lastSummary = game.seasonSummaries?.[game.seasonSummaries.length - 1]
      samples.push({
        season,
        position: lastSummary?.finalPosition ?? -1,
        wins, draws, losses,
        fired: !!game.managerFired,
        maxLosingStreak: seasonMaxStreak,
        boardPatience: game.boardPatience ?? 70,
      })

      if (game.managerFired) {
        fired = true
        firedSeason = season
        firedReason = classifyFiredReason(game)
        break
      }

      const resolved = autoResolvePendingScreen(game)
      game = resolved.game
    }
  } catch (e) {
    return {
      clubId, seed, fired, firedSeason, firedReason, samples,
      crashed: true, crashMsg: e instanceof Error ? e.message : String(e),
    }
  }

  return {
    clubId, seed, fired, firedSeason, firedReason, samples,
    crashed: false, crashMsg: null,
  }
}

function positionHistogram(samples: SeasonSample[]): string {
  const hist: Record<number, number> = {}
  for (const s of samples) hist[s.position] = (hist[s.position] ?? 0) + 1
  return Array.from({ length: 12 }, (_, i) => i + 1)
    .map(pos => `${pos}:${hist[pos] ?? 0}`)
    .join(' ')
}

function main(): void {
  const allResults: RunResult[] = []

  for (const clubId of CLUBS) {
    for (let i = 0; i < RUNS_PER_CLUB; i++) {
      const seed = clubId === 'club_skutskar' ? 30_000 + i : 40_000 + i
      allResults.push(runOne(clubId, seed))
    }
  }

  console.log('\n=== Grind 1 v3 — verifiering consecutiveLosses + full positionsfördelning (2026-08-23) ===\n')

  for (const clubId of CLUBS) {
    const clubResults = allResults.filter(r => r.clubId === clubId)
    const crashed = clubResults.filter(r => r.crashed)
    const valid = clubResults.filter(r => !r.crashed)
    const firedRuns = valid.filter(r => r.fired)
    const allSamples = valid.flatMap(r => r.samples)
    const firedSeasonSamples = allSamples.filter(s => s.fired)
    const survivedSeasonSamples = allSamples.filter(s => !s.fired)

    console.log(`--- ${clubId} (${valid.length} giltiga, ${crashed.length} kraschade) ---`)
    console.log(`Sparkad inom ${SEASONS} säsonger: ${firedRuns.length}/${valid.length}`)
    console.log(`Avskedsorsak-fördelning: ${JSON.stringify(firedRuns.reduce((acc: Record<string, number>, r) => { const k = r.firedReason ?? 'okänd'; acc[k] = (acc[k] ?? 0) + 1; return acc }, {}))}`)
    console.log(`Säsongssampel totalt: ${allSamples.length} (varje sampel = en HELT spelad säsong, oavsett om den slutade i avsked)`)
    console.log(`Positionsfördelning, ALLA sampel (1-12): ${positionHistogram(allSamples)}`)
    console.log(`Positionsfördelning, säsonger som slutade i avsked: ${positionHistogram(firedSeasonSamples)}`)
    console.log(`Positionsfördelning, säsonger utan avsked: ${positionHistogram(survivedSeasonSamples)}`)

    const wdlOf = (s: SeasonSample[]) => s.length === 0 ? '-' : `W=${(s.reduce((a, x) => a + x.wins, 0) / s.length).toFixed(1)} D=${(s.reduce((a, x) => a + x.draws, 0) / s.length).toFixed(1)} L=${(s.reduce((a, x) => a + x.losses, 0) / s.length).toFixed(1)}`
    console.log(`Snitt W/D/L per säsong, avsked: ${wdlOf(firedSeasonSamples)}`)
    console.log(`Snitt W/D/L per säsong, ej avsked: ${wdlOf(survivedSeasonSamples)}`)

    const streaks = allSamples.map(s => s.maxLosingStreak).sort((a, b) => a - b)
    console.log(`Max förlustsvit/säsong — min=${streaks[0]} max=${streaks[streaks.length - 1]} median=${streaks[Math.floor(streaks.length / 2)]}`)

    for (const r of crashed) {
      console.log(`  KRASCH seed=${r.seed}: ${r.crashMsg}`)
    }
    console.log()
  }
}

main()
