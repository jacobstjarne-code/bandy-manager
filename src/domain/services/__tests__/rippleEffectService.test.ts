// ÖVERLÄMNING 2 steg 3, dynamiska deltan (2026-08-16): verifierar att
// mittpunkt-kravet håller (genomsnittsfallet reproducerar exakt dagens
// fasta värden −4/−3/−4, +8/+10/+5, −8/−10/−5) och att extremfallen
// skalar i rätt riktning (inbytare knappt märks, lagets bästa svider osv).
import { describe, it, expect } from 'vitest'
import { applyRipples } from '../rippleEffectService'
import type { SaveGame } from '../../entities/SaveGame'
import type { Player } from '../../entities/Player'
import type { Club } from '../../entities/Club'
import type { Fixture } from '../../entities/Fixture'
import { PlayerPosition, PlayerArchetype, TrainingType, TrainingIntensity, TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus, CornerStrategy, PenaltyKillStyle, ClubExpectation, ClubStyle } from '../../enums'

const defaultTactic = {
  mentality: TacticMentality.Balanced, tempo: TacticTempo.Normal, press: TacticPress.Medium,
  passingRisk: TacticPassingRisk.Mixed, width: TacticWidth.Normal, attackingFocus: TacticAttackingFocus.Mixed,
  cornerStrategy: CornerStrategy.Standard, penaltyKillStyle: PenaltyKillStyle.Passive,
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1', firstName: 'Test', lastName: 'Player',
    age: 26, nationality: 'SE', clubId: 'c1', isHomegrown: false,
    position: PlayerPosition.Forward, archetype: PlayerArchetype.Finisher,
    salary: 15000, contractUntilSeason: 2027, marketValue: 300000,
    morale: 70, form: 65, fitness: 80, sharpness: 70,
    currentAbility: 65, potentialAbility: 75, developmentRate: 50,
    injuryProneness: 30, discipline: 60, isInjured: true, injuryDaysRemaining: 30, suspensionGamesRemaining: 0,
    attributes: { skating: 60, acceleration: 60, stamina: 60, ballControl: 60, passing: 60, shooting: 60, dribbling: 60, vision: 60, decisions: 60, workRate: 60, positioning: 60, defending: 40, cornerSkill: 40, goalkeeping: 10 },
    seasonStats: { gamesPlayed: 10, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
    ...overrides,
  } as Player
}

function makeClub(overrides: Partial<Club> = {}): Club {
  return {
    id: 'c1', name: 'Managed FK', shortName: 'MFK', region: 'Mälardalen',
    reputation: 60, finances: 500000, wageBudget: 200000, transferBudget: 500000,
    youthQuality: 50, youthRecruitment: 50, youthDevelopment: 50, facilities: 60,
    boardExpectation: ClubExpectation.MidTable, fanExpectation: ClubExpectation.MidTable,
    preferredStyle: ClubStyle.Balanced, hasArtificialIce: false,
    activeTactic: defaultTactic, squadPlayerIds: [],
    ...overrides,
  } as Club
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'g1', managerName: 'Test', managedClubId: 'c1',
    currentDate: '2025-09-15', currentSeason: 2025, currentMatchday: 14,
    clubs: [makeClub()], players: [],
    league: { id: 'l1', name: 'Test League', season: 2025 },
    fixtures: [], standings: [], inbox: [],
    transferState: { freeAgents: [], pendingOffers: [] },
    youthIntakeHistory: [], matchWeathers: [],
    managedClubTraining: { type: TrainingType.Physical, intensity: TrainingIntensity.Normal },
    trainingHistory: [], playoffBracket: null, cupBracket: null, seasonSummaries: [],
    pendingScreen: null, scoutReports: {}, activeScoutAssignment: null, scoutBudget: 10,
    pendingEvents: [], transferBids: [], version: '0.1.0', lastSavedAt: '2025-01-01T00:00:00Z',
    fanMood: 50, communityStanding: 50, boardPatience: 70, sponsorNetworkMood: 50,
    supporterGroup: { mood: 50 } as SaveGame['supporterGroup'],
    captainPlayerId: 'captain-none',
    mecenater: [],
    ...overrides,
  } as unknown as SaveGame
}

describe('star_injured — dynamisk vikt (2026-08-16)', () => {
  it('baseline (CA = truppsnitt, ej kapten, 10 matcher) reproducerar exakt −4/−3', () => {
    const squad = [
      makePlayer({ id: 'p1', currentAbility: 65, seasonStats: { gamesPlayed: 10 } as never }),
      makePlayer({ id: 'p2', currentAbility: 65 }),
    ]
    const game = makeGame({
      players: squad,
      clubs: [makeClub({ squadPlayerIds: ['p1', 'p2'] })],
      captainPlayerId: 'p2',
    })
    const after = applyRipples(game, { type: 'star_injured', playerId: 'p1' })
    expect(after.fanMood).toBe(46) // 50 − round(4×1.0)
    expect(after.supporterGroup?.mood).toBe(47) // 50 − round(3×1.0)
  })

  it('en inbytare (låg CA, få matcher, ej kapten) märks knappt', () => {
    const squad = [
      makePlayer({ id: 'sub', currentAbility: 55, seasonStats: { gamesPlayed: 1 } as never }),
      makePlayer({ id: 'star', currentAbility: 85 }),
    ]
    const game = makeGame({
      players: squad,
      clubs: [makeClub({ squadPlayerIds: ['sub', 'star'] })],
      captainPlayerId: 'star',
    })
    const after = applyRipples(game, { type: 'star_injured', playerId: 'sub' })
    // CA 55 vs snitt 70 → caWeight ~0.79, gamesWeight golv 0.3 → vikt lågt, delta litet
    expect(50 - (after.fanMood ?? 50)).toBeLessThan(4)
  })

  it('lagets bästa (hög CA, kapten, etablerad) svider tydligt mer än baseline', () => {
    const squad = [
      makePlayer({ id: 'star', currentAbility: 85, seasonStats: { gamesPlayed: 18 } as never }),
      makePlayer({ id: 'p2', currentAbility: 60 }),
      makePlayer({ id: 'p3', currentAbility: 55 }),
    ]
    const game = makeGame({
      players: squad,
      clubs: [makeClub({ squadPlayerIds: ['star', 'p2', 'p3'] })],
      captainPlayerId: 'star',
    })
    const after = applyRipples(game, { type: 'star_injured', playerId: 'star' })
    expect(50 - (after.fanMood ?? 50)).toBeGreaterThan(4)
  })
})

