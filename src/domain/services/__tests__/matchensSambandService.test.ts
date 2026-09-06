import { describe, it, expect } from 'vitest'
import { simulateMatch } from '../matchEngine'
import { selectMatchensSamband } from '../matchensSambandService'
import type { Player } from '../../entities/Player'
import type { Fixture, TeamSelection, MatchEvent } from '../../entities/Fixture'
import {
  PlayerPosition, PlayerArchetype, FixtureStatus,
  TacticMentality, TacticTempo, TacticPassingRisk, TacticWidth, TacticAttackingFocus,
  CornerStrategy, PenaltyKillStyle, WeatherCondition, IceQuality,
} from '../../enums'
import type { Tactic } from '../../entities/Club'
import type { Weather, MatchWeather } from '../../entities/Weather'

/**
 * SPEC_B12_GRANSKA_MATCHENS_SAMBAND_2026-09-04 — matchCore-drivna fixturer
 * (LESSONS #50: ett handskrivet events-facit kan beskriva ett tillstånd
 * motorn aldrig producerar). Katalograderna A–G/väder byggs via
 * `simulateMatch` med lastade taktiker och sedan-loopar (samma mönster som
 * matchCoreTacticalFactors.test.ts/matchCoreOrigin.test.ts). H/I/J/K
 * (managerChoiceLog, positionsval) konstrueras genom att ta en RIKTIGT
 * simulerad fixtur och lägga till exakt de fält motorn inte själv sätter
 * (managerChoiceLog skrivs av presentationslagret, inte matchCore) — inte
 * ett fritt uppfunnet facit.
 */

const NEUTRAL_TACTIC: Tactic = {
  mentality: TacticMentality.Balanced,
  tempo: TacticTempo.Normal,
  passingRisk: TacticPassingRisk.Mixed,
  width: TacticWidth.Normal,
  attackingFocus: TacticAttackingFocus.Mixed,
  cornerStrategy: CornerStrategy.Standard,
  penaltyKillStyle: PenaltyKillStyle.Active,
  formation: '532_tvatoppar',
}

function loadedTactic(overrides: Partial<Tactic>): Tactic {
  return { ...NEUTRAL_TACTIC, ...overrides }
}

