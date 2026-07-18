/**
 * live-sim-sequence.ts — testar PT-3-hypotesen (BACKLOG.md): "matchar man direkt
 * efter en LIVE-vunnen match förlorar man oftare" som en SEKVENS-effekt, inte
 * isolerat. B10 (DECISIONS.md 2026-05-21) testade bara ISOLERADE matcher
 * (matchEngineParity.test.ts, N=1000, sim vs live oberoende av varandra) och
 * stängdes som "avsett — halvtidsjusteringar i live". Det testet mätte aldrig
 * SEKVENSEN live→sim med samma spelares tillstånd buret vidare.
 *
 * Kör med:
 *   node_modules/.bin/vite-node scripts/live-sim-sequence.ts [--n=1000]
 *
 * Design: N oberoende säsonger (varierat world-seed, samma mönster som
 * live-vs-sim.ts). I varje säsong, lagets fyra första schemalagda LIGAMATCHER
 * i rad (cup exkluderad — annan motståndarnivå, inte "jämförbara motståndare"):
 *
 *   Match 1: körs genom domänmotorn med UTFALLET TVINGAT till vinst via
 *            rejection sampling (öka sub-seed tills matchen blir en äkta
 *            motor-simulerad vinst — ingen handpåklistrad poäng/report).
 *            Detta håller "vann vi eller inte"-moral/kondition-effekten
 *            konstant över alla N sekvenser, per uppdraget.
 *   Match 2, 3, 4: körs normalt i rad, ny lineup varje gång.
 *
 * ROTORSAK-ANTECKNING (kodspårning gjord innan detta skrevs, se rapport i
 * konversationen): saveLiveMatchResult (matchActions.ts) skriver INGA
 * spelarfält (fitness/sharpness/form/moral/skada) — den faktiska mutationen
 * sker i applyPlayerStateUpdates (playerStateProcessor.ts), anropad från
 * roundProcessor för BÅDE live och sim via samma advanceToNextEvent-väg.
 * Halvtidsjusteringens moral/sharpness-boost i MatchLiveScreen är EFEMÄR —
 * appliceras bara på lokala kopior som föder matchhändelser för den simulerade
 * andra halvleken, aldrig persisterad till game.players. Alltså: det finns
 * ingen kod-asymmetri mellan live och sim i VAD SOM SKRIVS efter matchslut.
 * Det här skriptet tvingar därför match 1 via samma domänväg (motsvarar en
 * live-vunnen match state-mässigt, per den spårningen) och mäter om det ändå
 * finns en sekvenseffekt — vilket i så fall är en generell återhämtningskurva
 * (match direkt efter EN match vs två matcher senare), inte något unikt för
 * live-UI:t. Se konsolutskriften för slutsats.
 */

import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { FixtureStatus } from '../src/domain/enums'
import { createHeadlessGame, autoSelectLineup } from './stress/fixtures'
import { advanceUntilManagedFixture } from '../src/testing/advanceUntilManagedFixture'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { Fixture } from '../src/domain/entities/Fixture'

// ── Arg parsing ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
let N = 1000
for (const a of args) {
  if (a.startsWith('--n=')) N = parseInt(a.split('=')[1], 10)
}
const MAX_WIN_ATTEMPTS = 30

// ── Helpers (samma mönster som live-vs-sim.ts) ─────────────────────────────────

function clearScreens(game: SaveGame): SaveGame {
  while (game.pendingScreen) game = { ...game, pendingScreen: null }
  return game
}

function advanceOne(game: SaveGame, seed?: number): { game: SaveGame; roundPlayed: number | null } {
  const r = advanceToNextEvent(game, seed)
  return { game: clearScreens(r.game), roundPlayed: r.roundPlayed }
}

function minScheduledMatchday(game: SaveGame): number {
  const scheduled = game.fixtures.filter(f => f.status === FixtureStatus.Scheduled)
  if (scheduled.length === 0) return Infinity
  return scheduled.reduce((mn, f) => f.matchday < mn ? f.matchday : mn, Infinity)
}

/**
 * Rotorsak-fix (upptäckt vid smoke-test): live-vs-sim.ts's motsvarande helper
 * sätter bara lineup vid MÅL-matchdagen, aldrig under dränering. Det håller
 * för dess eget bruk (m1 är nästan alltid matchday 1, ingen dränering behövs)
 * men INTE här — vi dränerar vidare till match 2/3/4, och cupen skapar nya
 * rundor DYNAMISKT när föregående cupomgång klarat sig (vem möter vem i R2
 * beror på R1:s resultat). Om laget har en bye rakt in i en sådan dynamiskt
 * skapad cupomgång utan att lineup satts, fastnar draineringen permanent på
 * den matchdagen. Fix: sätt lineup varje varv, inte bara vid mål-matchdagen.
 *
 * PT-8 (2026-07-18): loop-villkoret (samma bugg bet tre gånger separat,
 * se BACKLOG) flyttat till den delade src/testing/advanceUntilManagedFixture.ts
 * — denna funktion behåller bara SIN lineup-strategi (autoSelectLineup varje
 * varv) som `advanceOneRound`-callback.
 */
