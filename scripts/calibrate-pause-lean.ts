/**
 * Kalibrering — Spak A pausvalets lut (SPEC-SPAK-AB A1).
 * Mäter en jagande spelares comeback-frekvens under 'hold' vs 'push', isolerat
 * (samma seed, samma morale — bara pauseLean varieras). Mål: push rör comeback
 * mot ~13% UTAN overshoot. "Comeback" = managed-laget (som ligger under 1 mål i
 * halvtid) når minst oavgjort vid fulltid.
 *
 * Kör: node_modules/.bin/vite-node scripts/calibrate-pause-lean.ts
 */
import { simulateFirstHalf, simulateSecondHalf } from '../src/domain/services/matchCore'
import { PlayerPosition, PlayerArchetype, FixtureStatus } from '../src/domain/enums'
import type { Player } from '../src/domain/entities/Player'
import type { Fixture, TeamSelection } from '../src/domain/entities/Fixture'
import type { Tactic } from '../src/domain/entities/Club'
import type { MatchStep } from '../src/domain/services/matchUtils'

const CLUB_CAS = [85, 78, 68, 65, 63, 62, 60, 55, 52, 50, 48, 45]
function pickMatchupCA(seed: number): [number, number] {
  const rng = (s: number) => { s = ((s * 1664525 + 1013904223) | 0) >>> 0; return s / 0xffffffff }
  let i = Math.floor(rng(seed * 7919) * CLUB_CAS.length)
  let j = Math.floor(rng(seed * 6271 + 31) * CLUB_CAS.length)
  if (j === i) j = (j + 1) % CLUB_CAS.length
  return [CLUB_CAS[i], CLUB_CAS[j]]
}

let _pid = 0
function makePlayer(clubId: string, position: PlayerPosition, ca = 55): Player {
  const id = `p${++_pid}`
  const isGK = position === PlayerPosition.Goalkeeper
  return {
    id, firstName: 'X', lastName: `${id}`, age: 26, nationality: 'SWE',
    clubId, academyClubId: undefined, isHomegrown: false,
    position, archetype: isGK ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 0, contractUntilSeason: 2, marketValue: 0,
    morale: 70, form: 70, fitness: 85, sharpness: 75, seasonForm: 70, isFullTimePro: false,
    currentAbility: ca, potentialAbility: ca, developmentRate: 50, injuryProneness: 50, discipline: 70,
    attributes: {
      skating: ca, acceleration: ca, stamina: ca, ballControl: ca, passing: ca,
      shooting: ca, dribbling: ca, vision: ca, decisions: ca, workRate: ca,
      positioning: ca, defending: ca, cornerSkill: ca, goalkeeping: isGK ? ca + 20 : 20, cornerRecovery: ca,
    },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    isCharacterPlayer: false, trait: undefined,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
    careerMilestones: [],
  }
}
function makeSquad(clubId: string, ca = 55): Player[] {
  const P = PlayerPosition
  return [P.Goalkeeper, P.Defender, P.Defender, P.Defender, P.Half, P.Half, P.Half, P.Forward, P.Forward, P.Forward, P.Forward, P.Goalkeeper, P.Defender, P.Half, P.Forward, P.Forward].map(pos => makePlayer(clubId, pos, ca))
}
const defaultTactic = {
  mentality: 'balanced' as const, tempo: 'normal' as const, formation: '532_tvatoppar' as const,
  width: 'normal' as const, attackingFocus: 'mixed' as const, cornerStrategy: 'standard' as const,
  passingRisk: 'safe' as const, penaltyKillStyle: 'active' as const,
} as unknown as Tactic

function lastStep(gen: Generator<MatchStep>): MatchStep | null {
  let last: MatchStep | null = null
  for (const s of gen) last = s
  return last
}

const N = 6000
let trailingCases = 0
let leadingCases = 0
const comebacks: Record<'hold' | 'push', number> = { hold: 0, push: 0 }       // managed jagar 1 ned → minst lika
const comebackWins: Record<'hold' | 'push', number> = { hold: 0, push: 0 }    // managed jagar 1 ned → vinst
const leadHeld: Record<'hold' | 'calm', number> = { hold: 0, calm: 0 }        // managed leder 1 → behåller minst lika

for (let i = 0; i < N; i++) {
  const [homeCA, awayCA] = pickMatchupCA(i)
  _pid = 0
  const homePlayers = makeSquad('home', homeCA)
  const awayPlayers = makeSquad('away', awayCA)
  const mk = (pl: Player[]): TeamSelection => ({
    startingPlayerIds: pl.slice(0, 11).map(p => p.id),
    benchPlayerIds: pl.slice(11, 16).map(p => p.id),
    tactic: defaultTactic,
  })
  const homeLineup = mk(homePlayers)
  const awayLineup = mk(awayPlayers)
  const fixture: Fixture = {
    id: `fix${i}`, leagueId: 'calibration', homeClubId: 'home', awayClubId: 'away',
    season: 1, matchday: i + 1, roundNumber: i + 1, status: FixtureStatus.Scheduled,
    date: '2025-01-01', homeScore: 0, awayScore: 0, events: [], attendance: 500,
    isCup: false, isKnockout: false, isNeutralVenue: false,
  }
  const seed = i * 1337
  const base = { fixture, homeLineup, awayLineup, homePlayers, awayPlayers, homeAdvantage: 0.14, seed, managedIsHome: true as const }

  const ht = lastStep(simulateFirstHalf(base))
  if (!ht) continue
  const diff = ht.homeScore - ht.awayScore  // managed = home
  const secondHalfBase = {
    ...base,
    initialHomeScore: ht.homeScore, initialAwayScore: ht.awayScore,
    initialShotsHome: ht.shotsHome, initialShotsAway: ht.shotsAway,
    initialCornersHome: ht.cornersHome, initialCornersAway: ht.cornersAway,
  }
  if (diff === -1) {  // managed jagar med 1 mål → push
    trailingCases++
    for (const lean of ['hold', 'push'] as const) {
      const ft = lastStep(simulateSecondHalf({ ...secondHalfBase, pauseLean: lean }))
      if (ft && ft.homeScore >= ft.awayScore) comebacks[lean]++
      if (ft && ft.homeScore > ft.awayScore) comebackWins[lean]++
    }
  } else if (diff === 1) {  // managed leder med 1 mål → calm
    leadingCases++
    for (const lean of ['hold', 'calm'] as const) {
      const ft = lastStep(simulateSecondHalf({ ...secondHalfBase, pauseLean: lean }))
      if (ft && ft.homeScore >= ft.awayScore) leadHeld[lean]++
    }
  }
}

const p = (n: number, d: number) => d > 0 ? (100 * n / d).toFixed(1) : 'n/a'
console.log(`\n=== Spak A pausvalets lut — kalibrering (${N} matcher) ===`)
console.log(`\nPUSH (managed jagar 1 ned i halvtid, n=${trailingCases}):`)
console.log(`  → minst lika vid FT:  hold ${p(comebacks.hold, trailingCases)}%  →  push ${p(comebacks.push, trailingCases)}%`)
console.log(`  → vinst vid FT:       hold ${p(comebackWins.hold, trailingCases)}%  →  push ${p(comebackWins.push, trailingCases)}%`)
console.log(`\nCALM (managed leder 1 i halvtid, n=${leadingCases}):`)
console.log(`  → behåller minst lika: hold ${p(leadHeld.hold, leadingCases)}%  →  calm ${p(leadHeld.calm, leadingCases)}%`)
console.log(`\nKrav: monoton i rätt riktning, bounded, vänder aldrig utfallet.\n`)
