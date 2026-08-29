/**
 * A3 — KONDITIONSSPIRALEN, uthållighetstest B.
 * DOM_A3_KONDITIONSSPIRAL_2026-08-29.md, "GODKÄNT NÄR".
 *
 * Domens mätorder, ordagrant:
 *   "Kör deterministiskt 5 säsonger med 18-, 20- och 24-mannatrupp,
 *    kompetent spel med rekommenderad elva + normalt träningsbyte.
 *    Mät median + 10:e percentil kondition före varje match, antal
 *    starter under golvet 22, skador, tillgängliga spelare."
 *
 * STEG 0 (förgiftade-sim-varningen): truppen byggs av RIKTIGT genererade
 * spelare. Standardtruppen är 16 (POSITION_POOL, worldGenerator.ts:454).
 * För 18/20/24 grafas extra spelare in från en PARALLELL värld med samma
 * klubbmall (samma reputation → samma CA/stamina-fördelning) men annat frö
 * — ingen syntetisk +CA-blankett, ingen handplockad stamina.
 *
 * "Kompetent spel" = pickBestEleven() (lineupNudge.ts — exakt den
 * "Fyll bästa elvan"-logik auditen testade), bänk = de fem näst bästa.
 * Inte stress-harnessets CA-sortering, som ignorerar fitness helt.
 *
 * Tre periodiseringspolicyer mäts separat, eftersom domens krav 2 handlar
 * om just Vila-valets verkan:
 *   hall     — normalläget, Vila används aldrig (referensbana)
 *   vila     — Vila påslaget hela tiden ("ligger kvar i flera år", domen)
 *   adaptiv  — kompetent manager: Vila när truppmedianen < 55, Hall > 75
 *
 * Kör: node_modules/.bin/vite-node scripts/a3-konditionsspiral-matning-2026-08-29.ts
 *      [--seasons=5] [--seeds=2,3,4] [--sizes=18,20,24] [--json=fil.json]
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { setLineup } from '../src/application/useCases/setLineup'
import { autoResolvePendingScreen } from './stress/fixtures'
import { pickBestEleven } from '../src/presentation/utils/lineupNudge'
import { FATIGUE_AVAILABILITY_FLOOR } from '../src/domain/services/squadEvaluator'
import { PlayerPosition } from '../src/domain/enums'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { Player } from '../src/domain/entities/Player'
import { writeFileSync } from 'node:fs'

// ── Parametrar ───────────────────────────────────────────────────────────────

const CONTROL_CLUB = 'club_malilla'   // samma kontrollklubb som A-H2/ANSPARK1
/**
 * hall/vila/adaptiv använder alla pickBestEleven (kompetent spel, domens ord).
 * `stjarnor` är KONTRASTEN: den naive/lojale managern som alltid startar sina
 * elva bästa på currentAbility och struntar i kondition. Den finns här för att
 * bevisa att A-H3:s golv fortfarande BITER efter A3-fixen — om ingen policy
 * någonsin når under golvet har vi inte lagat spiralen, vi har tagit bort
 * tröttheten. Domen kräver att kostnaden blir spelarens SYNLIGA beslut, inte
 * att den försvinner.
 */
type Policy = 'hall' | 'vila' | 'adaptiv' | 'stjarnor'
const POLICIES: Policy[] = ['hall', 'vila', 'adaptiv', 'stjarnor']

const args = process.argv.slice(2)
function argVal(name: string, fallback: string): string {
  const hit = args.find(a => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}
const SEASONS = parseInt(argVal('seasons', '5'), 10)
const SEEDS = argVal('seeds', '2,3,4,5,6').split(',').map(s => parseInt(s, 10))
const SIZES = argVal('sizes', '18,20,24').split(',').map(s => parseInt(s, 10))
const JSON_OUT = argVal('json', '')

// Adaptiv-policyns trösklar (kompetent manager, inte optimalspel)
const ADAPTIV_VILA_UNDER = 55
const ADAPTIV_HALL_OVER = 75

// ── Statistikhjälpare ────────────────────────────────────────────────────────

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}
function median(values: number[]): number {
  return percentile([...values].sort((a, b) => a - b), 0.5)
}
function p10(values: number[]): number {
  return percentile([...values].sort((a, b) => a - b), 0.10)
}
function mean(values: number[]): number {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : NaN
}
function fmt(v: number, d = 1): string {
  return Number.isFinite(v) ? v.toFixed(d) : '—'
}

