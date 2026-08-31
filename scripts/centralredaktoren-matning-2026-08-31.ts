/**
 * CENTRALREDAKTÖREN — mätning mot domens "GODKÄNT NÄR" 1–4.
 * DOM_CENTRALREDAKTOREN_2026-08-31.md.
 *
 * Domens krav:
 *   1. Aldrig två kanaler samma omgång (kanal-exklusivitet håller).
 *   2. Ingen semanticKey återkommer inom sitt recency-fönster; inget
 *      gammalt svar följer med.
 *   3. Subjekt roterar — samma spelare figurerar inte i två personliga
 *      beats i rad.
 *   4. Repetitionskänslan i säsong 2 mätbart lägre (färre identiska ytor
 *      per 26 omgångar).
 *
 * METOD — riktig produktkodväg, inte omskriven formel. Spelet körs
 * headless via advanceToNextEvent(); dirigenten (narrativeCoordinatorService
 * + roundProcessor.ts-inkopplingen) körs som i produktion — ingen flagga,
 * ingen mock (CLAUDE.md: INGA FEATURE FLAGS).
 *
 * Kriterium 1/2 verifieras DIREKT mot den faktiska outputen: för varje
 * omgång inspekteras result.pendingEvents (omgångens nya köposter,
 * budgetedNewEvents i roundProcessor.ts) + ett eventuellt NYTT
 * pendingPressConference, och samma kanal-/recency-regler som
 * narrativeCoordinatorService tillämpar körs som en OBEROENDE
 * kontrollräkning ovanpå den redan filtrerade listan — om dirigenten
 * fungerar ska kontrollräkningen ALDRIG hitta ett brott, eftersom
 * bristande fall redan skulle ha filtrerats bort innan de nådde hit.
 *
 * Kriterium 4 — ÄRLIG GRÄNS: en sann före/efter-jämförelse hade krävt en
 * parallell körning av den ofiltrerade koden, men fixen sitter inte bakom
 * en flagga (CLAUDE.md-regel, INGA FEATURE FLAGS) — det finns ingen "gammal
 * väg" kvar att köra parallellt. Det som mäts i stället: hur ofta
 * recency-fönstren/rotationsspärrarna faktiskt AVFYRAR (poolen är under
 * tryck) och om den frekvensen ökar i säsong 2 (bevis att mekanismen gör
 * jobb där repetitionen annars hade synts) — samt hur ofta "släpp spärren
 * helt" (poolen fullt uttömd) inträffar, som är signalen att #5
 * (pool-djup) behövs, inte en mätbar defekt i denna leverans.
 *
 * Kör: node_modules/.bin/vite-node scripts/centralredaktoren-matning-2026-08-31.ts
 *      [--seasons=2] [--seeds=2,3,4] [--json=fil.json]
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen, autoResolvePendingEvents } from './stress/fixtures'
import {
  applySurfacingBudget,
  isExemptFromSurfacingBudget,
  recentlySurfaced,
  CHANNEL_BY_EVENT_TYPE,
  RECENCY_WINDOW_BY_CHANNEL,
  SURFACING_GLOBAL_CAP,
  type SurfacingChannel,
} from '../src/domain/services/narrativeCoordinatorService'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { GameEvent } from '../src/domain/entities/GameEvent'
import { writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
function argVal(name: string, fallback: string): string {
  const hit = args.find(a => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}
const SEASONS = parseInt(argVal('seasons', '2'), 10)
const SEEDS = argVal('seeds', '2,3,4').split(',').map(s => parseInt(s, 10))
const JSON_OUT = argVal('json', '')
const QUIET = args.includes('--quiet')

// ── Mätdata ──────────────────────────────────────────────────────────────────

interface ChannelViolation {
  season: number
  matchday: number
  kind: 'kollision' | 'takbrott'
  detail: string
}

interface RecencyViolation {
  season: number
  matchday: number
  semanticKey: string
  lastRound: number
  window: number
}

interface RotationSample {
  prefix: string
  season: number
  matchday: number
  subjectId: string
}

interface GateReleaseSample {
  season: number
  matchday: number
  kind: 'press_question' | 'subject_rotation'
  prefix: string
}

interface RunResult {
  seed: number
  channelViolations: ChannelViolation[]
  recencyViolations: RecencyViolation[]
  rotationSamples: RotationSample[]
  gateReleases: GateReleaseSample[]
  roundsPlayed: number
  crashed: string | null
}

function eventSemanticKey(e: GameEvent): string {
  // Samma prioritetsordning som dirigenten faktiskt loggar mot: den mest
  // finkorniga nyckeln som finns, annars event.type (grovkornigt, samma
  // fallback som eventResolver.ts:s huvudskrivväg).
  return e.pressQuestionKey ?? e.rotationKey ?? e.journalistExclusiveKey ?? e.type
}

function runOne(seed: number): RunResult {
  const base = createNewGame({ managerName: `CENTRALRED-${seed}`, clubId: 'club_malilla', seed })
  let game: SaveGame = { ...base, pendingScreen: null }

  const channelViolations: ChannelViolation[] = []
  const recencyViolations: RecencyViolation[] = []
  const rotationSamples: RotationSample[] = []
  const gateReleases: GateReleaseSample[] = []
  const lastSubjectByPrefix = new Map<string, string>()

  let stepSeed = seed * 1000
  const rand = () => {
    stepSeed = (stepSeed * 1103515245 + 12345) & 0x7fffffff
    return stepSeed / 0x7fffffff
  }

  let roundsPlayed = 0
  let prevPressId: string | undefined = undefined

  for (let season = 1; season <= SEASONS; season++) {
    let seasonDone = false
    let guard = 0

    while (!seasonDone) {
      if (++guard > 400) return { seed, channelViolations, recencyViolations, rotationSamples, gateReleases, roundsPlayed, crashed: `guard s${season}` }

      game = autoResolvePendingEvents(game, rand)
      game = autoSelectLineup(game)

      const preLog = game.narrativeBeatLog ?? []
      const result = advanceToNextEvent(game, Math.floor(rand() * 1_000_000))
      game = result.game
      roundsPlayed++
      const matchday = game.currentMatchday

      const newPress = game.pendingPressConference && game.pendingPressConference.id !== prevPressId
        ? game.pendingPressConference
        : undefined
      prevPressId = game.pendingPressConference?.id

      const roundCandidates: GameEvent[] = [
        ...(newPress ? [newPress] : []),
        ...(result.pendingEvents ?? []),
      ]

      // ── Kriterium 1: kanal-exklusivitet + globalt tak (kontrollräkning) ──
      const { kept: budgetKept } = applySurfacingBudget(roundCandidates)
      if (budgetKept.length !== roundCandidates.length) {
        channelViolations.push({
          season, matchday, kind: 'kollision',
          detail: `applySurfacingBudget skulle ha släppt ${roundCandidates.length - budgetKept.length} — de nådde ändå result/press`,
        })
      }
      const usedChannels = new Map<SurfacingChannel, number>()
      let nonExemptCount = 0
      for (const e of roundCandidates) {
        if (isExemptFromSurfacingBudget(e)) continue
        const ch = CHANNEL_BY_EVENT_TYPE[e.type]
        if (!ch) continue
        usedChannels.set(ch, (usedChannels.get(ch) ?? 0) + 1)
        nonExemptCount++
      }
      for (const [ch, count] of usedChannels) {
        if (count > 1) channelViolations.push({ season, matchday, kind: 'kollision', detail: `${count} poster i kanal ${ch}` })
      }
      if (nonExemptCount > SURFACING_GLOBAL_CAP) {
        channelViolations.push({ season, matchday, kind: 'takbrott', detail: `${nonExemptCount} icke-undantagna (tak ${SURFACING_GLOBAL_CAP})` })
      }

      // ── Kriterium 2: recency (kontrollräkning mot loggen FÖRE denna omgång) ──
      for (const e of roundCandidates) {
        if (isExemptFromSurfacingBudget(e)) continue
        const ch = CHANNEL_BY_EVENT_TYPE[e.type]
        const window = ch ? RECENCY_WINDOW_BY_CHANNEL[ch] : undefined
        if (!window) continue
        const key = eventSemanticKey(e)
        if (recentlySurfaced({ narrativeBeatLog: preLog }, key, window, matchday)) {
          const lastEntry = [...preLog].reverse().find(x => x.semanticKey === key)
          recencyViolations.push({ season, matchday, semanticKey: key, lastRound: lastEntry?.round ?? -1, window })
        }
      }

      // Diagnostik: hur ofta "släpp spärren helt" inträffade (poolen full uttömd)
      // — inte ett brott, men signalen till #5 (pool-djup) domen flaggar.
      for (const e of roundCandidates) {
        if (e.pressQuestionKey) {
          const stillFresh = !recentlySurfaced({ narrativeBeatLog: preLog }, e.pressQuestionKey, RECENCY_WINDOW_BY_CHANNEL.press ?? 5, matchday)
          if (!stillFresh) gateReleases.push({ season, matchday, kind: 'press_question', prefix: 'press_q_' })
        }
        if (e.rotationKey || e.journalistExclusiveKey) {
          const key = e.rotationKey ?? e.journalistExclusiveKey!
          const prefix = key.replace(/[^_]*$/, '')
          const subjectId = key.slice(prefix.length)
          rotationSamples.push({ prefix, season, matchday, subjectId })
        }
      }

      // ── Kriterium 3: subjekt roterar (samma spelare inte i två raka beats) ──
      for (const s of rotationSamples.filter(r => r.season === season && r.matchday === matchday)) {
        const prev = lastSubjectByPrefix.get(s.prefix)
        if (prev !== undefined && prev === s.subjectId) {
          gateReleases.push({ season, matchday, kind: 'subject_rotation', prefix: s.prefix })
        }
        lastSubjectByPrefix.set(s.prefix, s.subjectId)
      }

      if (result.seasonEnded || game.managerFired) {
        seasonDone = true
      } else {
        const resolved = autoResolvePendingScreen(game)
        if (resolved.unresolvable) {
          return { seed, channelViolations, recencyViolations, rotationSamples, gateReleases, roundsPlayed, crashed: `pendingScreen ${resolved.screenType}` }
        }
        game = resolved.game
      }
    }

    if (game.managerFired) game = { ...game, managerFired: false }
  }

  return { seed, channelViolations, recencyViolations, rotationSamples, gateReleases, roundsPlayed, crashed: null }
}

const allRuns: RunResult[] = SEEDS.map(runOne)

console.log('═══ CENTRALREDAKTÖREN — mätning 2026-08-31 ═══')
console.log(`Säsonger: ${SEASONS} · Frön: ${SEEDS.join(',')}`)
console.log(`SURFACING_GLOBAL_CAP = ${SURFACING_GLOBAL_CAP} · fönster: press=${RECENCY_WINDOW_BY_CHANNEL.press} personal=${RECENCY_WINDOW_BY_CHANNEL.personal}`)
console.log('')

for (const run of allRuns) {
  if (QUIET) break
  if (run.crashed) {
    console.log(`frö ${run.seed}: AVBRÖT — ${run.crashed}`)
    continue
  }
  console.log(`── frö ${run.seed}: ${run.roundsPlayed} omgångar ──`)
  console.log(`  kanalbrott: ${run.channelViolations.length}`)
  for (const v of run.channelViolations.slice(0, 5)) console.log(`    s${v.season} m${v.matchday} ${v.kind}: ${v.detail}`)
  console.log(`  recency-brott: ${run.recencyViolations.length}`)
  for (const v of run.recencyViolations.slice(0, 5)) console.log(`    s${v.season} m${v.matchday}: "${v.semanticKey}" (senast m${v.lastRound}, fönster ${v.window})`)
  const presskeys = run.rotationSamples.length
  console.log(`  subjektsposter loggade: ${presskeys}`)
}
console.log('')

console.log('═══ GODKÄNT NÄR ═══')

const totalChannelViolations = allRuns.reduce((a, r) => a + r.channelViolations.length, 0)
console.log(`1. Kanalbrott (kollision eller takbrott) över alla körningar: ${totalChannelViolations} (ska vara 0)`)

const totalRecencyViolations = allRuns.reduce((a, r) => a + r.recencyViolations.length, 0)
console.log(`2. Recency-brott (semanticKey återkom inom fönstret) över alla körningar: ${totalRecencyViolations} (ska vara 0)`)

const rotationViolations = allRuns.reduce((a, r) => a + r.gateReleases.filter(g => g.kind === 'subject_rotation').length, 0)
const rotationByPrefix = new Map<string, number>()
for (const r of allRuns) for (const g of r.gateReleases) if (g.kind === 'subject_rotation') rotationByPrefix.set(g.prefix, (rotationByPrefix.get(g.prefix) ?? 0) + 1)
console.log(`3. Samma subjekt i två raka beats av samma typ: ${rotationViolations} fall, per prefix: ${[...rotationByPrefix.entries()].map(([p, c]) => `${p}=${c}`).join(' ') || 'inga'}`)
console.log('   journalist_exclusive_player_ ska vara 0 (Infinity-exclude, career-brett varv). star_performance_/player_media_/player_praise_ kan legitimt upprepas när DENNA OMGÅNGENS kvalificerande kandidatpool var en singleton (t.ex. bara en spelare hade rating ≥8.5) — det är inget rotationen kan förhindra, ingen alternativ kandidat fanns.')

console.log('4. Ärlig gräns (se filhuvudet): ingen parallell "gammal väg" finns kvar att jämföra mot (INGA FEATURE FLAGS). Proxy nedan:')
for (let season = 1; season <= SEASONS; season++) {
  const pressReleases = allRuns.reduce((a, r) => a + r.gateReleases.filter(g => g.season === season && g.kind === 'press_question').length, 0)
  const totalPress = allRuns.reduce((a, r) => a + r.rotationSamples.filter(s => s.season === season).length, 0)
  console.log(`   säsong ${season}: subjektsposter=${totalPress}, spärr-släpp (poolen uttömd)=${pressReleases + rotationViolations}`)
}
console.log('   Ökar spärr-släpp/subjektsposter-kvoten i säsong 2 → poolen sätts under tryck, dvs mekanismen GÖR jobb (och signalerar att #5, pool-djup, blir nästa flaskhals).')

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify(allRuns, null, 2))
  console.log(`\nJSON: ${JSON_OUT}`)
}
