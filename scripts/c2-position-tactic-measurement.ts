/**
 * C2 — positionspassning kontra offensiv taktisk stapling.
 *
 * Kör samma lag, motstånd, väder och seed i fyra profiler:
 *   balanserad/rättplacerad, balanserad/felplacerad,
 *   offensivt staplad/rättplacerad, offensivt staplad/felplacerad.
 *
 * Standardkörningen använder 10 000 parade seeds fördelade över fyra
 * motståndsnivåer och två väderlägen. Inga produktvärden ändras här —
 * skriptet gör C2:s öppna kalibreringsfråga reproducerbar.
 *
 * Kör med:
 *   npm run analyze:c2-position-tactics
 *   npm run analyze:c2-position-tactics -- --seeds=200 --json
 */

import { FORMATIONS, autoAssignFormation, type FormationType } from '../src/domain/entities/Formation'
import type { Fixture, TeamSelection } from '../src/domain/entities/Fixture'
import type { Player } from '../src/domain/entities/Player'
import type { Tactic } from '../src/domain/entities/Club'
import type { Weather } from '../src/domain/entities/Weather'
import {
  CornerStrategy,
  FixtureStatus,
  IceQuality,
  MatchEventType,
  PenaltyKillStyle,
  PlayerArchetype,
  PlayerPosition,
  TacticAttackingFocus,
  TacticMentality,
  TacticPassingRisk,
  TacticTempo,
  TacticWidth,
  WeatherCondition,
} from '../src/domain/enums'
import { simulateMatch } from '../src/domain/services/matchEngine'
import { evaluateSquad } from '../src/domain/services/squadEvaluator'
import { getTacticModifiers } from '../src/domain/services/tacticModifiers'
import { getPositionFit } from '../src/domain/utils/positionFit'

type ProfileId = 'balanced-correct' | 'balanced-misplaced' | 'stacked-correct' | 'stacked-misplaced'

interface Profile {
  id: ProfileId
  label: string
  formation: FormationType
  stacked: boolean
  misplaced: boolean
}

interface Aggregate {
  matches: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  lateGoalsAgainst: number
  suspensions: number
  evaluationSamples: number
  offenseScore: number
  defenseScore: number
  cornerScore: number
  goalkeeperScore: number
  averageFieldFit: number
}

const PROFILES: readonly Profile[] = [
  { id: 'balanced-correct', label: 'Balanserad · rättplacerad', formation: '532_tvatoppar', stacked: false, misplaced: false },
  { id: 'balanced-misplaced', label: 'Balanserad · felplacerad', formation: '532_tvatoppar', stacked: false, misplaced: true },
  { id: 'stacked-correct', label: 'Staplad · rättplacerad', formation: '523_hog', stacked: true, misplaced: false },
  { id: 'stacked-misplaced', label: 'Staplad · felplacerad', formation: '523_hog', stacked: true, misplaced: true },
]

const OPPONENT_DELTAS = [-10, -5, 0, 10] as const
const WEATHER_MODES = ['klart', 'kraftigt-snofall'] as const
const HOME_CA = 60