// ── Truppbygge (STEG 0: riktiga spelare, ingen syntetisk blankett) ───────────

/**
 * Bygger en trupp på exakt `size` spelare för kontrollklubben. 16 kommer ur
 * klubbens egen generering; överskjutande grafas in från en parallell värld
 * med SAMMA klubbmall (samma reputation-driven CA/stamina-fördelning) men
 * annat frö. Prioriterar utespelarpositioner — två målvakter räcker, precis
 * som POSITION_POOL redan säger.
 */
function buildGameWithSquadSize(seed: number, size: number, label: string): SaveGame {
  const base = createNewGame({ managerName: `A3-${label}`, clubId: CONTROL_CLUB, seed })
  const game: SaveGame = { ...base, pendingScreen: null }
  const own = game.players.filter(p => p.clubId === CONTROL_CLUB)
  const extra = size - own.length
  if (extra < 0) {
    throw new Error(`Truppstorlek ${size} < genererad trupp ${own.length} — nedtrimning ej implementerad (skulle handplocka).`)
  }
  if (extra === 0) return game

  const donor = createNewGame({ managerName: `A3-donor`, clubId: CONTROL_CLUB, seed: seed + 50_000 })
  const donorPool = donor.players
    .filter(p => p.clubId === CONTROL_CLUB && p.position !== PlayerPosition.Goalkeeper)
  // Rotera positionsordning så djupet fördelas, inte staplas på en position.
  const order = [PlayerPosition.Defender, PlayerPosition.Half, PlayerPosition.Midfielder, PlayerPosition.Forward]
  const byPos = new Map<PlayerPosition, Player[]>(order.map(pos => [pos, donorPool.filter(p => p.position === pos)]))
  const added: Player[] = []
  let oi = 0
  while (added.length < extra) {
    const pos = order[oi % order.length]
    oi++
    const pool = byPos.get(pos)!
    const next = pool.shift()
    if (!next) {
      if (order.every(p => (byPos.get(p)?.length ?? 0) === 0)) {
        throw new Error(`Donatorpoolen tom vid ${added.length}/${extra} — höj donatorvärldarna.`)
      }
      continue
    }
    added.push({ ...next, id: `${next.id}_a3x${added.length}`, isClubLegend: false })
  }

  const club = game.clubs.find(c => c.id === CONTROL_CLUB)!
  return {
    ...game,
    players: [...game.players, ...added],
    clubs: game.clubs.map(c =>
      c.id === CONTROL_CLUB ? { ...c, squadPlayerIds: [...club.squadPlayerIds, ...added.map(p => p.id)] } : c,
    ),
  }
}

// ── Lineup: kompetent spel, rekommenderad elva ───────────────────────────────

function isAvailable(p: Player): boolean {
  return !p.isInjured && p.suspensionGamesRemaining <= 0 && (p.restGamesRemaining ?? 0) === 0
}

/** Naiv/lojal manager: elva bästa på ren currentAbility, kondition ignorerad.
 *  Samma form på returvärdet som pickBestEleven, så mätloopen är identisk. */
function pickStarsEleven(available: Player[]): { starters: Player[]; rest: Player[] } {
  const sorted = [...available].sort((a, b) => b.currentAbility - a.currentAbility)
  const gks = sorted.filter(p => p.position === PlayerPosition.Goalkeeper)
  const outfield = sorted.filter(p => p.position !== PlayerPosition.Goalkeeper)
  const starters: Player[] = gks.length > 0 ? [gks[0]] : []
  for (const p of outfield) {
    if (starters.length >= 11) break
    starters.push(p)
  }
  for (const p of gks.slice(1)) {
    if (starters.length >= 11) break
    starters.push(p)
  }
  const ids = new Set(starters.map(p => p.id))
  return { starters, rest: sorted.filter(p => !ids.has(p.id)) }
}

