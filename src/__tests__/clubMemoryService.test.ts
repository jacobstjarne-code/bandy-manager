import { getClubMemory, scoreEvent, momentKind, momentFamily } from '../domain/services/clubMemoryService'
import type { MemoryEvent } from '../domain/services/clubMemoryService'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { EventLedgerEntry } from '../domain/entities/Narrative'
import { backfillClubHistoryLedger } from '../domain/services/clubHistoryLedgerService'

const MANAGED_CLUB_ID = 'club_test'

function makeMinimalGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const game = {
    id: 'test',
    currentSeason: 1,
    currentMatchday: 1,
    currentDate: '2026-01-01',
    managedClubId: MANAGED_CLUB_ID,
    leagueId: 'league_test',
    clubs: [],
    players: [],
    fixtures: [],
    inbox: [],
    ...overrides,
  } as unknown as SaveGame
  return { ...game, eventLedger: backfillClubHistoryLedger(game) }
}

describe('getClubMemory', () => {
  it('returns empty structure for season 1, round 1', () => {
    const game = makeMinimalGame()
    const result = getClubMemory(game)
    expect(result.seasons).toHaveLength(1)
    expect(result.seasons[0].season).toBe(1)
    expect(result.seasons[0].isOngoing).toBe(true)
    expect(result.totalEventsAcrossSeasons).toBe(0)
    expect(result.legends).toEqual([])
    expect(result.records).toBeNull()
  })

  it('includes legends and records when present', () => {
    const game = makeMinimalGame({
      clubLegends: [{
        name: 'Staffan Henriksson',
        position: 'FWD',
        seasons: 8,
        totalGoals: 120,
        totalAssists: 45,
        titles: ['SM-guld 2028'],
        retiredSeason: 1,
      }],
      allTimeRecords: {
        mostGoalsSeason: { playerName: 'Staffan', goals: 22, season: 1 },
        mostAssistsSeason: null,
        highestRatingSeason: null,
        bestFinish: { position: 1, season: 1 },
        biggestWin: null,
        championSeasons: [1],
        cupWinSeasons: [],
      },
    })
    const result = getClubMemory(game)
    expect(result.legends).toHaveLength(1)
    expect(result.records).not.toBeNull()
    expect(result.records?.championSeasons).toContain(1)
  })

  it('marks ongoing season correctly', () => {
    const game = makeMinimalGame({ currentSeason: 3 })
    const result = getClubMemory(game)
    const ongoingSeasons = result.seasons.filter(s => s.isOngoing)
    expect(ongoingSeasons).toHaveLength(1)
    expect(ongoingSeasons[0].season).toBe(3)
  })

  it('sorts seasons newest first', () => {
    // Season 3 must have an event to appear (pre-career empty seasons are filtered)
    const game = makeMinimalGame({
      currentSeason: 4,
      scandalHistory: [{ id: 's1', season: 3, triggerRound: 5, type: 'match_fixing', affectedClubId: MANAGED_CLUB_ID, isResolved: true }],
    } as Partial<SaveGame>)
    const result = getClubMemory(game)
    expect(result.seasons[0].season).toBe(4)
    expect(result.seasons[result.seasons.length - 1].season).toBeLessThan(4)
  })

  it('shows at most 5 seasons and filters empty pre-career seasons', () => {
    // Season 5 is outside the 5-season window (firstSeason = 10-4 = 6)
    // Seasons 7-9 have no events — they should be filtered out
    // Seasons 6 and 10 have events (or are ongoing) — they should appear
    const game = makeMinimalGame({
      currentSeason: 10,
      scandalHistory: [
        { id: 's6', season: 6, triggerRound: 5, type: 'match_fixing', affectedClubId: MANAGED_CLUB_ID, isResolved: true },
        { id: 's5', season: 5, triggerRound: 5, type: 'match_fixing', affectedClubId: MANAGED_CLUB_ID, isResolved: true }, // outside window
      ],
    } as Partial<SaveGame>)
    const result = getClubMemory(game)
    expect(result.seasons.length).toBeLessThanOrEqual(5)
    expect(result.seasons[0].season).toBe(10)
    expect(result.seasons[result.seasons.length - 1].season).toBe(6)
  })

  it('aggregates events from scandal history', () => {
    const game = makeMinimalGame({
      currentSeason: 2,
      scandalHistory: [{
        id: 'scandal_1',
        season: 2,
        triggerRound: 8,
        type: 'match_fixing',
        affectedClubId: MANAGED_CLUB_ID,
        resolutionRound: 12,
        isResolved: true,
      }],
    } as Partial<SaveGame>)
    const result = getClubMemory(game)
    const seasonEvents = result.seasons[0].events
    const scandalEvents = seasonEvents.filter(e => e.type === 'scandal')
    expect(scandalEvents).toHaveLength(1)
    expect(scandalEvents[0].significance).toBe(70)
  })

  it('filters events below significance threshold', () => {
    // A scandal from a different club should not appear
    const game = makeMinimalGame({
      currentSeason: 2,
      scandalHistory: [{
        id: 'scandal_other',
        season: 2,
        triggerRound: 8,
        type: 'match_fixing',
        affectedClubId: 'other_club',
        resolutionRound: 12,
        isResolved: true,
      }],
    } as Partial<SaveGame>)
    const result = getClubMemory(game)
    const allEvents = result.seasons.flatMap(s => s.events)
    expect(allEvents.filter(e => e.type === 'scandal')).toHaveLength(0)
  })

  it('builds a national_team_callup event from firstNationalTeamCallupSeason, at the frozen matchday', () => {
    const game = makeMinimalGame({
      currentSeason: 2,
      players: [{
        id: 'p1', firstName: 'Erik', lastName: 'Salonen', clubId: MANAGED_CLUB_ID,
        nationalTeamCallups: 2, lastNationalTeamCallup: 3,
        firstNationalTeamCallupSeason: 2, firstNationalTeamCallupMatchday: 18,
      }],
    } as Partial<SaveGame>)
    const result = getClubMemory(game)
    const events = result.seasons.find(s => s.season === 2)!.events
    const callupEvents = events.filter(e => e.type === 'national_team_callup')
    expect(callupEvents).toHaveLength(1)
    expect(callupEvents[0].significance).toBe(60)
    expect(callupEvents[0].matchday).toBe(18)
    expect(callupEvents[0].subjectPlayerId).toBe('p1')
    expect(callupEvents[0].text).toContain('Salonen')
  })

  it('does not duplicate the callup event in a later season even as nationalTeamCallups keeps growing', () => {
    const game = makeMinimalGame({
      currentSeason: 3,
      players: [{
        id: 'p1', firstName: 'Erik', lastName: 'Salonen', clubId: MANAGED_CLUB_ID,
        nationalTeamCallups: 2, lastNationalTeamCallup: 3,
        firstNationalTeamCallupSeason: 2, firstNationalTeamCallupMatchday: 18,
      }],
    } as Partial<SaveGame>)
    const result = getClubMemory(game)
    const allEvents = result.seasons.flatMap(s => s.events)
    expect(allEvents.filter(e => e.type === 'national_team_callup')).toHaveLength(1)
    expect(result.seasons.find(s => s.season === 3)!.events.some(e => e.type === 'national_team_callup')).toBe(false)
  })

  it('builds a facility memory in the season declared by builtSeasons and reuses the completion matchday', () => {
    const game = makeMinimalGame({
      currentSeason: 4,
      facilityState: {
        builtNodeIds: ['kiosk'],
        builtSeasons: { kiosk: 3 },
        unseenCompletedFacilities: [{ nodeId: 'kiosk', season: 3, matchday: 9 }],
      },
    } as Partial<SaveGame>)

    const event = getClubMemory(game).seasons
      .find(s => s.season === 3)?.events
      .find(e => e.type === 'facility_built')

    expect(event).toMatchObject({
      season: 3,
      matchday: 9,
      roundLabel: 'Matchdag 9',
      significance: 35,
      subjectClubId: MANAGED_CLUB_ID,
    })
    expect(event?.text).toBe('Kiosken är öppen. Kaffe och korv i pausen — små pengar som blir stora över en säsong.')
  })

  it('uses builtSeasons as canon and never promotes a completion queue entry into history by itself', () => {
    const game = makeMinimalGame({
      currentSeason: 2,
      facilityState: {
        builtNodeIds: ['kiosk'],
        unseenCompletedFacilities: [{ nodeId: 'kiosk', season: 2, matchday: 7 }],
      },
    } as Partial<SaveGame>)

    const events = getClubMemory(game).seasons.flatMap(s => s.events)
    expect(events.some(e => e.type === 'facility_built')).toBe(false)
  })

  it('keeps the season memory after decommission and does not invent an exact matchday for old saves', () => {
    const game = makeMinimalGame({
      currentSeason: 3,
      facilityState: {
        builtNodeIds: [],
        builtSeasons: { varmestuga: 2 },
      },
    } as Partial<SaveGame>)

    const event = getClubMemory(game).seasons
      .find(s => s.season === 2)?.events
      .find(e => e.type === 'facility_built')

    expect(event).toMatchObject({
      season: 2,
      matchday: 1,
      roundLabel: 'Under säsongen',
    })
    expect(event?.text).toBe('Värmestugan står klar. Folk stannar kvar i kylan nu, pratar färdigt.')
  })

  it('läser migrerade klubbhändelser ur liggaren även när ursprungsfickan inte längre finns', () => {
    const withPocket = makeMinimalGame({
      currentSeason: 2,
      scandalHistory: [{
        id: 'scandal_canon', season: 2, triggerRound: 8, type: 'match_fixing',
        affectedClubId: MANAGED_CLUB_ID, isResolved: true,
      }],
    } as Partial<SaveGame>)
    const ledgerOnly = { ...withPocket, scandalHistory: [], activeScandals: [] }

    expect(getClubMemory(ledgerOnly).seasons
      .flatMap(s => s.events)
      .filter(e => e.type === 'scandal')).toHaveLength(1)
  })

  it('behåller en permanent spelarmilstolpe när diary-cachen senare har kapat bort posten', () => {
    const withDiary = makeMinimalGame({
      currentSeason: 2,
      clubs: [
        { id: MANAGED_CLUB_ID, name: 'Testklubben' },
        { id: 'club_other', name: 'Motstånd', shortName: 'MOT' },
      ],
      fixtures: [{
        id: 'f1', season: 2, matchday: 5, homeClubId: MANAGED_CLUB_ID, awayClubId: 'club_other',
        status: 'completed', homeScore: 1, awayScore: 0,
      }],
      players: [{
        id: 'p1', firstName: 'Erik', lastName: 'Salonen', clubId: MANAGED_CLUB_ID,
        diary: [{
          season: 2, matchday: 5, type: 'milestone', semanticKey: 'first_team_goal',
          text: 'Satte sitt första A-lagsmål mot MOT. En dag att minnas.',
        }],
      }],
    } as Partial<SaveGame>)
    const withoutDiary = {
      ...withDiary,
      players: withDiary.players.map(player => ({ ...player, diary: [] })),
    }

    const milestone = getClubMemory(withoutDiary).seasons
      .flatMap(item => item.events)
      .find(event => event.type === 'player_milestone')
    expect(milestone?.text).toBe('Erik Salonen — Satte sitt första A-lagsmål mot MOT. En dag att minnas.')
  })

  it('släpper inte igenom en spelarmilstolpe om liggarens subject inte kan namnges', () => {
    const game = makeMinimalGame({
      currentSeason: 2,
      eventLedger: [{
        type: 'player_milestone', semanticKey: 'player_milestone:missing:s2:m5:first_team_goal',
        season: 2, matchday: 5, significance: 40,
        subject: { kind: 'player', id: 'missing' },
      }],
    } as Partial<SaveGame>)

    expect(getClubMemory(game).seasons.flatMap(item => item.events)
      .some(event => event.type === 'player_milestone')).toBe(false)
  })
})

