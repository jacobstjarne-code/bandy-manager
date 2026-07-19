import { describe, it, expect } from 'vitest'
import { getCoffeeRoomScene } from '../coffeeRoomService'
import { COFFEE_ROOM_QUESTIONS } from '../../data/coffeeRoomQuestionsText'
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

const COMPLETED = makeFixture({ roundNumber: 1, matchday: 1 })
const ALL_IDS = COFFEE_ROOM_QUESTIONS.map(q => q.id)

describe('Kafferummet — A2 frågor (D1)', () => {
  it('minst en matchday av 200 visar en fråga (gaten triggar över tid)', () => {
    let sawQuestion = false
    for (let md = 1; md <= 200; md++) {
      const g = makeGame({ fixtures: [COMPLETED], currentMatchday: md })
      const scene = getCoffeeRoomScene(g)
      if (scene?.question) { sawQuestion = true; break }
    }
    expect(sawQuestion).toBe(true)
  })

  it('frågan som visas har talare Sture och två svarsalternativ A/B', () => {
    let found = false
    for (let md = 1; md <= 200 && !found; md++) {
      const g = makeGame({ fixtures: [COMPLETED], currentMatchday: md })
      const scene = getCoffeeRoomScene(g)
      if (scene?.question) {
        found = true
        expect(scene.question.speaker).toBe('Sture')
        expect(scene.question.answers).toHaveLength(2)
        expect(scene.question.answers[0].id).toBe('A')
        expect(scene.question.answers[1].id).toBe('B')
      }
    }
    expect(found).toBe(true)
  })

  it('en pensionerad fråga (coffeeRoomAnsweredQuestions) ställs aldrig igen', () => {
    const retiredId = COFFEE_ROOM_QUESTIONS[0].id
    for (let md = 1; md <= 200; md++) {
      const g = makeGame({
        fixtures: [COMPLETED],
        currentMatchday: md,
        coffeeRoomAnsweredQuestions: [retiredId],
      })
      const scene = getCoffeeRoomScene(g)
      expect(scene?.question?.questionId).not.toBe(retiredId)
    }
  })

  it('när alla sex är besvarade ställs inga fler frågor — ingen krasch på tom pool', () => {
    for (let md = 1; md <= 200; md++) {
      const g = makeGame({
        fixtures: [COMPLETED],
        currentMatchday: md,
        coffeeRoomAnsweredQuestions: ALL_IDS,
      })
      expect(() => getCoffeeRoomScene(g)).not.toThrow()
      const scene = getCoffeeRoomScene(g)
      expect(scene?.question).toBeUndefined()
      // Rummet återgår till ren ambient — scenen ska ändå finnas (om matchday>0)
      if (g.currentMatchday && g.currentMatchday > 0) {
        expect(scene).not.toBeNull()
      }
    }
  })
})

describe('Kafferummet — A2 återkomst (D3)', () => {
  it('en schemalagd återkomst landar deterministiskt vid sin tröskel, inte innan', () => {
    const q = COFFEE_ROOM_QUESTIONS[0]
    const answeredMatchday = 10
    const pending = [{ questionId: q.id, answerId: 'A' as const, answeredMatchday }]

    let firstDueMatchday: number | null = null
    for (let md = answeredMatchday; md <= answeredMatchday + 10; md++) {
      const g = makeGame({ fixtures: [COMPLETED], currentMatchday: md, coffeeRoomPendingReturns: pending })
      const scene = getCoffeeRoomScene(g)
      if (scene?.consumedReturnQuestionId === q.id) { firstDueMatchday = md; break }
    }

    expect(firstDueMatchday).not.toBeNull()
    expect(firstDueMatchday!).toBeGreaterThanOrEqual(answeredMatchday + 2)
    expect(firstDueMatchday!).toBeLessThanOrEqual(answeredMatchday + 6)

    // Strax innan tröskeln — återkomsten får inte visas ännu
    const gBefore = makeGame({ fixtures: [COMPLETED], currentMatchday: firstDueMatchday! - 1, coffeeRoomPendingReturns: pending })
    expect(getCoffeeRoomScene(gBefore)?.consumedReturnQuestionId).not.toBe(q.id)

    // Vid tröskeln — rätt återkomstväxel för valt svar (A)
    const gDue = makeGame({ fixtures: [COMPLETED], currentMatchday: firstDueMatchday!, coffeeRoomPendingReturns: pending })
    const scene = getCoffeeRoomScene(gDue)
    expect(scene?.exchanges).toEqual([q.returns.A])
  })

  it('återkomsten går före hotStreak (samma prioritet som victory-echo/farewell)', () => {
    const q = COFFEE_ROOM_QUESTIONS[1]
    const answeredMatchday = 5
    // Hitta en due-matchday
    let dueMd: number | null = null
    for (let md = answeredMatchday; md <= answeredMatchday + 10; md++) {
      const g = makeGame({
        fixtures: [COMPLETED], currentMatchday: md,
        coffeeRoomPendingReturns: [{ questionId: q.id, answerId: 'B' as const, answeredMatchday }],
      })
      if (getCoffeeRoomScene(g)?.consumedReturnQuestionId === q.id) { dueMd = md; break }
    }
    expect(dueMd).not.toBeNull()

    const g = makeGame({
      fixtures: [COMPLETED],
      currentMatchday: dueMd!,
      fatigueHotStreak: 3,
      coffeeRoomPendingReturns: [{ questionId: q.id, answerId: 'B' as const, answeredMatchday }],
    })
    const scene = getCoffeeRoomScene(g)
    expect(scene?.consumedReturnQuestionId).toBe(q.id)
    expect(scene?.exchanges).toEqual([q.returns.B])
  })

  it('utan pending returns fungerar rummet som vanligt (ingen konsumerad-flagga)', () => {
    const g = makeGame({ fixtures: [COMPLETED], currentMatchday: 4, coffeeRoomPendingReturns: [] })
    const scene = getCoffeeRoomScene(g)
    expect(scene?.consumedReturnQuestionId).toBeUndefined()
  })
})