interface RoundSample {
  season: number
  matchday: number
  squadSize: number
  availableCount: number
  /** Kondition för de elva som faktiskt startade, FÖRE matchen. */
  starterFitness: number[]
  /** Kondition för hela truppen, FÖRE matchen. */
  squadFitness: number[]
  startsBelowFloor: number
  forcedBelowFloor: boolean   // < 11 tillgängliga över golvet → autofyll tvingades under
  injuredCount: number
  restingCount: number
  suspendedCount: number
  avgSeasonForm: number
  mode: Policy
}

interface RunResult {
  samples: RoundSample[]
  newInjuriesTotal: number
  seasonBoundaries: Array<{ season: number; fitnessAtLastMatch: number[]; fitnessAtFirstMatchNext: number[] }>
  crashed: string | null
}

function runOne(seed: number, size: number, policy: Policy): RunResult {
  const label = `${policy}-${size}-${seed}`
  let game = buildGameWithSquadSize(seed, size, label)
  game = { ...game, managedClubPeriodisation: policy === 'vila' ? 'vila' : 'hall', managedClubPeriodisationSince: 0 }

  const samples: RoundSample[] = []
  const seasonBoundaries: RunResult['seasonBoundaries'] = []
  let newInjuriesTotal = 0
  let stepSeed = seed * 1000 + size * 7 + policy.length
  let currentMode: Policy = policy === 'vila' ? 'vila' : 'hall'

  for (let season = 1; season <= SEASONS; season++) {
    let seasonDone = false
    let guard = 0
    let lastMatchFitness: number[] = []
    let firstMatchFitness: number[] | null = null

    while (!seasonDone) {
      if (++guard > 2000) return { samples, newInjuriesTotal, seasonBoundaries, crashed: `guard s${season}` }

      const squad = game.players.filter(p => p.clubId === game.managedClubId)
      const available = squad.filter(isAvailable)

      // Adaptiv Vila-policy — kompetent manager, inte optimalspel.
      if (policy === 'adaptiv') {
        const med = median(squad.map(p => p.fitness))
        const want: Policy = med < ADAPTIV_VILA_UNDER ? 'vila' : med > ADAPTIV_HALL_OVER ? 'hall' : currentMode
        if (want !== currentMode) {
          currentMode = want
          game = { ...game, managedClubPeriodisation: want as 'hall' | 'vila', managedClubPeriodisationSince: game.currentMatchday }
        }
      }

      let sampled: RoundSample | null = null
      if (available.length >= 11) {
        const { starters, rest } = policy === 'stjarnor'
          ? pickStarsEleven(available)
          : pickBestEleven(available)
        const aboveFloor = available.filter(p => p.fitness >= FATIGUE_AVAILABILITY_FLOOR).length
        const res = setLineup({
          game,
          clubId: game.managedClubId,
          startingPlayerIds: starters.map(p => p.id),
          benchPlayerIds: rest.slice(0, 5).map(p => p.id),
          autoSelected: true,
        })
        if (res.success) {
          game = res.game
          sampled = {
            season,
            matchday: game.currentMatchday,
            squadSize: squad.length,
            availableCount: available.length,
            starterFitness: starters.map(p => p.fitness),
            squadFitness: squad.map(p => p.fitness),
            startsBelowFloor: starters.filter(p => p.fitness < FATIGUE_AVAILABILITY_FLOOR).length,
            forcedBelowFloor: aboveFloor < 11,
            injuredCount: squad.filter(p => p.isInjured).length,
            restingCount: squad.filter(p => (p.restGamesRemaining ?? 0) > 0).length,
            suspendedCount: squad.filter(p => p.suspensionGamesRemaining > 0).length,
            avgSeasonForm: mean(squad.map(p => p.seasonForm ?? 60)),
            mode: currentMode,
          }
        }
      }

      const injuredBefore = new Set(game.players.filter(p => p.isInjured).map(p => p.id))
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game
      for (const p of game.players) {
        if (p.isInjured && !injuredBefore.has(p.id) && p.clubId === game.managedClubId) newInjuriesTotal++
      }

      // Registrera bara rundor där den styrda klubben faktiskt spelade.
      if (result.roundPlayed != null && sampled) {
        samples.push(sampled)
        lastMatchFitness = sampled.squadFitness
        if (firstMatchFitness === null) firstMatchFitness = sampled.squadFitness
      }

      if (result.seasonEnded || game.managerFired) {
        seasonDone = true
      } else {
        const resolved = autoResolvePendingScreen(game)
        if (resolved.unresolvable) {
          return { samples, newInjuriesTotal, seasonBoundaries, crashed: `pendingScreen ${resolved.screenType}` }
        }
        game = resolved.game
      }
    }

    seasonBoundaries.push({ season, fitnessAtLastMatch: lastMatchFitness, fitnessAtFirstMatchNext: [] })

    if (game.managerFired) {
      // Mätmetodik: avsked är inte det som mäts här. Fortsätt banan så
      // konditionskurvan går att följa hela vägen till säsong 5.
      game = { ...game, managerFired: false }
    }
    const resolved = autoResolvePendingScreen(game)
    if (!resolved.unresolvable) game = resolved.game
  }

  // Fyll i "första matchen nästa säsong" ur samples (offseason-återställningen).
  for (const b of seasonBoundaries) {
    const first = samples.find(s => s.season === b.season + 1)
    if (first) b.fitnessAtFirstMatchNext = first.squadFitness
  }

  return { samples, newInjuriesTotal, seasonBoundaries, crashed: null }
}

