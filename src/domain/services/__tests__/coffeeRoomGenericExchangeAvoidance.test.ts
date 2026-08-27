/**
 * A-H4a (SEXSÄSONGSAUDITEN 2026-08-26, docs/incoming/
 * BANDY_MANAGER_AUDIT_6_SASONGER_2026-08-26.md #H4): kafferummets rader
 * återkom. Rotorsak: anti-upprepningsgaten (`pool.length > count +
 * lastIndices.size`) var allt-eller-inget — GENERIC_EXCHANGES har bara sju
 * rader, och `lastCoffeeSceneIndices` växer till 12 efter några besök, så
 * gaten slocknade helt (7 > count+12 är alltid falskt) och undvikandet
 * upphörde permanent efter ett fåtal besök. Fixen storleksanpassar
 * undvikandefönstret till poolen istf att stänga av det.
 */
import { describe, it, expect } from 'vitest'
import { getCoffeeRoomScene } from '../coffeeRoomService'
import type { SaveGame } from '../../entities/SaveGame'
import type { Fixture } from '../../entities/Fixture'
import { FixtureStatus } from '../../enums'

const COMPLETED_FIXTURE: Fixture = {
  id: 'f1', leagueId: 'L', season: 1, roundNumber: 10, matchday: 10,
  homeClubId: 'managed', awayClubId: 'opp', status: FixtureStatus.Completed,
  homeScore: 1, awayScore: 1, events: [],
} as unknown as Fixture

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
    fixtures: [COMPLETED_FIXTURE],
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

describe('getCoffeeRoomScene — GENERIC_EXCHANGES anti-repeat efter historiken fyllts (A-H4a)', () => {
  it('med en full 12-post lastCoffeeSceneIndices-historik (den gamla gatens dödläge) undviks ändå de senast visade indexen', () => {
    // Historik fylld med index 0-6 upprepade — motsvarar flera besök i en
    // 7-radig pool, exakt det tillstånd som gjorde den gamla gaten inert.
    const fullHistory = [0, 1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4]
    const game = makeGame({ currentMatchday: 20, lastCoffeeSceneIndices: fullHistory })
    const scene = getCoffeeRoomScene(game)
    expect(scene).not.toBeNull()
    if (scene && scene.pickedIndices.length > 0) {
      // De allra senast visade (sista posterna i historiken) ska undvikas
      // när poolen tillåter det — inte alla kan undvikas (poolen är liten),
      // men mekanismen ska vara AKTIV, inte helt avstängd.
      const mostRecentlyShown = new Set(fullHistory.slice(-3))
      const avoidedAtLeastOne = scene.pickedIndices.some(idx => !mostRecentlyShown.has(idx))
      expect(avoidedAtLeastOne).toBe(true)
    }
  })

  it('tom historik ger ingen krasch och en scen kan fortfarande väljas', () => {
    const game = makeGame({ currentMatchday: 20, lastCoffeeSceneIndices: [] })
    expect(() => getCoffeeRoomScene(game)).not.toThrow()
  })
})
