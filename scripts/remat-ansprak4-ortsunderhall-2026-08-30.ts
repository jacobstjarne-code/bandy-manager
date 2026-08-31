/**
 * OMMÄTNING — ANSPRÅK 4 / ORTSUNDERHÅLL (D037), under KORRIGERADE MÄTVILLKOR.
 * 2026-08-30. Kopia av `ansprak4-ortsunderhall-matning-2026-08-30.ts` (låst,
 * orörd) med tre tillägg. INGEN låst magnitud rörs — detta är verifiering,
 * inte omkalibrering.
 *
 * TILLÄGG 1 — patronen släpps in via det GEMENSAMMA harnesset.
 *   `--events` kör `autoResolvePendingEvents` ur stress/fixtures.ts (`06b86b29`).
 *   Default (och det mått domen bör läsas mot) är PATRON-ONLY, identiskt med
 *   originalscriptets lokala `autoResolvePatronEvents`.
 *   VARNING, mätt 2026-08-30: `--events` duger INTE som instrument för en
 *   ekonomimätning. `transferBidReceived` (eventFactories.ts:119) saknar
 *   `noOp`-val — dess avslag heter `rejectTransfer` — så helperns fallback
 *   "första valet" ACCEPTERAR varje inkommande bud. Följden är (a) transfer-
 *   pengar rakt in i `club.finances` och (b) trupp under 11 spelare, varpå
 *   `autoSelectLineup` bailar och säsongen aldrig tar slut (verifierad deadlock).
 *   I väg B-ommätningen vände det Heros från −2385 till +2292 kr/omgång, alltså
 *   ett falskt brott mot D033:s kriterium 4. Deadlocken reproducerar i DETTA
 *   script också: `--events` dör på `DOM-GLIDER seed=105 säsong 1`.
 *
 * TILLÄGG 2 — SÄSONGSTOTAL. Originalet (och D037:s "netto/säsong") summerar bara
 *   omgångar där `result.roundPlayed != null`. Patronens årsbidrag betalas i
 *   `seasonEndProcessor.ts:306-320`, alltså på säsongsövergången där
 *   `roundPlayed` är null — patronens pengar är osynliga i D037:s mått per
 *   konstruktion. `seasonTotal` = finances(slut) − finances(start) fångar dem.
 *
 * TILLÄGG 3 — rykteskolumnen är nu den KORRIGERADE (`3914a5e6`). Det biter
 *   direkt här: HÅLLER-policyn har `socialMedia: true`, som före fixen gav
 *   +1 rykte var femte matchday oavsett placering. Eftersom anspråk 4 läser
 *   rykte som storleksaxel (CS_UPKEEP_REP_FLOOR 80 → CEIL 100) var D037
 *   kalibrerat mot en ryktesinflation som inte längre finns. Scriptet
 *   rapporterar därför andelen säsonger i 80-100-bandet per policy.
 *
 * ── originalets filhuvud följer ────────────────────────────────────────────
 *
 * ANSPRÅK 4 — ORTSUNDERHÅLL, mätning (DOM_ANSPAK4_ORTSUNDERHALL_2026-08-29.md).
 *
 * Frågan: när klubben vuxit har orten stigit i sina förväntningar — samma
 * insats ska hålla MINDRE CS för en stor klubb än för en liten. Mekaniken är
 * `csUpkeepFactor(reputation)` på den POSITIVA aktivitets-/volontärboosten
 * (communityProcessor.ts), byggd på `csLinearRamp` (D031-tvingande: kontinuerlig,
 * aldrig en era-/rykte-tröskel).
 *
 * STEG 0 (domens krav): mät mot en REALISTISK stor klubb, inte en syntetisk
 * blankett. Konstruktionen återanvänds RAKT AV från
 * ah2-basekonomi-intakt-matning-2026-08-28.ts (som i sin tur ärvde den från
 * anspark1-budgettryck-matning-2026-08-28.ts):
 *   DOMINANT = club_vastanfors, +10 CA på egna truppen, huvudseed 100,
 *   robusthetspool 101-105. Redan verifierad icke-mättande (top-3 i 10/10
 *   provsäsonger). Ingen ny gissning om vad "stor klubb" betyder.
 *   KONTROLL = club_malilla, seed 2, pool 3-5 (mittenlag, ingen boost).
 *   HEROS    = club_heros, seed 91000 (Survive-kontraktet, H4-golvet).
 *
 * TVÅ ORTSPOLICYER körs på varje klubb/seed — det är domens "synliga
 * säsongsval" (GODKÄNT NÄR 1) operationaliserat:
 *   HALLER = managern betalar för orten: samtliga CS-positiva aktiviteter på
 *            + alla frivilliga i rostern rekryterade, varje omgång.
 *   GLIDER = managern behåller pengarna: inga aktiviteter, inga frivilliga.
 *
 * Skillnaden HALLER − GLIDER i (a) CS, (b) netto kr/säsong, (c) publik,
 * (d) patron/mecenat-status ÄR valets pris och valets vinst.
 *
 * Samma script körs OFÖRÄNDRAT före och efter knapp-ändringen i
 * communityProcessor.ts — produktionsvägen läses direkt (createNewGame +
 * advanceToNextEvent), ingen omskriven kopia av formeln.
 *
 * Kör: node_modules/.bin/vite-node scripts/ansprak4-ortsunderhall-matning-2026-08-30.ts [etikett]
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { generateVolunteerRoster } from '../src/domain/services/volunteerService'
import * as csScaling from '../src/domain/services/communityStandingScaling'
import { computeAttendanceRate } from '../src/domain/services/economyService'
import { getCurrentLeaguePosition } from '../src/domain/services/standingsService'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import * as fixtures from './stress/fixtures'
import { resolveEvent } from '../src/domain/services/events/eventResolver'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { CommunityActivities } from '../src/domain/entities/Community'

const MAIN_SEASONS = 5
const POOL_SEASONS = 3
const DOMINANCE_BOOST = 10 // STEG 0, återanvänd — ej omgissad

const DOMINANT_CLUB = 'club_vastanfors'
const DOMINANT_SEED = 100
const DOMINANT_POOL_SEEDS = [101, 102, 103, 104, 105]

const CONTROL_CLUB = 'club_malilla'
const CONTROL_SEED = 2
const CONTROL_POOL_SEEDS = [3, 4, 5]

const HEROS_CLUB = 'club_heros'
const HEROS_SEED = 91_000

/** Alla CS-positiva aktiviteter påslagna (communityProcessor.ts:76-84 + vipTent
 *  som hör till samma ekonomiblock). Detta ÄR "managerns fulla ortsinsats". */
