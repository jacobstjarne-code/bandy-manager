/**
 * KÖRORDER 2026-09-18 §2 — mentaliteten ska vara en avvägning, inte ett rätt svar.
 *
 * ROT (AUDIT_SPAKSVEP §2.2 pekade på fel lager): de två synliga mentalitets-
 * lagren var symmetriska per sekvens. Det som lutade var ANTALET sekvenser —
 * initiativformeln i matchCore vägde bara anfallsstyrka, aldrig försvar. Ett
 * offensivt val köpte både fler och bättre anfall; ett defensivt köpte bara
 * bättre och betalade med färre. Utfallet: offensiv vann +3,6 poäng per säsong
 * för samtliga tolv klubbar, oavsett sammanhang.
 *
 * Testerna låser de TRE egenskaper §2 kräver, inte de kalibrerade talen:
 *   1. vid jämn styrka ska inget läge vara ett rätt svar
 *   2. klart starkare lag ska tjäna på offensiv
 *   3. klart svagare lag ska tjäna på defensiv
 * Trösklarna är satta med rejäl marginal till de uppmätta värdena
 * (scripts/probe-mentality.ts, 800 matcher: +0,099 / +0,115 / ±0,012) så att
 * en omkalibrering inte bryter testet men en återgång till det ensidiga
 * beteendet gör det.
 */
import { describe, it, expect } from 'vitest'
import { simulateFirstHalf, simulateSecondHalf } from '../matchCore'
import { MENTALITY_OFFENSE_STEP, MENTALITY_DEFENSE_STEP, getTacticModifiers } from '../tacticModifiers'
import type { Player } from '../../entities/Player'
import type { Fixture, TeamSelection } from '../../entities/Fixture'
import { PlayerPosition, PlayerArchetype, FixtureStatus, TacticMentality } from '../../enums'
import type { Tactic } from '../../entities/Club'

const BASE_TACTIC = {
  mentality: TacticMentality.Balanced, tempo: 'normal', formation: '532_tvatoppar',
  width: 'normal', attackingFocus: 'mixed', cornerStrategy: 'standard',
  passingRisk: 'safe', penaltyKillStyle: 'active',
} as unknown as Tactic

const withMentality = (m: TacticMentality): Tactic => ({ ...BASE_TACTIC, mentality: m })

let pid = 0
function makePlayer(clubId: string, position: PlayerPosition, ca: number): Player {
  const id = `p${++pid}`
  const isGK = position === PlayerPosition.Goalkeeper
  return {
    id, firstName: 'Test', lastName: id, age: 26, nationality: 'SWE',
    clubId, academyClubId: undefined, isHomegrown: false,
    position, archetype: isGK ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 0, contractUntilSeason: 2, marketValue: 0,
    morale: 70, form: 70, fitness: 85, sharpness: 75, seasonForm: 70, isFullTimePro: false,
    currentAbility: ca, potentialAbility: ca, developmentRate: 50, injuryProneness: 50, discipline: 70,
    attributes: {
      skating: ca, acceleration: ca, stamina: ca, ballControl: ca, passing: ca, shooting: ca,
      dribbling: ca, vision: ca, decisions: ca, workRate: ca, positioning: ca, defending: ca,
      cornerSkill: ca, goalkeeping: isGK ? ca + 20 : 20, cornerRecovery: ca,
    },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    isCharacterPlayer: false, trait: undefined,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
    careerMilestones: [],
  } as Player
}

function makeSquad(clubId: string, ca: number): Player[] {
  const P = PlayerPosition
  return [P.Goalkeeper, P.Defender, P.Defender, P.Defender, P.Half, P.Half, P.Half,
    P.Forward, P.Forward, P.Forward, P.Forward, P.Goalkeeper, P.Defender, P.Half, P.Forward, P.Forward]
    .map(pos => makePlayer(clubId, pos, ca))
}

const MATCHES = 150

