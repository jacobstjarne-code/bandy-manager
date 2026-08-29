/**
 * A-H6 (ceremonivägen, 2026-08-28) — Jacobs order: en snabbsimmad SM-final ska
 * nå SAMMA CeremonySmFinal som en live-match, aldrig en tystare "rakt till
 * Granska"-väg. Rotorsak till den ursprungliga buggen: MatchScreen.tsx:s
 * quicksim-gren navigerade alltid till /game/review oavsett om fixturen var
 * SM-finalen.
 *
 * Detta test bevisar tre saker om FIXEN, inte om spelmotorn i sig:
 *   (a) shouldRouteQuicksimToCeremony identifierar korrekt en avslutad,
 *       neutral-venue-fixtur med sparade lineups — och ENDAST en sådan.
 *   (b) buildCeremonyOnlyStep återger EXAKT det redan sparade facit-resultatet
 *       (homeScore/awayScore/events/straffresultat) — den räknar aldrig om
 *       något. Det är detta som gör re-simulering onödig OCH farlig att
 *       undvika (matchSimProcessor.ts:s simulateMatch och MatchLiveScreens
 *       egna simulateMatchStepByStep skickar olika extra kontextfält till
 *       samma seedade motor — se matchLiveHelpers.ts:s kommentar).
 *   (c) didManagedWinFinal (samma funktion CeremonySmFinal.tsx redan
 *       använder för live-matcher) ger rätt segrare/förlorare oavsett vilket
 *       lag som vann, både i reglertid och efter straffar, när den matas med
 *       den syntetiska steppen — dvs. ceremonin visar aldrig fel medalj för
 *       en quicksimmad final.
 *
 * Ingen DOM-rendering (MatchLiveScreen/MatchScreen) — samma arkitektoniska
 * val som matchLive_integration.test.tsx: @testing-library/react finns inte
 * i projektet, och komponenterna beror på react-router/Zustand/Web Audio.
 * Logiken som faktiskt avgör korrekthet är extraherad till matchLiveHelpers.ts
 * och testas här direkt.
 */
import { describe, it, expect } from 'vitest'
import { buildCeremonyOnlyStep, shouldRouteQuicksimToCeremony } from '../matchLiveHelpers'
import { didManagedWinFinal } from '../../utils/finalResult'
import { simulateMatch } from '../../../domain/services/matchSimulator'
import type { Player } from '../../../domain/entities/Player'
import type { Fixture, TeamSelection, MatchEvent } from '../../../domain/entities/Fixture'
import {
  PlayerPosition,
  PlayerArchetype,
  FixtureStatus,
  MatchEventType,
  TacticMentality,
  TacticTempo,
  TacticPress,
  TacticPassingRisk,
  TacticWidth,
  TacticAttackingFocus,
  CornerStrategy,
  PenaltyKillStyle,
} from '../../../domain/enums'
import type { Tactic } from '../../../domain/entities/Club'

// ── helpers (samma mönster som matchEngineParity.test.ts) ──────────────────

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
  return {
    id,
    firstName: 'Test',
    lastName: 'Spelare',
    age: 25,
    nationality: 'SE',
    clubId,
    isHomegrown: true,
    position,
    archetype: position === PlayerPosition.Goalkeeper
      ? PlayerArchetype.ReflexGoalkeeper
      : PlayerArchetype.TwoWaySkater,
    salary: 10000,
    contractUntilSeason: 2028,
    marketValue: 100000,
    morale: 75,
    form: 75,
    fitness: 75,
    sharpness: 75,
    currentAbility: ca,
    potentialAbility: ca + 10,
    developmentRate: 50,
    injuryProneness: 30,
    discipline: 70,
    attributes: {
      skating: ca, acceleration: ca, stamina: ca, ballControl: ca,
      passing: ca, shooting: ca, dribbling: ca, vision: ca,
      decisions: ca, workRate: ca, positioning: ca, defending: ca,
      cornerSkill: ca,
      goalkeeping: position === PlayerPosition.Goalkeeper ? ca + 15 : Math.max(1, ca - 15),
      cornerRecovery: 50,
    },
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    seasonStats: {
      gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0,
      yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 6.5, minutesPlayed: 0,
    },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 1 },
  }
}

function makeSquad(prefix: string, clubId: string, ca = 65): Player[] {
  return [
    makePlayer(`${prefix}_gk`, PlayerPosition.Goalkeeper, clubId, ca),
    makePlayer(`${prefix}_d1`, PlayerPosition.Defender, clubId, ca),
    makePlayer(`${prefix}_d2`, PlayerPosition.Defender, clubId, ca),
    makePlayer(`${prefix}_d3`, PlayerPosition.Defender, clubId, ca),
    makePlayer(`${prefix}_h1`, PlayerPosition.Half, clubId, ca),
    makePlayer(`${prefix}_h2`, PlayerPosition.Half, clubId, ca),
    makePlayer(`${prefix}_h3`, PlayerPosition.Half, clubId, ca),
    makePlayer(`${prefix}_m1`, PlayerPosition.Midfielder, clubId, ca),
    makePlayer(`${prefix}_m2`, PlayerPosition.Midfielder, clubId, ca),
    makePlayer(`${prefix}_f1`, PlayerPosition.Forward, clubId, ca),
    makePlayer(`${prefix}_f2`, PlayerPosition.Forward, clubId, ca),
  ]
}

