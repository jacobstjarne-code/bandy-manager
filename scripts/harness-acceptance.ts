/**
 * harness-acceptance.ts — KÖRORDER 2026-09-18 §1.4.
 *
 * Regressionsmätning på HARNESS-nivå, inte på spelet. Svaret den ger är
 * "mäter headless samma spel som en människa spelar?", och den finns för att
 * AUDIT_SPAKSVEP_TEXTEXPONERING_2026-09-18 §2.6 visade att svaret var nej:
 * tre tillståndsövergångar (kontraktskrav, beslutskort, röstintroduktioner)
 * bodde i presentationslagret och inträffade aldrig headless.
 *
 * Fyra mått per säsong:
 *   answered       — besvarade beslutskort (svepets baslinje låg på ~60)
 *   demandsMet     — spelare vars lön höjdes av kontraktskravspolicyn
 *   leftoverAtEnd  — kort kvar i pendingEvents vid säsongsslut (ska vara 0
 *                    utom kort som genererades den sista omgången)
 *   stuck          — kort som observerats i pendingEvents i > 1 omgång EFTER
 *                    att harnessen försökt lösa dem. Ett fastnat kort är per
 *                    definition ett kort spelaren inte kan agera på (röstgrind,
 *                    saknat val) och ska rapporteras, inte tyst passeras.
 *
 * Kör: node_modules/.bin/vite-node scripts/harness-acceptance.ts [--seeds=12] [--seasons=1]
 */
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import {
  createHeadlessGame, autoSelectLineup, autoResolvePendingScreen,
  autoResolvePendingEvents, autoBuildCheapestAffordableFacility,
} from './stress/fixtures'
import { mulberry32 } from '../src/domain/utils/random'
import type { SaveGame } from '../src/domain/entities/SaveGame'

function parseArgs(): { seeds: number; seasons: number } {
  let seeds = 12, seasons = 1
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--seeds=')) seeds = parseInt(a.split('=')[1], 10)
    if (a.startsWith('--seasons=')) seasons = parseInt(a.split('=')[1], 10)
  }
  return { seeds, seasons }
}

interface SeasonRow {
  seed: number
  season: number
  answered: number
  demandsMet: number
  leftoverAtEnd: number
  leftoverIds: string[]
  stuck: Array<{ id: string; rounds: number }>
  hiddenVoiceCards: Array<{ id: string; rounds: number }>
}

const { seeds, seasons } = parseArgs()
const rows: SeasonRow[] = []

for (let seed = 0; seed < seeds; seed++) {
  let game: SaveGame = createHeadlessGame(seed)
  const eventRand = mulberry32(seed * 7919 + 17)

  for (let season = 1; season <= seasons; season++) {
    let answered = 0
    let demandsMet = 0
    let round = 0
    let lastRoundPlayed = 0
    // id → omgångar där kortet SETTS EFTER att harnessen redan försökt lösa det
    const seenAfterResolveAttempt = new Map<string, Set<number>>()
    const everAttempted = new Set<string>()
    const hiddenVoiceRounds = new Map<string, number>()
    let stepSeed = seed * 100_000 + season * 1_000
    let done = false

    for (let guard = 0; guard < 400 && !done; guard++) {
      game = autoSelectLineup(game)
      game = autoBuildCheapestAffordableFacility(game)

      for (const e of game.pendingEvents ?? []) {
        if (everAttempted.has(e.id)) {
          const set = seenAfterResolveAttempt.get(e.id) ?? new Set<number>()
          set.add(round)
          seenAfterResolveAttempt.set(e.id, set)
        }
        // §1 följdfråga (rapporteras, fixas inte här): ett kort med `voiceId`
        // men UTAN `introducesVoiceId` kan inte introducera sin egen röst. Före
        // rösten är introducerad filtreras det tyst bort av canEventPassVoiceGate
        // — det finns, men är osynligt och oavgörbart för spelaren. Räkna hur
        // många omgångar sådana kort ligger dolda.
        if (e.voiceId && !e.introducesVoiceId) {
          const introduced = game.introducedVoices?.[e.voiceId] !== undefined
          if (!introduced) {
            hiddenVoiceRounds.set(e.id, (hiddenVoiceRounds.get(e.id) ?? 0) + 1)
          }
        }
      }
      const before = (game.pendingEvents ?? []).length
      for (const e of game.pendingEvents ?? []) everAttempted.add(e.id)
      game = autoResolvePendingEvents(game, eventRand)
      answered += before - (game.pendingEvents ?? []).length

      const salariesBefore = new Map(game.players.map(p => [p.id, p.salary]))
      const r = advanceToNextEvent(game, stepSeed++)
      game = r.game
      if (r.roundPlayed !== null) { round = r.roundPlayed; lastRoundPlayed = r.roundPlayed }
      if (r.seasonEnded || game.managerFired) done = true

      // Dränera skärmar (season_summary → contract_demands → null, §1.1)
      for (let s = 0; s < 5; s++) {
        const res = autoResolvePendingScreen(game)
        if (res.unresolvable) break
        if (res.game === game) break
        game = res.game
        if (!game.pendingScreen) break
      }
      for (const p of game.players) {
        const prev = salariesBefore.get(p.id)
        if (prev !== undefined && p.salary > prev) demandsMet++
      }
      if (game.managerFired) done = true
    }

    const leftover = (game.pendingEvents ?? []).filter(e => !e.resolved)
    const stuck = [...seenAfterResolveAttempt.entries()]
      .filter(([, set]) => set.size > 1)
      .map(([id, set]) => ({ id, rounds: set.size }))
      .sort((a, b) => b.rounds - a.rounds)

    rows.push({
      seed, season, answered, demandsMet,
      leftoverAtEnd: leftover.length,
      leftoverIds: leftover.map(e => e.id).slice(0, 6),
      stuck,
      hiddenVoiceCards: [...hiddenVoiceRounds.entries()].map(([id, rounds]) => ({ id, rounds })),
    })
    if (game.managerFired) break
    void lastRoundPlayed
  }
}

