/**
 * Spakkänslighetssvep (audit 2026-09-18, Fable/Cowork).
 *
 * En spak i taget mot en gemensam baslinje, parade seeds. Mäter per säsong:
 * tabellplacering, poäng, målskillnad, kassa, boardPatience, fanMood,
 * communityStanding, avsked, skador, snittkondition.
 *
 *   vite-node --config vite.headless.config.ts scripts/lever-sweep.ts \
 *     --config=baseline --seeds=0,1,2 --seasons=1 --out=sweep.jsonl
 *   --list  skriver ut alla konfignamn
 */
import { appendFileSync, readFileSync, existsSync } from 'node:fs'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { StandingRow } from '../src/domain/entities/Standing'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { FixtureStatus, PlayerPosition, TrainingType, TrainingIntensity,
  TacticMentality, TacticTempo, TacticPassingRisk, TacticWidth, TacticAttackingFocus,
  CornerStrategy, PenaltyKillStyle } from '../src/domain/enums'
import { setLineup } from '../src/application/useCases/setLineup'
import { applyContractDemandResolutions } from '../src/domain/services/contractDemandService'
import { resolveEvent } from '../src/domain/services/events/eventResolver'
import { createHeadlessGame, autoSelectLineup, autoResolvePendingScreen,
  autoResolvePendingEvents, autoBuildCheapestAffordableFacility } from './stress/fixtures'

type Policy = {
  tactic?: Partial<SaveGame['clubs'][number]['activeTactic']>
  training?: { type: TrainingType; intensity: TrainingIntensity }
  periodisation?: 'bygg' | 'hall' | 'toppa' | 'vila'
  budgetPriority?: 'squad' | 'balanced' | 'youth'
  facility?: 'cheapest' | 'none'
  contracts?: 'meetAll' | 'meetNone'
  events?: 'noOp' | 'first' | 'last' | 'ignore'
  lineup?: 'best' | 'rosterOrder' | 'weakest' | 'neverRotate'
  schedule?: 'a' | 'b'
}

const CONFIGS: Record<string, Policy> = {
  baseline: {},
  // taktik, sju axlar
  ment_def: { tactic: { mentality: TacticMentality.Defensive } },
  ment_off: { tactic: { mentality: TacticMentality.Offensive } },
  tempo_low: { tactic: { tempo: TacticTempo.Low } },
  tempo_high: { tactic: { tempo: TacticTempo.High } },
  pass_safe: { tactic: { passingRisk: TacticPassingRisk.Safe } },
  pass_direct: { tactic: { passingRisk: TacticPassingRisk.Direct } },
  width_narrow: { tactic: { width: TacticWidth.Narrow } },
  width_wide: { tactic: { width: TacticWidth.Wide } },
  focus_central: { tactic: { attackingFocus: TacticAttackingFocus.Central } },
  focus_wings: { tactic: { attackingFocus: TacticAttackingFocus.Wings } },
  corner_safe: { tactic: { cornerStrategy: CornerStrategy.Safe } },
  corner_aggr: { tactic: { cornerStrategy: CornerStrategy.Aggressive } },
  pk_passive: { tactic: { penaltyKillStyle: PenaltyKillStyle.Passive } },
  pk_aggr: { tactic: { penaltyKillStyle: PenaltyKillStyle.Aggressive } },
  // träning
  tr_light: { training: { type: TrainingType.Physical, intensity: TrainingIntensity.Light } },
  tr_extreme: { training: { type: TrainingType.Physical, intensity: TrainingIntensity.Extreme } },
  tr_recovery: { training: { type: TrainingType.Recovery, intensity: TrainingIntensity.Normal } },
  tr_shooting: { training: { type: TrainingType.Shooting, intensity: TrainingIntensity.Normal } },
  tr_defending: { training: { type: TrainingType.Defending, intensity: TrainingIntensity.Normal } },
  tr_matchprep: { training: { type: TrainingType.MatchPrep, intensity: TrainingIntensity.Normal } },
  tr_tactical: { training: { type: TrainingType.Tactical, intensity: TrainingIntensity.Normal } },
  // periodisering
  per_bygg: { periodisation: 'bygg' },
  per_hall: { periodisation: 'hall' },
  per_toppa: { periodisation: 'toppa' },
  per_vila: { periodisation: 'vila' },
  per_schema_a: { schedule: 'a' },
  per_schema_b: { schedule: 'b' },
  per_schema_a_light: { schedule: 'a', training: { type: TrainingType.Physical, intensity: TrainingIntensity.Light } },
  per_hall_light: { periodisation: 'hall', training: { type: TrainingType.Physical, intensity: TrainingIntensity.Light } },
  // budget
  bud_squad: { budgetPriority: 'squad' },
  bud_youth: { budgetPriority: 'youth' },
  // anläggning / kontrakt / event
  fac_none: { facility: 'none' },
  con_meetNone: { contracts: 'meetNone' },
  ev_first: { events: 'first' },
  ev_last: { events: 'last' },
  ev_ignore: { events: 'ignore' },
  // laguttagning — "spelar det roll att man spelar"
  lu_rosterOrder: { lineup: 'rosterOrder' },
  lu_weakest: { lineup: 'weakest' },
  lu_neverRotate: { lineup: 'neverRotate' },
}