// ── Rapport ──────────────────────────────────────────────────────────────────

/** Kandidatnivåer för X (domens punkt 4). X sätts av mätningen, inte tvärtom. */
const X_CANDIDATES = [20, 25, 30, 35, 40, 45]

interface CellAgg {
  policy: Policy
  size: number
  seasons: Array<{
    season: number
    matches: number
    squadSize: number
    squadMedian: number
    squadP10: number
    starterMedian: number
    starterP10: number
    startsBelowFloor: number
    forcedRounds: number
    avgAvailable: number
    avgInjured: number
    avgResting: number
    avgSeasonForm: number
  }>
  newInjuries: number
  crashes: number
  worstSeasonMedian: number
  finalSeasonMedian: number
  /** Sämsta ENSKILDA matchens truppmedian — "inför match" är ett per-match-påstående. */
  worstRoundSquadMedian: number
  worstRoundStarterMedian: number
  /** Andel matcher där truppmedianen låg under respektive kandidatnivå. */
  breachShare: Record<number, number>
  /** Offseason-lyft mätt på de SLITNA (10:e percentilen), inte medianen —
   *  medianen ligger ofta redan i taket och döljer återställningen. */
  offseasonLiftsP10: number[]
  totalRounds: number
  totalSubFloorStarts: number
  totalStarts: number
}

