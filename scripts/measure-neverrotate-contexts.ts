/**
 * measure-neverrotate-contexts.ts — Jacobs beställning 2026-09-20.
 *
 * lu_neverRotate mätte +0,57 ±0,17 mot baseline i det fulla §0-sveppet.
 * Frågan: är rotationsspaken (autoSelectLineup) LEVANDE — dvs finns det
 * sammanhang där den slår fast elva? Testas i två av de tre kontexterna
 * Jacob bad om (den tredje, cup+liga samma vecka, visade sig sakna data —
 * se `docs/matningar/spakbalans_2026-09-18/neverrotate-context-a-empty.md`):
 *
 *   (b) säsonger med ≥3 samtidiga skador i den fasta elvan
 *   (c) under tr_extreme
 *
 * Metod: samma seed körs parallellt under fast elva (neverRotate, samma
 * sticky-XI-logik som lever-sweep.ts, persisterad över hela karriären — inte
 * återställd per säsong) och under baseline (autoSelectLineup varje omgång).
 * Parad jämförelse, filtrerad till de säsonger/kontexter som matchar villkoret.
 */
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import {
  createHeadlessGame, autoSelectLineup, autoBuildCheapestAffordableFacility,
  autoResolvePendingScreen, autoResolvePendingEvents,
} from './stress/fixtures'
import { setLineup } from '../src/application/useCases/setLineup'
import { PlayerPosition, TrainingType, TrainingIntensity } from '../src/domain/enums'
import type { SaveGame } from '../src/domain/entities/SaveGame'

