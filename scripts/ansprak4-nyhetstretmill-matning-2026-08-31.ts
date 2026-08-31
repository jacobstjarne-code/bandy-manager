/**
 * ANSPRÅK 4, SPAK 3 — NYHETSTRETMILLEN, mätning
 * (DOM_ANSPAK4_TREDJE_SPAK_NYHET_2026-08-29.md).
 *
 * Frågan domen ställer: knapp 1+2 gjorde ortsunderhållet storleksberoende, men
 * D037:s ommätning visade att det aldrig KOSTAR — en dominant klubb tjänar
 * ~291 tkr/säsong på att finansiera orten jämfört med att släppa den. Kriterium
 * 1 ("bägge sidor svider") var därför onåbart. Spak 3 lägger in en verklig
 * kostnad: aktiviteterna slits (staleness) och färskheten återställs bara av en
 * nyhetsinvestering i riktiga kronor.
 *
 * KONSTRUKTIONEN ÄR ÅTERANVÄND RAKT AV från
 * scripts/ansprak4-ortsunderhall-matning-2026-08-30.ts — samma klubbar, samma
 * seeds, samma två ortspolicyer, samma avläsning av produktionsvägen
 * (createNewGame + advanceToNextEvent, ingen omskriven kopia av formeln). Enda
 * tillägget är en TREDJE axel: förnyelsepolicyn.
 *
 *   DOMINANT = club_vastanfors, +10 CA, huvudseed 100, pool 101-105
 *   KONTROLL = club_malilla, seed 2, pool 3-5 (mittenlag)
 *   HEROS    = club_heros, seed 91000 (Survive-kontraktet, H4-golvet)
 *
 * TRE ARMAR per klubb:
 *   HALLER_FORNYAR — alla aktiviteter + alla frivilliga, OCH varje
 *                    förnyelsebeslut besvaras med "förnya" (betala). Detta är
 *                    kostnaden för att hålla orten fräsch.
 *   HALLER_SPARAR  — alla aktiviteter + alla frivilliga, men varje
 *                    förnyelsebeslut avböjs. Ortsprogrammet finns kvar men
 *                    tappar effekt säsong för säsong.
 *   GLIDER         — inga aktiviteter, inga frivilliga. Oförändrad referens.
 *
 * GODKÄNT NÄR 1 mäts som gapet HALLER_FORNYAR − GLIDER i netto/säsong för
 * DOMINANT, med HALLER_SPARAR − GLIDER som mätningens EGEN "före spak 3"-punkt.
 * GODKÄNT NÄR 2 mäts som HALLER_FORNYAR mot HALLER_SPARAR (hur mycket av
 * överskottet nyhetsinvesteringen äter).
 * GODKÄNT NÄR 3 mäts på KONTROLL och HEROS: FÖRNYAR och SPARAR ska vara
 * BIT-IDENTISKA, noll förnyelsebeslut, staleness-multiplikator ≈1,00.
 *
 * ⚠️ Jämför INTE absoluttal härifrån mot D037:s. Harnessen skiljer sig
 * medvetet (se autoResolveMeasuredEvents nedan) — därför mäts GLIDER om i
 * samma körning som egen baslinje. Resultaten står i D038.
 *
 * ── VÄG C-TILLÄGG (2026-08-31, Jacobs beslut) ──────────────────────────────
 * Konsekvensen av staleness flyttade från CS till PUBLIK. Scriptet är i övrigt
 * oförändrat (samma klubbar, seeds, armar) men läser nu också klubbens
 * `ortFreshnessFactor` per omgång och skickar den till computeAttendanceRate,
 * så den modellerade publiksiffran i tabellerna beskriver samma tal som
 * produktionsvägen (economyProcessor → calcRoundIncome) faktiskt tog betalt
 * för. Nettotalen kom alltid från produktionsvägen och behövde ingen ändring.
 *
 * Sveps: ORT_FRESHNESS_FLOOR (communityStandingScaling.ts). 1,00 = mekaniken
 * avstängd, dvs. mätningens egen "före väg C"-punkt i SAMMA arbetsträd.
 *
 * A4_MAIN_SEASONS=N ger en längre huvudkörning (erosionskurvan, kriterium 2).
 *
 * Kör: node_modules/.bin/vite-node scripts/ansprak4-nyhetstretmill-matning-2026-08-31.ts [etikett]
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { generateVolunteerRoster } from '../src/domain/services/volunteerService'
import * as csScaling from '../src/domain/services/communityStandingScaling'
import { getActivityStaleness, getOrtFreshnessFactor } from '../src/domain/services/communityRenewalService'
import { computeAttendanceRate } from '../src/domain/services/economyService'
import { getCurrentLeaguePosition } from '../src/domain/services/standingsService'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import { resolveEvent } from '../src/domain/services/events/eventResolver'
import { getEventDecisionTier } from '../src/domain/services/decisionTierService'
import { getDefaultRolloverChoice } from '../src/domain/services/deferredRolloverService'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { CommunityActivities } from '../src/domain/entities/Community'

const MAIN_SEASONS = Number(process.env.A4_MAIN_SEASONS ?? 5)
/** A4_POOL_SEASONS tillagd 2026-08-31 (väg C-kalibreringen). DEFAULT OFÖRÄNDRAD
 *  (3) — men sammanfattningsraden är ett snitt över 20 säsongsprover av vilka 15
 *  kommer från poolens 3-säsongskörningar, och en klubb som slutat förnya har
 *  efter tre säsonger knappt hunnit erodera (färskhet 1,00/0,97/0,90). Snittet
 *  UNDERSKATTAR därför mekanikens värde systematiskt. Med A4_POOL_SEASONS=N kan
 *  samma mätning läsas på en horisont där steady state faktiskt nås. */