describe('scoreEvent', () => {
  function makeEvent(overrides: Partial<MemoryEvent>): MemoryEvent {
    return {
      type: 'player_milestone',
      season: 1,
      matchday: 10,
      text: 'Test event',
      emoji: '⭐',
      significance: 40,
      ...overrides,
    }
  }

  it('returns significance for sm_final', () => {
    const e = makeEvent({ type: 'sm_final', significance: 95 })
    expect(scoreEvent(e)).toBe(95)
  })

  it('returns significance for scandal', () => {
    const e = makeEvent({ type: 'scandal', significance: 70 })
    expect(scoreEvent(e)).toBe(70)
  })

  it('returns significance for retirement', () => {
    const e = makeEvent({ type: 'retirement', significance: 90 })
    expect(scoreEvent(e)).toBe(90)
  })
})

describe('liggare-k1 — Krönikan läser nu hela unionen, inte bara sex typer', () => {
  function ledgerEntry(overrides: Partial<EventLedgerEntry>): EventLedgerEntry {
    return {
      type: 'derby_win', semanticKey: 'k1-test', season: 1, matchday: 5, significance: 65,
      ...overrides,
    }
  }

  it('en Moment-typ (derby_win), tidigare bara synlig i "Det som hänt", ger nu en Krönika-rad', () => {
    const game = makeMinimalGame({
      clubs: [{ id: MANAGED_CLUB_ID, name: 'Test BK' } as never],
      eventLedger: [ledgerEntry({ type: 'derby_win', subject: { kind: 'club', id: MANAGED_CLUB_ID } })],
    })
    const result = getClubMemory(game)
    const event = result.seasons[0].events.find(e => e.type === 'derby_win')
    expect(event).toBeDefined()
    expect(event!.text).toContain('Klacken')
  })

  it('en tyst typ (patron_withdrawal) — fryst sedan 2026-09-02, aldrig talad — ger nu en Krönika-rad (k3 TEXT LÅST)', () => {
    const game = makeMinimalGame({
      patron: { name: 'Bengt Karlsson', id: 'patron-1', business: 'Test AB', influence: 50, happiness: 0, contribution: 10000, isActive: false, goodwill: 0 } as never,
      eventLedger: [ledgerEntry({ type: 'patron_withdrawal', semanticKey: 'patron_withdrawal_1', significance: 95, subject: { kind: 'patron', id: 'patron-1' } })],
    })
    const result = getClubMemory(game)
    const event = result.seasons[0].events.find(e => e.type === 'patron_withdrawal')
    expect(event).toBeDefined()
    expect(event!.text).toBe('Grundpelaren finns inte längre. Det syns inte på läktaren första veckan. Sen syns det överallt.')
    expect(event!.emoji).toBe('🤝')
  })

  it('en typ utan vymall (t.ex. season_finish, k9: fixture-härledd, inte ledger-dispatchad) ger fortfarande null, inte en tom mall', () => {
    const game = makeMinimalGame({
      eventLedger: [ledgerEntry({ type: 'season_finish', significance: 90 })],
    })
    const result = getClubMemory(game)
    expect(result.seasons[0].events.find(e => e.type === 'season_finish')).toBeUndefined()
  })
})