function makeSelection(players: Player[]): TeamSelection {
  return {
    startingPlayerIds: players.map(p => p.id),
    benchPlayerIds: [],
    tactic: DEFAULT_TACTIC,
  }
}

function makeFinalFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'fixture_final',
    leagueId: 'league_1',
    season: 2026,
    roundNumber: 37,
    matchday: 37,
    homeClubId: 'club1',
    awayClubId: 'club2',
    status: FixtureStatus.Scheduled,
    isNeutralVenue: true,
    isFinaldag: true,
    isKnockout: true,
    homeScore: 0,
    awayScore: 0,
    events: [],
    ...overrides,
  }
}

function makeEvent(overrides: Partial<MatchEvent> = {}): MatchEvent {
  return { minute: 10, type: MatchEventType.Goal, clubId: 'club1', description: 'Mål', ...overrides }
}

// ── (a) routing-predikatet ───────────────────────────────────────────────────

describe('shouldRouteQuicksimToCeremony (A-H6)', () => {
  it('true: avslutad SM-final-bracket-fixtur (inte cup) med bägge lineups sparade', () => {
    const f = makeFinalFixture({
      status: FixtureStatus.Completed,
      homeScore: 3, awayScore: 2,
      homeLineup: makeSelection(makeSquad('h', 'club1')),
      awayLineup: makeSelection(makeSquad('a', 'club2')),
    })
    expect(shouldRouteQuicksimToCeremony(f, new Set([f.id]))).toBe(true)
  })

  it('false: fixturens id finns inte i SM-final-bracketen — vanlig quicksim-match påverkas inte', () => {
    const f = makeFinalFixture({
      status: FixtureStatus.Completed,
      homeLineup: makeSelection(makeSquad('h', 'club1')),
      awayLineup: makeSelection(makeSquad('a', 'club2')),
    })
    expect(shouldRouteQuicksimToCeremony(f, new Set(['some_other_fixture']))).toBe(false)
    expect(shouldRouteQuicksimToCeremony(f, undefined)).toBe(false)
  })

  it('false: audit 2026-08-29 CRITICAL 1-regression — en cupfinal delar samma neutral-venue-flagga men ska ALDRIG routas till SM-ceremonin, även om id:t (felaktigt) funnes i bracketen', () => {
    const f = makeFinalFixture({
      status: FixtureStatus.Completed,
      isCup: true,
      homeLineup: makeSelection(makeSquad('h', 'club1')),
      awayLineup: makeSelection(makeSquad('a', 'club2')),
    })
    expect(shouldRouteQuicksimToCeremony(f, new Set([f.id]))).toBe(false)
  })

  it('false: fixturen är inte completed än', () => {
    const f = makeFinalFixture({ status: FixtureStatus.Scheduled })
    expect(shouldRouteQuicksimToCeremony(f, new Set([f.id]))).toBe(false)
  })

  it('false: lineups saknas (defensiv spärr — ska aldrig hända i praktiken)', () => {
    const f = makeFinalFixture({ status: FixtureStatus.Completed, homeScore: 1, awayScore: 0 })
    expect(shouldRouteQuicksimToCeremony(f, new Set([f.id]))).toBe(false)
  })

  it('false: fixture undefined (t.ex. hittades inte i result.game.fixtures)', () => {
    expect(shouldRouteQuicksimToCeremony(undefined, new Set(['fixture_final']))).toBe(false)
  })
})

// ── (b) buildCeremonyOnlyStep återger facit, räknar aldrig om ───────────────

describe('buildCeremonyOnlyStep (A-H6) — läser facit, simulerar aldrig', () => {
  it('speglar homeScore/awayScore/events exakt från den persisterade fixturen', () => {
    const events = [
      makeEvent({ minute: 12, clubId: 'club1', playerId: 'h_f1' }),
      makeEvent({ minute: 45, clubId: 'club2', playerId: 'a_f1' }),
      makeEvent({ minute: 70, clubId: 'club1', playerId: 'h_f2' }),
    ]
    const f = makeFinalFixture({ status: FixtureStatus.Completed, homeScore: 2, awayScore: 1, events })
    const step = buildCeremonyOnlyStep(f)
    expect(step.homeScore).toBe(2)
    expect(step.awayScore).toBe(1)
    expect(step.events).toBe(events) // samma referens — ingen omkonstruktion av eventlistan
    expect(step.penaltyDone).toBeUndefined()
    expect(step.penaltyFinalResult).toBeUndefined()
  })

  it('bär med sig ett straffresultat oförändrat när fixturen gick till straffar', () => {
    const f = makeFinalFixture({
      status: FixtureStatus.Completed,
      homeScore: 1, awayScore: 1,
      wentToPenalties: true,
      penaltyResult: { home: 4, away: 5 },
    })
    const step = buildCeremonyOnlyStep(f)
    expect(step.penaltyDone).toBe(true)
    expect(step.penaltyFinalResult).toEqual({ home: 4, away: 5 })
    expect(step.phase).toBe('penalties')
  })

  it('utan facit-events faller den tillbaka på tom lista, inte krasch', () => {
    const f = makeFinalFixture({ status: FixtureStatus.Completed, events: undefined as unknown as MatchEvent[] })
    expect(() => buildCeremonyOnlyStep(f)).not.toThrow()
    expect(buildCeremonyOnlyStep(f).events).toEqual([])
  })
})

