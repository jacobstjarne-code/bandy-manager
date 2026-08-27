/**
 * Jacobs order 2026-08-27, tredje uppdraget: "Går Heros plus på BASIC-nivån
 * (ingen VIP) med hög communityStanding?" Om ja fungerar Survive-kontraktet
 * — orten räcker för en klubb som inte överbygger. Om nej är golvet (50% av
 * driftskostnaden) för lågt GENERELLT, inte bara för Heros specifikt.
 *
 * Metod: kör en riktig säsong för Heros med communityStanding tvingat högt
 * (90) varje omgång (skriver över den normala drift-mekaniken precis innan
 * varje advanceToNextEvent), communityActivities låst till kiosk:'basic',
 * ingen VIP, inga övriga aktiviteter. Samlar in fixture.attendance per
 * hemmamatch (riktig simulering, påverkad av det tvingade cs-värdet via
 * computeAttendanceRate). Räknar sedan communityMatchIncome med DEN RIKTIGA
 * produktionsformeln (calcRoundIncome, redan wirad kandidat 2) — inte en
 * ombyggd kopia — för att inte mäta mot en formel som kan ha driftat isär
 * från det som faktiskt körs.
 *
 * Kör: node_modules/.bin/vite-node scripts/askadarekonomin-heros-basic-hog-cs-2026-08-27.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import { calcRoundIncome } from '../src/domain/services/economyService'
import { FixtureStatus } from '../src/domain/enums'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { CommunityActivities } from '../src/domain/entities/SaveGame'

const SEED = 91_000
const FORCED_CS = 90
const CLUB_ID = 'club_heros'

const BASIC_ONLY: CommunityActivities = {
  kiosk: 'basic',
  lottery: 'none',
  bandyplay: false,
  functionaries: false,
  julmarknad: false,
}

interface HomeMatchSample {
  matchday: number
  attendance: number
  fanMood: number
}

function runSeason(): { samples: HomeMatchSample[]; crashed: boolean } {
  let game: SaveGame = createNewGame({ managerName: 'HerosBasicHogCs', clubId: CLUB_ID, seed: SEED })
  game = { ...game, pendingScreen: null, communityActivities: BASIC_ONLY, communityStanding: FORCED_CS }
  const samples: HomeMatchSample[] = []
  let stepSeed = SEED * 100_000 + 1_000

  try {
    let seasonDone = false
    let guardRounds = 0
    let lastSeenFixtureCount = 0
    while (!seasonDone) {
      guardRounds++
      if (guardRounds > 2000) throw new Error('season never ended — round guard tripped')

      game = autoSelectLineup(game)
      // Tvinga cs och aktiviteter varje omgång — skriv över eventuell drift
      // från förra rundans event-processorer.
      game = { ...game, communityActivities: BASIC_ONLY, communityStanding: FORCED_CS }
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game

      const homeFixtures = game.fixtures.filter(f =>
        f.homeClubId === CLUB_ID && f.status === FixtureStatus.Completed && typeof f.attendance === 'number',
      )
      if (homeFixtures.length > lastSeenFixtureCount) {
        const newOnes = homeFixtures.slice(lastSeenFixtureCount)
        for (const f of newOnes) {
          samples.push({ matchday: f.matchday ?? 0, attendance: f.attendance!, fanMood: game.fanMood ?? 50 })
        }
        lastSeenFixtureCount = homeFixtures.length
      }

      if (result.seasonEnded || game.managerFired) {
        seasonDone = true
      } else {
        const resolved = autoResolvePendingScreen(game)
        if (resolved.unresolvable) throw new Error(`unresolvable pendingScreen: ${resolved.screenType}`)
        game = resolved.game
      }
    }
  } catch (e) {
    console.log('KRASCH:', e)
    return { samples, crashed: true }
  }
  return { samples, crashed: false }
}

function main(): void {
  console.log(`\n=== Heros, kiosk basic (ingen VIP), communityStanding tvingat till ${FORCED_CS} — hela säsongen (seed=${SEED}) ===\n`)

  const { samples, crashed } = runSeason()
  if (crashed) {
    console.log('Säsongen kraschade — inget resultat.')
    return
  }

  const deterministicRand = () => 0.5

  let totalNet = 0
  console.log(`Hemmamatcher: ${samples.length}\n`)
  for (const s of samples) {
    const result = calcRoundIncome({
      club: { id: CLUB_ID, name: 'Heros', shortName: 'Heros', region: '', reputation: 45,
        finances: 0, wageBudget: 0, transferBudget: 0, youthQuality: 50, youthRecruitment: 50,
        youthDevelopment: 50, facilities: 50, boardExpectation: 0 as any, fanExpectation: 0 as any,
        preferredStyle: 0 as any, hasArtificialIce: false, arenaCapacity: undefined,
        activeTactic: {} as any, squadPlayerIds: [] } as any,
      players: [], sponsors: [], communityActivities: BASIC_ONLY,
      fanMood: s.fanMood, isHomeMatch: true, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
      communityStanding: FORCED_CS,
      matchAttendance: s.attendance,
    })
    totalNet += result.communityMatchIncome
    console.log(`  matchday=${String(s.matchday).padStart(2)} attendance=${String(s.attendance).padStart(4)} fanMood=${String(s.fanMood).padStart(3)} communityMatchIncome=${result.communityMatchIncome}`)
  }

  const avgAttendance = samples.length > 0 ? Math.round(samples.reduce((sum, s) => sum + s.attendance, 0) / samples.length) : 0
  console.log(`\nSnittpublik vid cs=${FORCED_CS}: ${avgAttendance}`)
  console.log(`Total communityMatchIncome (kiosk basic, hela säsongen): ${totalNet}`)
  console.log(`Snitt per hemmamatch: ${samples.length > 0 ? Math.round(totalNet / samples.length) : 0}`)
  console.log(`\n=== SLUTSATS: Heros går ${totalNet > 0 ? 'PLUS' : 'MINUS'} på kiosk basic vid cs=${FORCED_CS} ===\n`)
}

main()
