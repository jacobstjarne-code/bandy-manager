import { describe, it, expect } from 'vitest'
import { getCoffeeRoomScene } from '../coffeeRoomService'
import type { SaveGame } from '../../entities/SaveGame'
import type { Fixture } from '../../entities/Fixture'
import { FixtureStatus } from '../../enums'

// D4-regressionsfix (2026-07-21, andra omgången) — de fyra sista D4-orphanen:
// victory-echo, klackEcho-i-kafferum, legend-referenser, supporter-citat.
// Samma verifieringsmönster som första omgången (coffeeRoomEventReaction.test.ts):
// varje reaktion ska faktiskt resa sig ur ett event och nå scenen.

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

describe('D4-regressionsfix, andra omgången — de fyra sista pooler', () => {
  const completed = makeFixture({ roundNumber: 1, matchday: 1 })

  it('victory-echo har topprioritet och slår igenom oavsett annan state', () => {
    const g = makeGame({
      fixtures: [completed],
      currentMatchday: 3,
      pendingVictoryEcho: { diaryLine: 'd', coffeeLine: 'Kioskvakten: "Jag sålde korv till fyra personer som grät."', boardMessage: 'b' } as never,
      fatigueHotStreak: 5, // ska INTE vinna över victory-echo
    })
    const scene = getCoffeeRoomScene(g)
    expect(scene?.narratorLine?.text).toContain('grät')
    expect(scene?.exchanges).toEqual([])
  })

  it('victory-echo fungerar även vid round=0 (ingen avslutad ligarunda ännu)', () => {
    const g = makeGame({
      fixtures: [],
      currentMatchday: 1,
      pendingVictoryEcho: { diaryLine: 'd', coffeeLine: 'Segerlinje utan avslutad ligarunda.', boardMessage: undefined } as never,
    })
    const scene = getCoffeeRoomScene(g)
    expect(scene?.narratorLine?.text).toBe('Segerlinje utan avslutad ligarunda.')
  })

  it('klackEcho-i-kafferum (pickKlackEchoText, kontext "kafferum") syns som narratorLine', () => {
    const found = findAcrossMatchdays(
      md => makeGame({
        fixtures: [completed],
        currentMatchday: md,
        klackEcho: { type: 'derby_win', resultMatchday: 1, initialWeight: 0.5, currentWeight: 0.4, decayPerRound: 0.02 } as never,
      }),
      scene => scene?.narratorLine !== undefined && !scene.narratorLine.speaker,
    )
    expect(found).toBe(true)
  })

  it('klackEcho-i-kafferum uteblir under viktgränsen 0.15', () => {
    const found = findAcrossMatchdays(
      md => makeGame({
        fixtures: [completed],
        currentMatchday: md,
        klackEcho: { type: 'derby_win', resultMatchday: 1, initialWeight: 0.1, currentWeight: 0.1, decayPerRound: 0.02 } as never,
      }),
      scene => scene?.narratorLine !== undefined && !scene.narratorLine.speaker,
      10,
    )
    expect(found).toBe(false)
  })

  it('legend-referens (klubblegend, allmän pool) interpolerar namnet', () => {
    const found = findAcrossMatchdays(
      md => makeGame({
        fixtures: [completed],
        currentMatchday: md,
        clubLegends: [{ name: 'Kalle Berggren', position: 'Forward', seasons: 10, totalGoals: 100, totalAssists: 20, titles: [], retiredSeason: 0 }] as never,
      }),
      scene => (scene?.exchanges.flat().join(' ') ?? '').includes('Berggren'),
    )
    expect(found).toBe(true)
  })

  it('legend-referens (scout-roll) läser scout-poolen', () => {
    const found = findAcrossMatchdays(
      md => makeGame({
        fixtures: [completed],
        currentMatchday: md,
        clubLegends: [{ name: 'Karin Ström', position: 'Forward', seasons: 10, totalGoals: 100, totalAssists: 20, titles: [], retiredSeason: 0, role: 'scout' }] as never,
      }),
      scene => (scene?.exchanges.flat().join(' ') ?? '').includes('fyra namn på pappret') ||
               (scene?.exchanges.flat().join(' ') ?? '').includes('borta hela helgen') ||
               (scene?.exchanges.flat().join(' ') ?? '').includes('ringde i tisdags') ||
               (scene?.exchanges.flat().join(' ') ?? '').includes('hittade en kille i Norrland') ||
               (scene?.exchanges.flat().join(' ') ?? '').includes('kom hem från bortamatchen') ||
               (scene?.exchanges.flat().join(' ') ?? '').includes('sa nej till en agent'),
    )
    expect(found).toBe(true)
  })

  it('supporter-karaktärscitat syns när klacken finns', () => {
    const found = findAcrossMatchdays(
      md => makeGame({
        fixtures: [completed],
        currentMatchday: md,
        supporterGroup: {
          name: 'Järnkurvan', founded: 1, members: 40, mood: 60,
          leader: { name: 'Sture', role: 'leader' },
          veteran: { name: 'Birgitta', role: 'veteran' },
          youth: { name: 'Elin', role: 'youth' },
          family: { name: 'Familjen Ek', role: 'family' },
        } as never,
      }),
      scene => (scene?.exchanges.flat().join(' ') ?? '').includes('Järnkurvan') ||
               (scene?.exchanges.flat().join(' ') ?? '').includes('trettio år') ||
               (scene?.exchanges.flat().join(' ') ?? '').includes('banderoll') ||
               (scene?.exchanges.flat().join(' ') ?? '').includes('Bortaresan') ||
               (scene?.exchanges.flat().join(' ') ?? '').includes('Klacken börjar växa') ||
               (scene?.exchanges.flat().join(' ') ?? '').includes('orten igenom') ||
               (scene?.exchanges.flat().join(' ') ?? '').includes('bäste just nu'),
    )
    expect(found).toBe(true)
  })

  it('supporter-rykte-reaktion (rep_academy) prioriteras när eventet är löst', () => {
    const found = findAcrossMatchdays(
      md => makeGame({
        fixtures: [completed],
        currentMatchday: md,
        supporterGroup: {
          name: 'Järnkurvan', founded: 1, members: 40, mood: 60,
          leader: { name: 'Sture', role: 'leader' },
          veteran: { name: 'Birgitta', role: 'veteran' },
          youth: { name: 'Elin', role: 'youth' },
          family: { name: 'Familjen Ek', role: 'family' },
        } as never,
        resolvedEventIds: ['rep_academy_1'],
      }),
      scene => (scene?.exchanges.flat().join(' ') ?? '').includes('LANDSLAGET'),
    )
    expect(found).toBe(true)
  })
})