const n = rows.length
const avg = (f: (r: SeasonRow) => number) => (rows.reduce((s, r) => s + f(r), 0) / Math.max(1, n))

console.log(`\n=== HARNESS-ACCEPTANS (§1.4) — ${seeds} seeds × ${seasons} säsong(er), ${n} säsongsrader ===\n`)
console.log(`besvarade beslutskort/säsong : ${avg(r => r.answered).toFixed(1)}`)
console.log(`kontraktskrav mötta/säsong   : ${avg(r => r.demandsMet).toFixed(1)}`)
console.log(`kort kvar vid säsongsslut    : ${avg(r => r.leftoverAtEnd).toFixed(2)}`)
const allStuck = rows.flatMap(r => r.stuck)
console.log(`fastnade kort (>1 omgång efter försök): ${allStuck.length} totalt över ${n} säsonger`)

if (allStuck.length > 0) {
  const byId = new Map<string, number>()
  for (const s of allStuck) {
    const stem = s.id.replace(/\d+/g, 'N')
    byId.set(stem, Math.max(byId.get(stem) ?? 0, s.rounds))
  }
  console.log('\n  värsta fastnade korten (id-stam → max antal omgångar synligt efter försök):')
  for (const [stem, rounds] of [...byId.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    console.log(`    ${String(rounds).padStart(3)}  ${stem}`)
  }
}

const withLeftover = rows.filter(r => r.leftoverAtEnd > 0)
if (withLeftover.length > 0) {
  console.log(`\n  säsonger med kvarliggande kort: ${withLeftover.length}/${n}`)
  for (const r of withLeftover.slice(0, 6)) {
    console.log(`    seed ${r.seed} säsong ${r.season}: ${r.leftoverAtEnd} st — ${r.leftoverIds.join(', ')}`)
  }
}

// §1 FÖLJDFRÅGA (rapporteras, fixas inte i denna order): kort med `voiceId`
// men utan `introducesVoiceId` som genereras innan rösten introducerats är
// osynliga och oavgörbara för spelaren tills introduktionen råkat ske.
// Går snittet över 2 omgångar är det ett Fable/Jacob-ärende (klass G).
const hidden = rows.flatMap(r => r.hiddenVoiceCards)
console.log(`\n=== FÖLJDFRÅGA: dolda kort (voiceId utan introducesVoiceId, röst ej introducerad) ===`)
if (hidden.length === 0) {
  console.log('  inga sådana kort observerades dolda i någon omgång')
} else {
  const avgHidden = hidden.reduce((s, h) => s + h.rounds, 0) / hidden.length
  const maxHidden = Math.max(...hidden.map(h => h.rounds))
  console.log(`  antal kort: ${hidden.length} över ${n} säsonger`)
  console.log(`  snitt dolda omgångar: ${avgHidden.toFixed(2)}  (tröskel för Fable/Jacob-ärende: > 2)`)
  console.log(`  max dolda omgångar  : ${maxHidden}`)
  const byStem = new Map<string, number[]>()
  for (const h of hidden) {
    const stem = h.id.replace(/\d+/g, 'N')
    byStem.set(stem, [...(byStem.get(stem) ?? []), h.rounds])
  }
  for (const [stem, list] of [...byStem.entries()].sort((a, b) => Math.max(...b[1]) - Math.max(...a[1]))) {
    const mean = list.reduce((s, v) => s + v, 0) / list.length
    console.log(`    max ${String(Math.max(...list)).padStart(3)}  snitt ${mean.toFixed(1).padStart(5)}  ${stem}`)
  }
}
console.log('')