describe('liggare-k9 — transfer_signed/transfer_sold TEXT LÅST + ledgerEntryBelongsToManagedClub-fynd (subject2 är motparten, inte managed)', () => {
  it('transfer_signed renderar med motpartens namn', () => {
    const game = makeMinimalGame({
      clubs: [{ id: MANAGED_CLUB_ID, name: 'Test BK' }, { id: 'seller', name: 'Säljarklubben' }] as never,
      players: [{ id: 'p1', firstName: 'Arne', lastName: 'Berg', clubId: MANAGED_CLUB_ID }] as never,
      eventLedger: [{
        type: 'transfer_signed', semanticKey: 'transfer_signed:x', season: 1, matchday: 5, significance: 35,
        subject: { kind: 'player', id: 'p1' }, subject2: { kind: 'club', id: 'seller' },
      }],
    })
    const result = getClubMemory(game)
    const event = result.seasons[0].events.find(e => e.type === 'transfer_signed')
    expect(event).toBeDefined()
    expect(event!.text).toBe('Från Säljarklubben. Ett namn på ett papper i klubbstugan och en förväntan som ännu inte kostat något. Det kommer den att göra, åt ena eller andra hållet.')
  })

  it('transfer_sold: subject2 är KÖPARKLUBBEN (inte managed) — hade tidigare uteslutits ovillkorat av subject2-clubben-checken, ska nu synas', () => {
    const game = makeMinimalGame({
      clubs: [{ id: MANAGED_CLUB_ID, name: 'Test BK' }, { id: 'buyer', name: 'Köparklubben' }] as never,
      players: [{ id: 'p1', firstName: 'Björn', lastName: 'Ek', clubId: 'buyer' }] as never,
      eventLedger: [{
        type: 'transfer_sold', semanticKey: 'transfer_sold:x', season: 1, matchday: 5, significance: 35,
        subject: { kind: 'player', id: 'p1' }, subject2: { kind: 'club', id: 'buyer' },
      }],
    })
    const result = getClubMemory(game)
    const event = result.seasons[0].events.find(e => e.type === 'transfer_sold')
    expect(event).toBeDefined()
    expect(event!.text).toBe('Till Köparklubben. Pengarna räknades på en gång. Det som saknas räknas i mars.')
  })

  it('rival_sale (redan produktionskod sedan tidigare) visas nu i Krönikan — subject2 är rivalklubben, inte managed', () => {
    const game = makeMinimalGame({
      clubs: [{ id: MANAGED_CLUB_ID, name: 'Test BK' }, { id: 'rival', name: 'Rivalklubben' }] as never,
      players: [{ id: 'p1', firstName: 'Karl', lastName: 'Nord', clubId: 'rival' }] as never,
      eventLedger: [{
        type: 'rival_sale', semanticKey: 'rival-1', season: 1, matchday: 5, significance: 75,
        subject: { kind: 'player', id: 'p1' }, subject2: { kind: 'club', id: 'rival' },
      }],
    })
    const result = getClubMemory(game)
    expect(result.seasons[0].events.find(e => e.type === 'rival_sale')).toBeDefined()
  })
})

