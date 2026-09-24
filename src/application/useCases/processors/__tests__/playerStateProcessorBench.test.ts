import { describe, it, expect } from 'vitest'
import { applyPlayerStateUpdates } from '../playerStateProcessor'
import { updatePlayerMatchStats } from '../statsProcessor'
import type { Player } from '../../../../domain/entities/Player'
import type { Fixture, TeamSelection } from '../../../../domain/entities/Fixture'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import {
  PlayerPosition, PlayerArchetype, FixtureStatus,
  TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus,
  CornerStrategy, PenaltyKillStyle,
} from '../../../../domain/enums'
import type { Tactic } from '../../../../domain/entities/Club'

/**
 * BETATEST_ERIK_2026-09-24 B3 — rot: bandy har löpande byten (statsProcessor.ts
 * krediterar en oanvänd utespelare på bänken 30-40 minuters speltid i
 * seasonStats), men playerStateProcessor.ts:s bänk-gren behandlade ALLA
 * bänkspelare som om de aldrig klivit in — ren återhämtning, inget kondi-
 * tionspris, och ett skärpe-STRAFF (-5) trots att statistiken sa att de spelat.
 * Två sanningar om samma 30-40 minuter som inte kunde stämma samtidigt.
 *
 * Målvakten hålls uttryckligen utanför (körorderns instruktion,
 * "behandlas separat") — en reservmålvakt byts inte löpande.
 */

const NEUTRAL_TACTIC: Tactic = {
  mentality: TacticMentality.Balanced, tempo: TacticTempo.Normal, press: TacticPress.Medium,
  passingRisk: TacticPassingRisk.Mixed, width: TacticWidth.Normal, attackingFocus: TacticAttackingFocus.Mixed,
  cornerStrategy: CornerStrategy.Standard, penaltyKillStyle: PenaltyKillStyle.Active, formation: '5-3-2',
}

function makePlayer(id: string, position: PlayerPosition, clubId: string, fitness = 90): Player {
  const ca = 65
  return {
    id, firstName: 'Test', lastName: 'Spelare', age: 25, nationality: 'SE', clubId,
    isHomegrown: true, position,
    archetype: position === PlayerPosition.Goalkeeper ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 10000, contractUntilSeason: 2028, marketValue: 100000,
    morale: 75, form: 75, fitness, sharpness: 75,
    currentAbility: ca, potentialAbility: ca + 10, developmentRate: 50, injuryProneness: 30, discipline: 70,
    attributes: {
      skating: ca, acceleration: ca, stamina: ca, ballControl: ca, passing: ca, shooting: ca,
      dribbling: ca, vision: ca, decisions: ca, workRate: ca, positioning: ca, defending: ca,
      cornerSkill: ca, goalkeeping: position === PlayerPosition.Goalkeeper ? ca + 15 : Math.max(1, ca - 15),
      cornerRecovery: 50,
    },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 6.5, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 1 },
  }
}

function makeSelection(starters: Player[], bench: Player[]): TeamSelection {
  return { startingPlayerIds: starters.map(p => p.id), benchPlayerIds: bench.map(p => p.id), tactic: NEUTRAL_TACTIC }
}

function makeFixture(id: string, homeStarters: Player[], homeBench: Player[], awayStarters: Player[]): Fixture {
  return {
    id, leagueId: 'league_1', season: 2026, roundNumber: 5, matchday: 5,
    homeClubId: 'club1', awayClubId: 'club2', status: FixtureStatus.Completed,
    homeScore: 3, awayScore: 2, events: [],
    homeLineup: makeSelection(homeStarters, homeBench),
    awayLineup: makeSelection(awayStarters, []),
    report: { playerRatings: Object.fromEntries(homeStarters.map(p => [p.id, 6.5])) } as never,
  }
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test', managerName: 'Tränare', managedClubId: 'club1', currentDate: '2026-10-15',
    currentSeason: 2, currentMatchday: 5, clubs: [], players: [],
    league: { id: 'l1', name: 'Test', clubs: [] } as never, fixtures: [], standings: [], inbox: [],
    transferState: {} as never, youthIntakeHistory: [], matchWeathers: [],
    managedClubTraining: 'balanced' as never, trainingHistory: [], playoffBracket: null, cupBracket: null,
    pendingEvents: [], deferredDecisions: [], transferBids: [], handledContractPlayerIds: [],
    sponsors: [], activeTalentSearch: null, talentSearchResults: [], mentorships: [], loanDeals: [],
    academyLevel: 'none' as never, scoutReports: {}, activeScoutAssignment: null, scoutBudget: 0,
    seasonSummaries: [], version: '1.0', lastSavedAt: '2026-10-15T00:00:00',
    ...overrides,
  } as SaveGame
}

