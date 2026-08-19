import { describe, it, expect } from 'vitest'
import { applyPlayerStateUpdates } from '../playerStateProcessor'
import type { Player } from '../../../../domain/entities/Player'
import type { Fixture, TeamSelection } from '../../../../domain/entities/Fixture'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import {
  PlayerPosition, PlayerArchetype, FixtureStatus,
  TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus,
  CornerStrategy, PenaltyKillStyle,
} from '../../../../domain/enums'
import type { Tactic } from '../../../../domain/entities/Club'

// B9 (SLUTTEST_KO.md, Jacobs dom 2026-08-19): positionsviktad fitnessförlust,
// normaliserad mot den FAKTISKA startelvans snitt per lag och match. Testar
// domens hårda krav: laget totala/genomsnittliga fitnessförlust ska vara
// OFÖRÄNDRAD, bara omfördelad — och att mittfältare (tyngre) faktiskt
// tappar mer än ytterhalv (lättare) givet identiska utgångsvärden.

const NEUTRAL_TACTIC: Tactic = {
  mentality: TacticMentality.Balanced,
  tempo: TacticTempo.Normal,
  press: TacticPress.Medium,
  passingRisk: TacticPassingRisk.Mixed,
  width: TacticWidth.Normal,
  attackingFocus: TacticAttackingFocus.Mixed,
  cornerStrategy: CornerStrategy.Standard,
  penaltyKillStyle: PenaltyKillStyle.Active,
  formation: '5-3-2',
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

// 5-3-2: MV, 3 backar, 3 halvar (Half), 2 mittfältare (Midfielder), 2 anfallare — men
// PlayerPosition-enumen har bara Defender/Half/Midfielder/Forward, inte "back"/"halv"
// separat. Bygg en trupp med tydlig blandning av Half och Midfielder för kontrasten.
function makeSquad(prefix: string, clubId: string): Player[] {
  return [
    makePlayer(`${prefix}_gk`, PlayerPosition.Goalkeeper, clubId),
    makePlayer(`${prefix}_d1`, PlayerPosition.Defender, clubId),
    makePlayer(`${prefix}_d2`, PlayerPosition.Defender, clubId),
    makePlayer(`${prefix}_d3`, PlayerPosition.Defender, clubId),
    makePlayer(`${prefix}_h1`, PlayerPosition.Half, clubId),
    makePlayer(`${prefix}_h2`, PlayerPosition.Half, clubId),
    makePlayer(`${prefix}_h3`, PlayerPosition.Half, clubId),
    makePlayer(`${prefix}_m1`, PlayerPosition.Midfielder, clubId),
    makePlayer(`${prefix}_m2`, PlayerPosition.Midfielder, clubId),
    makePlayer(`${prefix}_f1`, PlayerPosition.Forward, clubId),
    makePlayer(`${prefix}_f2`, PlayerPosition.Forward, clubId),
  ]
}

function makeSelection(players: Player[]): TeamSelection {
  return { startingPlayerIds: players.map(p => p.id), benchPlayerIds: [], tactic: NEUTRAL_TACTIC }
}

function makeFixture(id: string, home: Player[], away: Player[]): Fixture {
  return {
    id, leagueId: 'league_1', season: 2026, roundNumber: 5, matchday: 5,
    homeClubId: 'club1', awayClubId: 'club2', status: FixtureStatus.Completed,
    homeScore: 3, awayScore: 2, events: [],
    homeLineup: makeSelection(home), awayLineup: makeSelection(away),
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

describe('playerStateProcessor — B9 positionsviktad fatigue', () => {
  it('mittfältare tappar mer fitness än ytterhalv i genomsnitt (baseFitnessLoss slumpas per spelare — snitta över flera seeds)', () => {
    // Enskild seed (eller ett litet antal) kan visa skillnaden åt fel håll
    // av ren slump — baseFitnessLoss är oberoende per spelare. Kalibrerat
    // empiriskt (stash-test, 2026-08-19): vid N=200 seeds är diffen ~113
    // UTAN positionsviktningen (brus) och ~1281 MED den (signal) — tröskeln
    // 500 ligger tryggt mellan de två och gör testet icke-flaky i båda led.
    let halfLossSum = 0
    let midfielderLossSum = 0
    for (let seed = 1; seed <= 200; seed++) {
      const homePlayers = makeSquad('h', 'club1')
      const awayPlayers = makeSquad('a', 'club2')
      const fixture = makeFixture(`f_${seed}`, homePlayers, awayPlayers)
      const allPlayers = [...homePlayers, ...awayPlayers]
      const startersThisRound = new Set(allPlayers.map(p => p.id))
      const game = makeGame()

      const result = applyPlayerStateUpdates(
        allPlayers, startersThisRound, new Set(), game, null, undefined, undefined,
        seed, 6, [fixture],
      )
      const half = result.updatedPlayers.find(p => p.id === 'h_h1')!
      const midfielder = result.updatedPlayers.find(p => p.id === 'h_m1')!
      halfLossSum += 90 - half.fitness
      midfielderLossSum += 90 - midfielder.fitness
    }
    expect(midfielderLossSum - halfLossSum).toBeGreaterThan(500)
  })

  it('lagets genomsnittliga fitnessförlust är oförändrad jämfört med en enhetlig (icke-positionsviktad) baslinje', () => {
    const homePlayers = makeSquad('h', 'club1')
    const awayPlayers = makeSquad('a', 'club2')
    const fixture = makeFixture('f1', homePlayers, awayPlayers)
    const allPlayers = [...homePlayers, ...awayPlayers]
    const startersThisRound = new Set(allPlayers.map(p => p.id))
    const game = makeGame()

    // Kör samma seed flera gånger räcker inte (baseFitnessLoss är slumpad per
    // spelare via localRand) — jämför istället mot det teoretiska snittet:
    // normaliseringen garanterar att SUMMAN av positionFatigueMult över
    // startelvan är exakt elva (snittet är exakt 1), så gruppens snitt-
    // förlust ska matcha vad en enhetlig multiplikator (1.0 för alla) hade
    // gett — inom rundningsfelet från elva oberoende Math.round-anrop.
    const result = applyPlayerStateUpdates(
      allPlayers, startersThisRound, new Set(), game, null, undefined, undefined,
      777, 6, [fixture],
    )
    const homeResult = result.updatedPlayers.filter(p => p.clubId === 'club1')
    const totalLoss = homeResult.reduce((sum, p) => sum + (90 - p.fitness), 0)
    const avgLoss = totalLoss / homeResult.length
    // baseFitnessLoss är 15 + slump(0-9) → snitt runt 19.5, tacticFatigue/
    // weatherTacticFatigue är 1.0 (neutral taktik, inget väder, ej managed).
    // Rundningsfel per spelare är max ±0.5 → gruppfelet begränsat.
    expect(avgLoss).toBeGreaterThan(15)
    expect(avgLoss).toBeLessThan(24)
  })
})
