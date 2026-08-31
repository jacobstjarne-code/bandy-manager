/**
 * HIGH 10 — BURNOUT SOM BÅGE. Mätning mot domens "GODKÄNT NÄR" 1–4.
 * DOM_HIGH10_BURNOUT_BAGE_2026-08-29.md.
 *
 * Domens krav:
 *   1. En manager som SVARAR (vinner, vilar, använder relief-handlingar) ser
 *      burnout sjunka och bågen sluta INOM en säsong — ingen stuck-high över
 *      tre säsonger.
 *   2. En manager som inte svarar eskalerar (bågen ska ha tänder).
 *   3. Zonen re-triggar aldrig på oförändrat tillstånd.
 *   4. Orsak, lättnad och slut är synliga och specifika.
 *
 * METOD — riktig produktkodväg, inte omskriven formel.
 * Spelet körs headless via advanceToNextEvent(); burnout uppdateras av
 * roundProcessorns egna anrop till updateManagerBurnout(). Det enda skriptet
 * styr är REGIMEN runt managern:
 *   - matchutfall: den styrda klubbens redan spelade matcher skrivs om till
 *     ett påtvingat resultat efter varje omgång, så nästa omgångs burnout-
 *     uppdatering läser en kontrollerad förlust-/segersvit (domens krav 1 och
 *     2 handlar om just förlust- respektive segerbanor).
 *   - relief-handlingar: 'train' (−15) väljs för svarande manager, ignoreras
 *     helt för den icke-svarande.
 * Inkorgen städas ALDRIG. Det är avsiktligt: en oläst inkorgspost var precis
 * det som gjorde den gamla decay-gaten (`if (delta === 0)`) strukturellt död,
 * så en mätning som läser inkorgen tom hade mätt bort själva buggen.
 *
 * REGIMER
 *   svarar          starkaste klubben, alla matcher skrivs om till seger,
 *                   burnout injiceras till 85 vid omgång 6, relief tas.
 *   svarar_utan_relief  samma, men relief-erbjudanden ignoreras (strängare
 *                   läsning av krav 1 — bara segrar + decay ska bära).
 *   passiv          svagaste klubben, alla matcher skrivs om till förlust,
 *                   relief-erbjudanden ignoreras.
 *   naturlig        Målilla, inga påtvingade resultat alls (referensbana).
 *
 * Kör: node_modules/.bin/vite-node scripts/high10-burnout-arc-matning-2026-08-30.ts
 *      [--seasons=3] [--seeds=2,3,4] [--json=fil.json]
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { resolveEvent } from '../src/domain/services/events/eventResolver'
import { autoSelectLineup, autoResolvePendingScreen, autoResolvePendingEvents } from './stress/fixtures'
import {
  getBurnoutZone,
  computeBurnoutPress,
  BURNOUT_WIN_RECOVERY,
  BURNOUT_NATURAL_DECAY,
  type BurnoutZone,
  type BurnoutCause,
} from '../src/domain/services/managerProfileService'
import { FixtureStatus } from '../src/domain/enums'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import { writeFileSync } from 'node:fs'

type Regime = 'svarar' | 'svarar_utan_relief' | 'passiv' | 'naturlig'
const REGIMES: Regime[] = ['svarar', 'svarar_utan_relief', 'passiv', 'naturlig']

/**
 * Klubbval per regim. En regim som ska VINNA får den starkaste klubben
 * (Forsbacka, renommé 85) och en som ska FÖRLORA den svagaste (Heros, 45) —
 * så att de matcher skriptet inte hinner styra ändå pekar åt regimens håll.
 * Referensbanan kör kontrollklubben A3/A-H2/ANSPARK1 använder (Målilla, 65).
 */
const REGIME_CLUB: Record<Regime, string> = {
  svarar: 'club_forsbacka',
  svarar_utan_relief: 'club_forsbacka',
  passiv: 'club_heros',
  naturlig: 'club_malilla',
}

/**
 * INITIALVILLKOR för återhämtningsbanorna. Domens krav 1 handlar om en
 * manager som redan ÄR högt uppe och sedan svarar. Att köra upp honom dit
 * med påtvingade förluster hade blandat ihop två frågor (hur snabbt stiger
 * den, hur snabbt sjunker den) i en enda bana. Här sätts utgångsläget
 * explicit — 85 = mitt i 'hög'-zonen — vid den omgång som anges, och resten
 * är ren produktionskod.
 */