const POOL_SEASONS = Number(process.env.A4_POOL_SEASONS ?? 3)
const DOMINANCE_BOOST = 10

const DOMINANT_CLUB = 'club_vastanfors'
const DOMINANT_SEED = 100
const DOMINANT_POOL_SEEDS = [101, 102, 103, 104, 105]

const CONTROL_CLUB = 'club_malilla'
const CONTROL_SEED = 2
const CONTROL_POOL_SEEDS = [3, 4, 5]

const HEROS_CLUB = 'club_heros'
const HEROS_SEED = 91_000

const ALLA_AKTIVITETER: CommunityActivities = {
  kiosk: 'upgraded',
  lottery: 'intensive',
  bandyplay: true,
  functionaries: true,
  julmarknad: false,
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

type Arm = 'HALLER_FORNYAR' | 'HALLER_SPARAR' | 'GLIDER'

const HOLDS_TOWN: Record<Arm, boolean> = {
  HALLER_FORNYAR: true,
  HALLER_SPARAR: true,
  GLIDER: false,
}

interface SeasonAgg {
  season: number
  csStart: number
  csEnd: number
  csMean: number
  csMin: number
  netTotal: number
  rounds: number
  reputation: number
  finalPosition: number | null
  homeAttendanceMean: number | null
  attendanceRateMean: number
  attendanceCappedShare: number
  shareBelow60: number
  shareBelow70: number
  shareAtOrAbove85: number
  patronActive: boolean
  patronWithdrawals: number
  mecenatActive: number
  mecenatEvictions: number
  upkeepFactor: number
  /** Antal förnyelsebeslut som SURFADE denna säsong (oavsett svar). */
  renewalOffers: number
  /** Antal som faktiskt betalades. */
  renewalsPaid: number
  /** Summan betald för nyhet denna säsong. */
  renewalSpend: number
  /** Snittet av de aktiva aktiviteternas staleness-multiplikator, sista omgången. */
  stalenessMean: number
  /** VÄG C: klubbens ortFreshnessFactor, snitt över säsongens spelade omgångar. */
  freshnessMean: number
}

interface RunResult {
  seasonAggs: SeasonAgg[]
  crashed: boolean
}

function fullVolunteerNames(game: SaveGame): string[] {
  const seedNum = game.managedClubId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + game.currentSeason * 17
  return Array.from(new Set(generateVolunteerRoster(seedNum, 4).map(v => v.name)))
}

interface EventPassResult {
  game: SaveGame
  renewalOffers: number
  renewalsPaid: number
  renewalSpend: number
}

/**
 * MÄTHARNESS, INTE PRODUKTIONSKOD.
 *
 * ⚠️ AVVIKELSE FRÅN ansprak4-ortsunderhall-matning-2026-08-30.ts, MEDVETEN OCH
 * NÖDVÄNDIG — läs innan du jämför tal mellan scripten.
 *
 * Det äldre scriptet besvarade BARA patron-events och lät allt annat ligga kvar
 * obesvarat i pendingEvents. Konsekvens (verifierad i en diagnoskörning
 * 2026-08-31): getThrottledActiveDecisionCount låg konstant på 3 = taket, och
 * `canAddDecision` blockerade 168 av 175 omgångar för en dominant klubb. Alla
 * budgetgrindade händelser — mecenatens middag, burnout-lättnaden, och nu
 * förnyelsebeslutet — var i praktiken ogenererbara i den harnessen. Det spelade
 * ingen roll för D037 (som mätte en oberoende csBoost-faktor), men gör
 * nyhetstretmillen omätbar: 168 av 175 omgångar tystade den innan den ens fick
 * pröva.
 *
 * Fixen är att harnessen håller kön ren, som en spelare gör. Policyn är
 * kodbasens EGEN dokumenterade "håll ställningen"-policy — getDefaultRolloverChoice
 * (deferredRolloverService.ts), samma funktion produktionen kör vid säsongsbytet:
 * noOp där det finns, 'rejectTransfer' för transferBidReceived (D033:s
 * ommätningsnotering 6 — fallbacken "första valet" ACCEPTERAR budet och dränerar
 * truppen). Månadsbeslut utan något sådant val (kris/varsel/slutspelskort)
 * PLOCKAS BORT utan att någon effekt tillämpas — harnessen låtsas inte att de
 * besvarades, den ser bara till att de inte permanent låser budgeten.
 * Måste-nivån lämnas orörd (den är throttle-undantagen ändå).
 *
 * Eftersom ALLA tre armar kör exakt samma rensning är jämförelsen inom den här
 * mätningen intern och giltig. Absoluttalen är däremot INTE direkt jämförbara med
 * D037:s — därför mäts GLIDER om här, i samma körning, som egen baslinje.
 *
 * Deferrade förnyelsebeslut lyfts in i pendingEvents innan de besvaras: det
 * modellerar en spelare som faktiskt svarar på sin kö (promoteFromQueue gör
 * samma sak i produktion när ett aktivt beslut resolveras).
 */
function autoResolveMeasuredEvents(game: SaveGame, arm: Arm, rand: () => number): EventPassResult {
  let g = game
  let renewalOffers = 0
  let renewalsPaid = 0
  let renewalSpend = 0

  const deferredRenewals = (g.deferredDecisions ?? []).filter(e => e.type === 'communityActivityRenewal')
  if (deferredRenewals.length > 0) {
    g = {
      ...g,
      pendingEvents: [...(g.pendingEvents ?? []), ...deferredRenewals],
      deferredDecisions: (g.deferredDecisions ?? []).filter(e => e.type !== 'communityActivityRenewal'),
    }
  }

  for (const e of (g.pendingEvents ?? [])) {
    if ((e.type === 'patronEvent' || e.type === 'patronWithdrawal') && e.choices.length > 0) {
      g = resolveEvent(g, e.id, e.choices[0].id, rand)
      continue
    }
    if (e.type === 'communityActivityRenewal' && e.choices.length > 0) {
      renewalOffers += 1
      if (arm === 'HALLER_FORNYAR') {
        renewalSpend += Math.abs(e.choices[0].effect.amount ?? 0)
        renewalsPaid += 1
        g = resolveEvent(g, e.id, 'renew', rand)
      } else {
        g = resolveEvent(g, e.id, 'decline', rand)
      }
    }
  }

  // Håll budgeten öppen: månadsbeslut som ligger kvar obesvarade låser annars
  // canAddDecision permanent (se blocket ovan).
  const dropIds: string[] = []
  for (const e of (g.pendingEvents ?? [])) {
    if (e.resolved || (e.choices?.length ?? 0) === 0) continue
    if (getEventDecisionTier(e) !== 'month') continue
    if (e.type === 'communityActivityRenewal' || e.type === 'patronEvent' || e.type === 'patronWithdrawal') continue
    const hold = getDefaultRolloverChoice(e)
    if (hold) g = resolveEvent(g, e.id, hold.id, rand)
    else dropIds.push(e.id)
  }
  if (dropIds.length > 0) {
    g = { ...g, pendingEvents: (g.pendingEvents ?? []).filter(e => !dropIds.includes(e.id)) }
  }

  return { game: g, renewalOffers, renewalsPaid, renewalSpend }
}

function applyPolicy(game: SaveGame, arm: Arm): SaveGame {
  if (HOLDS_TOWN[arm]) {
    return { ...game, communityActivities: { ...ALLA_AKTIVITETER }, volunteers: fullVolunteerNames(game) }
  }
  return { ...game, communityActivities: { ...INGA_AKTIVITETER }, volunteers: [] }
}

function makeGame(clubId: string, boost: number, seed: number, arm: Arm): SaveGame {
  const base = createNewGame({ managerName: `A4T-${clubId}`, clubId, seed })
  let g: SaveGame = { ...base, pendingScreen: null }
  if (boost !== 0) {
    g = {
      ...g,
      players: g.players.map(p =>
        p.clubId === g.managedClubId ? { ...p, currentAbility: Math.min(99, p.currentAbility + boost) } : p,
      ),
    }
  }
  return applyPolicy(g, arm)
}

function runClub(label: string, clubId: string, boost: number, seed: number, seasons: number, arm: Arm): RunResult {
  let game = makeGame(clubId, boost, seed, arm)
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
    const csSamples: number[] = []
    const rateSamples: number[] = []
    const freshnessSamples: number[] = []
    const modeledAttendance: number[] = []
    let patronWithdrawals = 0
    let renewalOffers = 0
    let renewalsPaid = 0
    let renewalSpend = 0

    while (!seasonDone) {
      guard++
      if (guard > 2000) throw new Error(`${label} seed=${seed} säsong ${season}: round guard tripped`)

      game = applyPolicy(game, arm)
      game = autoSelectLineup(game)
      const before = game.clubs.find(c => c.id === clubId)!.finances

      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game
      const eventSeed = stepSeed
      let er = 0
      const pass = autoResolveMeasuredEvents(game, arm, () => {
        er += 1
        return ((eventSeed * 9301 + er * 49297) % 233280) / 233280
      })
      game = pass.game
      renewalOffers += pass.renewalOffers
      renewalsPaid += pass.renewalsPaid
      renewalSpend += pass.renewalSpend

      const patronNow = !!game.patron?.isActive
      if (!patronNow && prevPatronActive) patronWithdrawals += 1
      prevPatronActive = patronNow

      if (result.roundPlayed != null) {
        // Nettot mäts EFTER eventpasset — nyhetsinvesteringen är en riktig
        // utgift ur samma kassa och ska räknas med i omgångens netto.
        const after = game.clubs.find(c => c.id === clubId)!.finances
        netTotal += after - before
        rounds += 1
        const csNow = game.communityStanding ?? 50
        csSamples.push(csNow)
        const fanMoodNow = game.fanMood ?? 50
        const posNow = getCurrentLeaguePosition(clubId, game) ?? 8
        const clubNow = game.clubs.find(c => c.id === clubId)!
        // VÄG C: samma freshness produktionsvägen just tog betalt för.
        const freshNow = getOrtFreshnessFactor(game, clubNow.reputation)
        freshnessSamples.push(freshNow)
        const rate = computeAttendanceRate(fanMoodNow, csNow, posNow, 1, freshNow)
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

    const stalenessList = getActivityStaleness(game, club.reputation)
    const stalenessMean = stalenessList.length > 0
      ? stalenessList.reduce((s, a) => s + a.multiplier, 0) / stalenessList.length
      : 1

    seasonAggs.push({
      season,
      csStart,
      csEnd: game.communityStanding ?? 50,
      csMean: csSamples.length ? csSamples.reduce((a, b) => a + b, 0) / csSamples.length : csStart,
      csMin: csSamples.length ? Math.min(...csSamples) : csStart,
      netTotal,
      rounds,
      reputation: club.reputation,
      finalPosition: thisSummary?.finalPosition ?? null,
      homeAttendanceMean,
      shareBelow60: csSamples.length ? csSamples.filter(c => c < 60).length / csSamples.length : 0,
      shareBelow70: csSamples.length ? csSamples.filter(c => c < 70).length / csSamples.length : 0,
      shareAtOrAbove85: csSamples.length ? csSamples.filter(c => c >= 85).length / csSamples.length : 0,
      attendanceRateMean: rateSamples.length ? rateSamples.reduce((a, b) => a + b, 0) / rateSamples.length : 0,
      attendanceCappedShare: rateSamples.length ? rateSamples.filter(r => r >= 0.9499).length / rateSamples.length : 0,
      patronActive: !!game.patron?.isActive,
      patronWithdrawals,
      mecenatActive: (game.mecenater ?? []).filter(m => m.isActive).length,
      mecenatEvictions: (() => {
        const evicted = (game.mecenater ?? []).filter(m => m.permanentlyWithdrawn).length
        const delta = evicted - prevMecenatEvicted
        prevMecenatEvicted = evicted
        return delta
      })(),
      upkeepFactor: csScaling.csUpkeepFactor(club.reputation),
      freshnessMean: freshnessSamples.length
        ? freshnessSamples.reduce((a, b) => a + b, 0) / freshnessSamples.length
        : 1,
      renewalOffers,
      renewalsPaid,
      renewalSpend,
      stalenessMean,
    })

    if (game.managerFired) {
      console.log(`  [${label} seed=${seed}] AVSKEDAD efter säsong ${season} — stoppar`)
      break
    }
  }

  return { seasonAggs, crashed: false }
}

function fmt(n: number, d = 0): string {
  return n.toLocaleString('sv-SE', { minimumFractionDigits: d, maximumFractionDigits: d })
}

function printTable(label: string, aggs: SeasonAgg[]): void {
  console.log(`\n--- ${label} ---`)
  console.log('Säs | rykte | faktor | slitage | FÄRSK | CS start→slut (min) | CS snitt | plac | pubkvot | publik | netto/säs | nyhet (st/kr) | patron | mecenat')
  for (const s of aggs) {
    console.log(
      `${String(s.season).padStart(3)} | ${String(s.reputation).padStart(5)} | ${s.upkeepFactor.toFixed(2).padStart(6)} | ` +
      `${s.stalenessMean.toFixed(3).padStart(7)} | ${s.freshnessMean.toFixed(3).padStart(5)} | ` +
      `${fmt(s.csStart, 1).padStart(5)}→${fmt(s.csEnd, 1).padStart(5)} (${fmt(s.csMin, 1).padStart(5)}) | ${fmt(s.csMean, 1).padStart(8)} | ` +
      `${String(s.finalPosition ?? '-').padStart(4)} | ${s.attendanceRateMean.toFixed(3).padStart(7)} | ` +
      `${(s.homeAttendanceMean !== null ? fmt(s.homeAttendanceMean) : '-').padStart(6)} | ` +
      `${fmt(s.netTotal).padStart(9)} | ${String(s.renewalsPaid).padStart(2)}/${String(s.renewalOffers).padStart(2)} ${fmt(s.renewalSpend).padStart(7)} | ` +
      `${s.patronActive ? ' ja  ' : ' nej '}(−${s.patronWithdrawals}) | ${s.mecenatActive}(−${s.mecenatEvictions})`,
    )
  }
}

interface Summary {
  csEndMean: number
  csMeanMean: number
  netSeasonMean: number
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
  renewalOffersMean: number
  renewalsPaidMean: number
  renewalSpendMean: number
  stalenessMean: number
  freshnessMean: number
  repMean: number
}

function summarize(runs: RunResult[]): Summary {
  const all = runs.flatMap(r => r.seasonAggs)
  const att = all.filter(a => a.homeAttendanceMean !== null)
  const n = Math.max(1, all.length)
  return {
    csEndMean: all.reduce((s, a) => s + a.csEnd, 0) / n,
    csMeanMean: all.reduce((s, a) => s + a.csMean, 0) / n,
    netSeasonMean: all.reduce((s, a) => s + a.netTotal, 0) / n,
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
    renewalOffersMean: all.reduce((s, a) => s + a.renewalOffers, 0) / n,
    renewalsPaidMean: all.reduce((s, a) => s + a.renewalsPaid, 0) / n,
    renewalSpendMean: all.reduce((s, a) => s + a.renewalSpend, 0) / n,
    stalenessMean: all.reduce((s, a) => s + a.stalenessMean, 0) / n,
    freshnessMean: all.reduce((s, a) => s + a.freshnessMean, 0) / n,
    repMean: all.reduce((s, a) => s + a.reputation, 0) / n,
  }
}

function printSummary(name: string, s: Summary): void {
  console.log(
    `  ${name.padEnd(26)} rykte ${fmt(s.repMean, 1).padStart(5)} | slitage ${s.stalenessMean.toFixed(3)} | färskhet ${s.freshnessMean.toFixed(3)} | ` +
    `CS-slut ${fmt(s.csEndMean, 1).padStart(5)} | CS-snitt ${fmt(s.csMeanMean, 1).padStart(5)} | ` +
    `<60 ${fmt(s.below60 * 100).padStart(3)}% <70 ${fmt(s.below70 * 100).padStart(3)}% ≥85 ${fmt(s.atOrAbove85 * 100).padStart(3)}% | ` +
    `pubkvot ${s.rateMean.toFixed(3)} (tak ${fmt(s.cappedShare * 100)}%) | publik ${fmt(s.attendanceMean).padStart(5)} | ` +
    `netto/säs ${fmt(s.netSeasonMean).padStart(9)} | nyhet ${fmt(s.renewalsPaidMean, 1)}/${fmt(s.renewalOffersMean, 1)} st, ${fmt(s.renewalSpendMean).padStart(7)} kr | ` +
    `patron ${s.patronSeasons}/${s.totalSeasons} | mecenat ${fmt(s.mecenatMean, 2)}`,
  )
}

function main(): void {
  const label = process.argv[2] ?? '(ingen etikett)'
  console.log('\n============================================================')
  console.log(`ANSPRÅK 4, SPAK 3 — NYHETSTRETMILLEN, mätning · ${label}`)
  console.log(`Publikgolv (väg C): ORT_FRESHNESS_FLOOR ${csScaling.ORT_FRESHNESS_FLOOR} · huvudkörning ${MAIN_SEASONS} säsonger`)
  console.log(`Kurva: retention-tak ${csScaling.ACTIVITY_STALENESS_RETENTION_CEIL}, golv ${csScaling.ACTIVITY_STALENESS_FLOOR}, ` +
    `tröskel ${csScaling.ACTIVITY_RENEWAL_TRIGGER_MULTIPLIER}, kostnad ${csScaling.ACTIVITY_RENEWAL_BASE_COST}×[1..${csScaling.ACTIVITY_RENEWAL_COST_REP_MULT_CEIL}]`)
  console.log(`Dominant: ${DOMINANT_CLUB}+${DOMINANCE_BOOST} CA seed ${DOMINANT_SEED} (+pool ${DOMINANT_POOL_SEEDS.join(',')})`)
  console.log(`Kontroll: ${CONTROL_CLUB} seed ${CONTROL_SEED} (+pool ${CONTROL_POOL_SEEDS.join(',')}) · Heros: ${HEROS_CLUB} seed ${HEROS_SEED}`)
  console.log('============================================================')

  const arms: Arm[] = ['HALLER_FORNYAR', 'HALLER_SPARAR', 'GLIDER']
  const byName = new Map<string, Summary>()

  for (const arm of arms) {
    console.log(`\n\n########## DOMINANT · ${arm} ##########`)
    const mainRun = runClub(`DOM-${arm}`, DOMINANT_CLUB, DOMINANCE_BOOST, DOMINANT_SEED, MAIN_SEASONS, arm)
    printTable(`DOMINANT huvudseed=${DOMINANT_SEED} · ${arm}`, mainRun.seasonAggs)
    const pool = DOMINANT_POOL_SEEDS.map(s => {
      const r = runClub(`DOM-${arm}`, DOMINANT_CLUB, DOMINANCE_BOOST, s, POOL_SEASONS, arm)
      printTable(`DOMINANT pool seed=${s} · ${arm}`, r.seasonAggs)
      return r
    })
    byName.set(`DOMINANT ${arm}`, summarize([mainRun, ...pool]))
  }

  for (const arm of arms) {
    console.log(`\n\n########## KONTROLL (mittenlag) · ${arm} ##########`)
    const mainRun = runClub(`KTRL-${arm}`, CONTROL_CLUB, 0, CONTROL_SEED, MAIN_SEASONS, arm)
    printTable(`KONTROLL huvudseed=${CONTROL_SEED} · ${arm}`, mainRun.seasonAggs)
    const pool = CONTROL_POOL_SEEDS.map(s => {
      const r = runClub(`KTRL-${arm}`, CONTROL_CLUB, 0, s, POOL_SEASONS, arm)
      printTable(`KONTROLL pool seed=${s} · ${arm}`, r.seasonAggs)
      return r
    })
    byName.set(`KONTROLL ${arm}`, summarize([mainRun, ...pool]))
  }

  for (const arm of arms) {
    console.log(`\n\n########## HEROS (Survive) · ${arm} ##########`)
    const r = runClub(`HEROS-${arm}`, HEROS_CLUB, 0, HEROS_SEED, MAIN_SEASONS, arm)
    printTable(`HEROS seed=${HEROS_SEED} · ${arm}`, r.seasonAggs)
    byName.set(`HEROS ${arm}`, summarize([r]))
  }

  console.log('\n\n========== SAMMANFATTNING (snitt över alla säsonger/seeds) ==========')
  for (const [name, s] of byName) printSummary(name, s)

  console.log('\n--- VALETS PRIS ---')
  for (const group of ['DOMINANT', 'KONTROLL', 'HEROS']) {
    const f = byName.get(`${group} HALLER_FORNYAR`)
    const sp = byName.get(`${group} HALLER_SPARAR`)
    const g = byName.get(`${group} GLIDER`)
    if (!f || !sp || !g) continue
    console.log(
      `  ${group.padEnd(9)} FÖRNYAR−GLIDER: Δnetto ${fmt(f.netSeasonMean - g.netSeasonMean).padStart(9)} kr/säs, ` +
      `ΔCS-snitt ${fmt(f.csMeanMean - g.csMeanMean, 1).padStart(5)}  |  ` +
      `SPARAR−GLIDER: Δnetto ${fmt(sp.netSeasonMean - g.netSeasonMean).padStart(9)} kr/säs, ` +
      `ΔCS-snitt ${fmt(sp.csMeanMean - g.csMeanMean, 1).padStart(5)}  |  ` +
      `FÖRNYAR−SPARAR: Δnetto ${fmt(f.netSeasonMean - sp.netSeasonMean).padStart(9)} kr/säs, ` +
      `Δfärskhet ${(f.freshnessMean - sp.freshnessMean).toFixed(3)}, Δpublik ${fmt(f.attendanceMean - sp.attendanceMean)}  |  ` +
      `nyhetskostnad ${fmt(f.renewalSpendMean).padStart(7)} kr/säs (${fmt(f.renewalsPaidMean, 1)} st)`,
    )
  }

  console.log('\n=== SLUT ===\n')
}

main()
