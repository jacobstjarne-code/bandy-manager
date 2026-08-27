import { describe, it, expect } from 'vitest'
import { getCoffeeRoomScene } from '../coffeeRoomService'
import type { SaveGame } from '../../entities/SaveGame'
import type { Fixture } from '../../entities/Fixture'
import { FixtureStatus, InboxItemType } from '../../enums'

// D4-regressionsfix (2026-07-21) — getCoffeeRoomScene (D4, 2026-07-19) ersatte
// getCoffeeRoomQuote utan att portera dess reaktionspooler. Dessa tester
// verifierar att varje reaktion faktiskt reser sig ur ett event och når
// scenen (R1-kedjan: event → state → getCoffeeRoomScene → spelaren).

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'g1',
    managerName: 'Test',
    managedClubId: 'managed',
    currentDate: '2026-10-04',
    currentSeason: 1,
    currentMatchday: 4,
    clubs: [
      { id: 'managed', name: 'Testklubben IF' } as never,
      { id: 'opp', name: 'Motståndarklubben' } as never,
    ],
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
    ...overrides,
  } as SaveGame
}

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'f1',
    leagueId: 'L',
    season: 1,
    roundNumber: 1,
    matchday: 1,
    homeClubId: 'managed',
    awayClubId: 'opp',
    status: FixtureStatus.Completed,
    homeScore: 1,
    awayScore: 1,
    events: [],
    ...overrides,
  } as Fixture
}

/** Scanna matchdagar tills scenen visar innehåll som matchar predikatet, eller ge upp. */
function findAcrossMatchdays(
  baseGame: (md: number) => SaveGame,
  predicate: (scene: ReturnType<typeof getCoffeeRoomScene>) => boolean,
  maxMd = 40,
): boolean {
  for (let md = 1; md <= maxMd; md++) {
    const scene = getCoffeeRoomScene(baseGame(md))
    if (scene && predicate(scene)) return true
  }
  return false
}

