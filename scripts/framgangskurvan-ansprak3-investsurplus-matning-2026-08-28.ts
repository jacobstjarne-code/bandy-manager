/**
 * DOM_FRAMGANGSKURVAN_2026-08-27, anspråk 3 — "Styrelsen vill se pengarna arbeta".
 * Jacobs dom: "investSurplus mäter investering. builtSeasons finns och saknar
 * konsument — detta är den. Mät: byggda noder + nettotransferutgift +
 * förlängda kontrakt under säsongen, mot kassaökningen. Kontraktsförlängningar
 * loggas inte alls — lägg dem i financeLog med egen kategori. Det är
 * förutsättningen."
 *
 * Två delar levererade innan denna mätning:
 *   Del 1: renewContract (transferActions.ts) loggar nu en 'contract_extension'-
 *          post (amount=0, händelsemarkör — inte kassaflöde, lönen bärs redan
 *          av den veckovisa 'wages'-raden) till financeLog.
 *   Del 2: boardObjectiveService.ts's investSurplus-case mäter nu
 *          investmentCount = byggda noder denna säsong (FacilityState.builtSeasons)
 *          + kontraktsförlängningar denna säsong (financeLog reason=contract_extension)
 *          + (1 om nettotransferutgift denna säsong är ett utflöde, annars 0).
 *          met kräver investmentCount >= 1. failed kräver investmentCount === 0
 *          OCH kassatillväxt > 1 mkr sen säsongsstart (hamstring). Annars active.
 *
 * Mätning per Jacobs "mät efter varje steg"-instruktion, samma harness-mönster
 * som econ-sim.ts / prestationsfaktor-matning-2026-08-27.ts: en riktig headless
 * säsong via createNewGame + advanceToNextEvent, ingen isolerad enhetstest-mock.
 *
 * Klubben görs DOMINANT genom att höja den egna truppens currentAbility rejält
 * (headless harness kan inte "styra" matchutfall på annat sätt) — så att
 * "vinner matcher, växer i rykte" (uppdragets krav) är sant, inte antaget.
 *
 * Två scenarier körs på SAMMA startgame (samma seed, samma trupp):
 *   A. Hamstrar — ingen byggnation, ingen förlängning, ingen transferaktivitet.
 *   B. Investerar aktivt — bygger en nod (autoBuildCheapestAffordableFacility,
 *      samma policy som O5-acceptanstestets stress-harness), förlänger ett
 *      kontrakt via DEN RIKTIGA transferActions.renewContract, och köper en
 *      spelare via DEN RIKTIGA transferService.executeTransfer.
 *
 * EMPIRISKT FYND (körning nedan, seed 91000): en dominant klubbs säsong sträcker
 * sig långt bortom 22 ligaomgångar (cup + slutspel → matchday 37 i denna körning,
 * 31 spelade matcher) och economyProcessor.ts skriver ~5-9 financeLog-poster PER
 * omgång — alltså 180-330+ poster över en säsong, mot FINANCE_LOG_MAX=50. Poster
 * från tidigt i säsongen (kontraktsförlängningen/transfern i denna mätning,
 * matchday 6/10) TRÄNGS UT innan säsongsslut. Scenario B verifierar detta explicit
 * med ett mid-säsongs-checkpoint (direkt efter alla tre hooksen) OCH en mätning
 * vid faktiskt säsongsslut — investmentCount går från 3 (checkpoint) till 1
 * (säsongsslut, bara facility-bygget kvar — builtSeasons capas inte). Status
 * förblir 'met' i båda fallen (bara 1 investering krävs) så FUNKTIONEN är inte
 * bruten, men KVOTEN/räkningen är en underskattning vid säsongsslut för en
 * händelserik säsong. Se rapport till Jacob för rekommendation.
 *
 * Kör: node_modules/.bin/vite-node scripts/framgangskurvan-ansprak3-investsurplus-matning-2026-08-28.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { evaluateObjective } from '../src/domain/services/boardObjectiveService'
import { transferActions } from '../src/presentation/store/actions/transferActions'
import { executeTransfer } from '../src/domain/services/transferService'
import { CLUB_TEMPLATES } from '../src/domain/services/worldGenerator'
import { autoSelectLineup, autoResolvePendingScreen, autoBuildCheapestAffordableFacility } from './stress/fixtures'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { BoardObjective } from '../src/domain/entities/Community'
import type { TransferBid } from '../src/domain/entities/GameEvent'

const SEED = 91_000
const DOMINANCE_BOOST = 30  // currentAbility-tillägg på egna truppen, klampat till 99

function makeDominantGame(): SaveGame {
  const clubTemplate = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Framgangskurvan-A3', clubId: clubTemplate.id, seed: SEED })
  const boostedPlayers = game.players.map(p =>
    p.clubId === game.managedClubId
      ? { ...p, currentAbility: Math.min(99, p.currentAbility + DOMINANCE_BOOST) }
      : p
  )
  return { ...game, players: boostedPlayers, pendingScreen: null }
}

// Minimal get/set-mock, samma kontrakt transferActions förväntar sig
// (identiskt med transferActions.test.ts's makeStore).
function makeStore(initialGame: SaveGame) {
  let game: SaveGame | null = initialGame
  const get = () => ({ game })
  const set = (partial: Partial<{ game: SaveGame | null }>) => {
    if ('game' in partial) game = partial.game ?? null
  }
  return { get, set, getGame: () => game }
}

const INVEST_SURPLUS_OBJECTIVE: BoardObjective = {
  id: 'investSurplus', type: 'economic', label: 'Investera överskottet', description: '',
  ownerId: 'Test Kassör', ownerPersonality: 'ekonom',
  targetValue: 2_000_000, currentValue: 0, measureFn: 'investSurplus',
  status: 'active', assignedSeason: 2026,
  successReward: '', failureConsequence: '', carryOver: false,
}

interface SeasonRunResult {
  game: SaveGame
  /** Spelläget precis INNAN det anrop till advanceToNextEvent som returnerade
   *  seasonEnded=true — dvs sista spelade omgångens tillstånd, före
   *  seasonEndProcessor.ts:s rollover. Rollover skriver om BÅDE
   *  seasonStartFinances (till nästa säsongs startvärde — läses av
   *  investSurplus' egen cashGrowth-beräkning) OCH financeLog (offseasonFinanceLog
   *  läggs på, matchday nollställs). Mäter man på `game` (efter rollover)
   *  istället blir kassatillväxten alltid 0 (finances - sig själv) och
   *  financeLog-filtret (round <= currentMatchday=0) tappar allt. */
  endOfSeasonGame: SaveGame
  /** Speltillstånd fångat direkt EFTER att alla hooks upp till och med
   *  `checkpointAfterMatchday` körts, men LÅNGT innan säsongsslut — bevisar att
   *  investSurplus känner igen investeringen direkt när den sker, oberoende av
   *  om financeLog-capen (FINANCE_LOG_MAX=50) senare hinner tränga ut posten. */
  checkpointGame?: SaveGame
  wins: number
  losses: number
  draws: number
  totalPlayed: number
}

