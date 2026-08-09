/**
 * SLUTTEST 2026-08-08, punkt 1: matchCore.ts läser bara fixture.isNeutralVenue
 * för att nolla hemmafördel — fram till cupService.ts:s isNeutralVenue-fix (samma
 * runda) satte bara playoffService.ts den flaggan (SM-finalen). Cupens semi och
 * final visades som "neutral plan" i portalen men simulerades med full
 * hemmafördel. Detta test bekräftar mekanismen statistiskt: jämnstarka lag på
 * isNeutralVenue-fixtures ska ge ~50/50 hemma/borta-utfall, medan samma lag på
 * en vanlig fixture ska visa den kalibrerade hemmafördelen (homeAdvantage=0.14).
 */
import { describe, it, expect } from 'vitest'
import { simulateFirstHalf, simulateSecondHalf } from '../matchCore'
import type { Player } from '../../entities/Player'
import type { Fixture, TeamSelection } from '../../entities/Fixture'
import {
  PlayerPosition,
  PlayerArchetype,
  FixtureStatus,
  TacticMentality,
  TacticTempo,
  TacticPress,
  TacticPassingRisk,
  TacticWidth,
  TacticAttackingFocus,
  CornerStrategy,
  PenaltyKillStyle,
} from '../../enums'
import type { Tactic } from '../../entities/Club'

const DEFAULT_TACTIC: Tactic = {
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

function makePlayer(id: string, position: PlayerPosition, clubId: string, ca = 65): Player {
  const attrs = ca
  return {
    id, firstName: 'Test', lastName: 'Spelare', age: 25, nationality: 'SE', clubId,
    isHomegrown: true, position,
    archetype: position === PlayerPosition.Goalkeeper ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 10000, contractUntilSeason: 2028, marketValue: 100000,
    morale: 75, form: 75, fitness: 75, sharpness: 75,
    currentAbility: ca, potentialAbility: ca + 10, developmentRate: 50, injuryProneness: 30, discipline: 70,
    attributes: {
      skating: attrs, acceleration: attrs, stamina: attrs, ballControl: attrs,
      passing: attrs, shooting: attrs, dribbling: attrs, vision: attrs,
      decisions: attrs, workRate: attrs, positioning: attrs, defending: attrs,
      cornerSkill: attrs,
      goalkeeping: position === PlayerPosition.Goalkeeper ? attrs + 15 : Math.max(1, attrs - 15),
      cornerRecovery: 50,
    },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 6.5, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 1 },
  }
}

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
  return { startingPlayerIds: players.map(p => p.id), benchPlayerIds: [], tactic: DEFAULT_TACTIC }
}

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'fixture_neutral_test', leagueId: 'league_1', season: 2026,
    roundNumber: 13, matchday: 13, homeClubId: 'club1', awayClubId: 'club2',
    status: FixtureStatus.Scheduled, homeScore: 0, awayScore: 0, events: [],
    ...overrides,
  }
}