describe('liggare-k9-fynd — ledgerEntryBelongsToManagedClub strukturell omskrivning (2026-09-04)', () => {
  it('visar inte en gammal klubbs post efter att managern bytt klubb', () => {
    const game = makeMinimalGame({
      eventLedger: [{
        type: 'era_shift', semanticKey: 'old-club-era', season: 1, matchday: 5,
        significance: 85, eraLabel: 'establishment', clubId: 'club_old',
      }],
    })
    expect(getClubMemory(game).seasons[0].events.find(e => e.type === 'era_shift')).toBeUndefined()
  })

  it('derby_win: verklig produktionskod (roundProcessor.ts) sätter subject till RIVALKLUBBEN, inte managed — hade uteslutits ovillkorat före omskrivningen', () => {
    const game = makeMinimalGame({
      clubs: [{ id: MANAGED_CLUB_ID, name: 'Test BK' }, { id: 'rival', name: 'Rivalen' }] as never,
      eventLedger: [{
        type: 'derby_win', semanticKey: 'derby-2', season: 1, matchday: 5, significance: 65,
        subject: { kind: 'club', id: 'rival' },
      }],
    })
    expect(getClubMemory(game).seasons[0].events.find(e => e.type === 'derby_win')).toBeDefined()
  })

  it('era_shift utan subject alls (verklig produktionskod, roundProcessor.ts) visas nu', () => {
    const game = makeMinimalGame({
      eventLedger: [{ type: 'era_shift', semanticKey: 'era-2', season: 1, matchday: 5, significance: 85, eraLabel: 'establishment' }],
    })
    expect(getClubMemory(game).seasons[0].events.find(e => e.type === 'era_shift')).toBeDefined()
  })

  it('season_highlight utan subject alls (verklig produktionskod, seasonEndProcessor.ts) visas nu', () => {
    const game = makeMinimalGame({
      eventLedger: [{ type: 'season_highlight', semanticKey: 'sh-1', season: 1, matchday: 20, significance: 55, matchCategory: 'big_win' }],
    })
    expect(getClubMemory(game).seasons[0].events.find(e => e.type === 'season_highlight')).toBeDefined()
  })
})