function parseArgs() {
  const a = process.argv.slice(2)
  const get = (k: string) => a.find(x => x.startsWith(`--${k}=`))?.split('=')[1]
  return {
    list: a.includes('--list'),
    config: get('config') ?? 'baseline',
    seeds: (get('seeds') ?? '0').split(',').map(Number),
    seasons: Number(get('seasons') ?? 1),
    out: get('out') ?? 'sweep.jsonl',
    jobsfile: get('jobsfile'), donefile: get('donefile') ?? 'sweep/done.txt',
    budget: Number(get('budget') ?? 130000),
  }
}

function applyPolicyEachRound(game: SaveGame, p: Policy, firstLineup: string[] | null): SaveGame {
  let g = game
  if (p.tactic) {
    g = { ...g, clubs: g.clubs.map(c => c.id === g.managedClubId ? { ...c, activeTactic: { ...c.activeTactic, ...p.tactic } } : c) }
  }
  if (p.training) g = { ...g, managedClubTraining: p.training }
  if (p.periodisation && g.managedClubPeriodisation !== p.periodisation) {
    g = { ...g, managedClubPeriodisation: p.periodisation, managedClubPeriodisationSince: g.currentMatchday }
  }
  if (p.budgetPriority) g = { ...g, budgetPriority: p.budgetPriority }
  if (p.schedule) {
    const mine = g.fixtures.filter(f => !f.isCup && (f.homeClubId === g.managedClubId || f.awayClubId === g.managedClubId) && f.season === g.currentSeason)
    const leagueTotal = mine.filter(f => (f.roundNumber ?? 0) <= 22).length || 22
    const played = mine.filter(f => f.status === 'completed' && (f.roundNumber ?? 0) <= 22).length
    const next = played + 1 // nästa ligaomgång
    let mode: 'bygg' | 'hall' | 'toppa' | 'vila' = 'hall'
    if (next <= 8) mode = 'bygg'
    else if (next >= leagueTotal - 2 && next <= leagueTotal) mode = 'toppa'
    if (p.schedule === 'b') {
      const cb: any = g.cupBracket
      const out = !!cb && cb.matches.some((m: any) => m.winnerId && !m.isBye && (m.homeClubId === g.managedClubId || m.awayClubId === g.managedClubId) && m.winnerId !== g.managedClubId)
      const outRound = (g as any).__cupOutRound
      if (out && outRound === undefined) (g as any).__cupOutRound = g.currentMatchday
      if (outRound !== undefined && g.currentMatchday - outRound < 3 && mode === 'hall') mode = 'vila'
    }
    if (g.managedClubPeriodisation !== mode) g = { ...g, managedClubPeriodisation: mode, managedClubPeriodisationSince: g.currentMatchday }
  }
  return g
}

function pickLineup(game: SaveGame, mode: Policy['lineup'], sticky: { ids: string[] | null }): SaveGame {
  if (!mode || mode === 'best') return autoSelectLineup(game)
  const clubId = game.managedClubId
  const all = game.players.filter(p => p.clubId === clubId)
  let ordered = all
  if (mode === 'weakest') ordered = [...all].sort((a, b) => a.currentAbility - b.currentAbility)
  if (mode === 'rosterOrder') ordered = all // insättningsordning
  if (mode === 'neverRotate') {
    if (!sticky.ids) {
      const best = autoSelectLineup(game)
      sticky.ids = best.managedClubPendingLineup?.startingPlayerIds ?? null
      if (!sticky.ids) return best
    }
    const byId = new Map(all.map(p => [p.id, p]))
    const still = sticky.ids.filter(id => byId.has(id))
    ordered = [...still.map(id => byId.get(id)!), ...all.filter(p => !still.includes(p.id))]
  }
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
  // skadade/avstängda i uppställningen → tvinga (samma fallback som harnessen)
  const club = game.clubs.find(c => c.id === clubId)!
  return { ...game, managedClubPendingLineup: { startingPlayerIds: starters, benchPlayerIds: bench, tactic: club.activeTactic }, lineupConfirmedThisRound: true }
}

function resolveEvents(game: SaveGame, mode: Policy['events'], rand: () => number): SaveGame {
  if (mode === 'ignore') return game
  if (!mode || mode === 'noOp') return autoResolvePendingEvents(game, rand)
  let g = game
  for (const e of (game.pendingEvents ?? [])) {
    const ch = mode === 'first' ? e.choices[0] : e.choices[e.choices.length - 1]
    if (!ch) continue
    // skydda mot att sälja truppen sönder: transferbud alltid avslag (samma som harnessen)
    const id = e.type === 'transferBidReceived'
      ? (e.choices.find(c => c.effect.type === 'rejectTransfer') ?? ch).id
      : ch.id
    g = resolveEvent(g, e.id, id, rand, false)
  }
  return g
}

