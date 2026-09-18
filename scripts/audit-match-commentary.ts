/** Seedat, läsande stickprov av live-matchens kommentarsflöde. */
import { createHeadlessGame, autoSelectLineup } from './stress/fixtures'
import { simulateFirstHalf, simulateSecondHalf } from '../src/domain/services/matchCore'
import { FixtureStatus, MatchEventType, PlayerPosition } from '../src/domain/enums'
import type { MatchStep } from '../src/domain/services/matchUtils'
import type { TeamSelection } from '../src/domain/entities/Fixture'

const count = Math.max(1, Number(process.argv[2] ?? 100))
const game = createHeadlessGame(2)
const managedClub = game.clubs.find(club => club.id === game.managedClubId)!
const opponent = game.clubs.find(club => club.id !== game.managedClubId)!
const managedPlayers = game.players.filter(player => player.clubId === managedClub.id)
const opponentPlayers = game.players.filter(player => player.clubId === opponent.id)
const managedLineup = autoSelectLineup(game).managedClubPendingLineup!
const opponentAvailable = opponentPlayers.filter(player => !player.isInjured && player.suspensionGamesRemaining === 0)
const opponentStarters = [
  ...opponentAvailable.filter(player => player.position === PlayerPosition.Goalkeeper).slice(0, 1),
  ...opponentAvailable.filter(player => player.position !== PlayerPosition.Goalkeeper).slice(0, 10),
]
const opponentLineup: TeamSelection = {
  startingPlayerIds: opponentStarters.map(player => player.id),
  benchPlayerIds: opponentAvailable.filter(player => !opponentStarters.includes(player)).slice(0, 5).map(player => player.id),
  tactic: opponent.activeTactic,
}
const fixtureTemplate = game.fixtures[0]
if (!fixtureTemplate) throw new Error('Spelet saknar fixtur för kommentarsprovet')

const exactCounts = new Map<string, number>()
let rows = 0
let repeatedWithinSix = 0
let repeatedAdjacent = 0
let multipleMajorEvents = 0
let hiddenMajorEvents = 0
let nonMonotonicMinutes = 0
let unresolvedTokens = 0
let cornerClaimsShotWithoutStat = 0
let neutralClaimsShotWithoutStat = 0
let counterGoalsAfterOpposingCorner = 0
const multiExamples: string[] = []
const inMatchRepeatExamples: string[] = []
const truthExamples: string[] = []
const counterExamples: string[] = []
const major = new Set([MatchEventType.Goal, MatchEventType.Suspension, MatchEventType.Save, MatchEventType.Substitution])

for (let seed = 1; seed <= count; seed++) {
  const managedIsHome = seed % 2 === 0
  const fixture = {
    ...fixtureTemplate,
    id: `commentary-audit-${seed}`,
    homeClubId: managedIsHome ? managedClub.id : opponent.id,
    awayClubId: managedIsHome ? opponent.id : managedClub.id,
    status: FixtureStatus.Scheduled,
    attendance: 320,
  }
  const homeLineup = managedIsHome ? managedLineup : opponentLineup
  const awayLineup = managedIsHome ? opponentLineup : managedLineup
  const homePlayers = managedIsHome ? managedPlayers : opponentPlayers
  const awayPlayers = managedIsHome ? opponentPlayers : managedPlayers
  const input = {
    fixture, homeLineup, awayLineup, homePlayers, awayPlayers,
    homeClubName: managedIsHome ? managedClub.name : opponent.name,
    awayClubName: managedIsHome ? opponent.name : managedClub.name,
    managedIsHome, mode: 'full' as const, seed,
  }
  const first = [...simulateFirstHalf(input)]
  const half = first[first.length - 1]
  if (!half) throw new Error(`Tom första halvlek: seed ${seed}`)
  const second = [...simulateSecondHalf({
    ...input,
    initialHomeScore: half.homeScore, initialAwayScore: half.awayScore,
    initialShotsHome: half.shotsHome, initialShotsAway: half.shotsAway,
    initialOnTargetHome: half.onTargetHome, initialOnTargetAway: half.onTargetAway,
    initialCornersHome: half.cornersHome, initialCornersAway: half.cornersAway,
    initialHomeSuspensions: half.activeSuspensions.homeCount,
    initialAwaySuspensions: half.activeSuspensions.awayCount,
    initialHomeSuspensionTimers: half.activeSuspensions.homeTimers,
    initialAwaySuspensionTimers: half.activeSuspensions.awayTimers,
  })]
  const steps: MatchStep[] = [...first, ...second]
  const recent: string[] = []
  let previousMinute = -1
  let previousShots = 0
  for (const step of steps) {
    if (step.minute < previousMinute) nonMonotonicMinutes++
    previousMinute = step.minute
    const text = step.commentary.trim()
    if (text) {
      rows++
      exactCounts.set(text, (exactCounts.get(text) ?? 0) + 1)
      if (recent.at(-1) === text) repeatedAdjacent++
      if (recent.includes(text)) {
        repeatedWithinSix++
        if (inMatchRepeatExamples.length < 12) inMatchRepeatExamples.push(`${seed}/${step.minute}′ ${text}`)
      }
      recent.push(text)
      if (recent.length > 6) recent.shift()
      if (/\{[a-zA-Z][^}]*\}/.test(text)) unresolvedTokens++
    }
    const significant = step.events.filter(event => major.has(event.type))
    if (significant.length > 1) {
      multipleMajorEvents++
      hiddenMajorEvents += significant.length - 1
      if (multiExamples.length < 12) multiExamples.push(`${seed}/${step.minute}′ ${significant.map(event => event.type).join('+')}: ${text}`)
    }
    const shotDelta = step.shotsHome + step.shotsAway - previousShots
    previousShots = step.shotsHome + step.shotsAway
    const corner = step.events.find(event => event.type === MatchEventType.Corner)
    const goal = step.events.find(event => event.type === MatchEventType.Goal)
    if (corner && !goal && /skott|stolp|burgavel|avslut/i.test(text) && shotDelta === 0) {
      cornerClaimsShotWithoutStat++
      if (truthExamples.length < 12) truthExamples.push(`Hörna utan skott ${seed}/${step.minute}′ ${text}`)
    }
    if (!corner && !goal && !step.events.some(event => event.type === MatchEventType.Save) && /Friläge!|Halvchans|Skottet/i.test(text) && shotDelta === 0) {
      neutralClaimsShotWithoutStat++
      if (truthExamples.length < 12) truthExamples.push(`Skott utan statistik ${seed}/${step.minute}′ ${text}`)
    }
    if (corner && goal && corner.clubId !== goal.clubId) {
      counterGoalsAfterOpposingCorner++
      if (counterExamples.length < 12) counterExamples.push(`${seed}/${step.minute}′ hörna=${corner.clubId} mål=${goal.clubId}: ${text}`)
    }
  }
}

const repeats = [...exactCounts].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 20)
console.log(JSON.stringify({ matches: count, rows, unique: exactCounts.size,
  repeatedAdjacent, repeatedWithinSix, multipleMajorEvents, hiddenMajorEvents,
  nonMonotonicMinutes, unresolvedTokens, cornerClaimsShotWithoutStat,
  neutralClaimsShotWithoutStat, counterGoalsAfterOpposingCorner,
  repeats, multiExamples, inMatchRepeatExamples, truthExamples, counterExamples }, null, 2))