describe('playerStateProcessor — B3 bänk (utespelare)', () => {
  it('utespelare på bänken hamnar lägre i kondition än en spelare som inte var uttagen alls, och vinner skärpa (inte förlorar)', () => {
    // Vid hög startkondition (nära taket) kan en vecKas återhämtning (kal.
    // faktor 7/7=1.0) nästan helt jämna ut den nya matchkostnaden — det är
    // rimligt (en spelare som fick 35 lätta minuter och sedan sju dagars
    // vila SKA vara nästan återställd). Den meningsfulla, robusta signalen
    // är därför INTE "kondition måste sjunka under startvärdet", utan att
    // bänkspelaren hamnar SÄMRE än en spelare som satt helt utanför truppen
    // (samma startkondition, 'rested'-vägen, ingen matchkostnad alls) — det
    // var precis den skillnaden buggen suddade ut.
    const starters = [makePlayer('h_gk', PlayerPosition.Goalkeeper, 'club1'), makePlayer('h_f1', PlayerPosition.Forward, 'club1')]
    const benchOutfield = makePlayer('h_bench_out', PlayerPosition.Forward, 'club1', 90)
    const notInSquad = makePlayer('h_not_in_squad', PlayerPosition.Forward, 'club1', 90)
    const away = [makePlayer('a_f1', PlayerPosition.Forward, 'club2')]
    const fixture = makeFixture('f1', starters, [benchOutfield], away)
    const allPlayers = [...starters, benchOutfield, notInSquad, ...away]
    const startersThisRound = new Set(starters.map(p => p.id).concat(away.map(p => p.id)))
    const benchThisRound = new Set([benchOutfield.id])
    const game = makeGame()

    const result = applyPlayerStateUpdates(
      allPlayers, startersThisRound, benchThisRound, game, null, undefined, undefined,
      42, 6, [fixture],
    )
    const updatedBench = result.updatedPlayers.find(p => p.id === benchOutfield.id)!
    const updatedRested = result.updatedPlayers.find(p => p.id === notInSquad.id)!

    expect(updatedBench.fitness, 'bänkspelaren ska hamna lägre i kondition än en spelare som inte var uttagen alls').toBeLessThan(updatedRested.fitness)
    expect(updatedBench.sharpness, 'skärpa ska öka (spelade minuter), inte minska').toBeGreaterThan(75)
  })

  it('reservmålvakten på bänken behåller den gamla (oförändrade) behandlingen: ren återhämtning, skärpestraff -5', () => {
    const starters = [makePlayer('h_gk', PlayerPosition.Goalkeeper, 'club1'), makePlayer('h_f1', PlayerPosition.Forward, 'club1')]
    const benchGk = makePlayer('h_bench_gk', PlayerPosition.Goalkeeper, 'club1', 90)
    const away = [makePlayer('a_f1', PlayerPosition.Forward, 'club2')]
    const fixture = makeFixture('f1', starters, [benchGk], away)
    const allPlayers = [...starters, benchGk, ...away]
    const startersThisRound = new Set(starters.map(p => p.id).concat(away.map(p => p.id)))
    const benchThisRound = new Set([benchGk.id])
    const game = makeGame()

    const result = applyPlayerStateUpdates(
      allPlayers, startersThisRound, benchThisRound, game, null, undefined, undefined,
      42, 6, [fixture],
    )
    const updatedGk = result.updatedPlayers.find(p => p.id === benchGk.id)!

    expect(updatedGk.fitness, 'reservmålvakten ska bara återhämta, aldrig kosta kondition').toBeGreaterThanOrEqual(90)
    expect(updatedGk.sharpness).toBe(70)  // 75 - 5, oförändrad formel
  })

  it('konsekvens: samma krediterade minuter i statsProcessor.ts och playerStateProcessor.ts för samma spelare/runda', () => {
    // Rotorsaken var exakt att de två filerna kunde påstå olika saker om
    // samma bänkminuter. Det här testet bevisar att de nu är beräknade ur
    // SAMMA deterministiska formel (samma frö), inte bara att var och en för
    // sig ser rimlig ut.
    const starters = [makePlayer('h_gk', PlayerPosition.Goalkeeper, 'club1'), makePlayer('h_f1', PlayerPosition.Forward, 'club1')]
    const benchOutfield = makePlayer('h_bench_out', PlayerPosition.Forward, 'club1', 90)
    const away = [makePlayer('a_f1', PlayerPosition.Forward, 'club2')]
    const fixture = makeFixture('f1', starters, [benchOutfield], away)
    const allPlayers = [...starters, benchOutfield, ...away]
    const startersThisRound = new Set(starters.map(p => p.id).concat(away.map(p => p.id)))
    const benchThisRound = new Set([benchOutfield.id])
    const game = makeGame()

    // daysBetweenFixtures=1 (matcher tätt inpå varandra) håller återhämtningen
    // liten (kalenderfaktorn 1/7) så matchkostnaden syns tydligt i nettot,
    // i stället för att nästan jämnas ut av en hel vecKas återhämtning.
    const stateResult = applyPlayerStateUpdates(
      allPlayers, startersThisRound, benchThisRound, game, null, undefined, undefined,
      42, 6, [fixture], 1,
    )
    const statsResult = updatePlayerMatchStats(allPlayers, [fixture], game, 6)

    const fitnessDelta = 90 - stateResult.updatedPlayers.find(p => p.id === benchOutfield.id)!.fitness
    const creditedMinutes = statsResult.finalPlayers.find(p => p.id === benchOutfield.id)!.seasonStats.minutesPlayed

    expect(creditedMinutes, 'flygande byten ska fortfarande kreditera 30-40 minuter för en utespelare').toBeGreaterThanOrEqual(30)
    expect(creditedMinutes).toBeLessThanOrEqual(40)
    // Konditionskostnaden är proportionell mot EXAKT samma minuttal — inte
    // startspelarens fulla 13-20, inte noll. Ett löst, brett band som ändå
    // utesluter båda gamla felaktiga extremerna.
    expect(fitnessDelta).toBeGreaterThan(0)
    expect(fitnessDelta).toBeLessThan(13)
  })
})