const ALLA_AKTIVITETER: CommunityActivities = {
  kiosk: 'upgraded',
  lottery: 'intensive',
  bandyplay: true,
  functionaries: true,
  julmarknad: false, // säsongsfönstrad (omg 8-12), ingen CS-boost i communityProcessor
  bandySchool: true,
  socialMedia: true,
  vipTent: true,
  pensionarskaffe: true,
  soppkvall: true,
  skolbesok: true,
}

const INGA_AKTIVITETER: CommunityActivities = {
  kiosk: 'none',
  lottery: 'none',
  bandyplay: false,
  functionaries: false,
  julmarknad: false,
  bandySchool: false,
  socialMedia: false,
  vipTent: false,
  pensionarskaffe: false,
  soppkvall: false,
  skolbesok: false,
}

type Policy = 'HALLER' | 'GLIDER'

interface SeasonAgg {
  season: number
  csStart: number
  csEnd: number
  csMean: number
  csMin: number
  netTotal: number
  /** OMMÄTNING: finances(slut) − finances(start). Fångar säsongsövergången —
   *  där bl.a. patronens årsbidrag betalas — som netTotal missar. */
  seasonTotal: number
  rounds: number
  netPerRound: number
  reputation: number
  finalPosition: number | null
  homeAttendanceMean: number | null
  fanMoodMean: number
  attendanceRateMean: number
  attendanceCappedShare: number
  /** Andel omgångar under PATRON_EMERGE_CS (60) — patronen lämnar under denna. */
  shareBelow60: number
  /** Andel omgångar under 70 — mecenatTaket faller 2→1 här (mecenatCapForCs). */
  shareBelow70: number
  /** Andel omgångar på/över 85 — mecenatTaket 3. */
  shareAtOrAbove85: number
  patronActive: boolean
  patronArrivals: number
  patronWithdrawals: number
  /** OMMÄTNING: patronens årsbidrag (seasonEndProcessor.ts:306-320). */
  patronContribution: number
  mecenatActive: number
  mecenatEvictions: number
  upkeepFactor: number
}

