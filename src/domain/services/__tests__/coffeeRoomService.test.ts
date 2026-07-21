import { describe, it, expect } from 'vitest'
import { getCoffeeRoomScene } from '../coffeeRoomService'
import type { SaveGame } from '../../entities/SaveGame'
import type { Fixture } from '../../entities/Fixture'
import { FixtureStatus } from '../../enums'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'g1',
    managerName: 'Test',
    managedClubId: 'managed',
    currentDate: '2026-10-04',
    currentSeason: 1,
    currentMatchday: 4,
    clubs: [],
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
    homeScore: 0,
    awayScore: 0,
    events: [],
    ...overrides,
  } as Fixture
}

describe('getCoffeeRoomScene', () => {
  it('returnerar non-null med innehåll när minst en omgång spelats (utbyten eller narratorLine)', () => {
    const completed = makeFixture({ roundNumber: 1, matchday: 1 })
    const g = makeGame({ fixtures: [completed], currentMatchday: 2 })
    const scene = getCoffeeRoomScene(g)
    expect(scene).not.toBeNull()
    expect(scene!.exchanges.length > 0 || scene!.narratorLine !== undefined).toBe(true)
  })

  it('returnerar null när inga omgångar spelats', () => {
    const g = makeGame({ fixtures: [], currentMatchday: 0 })
    expect(getCoffeeRoomScene(g)).toBeNull()
  })

  it('returnerar mellan 1 och 3 utbyten, eller en narratorLine-reaktion (D4-regressionsfix, 2026-07-21)', () => {
    const completed = makeFixture({ roundNumber: 2, matchday: 2 })
    for (let md = 1; md <= 6; md++) {
      const g = makeGame({ fixtures: [completed], currentMatchday: md })
      const scene = getCoffeeRoomScene(g)
      expect(scene).not.toBeNull()
      if (scene!.narratorLine) {
        expect(scene!.exchanges.length).toBe(0)
      } else {
        expect(scene!.exchanges.length).toBeGreaterThanOrEqual(1)
        expect(scene!.exchanges.length).toBeLessThanOrEqual(3)
      }
    }
  })

  it('inga utbyten innehåller oresolverade {youthName}-tokens när youth saknas', () => {
    const completed = makeFixture({ roundNumber: 3, matchday: 3 })
    const g = makeGame({ fixtures: [completed], currentMatchday: 3 })
    const scene = getCoffeeRoomScene(g)
    expect(scene).not.toBeNull()
    const allText = scene!.exchanges.flat().join(' ')
    expect(allText).not.toContain('{youthName}')
  })

  it('pendingHallEcho ytas ovillkorat i kafferummet (Block 3c)', () => {
    const completed = makeFixture({ roundNumber: 1, matchday: 1 })
    const g = makeGame({
      fixtures: [completed], currentMatchday: 2,
      pendingHallEcho: { text: 'Medlemsmötet sköt på frågan.' },
    } as Partial<SaveGame>)
    const scene = getCoffeeRoomScene(g)
    expect(scene?.narratorLine?.text).toBe('Medlemsmötet sköt på frågan.')
    expect(scene?.exchanges).toEqual([])
  })

  it('PROVNING_AMBIENT/HALL_KLACK_BASE kan ytas när ett hallTrial är aktivt (Block 3b/3d)', () => {
    const completed = makeFixture({ roundNumber: 1, matchday: 1 })
    let hitForankring = false
    let hitKlar = false
    for (let md = 1; md <= 60; md++) {
      const gForankring = makeGame({
        fixtures: [completed], currentMatchday: md,
        facilityState: { builtNodeIds: [], hallTrial: { stage: 'forankring', support: 50, startedSeason: 1, stageStartedRound: 1 } },
      } as Partial<SaveGame>)
      const sceneForankring = getCoffeeRoomScene(gForankring)
      if (sceneForankring?.narratorLine && [
        'Hallfrågan är uppe igen. Hälften vid bordet tycker. Andra hälften tiger.',
        '"Tak", sa någon vid kaffet. Det räckte för en halvtimmes diskussion.',
        'Kassören har börjat dricka kaffe med oss. Han har siffror med sig.',
        'Ingen säger hall rakt ut längre. Alla vet ändå vad som menas.',
        'Birger samlar Västra Sidan efter matchen. Ingen banderoll än — bara samtal.',
        'Klacken sjöng den gamla vinterramsan extra länge i dag. Det var inget sammanträffande.',
      ].includes(sceneForankring.narratorLine.text)) hitForankring = true

      const gKlar = makeGame({
        fixtures: [completed], currentMatchday: md,
        facilityState: { builtNodeIds: ['matchhall'], hallTrial: { stage: 'klar', support: 80, startedSeason: 1, stageStartedRound: 1 } },
      } as Partial<SaveGame>)
      const sceneKlar = getCoffeeRoomScene(gKlar)
      if (sceneKlar?.narratorLine && [
        'Klacken har hittat sin nya kortsida. Ekot gör ramsorna större än de är.',
        'Västra Sidans flaggor hänger i taket nu istället för på vallen. Någon ordnade det utan att fråga.',
      ].includes(sceneKlar.narratorLine.text)) hitKlar = true
    }
    expect(hitForankring).toBe(true)
    expect(hitKlar).toBe(true)
  })
})