describe('liggare-k9-doda-typer — de fem match-resultat-typerna (DOM 2026-09-04, nytt result-fält)', () => {
  it('buildMatchResultLedgerEntry + Krönikans dispatch ger IDENTISK text som den levande fixture-vägen (big_win)', async () => {
    const { buildMatchResultLedgerEntry, buildEventFromFixture } = await import('../domain/services/clubMemoryEventBuilders')
    const fixture = {
      id: 'fx1', season: 1, matchday: 5, roundNumber: 5, homeClubId: MANAGED_CLUB_ID, awayClubId: 'opp',
      homeScore: 6, awayScore: 1, status: 'completed', isCup: false, events: [],
    } as never
    const liveEvent = buildEventFromFixture(fixture, MANAGED_CLUB_ID)
    const ledgerEntry = buildMatchResultLedgerEntry(fixture, MANAGED_CLUB_ID)
    expect(ledgerEntry?.type).toBe('big_win')
    expect(ledgerEntry?.result).toEqual({ goalsFor: 6, goalsAgainst: 1, opponentClubId: 'opp', home: true, competition: 'league', stage: expect.any(String) })

    const game = makeMinimalGame({
      clubs: [{ id: MANAGED_CLUB_ID, name: 'Test BK' }, { id: 'opp', name: 'Opponent' }] as never,
      eventLedger: [ledgerEntry!],
    })
    const dispatchedEvent = getClubMemory(game).seasons[0].events.find(e => e.type === 'big_win')
    expect(dispatchedEvent?.text).toBe(liveEvent?.text)
    expect(dispatchedEvent?.significance).toBe(liveEvent?.significance)
  })

  it('sm_final: identisk text mellan fixture-vägen och ledger-vägen', async () => {
    const { buildMatchResultLedgerEntry, buildEventFromFixture } = await import('../domain/services/clubMemoryEventBuilders')
    const fixture = {
      id: 'fx2', season: 1, matchday: 38, roundNumber: 1, homeClubId: MANAGED_CLUB_ID, awayClubId: 'opp',
      homeScore: 4, awayScore: 2, status: 'completed', isCup: false, isFinaldag: true, events: [],
    } as never
    const liveEvent = buildEventFromFixture(fixture, MANAGED_CLUB_ID)
    const ledgerEntry = buildMatchResultLedgerEntry(fixture, MANAGED_CLUB_ID)
    const game = makeMinimalGame({
      clubs: [{ id: MANAGED_CLUB_ID, name: 'Test BK' }, { id: 'opp', name: 'Opponent' }] as never,
      eventLedger: [ledgerEntry!],
    })
    const dispatchedEvent = getClubMemory(game).seasons[0].events.find(e => e.type === 'sm_final')
    expect(dispatchedEvent?.text).toBe(liveEvent?.text)
    expect(dispatchedEvent?.text).toBe('SM-guld! Vann finalen 4–2.')
  })

  it('samma match producerad BÅDE via fixture-vägen OCH ledger-vägen (innevarande säsong, innan retire-last) dedupas till EN rad — inte två identiska', async () => {
    const { buildMatchResultLedgerEntry } = await import('../domain/services/clubMemoryEventBuilders')
    const fixture = {
      id: 'fx-dup', season: 1, matchday: 5, roundNumber: 5, homeClubId: MANAGED_CLUB_ID, awayClubId: 'opp',
      homeScore: 6, awayScore: 1, status: 'completed', isCup: false, events: [],
    } as never
    const ledgerEntry = buildMatchResultLedgerEntry(fixture, MANAGED_CLUB_ID)
    const game = makeMinimalGame({
      clubs: [{ id: MANAGED_CLUB_ID, name: 'Test BK' }, { id: 'opp', name: 'Opponent' }] as never,
      fixtures: [fixture],
      eventLedger: [ledgerEntry!],
    })
    const bigWinEvents = getClubMemory(game).seasons[0].events.filter(e => e.type === 'big_win')
    expect(bigWinEvents).toHaveLength(1)
  })

  it('en icke-kvalificerande match (liten segermarginal, ingen final/cup/derby) skriver ingen liggarpost', async () => {
    const { buildMatchResultLedgerEntry } = await import('../domain/services/clubMemoryEventBuilders')
    const fixture = {
      id: 'fx3', season: 1, matchday: 5, roundNumber: 5, homeClubId: MANAGED_CLUB_ID, awayClubId: 'opp',
      homeScore: 2, awayScore: 1, status: 'completed', isCup: false, events: [],
    } as never
    expect(buildMatchResultLedgerEntry(fixture, MANAGED_CLUB_ID)).toBeNull()
  })
})