interface RunResult {
  seasonAggs: SeasonAgg[]
  crashed: boolean
}

/** Volontärrostern seedas med currentSeason — namnen byter varje säsong, så
 *  "alla frivilliga rekryterade" måste räknas om per omgång, precis som
 *  communityProcessor.ts gör det. */
function fullVolunteerNames(game: SaveGame): string[] {
  const seedNum = game.managedClubId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + game.currentSeason * 17
  return Array.from(new Set(generateVolunteerRoster(seedNum, 4).map(v => v.name)))
}

/**
 * MÄTHARNESS, INTE PRODUKTIONSKOD: stress-harnesset (`autoResolvePendingScreen`)
 * rör bara `pendingScreen`, aldrig `pendingEvents` — patronens ankomstevent blir
 * därför ALDRIG besvarat headless, och patronen kunde i baslinjekörningen aldrig
 * bli aktiv (0/20 säsonger) trots CS 92. Utan detta går domens GODKÄNT NÄR 2
 * (namngivbar konsekvens: patron-/mecenat-uttåg) inte att observera alls.
 * Bara patron-events besvaras, alltid med FÖRSTA valet (det bejakande) — inga
 * sponsor-/transfer-/pressevent rörs, så inga sidoeffekter smyger in i mätningen.
 */
function autoResolvePatronEvents(game: SaveGame, rand: () => number): SaveGame {
  let g = game
  for (const e of (game.pendingEvents ?? [])) {
    if ((e.type === 'patronEvent' || e.type === 'patronWithdrawal') && e.choices.length > 0) {
      g = resolveEvent(g, e.id, e.choices[0].id, rand, false)
    }
  }
  return g
}

/** OMMÄTNING: --events kopplar in det gemensamma harnesset (06b86b29). Se
 *  filhuvudets TILLÄGG 1 för varför det INTE är default. Namnrymdsuppslag så
 *  att samma script går att köra i en worktree på ett äldre commit. */
const USE_FULL_EVENTS = process.argv.includes('--events')
const fullDrain = (fixtures as unknown as Record<string, unknown>).autoResolvePendingEvents as
  | ((g: SaveGame, rand: () => number) => SaveGame)
  | undefined

function drainEvents(game: SaveGame, rand: () => number): SaveGame {
  if (USE_FULL_EVENTS && fullDrain) return fullDrain(game, rand)
  return autoResolvePatronEvents(game, rand)
}

function applyPolicy(game: SaveGame, policy: Policy): SaveGame {
  if (policy === 'HALLER') {
    return { ...game, communityActivities: { ...ALLA_AKTIVITETER }, volunteers: fullVolunteerNames(game) }
  }
  return { ...game, communityActivities: { ...INGA_AKTIVITETER }, volunteers: [] }
}

function makeGame(clubId: string, boost: number, seed: number, policy: Policy): SaveGame {
  const base = createNewGame({ managerName: `A4-${clubId}`, clubId, seed })
  let g: SaveGame = { ...base, pendingScreen: null }
  if (boost !== 0) {
    g = {
      ...g,
      players: g.players.map(p =>
        p.clubId === g.managedClubId ? { ...p, currentAbility: Math.min(99, p.currentAbility + boost) } : p,
      ),
    }
  }
  return applyPolicy(g, policy)
}