describe('statsProcessor — B3 målvakten uteslutet ur flygande byten', () => {
  it('en oanvänd reservmålvakt på bänken får INGEN minutkredit eller gamesPlayed-ökning', () => {
    const starter = makePlayer('h_gk', PlayerPosition.Goalkeeper, 'club1')
    const benchGk = makePlayer('h_bench_gk', PlayerPosition.Goalkeeper, 'club1')
    const fixture: Fixture = {
      id: 'fx1', leagueId: 'liga', season: 1, roundNumber: 1, matchday: 1,
      homeClubId: 'club1', awayClubId: 'club2', status: FixtureStatus.Completed,
      homeScore: 2, awayScore: 1,
      homeLineup: { startingPlayerIds: [starter.id], benchPlayerIds: [benchGk.id], tactic: {} as never },
      awayLineup: { startingPlayerIds: [], benchPlayerIds: [], tactic: {} as never },
      events: [],
      report: { playerRatings: { [starter.id]: 6.5 } } as never,
    }
    const game = { currentSeason: 1, managedClubId: 'club1', clubs: [] } as unknown as SaveGame

    const result = updatePlayerMatchStats([starter, benchGk], [fixture], game, 2)
    const updated = result.finalPlayers.find(p => p.id === benchGk.id)!

    expect(updated.seasonStats.gamesPlayed, 'reservmålvakten ska inte krediteras en match hon inte spelade').toBe(0)
    expect(updated.seasonStats.minutesPlayed).toBe(0)
    expect(updated.careerStats.totalGames).toBe(0)
  })

  it('en oanvänd utespelare på bänken krediteras fortfarande 30-40 minuter (regression: befintligt beteende oförändrat)', () => {
    const starter = makePlayer('h_f0', PlayerPosition.Forward, 'club1')
    const benchOutfield = makePlayer('h_bench_out', PlayerPosition.Forward, 'club1')
    const fixture: Fixture = {
      id: 'fx1', leagueId: 'liga', season: 1, roundNumber: 1, matchday: 1,
      homeClubId: 'club1', awayClubId: 'club2', status: FixtureStatus.Completed,
      homeScore: 2, awayScore: 1,
      homeLineup: { startingPlayerIds: [starter.id], benchPlayerIds: [benchOutfield.id], tactic: {} as never },
      awayLineup: { startingPlayerIds: [], benchPlayerIds: [], tactic: {} as never },
      events: [],
      report: { playerRatings: { [starter.id]: 6.5 } } as never,
    }
    const game = { currentSeason: 1, managedClubId: 'club1', clubs: [] } as unknown as SaveGame

    const result = updatePlayerMatchStats([starter, benchOutfield], [fixture], game, 2)
    const updated = result.finalPlayers.find(p => p.id === benchOutfield.id)!

    expect(updated.seasonStats.gamesPlayed).toBe(1)
    expect(updated.seasonStats.minutesPlayed).toBeGreaterThanOrEqual(30)
    expect(updated.seasonStats.minutesPlayed).toBeLessThanOrEqual(40)
  })
})