function aggregate(policy: Policy, size: number, runs: RunResult[]): CellAgg {
  const seasons: CellAgg['seasons'] = []
  for (let s = 1; s <= SEASONS; s++) {
    const rows = runs.flatMap(r => r.samples.filter(x => x.season === s))
    if (rows.length === 0) continue
    seasons.push({
      season: s,
      matches: Math.round(rows.length / Math.max(1, runs.length)),
      squadSize: mean(rows.map(r => r.squadSize)),
      squadMedian: mean(rows.map(r => median(r.squadFitness))),
      squadP10: mean(rows.map(r => p10(r.squadFitness))),
      starterMedian: mean(rows.map(r => median(r.starterFitness))),
      starterP10: mean(rows.map(r => p10(r.starterFitness))),
      startsBelowFloor: rows.reduce((a, r) => a + r.startsBelowFloor, 0) / Math.max(1, runs.length),
      forcedRounds: rows.filter(r => r.forcedBelowFloor).length / Math.max(1, runs.length),
      avgAvailable: mean(rows.map(r => r.availableCount)),
      avgInjured: mean(rows.map(r => r.injuredCount)),
      avgResting: mean(rows.map(r => r.restingCount)),
      avgSeasonForm: mean(rows.map(r => r.avgSeasonForm)),
    })
  }
  const offseasonLiftsP10: number[] = []
  for (const r of runs) {
    for (const b of r.seasonBoundaries) {
      if (b.fitnessAtLastMatch.length && b.fitnessAtFirstMatchNext.length) {
        offseasonLiftsP10.push(p10(b.fitnessAtFirstMatchNext) - p10(b.fitnessAtLastMatch))
      }
    }
  }
  const allRows = runs.flatMap(r => r.samples)
  const roundMedians = allRows.map(r => median(r.squadFitness))
  const breachShare: Record<number, number> = {}
  for (const x of X_CANDIDATES) {
    breachShare[x] = allRows.length ? roundMedians.filter(m => m < x).length / allRows.length : NaN
  }
  return {
    policy,
    size,
    seasons,
    newInjuries: runs.reduce((a, r) => a + r.newInjuriesTotal, 0) / Math.max(1, runs.length),
    crashes: runs.filter(r => r.crashed).length,
    worstSeasonMedian: seasons.length ? Math.min(...seasons.map(s => s.squadMedian)) : NaN,
    finalSeasonMedian: seasons.length ? seasons[seasons.length - 1].squadMedian : NaN,
    worstRoundSquadMedian: roundMedians.length ? Math.min(...roundMedians) : NaN,
    worstRoundStarterMedian: allRows.length ? Math.min(...allRows.map(r => median(r.starterFitness))) : NaN,
    breachShare,
    offseasonLiftsP10,
    totalRounds: allRows.length,
    totalSubFloorStarts: allRows.reduce((a, r) => a + r.startsBelowFloor, 0),
    totalStarts: allRows.length * 11,
  }
}

function printCell(c: CellAgg): void {
  console.log(`\n── ${c.policy.toUpperCase()} · ${c.size}-mannatrupp · ${SEEDS.length} frön ${'─'.repeat(20)}`)
  console.log('  säs  matcher  trupp  trupp-med  trupp-p10  start-med  start-p10  <golv/säs  tvingad  tillg  skad  vilar  seasonForm')
  for (const s of c.seasons) {
    console.log(
      `  ${String(s.season).padStart(3)}  ${String(s.matches).padStart(7)}  ${fmt(s.squadSize, 0).padStart(5)}  ` +
      `${fmt(s.squadMedian).padStart(9)}  ${fmt(s.squadP10).padStart(9)}  ` +
      `${fmt(s.starterMedian).padStart(9)}  ${fmt(s.starterP10).padStart(9)}  ` +
      `${fmt(s.startsBelowFloor).padStart(9)}  ${fmt(s.forcedRounds).padStart(7)}  ` +
      `${fmt(s.avgAvailable).padStart(5)}  ${fmt(s.avgInjured).padStart(4)}  ${fmt(s.avgResting).padStart(5)}  ${fmt(s.avgSeasonForm).padStart(10)}`,
    )
  }
  console.log(`  nya skador/säsong: ${fmt(c.newInjuries / SEASONS)}   krascher: ${c.crashes}`)
  console.log(`  starter under golvet ${FATIGUE_AVAILABILITY_FLOOR}: ${c.totalSubFloorStarts}/${c.totalStarts} (${fmt(100 * c.totalSubFloorStarts / Math.max(1, c.totalStarts), 2)} %)`)
  console.log(`  sämsta ENSKILDA match: truppmedian ${fmt(c.worstRoundSquadMedian)} · startelvans median ${fmt(c.worstRoundStarterMedian)}`)
  console.log(`  offseason-lyft på de SLITNA (10:e percentilen): ${c.offseasonLiftsP10.map(v => fmt(v, 0)).join(', ')}`)
}