function runSeason(
  startGame: SaveGame,
  actAtMatchday: Record<number, (g: SaveGame) => SaveGame>,
  checkpointAfterMatchday?: number,
): SeasonRunResult {
  let game = startGame
  let preRolloverGame = startGame
  let checkpointGame: SaveGame | undefined
  let wins = 0, losses = 0, draws = 0, totalPlayed = 0
  let stepSeed = SEED * 10
  let seasonDone = false
  let guard = 0

  while (!seasonDone && guard++ < 500) {
    const hook = actAtMatchday[game.currentMatchday ?? -1]
    if (hook) game = hook(game)

    if (checkpointAfterMatchday !== undefined && !checkpointGame && (game.currentMatchday ?? 0) > checkpointAfterMatchday) {
      checkpointGame = game
    }

    game = autoSelectLineup(game)
    const screenResult = autoResolvePendingScreen(game)
    game = screenResult.game
    if (screenResult.unresolvable) break

    preRolloverGame = game
    const result = advanceToNextEvent(game, stepSeed++)
    game = result.game

    const justPlayed = game.fixtures.find(f =>
      f.status === 'completed' &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
      f.matchday === result.roundPlayed
    )
    if (justPlayed) {
      totalPlayed++
      const isHome = justPlayed.homeClubId === game.managedClubId
      const us = isHome ? justPlayed.homeScore : justPlayed.awayScore
      const them = isHome ? justPlayed.awayScore : justPlayed.homeScore
      if (us > them) wins++
      else if (us < them) losses++
      else draws++
    }

    if (result.seasonEnded || game.managerFired) seasonDone = true
  }

  return { game, endOfSeasonGame: preRolloverGame, checkpointGame, wins, losses, draws, totalPlayed }
}

function financesOf(game: SaveGame): number {
  return game.clubs.find(c => c.id === game.managedClubId)?.finances ?? 0
}