function runClub(label: string, clubId: string, boost: number, seed: number, seasons: number, policy: Policy): RunResult {
  let game = makeGame(clubId, boost, seed, policy)
  const seasonAggs: SeasonAgg[] = []
  let stepSeed = seed * 1000
  let prevPatronActive = !!game.patron?.isActive
  let prevMecenatEvicted = 0

  for (let season = 1; season <= seasons; season++) {
    let seasonDone = false
    let guard = 0
    let netTotal = 0
    let rounds = 0
    const csStart = game.communityStanding ?? 50
    const seasonStartFinances = game.clubs.find(c => c.id === clubId)!.finances
    const csSamples: number[] = []
    const fanMoodSamples: number[] = []
    const rateSamples: number[] = []
    const modeledAttendance: number[] = []
    let upkeepFactorSeen = 1
    let patronArrivals = 0
    let patronWithdrawals = 0

    while (!seasonDone) {
      guard++
      if (guard > 2000) throw new Error(`${label} seed=${seed} säsong ${season}: round guard tripped`)

      game = applyPolicy(game, policy)
      game = autoSelectLineup(game)
      const before = game.clubs.find(c => c.id === clubId)!.finances

      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game
      const eventSeed = stepSeed
      let er = 0
      game = drainEvents(game, () => {
        er += 1
        return ((eventSeed * 9301 + er * 49297) % 233280) / 233280
      })
      const patronNow = !!game.patron?.isActive
      if (patronNow && !prevPatronActive) patronArrivals += 1
      if (!patronNow && prevPatronActive) patronWithdrawals += 1
      prevPatronActive = patronNow

      if (result.roundPlayed != null) {
        const after = game.clubs.find(c => c.id === clubId)!.finances
        netTotal += after - before
        rounds += 1
        const csNow = game.communityStanding ?? 50
        csSamples.push(csNow)
        // Publikmodellen läses ur PRODUKTIONSFUNKTIONEN (computeAttendanceRate,
        // economyService.ts) med spelets egna värden — fixture.attendance sätts
        // bara på UI-vägen (matchActions.ts) och är alltid undefined headless.
        const fanMoodNow = game.fanMood ?? 50
        const posNow = getCurrentLeaguePosition(clubId, game) ?? 8
        const clubNow = game.clubs.find(c => c.id === clubId)!
        const rate = computeAttendanceRate(fanMoodNow, csNow, posNow)
        fanMoodSamples.push(fanMoodNow)
        rateSamples.push(rate)
        modeledAttendance.push(rate * (clubNow.arenaCapacity ?? Math.round(clubNow.reputation * 7 + 150)))
      }

      if (result.seasonEnded || game.managerFired) {
        seasonDone = true
      } else {
        const resolved = autoResolvePendingScreen(game)
        if (resolved.unresolvable) {
          console.log(`  [${label} seed=${seed}] säsong ${season}: unresolvable pendingScreen (${resolved.screenType}) — avbryter`)
          return { seasonAggs, crashed: true }
        }
        game = resolved.game
      }
    }

    const club = game.clubs.find(c => c.id === clubId)!
    const summaries = game.seasonSummaries ?? []
    const thisSummary = summaries[summaries.length - 1]
    const homeAttendanceMean = modeledAttendance.length > 0
      ? modeledAttendance.reduce((a, b) => a + b, 0) / modeledAttendance.length
      : null

    // Rapportera faktorn som produktionen faktiskt använde för denna klubb —
    // läses via dynamisk import nedan så att scriptet fungerar identiskt
    // FÖRE knappen byggts (då exporten inte finns) och EFTER.
    upkeepFactorSeen = readUpkeepFactor(club.reputation)

    seasonAggs.push({
      season,
      csStart,
      csEnd: game.communityStanding ?? 50,
      csMean: csSamples.length ? csSamples.reduce((a, b) => a + b, 0) / csSamples.length : csStart,
      csMin: csSamples.length ? Math.min(...csSamples) : csStart,
      netTotal,
      seasonTotal: club.finances - seasonStartFinances,
      rounds,
      netPerRound: rounds > 0 ? netTotal / rounds : 0,
      reputation: club.reputation,
      finalPosition: thisSummary?.finalPosition ?? null,
      homeAttendanceMean,
      shareBelow60: csSamples.length ? csSamples.filter(c => c < 60).length / csSamples.length : 0,
      shareBelow70: csSamples.length ? csSamples.filter(c => c < 70).length / csSamples.length : 0,
      shareAtOrAbove85: csSamples.length ? csSamples.filter(c => c >= 85).length / csSamples.length : 0,
      fanMoodMean: fanMoodSamples.length ? fanMoodSamples.reduce((a, b) => a + b, 0) / fanMoodSamples.length : 50,
      attendanceRateMean: rateSamples.length ? rateSamples.reduce((a, b) => a + b, 0) / rateSamples.length : 0,
      attendanceCappedShare: rateSamples.length ? rateSamples.filter(r => r >= 0.9499).length / rateSamples.length : 0,
      patronActive: !!game.patron?.isActive,
      patronArrivals,
      patronWithdrawals,
      patronContribution: game.patron?.isActive ? (game.patron.contribution ?? 0) : 0,
      mecenatActive: (game.mecenater ?? []).filter(m => m.isActive).length,
      mecenatEvictions: (() => {
        const evicted = (game.mecenater ?? []).filter(m => m.permanentlyWithdrawn).length
        const delta = evicted - prevMecenatEvicted
        prevMecenatEvicted = evicted
        return delta
      })(),
      upkeepFactor: upkeepFactorSeen,
    })

    if (game.managerFired) {
      console.log(`  [${label} seed=${seed}] AVSKEDAD efter säsong ${season} — stoppar`)
      break
    }
  }

  return { seasonAggs, crashed: false }
}

