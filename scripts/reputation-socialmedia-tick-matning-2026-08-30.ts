/**
 * MÄTNING — socialMedia-ryktetickens koppling till placering (fix för
 * sidofynd B, DOM_ANSPAK4_ORTSUNDERHALL_2026-08-29.md, economyProcessor.ts:177-184).
 *
 * Bugg: +1 rykte var 5:e matchday när socialMedia är på, helt frikopplat
 * från placering. Mätt konsekvens (rapporterad i domen): club_malilla
 * (mittenklubb, placering 5/8/6) nådde rykte 100 på tre säsonger.
 *
 * Fix: tick:en kräver nu ATT klubben ligger i topp 3 av tabellen (utöver
 * socialMedia-flaggan och matchday%5===0). Detta script mäter
 * ryktebanan för samma mittenklubb (club_malilla) OCH en genuint
 * dominant klubb (club_vastanfors, +10 CA — samma konstruktion som
 * ansprak4-ortsunderhall-matning-2026-08-30.ts, verifierad topp-3 i
 * 10/10 provsäsonger) över tre säsonger, med socialMedia PÅSLAGEN hela
 * tiden (värsta scenariot för inflation).
 *
 * Kör: node_modules/.bin/vite-node scripts/reputation-socialmedia-tick-matning-2026-08-30.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const SEASONS = 3
const DOMINANCE_BOOST = 10 // samma konstruktion som ansprak4-scriptet, ej omgissad

const CONTROL_CLUB = 'club_malilla'
const CONTROL_SEED = 2

const DOMINANT_CLUB = 'club_vastanfors'
const DOMINANT_SEED = 100

function makeGame(clubId: string, boost: number, seed: number): SaveGame {
  const base = createNewGame({ managerName: `REP-${clubId}`, clubId, seed })
  // communityActivities är optional PÅ SaveGame (kan i teorin saknas helt),
  // men createNewGame() sätter den alltid — icke-null-assert är säkert här,
  // annars sprids optional-statusen in i varje enskilt fält (kiosk m.fl.
  // blir 'X | undefined' trots att CommunityActivities kräver dem satta).
  let g: SaveGame = { ...base, pendingScreen: null, communityActivities: { ...base.communityActivities!, socialMedia: true } }
  if (boost !== 0) {
    g = {
      ...g,
      players: g.players.map(p =>
        p.clubId === g.managedClubId ? { ...p, currentAbility: Math.min(99, p.currentAbility + boost) } : p,
      ),
    }
  }
  return g
}

interface SeasonRow {
  season: number
  reputation: number
  finalPosition: number | null
}

function runClub(label: string, clubId: string, boost: number, seed: number, seasons: number): SeasonRow[] {
  let game = makeGame(clubId, boost, seed)
  const rows: SeasonRow[] = []
  let stepSeed = seed * 1000
  const startRep = game.clubs.find(c => c.id === clubId)!.reputation
  console.log(`\n[${label}] start-rykte: ${startRep}`)

  for (let season = 1; season <= seasons; season++) {
    let seasonDone = false
    let guard = 0
    // Tvinga socialMedia PÅ varje omgång — communityActivities kan i teorin
    // nollställas av annan kod mellan omgångar, säkerställ värsta scenariot.
    while (!seasonDone) {
      guard++
      if (guard > 2000) throw new Error(`${label} säsong ${season}: round guard tripped`)
      game = { ...game, communityActivities: { ...game.communityActivities!, socialMedia: true } }
      game = autoSelectLineup(game)
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game

      if (result.seasonEnded || game.managerFired) {
        seasonDone = true
      } else {
        const resolved = autoResolvePendingScreen(game)
        if (resolved.unresolvable) {
          console.log(`  [${label} seed=${seed}] säsong ${season}: unresolvable pendingScreen (${resolved.screenType}) — avbryter`)
          return rows
        }
        game = resolved.game
      }
    }

    const club = game.clubs.find(c => c.id === clubId)!
    const summaries = game.seasonSummaries ?? []
    const thisSummary = summaries[summaries.length - 1]
    rows.push({ season, reputation: club.reputation, finalPosition: thisSummary?.finalPosition ?? null })

    if (game.managerFired) {
      console.log(`  [${label} seed=${seed}] AVSKEDAD efter säsong ${season} — stoppar`)
      break
    }
  }
  return rows
}

function printRows(label: string, rows: SeasonRow[]): void {
  console.log(`\n--- ${label} ---`)
  console.log('säsong | placering | rykte')
  for (const r of rows) {
    console.log(`${String(r.season).padStart(6)} | ${String(r.finalPosition ?? '-').padStart(9)} | ${String(r.reputation).padStart(5)}`)
  }
}

function main(): void {
  console.log('============================================================')
  console.log('REPUTATION SOCIALMEDIA-TICK — mätning (efter fix)')
  console.log('============================================================')

  const control = runClub('KONTROLL (mittenlag)', CONTROL_CLUB, 0, CONTROL_SEED, SEASONS)
  printRows(`KONTROLL — ${CONTROL_CLUB} seed=${CONTROL_SEED}`, control)

  const dominant = runClub('DOMINANT', DOMINANT_CLUB, DOMINANCE_BOOST, DOMINANT_SEED, SEASONS)
  printRows(`DOMINANT — ${DOMINANT_CLUB}+${DOMINANCE_BOOST} seed=${DOMINANT_SEED}`, dominant)

  console.log('\n=== SLUT ===')
}

main()
