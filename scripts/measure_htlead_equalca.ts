/**
 * Lika CA (65 vs 65) — isolerar mekaniken från urvalseffekten.
 */
import { simulateFirstHalf, simulateSecondHalf } from '../src/domain/services/matchCore'
import { PlayerPosition, PlayerArchetype, FixtureStatus, MatchEventType } from '../src/domain/enums'
import type { Player } from '../src/domain/entities/Player'
import type { Fixture, TeamSelection } from '../src/domain/entities/Fixture'

let _pid = 0
function makePlayer(clubId: string, position: PlayerPosition, ca = 65): Player {
  const id = `p${++_pid}`
  const isGK = position === PlayerPosition.Goalkeeper
  return {
    id, firstName: 'X', lastName: `${id}`, age: 26, nationality: 'SWE',
    clubId, academyClubId: undefined, isHomegrown: false,
    position, archetype: isGK ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 0, contractUntilSeason: 2, marketValue: 0,
    morale: 70, form: 70, fitness: 85, sharpness: 75,
    isFullTimePro: false,
    currentAbility: ca, potentialAbility: ca,
    attributes: {
      skating: ca, acceleration: ca, stamina: ca, ballControl: ca,
      passing: ca, shooting: ca, dribbling: ca, vision: ca,
      decisions: ca, workRate: ca, positioning: ca, defending: ca,
      cornerSkill: ca, goalkeeping: isGK ? ca + 20 : 20,
    },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    isCharacterPlayer: false, trait: undefined,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
    careerMilestones: [],
  }
}
function makeSquad(clubId: string, ca = 65): Player[] {
  return [
    makePlayer(clubId, PlayerPosition.Goalkeeper, ca),
    makePlayer(clubId, PlayerPosition.Defender, ca),
    makePlayer(clubId, PlayerPosition.Defender, ca),
    makePlayer(clubId, PlayerPosition.Defender, ca),
    makePlayer(clubId, PlayerPosition.Half, ca),
    makePlayer(clubId, PlayerPosition.Half, ca),
    makePlayer(clubId, PlayerPosition.Half, ca),
    makePlayer(clubId, PlayerPosition.Forward, ca),
    makePlayer(clubId, PlayerPosition.Forward, ca),
    makePlayer(clubId, PlayerPosition.Forward, ca),
    makePlayer(clubId, PlayerPosition.Forward, ca),
    makePlayer(clubId, PlayerPosition.Goalkeeper, ca),
    makePlayer(clubId, PlayerPosition.Defender, ca),
    makePlayer(clubId, PlayerPosition.Half, ca),
    makePlayer(clubId, PlayerPosition.Forward, ca),
    makePlayer(clubId, PlayerPosition.Forward, ca),
  ]
}
const defaultTactic = {
  mentality: 'balanced' as const, tempo: 'normal' as const, press: 'medium' as const,
  width: 'normal' as const, attackingFocus: 'mixed' as const, cornerStrategy: 'standard' as const,
  passingRisk: 'safe' as const, penaltyKillStyle: 'active' as const,
}

const N = 2000
let total = 0, htLeadN = 0, htLeadWins = 0, htLeadDraws = 0, htLeadLoses = 0
let lead1N = 0, lead1Wins = 0, lead1Draws = 0, lead1Loses = 0
let lead2N = 0, lead2Wins = 0, lead2Draws = 0, lead2Loses = 0
let sh2GoalsL = 0, sh2GoalsT = 0, sh2ShotsL = 0, sh2ShotsT = 0, sh2N = 0