describe('big_derby_win — dynamisk vikt (2026-08-16)', () => {
  const fixture = (overrides: Partial<Fixture> = {}): Fixture => ({
    id: 'fx1', leagueId: 'l1', season: 2025, roundNumber: 10, matchday: 10,
    homeClubId: 'c1', awayClubId: 'c2', homeScore: 3, awayScore: 1,
    status: 'completed', events: [],
    ...overrides,
  } as unknown as Fixture)

  it('baseline (2 mål marginal, mittenlag av 12) reproducerar exakt +8/+10/+5', () => {
    // totalClubs måste spegla en riktig 12-lagsliga (position/totalClubs
    // används direkt i oppWeight) — en sparse standings-array med bara 2
    // rader gör totalClubs=2 och position=6 blir nonsens. c2 på plats 6 av 12
    // är den genuina mittenplaceringen formeln är kalibrerad mot.
    const game = makeGame({
      clubs: [makeClub({ id: 'c1' }), makeClub({ id: 'c2', name: 'Rival' })],
      fixtures: [fixture({ homeScore: 3, awayScore: 1 })], // marginal 2
      standings: Array.from({ length: 12 }, (_, i) => ({
        clubId: i === 0 ? 'c1' : i === 5 ? 'c2' : `club${i}`,
        played: 10, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
        position: i + 1,
      })), // c2 på plats 6 av 12
    })
    const after = applyRipples(game, { type: 'big_derby_win', fixtureId: 'fx1' })
    expect(after.fanMood).toBe(58) // 50 + round(8×~1.0)
    expect(after.supporterGroup?.mood).toBe(60)
    expect(after.sponsorNetworkMood).toBe(55)
  })

  it('enmålsseger mot bottenlag ger en svagare skvalp än baseline', () => {
    const game = makeGame({
      clubs: [makeClub({ id: 'c1' }), makeClub({ id: 'c2', name: 'Bottenlag' })],
      fixtures: [fixture({ homeScore: 2, awayScore: 1 })], // marginal 1
      standings: Array.from({ length: 12 }, (_, i) => ({
        clubId: i === 0 ? 'c1' : i === 11 ? 'c2' : `club${i}`,
        played: 10, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
        position: i + 1,
      })),
    })
    const after = applyRipples(game, { type: 'big_derby_win', fixtureId: 'fx1' })
    expect((after.fanMood ?? 50) - 50).toBeLessThan(8)
  })

  it('stor seger mot serieledaren ger en kraftigare våg än baseline', () => {
    const game = makeGame({
      clubs: [makeClub({ id: 'c1' }), makeClub({ id: 'c2', name: 'Serieledare' })],
      fixtures: [fixture({ homeScore: 5, awayScore: 0 })], // marginal 5
      standings: Array.from({ length: 12 }, (_, i) => ({
        clubId: i === 0 ? 'c2' : i === 5 ? 'c1' : `club${i}`,
        played: 10, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
        position: i + 1,
      })),
    })
    const after = applyRipples(game, { type: 'big_derby_win', fixtureId: 'fx1' })
    expect((after.fanMood ?? 50) - 50).toBeGreaterThan(8)
  })
})

describe('mecenat_left — dynamisk vikt (2026-08-16)', () => {
  it('baseline (contribution 70 000, mitten av wealth-skalan) reproducerar exakt −8/−10/−5', () => {
    const game = makeGame({
      mecenater: [{ id: 'm1', contribution: 70000, isActive: false } as never],
    })
    const after = applyRipples(game, { type: 'mecenat_left', mecenatId: 'm1' })
    expect(after.communityStanding).toBe(42)
    expect(after.boardPatience).toBe(60)
    expect(after.supporterGroup?.mood).toBe(45)
  })

  it('en liten mecenat (wealth 1, ~20-40k) märks knappt', () => {
    const game = makeGame({
      mecenater: [{ id: 'm1', contribution: 25000, isActive: false } as never],
    })
    const after = applyRipples(game, { type: 'mecenat_left', mecenatId: 'm1' })
    expect(50 - (after.communityStanding ?? 50)).toBeLessThan(8)
  })

  it('en stor mecenat (wealth 5, ~100-120k) rycker undan mattan', () => {
    const game = makeGame({
      mecenater: [{ id: 'm1', contribution: 115000, isActive: false } as never],
    })
    const after = applyRipples(game, { type: 'mecenat_left', mecenatId: 'm1' })
    expect(50 - (after.communityStanding ?? 50)).toBeGreaterThan(8)
  })
})