describe('liggare-k9-doda-typer — season_finish läser nu seasonSummaries, inte bara seasonStartSnapshot', () => {
  it('en säsong äldre än currentSeason-1 hittar sin placering via seasonSummaries (tidigare alltid undefined)', () => {
    const game = makeMinimalGame({
      currentSeason: 4,
      seasonSummaries: [
        { season: 2, clubId: MANAGED_CLUB_ID, finalPosition: 3 },
      ] as never,
    })
    const result = getClubMemory(game)
    const season2 = result.seasons.find(s => s.season === 2)
    expect(season2?.finishPosition).toBe(3)
  })
})

describe('sluttest-be-blind-clubmemory — season_finish minns över/under förväntan, inte bara placeringen', () => {
  it('en fullständig seasonSummary ger domens mening (buildExpectationVerdictSentence), inte bara "Säsongen avslutad på..."', () => {
    const game = makeMinimalGame({
      currentSeason: 2,
      seasonSummaries: [{
        season: 1, clubId: MANAGED_CLUB_ID, clubName: 'Testklubben',
        finalPosition: 2, boardExpectation: 'avoidBottom',
        expectationVerdict: 'exceeded', playoffResult: null,
      }] as never,
    })
    const result = getClubMemory(game)
    const event = result.seasons.find(s => s.season === 1)?.events.find(e => e.type === 'season_finish')
    expect(event?.text).toContain('Testklubben')
    expect(event?.text).toContain('överträffade')
    expect(event?.text).not.toContain('Säsongen avslutad på')
  })

  it('en ofullständig seasonSummary (t.ex. äldre migrerad post utan expectationVerdict) faller tillbaka på position-texten — hellre ingen dom-mening än en falsk', () => {
    const game = makeMinimalGame({
      currentSeason: 2,
      seasonSummaries: [
        { season: 1, clubId: MANAGED_CLUB_ID, finalPosition: 5 },
      ] as never,
    })
    const result = getClubMemory(game)
    const event = result.seasons.find(s => s.season === 1)?.events.find(e => e.type === 'season_finish')
    expect(event?.text).toBe('Säsongen avslutad på 5:e plats.')
    expect(event?.text).not.toContain('undefined')
  })
})

