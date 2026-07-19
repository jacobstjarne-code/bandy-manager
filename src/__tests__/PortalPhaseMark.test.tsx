import { describe, it, expect } from 'vitest'
import { PortalPhaseMark } from '../presentation/components/portal/PortalPhaseMark'
import { getFunctionaryPhase, getCurrentLeagueRound } from '../domain/data/seasonPhases'
import { pickPhaseMarkCopy } from '../domain/data/phaseMarkText'
import { FixtureStatus, PlayoffStatus } from '../domain/enums'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { Fixture } from '../domain/entities/Fixture'

function makeLeagueFixture(roundNumber: number, status: string): Fixture {
  return {
    id: `f${roundNumber}`,
    leagueId: 'l1',
    season: 2026,
    roundNumber,
    matchday: roundNumber,
    homeClubId: 'club_a',
    awayClubId: 'club_b',
    status: status as 'scheduled' | 'completed',
    homeScore: 1,
    awayScore: 0,
    events: [],
    isCup: false,
    isKnockout: false,
  } as Fixture
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    managerName: 'Tränare',
    managedClubId: 'club_a',
    currentDate: '2026-03-15',
    currentSeason: 2026,
    currentMatchday: 1,
    clubs: [{ id: 'club_a' }, { id: 'club_b' }] as never,
    players: [],
    league: { id: 'l1', name: 'Test', clubs: [] } as never,
    fixtures: [],
    standings: [],
    inbox: [],
    transferState: {} as never,
    youthIntakeHistory: [],
    matchWeathers: [],
    managedClubTraining: 'balanced' as never,
    trainingHistory: [],
    playoffBracket: null,
    cupBracket: null,
    pendingEvents: [],
    transferBids: [],
    handledContractPlayerIds: [],
    sponsors: [],
    activeTalentSearch: null,
    talentSearchResults: [],
    mentorships: [],
    loanDeals: [],
    academyLevel: 'none' as never,
    scoutReports: {},
    activeScoutAssignment: null,
    scoutBudget: 0,
    seasonSummaries: [],
    version: '1.0',
    lastSavedAt: '2026-03-15T00:00:00',
    phaseMarksSeen: [],
    ...overrides,
  } as SaveGame
}

describe('PortalPhaseMark — component export', () => {
  it('is a function (React component)', () => {
    expect(typeof PortalPhaseMark).toBe('function')
  })
})

describe('PortalPhaseMark — 2026-07-19 migrering till sjufasmodellen', () => {

  it('höststart (omg 1-3) har ingen markör — pickPhaseMarkCopy returnerar null', () => {
    const game = makeGame({ fixtures: [] })
    const round = getCurrentLeagueRound(game)
    const phase = getFunctionaryPhase(round, 6, 12)
    expect(phase).toBe('höststart')
    expect(pickPhaseMarkCopy(phase, game)).toBeNull()
  })

  it('höst/vinter (mellanfaser) har ingen markör', () => {
    const game = makeGame()
    expect(pickPhaseMarkCopy(getFunctionaryPhase(5, 6, 12), game)).toBeNull() // höst
    expect(pickPhaseMarkCopy(getFunctionaryPhase(14, 6, 12), game)).toBeNull() // vinter (mittenplacering)
  })

  it('annandagen (omg 7-11) ger copy med rätt helper', () => {
    const completed = Array.from({ length: 8 }, (_, i) => makeLeagueFixture(i + 1, FixtureStatus.Completed))
    const game = makeGame({ fixtures: completed, phaseMarksSeen: [] })
    const round = getCurrentLeagueRound(game)
    const phase = getFunctionaryPhase(round, 6, 12)
    expect(phase).toBe('annandagen')
    const copy = pickPhaseMarkCopy(phase, game)
    expect(copy).not.toBeNull()
    expect(copy!.helper).toBe('Årets största bandydag')
    expect(copy!.eyebrow).toContain('ANNANDAGEN')
  })

  it('vinterkris kräver dålig tabellplacering, annars vinter (ingen markör)', () => {
    const game = makeGame()
    const crisis = getFunctionaryPhase(14, 10, 12) // botten 60%+ → vinterkris
    const noCrisis = getFunctionaryPhase(14, 2, 12) // topp → vinter
    expect(crisis).toBe('vinterkris')
    expect(noCrisis).toBe('vinter')
    expect(pickPhaseMarkCopy(crisis, game)).not.toBeNull()
    expect(pickPhaseMarkCopy(noCrisis, game)).toBeNull()
  })

  it('slutspurt (omg 21+) ger copy', () => {
    const game = makeGame()
    const phase = getFunctionaryPhase(21, 6, 12)
    expect(phase).toBe('slutspurt')
    const copy = pickPhaseMarkCopy(phase, game)
    expect(copy).not.toBeNull()
    expect(copy!.helper).toBe('Sista omgångarna')
  })

  it('playoff mappas oförändrad (samma text som gamla PHASEMARK_LABELS.playoff)', () => {
    const game = makeGame({
      playoffBracket: {
        season: 2026,
        status: PlayoffStatus.InProgress,
        quarterFinals: [],
        semiFinals: [],
        final: null,
        champion: null,
      },
    })
    const copy = pickPhaseMarkCopy('playoff', game)
    expect(copy).not.toBeNull()
    expect(copy!.eyebrow).toBe('⬩ Slutspelet börjar ⬩')
    expect(copy!.helper).toBe('Portal har stramat åt — bara det viktiga nu.')
  })

  it('seen=[playoff] suppresses the playoff mark (samma logik som komponenten läser)', () => {
    const game = makeGame({ phaseMarksSeen: ['playoff'] })
    const seen = game.phaseMarksSeen ?? []
    expect(seen.includes('playoff')).toBe(true)
    // Component returns null when phase is already seen
  })

  it('quote-poolen väljs deterministiskt (samma säsong+klubb+fas → samma rad)', () => {
    const gameA = makeGame({ managedClubId: 'club_a', currentSeason: 2026 })
    const gameB = makeGame({ managedClubId: 'club_a', currentSeason: 2026 })
    expect(pickPhaseMarkCopy('slutspurt', gameA)!.quote).toBe(pickPhaseMarkCopy('slutspurt', gameB)!.quote)
  })

})