function resolveScreen(game: SaveGame, mode: Policy['contracts']) {
  if (game.pendingScreen === 'contract_demands' && mode === 'meetNone') {
    const demands = game.pendingContractDemands ?? []
    const none = Object.fromEntries(demands.map(d => [d.playerId, 'skipped' as const]))
    const players = applyContractDemandResolutions(game.players, demands, none)
    return { game: { ...game, players, pendingContractDemands: undefined, pendingScreen: null }, unresolvable: false }
  }
  return autoResolvePendingScreen(game)
}

function mulberry(seed: number) {
  return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

async function main() {
  const args = parseArgs()
  if (args.list) { console.log(Object.keys(CONFIGS).join('\n')); return }
  if (args.jobsfile) {
    const t0 = Date.now()
    while (Date.now() - t0 < args.budget) {
      const done = new Set(existsSync(args.donefile) ? readFileSync(args.donefile, 'utf8').split('\n').filter(Boolean) : [])
      const job = readFileSync(args.jobsfile, 'utf8').split('\n').filter(Boolean).find(l => !done.has(l))
      if (!job) { console.log('ALLDONE'); return }
      const [config, seedsStr, seasonsStr] = job.split(' ')
      await runJob(config, seedsStr.split(',').map(Number), Number(seasonsStr ?? 1), args.out)
      appendFileSync(args.donefile, job + '\n')
    }
    console.log('BUDGET')
    return
  }
  await runJob(args.config, args.seeds, args.seasons, args.out)
}

async function runJob(config: string, seeds: number[], seasons: number, out: string) {
  const policy = CONFIGS[config]
  if (!policy) throw new Error(`okänd config ${config}`)

  for (const seed of seeds) {
    let game = createHeadlessGame(seed)
    const sticky = { ids: null as string[] | null }
    const rand = mulberry(seed * 7919 + 17)
    for (let season = 1; season <= seasons; season++) {
      let stepSeed = seed * 100_000 + season * 1_000
      let lastStandings: StandingRow[] = []
      let injuries = 0
      let fitnessSum = 0, fitnessN = 0, moraleSum = 0, moraleN = 0
      let injuredSet = new Set<string>()
      let rounds = 0
      let done = false
      let crash: string | null = null
      let events = 0, eventsAnswered = 0
      const t0 = Date.now()
      while (!done) {
        game = applyPolicyEachRound(game, policy, null)
        game = pickLineup(game, policy.lineup, sticky)
        if (policy.facility !== 'none') game = autoBuildCheapestAffordableFacility(game)
        events += (game.pendingEvents ?? []).length
        const before = (game.pendingEvents ?? []).length
        game = resolveEvents(game, policy.events, rand)
        eventsAnswered += before - (game.pendingEvents ?? []).length
        try {
          const r = advanceToNextEvent(game, stepSeed++)
          game = r.game
          if (r.roundPlayed !== null) {
            rounds = r.roundPlayed
            if (game.standings?.length) lastStandings = game.standings
            const mine = game.players.filter(p => p.clubId === game.managedClubId)
            const nowInjured = new Set(mine.filter(p => p.isInjured).map(p => p.id))
            for (const id of nowInjured) if (!injuredSet.has(id)) injuries++
            injuredSet = nowInjured
            for (const p of mine) { fitnessSum += p.fitness; fitnessN++ }
            moraleSum += mine.reduce((a, p) => a + p.morale, 0); moraleN += mine.length
          }
          if (r.seasonEnded || game.managerFired) done = true
          const res = resolveScreen(game, policy.contracts)
          if (res.unresolvable) { crash = 'unresolvableScreen'; done = true }
          game = res.game
        } catch (e) {
          crash = e instanceof Error ? e.message.slice(0, 200) : String(e)
          done = true
        }
        if (rounds > 60) { crash = 'deadlock'; done = true }
      }
      const club = game.clubs.find(c => c.id === game.managedClubId)!
      const row = lastStandings.find(s => s.clubId === game.managedClubId)
      const rec = {
        config, seed, season, clubId: game.managedClubId,
        position: row?.position ?? null, points: row?.points ?? null, gd: row?.goalDifference ?? null,
        played: row?.played ?? null,
        finances: club.finances, reputation: club.reputation,
        boardPatience: game.boardPatience ?? null, fanMood: game.fanMood ?? null,
        communityStanding: game.communityStanding ?? null,
        fired: !!game.managerFired, firedReason: game.firedReason ?? null,
        injuries, avgFitness: fitnessN ? +(fitnessSum / fitnessN).toFixed(1) : null, avgMorale: moraleN ? +(moraleSum / moraleN).toFixed(1) : null,
        events, eventsAnswered, rounds, crash, ms: Date.now() - t0,
      }
      appendFileSync(out, JSON.stringify(rec) + '\n')
      console.log(`${config} seed=${seed} s${season} pos=${rec.position} pts=${rec.points} kassa=${Math.round(club.finances / 1000)}k bp=${rec.boardPatience} fired=${rec.fired} ${crash ?? ''} ${rec.ms}ms`)
      if (crash || game.managerFired) break
    }
  }
}
main().catch(e => { console.error(e); process.exit(1) })