function runMatch(fixture: Fixture, homeLineup: TeamSelection, awayLineup: TeamSelection, homePlayers: Player[], awayPlayers: Player[], seed: number) {
  // Ingen homeAdvantage-override i input — motorns default (0.14) gäller om inte
  // fixture.isNeutralVenue nollar den internt. Detta är exakt vad testet mäter.
  const input = { fixture, homeLineup, awayLineup, homePlayers, awayPlayers, seed, mode: 'fast' as const }

  let fh: ReturnType<typeof simulateFirstHalf> extends Generator<infer S> ? S | null : never = null as never
  for (const step of simulateFirstHalf(input)) fh = step

  const secondHalfInput = {
    ...input,
    initialHomeScore: fh?.homeScore ?? 0,
    initialAwayScore: fh?.awayScore ?? 0,
    initialShotsHome: fh?.shotsHome ?? 0,
    initialShotsAway: fh?.shotsAway ?? 0,
    initialOnTargetHome: fh?.onTargetHome ?? 0,
    initialOnTargetAway: fh?.onTargetAway ?? 0,
    initialCornersHome: fh?.cornersHome ?? 0,
    initialCornersAway: fh?.cornersAway ?? 0,
    initialHomeSuspensions: fh?.activeSuspensions?.homeCount ?? 0,
    initialAwaySuspensions: fh?.activeSuspensions?.awayCount ?? 0,
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let last: any = null
  for (const step of simulateSecondHalf(secondHalfInput)) last = step
  const final = last ?? fh
  return { homeScore: final?.homeScore ?? 0, awayScore: final?.awayScore ?? 0 }
}

describe('hemmafördel på neutral plan (SLUTTEST punkt 1)', () => {
  const homePlayers = makeSquad('h', 'club1')
  const awayPlayers = makeSquad('a', 'club2')
  const homeLineup = makeSelection(homePlayers)
  const awayLineup = makeSelection(awayPlayers)
  const N = 800

  it('cupsemifinal (isNeutralVenue=true) ger ~50/50 hemma/borta för jämnstarka lag', () => {
    const fixture = makeFixture({ isCup: true, isCupFinalhelgen: true, isNeutralVenue: true, roundNumber: 3 })
    let homeGoals = 0, awayGoals = 0, homeWins = 0, n = 0
    for (let i = 0; i < N; i++) {
      const { homeScore, awayScore } = runMatch(fixture, homeLineup, awayLineup, homePlayers, awayPlayers, i * 31 + 7)
      homeGoals += homeScore; awayGoals += awayScore
      if (homeScore > awayScore) homeWins++
      if (homeScore !== awayScore) n++
    }
    const homeWinShare = homeWins / n
    // Jämn styrka + noll hemmafördel ska ge en vinstandel nära 50%. Bred tolerans
    // (±8pp) — det här är ett mekanism-test, inte en kalibreringsassertion.
    expect(homeWinShare).toBeGreaterThan(0.42)
    expect(homeWinShare).toBeLessThan(0.58)
    // Målsnittet ska också vara symmetriskt, inte skevt mot hemmalaget.
    expect(Math.abs(homeGoals - awayGoals) / (homeGoals + awayGoals)).toBeLessThan(0.08)
  })

  it('vanlig ligamatch (isNeutralVenue ej satt) ger mätbar hemmafördel för samma lag', () => {
    const fixture = makeFixture()
    let homeWins = 0, n = 0
    for (let i = 0; i < N; i++) {
      const { homeScore, awayScore } = runMatch(fixture, homeLineup, awayLineup, homePlayers, awayPlayers, i * 31 + 7)
      if (homeScore > awayScore) homeWins++
      if (homeScore !== awayScore) n++
    }
    const homeWinShare = homeWins / n
    // Samma seed-serie som testet ovan, enda skillnaden är isNeutralVenue — om
    // motorn inte läste flaggan skulle båda testerna ge samma andel. Här ska
    // hemmalaget vinna oftare (kalibrerad homeAdvantage=0.14 är ett modest
    // tillägg, inte en dominerande effekt — tröskeln är satt strax över 50%,
    // tydligt skild från neutral-testernas 42-58%-band, inte mot en exakt
    // säsongskalibrering).
    expect(homeWinShare).toBeGreaterThan(0.51)
  })

  it('SM-finalens neutrala beteende (isNeutralVenue satt av playoffService) är oförändrat', () => {
    // Samma mekanism som cuptestet ovan, men med de flaggor playoffService.ts
    // faktiskt sätter på SM-finalen (isFinaldag, inte isCup/isCupFinalhelgen) —
    // bekräftar att fixet inte råkat smalna av matchCore.ts:s villkor till att
    // bara gälla cup-fixtures.
    const fixture = makeFixture({ isFinaldag: true, isNeutralVenue: true, roundNumber: 37 })
    let homeWins = 0, n = 0
    for (let i = 0; i < N; i++) {
      const { homeScore, awayScore } = runMatch(fixture, homeLineup, awayLineup, homePlayers, awayPlayers, i * 31 + 7)
      if (homeScore > awayScore) homeWins++
      if (homeScore !== awayScore) n++
    }
    const homeWinShare = homeWins / n
    expect(homeWinShare).toBeGreaterThan(0.42)
    expect(homeWinShare).toBeLessThan(0.58)
  })
})