describe('liggare-k7-beslutsminne — beslut ≥70 blir egna Krönika-rader, inte bara säsongens topp-1', () => {
  it('ett beslut med significance ≥ 70 och känd semanticKey ger en rad', () => {
    const game = makeMinimalGame({
      eventLedger: [{
        type: 'decision', semanticKey: 'criticalEconomy:take_loan', season: 1, matchday: 9, significance: 75,
      }],
    })
    const result = getClubMemory(game)
    const event = result.seasons[0].events.find(e => e.type === 'decision')
    expect(event).toBeDefined()
    expect(event!.emoji).toBe('📋')
  })

  it('ett beslut under tröskeln (70) syns inte, trots att SIGNIFICANCE_THRESHOLD (30) annars räcker för andra typer', () => {
    const game = makeMinimalGame({
      eventLedger: [{
        type: 'decision', semanticKey: 'criticalEconomy:take_loan', season: 1, matchday: 9, significance: 55,
      }],
    })
    const result = getClubMemory(game)
    expect(result.seasons[0].events.find(e => e.type === 'decision')).toBeUndefined()
  })

  it('okänd semanticKey (ingen mening att komponera) ger null — hellre ingen rad än en falsk', () => {
    const game = makeMinimalGame({
      eventLedger: [{
        type: 'decision', semanticKey: 'nagotHelt:okant', season: 1, matchday: 9, significance: 90,
      }],
    })
    const result = getClubMemory(game)
    expect(result.seasons[0].events.find(e => e.type === 'decision')).toBeUndefined()
  })

  it('subjektlöst beslut filtreras inte bort av ledgerEntryBelongsToManagedClub', () => {
    const game = makeMinimalGame({
      eventLedger: [{
        type: 'decision', semanticKey: 'criticalEconomy:take_loan', season: 1, matchday: 9, significance: 80,
      }],
    })
    const result = getClubMemory(game)
    expect(result.seasons[0].events.find(e => e.type === 'decision')).toBeDefined()
  })
})