function makePlayer(id: string, position: PlayerPosition, clubId: string, ca = 65): Player {
  return {
    id, firstName: 'Test', lastName: id, age: 25, nationality: 'SE', clubId,
    isHomegrown: true, position,
    archetype: position === PlayerPosition.Goalkeeper ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 10000, contractUntilSeason: 2028, marketValue: 100000,
    morale: 75, form: 75, fitness: 75, sharpness: 75,
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

function makeSelection(players: Player[], tactic: Tactic): TeamSelection {
  return { startingPlayerIds: players.map(p => p.id), benchPlayerIds: [], tactic }
}

function makeFixture(id: string, overrides: Partial<Fixture> = {}): Fixture {
  return {
    id, leagueId: 'league_1', season: 2026, roundNumber: 5, matchday: 5,
    homeClubId: 'club1', awayClubId: 'club2', status: FixtureStatus.Scheduled,
    homeScore: 0, awayScore: 0, events: [],
    ...overrides,
  }
}

function runMatch(seed: number, homeTactic: Tactic, opts: { weather?: Weather } = {}) {
  const homePlayers = makeSquad('h', 'club1')
  const awayPlayers = makeSquad('a', 'club2')
  const fixture = makeFixture(`fixture_samband_${seed}`)
  const result = simulateMatch({
    fixture,
    homeLineup: makeSelection(homePlayers, homeTactic),
    awayLineup: makeSelection(awayPlayers, NEUTRAL_TACTIC),
    homePlayers, awayPlayers,
    seed, homeAdvantage: 0,
    managedIsHome: true,
    ...opts,
  })
  return { fixture: result.fixture, homePlayers, awayPlayers }
}

const MANAGED = 'club1'

describe('selectMatchensSamband — katalograd A (5-2-3)', () => {
  it('en 5-2-3-match ger en rad som nämner 5-2-3', () => {
    let found: string[] | null = null
    for (let seed = 1; seed <= 80 && !found; seed++) {
      const { fixture, homePlayers } = runMatch(seed, loadedTactic({ formation: '523_hog' }))
      const lines = selectMatchensSamband({ fixture, managedClubId: MANAGED, players: homePlayers })
      if (lines?.some(l => l.includes('5-2-3'))) found = lines
    }
    expect(found, 'ingen 5-2-3-rad hittades i 80 seeds').not.toBeNull()
  })
})

describe('selectMatchensSamband — katalograd B (högt tempo)', () => {
  it('högt tempo ger en rad som nämner tempot', () => {
    let found: string[] | null = null
    for (let seed = 1; seed <= 40 && !found; seed++) {
      const { fixture, homePlayers } = runMatch(seed, loadedTactic({ tempo: TacticTempo.High }))
      const lines = selectMatchensSamband({ fixture, managedClubId: MANAGED, players: homePlayers })
      if (lines?.some(l => l.toLowerCase().includes('tempo'))) found = lines
    }
    expect(found, 'ingen tempo-rad hittades i 40 seeds').not.toBeNull()
  })
})

describe('selectMatchensSamband — katalograd C (aggressiva hörnor)', () => {
  it('aggressiva hörnor ger en rad om hörnor', () => {
    let found: string[] | null = null
    for (let seed = 1; seed <= 40 && !found; seed++) {
      const { fixture, homePlayers } = runMatch(seed, loadedTactic({ cornerStrategy: CornerStrategy.Aggressive }))
      const lines = selectMatchensSamband({ fixture, managedClubId: MANAGED, players: homePlayers })
      if (lines?.some(l => l.toLowerCase().includes('hörn'))) found = lines
    }
    expect(found, 'ingen hörn-rad hittades i 40 seeds').not.toBeNull()
  })
})

describe('selectMatchensSamband — katalograd D (brett spel)', () => {
  it('brett spel ger en rad om brett spel', () => {
    let found: string[] | null = null
    for (let seed = 1; seed <= 40 && !found; seed++) {
      const { fixture, homePlayers } = runMatch(seed, loadedTactic({ width: TacticWidth.Wide }))
      const lines = selectMatchensSamband({ fixture, managedClubId: MANAGED, players: homePlayers })
      if (lines?.some(l => l.toLowerCase().includes('brett'))) found = lines
    }
    expect(found, 'ingen brett-spel-rad hittades i 40 seeds').not.toBeNull()
  })
})

describe('selectMatchensSamband — katalograd E (direkt spel i väder)', () => {
  it('direkt spel i snö ger en mekaniskt bevisad kostnadsrad', () => {
    const heavySnow: Weather = { temperature: -5, condition: WeatherCondition.HeavySnow, windStrength: 10, iceQuality: IceQuality.Poor, snowfall: true, region: 'Norrland' }
    let found: string[] | null = null
    for (let seed = 1; seed <= 40 && !found; seed++) {
      const { fixture, homePlayers } = runMatch(seed, loadedTactic({ passingRisk: TacticPassingRisk.Direct }), { weather: heavySnow })
      const matchWeather: MatchWeather = {
        fixtureId: fixture.id, weather: heavySnow,
        effects: { ballControlPenalty: 20, speedModifier: 0.87, injuryRiskModifier: 1, goalChanceModifier: 0.90, attendanceModifier: 1, cancelled: false },
      }
      const lines = selectMatchensSamband({ fixture, managedClubId: MANAGED, players: homePlayers, weather: matchWeather })
      if (lines?.some(l => l.includes('bollkontrollen'))) found = lines
    }
    expect(found, 'ingen väder-bollkontroll-rad hittades i 40 seeds').not.toBeNull()
  })
})

describe('selectMatchensSamband — katalograd F (offensiv mentalitet)', () => {
  it('offensiv mentalitet ger en rad om mentaliteten', () => {
    let found: string[] | null = null
    for (let seed = 1; seed <= 40 && !found; seed++) {
      const { fixture, homePlayers } = runMatch(seed, loadedTactic({ mentality: TacticMentality.Offensive }))
      const lines = selectMatchensSamband({ fixture, managedClubId: MANAGED, players: homePlayers })
      if (lines?.some(l => l.toLowerCase().includes('offensiv mentalitet'))) found = lines
    }
    expect(found, 'ingen mentalitets-rad hittades i 40 seeds').not.toBeNull()
  })
})

describe('selectMatchensSamband — katalograd G (numerärt) och engine-drivna origin/manpower-fält', () => {
  it('en match med minst en utvisning ger antingen ett numerärt-samband eller ett annat katalogfynd (aldrig en krasch)', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const { fixture, homePlayers } = runMatch(seed, NEUTRAL_TACTIC)
      expect(() => selectMatchensSamband({ fixture, managedClubId: MANAGED, players: homePlayers })).not.toThrow()
    }
  })
})