for (let i = 0; i < N; i++) {
  const homeId = `h${i}`, awayId = `a${i}`
  _pid = 0
  const homePlayers = makeSquad(homeId, 65)
  const awayPlayers = makeSquad(awayId, 65)
  const homeLineup: TeamSelection = {
    startingPlayerIds: homePlayers.slice(0, 11).map(p => p.id),
    benchPlayerIds: homePlayers.slice(11).map(p => p.id),
    tactic: defaultTactic,
  }
  const awayLineup: TeamSelection = {
    startingPlayerIds: awayPlayers.slice(0, 11).map(p => p.id),
    benchPlayerIds: awayPlayers.slice(11).map(p => p.id),
    tactic: defaultTactic,
  }
  const fixture: Fixture = {
    id: `f${i}`, homeClubId: homeId, awayClubId: awayId,
    season: 1, matchday: i + 1, roundNumber: i + 1,
    status: FixtureStatus.Scheduled, date: '2025-01-01',
    homeScore: 0, awayScore: 0, events: [], attendance: 500,
    isCup: false, isKnockout: false, isNeutralVenue: false,
  }
  const coreInput = {
    fixture, homeLineup, awayLineup, homePlayers, awayPlayers,
    homeAdvantage: 0.14, seed: i * 1337 + 999, mode: 'fast' as const,
  }

  let lastFH = { homeScore: 0, awayScore: 0, shotsHome: 0, shotsAway: 0, cornersHome: 0, cornersAway: 0, activeSuspensions: { homeCount: 0, awayCount: 0 } }
  for (const step of simulateFirstHalf(coreInput)) lastFH = step as typeof lastFH
  const htH = lastFH.homeScore, htA = lastFH.awayScore
  const shInput = {
    ...coreInput,
    initialHomeScore: htH, initialAwayScore: htA,
    initialShotsHome: lastFH.shotsHome, initialShotsAway: lastFH.shotsAway,
    initialCornersHome: lastFH.cornersHome, initialCornersAway: lastFH.cornersAway,
    initialHomeSuspensions: lastFH.activeSuspensions.homeCount,
    initialAwaySuspensions: lastFH.activeSuspensions.awayCount,
  }
  let lastSH = { homeScore: htH, awayScore: htA, shotsHome: lastFH.shotsHome, shotsAway: lastFH.shotsAway }
  const goalEvts: Array<{ clubId: string; minute: number }> = []
  for (const step of simulateSecondHalf(shInput)) {
    lastSH = step as typeof lastSH
    for (const ev of step.events) {
      if (ev.type === MatchEventType.Goal) goalEvts.push({ clubId: ev.clubId, minute: ev.minute })
    }
  }
  total++
  const diff = htH - htA
  if (diff === 0) continue
  htLeadN++
  const margin = Math.abs(diff)
  const leaderIsHome = diff > 0
  const fH = lastSH.homeScore, fA = lastSH.awayScore
  const leaderFinal = leaderIsHome ? fH : fA
  const trailerFinal = leaderIsHome ? fA : fH
  if (leaderFinal > trailerFinal) htLeadWins++
  else if (leaderFinal === trailerFinal) htLeadDraws++
  else htLeadLoses++
  if (margin === 1) {
    lead1N++
    if (leaderFinal > trailerFinal) lead1Wins++
    else if (leaderFinal === trailerFinal) lead1Draws++
    else lead1Loses++
  } else {
    lead2N++
    if (leaderFinal > trailerFinal) lead2Wins++
    else if (leaderFinal === trailerFinal) lead2Draws++
    else lead2Loses++
  }
  sh2N++
  const leaderClub = leaderIsHome ? homeId : awayId
  const sh2H = lastSH.shotsHome - lastFH.shotsHome
  const sh2A = lastSH.shotsAway - lastFH.shotsAway
  if (leaderIsHome) { sh2ShotsL += sh2H; sh2ShotsT += sh2A }
  else { sh2ShotsL += sh2A; sh2ShotsT += sh2H }
  for (const ev of goalEvts) {
    if (ev.clubId === leaderClub) sh2GoalsL++; else sh2GoalsT++
  }
}

const pct = (n: number, d: number) => d === 0 ? '—' : `${(n / d * 100).toFixed(1)}%`
console.log(`\n=== LIKA CA (65 vs 65), ${N} matcher ===\n`)
console.log(`Leder vid HT: ${htLeadN}/${total} (${pct(htLeadN, total)})`)
console.log(`htLeadWinPct:  ${pct(htLeadWins, htLeadN)}  Draw: ${pct(htLeadDraws, htLeadN)}  Lose: ${pct(htLeadLoses, htLeadN)}`)
console.log(`1-måls-ledning (n=${lead1N}): ${pct(lead1Wins, lead1N)} Win / ${pct(lead1Draws, lead1N)} Draw / ${pct(lead1Loses, lead1N)} Lose`)
console.log(`2+-måls-ledning (n=${lead2N}): ${pct(lead2Wins, lead2N)} Win / ${pct(lead2Draws, lead2N)} Draw / ${pct(lead2Loses, lead2N)} Lose`)
console.log(`\n2H mål/match: Ledare ${(sh2GoalsL / sh2N).toFixed(2)}  Jagare ${(sh2GoalsT / sh2N).toFixed(2)}  Ratio: ${(sh2GoalsT / Math.max(1, sh2GoalsL)).toFixed(2)}x`)
console.log(`2H skott/match: Ledare ${(sh2ShotsL / sh2N).toFixed(2)}  Jagare ${(sh2ShotsT / sh2N).toFixed(2)}  Ratio: ${(sh2ShotsT / Math.max(1, sh2ShotsL)).toFixed(2)}x`)
console.log(`Konversion: Ledare ${(sh2GoalsL / Math.max(1, sh2ShotsL) * 100).toFixed(1)}%  Jagare ${(sh2GoalsT / Math.max(1, sh2ShotsT) * 100).toFixed(1)}%`)
