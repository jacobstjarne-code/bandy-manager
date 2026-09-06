import { describe, expect, it } from 'vitest'
import type { SaveGame } from '../../entities/SaveGame'
import type { AgendaItem } from '../../services/redaktorenService'
import { FixtureStatus } from '../../enums'
import { createNarrativePushCopyResolver, type PushCopyRotationStore } from '../narrativePushCopyResolver'
import type { AttentionVoice } from '../types'

function gameFixture(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'save-1',
    revision: 4,
    lastSavedAt: '2026-09-04T09:00:00.000Z',
    managedClubId: 'club_soderfors',
    currentSeason: 3,
    currentDate: '2027-01-10',
    clubs: [
      { id: 'club_soderfors', name: 'Söderfors GoIF', shortName: 'Söderfors' },
      { id: 'club_skutskar', name: 'Skutskärs IF', shortName: 'Skutskär' },
    ],
    players: [],
    fixtures: [{
      id: 'fixture-next',
      leagueId: 'league-1',
      season: 3,
      roundNumber: 4,
      matchday: 4,
      date: '2027-01-16', // en lördag
      homeClubId: 'club_soderfors',
      awayClubId: 'club_skutskar',
      status: FixtureStatus.Scheduled,
      homeScore: 0,
      awayScore: 0,
      events: [],
    }],
    standings: [],
    ...overrides,
  } as SaveGame
}

function agendaItem(post: Partial<AgendaItem['post']>): AgendaItem {
  return {
    post: post as AgendaItem['post'],
    postKey: 'key',
    kind: 'triumph',
    family: 'match',
    freshnessQueue: 'since_last',
    fitsSurfaces: ['push'],
    toldBefore: [],
    scoresBySurface: {} as AgendaItem['scoresBySurface'],
    editorialWeight: 1,
  }
}

function memoryRotation(): PushCopyRotationStore {
  const state: Record<string, AttentionVoice> = {}
  return {
    getLastVoice: key => state[key],
    setLastVoice: (key, voice) => { state[key] = voice },
  }
}

