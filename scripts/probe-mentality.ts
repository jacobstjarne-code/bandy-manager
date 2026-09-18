/**
 * probe-mentality.ts — KÖRORDER 2026-09-18 §2, diagnos på MATCHNIVÅ.
 *
 * Säsongssvepet (lever-sweep) visar att offensiv mentalitet vinner för alla
 * tolv klubbar, men det säger inte VILKEN kanal i motorn som bär vinsten.
 * Den här sonden kör identiska trupper mot varandra, varierar bara hemmalagets
 * mentalitet, och rapporterar mål för/emot + poäng per match vid tre
 * styrkelägen (underlägsen / jämn / överlägsen).
 *
 * Kör: node_modules/.bin/vite-node scripts/probe-mentality.ts [--n=600]
 */
import { simulateFirstHalf, simulateSecondHalf } from '../src/domain/services/matchCore'
import { PlayerPosition, PlayerArchetype, FixtureStatus } from '../src/domain/enums'
import type { Player } from '../src/domain/entities/Player'
import type { Fixture, TeamSelection } from '../src/domain/entities/Fixture'
import type { Tactic } from '../src/domain/entities/Club'

let _pid = 0
function makePlayer(clubId: string, position: PlayerPosition, ca: number): Player {
  const id = `p${++_pid}`
  const isGK = position === PlayerPosition.Goalkeeper
  return {
    id, firstName: 'X', lastName: `${id}`, age: 26, nationality: 'SWE',
    clubId, academyClubId: undefined, isHomegrown: false,
    position, archetype: isGK ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 0, contractUntilSeason: 2, marketValue: 0,
    morale: 70, form: 70, fitness: 85, sharpness: 75, seasonForm: 70,
    isFullTimePro: false,
    currentAbility: ca, potentialAbility: ca, developmentRate: 50, injuryProneness: 50, discipline: 70,
    attributes: {
      skating: ca, acceleration: ca, stamina: ca, ballControl: ca,
      passing: ca, shooting: ca, dribbling: ca, vision: ca,
      decisions: ca, workRate: ca, positioning: ca, defending: ca,
      cornerSkill: ca, goalkeeping: isGK ? ca + 20 : 20, cornerRecovery: ca,
    },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    isCharacterPlayer: false, trait: undefined,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
    careerMilestones: [],
  }
}
function makeSquad(clubId: string, ca: number): Player[] {
  const P = PlayerPosition
  const layout = [P.Goalkeeper, P.Defender, P.Defender, P.Defender, P.Half, P.Half, P.Half,
    P.Forward, P.Forward, P.Forward, P.Forward, P.Goalkeeper, P.Defender, P.Half, P.Forward, P.Forward]
  return layout.map(pos => makePlayer(clubId, pos, ca))
}

const baseTactic = {
  mentality: 'balanced', tempo: 'normal', formation: '532_tvatoppar',
  width: 'normal', attackingFocus: 'mixed', cornerStrategy: 'standard',
  passingRisk: 'safe', penaltyKillStyle: 'active',
} as unknown as Tactic
const withMentality = (m: string): Tactic => ({ ...baseTactic, mentality: m } as unknown as Tactic)

const N = Number(process.argv.find(a => a.startsWith('--n='))?.split('=')[1] ?? 600)

interface Cell { gf: number; ga: number; pts: number; n: number }

function run(homeCA: number, awayCA: number, mentality: string): Cell {
  const cell: Cell = { gf: 0, ga: 0, pts: 0, n: 0 }
  for (let i = 0; i < N; i++) {
    const homeId = `h${i}`, awayId = `a${i}`
    _pid = 0
    const homePlayers = makeSquad(homeId, homeCA)
    const awayPlayers = makeSquad(awayId, awayCA)
    const homeLineup: TeamSelection = {
      startingPlayerIds: homePlayers.slice(0, 11).map(p => p.id),
      benchPlayerIds: homePlayers.slice(11).map(p => p.id),
      tactic: withMentality(mentality),
    }
    const awayLineup: TeamSelection = {
      startingPlayerIds: awayPlayers.slice(0, 11).map(p => p.id),
      benchPlayerIds: awayPlayers.slice(11).map(p => p.id),
      tactic: baseTactic,
    }
    const fixture: Fixture = {
      id: `f${i}`, leagueId: 'probe', homeClubId: homeId, awayClubId: awayId,
      season: 1, matchday: i + 1, roundNumber: i + 1,
      status: FixtureStatus.Scheduled, date: '2025-01-01',
      homeScore: 0, awayScore: 0, events: [], attendance: 500,
      isCup: false, isKnockout: false, isNeutralVenue: false,
    }
    // Samma seed över alla mentalitetslägen — skillnaden är mentaliteten, inte slumpen.
    const coreInput = { fixture, homeLineup, awayLineup, homePlayers, awayPlayers,
      homeAdvantage: 0.14, seed: i * 1337 + 999, mode: 'fast' as const }

    let fh = { homeScore: 0, awayScore: 0, shotsHome: 0, shotsAway: 0, cornersHome: 0, cornersAway: 0, activeSuspensions: { homeCount: 0, awayCount: 0 } }
    for (const step of simulateFirstHalf(coreInput)) fh = step as typeof fh
    const shInput = { ...coreInput,
      initialHomeScore: fh.homeScore, initialAwayScore: fh.awayScore,
      initialShotsHome: fh.shotsHome, initialShotsAway: fh.shotsAway,
      initialCornersHome: fh.cornersHome, initialCornersAway: fh.cornersAway,
      initialHomeSuspensions: fh.activeSuspensions.homeCount,
      initialAwaySuspensions: fh.activeSuspensions.awayCount }
    let sh = { homeScore: fh.homeScore, awayScore: fh.awayScore }
    for (const step of simulateSecondHalf(shInput)) sh = step as typeof sh

    cell.gf += sh.homeScore; cell.ga += sh.awayScore; cell.n++
    cell.pts += sh.homeScore > sh.awayScore ? 2 : sh.homeScore === sh.awayScore ? 1 : 0
  }
  return cell
}

const SCENARIOS: Array<[string, number, number]> = [
  ['underlägsen  (55 mot 72)', 55, 72],
  ['jämn         (65 mot 65)', 65, 65],
  ['överlägsen   (72 mot 55)', 72, 55],
]

console.log(`\n=== MENTALITETSSOND (§2) — ${N} matcher per cell, identiska seeds ===\n`)
console.log('scenario                  läge        mål/match   insl/match   poäng/match   Δpoäng mot balanserad')
for (const [label, hca, aca] of SCENARIOS) {
  const bal = run(hca, aca, 'balanced')
  const balPts = bal.pts / bal.n
  for (const m of ['offensive', 'balanced', 'defensive']) {
    const c = m === 'balanced' ? bal : run(hca, aca, m)
    const pts = c.pts / c.n
    console.log(
      `${label}  ${m.padEnd(10)}  ${(c.gf / c.n).toFixed(2).padStart(7)}   ${(c.ga / c.n).toFixed(2).padStart(8)}   ${pts.toFixed(3).padStart(9)}   ${(pts - balPts >= 0 ? '+' : '') + (pts - balPts).toFixed(3)}`,
    )
  }
  console.log('')
}