describe('momentKind — breddad till hela EventLedgerType-unionen', () => {
  it('statiska fall matchar konsumentkartans §10-tabell', () => {
    expect(momentKind('referee_trust')).toBe('triumph')
    expect(momentKind('referee_feud')).toBe('tension')
    expect(momentKind('mecenat_withdrawal')).toBe('scar')
    expect(momentKind('patron_emerge')).toBe('triumph')
    expect(momentKind('academy_promotion')).toBe('triumph')
    expect(momentKind('retirement')).toBe('neutral')
  })

  it('decision: neutral som default, tension bara vid irreversible+tension samtidigt', () => {
    expect(momentKind('decision')).toBe('neutral')
    expect(momentKind('decision', { irreversible: true, tension: false, semanticKey: 'x' })).toBe('neutral')
    expect(momentKind('decision', { irreversible: true, tension: true, semanticKey: 'x' })).toBe('tension')
  })

  it('manager_burnout: scar vid mark, triumph vid close', () => {
    expect(momentKind('manager_burnout', { semanticKey: 'manager_burnout:mark:hog' })).toBe('scar')
    expect(momentKind('manager_burnout', { semanticKey: 'manager_burnout:close:frisk' })).toBe('triumph')
    expect(momentKind('manager_burnout', { semanticKey: 'manager_burnout:relief:markbar' })).toBe('neutral')
  })
})

describe('momentFamily — fem stämplar för hela unionen', () => {
  it('mappar exempel ur varje familj', () => {
    expect(momentFamily('derby_win')).toBe('⚔️')
    expect(momentFamily('facility_built')).toBe('🏟️')
    expect(momentFamily('player_milestone')).toBe('👤')
    expect(momentFamily('patron_emerge')).toBe('🤝')
    expect(momentFamily('decision')).toBe('📋')
  })
})