console.log(`\n=== DOM_FRAMGANGSKURVAN anspråk 3 — investSurplus-mätning (seed=${SEED}) ===\n`)

const baseGame = makeDominantGame()
const seasonStartFinances = financesOf(baseGame)
console.log(`Startkassa (båda scenarier, samma seed/trupp): ${seasonStartFinances.toLocaleString('sv-SE')} kr\n`)

// ── Scenario A: hamstrar ─────────────────────────────────────────────────────
const hoardRun = runSeason(baseGame, {})
const hoardGame = hoardRun.endOfSeasonGame
const hoardResult = evaluateObjective(INVEST_SURPLUS_OBJECTIVE, hoardGame)
const hoardCashGrowth = financesOf(hoardGame) - (hoardGame.seasonStartFinances ?? seasonStartFinances)

console.log('--- Scenario A: HAMSTRAR (ingen byggnation, förlängning, eller transferaktivitet) ---')
console.log(`Facit: ${hoardRun.wins}V ${hoardRun.draws}O ${hoardRun.losses}F av ${hoardRun.totalPlayed} matcher (dominansboost=${DOMINANCE_BOOST})`)
console.log(`Slutkassa: ${financesOf(hoardGame).toLocaleString('sv-SE')} kr, kassatillväxt: ${hoardCashGrowth.toLocaleString('sv-SE')} kr`)
console.log(`investSurplus: value=${hoardResult.value}, status=${hoardResult.status}\n`)

// ── Scenario B: investerar aktivt ────────────────────────────────────────────
// Hook vid matchday 2: bygg billigaste tillgängliga nod (autoBuildCheapestAffordableFacility,
// samma policy som stress-harnesset — kommunicerar riktig kod, inte en mock).
// Hook vid matchday 6: förläng ett kontrakt via DEN RIKTIGA transferActions.renewContract.
// Hook vid matchday 10: köp en spelare från en annan klubb via DEN RIKTIGA
// transferService.executeTransfer (buyingClubId = managedClubId → skriver
// 'transfer_in' med negativt amount, dvs ett utflöde).
const investHooks: Record<number, (g: SaveGame) => SaveGame> = {
  2: (g) => autoBuildCheapestAffordableFacility(g),
  6: (g) => {
    const store = makeStore(g)
    const actions = transferActions(store.get, store.set)
    const player = g.players.find(p => p.clubId === g.managedClubId)
    if (!player) return g
    // Bjud precis över nuvarande lön för att garanterat klara golvet.
    const result = actions.renewContract(player.id, Math.round(player.salary * 1.3), 2)
    if (!result.success) console.log(`  [scenario B] renewContract avvisades: ${(result as { error?: string }).error}`)
    return store.getGame() ?? g
  },
  10: (g) => {
    const sellingClub = g.clubs.find(c => c.id !== g.managedClubId)
    const targetPlayer = sellingClub
      ? g.players.find(p => p.clubId === sellingClub.id)
      : undefined
    if (!sellingClub || !targetPlayer) return g
    const bid: TransferBid = {
      id: 'measurement-bid-1', playerId: targetPlayer.id,
      buyingClubId: g.managedClubId, sellingClubId: sellingClub.id,
      offerAmount: 150_000, offeredSalary: targetPlayer.salary, contractYears: 2,
      direction: 'outgoing', status: 'pending', createdRound: g.currentMatchday ?? 0,
      expiresRound: (g.currentMatchday ?? 0) + 2,
    } as TransferBid
    return executeTransfer(g, bid)
  },
}

// checkpointAfterMatchday=10: fångar tillståndet direkt efter alla tre hooksen
// (2/6/10) körts, LÅNGT innan säsongsslut — se financeLog-cap-fyndet nedan.
const investRun = runSeason(baseGame, investHooks, 10)
const investGame = investRun.endOfSeasonGame
const investResult = evaluateObjective(INVEST_SURPLUS_OBJECTIVE, investGame)
const investCashGrowth = financesOf(investGame) - (investGame.seasonStartFinances ?? seasonStartFinances)
const builtCount = Object.values(investGame.facilityState?.builtSeasons ?? {})
  .filter(s => s === investGame.currentSeason).length
const extensionCount = (investGame.financeLog ?? [])
  .filter(e => e.reason === 'contract_extension' && e.round <= (investGame.currentMatchday ?? 0)).length
const netTransfer = (investGame.financeLog ?? [])
  .filter(e => (e.reason === 'transfer_in' || e.reason === 'transfer_out') && e.round <= (investGame.currentMatchday ?? 0))
  .reduce((sum, e) => sum + e.amount, 0)