// Läs csUpkeepFactor om den finns (efter bygget), annars 1 (baslinjen). Namnrymds-
// import så att SAMMA script kompilerar och kör både före och efter att knappen byggts.
function readUpkeepFactor(rep: number): number {
  const fn = (csScaling as unknown as Record<string, unknown>).csUpkeepFactor
  return typeof fn === 'function' ? (fn as (r: number) => number)(rep) : 1
}

function fmt(n: number, d = 0): string {
  return n.toLocaleString('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d })
}

function printTable(label: string, aggs: SeasonAgg[]): void {
  console.log(`\n--- ${label} ---`)
  console.log('Säs | rykte | faktor | CS start→slut (min) | CS snitt | plac | pubkvot (tak%) | publik | netto/säs | netto/omg | patron | mecenat')
  for (const s of aggs) {
    console.log(
      `${String(s.season).padStart(3)} | ${String(s.reputation).padStart(5)} | ${s.upkeepFactor.toFixed(2).padStart(6)} | ` +
      `${fmt(s.csStart, 1).padStart(5)}→${fmt(s.csEnd, 1).padStart(5)} (${fmt(s.csMin, 1).padStart(5)}) | ${fmt(s.csMean, 1).padStart(8)} | ` +
      `${String(s.finalPosition ?? '-').padStart(4)} | ${s.attendanceRateMean.toFixed(3).padStart(7)} (${fmt(s.attendanceCappedShare * 100).padStart(3)}%) | ` +
      `${(s.homeAttendanceMean !== null ? fmt(s.homeAttendanceMean) : '-').padStart(6)} | ` +
      `${fmt(s.netTotal).padStart(9)} | ${fmt(s.netPerRound).padStart(9)} | ${s.patronActive ? ' ja  ' : ' nej '}(+${s.patronArrivals}/−${s.patronWithdrawals}) | ${s.mecenatActive}(−${s.mecenatEvictions})`,
    )
  }
}

interface Summary {
  csEndMean: number
  csMeanMean: number
  netSeasonMean: number
  seasonTotalMean: number
  repMean: number
  repShare80plus: number
  upkeepFactorMean: number
  patronContributionMean: number
  attendanceMean: number
  rateMean: number
  cappedShare: number
  patronSeasons: number
  totalSeasons: number
  mecenatMean: number
  patronWithdrawals: number
  mecenatEvictions: number
  below60: number
  below70: number
  atOrAbove85: number
}

function summarize(runs: RunResult[]): Summary {
  const all = runs.flatMap(r => r.seasonAggs)
  const att = all.filter(a => a.homeAttendanceMean !== null)
  const n = Math.max(1, all.length)
  return {
    csEndMean: all.reduce((s, a) => s + a.csEnd, 0) / n,
    csMeanMean: all.reduce((s, a) => s + a.csMean, 0) / n,
    netSeasonMean: all.reduce((s, a) => s + a.netTotal, 0) / n,
    seasonTotalMean: all.reduce((s, a) => s + a.seasonTotal, 0) / n,
    repMean: all.reduce((s, a) => s + a.reputation, 0) / n,
    repShare80plus: all.filter(a => a.reputation >= 80).length / n,
    upkeepFactorMean: all.reduce((s, a) => s + a.upkeepFactor, 0) / n,
    patronContributionMean: all.reduce((s, a) => s + a.patronContribution, 0) / n,
    attendanceMean: att.length ? att.reduce((s, a) => s + (a.homeAttendanceMean ?? 0), 0) / att.length : 0,
    rateMean: all.reduce((s, a) => s + a.attendanceRateMean, 0) / n,
    cappedShare: all.reduce((s, a) => s + a.attendanceCappedShare, 0) / n,
    patronSeasons: all.filter(a => a.patronActive).length,
    totalSeasons: all.length,
    mecenatMean: all.reduce((s, a) => s + a.mecenatActive, 0) / n,
    patronWithdrawals: all.reduce((s, a) => s + a.patronWithdrawals, 0),
    mecenatEvictions: all.reduce((s, a) => s + a.mecenatEvictions, 0),
    below60: all.reduce((s, a) => s + a.shareBelow60, 0) / n,
    below70: all.reduce((s, a) => s + a.shareBelow70, 0) / n,
    atOrAbove85: all.reduce((s, a) => s + a.shareAtOrAbove85, 0) / n,
  }
}

function printSummary(name: string, s: Summary): void {
  console.log(
    `  ${name.padEnd(22)} CS-slut ${fmt(s.csEndMean, 1).padStart(5)} | CS-snitt ${fmt(s.csMeanMean, 1).padStart(5)} | ` +
    `<60 ${fmt(s.below60 * 100).padStart(3)}% <70 ${fmt(s.below70 * 100).padStart(3)}% ≥85 ${fmt(s.atOrAbove85 * 100).padStart(3)}% | ` +
    `pubkvot ${s.rateMean.toFixed(3)} (tak ${fmt(s.cappedShare * 100)}%) | publik ${fmt(s.attendanceMean).padStart(5)} | ` +
    `netto/säs ${fmt(s.netSeasonMean).padStart(9)} | patron ${s.patronSeasons}/${s.totalSeasons} (uttåg ${s.patronWithdrawals}) | mecenat ${fmt(s.mecenatMean, 2)} (uttåg ${s.mecenatEvictions})`,
  )
  console.log(
    `  ${''.padEnd(22)} └ OMMÄTNING: säsongstotal (inkl. säsongsövergång) ${fmt(s.seasonTotalMean).padStart(9)} | ` +
    `rykte ${fmt(s.repMean, 1)} (≥80 i ${fmt(s.repShare80plus * 100)}% av säsongerna) | ` +
    `csUpkeepFactor snitt ${s.upkeepFactorMean.toFixed(3)} | patronbidrag ${fmt(s.patronContributionMean)} kr/säsong`,
  )
}

function main(): void {
  const label = process.argv[2] ?? '(ingen etikett)'
  console.log('\n============================================================')
  console.log(`ANSPRÅK 4 — ORTSUNDERHÅLL, mätning · ${label}`)
  console.log(`Dominant: ${DOMINANT_CLUB}+${DOMINANCE_BOOST} CA seed ${DOMINANT_SEED} (+pool ${DOMINANT_POOL_SEEDS.join(',')})`)
  console.log(`Kontroll: ${CONTROL_CLUB} seed ${CONTROL_SEED} (+pool ${CONTROL_POOL_SEEDS.join(',')}) · Heros: ${HEROS_CLUB} seed ${HEROS_SEED}`)
  console.log('============================================================')

  const blocks: Array<{ name: string; runs: RunResult[] }> = []

  for (const policy of ['HALLER', 'GLIDER'] as Policy[]) {
    console.log(`\n\n########## DOMINANT · ${policy} ##########`)
    const main = runClub(`DOM-${policy}`, DOMINANT_CLUB, DOMINANCE_BOOST, DOMINANT_SEED, MAIN_SEASONS, policy)
    printTable(`DOMINANT huvudseed=${DOMINANT_SEED} · ${policy}`, main.seasonAggs)
    const pool = DOMINANT_POOL_SEEDS.map(s => {
      const r = runClub(`DOM-${policy}`, DOMINANT_CLUB, DOMINANCE_BOOST, s, POOL_SEASONS, policy)
      printTable(`DOMINANT pool seed=${s} · ${policy}`, r.seasonAggs)
      return r
    })
    blocks.push({ name: `DOMINANT ${policy}`, runs: [main, ...pool] })
  }

  for (const policy of ['HALLER', 'GLIDER'] as Policy[]) {
    console.log(`\n\n########## KONTROLL (liten klubb) · ${policy} ##########`)
    const main = runClub(`KTRL-${policy}`, CONTROL_CLUB, 0, CONTROL_SEED, MAIN_SEASONS, policy)
    printTable(`KONTROLL huvudseed=${CONTROL_SEED} · ${policy}`, main.seasonAggs)
    const pool = CONTROL_POOL_SEEDS.map(s => {
      const r = runClub(`KTRL-${policy}`, CONTROL_CLUB, 0, s, POOL_SEASONS, policy)
      printTable(`KONTROLL pool seed=${s} · ${policy}`, r.seasonAggs)
      return r
    })
    blocks.push({ name: `KONTROLL ${policy}`, runs: [main, ...pool] })
  }

  for (const policy of ['HALLER', 'GLIDER'] as Policy[]) {
    console.log(`\n\n########## HEROS (Survive) · ${policy} ##########`)
    const r = runClub(`HEROS-${policy}`, HEROS_CLUB, 0, HEROS_SEED, MAIN_SEASONS, policy)
    printTable(`HEROS seed=${HEROS_SEED} · ${policy}`, r.seasonAggs)
    blocks.push({ name: `HEROS ${policy}`, runs: [r] })
  }

  console.log('\n\n========== SAMMANFATTNING (snitt över alla säsonger/seeds) ==========')
  const byName = new Map<string, Summary>()
  for (const b of blocks) {
    const s = summarize(b.runs)
    byName.set(b.name, s)
    printSummary(b.name, s)
  }

  console.log('\n--- VALETS PRIS (HÅLLER − GLIDER) ---')
  for (const group of ['DOMINANT', 'KONTROLL', 'HEROS']) {
    const h = byName.get(`${group} HALLER`)
    const g = byName.get(`${group} GLIDER`)
    if (!h || !g) continue
    console.log(
      `  ${group.padEnd(9)} ΔCS-slut ${fmt(h.csEndMean - g.csEndMean, 1).padStart(6)} | ` +
      `ΔCS-snitt ${fmt(h.csMeanMean - g.csMeanMean, 1).padStart(6)} | ` +
      `Δpubkvot ${(h.rateMean - g.rateMean).toFixed(3).padStart(6)} | Δpublik ${fmt(h.attendanceMean - g.attendanceMean).padStart(5)} | ` +
      `Δnetto/säs ${fmt(h.netSeasonMean - g.netSeasonMean).padStart(9)} | ` +
      `patronsäsonger ${h.patronSeasons}/${h.totalSeasons} vs ${g.patronSeasons}/${g.totalSeasons} | ` +
      `uttåg patron ${h.patronWithdrawals} vs ${g.patronWithdrawals}, mecenat ${h.mecenatEvictions} vs ${g.mecenatEvictions}`,
    )
    console.log(
      `  ${''.padEnd(9)} └ KRITERIUM 1 (bägge sidor svider?): Δnetto/säs (D037:s mått) ` +
      `${fmt(h.netSeasonMean - g.netSeasonMean).padStart(9)} · Δsäsongstotal (inkl. patronbidrag) ` +
      `${fmt(h.seasonTotalMean - g.seasonTotalMean).padStart(9)} — ` +
      `${h.seasonTotalMean - g.seasonTotalMean > 0 ? 'HÅLLA är fortfarande LÖNSAMT (kriterium 1 ej uppfyllt)' : 'HÅLLA kostar (kriterium 1 uppfyllt)'}`,
    )
    console.log(
      `  ${''.padEnd(9)} └ patronbidrag ${fmt(h.patronContributionMean)} vs ${fmt(g.patronContributionMean)} kr/säsong · ` +
      `rykte ${fmt(h.repMean, 1)} vs ${fmt(g.repMean, 1)} (≥80: ${fmt(h.repShare80plus * 100)}% vs ${fmt(g.repShare80plus * 100)}%) · ` +
      `csUpkeepFactor ${h.upkeepFactorMean.toFixed(3)} vs ${g.upkeepFactorMean.toFixed(3)}`,
    )
  }

  console.log('\n=== SLUT ===\n')
}

main()