function mulberry(seed: number) {
  let a = seed
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Identisk logik med lever-sweep.ts:s pickLineup(neverRotate) — samma sticky-mönster. */
function pickNeverRotate(game: SaveGame, sticky: { ids: string[] | null }): SaveGame {
  const clubId = game.managedClubId
  const all = game.players.filter(p => p.clubId === clubId)
  if (!sticky.ids) {
    const best = autoSelectLineup(game)
    sticky.ids = best.managedClubPendingLineup?.startingPlayerIds ?? null
    if (!sticky.ids) return best
  }
  const byId = new Map(all.map(p => [p.id, p]))
  const still = sticky.ids.filter(id => byId.has(id))
  const ordered = [...still.map(id => byId.get(id)!), ...all.filter(p => !still.includes(p.id))]
  const gks = ordered.filter(p => p.position === PlayerPosition.Goalkeeper)
  const out = ordered.filter(p => p.position !== PlayerPosition.Goalkeeper)
  const starters: string[] = []
  if (gks.length) starters.push(gks[0].id)
  for (const p of out) { if (starters.length >= 11) break; starters.push(p.id) }
  for (const p of ordered) { if (starters.length >= 11) break; if (!starters.includes(p.id)) starters.push(p.id) }
  if (starters.length < 11) return autoSelectLineup(game)
  const bench = ordered.filter(p => !starters.includes(p.id)).slice(0, 5).map(p => p.id)
  const r = setLineup({ game, clubId, startingPlayerIds: starters, benchPlayerIds: bench })
  if (r.success) return r.game
  const club = game.clubs.find(c => c.id === clubId)!
  return { ...game, managedClubPendingLineup: { startingPlayerIds: starters, benchPlayerIds: bench, tactic: club.activeTactic }, lineupConfirmedThisRound: true }
}

interface SeasonResult {
  seed: number
  season: number
  points: number | null
  maxSimultaneousInjuries: number
}

/** Kör en hel karriär (N säsonger) under EN policy, returnerar poäng + skadeprofil per säsong. */
function runCareer(seed: number, seasons: number, mode: 'neverRotate' | 'best', extremeTraining: boolean): SeasonResult[] {
  let game: SaveGame = createHeadlessGame(seed)
  const sticky = { ids: null as string[] | null }
  const rand = mulberry(seed * 7919 + 17)
  const results: SeasonResult[] = []

  for (let season = 1; season <= seasons; season++) {
    let stepSeed = seed * 100_000 + season * 1_000
    let lastStandings: SaveGame['standings'] = []
    let maxSimultaneous = 0
    let done = false
    let guard = 0

    while (!done && guard++ < 400) {
      if (extremeTraining) {
        game = { ...game, managedClubTraining: { type: TrainingType.Physical, intensity: TrainingIntensity.Extreme } }
      }
      game = mode === 'neverRotate' ? pickNeverRotate(game, sticky) : autoSelectLineup(game)
      game = autoBuildCheapestAffordableFacility(game)
      game = autoResolvePendingEvents(game, rand)

      // Skaderäkning i DEN AKTUELLA startelvan (sticky.ids för neverRotate,
      // annars den elva som just valdes denna omgång).
      const currentStarters = game.managedClubPendingLineup?.startingPlayerIds
        ?? sticky.ids ?? []
      const injuredCount = game.players.filter(p =>
        currentStarters.includes(p.id) && p.isInjured).length
      if (injuredCount > maxSimultaneous) maxSimultaneous = injuredCount

      try {
        const r = advanceToNextEvent(game, stepSeed++)
        game = r.game
        // BUGG HITTAD VID VERIFIERINGEN (2026-09-20): på säsongens sista anrop
        // är r.roundPlayed === null (rollover-anropet, inget nytt rundresultat)
        // och game.standings har REDAN nollställts till NÄSTA säsongs tomma
        // tabell. Att uppdatera lastStandings ovillkorat skrev över den
        // verkliga slutställningen med nollor på VARJE körning, för BÅDA
        // policyerna lika — det gav den falska "0,00 ±0,00"-nollan i första
        // försöket. Samma mönster som lever-sweep.ts:s egen (korrekta) kod:
        // uppdatera bara när ett riktigt rundresultat finns.
        if (r.roundPlayed !== null && game.standings?.length) lastStandings = game.standings
        if (r.seasonEnded || game.managerFired) done = true
      } catch {
        done = true
      }
      const res = mode === 'neverRotate'
        ? { unresolvable: false, game }
        : autoResolvePendingScreen(game)
      if (res.unresolvable) done = true
      game = res.game
    }

    const row = lastStandings.find(s => s.clubId === game.managedClubId)
    results.push({ seed, season, points: row?.points ?? null, maxSimultaneousInjuries: maxSimultaneous })
    if (game.managerFired) break
  }
  return results
}

function mean(a: number[]) { return a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN }
function sd(a: number[]) { const m = mean(a); return Math.sqrt(mean(a.map(v => (v - m) ** 2))) }

const seeds = (process.argv[2] ?? '0,1,2,3,4,5,6,7,8,9,10,11').split(',').map(Number)
const seasons = Number(process.argv[3] ?? 5)
const context = process.argv[4] ?? 'injury'   // 'injury' | 'extreme'

console.log(`\n=== lu_neverRotate kontext-mätning — ${seeds.length} seeds × ${seasons} säsonger, kontext=${context} ===\n`)

const nrResults: SeasonResult[] = []
const baseResults: SeasonResult[] = []
for (const seed of seeds) {
  nrResults.push(...runCareer(seed, seasons, 'neverRotate', context === 'extreme'))
  baseResults.push(...runCareer(seed, seasons, 'best', context === 'extreme'))
}

const baseKey = new Map(baseResults.map(r => [`${r.seed}|${r.season}`, r]))

if (context === 'injury') {
  const threshold = 3
  const highInjurySeasons = nrResults.filter(r => r.maxSimultaneousInjuries >= threshold)
  console.log(`(b) säsonger med ≥${threshold} samtidiga skador i fast elva: ${highInjurySeasons.length} av ${nrResults.length}`)
  const dP: number[] = []
  for (const r of highInjurySeasons) {
    const b = baseKey.get(`${r.seed}|${r.season}`)
    if (b && r.points !== null && b.points !== null) dP.push(r.points - b.points)
  }
  if (dP.length === 0) {
    console.log('  Inga matchande säsonger med giltiga poäng på båda sidor — kan inte mäta.')
  } else {
    const m = mean(dP), se = sd(dP) / Math.sqrt(dP.length)
    console.log(`  Δpoäng (neverRotate − baseline) i högskade-säsonger: ${m.toFixed(2)} ±${se.toFixed(2)}  (n=${dP.length})`)
    console.log(`  ${m < 0 ? 'FAST ELVA FÖRLORAR i denna kontext' : 'fast elva förlorar INTE i denna kontext'}`)
  }
  // Fördelning av maxSimultaneousInjuries, för transparens.
  const dist = new Map<number, number>()
  for (const r of nrResults) dist.set(r.maxSimultaneousInjuries, (dist.get(r.maxSimultaneousInjuries) ?? 0) + 1)
  console.log('  fördelning maxSimultaneousInjuries:', [...dist.entries()].sort((a, b) => a[0] - b[0]))
} else {
  const dP: number[] = []
  for (const r of nrResults) {
    const b = baseKey.get(`${r.seed}|${r.season}`)
    if (b && r.points !== null && b.points !== null) dP.push(r.points - b.points)
  }
  const m = mean(dP), se = sd(dP) / Math.sqrt(dP.length)
  console.log(`(c) under tr_extreme: Δpoäng (neverRotate − baseline), n=${dP.length}`)
  console.log(`  ${m.toFixed(2)} ±${se.toFixed(2)}`)
  console.log(`  ${m < 0 ? 'FAST ELVA FÖRLORAR i denna kontext' : 'fast elva förlorar INTE i denna kontext'}`)
}
console.log('')
