/**
 * C2 — parade 22-omgångssäsonger med balanserad respektive staplad taktik.
 *
 * Till skillnad från c2-position-tactic-measurement går denna genom den
 * riktiga rundprocessorn. Därmed följer kondition, återhämtning, rotation,
 * avstängningar och 5-2-3:s extra omgångskostnad med mellan matcherna.
 *
 * Kör lokalt:
 *   npm run analyze:c2-season-tactics -- --seeds=20
 * Acceptanskörning efter att harnesset är granskat:
 *   npm run analyze:c2-season-tactics -- --seeds=10000 --json
 */

import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { setLineup } from '../src/application/useCases/setLineup'
import { FORMATIONS, autoAssignFormation } from '../src/domain/entities/Formation'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import { FixtureStatus } from '../src/domain/enums'
import { createNewGame } from '../src/application/useCases/createNewGame'
import { isPlayerInMatchSquad } from '../src/domain/services/matchSquadService'
import { computeContractMinSalary, computeLeaguePositionAverages } from '../src/domain/services/economyService'
import { getContractSalaryRange } from '../src/domain/services/contractNegotiationService'
import { academyActions } from '../src/presentation/store/actions/academyActions'
import { matchActions } from '../src/presentation/store/actions/matchActions'
import { transferActions } from '../src/presentation/store/actions/transferActions'
import { autoResolvePendingEvents, autoResolvePendingScreen } from './stress/fixtures'
import { c2Formation, c2Tactic, type C2TacticProfileId } from './c2/tacticProfiles'

interface Config {
  seeds: number
  seedStart: number
  clubId: string
  json: boolean
}

interface SeasonResult {
  seed: number
  profile: C2TacticProfileId
  completed: boolean
  fired: boolean
  error: string | null
  leagueMatches: number
  postponedLeagueMatches: number
  wins: number
  draws: number
  losses: number
  points: number
  goalsFor: number
  goalsAgainst: number
  finalPosition: number | null
  meanPreMatchStarterFitness: number
  finalSquadFitness: number
  uniqueStarters: number
  startsBelow40Fitness: number
  emergencyPromotions: number
  emergencySignings: number
  walkovers: number
}

const PROFILES: readonly C2TacticProfileId[] = ['balanced', 'stacked']
const DEFAULT_CLUB_ID = 'club_malilla'
const LEAGUE_MATCHES = 22

