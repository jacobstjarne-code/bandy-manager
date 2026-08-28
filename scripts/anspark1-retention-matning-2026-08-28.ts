/**
 * MEASUREMENT-ONLY. A-H2b RETENTION (DOM_AH2B_RETENTION_2026-08-28.md).
 *
 * De fem tidigare kronmåtten kraschade på samma sten (en dominant klubbs
 * intäkter växer långt fortare än dess lönekrav, så "har du råd" svarar
 * alltid ja). Domen: mät i SPELARE, inte kronor. Detta script mäter exakt
 * det domens egen sektion "Mät mot AVGÅNGAR, inte kronor" efterfrågar:
 *
 *   1. En dominant klubb som FÖRSUMMAR kraven (policy: möt inga) förlorar
 *      märkbart FLER oönskade spelare/säsong än en som MÖTER dem (policy:
 *      möt alla) — levern (obemött krav → moral → budsårbarhet) fungerar.
 *   2. En dominant klubb förlorar ~1 spelare/säsong den helst behållit ÄVEN
 *      OM den betalar (anspråk 2:s grundpris för framgång står kvar — bud
 *      kommer oavsett, moral-gaten sänker risken, nollar den inte).
 *   3. Ett mittenlag rör mekaniken sällan (få överpresterare × låg budchans).
 *
 * Ingen kronjämförelse någonstans i detta script — bara antal spelare som
 * lämnar den hanterade klubben via ett accepterat inkommande bud.
 *
 * ── METODIK ─────────────────────────────────────────────────────────────
 * Headless säsongsloop (samma harness som scripts/stress-test.ts):
 * createNewGame → autoSelectLineup → advanceToNextEvent, upprepat tills
 * säsongen är slut. Två tillägg mot standardharnesset:
 *
 * (a) pendingScreen === 'contract_demands' hanteras INTE av stress/fixtures.ts
 *     ts autoResolvePendingScreen (den har en fast "möt alla"-policy) — här
 *     styrs den av DENNA körnings POLICY-parameter (meet-all/meet-none), så
 *     de två grenarna faktiskt kan jämföras.
 *
 * (b) Inkommande bud (TransferBid.direction==='incoming') löses INTE
 *     automatiskt av roundProcessor — de är, precis som i den riktiga appen,
 *     en opt-in-åtgärd (TransfersScreen → respondToIncomingBid → bidReceivedEvent
 *     + resolveEvent). En headless körning som ALDRIG anropar det ser alltså
 *     ALDRIG en enda avgång (buden expirerar bara efter tre omgångar) — det
 *     hade gjort hela mätningen meningslös. Detta script replikerar EXAKT
 *     samma två domänanrop (bidReceivedEvent + resolveEvent) store-actionen
 *     `respondToIncomingBid` gör, med en enkel, rimlig manager-policy:
 *     acceptera om budet är på/över marknadsvärdet (en rationell säljare
 *     till fair value) — annars avslå. Detta ÄR en modellerad policy för
 *     detta script, INTE en ändring av produktionskod (som fortfarande
 *     kräver en mänsklig klick).
 *
 * Kör: node_modules/.bin/vite-node scripts/anspark1-retention-matning-2026-08-28.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup } from './stress/fixtures'
import { applyContractDemandResolutions } from '../src/domain/services/contractDemandService'
import { bidReceivedEvent } from '../src/domain/services/events/eventFactories'
import { resolveEvent } from '../src/domain/services/eventService'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { TransferBid } from '../src/domain/entities/GameEvent'
import { mulberry32 } from '../src/domain/utils/random'

const SEASONS = 8
const DOMINANCE_BOOST = 10  // samma steg-0-val som föregående mätpass (budgettryck-ekonomi)

type DemandPolicy = 'meet-all' | 'meet-none'

// ── Pending-screen resolution (utom contract_demands, som styrs av policy) ──
// VIKTIGT: 'season_summary' klarar sig INTE med en blind clear — den riktiga
// store-actionen (clearSeasonSummary, gameFlowActions.ts) kollar
// pendingContractDemands och growlar över till PendingScreen.ContractDemands
// istf null när krav finns. Replikerar EXAKT den grenen här — annars visas
// (i detta script) aldrig kravskärmen alls, och hela mätningen mäter noll.
const AUTO_CLEAR_SCREENS = new Set(['board_meeting', 'pre_season', 'half_time_summary', 'playoff_intro', 'qf_summary'])

function resolvePendingScreens(game: SaveGame, policy: DemandPolicy): SaveGame {
  let g = game
  let guard = 0
  while (g.pendingScreen && guard < 20) {
    guard++
    if (g.pendingScreen === 'season_summary') {
      const hasDemands = (g.pendingContractDemands ?? []).length > 0
      g = { ...g, pendingScreen: hasDemands ? ('contract_demands' as SaveGame['pendingScreen']) : null }
      continue
    }
    if (g.pendingScreen === 'contract_demands') {
      const demands = g.pendingContractDemands ?? []
      const resolutions = Object.fromEntries(
        demands.map(d => [d.playerId, policy === 'meet-all' ? 'met' as const : 'skipped' as const]),
      )
      const updatedPlayers = applyContractDemandResolutions(g.players, demands, resolutions)
      g = { ...g, players: updatedPlayers, pendingContractDemands: undefined, pendingScreen: null }
      continue
    }
    if (AUTO_CLEAR_SCREENS.has(g.pendingScreen as string)) {
      g = { ...g, pendingScreen: null }
      continue
    }
    break // okänd skärmtyp — stoppa hellre än att gissa
  }
  return g
}

// ── Inkommande bud — manager-policy för DETTA script (se filhuvud) ─────────
//
// Kalibreringsrond 1 (loggat, inte gissning): "acceptera vid/över marknads-
// värde" fick en boostad dominant klubb avskedad redan säsong 3 i ALLA fyra
// grenar (identiskt utfall meet-all/meet-none) — inte ett A-H2b-fynd, en
// artefakt av policyn självt. computeBidChance (redan byggd, anspråk 2) ger
// en dominant klubb ~10x en mittenklubbs budfrekvens; en policy som säljer
// VARJE spelare vid fair value tömmer truppen på kvalitet oavsett moral,
// vilket dränker signalen mekaniken faktiskt ska mätas mot. En riktig
// manager säljer inte reflexmässigt vid fair value — hen säljer vid ett
// LYSANDE bud, ELLER vid ett okej bud på en spelare som ändå är på väg bort
// (låg moral). Denna policy knyter alltså avgångar till just den kedja
// A-H2b bygger (moral → budsårbarhet), inte till ren budfrekvens.
const ACCEPT_ALWAYS_MULTIPLIER = 1.3   // lysande bud — säljs oavsett moral
const ACCEPT_UNHAPPY_MULTIPLIER = 0.85 // okej bud — säljs BARA om spelaren redan är missnöjd
const UNHAPPY_MORALE_THRESHOLD = 40

function resolveIncomingBids(game: SaveGame, rand: () => number): { game: SaveGame; departures: number } {
  const pendingIncoming = (game.transferBids ?? []).filter(
    b => b.direction === 'incoming' && b.status === 'pending' && b.sellingClubId === game.managedClubId,
  )
  let g = game
  let departures = 0
  for (const bid of pendingIncoming) {
    const player = g.players.find(p => p.id === bid.playerId)
    if (!player) continue
    const marketVal = player.marketValue ?? 50000
    const accept = bid.offerAmount >= marketVal * ACCEPT_ALWAYS_MULTIPLIER
      || (bid.offerAmount >= marketVal * ACCEPT_UNHAPPY_MULTIPLIER && player.morale < UNHAPPY_MORALE_THRESHOLD)
    const event = bidReceivedEvent(bid as TransferBid, g)
    const withEvent: SaveGame = { ...g, pendingEvents: [...(g.pendingEvents ?? []), event] }
    g = resolveEvent(withEvent, event.id, accept ? 'accept' : 'reject', rand)
    // Städa bort eventet ur pendingEvents igen — det här scriptet bryr sig
    // bara om den domän-mutation resolveEvent gör, inte om UI-kön.
    g = { ...g, pendingEvents: (g.pendingEvents ?? []).filter(e => e.id !== event.id) }
    if (accept) departures++
  }
  return { game: g, departures }
}

interface SeasonRow {
  season: number
  qualifiedDemands: number
  metCount: number
  departures: number
  managerFired: boolean
}

function runClub(clubId: string, boost: number, seed: number, policy: DemandPolicy, seasons: number): SeasonRow[] {
  let game = createNewGame({ managerName: `AH2B-RET-${clubId}-${policy}`, clubId, seed })
  if (boost > 0) {
    game = { ...game, players: game.players.map(p => p.clubId === game.managedClubId ? { ...p, currentAbility: Math.min(99, p.currentAbility + boost) } : p) }
  }
  game = { ...game, pendingScreen: null }

  const rand = mulberry32(seed * 7919 + 1)
  const rows: SeasonRow[] = []
  let stepSeed = seed * 1000

  for (let season = 1; season <= seasons; season++) {
    let seasonDone = false
    let guard = 0
    let seasonDepartures = 0
    let qualifiedDemands = 0
    let metCount = 0
    let sawDemandsThisSeason = false

    while (!seasonDone) {
      guard++
      if (guard > 2000) throw new Error(`${clubId}/${policy} seed=${seed} säsong ${season}: round guard tripped`)
      game = autoSelectLineup(game)
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game

      // Fånga kraven INNAN de löses — pendingContractDemands sätts av
      // seasonEndProcessor.ts SAMTIDIGT som pendingScreen='season_summary'
      // (kravskärmen visas först EFTER att season_summary klickats bort, se
      // resolvePendingScreens nedan) — läs fältet direkt, invänta inte att
      // pendingScreen hunnit växla till 'contract_demands'.
      if (game.pendingContractDemands !== undefined && !sawDemandsThisSeason) {
        sawDemandsThisSeason = true
        const demands = game.pendingContractDemands
        qualifiedDemands = demands.length
        metCount = policy === 'meet-all' ? demands.length : 0
      }

      game = resolvePendingScreens(game, policy)

      const bidResult = resolveIncomingBids(game, rand)
      game = bidResult.game
      seasonDepartures += bidResult.departures

      if (result.seasonEnded || game.managerFired) seasonDone = true
    }

    rows.push({ season, qualifiedDemands, metCount, departures: seasonDepartures, managerFired: !!game.managerFired })
    if (game.managerFired) {
      console.log(`  [${clubId}/${policy} seed=${seed}] avskedad efter säsong ${season} — stoppar (${seasons - season} säsonger saknas)`)
      break
    }
  }
  return rows
}

function avg(nums: number[]): number {
  return nums.length === 0 ? 0 : nums.reduce((s, n) => s + n, 0) / nums.length
}

function printRows(label: string, rows: SeasonRow[]): void {
  console.log(`\n=== ${label} ===`)
  console.log('Säsong | kval.krav | mötta | avgångar')
  for (const r of rows) {
    console.log(`${String(r.season).padStart(6)} | ${String(r.qualifiedDemands).padStart(9)} | ${String(r.metCount).padStart(5)} | ${String(r.departures).padStart(8)}${r.managerFired ? '  (AVSKEDAD)' : ''}`)
  }
  console.log(`  Snitt kval. krav/säsong: ${avg(rows.map(r => r.qualifiedDemands)).toFixed(2)}`)
  console.log(`  Snitt avgångar/säsong:   ${avg(rows.map(r => r.departures)).toFixed(2)}`)
  console.log(`  Totalt avgångar:         ${rows.reduce((s, r) => s + r.departures, 0)} över ${rows.length} säsonger`)
}

// Robusthetspool — samma princip som tidigare A-H2b-mätpass (budgettryck-
// ekonomi m.fl.): en huvudkörning (seed 100/2, kontinuitet med tidigare
// mätpass) + fyra extra seeds, poolade, så "avgångar/säsong" inte vilar på
// en enda karriärs slump (särskilt eftersom flera körningar avskedas mitt i
// och avkortar sitt eget mätfönster).
const DOMINANT_SEEDS = [100, 101, 102, 103, 104]
const MIDTABLE_SEEDS = [2, 3, 4, 5, 6]

function runPool(clubId: string, boost: number, seeds: number[], policy: DemandPolicy, seasons: number): SeasonRow[] {
  const pooled: SeasonRow[] = []
  for (const seed of seeds) {
    pooled.push(...runClub(clubId, boost, seed, policy, seasons))
  }
  return pooled
}

function main(): void {
  console.log('\n============================================================')
  console.log('A-H2b RETENTION — mätning mot AVGÅNGAR, inte kronor (2026-08-28)')
  console.log('============================================================')

  console.log(`\n--- DOMINANT klubb (club_vastanfors, +${DOMINANCE_BOOST} CA), policy=meet-all, ${DOMINANT_SEEDS.length} seeds ---`)
  const domMeetAll = runPool('club_vastanfors', DOMINANCE_BOOST, DOMINANT_SEEDS, 'meet-all', SEASONS)

  console.log(`\n--- DOMINANT klubb (club_vastanfors, +${DOMINANCE_BOOST} CA), policy=meet-none, ${DOMINANT_SEEDS.length} seeds ---`)
  const domMeetNone = runPool('club_vastanfors', DOMINANCE_BOOST, DOMINANT_SEEDS, 'meet-none', SEASONS)

  console.log(`\n--- MID-TABLE klubb (club_malilla, orörd), policy=meet-none, ${MIDTABLE_SEEDS.length} seeds ---`)
  const midMeetNone = runPool('club_malilla', 0, MIDTABLE_SEEDS, 'meet-none', SEASONS)

  console.log(`\n--- MID-TABLE klubb (club_malilla, orörd), policy=meet-all, ${MIDTABLE_SEEDS.length} seeds ---`)
  const midMeetAll = runPool('club_malilla', 0, MIDTABLE_SEEDS, 'meet-all', SEASONS)

  printRows('DOMINANT — MÖT ALLA KRAV (poolad, alla seeds/säsonger)', domMeetAll)
  printRows('DOMINANT — MÖT INGA KRAV, försummar (poolad)', domMeetNone)
  printRows('MID-TABLE — MÖT INGA KRAV (poolad)', midMeetNone)
  printRows('MID-TABLE — MÖT ALLA KRAV (poolad)', midMeetAll)

  console.log('\n\n=== DOMSLUT (utan tuning) ===')
  const domAllAvg = avg(domMeetAll.map(r => r.departures))
  const domNoneAvg = avg(domMeetNone.map(r => r.departures))
  const midAllAvg = avg(midMeetAll.map(r => r.departures))
  const midNoneAvg = avg(midMeetNone.map(r => r.departures))
  console.log(`  1. Dominant, möt alla:  ${domAllAvg.toFixed(2)} avgångar/säsong`)
  console.log(`     Dominant, möt inga:  ${domNoneAvg.toFixed(2)} avgångar/säsong`)
  console.log(`     → Levern fungerar (möt-inga > möt-alla)?  ${domNoneAvg > domAllAvg ? 'JA' : 'NEJ'}`)
  console.log(`  2. Dominant, möt alla ≈ 1 avgång/säsong (anspråk 2:s grundpris kvarstår)?  ${domAllAvg.toFixed(2)} (mål: >0, inte 0)`)
  console.log(`  3. Mittenlag, möt inga:  ${midNoneAvg.toFixed(2)} avgångar/säsong`)
  console.log(`     Mittenlag, möt alla:  ${midAllAvg.toFixed(2)} avgångar/säsong`)
  console.log(`     → Mittenlaget rör mekaniken sällan (klart lägre än dominant möt-inga)?  ${midNoneAvg < domNoneAvg ? 'JA' : 'NEJ'}`)
  console.log(`  Snitt kval. krav/säsong — dominant: ${avg(domMeetAll.map(r => r.qualifiedDemands)).toFixed(2)}  ·  mittenlag: ${avg(midMeetNone.map(r => r.qualifiedDemands)).toFixed(2)}`)

  console.log('\n=== SLUT ===\n')
}

main()