function readPositiveInteger(name: string, fallback: number): number {
  const prefix = `--${name}=`
  const raw = process.argv.find(arg => arg.startsWith(prefix))?.slice(prefix.length)
  if (raw === undefined) return fallback
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${prefix}<heltal> måste vara ett positivt heltal`)
  }
  return value
}

const seedCount = readPositiveInteger('seeds', 10_000)
const seedStart = readPositiveInteger('seed-start', 1)
const json = process.argv.includes('--json')

let playerSequence = 0

function makePlayer(clubId: string, position: PlayerPosition, ca: number): Player {
  const id = `${clubId}-${++playerSequence}`
  const isGoalkeeper = position === PlayerPosition.Goalkeeper
  const attributes = {
    skating: ca,
    acceleration: ca,
    stamina: ca,
    ballControl: ca,
    passing: ca,
    shooting: ca,
    dribbling: ca,
    vision: ca,
    decisions: ca,
    workRate: ca,
    positioning: ca,
    defending: ca,
    cornerSkill: ca,
    goalkeeping: isGoalkeeper ? Math.min(100, ca + 15) : 20,
    cornerRecovery: ca,
  }

  return {
    id,
    firstName: 'C2',
    lastName: id,
    age: 26,
    nationality: 'SWE',
    clubId,
    isHomegrown: false,
    position,
    archetype: isGoalkeeper ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 0,
    contractUntilSeason: 2,
    marketValue: 0,
    morale: 70,
    form: 70,
    fitness: 85,
    sharpness: 75,
    seasonForm: 70,
    isFullTimePro: false,
    currentAbility: ca,
    potentialAbility: ca,
    developmentRate: 50,
    injuryProneness: 50,
    discipline: 70,
    attributes,
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    isCharacterPlayer: false,
    seasonStats: {
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      cornerGoals: 0,
      penaltyGoals: 0,
      yellowCards: 0,
      redCards: 0,
      suspensions: 0,
      averageRating: 0,
      minutesPlayed: 0,
    },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
  }
}

function makeSquad(clubId: string, ca: number): Player[] {
  const counts: ReadonlyArray<readonly [PlayerPosition, number]> = [
    [PlayerPosition.Goalkeeper, 2],
    [PlayerPosition.Defender, 4],
    [PlayerPosition.Half, 3],
    [PlayerPosition.Midfielder, 4],
    [PlayerPosition.Forward, 4],
  ]
  return counts.flatMap(([position, count]) =>
    Array.from({ length: count }, () => makePlayer(clubId, position, ca)),
  )
}

function tacticFor(profile: Profile): Tactic {
  return profile.stacked
    ? {
        mentality: TacticMentality.Offensive,
        tempo: TacticTempo.High,
        passingRisk: TacticPassingRisk.Direct,
        // Exakt paket från speltestet/C2-domen. Smalt är inte maxvärdet i
        // motorn, men mätningen ska reproducera den rapporterade taktiken —
        // inte konstruera en ny, starkare profil.
        width: TacticWidth.Narrow,
        attackingFocus: TacticAttackingFocus.Wings,
        cornerStrategy: CornerStrategy.Aggressive,
        penaltyKillStyle: PenaltyKillStyle.Aggressive,
        formation: profile.formation,
      }
    : {
        mentality: TacticMentality.Balanced,
        tempo: TacticTempo.Normal,
        passingRisk: TacticPassingRisk.Mixed,
        width: TacticWidth.Normal,
        attackingFocus: TacticAttackingFocus.Mixed,
        cornerStrategy: CornerStrategy.Standard,
        penaltyKillStyle: PenaltyKillStyle.Active,
        formation: profile.formation,
      }
}

function correctLineupSlots(formation: FormationType, squad: Player[]): Record<string, string | null> {
  return autoAssignFormation(FORMATIONS[formation], squad)
}

/**
 * Behåller exakt samma startspelare men placerar varje utespelare i den
 * återstående slot där positionspassningen är lägst. Målvakten lämnas rätt
 * för att testet inte ska förvandlas till ett dolt "utan målvakt"-test.
 */
function misplacedLineupSlots(
  formation: FormationType,
  correctSlots: Record<string, string | null>,
  squad: Player[],
): Record<string, string | null> {
  const template = FORMATIONS[formation]
  const playerById = new Map(squad.map(player => [player.id, player]))
  const assigned: Record<string, string | null> = {}
  const goalkeeperSlot = template.slots.find(slot => slot.position === PlayerPosition.Goalkeeper)
  const goalkeeperId = goalkeeperSlot ? correctSlots[goalkeeperSlot.id] : null
  if (goalkeeperSlot) assigned[goalkeeperSlot.id] = goalkeeperId ?? null

  const remainingPlayers = Object.values(correctSlots)
    .filter((id): id is string => id !== null && id !== goalkeeperId)
    .map(id => playerById.get(id))
    .filter((player): player is Player => player !== undefined)

  for (const slot of template.slots.filter(candidate => candidate.id !== goalkeeperSlot?.id)) {
    remainingPlayers.sort((left, right) => {
      const fitDelta = getPositionFit(left.position, slot.position) - getPositionFit(right.position, slot.position)
      return fitDelta || left.id.localeCompare(right.id)
    })
    assigned[slot.id] = remainingPlayers.shift()?.id ?? null
  }
  return assigned
}

function makeSelection(profile: Profile, squad: Player[]): TeamSelection {
  const baseTactic = tacticFor(profile)
  const correctSlots = correctLineupSlots(profile.formation, squad)
  const lineupSlots = profile.misplaced
    ? misplacedLineupSlots(profile.formation, correctSlots, squad)
    : correctSlots
  const startingPlayerIds = Object.values(lineupSlots).filter((id): id is string => id !== null)
  const starterSet = new Set(startingPlayerIds)
  return {
    startingPlayerIds,
    benchPlayerIds: squad.filter(player => !starterSet.has(player.id)).slice(0, 5).map(player => player.id),
    tactic: { ...baseTactic, lineupSlots },
  }
}

function makeOpponentSelection(squad: Player[]): TeamSelection {
  return makeSelection(PROFILES[0], squad)
}

function weatherFor(mode: typeof WEATHER_MODES[number]): Weather {
  return mode === 'kraftigt-snofall'
    ? {
        temperature: -12,
        condition: WeatherCondition.HeavySnow,
        windStrength: 10,
        iceQuality: IceQuality.Poor,
        snowfall: true,
        region: 'C2',
      }
    : {
        temperature: -5,
        condition: WeatherCondition.Clear,
        windStrength: 0,
        iceQuality: IceQuality.Good,
        snowfall: false,
        region: 'C2',
      }
}

function averageFieldFit(selection: TeamSelection, squad: Player[]): number {
  const playerById = new Map(squad.map(player => [player.id, player]))
  const formation = selection.tactic.formation ?? '532_tvatoppar'
  const slots = FORMATIONS[formation].slots.filter(slot => slot.position !== PlayerPosition.Goalkeeper)
  const fits = slots.flatMap(slot => {
    const playerId = selection.tactic.lineupSlots?.[slot.id]
    const player = playerId ? playerById.get(playerId) : undefined
    return player ? [getPositionFit(player.position, slot.position)] : []
  })
  return fits.reduce((sum, fit) => sum + fit, 0) / fits.length
}

function emptyAggregate(): Aggregate {
  return {
    matches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    lateGoalsAgainst: 0,
    suspensions: 0,
    evaluationSamples: 0,
    offenseScore: 0,
    defenseScore: 0,
    cornerScore: 0,
    goalkeeperScore: 0,
    averageFieldFit: 0,
  }
}

function fixtureFor(seed: number, profile: Profile): Fixture {
  return {
    id: `c2-${seed}-${profile.id}`,
    leagueId: 'c2-measurement',
    season: 1,
    roundNumber: 1,
    matchday: 1,
    date: '2026-01-01',
    homeClubId: 'home',
    awayClubId: 'away',
    status: FixtureStatus.Scheduled,
    isCup: false,
    isKnockout: false,
    isNeutralVenue: true,
    homeScore: 0,
    awayScore: 0,
    events: [],
    attendance: 500,
  }
}

function contextKey(opponentDelta: number, weatherMode: typeof WEATHER_MODES[number]): string {
  return `motstand${opponentDelta >= 0 ? '+' : ''}${opponentDelta}/${weatherMode}`
}

const totals = new Map<ProfileId, Aggregate>(PROFILES.map(profile => [profile.id, emptyAggregate()]))
const contexts = new Map<string, Map<ProfileId, Aggregate>>()

for (let index = 0; index < seedCount; index++) {
  const seed = seedStart + index
  const opponentDelta = OPPONENT_DELTAS[index % OPPONENT_DELTAS.length]
  const weatherMode = WEATHER_MODES[Math.floor(index / OPPONENT_DELTAS.length) % WEATHER_MODES.length]
  const key = contextKey(opponentDelta, weatherMode)
  let context = contexts.get(key)
  if (!context) {
    context = new Map(PROFILES.map(profile => [profile.id, emptyAggregate()]))
    contexts.set(key, context)
  }

  for (const profile of PROFILES) {
    playerSequence = 0
    const homePlayers = makeSquad('home', HOME_CA)
    const awayPlayers = makeSquad('away', HOME_CA + opponentDelta)
    const homeLineup = makeSelection(profile, homePlayers)
    const awayLineup = makeOpponentSelection(awayPlayers)
    const starters = homeLineup.startingPlayerIds
      .map(id => homePlayers.find(player => player.id === id))
      .filter((player): player is Player => player !== undefined)
    const evaluation = evaluateSquad(starters, homeLineup.tactic)
    const result = simulateMatch({
      fixture: fixtureFor(seed, profile),
      homeLineup,
      awayLineup,
      homePlayers,
      awayPlayers,
      homeAdvantage: 0,
      seed,
      weather: weatherFor(weatherMode),
    }).fixture
    const aggregateTargets = [totals.get(profile.id), context.get(profile.id)]
    for (const aggregate of aggregateTargets) {
      if (!aggregate) throw new Error(`Intern mätmiss: ${profile.id}/${key}`)
      aggregate.matches++
      aggregate.goalsFor += result.homeScore
      aggregate.goalsAgainst += result.awayScore
      if (result.homeScore > result.awayScore) aggregate.wins++
      else if (result.homeScore === result.awayScore) aggregate.draws++
      else aggregate.losses++
      aggregate.lateGoalsAgainst += result.events.filter(
        event => event.type === MatchEventType.Goal && event.clubId === 'away' && event.minute >= 70,
      ).length
      aggregate.suspensions += result.events.filter(
        event => event.type === MatchEventType.Suspension && event.clubId === 'home',
      ).length
      aggregate.evaluationSamples++
      aggregate.offenseScore += evaluation.offenseScore
      aggregate.defenseScore += evaluation.defenseScore
      aggregate.cornerScore += evaluation.cornerScore
      aggregate.goalkeeperScore += evaluation.goalkeeperScore
      aggregate.averageFieldFit += averageFieldFit(homeLineup, homePlayers)
    }
  }
}

function rounded(value: number, digits = 3): number {
  const scale = 10 ** digits
  return Math.round(value * scale) / scale
}

function summarize(aggregate: Aggregate) {
  const n = aggregate.matches
  const e = aggregate.evaluationSamples
  return {
    matches: n,
    winRate: rounded(aggregate.wins / n),
    drawRate: rounded(aggregate.draws / n),
    lossRate: rounded(aggregate.losses / n),
    goalsForPerMatch: rounded(aggregate.goalsFor / n),
    goalsAgainstPerMatch: rounded(aggregate.goalsAgainst / n),
    lateGoalsAgainstPerMatch: rounded(aggregate.lateGoalsAgainst / n),
    suspensionsPerMatch: rounded(aggregate.suspensions / n),
    averageFieldFit: rounded(aggregate.averageFieldFit / e),
    squadEvaluation: {
      offense: rounded(aggregate.offenseScore / e, 1),
      defense: rounded(aggregate.defenseScore / e, 1),
      corner: rounded(aggregate.cornerScore / e, 1),
      goalkeeper: rounded(aggregate.goalkeeperScore / e, 1),
    },
  }
}

const output = {
  method: {
    pairedSeeds: seedCount,
    seedStart,
    simulatedMatches: seedCount * PROFILES.length,
    homeCA: HOME_CA,
    opponentDeltas: OPPONENT_DELTAS,
    weatherModes: WEATHER_MODES,
    profiles: Object.fromEntries(PROFILES.map(profile => [profile.id, {
      label: profile.label,
      formation: profile.formation,
      tacticModifiers: getTacticModifiers(tacticFor(profile)),
    }])),
  },
  totals: Object.fromEntries(PROFILES.map(profile => [profile.id, summarize(totals.get(profile.id)!)])),
  contexts: Object.fromEntries(
    [...contexts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([key, aggregates]) => [
      key,
      Object.fromEntries(PROFILES.map(profile => [profile.id, summarize(aggregates.get(profile.id)!)])),
    ]),
  ),
}

if (json) {
  console.log(JSON.stringify(output, null, 2))
} else {
  console.log(`C2 positionspassning × taktisk stapling — ${seedCount} parade seeds, ${seedCount * PROFILES.length} matcher`)
  for (const profile of PROFILES) {
    const summary = output.totals[profile.id]
    console.log(
      `${profile.label.padEnd(31)} fit ${summary.averageFieldFit.toFixed(3)} · `
      + `V/O/F ${(summary.winRate * 100).toFixed(1)}/${(summary.drawRate * 100).toFixed(1)}/${(summary.lossRate * 100).toFixed(1)} · `
      + `mål ${summary.goalsForPerMatch.toFixed(2)}–${summary.goalsAgainstPerMatch.toFixed(2)} · `
      + `sent insläppta ${summary.lateGoalsAgainstPerMatch.toFixed(2)} · utv ${summary.suspensionsPerMatch.toFixed(2)} · `
      + `eval A/F/H ${summary.squadEvaluation.offense}/${summary.squadEvaluation.defense}/${summary.squadEvaluation.corner}`,
    )
  }
  console.log('\nDetaljer per motståndsnivå och väder: använd --json.')
}