console.log('--- Scenario B: INVESTERAR AKTIVT (bygger nod + förlänger kontrakt + köper spelare) ---')
console.log(`Facit: ${investRun.wins}V ${investRun.draws}O ${investRun.losses}F av ${investRun.totalPlayed} matcher (dominansboost=${DOMINANCE_BOOST})`)

if (investRun.checkpointGame) {
  const cp = investRun.checkpointGame
  const cpResult = evaluateObjective(INVEST_SURPLUS_OBJECTIVE, cp)
  const cpExtensions = (cp.financeLog ?? []).filter(e => e.reason === 'contract_extension').length
  const cpTransferEntries = (cp.financeLog ?? []).filter(e => e.reason === 'transfer_in' || e.reason === 'transfer_out').length
  console.log(`\n[MID-SÄSONGS-CHECKPOINT, direkt efter matchday 10 — alla tre hooks körda]`)
  console.log(`  financeLog-poster: ${cpExtensions} contract_extension, ${cpTransferEntries} transfer_in/out, totalt ${(cp.financeLog ?? []).length} poster i loggen (cap=50)`)
  console.log(`  investSurplus HÄR OCH NU: value=${cpResult.value}, status=${cpResult.status}`)
}

console.log(`\n[SÄSONGSSLUT — matchday ${investGame.currentMatchday}]`)
console.log(`Byggda noder denna säsong: ${builtCount}, kontraktsförlängningar KVAR i loggen: ${extensionCount}, nettotransfer KVAR i loggen: ${netTransfer.toLocaleString('sv-SE')} kr`)
console.log(`FINANCE_LOG_MAX-cap-fynd: financeLog innehåller ${(investGame.financeLog ?? []).length} poster vid säsongsslut (cap=50) — en säsong med ~35-40 matchdagar`)
console.log(`  och ~5-9 poster/omgång (wages/weekly_base/arena_maintenance/match_revenue/...) skriver FLER än 50 poster`)
console.log(`  totalt, så tidiga händelser (matchday 6/10 här) TRÄNGS UT innan säsongsslut. investSurplus 'met'-statusen`)
console.log(`  ovan beror i detta läge HELT på facility-bygget (builtSeasons, som inte capas), inte på financeLog-posterna —`)
console.log(`  se checkpointen ovan för bevis på att financeLog-spårningen fångade rätt sak när den begärdes.`)
console.log(`Slutkassa: ${financesOf(investGame).toLocaleString('sv-SE')} kr, kassatillväxt: ${investCashGrowth.toLocaleString('sv-SE')} kr`)
console.log(`investSurplus (säsongsslut): value=${investResult.value}, status=${investResult.status}`)
console.log(`\nStanding cross-step check (Jacob): "går en dominant klubb fortfarande plus varje säsong?" → nettoutfall scenario B (investerar): ${investCashGrowth >= 0 ? '+' : ''}${investCashGrowth.toLocaleString('sv-SE')} kr\n`)

// ── Syntetisk tilläggskontroll: 'failed'-grenen (hamstring med stor kassatillväxt) ──
// Den naturliga säsongskörningen (scenario A) må eller må inte råka passera
// 1 mkr-tröskeln beroende på matchutfall — det är inte kontrollerat i denna
// mätning (harnesset styr inte matchmotorn direkt). Isolerad kontroll här,
// FRIKOPPLAD från scenario A:s riktiga tal ovan: samma investmentCount=0-game,
// men med kassan syntetiskt höjd 1.5 mkr över säsongsstart, för att bevisa
// att 'failed'-grenen faktiskt triggar när hamstringsvillkoret är uppfyllt.
const syntheticHoardGame: SaveGame = {
  ...hoardGame,
  clubs: hoardGame.clubs.map(c => c.id === hoardGame.managedClubId
    ? { ...c, finances: (hoardGame.seasonStartFinances ?? seasonStartFinances) + 1_500_000 }
    : c),
}
const syntheticResult = evaluateObjective(INVEST_SURPLUS_OBJECTIVE, syntheticHoardGame)
console.log('--- Syntetisk tilläggskontroll (isolerad, INTE en del av scenario A:s tal ovan) ---')
console.log(`Samma noll-investeringsspel, kassa syntetiskt satt till säsongsstart+1.5 mkr:`)
console.log(`investSurplus: value=${syntheticResult.value}, status=${syntheticResult.status} (förväntat: failed)\n`)