function positiveInteger(args: string[], name: string, fallback: number): number {
  const prefix = `--${name}=`
  const raw = args.find(arg => arg.startsWith(prefix))?.slice(prefix.length)
  if (raw === undefined) return fallback
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${prefix}<heltal> måste vara positivt`)
  return value
}

function parseConfig(args: string[]): Config {
  const knownFlags = new Set(['--json'])
  const knownPrefixes = ['--seeds=', '--seed-start=', '--club=']
  const unknown = args.find(arg => !knownFlags.has(arg) && !knownPrefixes.some(prefix => arg.startsWith(prefix)))
  if (unknown) throw new Error(`Okänt val: ${unknown}`)
  return {
    seeds: positiveInteger(args, 'seeds', 20),
    seedStart: positiveInteger(args, 'seed-start', 70_000),
    clubId: args.find(arg => arg.startsWith('--club='))?.slice('--club='.length) || DEFAULT_CLUB_ID,
    json: args.includes('--json'),
  }
}

function withProfile(game: SaveGame, profile: C2TacticProfileId): SaveGame {
  const tactic = c2Tactic(profile)
  const clubs = game.clubs.map(club => club.id === game.managedClubId
    ? { ...club, activeTactic: tactic }
    : club)
  return { ...game, clubs }
}

function selectFormationLineup(game: SaveGame, profile: C2TacticProfileId): SaveGame {
  const club = game.clubs.find(candidate => candidate.id === game.managedClubId)
  if (!club) throw new Error(`Hanterad klubb saknas: ${game.managedClubId}`)
  const available = game.players
    .filter(player => isPlayerInMatchSquad(player, club))
    .filter(player => !player.isInjured && player.suspensionGamesRemaining === 0 && (player.restGamesRemaining ?? 0) === 0)
    .sort((left, right) => right.currentAbility - left.currentAbility || left.id.localeCompare(right.id))
  if (available.length < 11) throw new Error(`Nödtruppspolicyn lämnade bara ${available.length} tillgängliga spelare`)

  const formation = c2Formation(profile)
  const lineupSlots = autoAssignFormation(FORMATIONS[formation], available)
  const startingPlayerIds = Object.values(lineupSlots).filter((id): id is string => id !== null)
  if (startingPlayerIds.length !== 11 || new Set(startingPlayerIds).size !== 11) {
    throw new Error(`Uppställningen gav ${startingPlayerIds.length} start-id:n (${new Set(startingPlayerIds).size} unika)`)
  }
  const starters = new Set(startingPlayerIds)
  const benchPlayerIds = available.filter(player => !starters.has(player.id)).slice(0, 5).map(player => player.id)
  const tactic = { ...c2Tactic(profile), lineupSlots }
  const profiledGame = {
    ...game,
    clubs: game.clubs.map(candidate => candidate.id === club.id
      ? { ...candidate, activeTactic: tactic }
      : candidate),
  }
  const selected = setLineup({
    game: profiledGame,
    clubId: club.id,
    startingPlayerIds,
    benchPlayerIds,
    autoSelected: true,
  })
  if (!selected.success) throw new Error(selected.error)
  return selected.game
}

function storeAdapter(startGame: SaveGame) {
  let current: SaveGame | null = startGame
  return {
    get: () => ({ game: current }),
    set: (partial: Partial<{ game: SaveGame | null }>) => {
      if (partial.game !== undefined) current = partial.game
    },
    game: () => current ?? startGame,
  }
}

function availablePlayers(game: SaveGame): number {
  const club = game.clubs.find(candidate => candidate.id === game.managedClubId)
  if (!club) return 0
  return game.players.filter(player =>
    isPlayerInMatchSquad(player, club)
    && !player.isInjured
    && player.suspensionGamesRemaining === 0
    && (player.restGamesRemaining ?? 0) === 0,
  ).length
}

/**
 * Samma tre lager som NodtruppScene: akademi, fri agent, walkover. Alla
 * mutationer går genom skärmens riktiga actions; harnesset duplicerar inte
 * deras kontrakts-, ledger- eller tabellogik.
 */
function resolveEmergencySquad(game: SaveGame): {
  game: SaveGame
  promotions: number
  signings: number
  walkover: boolean
} {
  let current = game
  let promotions = 0
  let signings = 0

  while (availablePlayers(current) < 11) {
    const youth = [...(current.youthTeam?.players ?? [])]
      .sort((left, right) => right.currentAbility - left.currentAbility || left.id.localeCompare(right.id))[0]
    if (!youth) break
    const store = storeAdapter(current)
    const result = academyActions(store.get, store.set).promoteYouthPlayer(youth.id)
    if (!result.success) throw new Error(`Akademiuppflyttning misslyckades: ${result.error}`)
    current = store.game()
    promotions++
  }

  while (availablePlayers(current) < 11) {
    const agent = [...(current.transferState?.freeAgents ?? [])]
      .filter(player => !player.isInjured && player.suspensionGamesRemaining === 0)
      .sort((left, right) => right.currentAbility - left.currentAbility || left.id.localeCompare(right.id))[0]
    const club = current.clubs.find(candidate => candidate.id === current.managedClubId)
    if (!agent || !club) break
    const range = getContractSalaryRange(computeContractMinSalary(agent, club, computeLeaguePositionAverages(current)))
    const offeredSalary = Math.ceil((range.max * 1.15) / 1000) * 1000
    const store = storeAdapter(current)
    const result = transferActions(store.get, store.set).signFreeAgent(agent.id, offeredSalary, 3)
    if (!result.success) throw new Error(`Nödvärvning misslyckades: ${result.error}`)
    current = store.game()
    signings++
  }

  if (availablePlayers(current) >= 11) return { game: current, promotions, signings, walkover: false }

  const fixture = current.fixtures
    .filter(candidate => candidate.status === FixtureStatus.Scheduled)
    .filter(candidate => candidate.homeClubId === current.managedClubId || candidate.awayClubId === current.managedClubId)
    .sort((left, right) => left.matchday - right.matchday)[0]
  if (!fixture) throw new Error('Nödtrupp utan kommande fixtur att lämna walkover i')
  const store = storeAdapter(current)
  matchActions(store.get, store.set).concedeWalkover(fixture.id)
  return { game: store.game(), promotions, signings, walkover: true }
}

function managedLeagueFixtures(game: SaveGame) {
  return game.fixtures.filter(fixture =>
    !fixture.isCup
    && (fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId),
  )
}

function resolvedManagedLeagueFixtures(game: SaveGame) {
  return managedLeagueFixtures(game).filter(fixture =>
    fixture.status === FixtureStatus.Completed || fixture.status === FixtureStatus.Postponed,
  )
}

function resultFromFixture(game: SaveGame, fixtureId: string): { win: number; draw: number; loss: number; gf: number; ga: number } {
  const fixture = game.fixtures.find(candidate => candidate.id === fixtureId)
  if (!fixture) throw new Error(`Nyss spelad fixtur saknas: ${fixtureId}`)
  const home = fixture.homeClubId === game.managedClubId
  const gf = home ? fixture.homeScore : fixture.awayScore
  const ga = home ? fixture.awayScore : fixture.homeScore
  return { win: gf > ga ? 1 : 0, draw: gf === ga ? 1 : 0, loss: gf < ga ? 1 : 0, gf, ga }
}

function average(values: number[]): number {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

function runSeason(seed: number, clubId: string, profile: C2TacticProfileId): SeasonResult {
  let game = withProfile(createNewGame({ managerName: `C2-${profile}-${seed}`, clubId, seed }), profile)
  game = { ...game, pendingScreen: null }
  const completedIds = new Set(
    managedLeagueFixtures(game).filter(fixture => fixture.status === FixtureStatus.Completed).map(fixture => fixture.id),
  )
  const preMatchFitness: number[] = []
  const uniqueStarters = new Set<string>()
  let startsBelow40Fitness = 0
  let emergencyPromotions = 0
  let emergencySignings = 0
  let walkovers = 0
  let wins = 0
  let draws = 0
  let losses = 0
  let goalsFor = 0
  let goalsAgainst = 0
  let guard = 0
  let stepSeed = seed * 1000

  try {
    while (resolvedManagedLeagueFixtures(game).length < LEAGUE_MATCHES && !game.managerFired) {
      if (++guard > 300) throw new Error('Rundgrinden (300) utlöstes före 22 ligamatcher')
      game = autoResolvePendingEvents(game, () => 0.5)
      const resolved = autoResolvePendingScreen(game)
      if (resolved.unresolvable) throw new Error(`Ohanterbar mellanskärm: ${resolved.screenType}`)
      const emergency = resolveEmergencySquad(resolved.game)
      game = emergency.game
      emergencyPromotions += emergency.promotions
      emergencySignings += emergency.signings
      if (emergency.walkover) walkovers++

      // En walkover slutför fixturen genom samma action som UI:t. Samla
      // utfallet direkt; nästa varv låter rundprocessorn fortsätta kalendern.
      for (const fixture of managedLeagueFixtures(game)) {
        if (fixture.status !== FixtureStatus.Completed || completedIds.has(fixture.id)) continue
        completedIds.add(fixture.id)
        const outcome = resultFromFixture(game, fixture.id)
        wins += outcome.win
        draws += outcome.draw
        losses += outcome.loss
        goalsFor += outcome.gf
        goalsAgainst += outcome.ga
      }
      if (emergency.walkover) continue

      game = selectFormationLineup(game, profile)

      const selectedIds = game.managedClubPendingLineup?.startingPlayerIds ?? []
      const selectedPlayers = selectedIds.flatMap(id => {
        const player = game.players.find(candidate => candidate.id === id)
        return player ? [player] : []
      })
      preMatchFitness.push(average(selectedPlayers.map(player => player.fitness)))
      for (const player of selectedPlayers) {
        uniqueStarters.add(player.id)
        if (player.fitness < 40) startsBelow40Fitness++
      }

      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game
      for (const fixture of managedLeagueFixtures(game)) {
        if (fixture.status !== FixtureStatus.Completed || completedIds.has(fixture.id)) continue
        completedIds.add(fixture.id)
        const outcome = resultFromFixture(game, fixture.id)
        wins += outcome.win
        draws += outcome.draw
        losses += outcome.loss
        goalsFor += outcome.gf
        goalsAgainst += outcome.ga
      }
      if (result.seasonEnded && resolvedManagedLeagueFixtures(game).length < LEAGUE_MATCHES) {
        throw new Error(`Säsongen slutade efter ${resolvedManagedLeagueFixtures(game).length} avgjorda ligaomgångar`)
      }
    }

    const standing = game.standings.find(row => row.clubId === game.managedClubId)
    const squad = game.players.filter(player => player.clubId === game.managedClubId)
    const postponedLeagueMatches = managedLeagueFixtures(game).filter(fixture => fixture.status === FixtureStatus.Postponed).length
    return {
      seed,
      profile,
      completed: resolvedManagedLeagueFixtures(game).length === LEAGUE_MATCHES,
      fired: Boolean(game.managerFired),
      error: null,
      leagueMatches: completedIds.size,
      postponedLeagueMatches,
      wins,
      draws,
      losses,
      points: wins * 2 + draws,
      goalsFor,
      goalsAgainst,
      finalPosition: standing?.position ?? null,
      meanPreMatchStarterFitness: average(preMatchFitness),
      finalSquadFitness: average(squad.map(player => player.fitness)),
      uniqueStarters: uniqueStarters.size,
      startsBelow40Fitness,
      emergencyPromotions,
      emergencySignings,
      walkovers,
    }
  } catch (error) {
    return {
      seed,
      profile,
      completed: false,
      fired: Boolean(game.managerFired),
      error: error instanceof Error ? error.message : String(error),
      leagueMatches: completedIds.size,
      postponedLeagueMatches: managedLeagueFixtures(game).filter(fixture => fixture.status === FixtureStatus.Postponed).length,
      wins,
      draws,
      losses,
      points: wins * 2 + draws,
      goalsFor,
      goalsAgainst,
      finalPosition: null,
      meanPreMatchStarterFitness: average(preMatchFitness),
      finalSquadFitness: 0,
      uniqueStarters: uniqueStarters.size,
      startsBelow40Fitness,
      emergencyPromotions,
      emergencySignings,
      walkovers,
    }
  }
}

function round(value: number, digits = 2): number {
  const scale = 10 ** digits
  return Math.round(value * scale) / scale
}

function summarize(results: SeasonResult[]) {
  const completed = results.filter(result => result.completed)
  return {
    requested: results.length,
    completed: completed.length,
    fired: results.filter(result => result.fired).length,
    errors: results.filter(result => result.error).map(result => ({ seed: result.seed, error: result.error })),
    meanPoints: round(average(completed.map(result => result.points))),
    meanLeagueMatchesPlayed: round(average(completed.map(result => result.leagueMatches))),
    meanPostponedLeagueMatches: round(average(completed.map(result => result.postponedLeagueMatches))),
    meanGoalDifference: round(average(completed.map(result => result.goalsFor - result.goalsAgainst))),
    meanPosition: round(average(completed.flatMap(result => result.finalPosition === null ? [] : [result.finalPosition]))),
    meanPreMatchStarterFitness: round(average(completed.map(result => result.meanPreMatchStarterFitness))),
    meanFinalSquadFitness: round(average(completed.map(result => result.finalSquadFitness))),
    meanUniqueStarters: round(average(completed.map(result => result.uniqueStarters))),
    meanStartsBelow40Fitness: round(average(completed.map(result => result.startsBelow40Fitness))),
    meanEmergencyPromotions: round(average(completed.map(result => result.emergencyPromotions))),
    meanEmergencySignings: round(average(completed.map(result => result.emergencySignings))),
    meanWalkovers: round(average(completed.map(result => result.walkovers))),
  }
}

const config = parseConfig(process.argv.slice(2))
const results: SeasonResult[] = []
for (let index = 0; index < config.seeds; index++) {
  const seed = config.seedStart + index
  for (const profile of PROFILES) results.push(runSeason(seed, config.clubId, profile))
  if (!config.json && config.seeds >= 20 && (index + 1) % Math.max(1, Math.floor(config.seeds / 10)) === 0) {
    console.error(`${index + 1}/${config.seeds} parade säsonger`)
  }
}

const byProfile = Object.fromEntries(PROFILES.map(profile => [
  profile,
  summarize(results.filter(result => result.profile === profile)),
]))
const paired = Array.from({ length: config.seeds }, (_, index) => config.seedStart + index).flatMap(seed => {
  const balanced = results.find(result => result.seed === seed && result.profile === 'balanced')
  const stacked = results.find(result => result.seed === seed && result.profile === 'stacked')
  return balanced?.completed && stacked?.completed ? [{ balanced, stacked }] : []
})
const comparison = {
  validPairs: paired.length,
  stackedHigherPoints: paired.filter(pair => pair.stacked.points > pair.balanced.points).length,
  equalPoints: paired.filter(pair => pair.stacked.points === pair.balanced.points).length,
  stackedLowerPoints: paired.filter(pair => pair.stacked.points < pair.balanced.points).length,
  meanPointDeltaStackedMinusBalanced: round(average(paired.map(pair => pair.stacked.points - pair.balanced.points))),
}
const output = { schemaVersion: 1, config, byProfile, comparison }

if (config.json) {
  console.log(JSON.stringify(output, null, 2))
} else {
  console.log(`\nC2 säsongsmätning — ${config.clubId}, ${config.seeds} parade seeds × 22 ligamatcher`)
  for (const profile of PROFILES) {
    const summary = byProfile[profile]
    console.log(
      `${profile.padEnd(8)} ${summary.completed}/${summary.requested} klara · `
      + `${summary.meanPoints} p · spelade/inställda ${summary.meanLeagueMatchesPlayed}/${summary.meanPostponedLeagueMatches} · `
      + `målskillnad ${summary.meanGoalDifference} · plats ${summary.meanPosition} · `
      + `startfitness ${summary.meanPreMatchStarterFitness} · slutfitness ${summary.meanFinalSquadFitness} · `
      + `<40-starter ${summary.meanStartsBelow40Fitness} · `
      + `nöduppflyttningar ${summary.meanEmergencyPromotions} · walkover ${summary.meanWalkovers}`,
    )
    for (const error of summary.errors.slice(0, 3)) console.log(`  FEL seed ${error.seed}: ${error.error}`)
  }
  console.log(
    `Par: staplad bättre/lika/sämre ${comparison.stackedHigherPoints}/${comparison.equalPoints}/${comparison.stackedLowerPoints}; `
    + `medeldelta ${comparison.meanPointDeltaStackedMinusBalanced} p`,
  )
}

if (results.some(result => !result.completed || result.error)) process.exitCode = 1