// ── Kör ──────────────────────────────────────────────────────────────────────

console.log('A3 — KONDITIONSSPIRALEN, uthållighetstest B')
console.log(`Klubb=${CONTROL_CLUB} · säsonger=${SEASONS} · frön=[${SEEDS.join(',')}] · storlekar=[${SIZES.join(',')}] · golv=${FATIGUE_AVAILABILITY_FLOOR}`)

const cells: CellAgg[] = []
for (const policy of POLICIES) {
  for (const size of SIZES) {
    const runs: RunResult[] = []
    for (const seed of SEEDS) {
      try {
        runs.push(runOne(seed, size, policy))
      } catch (e) {
        console.log(`  [${policy}/${size}/${seed}] KRASCH: ${(e as Error).message}`)
        runs.push({ samples: [], newInjuriesTotal: 0, seasonBoundaries: [], crashed: String(e) })
      }
    }
    const cell = aggregate(policy, size, runs)
    cells.push(cell)
    printCell(cell)
  }
}

// ── Produktkravet: nivån X ───────────────────────────────────────────────────

console.log(`\n${'═'.repeat(78)}`)
console.log('PRODUKTKRAV (domens punkt 4): "normal rotation + Vila får inte lämna')
console.log('majoriteten av truppen under X % kondition inför match."')
console.log('Majoriteten under X  ⇔  MEDIANEN under X. Tabellen visar medianbanan.\n')
console.log('  policy   trupp   säs1-med   säs5-med   sämsta säs   sämsta match   spiral?')
for (const c of cells) {
  const first = c.seasons[0]?.squadMedian ?? NaN
  // "Stabil negativ spiral" (domens ord) = banan FORTSÄTTER falla, inte att den
  // konvergerar från en uppblåst start. Säsong 1 är just en uppblåst start för
  // 24-mannatruppen: de flesta står över varje omgång och ligger nära taket, och
  // truppen krymper sedan till ~17 av pensioneringar. Att jämföra säsong 1 mot
  // säsong N flaggade därför konvergens som spiral. Rätt test: banan ska falla
  // MONOTONT från säsong 2 och sluta minst 10 under säsong 2.
  const band = c.seasons.slice(1)
  const monotoneFall = band.length >= 3 && band.every((s, i) => i === 0 || s.squadMedian <= band[i - 1].squadMedian)
  const spiral = monotoneFall && c.finalSeasonMedian < (band[0]?.squadMedian ?? first) - 10
  console.log(
    `  ${c.policy.padEnd(8)} ${String(c.size).padStart(5)}   ${fmt(first).padStart(8)}   ${fmt(c.finalSeasonMedian).padStart(8)}   ` +
    `${fmt(c.worstSeasonMedian).padStart(10)}   ${fmt(c.worstRoundSquadMedian).padStart(12)}   ${spiral ? 'JA' : 'nej'}`,
  )
}

console.log('\nAndel matcher där truppMEDIANEN låg under kandidatnivån X:')
console.log(`  policy   trupp  ${X_CANDIDATES.map(x => `<${x}%`.padStart(8)).join('')}`)
for (const c of cells) {
  console.log(
    `  ${c.policy.padEnd(8)} ${String(c.size).padStart(5)}  ` +
    X_CANDIDATES.map(x => `${fmt(100 * c.breachShare[x], 1)}%`.padStart(8)).join(''),
  )
}
console.log('\nX = den högsta nivån där ALLA celler visar 0.0 % brott. Högre nivå = tommare löfte.')

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify({ seasons: SEASONS, seeds: SEEDS, sizes: SIZES, cells }, null, 2))
  console.log(`\nJSON → ${JSON_OUT}`)
}