describe('createNarrativePushCopyResolver', () => {
  it('returnerar null för calendar_anchor/season_context — MEDVETET oresolverat (fel datakälla, se filhuvudet)', () => {
    const resolver = createNarrativePushCopyResolver(gameFixture(), memoryRotation())
    const item = agendaItem({ type: 'derby_result', season: 3, matchday: 1, outcome: 'lost', subject: { kind: 'club', id: 'club_skutskar' } })
    expect(resolver(item, 'calendar_anchor')).toBeNull()
    expect(resolver(item, 'season_context')).toBeNull()
  })

  it('revansch: big_loss mot exakt nästa motstånd, samma säsong ("i höstas") — pressens variant först', () => {
    const resolver = createNarrativePushCopyResolver(gameFixture(), memoryRotation())
    const item = agendaItem({
      type: 'big_loss', season: 3, matchday: 1,
      subject: { kind: 'club', id: 'club_skutskar' },
      result: { goalsFor: 2, goalsAgainst: 6, opponentClubId: 'club_skutskar', home: true, competition: 'league', stage: 'Omgång 1' },
    })
    const copy = resolver(item, 'narrative_return')
    expect(copy).toEqual({
      voice: 'press',
      title: 'Revanschen väntar.',
      body: 'Skutskärs IF slog Söderfors med 2–6 i höstas. På lördag möts de igen.',
    })
  })

  it('revansch: andra leveransen för samma scenario väljer klubbens röst, inte samma två gånger i rad', () => {
    const rotation = memoryRotation()
    const resolver = createNarrativePushCopyResolver(gameFixture(), rotation)
    const item = agendaItem({
      type: 'big_loss', season: 3, matchday: 1,
      subject: { kind: 'club', id: 'club_skutskar' },
      result: { goalsFor: 2, goalsAgainst: 6, opponentClubId: 'club_skutskar', home: true, competition: 'league', stage: 'Omgång 1' },
    })
    const first = resolver(item, 'narrative_return')
    const second = resolver(item, 'narrative_return')
    expect(first?.voice).toBe('press')
    expect(second?.voice).toBe('club')
    expect(second?.title).toBe('Skutskärs IF. Igen.')
  })

  it('revansch: förlorad derby (outcome=lost) förra säsongen ger "förra säsongen", inte "i höstas"', () => {
    const resolver = createNarrativePushCopyResolver(gameFixture({ currentSeason: 3 }), memoryRotation())
    const item = agendaItem({
      type: 'derby_result', season: 2, matchday: 10, outcome: 'lost',
      subject: { kind: 'club', id: 'club_skutskar' },
      result: { goalsFor: 1, goalsAgainst: 3, opponentClubId: 'club_skutskar', home: false, competition: 'league', stage: 'Omgång 10' },
    })
    expect(resolver(item, 'narrative_return')?.body).toContain('förra säsongen')
  })

  it('revansch: vunnen derby (outcome=won) triggar aldrig revansch-texten', () => {
    const resolver = createNarrativePushCopyResolver(gameFixture(), memoryRotation())
    const item = agendaItem({
      type: 'derby_result', season: 3, matchday: 1, outcome: 'won',
      subject: { kind: 'club', id: 'club_skutskar' },
      result: { goalsFor: 5, goalsAgainst: 1, opponentClubId: 'club_skutskar', home: true, competition: 'league', stage: 'Omgång 1' },
    })
    expect(resolver(item, 'narrative_return')).toBeNull()
  })

  it('revansch: mer än en säsong gammal — för gammal, ingen text', () => {
    const resolver = createNarrativePushCopyResolver(gameFixture({ currentSeason: 5 }), memoryRotation())
    const item = agendaItem({
      type: 'big_loss', season: 3, matchday: 1,
      subject: { kind: 'club', id: 'club_skutskar' },
      result: { goalsFor: 2, goalsAgainst: 6, opponentClubId: 'club_skutskar', home: true, competition: 'league', stage: 'Omgång 1' },
    })
    expect(resolver(item, 'narrative_return')).toBeNull()
  })

  it('revansch: fel motstånd (inte samma som nästa fixture) — ingen text', () => {
    const resolver = createNarrativePushCopyResolver(gameFixture(), memoryRotation())
    const item = agendaItem({
      type: 'big_loss', season: 3, matchday: 1,
      subject: { kind: 'club', id: 'club_annat' },
      result: { goalsFor: 2, goalsAgainst: 6, opponentClubId: 'club_annat', home: true, competition: 'league', stage: 'Omgång 1' },
    })
    expect(resolver(item, 'narrative_return')).toBeNull()
  })

  it('ex-spelare: transfer_sold till exakt nästa motstånd, samma säsong ("i somras")', () => {
    const resolver = createNarrativePushCopyResolver(
      gameFixture({ players: [{ id: 'p1', firstName: 'Karl', lastName: 'Nilsson' }] as SaveGame['players'] }),
      memoryRotation(),
    )
    const item = agendaItem({
      type: 'transfer_sold', season: 3, matchday: 1,
      subject: { kind: 'player', id: 'p1' },
      subject2: { kind: 'club', id: 'club_skutskar' },
    })
    const copy = resolver(item, 'narrative_return')
    expect(copy).toEqual({
      voice: 'press',
      title: 'Karl Nilsson kommer tillbaka.',
      body: 'Såld till Skutskärs IF i somras. På lördag spelar han mot Söderfors.',
    })
  })

  it('ex-spelare: sålt till ett ANNAT lag än nästa motstånd — ingen text (hellre ingen mening än en falsk)', () => {
    const resolver = createNarrativePushCopyResolver(
      gameFixture({ players: [{ id: 'p1', firstName: 'Karl', lastName: 'Nilsson' }] as SaveGame['players'] }),
      memoryRotation(),
    )
    const item = agendaItem({
      type: 'transfer_sold', season: 3, matchday: 1,
      subject: { kind: 'player', id: 'p1' },
      subject2: { kind: 'club', id: 'club_annat' },
    })
    expect(resolver(item, 'narrative_return')).toBeNull()
  })

  it('saknad fixture.date (t.ex. äldre save) — hellre ingen text än en mening utan veckodag', () => {
    const resolver = createNarrativePushCopyResolver(
      gameFixture({ fixtures: [{
        id: 'fixture-next', leagueId: 'league-1', season: 3, roundNumber: 4, matchday: 4,
        homeClubId: 'club_soderfors', awayClubId: 'club_skutskar', status: FixtureStatus.Scheduled,
        homeScore: 0, awayScore: 0, events: [],
      }] as SaveGame['fixtures'] }),
      memoryRotation(),
    )
    const item = agendaItem({
      type: 'big_loss', season: 3, matchday: 1,
      subject: { kind: 'club', id: 'club_skutskar' },
      result: { goalsFor: 2, goalsAgainst: 6, opponentClubId: 'club_skutskar', home: true, competition: 'league', stage: 'Omgång 1' },
    })
    expect(resolver(item, 'narrative_return')).toBeNull()
  })
})