function advanceUntilMatchday(game: SaveGame, targetMatchday: number): SaveGame {
  return advanceUntilManagedFixture(
    game,
    g => clearScreens(advanceToNextEvent(autoSelectLineup(g)).game),
    { targetMatchday, maxRounds: 60 },
  )
}

function outcome(game: SaveGame, f: Fixture): 'win' | 'draw' | 'loss' {
  const id = game.managedClubId
  const isHome = f.homeClubId === id
  const ms = isHome ? f.homeScore ?? 0 : f.awayScore ?? 0
  const os = isHome ? f.awayScore ?? 0 : f.homeScore ?? 0
  return ms > os ? 'win' : ms < os ? 'loss' : 'draw'
}

function points(o: 'win' | 'draw' | 'loss'): number { return o === 'win' ? 2 : o === 'draw' ? 1 : 0 }

function goalDiff(game: SaveGame, f: Fixture): number {
  const id = game.managedClubId
  const isHome = f.homeClubId === id
  const ms = isHome ? f.homeScore ?? 0 : f.awayScore ?? 0
  const os = isHome ? f.awayScore ?? 0 : f.homeScore ?? 0
  return ms - os
}

function nextManagedLeagueFixture(game: SaveGame, afterMatchday = 0): Fixture | undefined {
  const id = game.managedClubId
  return game.fixtures
    .filter(f => !f.isCup && f.status === FixtureStatus.Scheduled && f.matchday > afterMatchday &&
                 (f.homeClubId === id || f.awayClubId === id))
    .sort((a, b) => a.matchday - b.matchday)[0]
}

function opponentReputation(game: SaveGame, f: Fixture): number {
  const id = game.managedClubId
  const oppId = f.homeClubId === id ? f.awayClubId : f.homeClubId
  return game.clubs.find(c => c.id === oppId)?.reputation ?? -1
}

/** Kör matchdagen vid targetMatchday med ett givet stepSeed (satt lineup om saknas). */
function playAtMatchday(game: SaveGame, targetMatchday: number, seed?: number): { game: SaveGame; ok: boolean } {
  const nextMd = minScheduledMatchday(game)
  if (nextMd !== targetMatchday) return { game, ok: false }
  const managedFix = game.fixtures.find(
    f => f.matchday === targetMatchday && f.status === FixtureStatus.Scheduled &&
         (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )
  if (managedFix && !game.managedClubPendingLineup) game = autoSelectLineup(game)
  const { game: next } = advanceOne(game, seed)
  return { game: next, ok: true }
}

// ── Statistik-hjälp ────────────────────────────────────────────────────────────

function mean(xs: number[]): number { return xs.reduce((a, b) => a + b, 0) / xs.length }
function variance(xs: number[]): number { const m = mean(xs); return xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1) }

function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * x)
  const d = 0.3989423 * Math.exp(-x * x / 2)
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return x >= 0 ? 1 - prob : prob
}

/** Welchs t-test (tvåsidig), p approximerad via normalapprox — giltigt vid stora n (vi har det). */
function welchT(a: number[], b: number[]): { t: number; p: number } {
  const ma = mean(a), mb = mean(b)
  const va = variance(a), vb = variance(b)
  const se = Math.sqrt(va / a.length + vb / b.length)
  const t = (ma - mb) / se
  const p = 2 * (1 - normalCdf(Math.abs(t)))
  return { t, p }
}

// ── Main ────────────────────────────────────────────────────────────────────────

interface Sample { points: number; gd: number; oppRep: number }
const m2: Sample[] = []
const m34: Sample[] = []
let sequencesCompleted = 0
let winForcingFailures = 0
let totalWinAttempts = 0
let errors = 0