describe('D4-regressionsfix — portade reaktioner i getCoffeeRoomScene', () => {
  const completed = makeFixture({ roundNumber: 1, matchday: 1 })

  it('skandalreaktion (egen klubb) syns i scenen', () => {
    // PÅSTÅENDEKARTAN dubbelskale-fix (2026-08-25): triggerRound är
    // matchday-skala (scandalService.ts skriver nextMatchday). Ett fixt
    // triggerRound:1 utnyttjade tidigare en bugg (coffeeRoomService.ts
    // jämförde mot en roundNumber-skalig `round` som förblev konstant=1
    // hela scanet oavsett md, vilket gav ett obegränsat "nyligen"-fönster).
    // Med skalan rättad ska triggerRound spåra den scannade matchdagen så
    // att "nyligen"-fönstret (±1 matchday) fortfarande håller i hela loopen.
    const found = findAcrossMatchdays(
      md => makeGame({
        fixtures: [completed],
        currentMatchday: md,
        scandalHistory: [{
          id: 's1', season: 1, triggerRound: md, type: 'sponsor_collapse',
          affectedClubId: 'managed', resolutionRound: 5, isResolved: false,
        }] as never,
      }),
      scene => (scene?.exchanges.flat().join(' ') ?? '').includes('Tröjorna ska tryckas om'),
    )
    expect(found).toBe(true)
  })

  it('skandalreaktion (annan klubb) interpolerar {KLUBB}', () => {
    const found = findAcrossMatchdays(
      md => makeGame({
        fixtures: [completed],
        currentMatchday: md,
        scandalHistory: [{
          id: 's1', season: 1, triggerRound: md, type: 'sponsor_collapse',
          affectedClubId: 'opp', resolutionRound: 5, isResolved: false,
        }] as never,
      }),
      scene => (scene?.exchanges.flat().join(' ') ?? '').includes('Motståndarklubben förlorade en sponsor'),
    )
    expect(found).toBe(true)
  })

  it('PÅSTÅENDEKARTAN dubbelskale-fix: en skandal 9 matchdagar gammal syns INTE, trots att bara EN ligarunda hunnit spelas klart (cupmatcher emellan)', () => {
    // Reproducerar buggen direkt: roundNumber (ligarundor) och matchday (global
    // ordning) divergerar när cupmatcher konsumerat matchday-platser utan att
    // öka roundNumber — precis scenariot Jacob beskrev för signedRound, samma
    // klass här. completed har roundNumber=1 (en enda avklarad ligarunda) men
    // currentMatchday=10 (nio globala omgångar senare, cup/slutspel emellan).
    // Utan fixen jämförs skandalen mot roundNumber (=1, konstant) och verkar
    // "nyligen" i evighet. Med fixen jämförs den mot currentMatchday (=10) och
    // faller utanför ±1-fönstret, som avsett.
    const scene = getCoffeeRoomScene(makeGame({
      fixtures: [completed], // roundNumber: 1, matchday: 1
      currentMatchday: 10,
      scandalHistory: [{
        id: 's1', season: 1, triggerRound: 1, type: 'sponsor_collapse',
        affectedClubId: 'managed', resolutionRound: 5, isResolved: false,
      }] as never,
    }))
    const text = scene?.exchanges.flat().join(' ') ?? ''
    expect(text).not.toContain('Tröjorna ska tryckas om')
  })

  it('transferreaktion — sålt (TRANSFER_SALE_EXCHANGES) interpolerar spelarnamn', () => {
    const found = findAcrossMatchdays(
      md => makeGame({
        fixtures: [completed],
        currentMatchday: md,
        players: [{ id: 'p1', firstName: 'Bo', lastName: 'Fransson' } as never],
        inbox: [{ id: 'i1', type: InboxItemType.Transfer, relatedPlayerId: 'p1', title: 't', body: 'b', date: '2026-10-01', isRead: false } as never],
      }),
      scene => (scene?.exchanges.flat().join(' ') ?? '').includes('Fransson'),
    )
    expect(found).toBe(true)
  })

  it('transferreaktion — köpt (TRANSFER_BUY_EXCHANGES)', () => {
    const found = findAcrossMatchdays(
      md => makeGame({
        fixtures: [completed],
        currentMatchday: md,
        inbox: [{ id: 'inbox_bid_accepted_x', type: InboxItemType.TransferBidResult, title: 't', body: 'b', date: '2026-10-01', isRead: false } as never],
      }),
      scene => (scene?.exchanges.flat().join(' ') ?? '').includes('Ny kille i omklädningsrummet') ||
               (scene?.exchanges.flat().join(' ') ?? '').includes('Nyförvärvet') ||
               (scene?.exchanges.flat().join(' ') ?? '').includes('ny tröja i förtid') ||
               (scene?.exchanges.flat().join(' ') ?? '').includes('Folk frågade redan'),
    )
    expect(found).toBe(true)
  })

  it('transferreaktion — deadline (TRANSFER_DEADLINE_EXCHANGES) inom deadline-fönstret', () => {
    const deadlineFixture = makeFixture({ roundNumber: 14, matchday: 14 })
    const found = findAcrossMatchdays(
      md => makeGame({ fixtures: [deadlineFixture], currentMatchday: md }),
      scene => (scene?.exchanges.flat().join(' ') ?? '').includes('Telefonen ringer hela tiden') ||
               (scene?.exchanges.flat().join(' ') ?? '').includes('sniffar runt') ||
               (scene?.exchanges.flat().join(' ') ?? '').includes('Sista dagarna nu'),
    )
    expect(found).toBe(true)
  })

  it('transferreaktion — väntande utgående bud (TRANSFER_PENDING_BID_EXCHANGES)', () => {
    const found = findAcrossMatchdays(
      md => makeGame({
        fixtures: [completed],
        currentMatchday: md,
        transferBids: [{ id: 'b1', direction: 'outgoing', status: 'pending' } as never],
      }),
      scene => (scene?.exchanges.flat().join(' ') ?? '').includes('lagt bud') ||
               (scene?.exchanges.flat().join(' ') ?? '').includes('Bud lagt') ||
               (scene?.exchanges.flat().join(' ') ?? '').includes('ny kille'),
    )
    expect(found).toBe(true)
  })

  it('rival-sälj (RIVAL_SALE_KAFFERUM) syns som narratorLine inom 3 rundor', () => {
    const found = findAcrossMatchdays(
      md => makeGame({ fixtures: [completed], currentMatchday: md, lastRivalSaleMatchday: 1 }),
      scene => scene?.narratorLine !== undefined && !scene.narratorLine.speaker,
    )
    expect(found).toBe(true)
  })

  it('inkommande bud (INCOMING_BID_KAFFERUM) syns som narratorLine inom 2 rundor', () => {
    const found = findAcrossMatchdays(
      md => makeGame({ fixtures: [completed], currentMatchday: md, lastIncomingBidMatchday: 1 }),
      scene => scene?.narratorLine !== undefined && !scene.narratorLine.speaker,
    )
    expect(found).toBe(true)
  })

  it('årsdagsekon (anniversaryKafferumText) interpolerar {subject} via fillTemplate', () => {
    const found = findAcrossMatchdays(
      md => makeGame({
        fixtures: [completed],
        currentMatchday: md,
        players: [{ id: 'legend1', firstName: 'Karl', lastName: 'Berggren' } as never],
        activeAnniversaries: [{
          eventId: 'e1', originalSeason: 0, yearsAgo: 1, matchday: 1,
          type: 'derby_win', outcome: 'won', significance: 60, echoSize: 'medium',
          subjectPlayerId: 'legend1', originalEventText: 'x',
        } as never],
      }),
      scene => scene?.narratorLine !== undefined && (scene.narratorLine.text.includes('Berggren') || !scene.narratorLine.text.includes('{subject}')),
    )
    expect(found).toBe(true)
  })

  it('resultatkommentar (RESULT_EXCHANGES) syns som narratorLine med talare efter en vunnen match', () => {
    const wonFixture = makeFixture({ roundNumber: 1, matchday: 1, homeScore: 3, awayScore: 1 })
    const found = findAcrossMatchdays(
      md => makeGame({ fixtures: [wonFixture], currentMatchday: md }),
      scene => scene?.narratorLine !== undefined && !!scene.narratorLine.speaker &&
        (scene.narratorLine.text.includes('sålde dubbelt') || scene.narratorLine.text.includes('sjöng hela vägen') || scene.narratorLine.text.includes('plusresultat')),
    )
    expect(found).toBe(true)
  })

  it('avskedsmatch (FAREWELL_MATCH_STRINGS) prioriteras och interpolerar spelarnamn', () => {
    const lastHome = makeFixture({ id: 'home_last', matchday: 20, homeClubId: 'managed', awayClubId: 'opp', status: FixtureStatus.Scheduled, homeScore: null, awayScore: null })
    const g = makeGame({
      fixtures: [completed, lastHome],
      currentMatchday: 19,
      players: [{ id: 'vet1', firstName: 'Bo', lastName: 'Fransson' } as never],
      activeArcs: [{
        id: 'arc_vet1', type: 'veteran_farewell', playerId: 'vet1', subject: 'B. Fransson',
        startedMatchday: 1, phase: 'peak', expiresMatchday: 25, eventsFired: [], decisionsMade: [],
      }] as never,
    })
    const scene = getCoffeeRoomScene(g)
    expect(scene?.narratorLine?.text).toContain('Fransson')
    expect(scene?.exchanges).toEqual([])
  })
})