// ── (c) samma segrare/medalj som CeremonySmFinal redan visar för live-matcher ─

describe('didManagedWinFinal via buildCeremonyOnlyStep (A-H6) — rätt medalj oavsett vem som vann', () => {
  it('reglertid: managed = home vinner → SVENSKA MÄSTARE', () => {
    const f = makeFinalFixture({ status: FixtureStatus.Completed, homeScore: 3, awayScore: 1 })
    const steps = [buildCeremonyOnlyStep(f)]
    expect(didManagedWinFinal(true, f.homeScore, f.awayScore, steps)).toBe(true)
  })

  it('reglertid: managed = home förlorar → SILVER (kravet "fungerar oavsett vem som vinner")', () => {
    const f = makeFinalFixture({ status: FixtureStatus.Completed, homeScore: 1, awayScore: 3 })
    const steps = [buildCeremonyOnlyStep(f)]
    expect(didManagedWinFinal(true, f.homeScore, f.awayScore, steps)).toBe(false)
  })

  it('straffavgörande: managed = away vinner på straffar trots lika reglertidsställning', () => {
    const f = makeFinalFixture({
      status: FixtureStatus.Completed,
      homeScore: 2, awayScore: 2,
      penaltyResult: { home: 3, away: 5 },
    })
    const steps = [buildCeremonyOnlyStep(f)]
    expect(didManagedWinFinal(false, f.homeScore, f.awayScore, steps)).toBe(true)
    expect(didManagedWinFinal(true, f.homeScore, f.awayScore, steps)).toBe(false)
  })
})

// ── Slutkontroll: mot den RIKTIGA motorn (samma matchEngine.simulateMatch som
//    matchSimProcessor.ts/quicksim faktiskt anropar) — bevisar att pipen
//    facit → buildCeremonyOnlyStep → didManagedWinFinal aldrig avviker från
//    det resultat som redan skrevs till fixturen, oavsett utfall. ───────────

describe('A-H6 mot riktiga matchEngine.simulateMatch — ingen divergens mellan facit och ceremoni', () => {
  it('för 20 seedade SM-finaler: ceremonins score/segrare matchar alltid result.fixture exakt', () => {
    const homePlayers = makeSquad('h', 'club1', 70)
    const awayPlayers = makeSquad('a', 'club2', 60) // svagare bortalag — ger variation i utfall över seeds
    const homeLineup = makeSelection(homePlayers)
    const awayLineup = makeSelection(awayPlayers)

    let sawHomeWin = false
    let sawAwayWin = false

    for (let seed = 1; seed <= 20; seed++) {
      const fixture = makeFinalFixture({ id: `final_${seed}` })
      const result = simulateMatch({
        fixture, homeLineup, awayLineup, homePlayers, awayPlayers,
        homeAdvantage: 0, // isNeutralVenue → ingen hemmafördel, matchar matchCore-konventionen
        seed,
        isPlayoff: true,
        matchPhase: 'final',
        managedIsHome: true,
      })
      const completed = result.fixture

      // (a) routar korrekt givet att lineups sparats av motorn
      expect(shouldRouteQuicksimToCeremony(completed, new Set([completed.id]))).toBe(true)

      // (b) ceremoni-steppet avviker aldrig från facit
      const step = buildCeremonyOnlyStep(completed)
      expect(step.homeScore).toBe(completed.homeScore)
      expect(step.awayScore).toBe(completed.awayScore)
      expect(step.events).toBe(completed.events)
      expect(step.penaltyFinalResult).toEqual(completed.penaltyResult)

      // (c) segraren räknas identiskt med det facit-motorn redan avgjorde
      const expectedManagedWon = completed.penaltyResult
        ? completed.penaltyResult.home > completed.penaltyResult.away
        : completed.homeScore > completed.awayScore
      expect(didManagedWinFinal(true, completed.homeScore, completed.awayScore, [step])).toBe(expectedManagedWon)

      if (expectedManagedWon) sawHomeWin = true
      else sawAwayWin = true
    }

    // Sanity: 20 seeds ska ge båda utfallen (annars testar vi bara EN gren
    // av "oavsett vem som vinner" trots att vi påstår motsatsen).
    expect(sawHomeWin).toBe(true)
    expect(sawAwayWin).toBe(true)
  })
})
