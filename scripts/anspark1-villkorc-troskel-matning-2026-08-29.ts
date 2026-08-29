/**
 * MEASUREMENT-ONLY. A-H2b RETENTION — VILLKOR 2, DÖRR (c) TRÖSKEL (2026-08-29).
 *
 * Bakgrund (docs/SLUTTEST_KO.md A-H2b-raden "dörr (c)", scripts/anspark1-
 * villkor2-matning-2026-08-29.ts): dörr (c) — "förbättrat sin slutplacering
 * mot föregående säsong" — implementerades ordagrant ur doktrinen som
 * `finalPosition < previousPosition`, dvs. VILKEN förbättring som helst,
 * även ±1 placering. Den tidigare mätningen visade att detta får dörr (c)
 * att slå in i ~50 % av mittenlagets säsonger — ren tabellbrus, inte ett
 * genuint framgångstecken. Jacob har nu godkänt: mät fördelningen av
 * SÄSONG-TILL-SÄSONG-PLACERINGSFÖRÄNDRINGAR (inte bara "förbättrades/inte"),
 * hitta var bruset slutar och en riktig signal börjar, och lås en tröskel
 * N (dörr c kräver minst N placeringars förbättring) med ett D-fact.
 *
 * ── METODIK ─────────────────────────────────────────────────────────────
 * Ingen källkodspatch behövs den här gången (till skillnad från villkor-2-
 * mätningen 2026-08-29, som var tvungen att patcha in env-flaggor för att
 * isolera playoffBracket/cupBracket-informationen som bara lever INUTI
 * seasonEndProcessor.ts vid prövningsögonblicket). `game.seasonStartSnapshot
 * .finalPosition` sätts av EXAKT samma seasonEndProcessor.ts-block
 * (rad ~1623-1639, se contractDemandService.ts:s filhuvudskommentar) VARJE
 * säsongsslut, till den nyss avslutade säsongens sanna tabellplacering
 * (läst från `game.standings`, som vid det tillfället — INNAN rollover-
 * objektet returneras — fortfarande är den färdigspelade säsongens riktiga
 * tabell, inte nästa säsongs alfabetiska dummytabell). Fältet ÖVERLEVER i
 * det returnerade game-objektet (det är därför dörr (c) i produktionskoden
 * kan läsa "föregående säsongs placering" överhuvudtaget). Ett externt
 * script kan alltså bara läsa av `game.seasonStartSnapshot.finalPosition`
 * efter VARJE säsongsslut och bygga hela tidsserien av slutplaceringar —
 * ingen patch, ingen isolering, samma harness som stress-test.ts.
 *
 * Robusthetspool — samma klubbkonstruktioner som etablerats i hela den här
 * mätserien (anspark1-retention-matning-2026-08-28.ts m.fl.):
 *   - DOMINANT: club_vastanfors, +10 CA-boost, seeds [100..104]
 *   - MITTENLAG: club_malilla, orörd, seeds [2..6]
 * 15 säsonger/seed (mer än de 8 tidigare passen använt, för att få fler
 * position-till-position-övergångar per klubbtyp — varje säsong ger en
 * övergång, så 15 säsonger × 5 seeds = upp till 70 övergångar/klubbtyp,
 * minus ev. tidiga avsked som kapar en körning).
 *
 * Kontraktskrav under körningen löses med policy "möt inga" (enklast,
 * minimal sidoeffekt på lönebudget/moral som annars kunde färga truppens
 * utveckling år för år — se resolvePendingScreens nedan). Inkommande bud
 * LÄMNAS OLÖSTA (expirerar efter tre omgångar, som i produktion om
 * spelaren aldrig öppnar Transfers-skärmen) — detta script mäter ren
 * tabellrörelse, inte den avgångskedja anspark1-retention-matning-
 * 2026-08-28.ts redan mätt.
 *
 * Kör: node_modules/.bin/vite-node scripts/anspark1-villkorc-troskel-matning-2026-08-29.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup } from './stress/fixtures'
import { applyContractDemandResolutions } from '../src/domain/services/contractDemandService'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const SEASONS = 15
const DOMINANCE_BOOST = 10

const AUTO_CLEAR_SCREENS = new Set(['board_meeting', 'pre_season', 'half_time_summary', 'playoff_intro', 'qf_summary'])

function resolvePendingScreens(game: SaveGame): SaveGame {
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
      // Policy: möt inga — se filhuvud.
      const demands = g.pendingContractDemands ?? []
      const resolutions = Object.fromEntries(demands.map(d => [d.playerId, 'skipped' as const]))
      const updatedPlayers = applyContractDemandResolutions(g.players, demands, resolutions)
      g = { ...g, players: updatedPlayers, pendingContractDemands: undefined, pendingScreen: null }
      continue
    }
    if (AUTO_CLEAR_SCREENS.has(g.pendingScreen as string)) {
      g = { ...g, pendingScreen: null }
      continue
    }
    break
  }
  return g
}

interface SeasonPosition {
  season: number
  finalPosition: number
  managerFired: boolean
}

function runClub(clubId: string, boost: number, seed: number, seasons: number): SeasonPosition[] {
  let game = createNewGame({ managerName: `AH2B-THRESH-${clubId}`, clubId, seed })
  if (boost > 0) {
    game = { ...game, players: game.players.map(p => p.clubId === game.managedClubId ? { ...p, currentAbility: Math.min(99, p.currentAbility + boost) } : p) }
  }
  game = { ...game, pendingScreen: null }

  const rows: SeasonPosition[] = []
  let stepSeed = seed * 1000
  let lastSeenSnapshotSeason = -1

  for (let season = 1; season <= seasons; season++) {
    let seasonDone = false
    let guard = 0

    while (!seasonDone) {
      guard++
      if (guard > 2000) throw new Error(`${clubId} seed=${seed} säsong ${season}: round guard tripped`)
      game = autoSelectLineup(game)
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game
      game = resolvePendingScreens(game)
      if (result.seasonEnded || game.managerFired) seasonDone = true
    }

    // seasonStartSnapshot uppdateras av seasonEndProcessor.ts VARJE
    // säsongsslut till just-avslutade säsongens placering (se filhuvud).
    // .season-fältet identifierar VILKEN säsong snapshotten beskriver —
    // läs bara av när det är en ny snapshot (skydd mot avskedsfallet, där
    // seasonStartSnapshot INTE uppdateras — managerFired-grenen i
    // seasonEndProcessor.ts behåller game.seasonStartSnapshot oförändrat).
    const snap = game.seasonStartSnapshot
    if (snap && snap.season !== lastSeenSnapshotSeason) {
      lastSeenSnapshotSeason = snap.season
      rows.push({ season, finalPosition: snap.finalPosition, managerFired: !!game.managerFired })
    }

    if (game.managerFired) {
      console.log(`  [${clubId} seed=${seed}] avskedad efter säsong ${season} — stoppar (${seasons - season} säsonger saknas)`)
      break
    }
  }
  return rows
}

// Utökad seedpool mot tidigare pass (5/klubbtyp): headless auto-play-
// harnesset (samma som alla anspark1-script i denna serie) avskedar
// managern efter i snitt 4-5 säsonger oavsett policy/klubbtyp (bekräftat
// mot scripts/anspark1-retention-matning-2026-08-28.ts — ALLA 18 dess
// körningar slutade avskedade inom 8 säsonger). Varje karriär ger alltså
// bara 2-6 säsong-till-säsong-övergångar, för få för en tillförlitlig
// percentilfördelning vid 5 seeds/klubbtyp (gav bara 20/9 övergångar i en
// första körning). 20 seeds/klubbtyp (samma startpunkt 100/2 som etablerad
// konvention, utökad range) ger istället 60-90 övergångar/klubbtyp.
const DOMINANT_SEEDS = Array.from({ length: 20 }, (_, i) => 100 + i)
const MIDTABLE_SEEDS = Array.from({ length: 20 }, (_, i) => 2 + i)

function runPool(clubId: string, boost: number, seeds: number[], seasons: number): SeasonPosition[][] {
  return seeds.map(seed => runClub(clubId, boost, seed, seasons))
}

// Bygger position-till-position-DELTA (season N+1 - season N) inom varje
// seeds egen kontinuerliga körning — ett avsked bryter kontinuiteten (näst
// avslutad säsong har ingen känd "föregående" i DENNA klubbs regi, eftersom
// en ny manager/klubb tar vid i verkligheten), så delta beräknas bara
// mellan konsekutiva rader i SAMMA runClub-resultat.
function positionDeltas(pools: SeasonPosition[][]): number[] {
  const deltas: number[] = []
  for (const rows of pools) {
    for (let i = 1; i < rows.length; i++) {
      // rows[i].season === rows[i-1].season + 1 garanterat av loopen ovan
      // (ingen lucka kan uppstå utom vid avsked, som avslutar arrayen).
      deltas.push(rows[i - 1].finalPosition - rows[i].finalPosition) // positivt = förbättring (lägre placeringssiffra = bättre)
    }
  }
  return deltas
}

function printDistribution(label: string, deltas: number[]): void {
  console.log(`\n=== ${label} — ${deltas.length} säsong-till-säsong-övergångar ===`)
  const buckets = new Map<number, number>()
  for (const d of deltas) buckets.set(d, (buckets.get(d) ?? 0) + 1)
  const sortedKeys = [...buckets.keys()].sort((a, b) => a - b)
  for (const k of sortedKeys) {
    const count = buckets.get(k)!
    const pct = (100 * count / deltas.length).toFixed(1)
    const sign = k > 0 ? '+' : ''
    console.log(`  delta ${sign}${k}: ${String(count).padStart(3)}  (${pct}%)`)
  }
  const improved = deltas.filter(d => d > 0).length
  const worsened = deltas.filter(d => d < 0).length
  const same = deltas.filter(d => d === 0).length
  console.log(`  Förbättrad (delta>0): ${improved} (${(100 * improved / deltas.length).toFixed(1)}%)  |  Oförändrad: ${same} (${(100 * same / deltas.length).toFixed(1)}%)  |  Försämrad: ${worsened} (${(100 * worsened / deltas.length).toFixed(1)}%)`)
  for (const n of [1, 2, 3, 4]) {
    const atLeast = deltas.filter(d => d >= n).length
    console.log(`  Andel med delta >= +${n}: ${(100 * atLeast / deltas.length).toFixed(1)}%  (${atLeast}/${deltas.length})`)
  }
}

function main(): void {
  console.log('\n============================================================')
  console.log('A-H2b VILLKOR 2, DÖRR (c) — TRÖSKELMÄTNING (2026-08-29)')
  console.log(`${SEASONS} säsonger/seed, ${DOMINANT_SEEDS.length} seeds/klubbtyp`)
  console.log('============================================================')

  console.log('\n--- Kör DOMINANT (club_vastanfors, +10 CA) ---')
  const domPools = runPool('club_vastanfors', DOMINANCE_BOOST, DOMINANT_SEEDS, SEASONS)
  for (const rows of domPools) {
    console.log(`  seed ${rows.length > 0 ? '' : '(tom)'} positioner: ${rows.map(r => r.finalPosition).join(' -> ')}`)
  }

  console.log('\n--- Kör MITTENLAG (club_malilla, orörd) ---')
  const midPools = runPool('club_malilla', 0, MIDTABLE_SEEDS, SEASONS)
  for (const rows of midPools) {
    console.log(`  seed positioner: ${rows.map(r => r.finalPosition).join(' -> ')}`)
  }

  const domDeltas = positionDeltas(domPools)
  const midDeltas = positionDeltas(midPools)

  printDistribution('DOMINANT — placeringsdelta år-till-år', domDeltas)
  printDistribution('MITTENLAG — placeringsdelta år-till-år', midDeltas)

  console.log('\n=== SLUT ===\n')
}

main()