for (let i = 0; i < N; i++) {
  const seed = i + 1
  if (i % 100 === 0) process.stdout.write(`  seed ${seed}/${N}...\n`)

  try {
    const game0 = clearScreens(createHeadlessGame(seed))

    const m1Fix = nextManagedLeagueFixture(game0)
    if (!m1Fix) { errors++; continue }
    const m1Md = m1Fix.matchday
    let gameAtM1 = advanceUntilMatchday(game0, m1Md)
    gameAtM1 = autoSelectLineup(gameAtM1)

    // ── Match 1: tvinga vinst via rejection sampling (äkta motorsimulering) ──
    let g1: SaveGame | null = null
    for (let attempt = 1; attempt <= MAX_WIN_ATTEMPTS; attempt++) {
      totalWinAttempts++
      const trySeed = seed * 100000 + attempt
      const { game: attemptGame, ok } = playAtMatchday(gameAtM1, m1Md, trySeed)
      if (!ok) break
      const f1 = attemptGame.fixtures.find(f => f.id === m1Fix.id && f.status === FixtureStatus.Completed)
      if (!f1) break
      if (outcome(attemptGame, f1) === 'win') { g1 = attemptGame; break }
    }
    if (!g1) { winForcingFailures++; continue }

    // ── Match 2, 3, 4: normal simulering, konsekutiva ligamatcher ────────────
    let cur = g1
    const results: Sample[] = []
    let lastMd = m1Md
    let ok4 = true
    for (let k = 0; k < 3; k++) {
      const nextFix = nextManagedLeagueFixture(cur, lastMd)
      if (!nextFix) { ok4 = false; break }
      const md = nextFix.matchday
      cur = advanceUntilMatchday(cur, md)
      cur = autoSelectLineup(cur)
      const { game: after, ok } = playAtMatchday(cur, md)
      if (!ok) { ok4 = false; break }
      const f = after.fixtures.find(x => x.id === nextFix.id && x.status === FixtureStatus.Completed)
      if (!f) { ok4 = false; break }
      const o = outcome(after, f)
      results.push({ points: points(o), gd: goalDiff(after, f), oppRep: opponentReputation(cur, nextFix) })
      cur = after
      lastMd = md
    }
    if (!ok4 || results.length !== 3) { errors++; continue }

    sequencesCompleted++
    m2.push(results[0])
    m34.push(results[1], results[2])

  } catch (e) {
    errors++
    if (errors <= 3) console.error(`  [seed ${seed}] error:`, e)
  }
}

// ── Report ────────────────────────────────────────────────────────────────────

console.log('\n── Sekvens-resultat (live-forcerad vinst match 1 → sim match 2/3/4) ───────')
console.log(`Sekvenser klara: ${sequencesCompleted}/${N}  |  win-forcing-fail: ${winForcingFailures}  |  fel: ${errors}`)
console.log(`Snitt win-forcing-försök per sekvens: ${(totalWinAttempts / N).toFixed(2)}`)

if (m2.length > 5 && m34.length > 5) {
  const m2Pts = m2.map(s => s.points), m34Pts = m34.map(s => s.points)
  const m2Gd = m2.map(s => s.gd), m34Gd = m34.map(s => s.gd)

  console.log(`\nMatch 2 (direkt efter tvingad vinst):  snittpoäng ${mean(m2Pts).toFixed(3)}  snitt-målskillnad ${mean(m2Gd).toFixed(3)}  (n=${m2.length})`)
  console.log(`Match 3–4 (två matcher senare):        snittpoäng ${mean(m34Pts).toFixed(3)}  snitt-målskillnad ${mean(m34Gd).toFixed(3)}  (n=${m34.length})`)

  const ptsTest = welchT(m2Pts, m34Pts)
  const gdTest = welchT(m2Gd, m34Gd)
  console.log(`\nWelchs t-test (poäng):        t=${ptsTest.t.toFixed(3)}  p=${ptsTest.p.toFixed(4)}`)
  console.log(`Welchs t-test (målskillnad):  t=${gdTest.t.toFixed(3)}  p=${gdTest.p.toFixed(4)}`)

  console.log(`\nMotståndarstyrka (reputation) — sanity check att "jämförbara motståndare" håller:`)
  console.log(`  Match 2: snitt ${mean(m2.map(s => s.oppRep)).toFixed(1)}  |  Match 3–4: snitt ${mean(m34.map(s => s.oppRep)).toFixed(1)}`)

  const SIG = 0.05
  if (ptsTest.p < SIG && mean(m2Pts) < mean(m34Pts)) {
    console.log('\n→ SLUTSATS: Match 2 underpresterar match 3–4 signifikant (p<0.05). Verklig sekvenseffekt.')
  } else if (ptsTest.p < SIG) {
    console.log('\n→ SLUTSATS: Signifikant skillnad, men INTE i riktningen "match 2 sämre" (p<0.05, fel håll). Inte hypotesen som beskrevs.')
  } else {
    console.log('\n→ SLUTSATS: Ingen signifikant skillnad (p≥0.05). Match 2 ligger inom brus av match 3–4 — känsla, inte bugg.')
  }
} else {
  console.log('\nFör få lyckade sekvenser för statistik.')
}
