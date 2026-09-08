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
  it('kalenderankare: derby använder låst presscopy med verklig dag och hemma/borta', () => {
    const resolver = createNarrativePushCopyResolver(gameFixture(), memoryRotation())
    const fixture = gameFixture().fixtures[0]
    expect(resolver({
      category: 'calendar_anchor', fixture, opponentClubId: 'club_skutskar',
      kind: 'derby', daysUntil: 6, venue: 'hemma',
    })).toEqual({
      voice: 'press',
      title: 'Derbyveckan är här.',
      body: 'Söderfors–Skutskär hemma på lördag. Orten pratar inte om något annat.',
    })
  })

  it('kalenderankare: finalen roterar från press till klubb och släpper in klacken först vid fanMood ≥60', () => {
    const rotation = memoryRotation()
    const game = gameFixture({ fanMood: 70 })
    const resolver = createNarrativePushCopyResolver(game, rotation)
    const fixture = game.fixtures[0]
    const payload = {
      category: 'calendar_anchor' as const, fixture, opponentClubId: 'club_skutskar',
      kind: 'final' as const, daysUntil: 6, venue: 'hemma' as const,
    }
    expect(resolver(payload)?.title).toBe('Final.')
    expect(resolver(payload)?.title).toBe('Det är final på lördag.')
    expect(resolver(payload)).toEqual({
      voice: 'fans',
      title: 'Hela orten åker.',
      body: 'Final mot Skutskär. Bussarna är fulla.',
    })
  })

  it('säsongsläge: slutspelsmarginalen renderas ur payloaden och rösten roterar', () => {
    const resolver = createNarrativePushCopyResolver(gameFixture(), memoryRotation())
    const payload = {
      category: 'season_context' as const,
      kind: 'playoff_edge' as const,
      position: 9,
      margin: { toPlayoff: -2, toRelegation: 8 },
      pointsTo: { playoff: 2, title: 14, safety: 0 },
      roundsRemaining: 4,
      form: null,
    }
    expect(resolver(payload)).toEqual({
      voice: 'chair',
      title: '2 poäng till slutspel.',
      body: '4 omgångar kvar. Styrelsen räknar. Det gör vi alla.',
    })
    expect(resolver(payload)).toEqual({
      voice: 'assistant',
      title: 'Slutspelet går att nå.',
      body: '2 poäng på 4 matcher. Jag tror på det. Laget vet inte än.',
    })
  })

  it('kalenderankare: cupcopy kräver och använder den verkliga spelorten', () => {
    const game = gameFixture()
    const fixture = { ...game.fixtures[0], venueCity: 'Bollnäs' }
    const resolver = createNarrativePushCopyResolver(game, memoryRotation())
    expect(resolver({
      category: 'calendar_anchor', fixture, opponentClubId: 'club_skutskar',
      kind: 'cup', daysUntil: 2, venue: 'borta',
    })).toEqual({
      voice: 'press',
      title: 'Cupkväll i Bollnäs.',
      body: 'Skutskär på lördag. Vinnaren går vidare, förloraren åker hem.',
    })
    expect(resolver({
      category: 'calendar_anchor', fixture: { ...fixture, venueCity: undefined },
      opponentClubId: 'club_skutskar', kind: 'cup', daysUntil: 2, venue: 'borta',
    })).toBeNull()
  })

  it('kalenderankare: slutspel och annandag använder sina låsta, smala rader', () => {
    const game = gameFixture()
    const resolver = createNarrativePushCopyResolver(game, memoryRotation())
    const fixture = game.fixtures[0]
    expect(resolver({
      category: 'calendar_anchor', fixture, opponentClubId: 'club_skutskar',
      kind: 'playoff', playoffStage: 'semifinal', daysUntil: 3, venue: 'hemma',
    })).toEqual({
      voice: 'press',
      title: 'Slutspelet börjar.',
      body: 'Skutskär i semifinal.',
    })
    expect(resolver({
      category: 'calendar_anchor', fixture, opponentClubId: 'club_skutskar',
      kind: 'annandag', daysUntil: 3, venue: 'borta',
    })).toEqual({
      voice: 'club',
      title: 'Annandagen.',
      body: 'Skutskär borta. Som varje år.',
    })
  })

  // stickiness-copy-roster: "återkomst till gamla klubben" (register §4).
  // DOM_MANAGER_ATERKOMST_2026-09-08: kanonisk manager_return-liggarpost
  // (switchManagedClub.ts), inte ett state-undantag — kandidaten kommer via
  // agendan (item.post), precis som revansch/ex-spelare/nemesis. Resolvern
  // verifierar ÄNDÅ "första gången" via managerReturnService.ts:s egen
  // detektor innan den renderar (untoldness är mjuk, inte en hård spärr).
  function managerReturnProfile(overrides: Partial<NonNullable<SaveGame['managerProfile']>> = {}) {
    return {
      firstName: 'Anna', lastName: 'Berg', age: 40, hometown: 'Ort',
      burnoutScore: 0, burnoutHistory: [], careerWins: 0, careerDraws: 0, careerLosses: 0,
      seasonsAtClub: 1, contractUntilSeason: 5, monthlySalary: 30, coachRivalries: [],
      clubSpells: [
        { clubId: 'club_skutskar', clubName: 'Skutskärs IF', fromSeason: 1, toSeason: 2, endedBy: 'fired' as const },
        { clubId: 'club_soderfors', clubName: 'Söderfors GoIF', fromSeason: 3 },
      ],
      ...overrides,
    } as SaveGame['managerProfile']
  }

  it('återkomst: pressens variant först, sedan klubbens — aldrig samma två gånger i rad', () => {
    const rotation = memoryRotation()
    const game = gameFixture({ managerProfile: managerReturnProfile() })
    const resolver = createNarrativePushCopyResolver(game, rotation)
    const item = agendaItem({
      type: 'manager_return', season: 3, matchday: 0,
      subject: { kind: 'club', id: 'club_skutskar' },
    })
    expect(resolver({ category: 'narrative_return', item })).toEqual({
      voice: 'press',
      title: 'Anna Berg tillbaka i Skutskärs IF.',
      body: 'Första gången mot Skutskärs IF sedan avskedet. Läktaren minns.',
    })
    expect(resolver({ category: 'narrative_return', item })).toEqual({
      voice: 'club',
      title: 'Tillbaka till Skutskärs IF.',
      body: 'Första matchen mot dem sedan du gick. Åt båda hållen.',
    })
  })

  it('återkomst: saknat managerProfile — hellre ingen text än ett gissat namn', () => {
    const resolver = createNarrativePushCopyResolver(gameFixture({ managerProfile: undefined }), memoryRotation())
    const item = agendaItem({
      type: 'manager_return', season: 3, matchday: 0,
      subject: { kind: 'club', id: 'club_skutskar' },
    })
    expect(resolver({ category: 'narrative_return', item })).toBeNull()
  })

  it('återkomst: klubbytet var en annan säsong än nästa fixture — inte längre "första gången", ingen text', () => {
    const game = gameFixture({
      managerProfile: managerReturnProfile({
        clubSpells: [
          { clubId: 'club_skutskar', clubName: 'Skutskärs IF', fromSeason: 1, toSeason: 2, endedBy: 'fired' as const },
          { clubId: 'club_soderfors', clubName: 'Söderfors GoIF', fromSeason: 2 },
        ],
      }),
    })
    const resolver = createNarrativePushCopyResolver(game, memoryRotation())
    const item = agendaItem({
      type: 'manager_return', season: 3, matchday: 0,
      subject: { kind: 'club', id: 'club_skutskar' },
    })
    expect(resolver({ category: 'narrative_return', item })).toBeNull()
  })

  it('återkomst: redan mötts en gång sedan bytet (completed tidigare fixture) — ingen text', () => {
    const game = gameFixture({
      managerProfile: managerReturnProfile(),
      fixtures: [
        {
          id: 'fixture-earlier', leagueId: 'l1', season: 3, roundNumber: 1, matchday: 1,
          date: '2027-01-02', homeClubId: 'club_soderfors', awayClubId: 'club_skutskar',
          status: FixtureStatus.Completed, homeScore: 1, awayScore: 1, events: [],
        } as unknown as SaveGame['fixtures'][number],
        ...gameFixture().fixtures,
      ],
    })
    const resolver = createNarrativePushCopyResolver(game, memoryRotation())
    const item = agendaItem({
      type: 'manager_return', season: 3, matchday: 0,
      subject: { kind: 'club', id: 'club_skutskar' },
    })
    expect(resolver({ category: 'narrative_return', item })).toBeNull()
  })

  it('säsongsläge: nedflyttning och förlustsvit använder varsin låst mall', () => {
    const game = gameFixture()
    const resolver = createNarrativePushCopyResolver(game, memoryRotation())
    expect(resolver({
      category: 'season_context', kind: 'relegation', position: 11,
      margin: { toPlayoff: -8, toRelegation: -2 },
      pointsTo: { playoff: 8, title: 20, safety: 2 },
      roundsRemaining: 5, form: null,
    })).toEqual({
      voice: 'chair',
      title: '11:e plats.',
      body: '2 poäng till säkerhet, 5 omgångar. Vi behöver inte prata om vad det betyder.',
    })

    expect(resolver({
      category: 'season_context', kind: 'streak_l', position: 6,
      margin: { toPlayoff: 5, toRelegation: 12 },
      pointsTo: { playoff: 0, title: 9, safety: 0 },
      roundsRemaining: 8, form: { result: 'L', length: 4 },
      nextFixture: game.fixtures[0], nextOpponentClubId: 'club_skutskar',
    })).toEqual({
      voice: 'club',
      title: '4 raka förluster.',
      body: 'Skutskär på lördag. Något måste ändras, eller inte.',
    })
  })

  it('revansch: big_loss mot exakt nästa motstånd, samma säsong ("i höstas") — pressens variant först', () => {
    const resolver = createNarrativePushCopyResolver(gameFixture(), memoryRotation())
    const item = agendaItem({
      type: 'big_loss', season: 3, matchday: 1,
      subject: { kind: 'club', id: 'club_skutskar' },
      result: { goalsFor: 2, goalsAgainst: 6, opponentClubId: 'club_skutskar', home: true, competition: 'league', stage: 'Omgång 1' },
    })
    const copy = resolver({ category: 'narrative_return', item: item })
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
    const first = resolver({ category: 'narrative_return', item: item })
    const second = resolver({ category: 'narrative_return', item: item })
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
    expect(resolver({ category: 'narrative_return', item: item })?.body).toContain('förra säsongen')
  })

  it('revansch: vunnen derby (outcome=won) triggar aldrig revansch-texten', () => {
    const resolver = createNarrativePushCopyResolver(gameFixture(), memoryRotation())
    const item = agendaItem({
      type: 'derby_result', season: 3, matchday: 1, outcome: 'won',
      subject: { kind: 'club', id: 'club_skutskar' },
      result: { goalsFor: 5, goalsAgainst: 1, opponentClubId: 'club_skutskar', home: true, competition: 'league', stage: 'Omgång 1' },
    })
    expect(resolver({ category: 'narrative_return', item: item })).toBeNull()
  })

  it('revansch: mer än en säsong gammal — för gammal, ingen text', () => {
    const resolver = createNarrativePushCopyResolver(gameFixture({ currentSeason: 5 }), memoryRotation())
    const item = agendaItem({
      type: 'big_loss', season: 3, matchday: 1,
      subject: { kind: 'club', id: 'club_skutskar' },
      result: { goalsFor: 2, goalsAgainst: 6, opponentClubId: 'club_skutskar', home: true, competition: 'league', stage: 'Omgång 1' },
    })
    expect(resolver({ category: 'narrative_return', item: item })).toBeNull()
  })

  it('revansch: fel motstånd (inte samma som nästa fixture) — ingen text', () => {
    const resolver = createNarrativePushCopyResolver(gameFixture(), memoryRotation())
    const item = agendaItem({
      type: 'big_loss', season: 3, matchday: 1,
      subject: { kind: 'club', id: 'club_annat' },
      result: { goalsFor: 2, goalsAgainst: 6, opponentClubId: 'club_annat', home: true, competition: 'league', stage: 'Omgång 1' },
    })
    expect(resolver({ category: 'narrative_return', item: item })).toBeNull()
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
    const copy = resolver({ category: 'narrative_return', item: item })
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
    expect(resolver({ category: 'narrative_return', item: item })).toBeNull()
  })

  // DOM_K12_TRANSFER_TARGET_MISSED_2026-09-08: registrets §7 "nemesis"-rad
  // ("Han valde {Motståndare}") beskriver spelaren VI bjöd på och missade,
  // vars klubb vid budtillfället nu är nästa motstånd — transfer_target_missed,
  // inte nemesis_signed (som berättar motsatsen). Bara press-rösten, ingen rotation.
  it('nemesis: transfer_target_missed till exakt nästa motstånd, samma säsong', () => {
    const resolver = createNarrativePushCopyResolver(
      gameFixture({ players: [{ id: 'p1', firstName: 'Elias', lastName: 'Grafström' }] as SaveGame['players'] }),
      memoryRotation(),
    )
    const item = agendaItem({
      type: 'transfer_target_missed', season: 3, matchday: 1,
      subject: { kind: 'player', id: 'p1' },
      subject2: { kind: 'club', id: 'club_skutskar' },
    })
    const copy = resolver({ category: 'narrative_return', item: item })
    expect(copy).toEqual({
      voice: 'press',
      title: 'Han valde Skutskärs IF.',
      body: 'Elias Grafström, som Söderfors jagade. På lördag står han på andra sidan.',
    })
  })

  it('nemesis: två leveranser i rad ger fortfarande press — registret ger bara en röst, ingen rotation', () => {
    const rotation = memoryRotation()
    const resolver = createNarrativePushCopyResolver(
      gameFixture({ players: [{ id: 'p1', firstName: 'Elias', lastName: 'Grafström' }] as SaveGame['players'] }),
      rotation,
    )
    const item = agendaItem({
      type: 'transfer_target_missed', season: 3, matchday: 1,
      subject: { kind: 'player', id: 'p1' },
      subject2: { kind: 'club', id: 'club_skutskar' },
    })
    expect(resolver({ category: 'narrative_return', item: item })?.voice).toBe('press')
    expect(resolver({ category: 'narrative_return', item: item })?.voice).toBe('press')
  })

  it('nemesis: hans klubb vid budtillfället var ett ANNAT lag än nästa motstånd — ingen text', () => {
    const resolver = createNarrativePushCopyResolver(
      gameFixture({ players: [{ id: 'p1', firstName: 'Elias', lastName: 'Grafström' }] as SaveGame['players'] }),
      memoryRotation(),
    )
    const item = agendaItem({
      type: 'transfer_target_missed', season: 3, matchday: 1,
      subject: { kind: 'player', id: 'p1' },
      subject2: { kind: 'club', id: 'club_annat' },
    })
    expect(resolver({ category: 'narrative_return', item: item })).toBeNull()
  })

  it('nemesis: mer än en säsong gammalt missat bud — för gammalt, ingen text', () => {
    const resolver = createNarrativePushCopyResolver(
      gameFixture({ currentSeason: 5, players: [{ id: 'p1', firstName: 'Elias', lastName: 'Grafström' }] as SaveGame['players'] }),
      memoryRotation(),
    )
    const item = agendaItem({
      type: 'transfer_target_missed', season: 3, matchday: 1,
      subject: { kind: 'player', id: 'p1' },
      subject2: { kind: 'club', id: 'club_skutskar' },
    })
    expect(resolver({ category: 'narrative_return', item: item })).toBeNull()
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
    expect(resolver({ category: 'narrative_return', item: item })).toBeNull()
  })
})