/** Poäng per match för hemmalaget (2 för vinst, 1 för oavgjort) över identiska seeds. */
function pointsPerMatch(homeCA: number, awayCA: number, mentality: TacticMentality): number {
  let points = 0
  for (let i = 0; i < MATCHES; i++) {
    pid = 0
    const homePlayers = makeSquad('home', homeCA)
    const awayPlayers = makeSquad('away', awayCA)
    const homeLineup: TeamSelection = {
      startingPlayerIds: homePlayers.slice(0, 11).map(p => p.id),
      benchPlayerIds: homePlayers.slice(11).map(p => p.id),
      tactic: withMentality(mentality),
    }
    const awayLineup: TeamSelection = {
      startingPlayerIds: awayPlayers.slice(0, 11).map(p => p.id),
      benchPlayerIds: awayPlayers.slice(11).map(p => p.id),
      tactic: BASE_TACTIC,
    }
    const fixture: Fixture = {
      id: `f${i}`, leagueId: 'test', homeClubId: 'home', awayClubId: 'away',
      season: 1, matchday: i + 1, roundNumber: i + 1,
      status: FixtureStatus.Scheduled, date: '2025-01-01',
      homeScore: 0, awayScore: 0, events: [], attendance: 500,
      isCup: false, isKnockout: false, isNeutralVenue: false,
    }
    // Samma seed för alla mentalitetslägen — skillnaden är valet, inte slumpen.
    const core = { fixture, homeLineup, awayLineup, homePlayers, awayPlayers,
      homeAdvantage: 0.14, seed: i * 1337 + 999, mode: 'fast' as const }

    let fh = { homeScore: 0, awayScore: 0, shotsHome: 0, shotsAway: 0, cornersHome: 0, cornersAway: 0, activeSuspensions: { homeCount: 0, awayCount: 0 } }
    for (const step of simulateFirstHalf(core)) fh = step as typeof fh
    let sh = { homeScore: fh.homeScore, awayScore: fh.awayScore }
    for (const step of simulateSecondHalf({ ...core,
      initialHomeScore: fh.homeScore, initialAwayScore: fh.awayScore,
      initialShotsHome: fh.shotsHome, initialShotsAway: fh.shotsAway,
      initialCornersHome: fh.cornersHome, initialCornersAway: fh.cornersAway,
      initialHomeSuspensions: fh.activeSuspensions.homeCount,
      initialAwaySuspensions: fh.activeSuspensions.awayCount })) sh = step as typeof sh

    points += sh.homeScore > sh.awayScore ? 2 : sh.homeScore === sh.awayScore ? 1 : 0
  }
  return points / MATCHES
}

describe('§2 — mentalitetens steg', () => {
  it('försvarssteget är större än anfallssteget, eftersom motorn väger anfall tyngre', () => {
    // matchCore: base = attAttack * 0.6 - defDefense * 0.4. Lika stora steg ger
    // därför offensiv en gratis nettovinst i chanskvalitet.
    expect(MENTALITY_DEFENSE_STEP).toBeGreaterThan(MENTALITY_OFFENSE_STEP)
  })

  it('stegen är speglade mellan lägena', () => {
    const off = getTacticModifiers(withMentality(TacticMentality.Offensive))
    const bal = getTacticModifiers(withMentality(TacticMentality.Balanced))
    const def = getTacticModifiers(withMentality(TacticMentality.Defensive))
    expect(off.offenseModifier - bal.offenseModifier).toBeCloseTo(MENTALITY_OFFENSE_STEP, 3)
    expect(bal.offenseModifier - def.offenseModifier).toBeCloseTo(MENTALITY_OFFENSE_STEP, 3)
    expect(bal.defenseModifier - off.defenseModifier).toBeCloseTo(MENTALITY_DEFENSE_STEP, 3)
    expect(def.defenseModifier - bal.defenseModifier).toBeCloseTo(MENTALITY_DEFENSE_STEP, 3)
  })
})

describe('§2 — mentaliteten är en avvägning, inget rätt svar', () => {
  it('vid jämn styrka ger inget läge en tydlig fördel', () => {
    const off = pointsPerMatch(65, 65, TacticMentality.Offensive)
    const def = pointsPerMatch(65, 65, TacticMentality.Defensive)
    expect(Math.abs(off - def)).toBeLessThan(0.12)
  })

  it('ett klart starkare lag tjänar på offensiv', () => {
    const off = pointsPerMatch(72, 55, TacticMentality.Offensive)
    const def = pointsPerMatch(72, 55, TacticMentality.Defensive)
    expect(off).toBeGreaterThan(def)
  })

  it('ett klart svagare lag tjänar på defensiv', () => {
    const off = pointsPerMatch(55, 72, TacticMentality.Offensive)
    const def = pointsPerMatch(55, 72, TacticMentality.Defensive)
    expect(def).toBeGreaterThan(off)
  })
})
