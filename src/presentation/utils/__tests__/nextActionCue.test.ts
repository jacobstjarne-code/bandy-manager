/**
 * Drag 3 (§11, punkt 6) — "Vad nu?"-affordansen. Speglar handleAdvance:
 * decision-grind > managed match nästa omgång (lineup ej satt > lineup satt)
 * > annars. Alltid svarbar — en tom text är en bugg, inte ett tillstånd.
 */
import { describe, it, expect } from 'vitest'
import { getNextActionCue } from '../nextActionCue'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Club } from '../../../domain/entities/Club'
import { FixtureStatus } from '../../../domain/enums'

function makeClub(id: string, shortName: string): Club {
  return { id, name: shortName, shortName, region: 'test', reputation: 50, finances: 0, wageBudget: 0, transferBudget: 0 } as Club
}

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'f1',
    leagueId: 'L',
    season: 2026,
    roundNumber: 1,
    matchday: 5,
    homeClubId: 'managed',
    awayClubId: 'opp',
    status: FixtureStatus.Scheduled,
    events: [],
    isCup: false,
    isKnockout: false,
    ...overrides,
  } as Fixture
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'g1',
    managerName: 'Test',
    managedClubId: 'managed',
    currentDate: '2026-10-04',
    currentSeason: 2026,
    currentMatchday: 4,
    clubs: [makeClub('managed', 'Test'), makeClub('opp', 'Skutskär')],
    players: [],
    fixtures: [],
    standings: [],
    inbox: [],
    league: { teamIds: [] } as never,
    transferState: { listedPlayerIds: [] } as never,
    youthIntakeHistory: [],
    matchWeathers: [],
    managedClubTraining: 'balanced' as never,
    trainingHistory: [],
    playoffBracket: null,
    cupBracket: null,
    seasonSummaries: [],
    scoutReports: {},
    activeScoutAssignment: null,
    scoutBudget: 0,
    pendingEvents: [],
    transferBids: [],
    handledContractPlayerIds: [],
    sponsors: [],
    activeTalentSearch: null,
    talentSearchResults: [],
    academyLevel: 1 as never,
    mentorships: [],
    loanDeals: [],
    version: '1.0.0',
    lastSavedAt: '2026-10-04T00:00:00Z',
    seenAnslag: [],
    ...overrides,
  } as SaveGame
}

describe('getNextActionCue', () => {
  it('veckans beslut väntar vinner över allt annat (warning)', () => {
    const game = makeGame({
      pendingWeeklyDecision: 'test' as never,
      fixtures: [makeFixture()],
    })
    expect(getNextActionCue(game)).toEqual({ text: 'Veckans beslut väntar — ta det först.', tone: 'warning' })
  })

  it('inga schemalagda matcher alls → säsongen är slut (inte "spela omgången")', () => {
    const game = makeGame({ fixtures: [] })
    expect(getNextActionCue(game)).toEqual({ text: 'Säsongen är slut för er del — avsluta säsongen.', tone: 'default' })
  })

  // Low 1 (Skutskär-auditen, 2026-08-22): detta var EXAKT auditens fynd —
  // andra klubbars matcher (t.ex. resten av slutspelet) fortfarande
  // schemalagda, men den hanterade klubben har ingen kvar (utslagen).
  // Tidigare visade denna gren "Näst på tur: spela omgången" trots att
  // spelaren inte hade något kvar att spela.
  it('schemalagda matcher finns för ANDRA klubbar men inte för managed → säsongen är slut', () => {
    const game = makeGame({
      fixtures: [makeFixture({ homeClubId: 'other1', awayClubId: 'other2', matchday: 5 })],
    })
    expect(getNextActionCue(game)).toEqual({ text: 'Säsongen är slut för er del — avsluta säsongen.', tone: 'default' })
  })

  // A-M1 (SEXSÄSONGSAUDITEN 2026-08-26): grundserien klar (omgång 22, alla
  // matcher spelade) men playoffBracket ännu inte skapad — det GAP som
  // uppstår mellan sista grundseriematchen och handlePlayoffStart (som
  // körs först på NÄSTA advance()-anrop). Klubben KAN vara kvalificerad;
  // "Säsongen är slut" är fel här — slutspelet är pending, inte över.
  it('grundserien klar men playoffBracket ännu inte skapad → spela omgången (inte "säsongen är slut")', () => {
    const completedRounds: Fixture[] = Array.from({ length: 22 }, (_, i) =>
      makeFixture({
        id: `round_${i + 1}`,
        roundNumber: i + 1,
        matchday: i + 1,
        status: FixtureStatus.Completed,
        homeClubId: 'managed',
        awayClubId: 'opp',
      })
    )
    const game = makeGame({ fixtures: completedRounds, playoffBracket: null })
    expect(getNextActionCue(game)).toEqual({ text: 'Näst på tur: spela omgången.', tone: 'default' })
  })

  it('managed match nästa omgång, lineup EJ satt → pekar på laget', () => {
    const game = makeGame({
      managedClubPendingLineup: undefined,
      fixtures: [makeFixture({ matchday: 5 })],
    })
    expect(getNextActionCue(game)).toEqual({ text: 'Näst på tur: sätt laget inför Skutskär.', tone: 'default' })
  })

  it('managed match nästa omgång, lineup SATT → pekar på matchen + dag', () => {
    const game = makeGame({
      managedClubPendingLineup: { startingPlayerIds: [], benchPlayerIds: [], tactic: {} } as never,
      fixtures: [makeFixture({ matchday: 5, date: '2026-10-10' })], // lördag
    })
    const cue = getNextActionCue(game)
    expect(cue.tone).toBe('default')
    expect(cue.text).toBe('Näst på tur: matchen mot Skutskär, lör.')
  })

  it('väljer NÄRMASTE omgång, inte en senare managed-match längre bort', () => {
    const game = makeGame({
      managedClubPendingLineup: undefined,
      fixtures: [
        makeFixture({ id: 'far', matchday: 8, homeClubId: 'managed', awayClubId: 'opp' }),
        makeFixture({ id: 'near', matchday: 5, homeClubId: 'other1', awayClubId: 'other2' }),
      ],
    })
    // Närmaste omgång (5) har ingen managed-match → generisk, trots att omg 8 har en
    expect(getNextActionCue(game)).toEqual({ text: 'Näst på tur: spela omgången.', tone: 'default' })
  })

  it('är alltid svarbar — aldrig en tom text, oavsett gren', () => {
    const cases = [
      makeGame({ fixtures: [] }),
      makeGame({ fixtures: [makeFixture()] }),
      makeGame({ pendingWeeklyDecision: 'x' as never, fixtures: [makeFixture()] }),
      makeGame({ managedClubPendingLineup: { startingPlayerIds: [], benchPlayerIds: [], tactic: {} } as never, fixtures: [makeFixture({ date: '2026-10-10' })] }),
    ]
    for (const game of cases) {
      expect(getNextActionCue(game).text.length).toBeGreaterThan(0)
    }
  })
})