const SVARAR_INJECT_SCORE = 85
const SVARAR_INJECT_MATCHDAY = 6

/**
 * MÄTMETODIKENS KÄNDA LAGG: advanceToNextEvent spelar matchen OCH uppdaterar
 * burnout i samma anrop, så skriptet kan bara skriva om resultat i efterhand.
 * Den nyss spelade matchen räknas alltså med sitt VERKLIGA utfall i den
 * omgångens burnout-uppdatering; de två föregående är omskrivna. Därför
 * klubbvalet ovan — regimens riktning bärs av både styrningen och truppen.
 */

const args = process.argv.slice(2)
function argVal(name: string, fallback: string): string {
  const hit = args.find(a => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}
const SEASONS = parseInt(argVal('seasons', '3'), 10)
const SEEDS = argVal('seeds', '2,3,4').split(',').map(s => parseInt(s, 10))
const JSON_OUT = argVal('json', '')
const QUIET = args.includes('--quiet')

// ── Regimens matchutfall ─────────────────────────────────────────────────────

/** true = påtvingad seger, false = påtvingad förlust, null = låt stå. */
function forcedOutcome(regime: Regime): boolean | null {
  if (regime === 'naturlig') return null
  return regime !== 'passiv'
}

/**
 * Skriver om den styrda klubbens FÄRDIGSPELADE matcher till regimens utfall.
 * Idempotent (samma matchdag ger alltid samma siffror). Tabellen räknas i
 * matchögonblicket och rörs inte — det som mäts här är burnout, som läser
 * fixtures direkt.
 */
function forceResults(game: SaveGame, regime: Regime): SaveGame {
  if (regime === 'naturlig') return game
  const managed = game.managedClubId
  return {
    ...game,
    fixtures: game.fixtures.map(f => {
      if (f.homeClubId !== managed && f.awayClubId !== managed) return f
      // Bara FÄRDIGSPELADE matcher skrivs om. Schemalagda fixtures bär redan
      // 0–0 i score-fälten (scheduleGenerator) — att skriva om dem hade
      // förfalskat framtiden, och det var precis den fällan det tredje
      // fyndet i den här mätningen handlade om.
      if (f.status !== FixtureStatus.Completed) return f
      if (f.homeScore === undefined || f.awayScore === undefined) return f
      const want = forcedOutcome(regime)
      if (want === null) return f
      const isHome = f.homeClubId === managed
      const managedScore = want ? 4 : 1
      const otherScore = want ? 1 : 4
      return {
        ...f,
        homeScore: isHome ? managedScore : otherScore,
        awayScore: isHome ? otherScore : managedScore,
      }
    }),
  }
}

// ── Relief-handlingar ────────────────────────────────────────────────────────

const TAKES_RELIEF: Record<Regime, boolean> = {
  svarar: true,
  svarar_utan_relief: false,
  passiv: false,
  naturlig: true,
}

/**
 * Resolverar burnoutRelief-erbjudanden med 'train' (−15 burnout,
 * utvecklingsbroms). Övriga väntande händelser lämnas till harnessets
 * standardpolicy. Regimer som INTE svarar lämnar burnout-erbjudandet
 * oresolverat — vilket i sig är en del av pressen (obesvarade beslut driver
 * fatigue-mätaren), precis som för en spelare som blundar.
 */
function resolveReliefEvents(game: SaveGame, take: boolean, rand: () => number): { game: SaveGame; taken: number } {
  let g = game
  let taken = 0
  for (const e of (game.pendingEvents ?? [])) {
    if (e.type !== 'burnoutRelief') continue
    if (!take) continue
    const choice = e.choices.find(c => c.id === 'train') ?? e.choices[0]
    if (!choice) continue
    g = resolveEvent(g, e.id, choice.id, rand, false)
    taken++
  }
  return { game: g, taken }
}

function resolveNonReliefEvents(game: SaveGame, rand: () => number): SaveGame {
  const nonRelief = (game.pendingEvents ?? []).filter(e => e.type !== 'burnoutRelief')
  if (nonRelief.length === 0) return game
  return autoResolvePendingEvents({ ...game, pendingEvents: nonRelief }, rand)
}

// ── Mätdata ──────────────────────────────────────────────────────────────────

interface RoundSample {
  season: number
  matchday: number
  score: number
  zone: BurnoutZone
  shownZone: BurnoutZone | undefined
  cause: BurnoutCause | undefined
  /** Vilken beat som fyrade denna omgång, härledd ur shownZone-övergången. */
  beat: 'mark' | 'relief' | 'close' | null
  unreadInbox: number
  fatigue: number
  /** Pressen inför NÄSTA omgångs uppdatering (approximation, se skuggbanan). */
  pressDelta: number
  lastWon: boolean
  reliefTaken: number
  /** Skuggbana: samma press genom den GAMLA gaten `if (delta === 0)`. */
  shadowScore: number
}

interface RunResult {
  regime: Regime
  seed: number
  samples: RoundSample[]
  crashed: string | null
}

function classifyBeat(prevShown: BurnoutZone | undefined, newShown: BurnoutZone | undefined): RoundSample['beat'] {
  if (newShown === undefined || newShown === prevShown) return null
  if (newShown === 'frisk') return 'close'
  const sev: Record<BurnoutZone, number> = { frisk: 0, markbar: 1, hog: 2 }
  if (prevShown !== undefined && sev[newShown] < sev[prevShown]) return 'relief'
  return 'mark'
}

function runOne(seed: number, regime: Regime): RunResult {
  const base = createNewGame({ managerName: `HIGH10-${regime}`, clubId: REGIME_CLUB[regime], seed })
  let game: SaveGame = { ...base, pendingScreen: null }
  const injects = regime === 'svarar' || regime === 'svarar_utan_relief'
  let injected = false

  const samples: RoundSample[] = []
  let stepSeed = seed * 1000 + regime.length
  const rand = () => {
    stepSeed = (stepSeed * 1103515245 + 12345) & 0x7fffffff
    return stepSeed / 0x7fffffff
  }

  // Skuggbanan startar där den riktiga gör och matas med SAMMA press-värden
  // — enda skillnaden är decay-gaten. Det isolerar strukturfixen från allt
  // annat som händer i simuleringen.
  let shadowScore = game.managerProfile?.burnoutScore ?? 0

  for (let season = 1; season <= SEASONS; season++) {
    let seasonDone = false
    let guard = 0

    while (!seasonDone) {
      if (++guard > 400) return { regime, seed, samples, crashed: `guard s${season}` }

      const prevShown = game.managerProfile?.lastShownBurnoutZone

      // Relief först (spelaren svarar på gårdagens erbjudande), sedan övriga.
      const relief = resolveReliefEvents(game, TAKES_RELIEF[regime], rand)
      game = relief.game
      game = resolveNonReliefEvents(game, rand)

      game = autoSelectLineup(game)
      const result = advanceToNextEvent(game, Math.floor(rand() * 1_000_000))
      game = forceResults(result.game, regime)

      // Initialvillkoret för återhämtningsbanorna, satt EN gång.
      if (injects && !injected && game.currentMatchday >= SVARAR_INJECT_MATCHDAY && game.managerProfile) {
        injected = true
        game = {
          ...game,
          managerProfile: {
            ...game.managerProfile,
            burnoutScore: SVARAR_INJECT_SCORE,
            burnoutHistory: [...game.managerProfile.burnoutHistory.slice(0, -1), SVARAR_INJECT_SCORE],
          },
        }
      }

      const profile = game.managerProfile
      if (profile) {
        const press = computeBurnoutPress(game)
        // Gamla modellen: ett enda delta, decay bara vid exakt 0.
        let oldDelta = press.pressDelta - (press.lastWon ? BURNOUT_WIN_RECOVERY : 0)
        if (oldDelta === 0) oldDelta -= BURNOUT_NATURAL_DECAY
        shadowScore = Math.max(0, Math.min(100, shadowScore + oldDelta))

        const newShown = profile.lastShownBurnoutZone
        samples.push({
          season,
          matchday: game.currentMatchday,
          score: Math.round(profile.burnoutScore * 10) / 10,
          zone: getBurnoutZone(profile.burnoutScore),
          shownZone: newShown,
          cause: profile.lastBurnoutCause,
          beat: classifyBeat(prevShown, newShown),
          unreadInbox: game.inbox.filter(i => !i.isRead).length,
          fatigue: (game.fatigueHistory ?? []).slice(-1)[0] ?? 0,
          pressDelta: Math.round(press.pressDelta * 10) / 10,
          lastWon: press.lastWon,
          reliefTaken: relief.taken,
          shadowScore: Math.round(shadowScore * 10) / 10,
        })
      }

      if (result.seasonEnded || game.managerFired) {
        seasonDone = true
      } else {
        const resolved = autoResolvePendingScreen(game)
        if (resolved.unresolvable) {
          return { regime, seed, samples, crashed: `pendingScreen ${resolved.screenType}` }
        }
        game = resolved.game
      }
    }

    // Avsked är inte det som mäts här — banan fortsätter så burnout går att
    // följa hela vägen till sista säsongen (samma metodval som A3-mätningen).
    if (game.managerFired) game = { ...game, managerFired: false }
  }

  return { regime, seed, samples, crashed: null }
}

// ── Rapport ──────────────────────────────────────────────────────────────────

function fmt(v: number, d = 1): string {
  return Number.isFinite(v) ? v.toFixed(d) : '—'
}

function seasonRows(samples: RoundSample[], season: number): RoundSample[] {
  return samples.filter(s => s.season === season)
}

const allRuns: RunResult[] = []
for (const regime of REGIMES) {
  for (const seed of SEEDS) {
    allRuns.push(runOne(seed, regime))
  }
}

console.log('═══ HIGH 10 — BURNOUT SOM BÅGE, mätning 2026-08-30 ═══')
console.log(`Säsonger: ${SEASONS} · Frön: ${SEEDS.join(',')}`)
console.log(`Klubbar: ${REGIMES.map(r => `${r}=${REGIME_CLUB[r]}`).join(' · ')}`)
console.log(`Injektion (svarar*): burnout ${SVARAR_INJECT_SCORE} vid omgång ${SVARAR_INJECT_MATCHDAY}`)
console.log(`BURNOUT_NATURAL_DECAY = ${BURNOUT_NATURAL_DECAY} · BURNOUT_WIN_RECOVERY = ${BURNOUT_WIN_RECOVERY}`)
console.log('')

for (const regime of REGIMES) {
  if (QUIET) break
  const runs = allRuns.filter(r => r.regime === regime)
  console.log(`── REGIM: ${regime} ──────────────────────────────────────────`)
  for (const run of runs) {
    if (run.crashed) {
      console.log(`  frö ${run.seed}: AVBRÖT — ${run.crashed}`)
      continue
    }
    const beats = run.samples.filter(s => s.beat !== null)
    const peak = Math.max(...run.samples.map(s => s.score))
    const last = run.samples[run.samples.length - 1]
    const shadowPeak = Math.max(...run.samples.map(s => s.shadowScore))
    const shadowLast = last.shadowScore
    const blockedRounds = run.samples.filter(s => {
      const d = s.pressDelta - (s.lastWon ? BURNOUT_WIN_RECOVERY : 0)
      return d !== 0
    }).length
    console.log(`  frö ${run.seed}: ${run.samples.length} omg · topp ${fmt(peak)} · slut ${fmt(last.score)} (${last.zone})`)
    console.log(`    skuggbana (gamla gaten): topp ${fmt(shadowPeak)} · slut ${fmt(shadowLast)}`)
    console.log(`    omgångar där gamla decayen var blockerad (delta ≠ 0): ${blockedRounds}/${run.samples.length}`)
    console.log(`    beats: ${beats.length} (${beats.map(b => `${b.beat}@s${b.season}m${b.matchday}`).join(', ') || 'inga'})`)
    // Säsong-för-säsong: högsta och sista poäng
    for (let s = 1; s <= SEASONS; s++) {
      const rows = seasonRows(run.samples, s)
      if (rows.length === 0) continue
      const hi = Math.max(...rows.map(r => r.score))
      const lo = Math.min(...rows.map(r => r.score))
      const end = rows[rows.length - 1]
      console.log(`    säsong ${s}: min ${fmt(lo)} · max ${fmt(hi)} · slut ${fmt(end.score)} (${end.zone})`)
    }
  }
  console.log('')
}

// Representativ omgång-för-omgång-utskrift: första fröet, säsong 1, per regim.
for (const regime of REGIMES) {
  if (QUIET) break
  const run = allRuns.find(r => r.regime === regime && !r.crashed)
  if (!run) continue
  console.log(`── ${regime}, frö ${run.seed}, säsong 1, omgång för omgång ──`)
  console.log('  omg  poäng  zon      visad    orsak    press  seger  oläst  fatigue  beat    skugga')
  for (const s of seasonRows(run.samples, 1)) {
    console.log(
      `  ${String(s.matchday).padStart(3)}  ` +
      `${fmt(s.score).padStart(5)}  ` +
      `${s.zone.padEnd(7)}  ` +
      `${(s.shownZone ?? '—').padEnd(7)}  ` +
      `${(s.cause ?? '—').padEnd(7)}  ` +
      `${fmt(s.pressDelta).padStart(5)}  ` +
      `${(s.lastWon ? 'ja' : 'nej').padEnd(5)}  ` +
      `${String(s.unreadInbox).padStart(5)}  ` +
      `${String(s.fatigue).padStart(7)}  ` +
      `${(s.beat ?? '—').padEnd(6)}  ` +
      `${fmt(s.shadowScore).padStart(6)}`,
    )
  }
  console.log('')
}

// ── Kriterieutvärdering ──────────────────────────────────────────────────────

console.log('═══ GODKÄNT NÄR ═══')

const svararRuns = allRuns.filter(r => (r.regime === 'svarar' || r.regime === 'svarar_utan_relief') && !r.crashed)
for (const run of svararRuns) {
  const s1 = seasonRows(run.samples, 1)
  const peakS1 = Math.max(...s1.map(r => r.score))
  const reachedFriskInS1 = s1.some(r => r.zone === 'frisk' && r.matchday > SVARAR_INJECT_MATCHDAY)
  const stuckHigh = run.samples.filter(r => r.zone === 'hog').length
  const reliefTotal = run.samples.reduce((a, r) => a + r.reliefTaken, 0)
  const friskAt = s1.findIndex(r => r.zone === 'frisk' && r.matchday > SVARAR_INJECT_MATCHDAY)
  console.log(
    `1. ${run.regime} frö ${run.seed}: topp säsong 1 = ${fmt(peakS1)}; ` +
    `nådde 'frisk' inom säsong 1 efter vändningen: ${reachedFriskInS1 ? `JA (omg ${s1[friskAt].matchday})` : 'NEJ'}; ` +
    `slutpoäng säsong 1 = ${fmt(s1[s1.length - 1].score)}; ` +
    `omgångar i 'hög' totalt: ${stuckHigh}/${run.samples.length}; relief tagna: ${reliefTotal}`,
  )
}

const passivRuns = allRuns.filter(r => r.regime === 'passiv' && !r.crashed)
for (const run of passivRuns) {
  const peak = Math.max(...run.samples.map(r => r.score))
  const roundsToHog = run.samples.findIndex(r => r.zone === 'hog')
  const hogShare = run.samples.filter(r => r.zone === 'hog').length / run.samples.length
  console.log(
    `2. passiv frö ${run.seed}: topp ${fmt(peak)}; nådde 'hög' vid omgång ${roundsToHog + 1}; ` +
    `andel omgångar i 'hög': ${fmt(hogShare * 100)} %`,
  )
}

let retriggerViolations = 0
for (const run of allRuns) {
  if (run.crashed) continue
  let prev: BurnoutZone | undefined = undefined
  for (const s of run.samples) {
    if (s.beat !== null && s.shownZone === prev) retriggerViolations++
    prev = s.shownZone
  }
}
console.log(`3. beats som fyrade på OFÖRÄNDRAD visad zon: ${retriggerViolations} (ska vara 0)`)

const causeCoverage = allRuns
  .filter(r => !r.crashed)
  .flatMap(r => r.samples)
  .filter(s => s.zone !== 'frisk')
const withCause = causeCoverage.filter(s => s.cause !== undefined).length
console.log(
  `4. omgångar i förhöjd zon med härledd orsak: ${withCause}/${causeCoverage.length} ` +
  `(${fmt(causeCoverage.length ? (withCause / causeCoverage.length) * 100 : 0)} %). ` +
  `Orsaksfördelning: ${['losses', 'inbox', 'fatigue'].map(c => `${c}=${causeCoverage.filter(s => s.cause === c).length}`).join(' ')}`,
)

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify(allRuns, null, 2))
  console.log(`\nJSON: ${JSON_OUT}`)
}