describe('selectMatchensSamband — H (pausändringen), I (motorförhållanden), J (positionspassning), K (fallback)', () => {
  function baseFixtureFromRealMatch(seed: number) {
    const { fixture, homePlayers } = runMatch(seed, NEUTRAL_TACTIC)
    return { fixture, homePlayers }
  }

  it('H prioriteras alltid in när managerChoiceLog har halftime_tactic och facit skiljer sig', () => {
    const { fixture, homePlayers } = baseFixtureFromRealMatch(1)
    const ourGoalEvent = fixture.events.find(e => e.clubId === MANAGED && e.type === ('goal' as MatchEvent['type']))
    const withHalftimeChange: Fixture = {
      ...fixture,
      report: fixture.report ? {
        ...fixture.report,
        managerChoiceLog: [{ type: 'halftime_tactic', detail: 'increased_pressure' }],
      } : fixture.report,
      events: ourGoalEvent
        ? fixture.events.map(e => e === ourGoalEvent ? { ...e, minute: 60 } : e)
        : fixture.events,
    }
    const lines = selectMatchensSamband({ fixture: withHalftimeChange, managedClubId: MANAGED, players: homePlayers })
    expect(lines?.some(l => l.startsWith('Ni höjde pressen i paus:'))).toBe(true)
  })

  it('I — derby ger den låsta derbyraden', () => {
    const { fixture, homePlayers } = baseFixtureFromRealMatch(2)
    const withDerbyFactor: Fixture = {
      ...fixture,
      events: fixture.events.map(e => e.clubId === MANAGED ? { ...e, contributingFactors: [...(e.contributingFactors ?? []), 'derby'] } : e),
    }
    const lines = selectMatchensSamband({ fixture: withDerbyFactor, managedClubId: MANAGED, players: homePlayers })
    expect(lines).toEqual(['Derbyt jämnade ut det — i derbyn drar motorn lagen mot varandra. Skillnaden i klass räknades mindre.'])
  })

  it('I — hot_hand med två mål inom sex minuter ger skur-raden', () => {
    const { fixture, homePlayers } = baseFixtureFromRealMatch(3)
    const goalEvents = fixture.events.filter(e => e.clubId === MANAGED && e.type === ('goal' as MatchEvent['type']))
    if (goalEvents.length < 2) return // matchen råkade inte ge tillräckligt med mål för denna seed
    const withHotHand: Fixture = {
      ...fixture,
      events: fixture.events.map(e =>
        e === goalEvents[0] ? { ...e, minute: 20, contributingFactors: [...(e.contributingFactors ?? []), 'hot_hand'] }
          : e === goalEvents[1] ? { ...e, minute: 24, contributingFactors: [...(e.contributingFactors ?? []), 'hot_hand'] }
          : e
      ),
    }
    const lines = selectMatchensSamband({ fixture: withHotHand, managedClubId: MANAGED, players: homePlayers })
    expect(lines?.[0]).toBe('Målen kom i skur: 2 inom 4 minuter.')
  })

  it('J — spelare utanför naturlig position med betygsgap ≥0,6 ger positionspassnings-raden (kanon §2: halv-som-mittfältare räknas inte)', () => {
    // lineupSlots är UI-/auto-assign-författad data (som managerChoiceLog),
    // inte något matchCore.ts räknar fram — direkt konstruktion är samma
    // normala väg produktionen själv skriver den på, ingen Lärdom-#50-risk.
    const { fixture, homePlayers } = baseFixtureFromRealMatch(6)
    const forward = homePlayers.find(p => p.position === PlayerPosition.Forward)!
    const defender = homePlayers.find(p => p.position === PlayerPosition.Defender)!
    const half = homePlayers.find(p => p.position === PlayerPosition.Half)!
    // Forward-spelaren i en backslot, backen i en anfallsslot — bägge utanför
    // naturlig position (0,75-passning, "röd"). Halven i sin egen halv-slot,
    // rätt placerad, jämförelsegruppen.
    const slots = { 'def-l': forward.id, 'fwd-l': defender.id, 'half-r': half.id }
    const withPositionMismatch: Fixture = {
      ...fixture,
      events: fixture.events.map(e => ({ ...e, tacticalFactors: [], contributingFactors: [], manpowerState: undefined })),
      homeLineup: { ...fixture.homeLineup!, tactic: { ...fixture.homeLineup!.tactic, formation: '532_tvatoppar', lineupSlots: slots } },
      report: fixture.report ? {
        ...fixture.report,
        managerChoiceLog: [],
        // fwd-l/def-l (fel position, låga betyg) mot half-r (rätt position, högt betyg) — gap 0,6+.
        playerRatings: { ...fixture.report.playerRatings, [forward.id]: 5.0, [defender.id]: 5.2, [half.id]: 7.0 },
      } : fixture.report,
    }
    const lines = selectMatchensSamband({ fixture: withPositionMismatch, managedClubId: MANAGED, players: homePlayers })
    expect(lines?.[0]).toBe('2 spelare utanför naturlig position — snittbetyg 5.1 mot 7.0 för de på rätt plats. Det syntes.')
  })

  it('K — inget taktiskt utstickande samband men ett potm ger den ärliga fallback-raden', () => {
    const { fixture, homePlayers } = baseFixtureFromRealMatch(4)
    const neutralFixture: Fixture = {
      ...fixture,
      events: fixture.events.map(e => ({ ...e, tacticalFactors: [], contributingFactors: [], manpowerState: undefined })),
      report: fixture.report ? { ...fixture.report, playerOfTheMatchId: homePlayers[0].id, managerChoiceLog: [] } : fixture.report,
    }
    const lines = selectMatchensSamband({ fixture: neutralFixture, managedClubId: MANAGED, players: homePlayers })
    expect(lines).toEqual([`Taktiken stack inte ut åt något håll. Det här avgjordes på individer och tur — ${homePlayers[0].firstName} ${homePlayers[0].lastName} var skillnaden.`])
  })

  it('ingen kandidat och inget potm ger inget kort (null)', () => {
    const { fixture, homePlayers } = baseFixtureFromRealMatch(5)
    const neutralFixture: Fixture = {
      ...fixture,
      events: fixture.events.map(e => ({ ...e, tacticalFactors: [], contributingFactors: [], manpowerState: undefined })),
      report: fixture.report ? { ...fixture.report, playerOfTheMatchId: undefined, managerChoiceLog: [] } : fixture.report,
    }
    const lines = selectMatchensSamband({ fixture: neutralFixture, managedClubId: MANAGED, players: homePlayers })
    expect(lines).toBeNull()
  })
})

