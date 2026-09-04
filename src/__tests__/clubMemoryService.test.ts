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
    expect(milestone?.text).toBe('Satte sitt första A-lagsmål mot MOT. En dag att minnas.')
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

  it('okänd/oproducerad typ (t.ex. patron_change) ger fortfarande null, inte en tom mall', () => {
    const game = makeMinimalGame({
      eventLedger: [ledgerEntry({ type: 'patron_change', significance: 90 })],
    })
    const result = getClubMemory(game)
    expect(result.seasons[0].events.find(e => e.type === 'patron_change')).toBeUndefined()
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