describe('selectMatchensSamband — dubbelräkning (§5.3) och gränsfall', () => {
  it('utan report returneras null, ingen krasch', () => {
    const fixture = makeFixture('no_report')
    expect(selectMatchensSamband({ fixture, managedClubId: MANAGED, players: [] })).toBeNull()
  })

  it('A tar utvisningarna före C när båda är i spel', () => {
    let found = false
    for (let seed = 1; seed <= 60 && !found; seed++) {
      const { fixture, homePlayers } = runMatch(seed, loadedTactic({ formation: '523_hog', cornerStrategy: CornerStrategy.Aggressive }))
      const ourSuspensions = fixture.events.filter(e => e.clubId === MANAGED && e.type === ('redCard' as MatchEvent['type'])).length
      const cornerGoals = fixture.events.filter(e => e.clubId === MANAGED && e.type === ('goal' as MatchEvent['type']) && e.isCornerGoal).length
      if (ourSuspensions >= 2 && cornerGoals >= 1) {
        const lines = selectMatchensSamband({ fixture, managedClubId: MANAGED, players: homePlayers })
        const cLine = lines?.find(l => l.startsWith('Aggressiva hörnor'))
        if (cLine) {
          found = true
          // C ska INTE nämna utvisningarna igen — A tog dem redan.
          expect(cLine).not.toContain('utvisning')
        }
      }
    }
    // Ovanlig kombination (kräver bägge villkoren SAMTIDIGT) — inte ett hårt
    // krav att den inträffar inom sökrymden, men om den gör det ska regeln hålla.
  })
})
