/**
 * hallTrial — 06-12-modellen (B1 omarbete).
 * Testar: stödformel, krav-beräkning, shouldStartHallTrial.
 */
import { describe, it, expect } from 'vitest'
import { shouldStartHallTrial, computeKravStatus } from '../domain/services/events/hallProcessService'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { HallTrial } from '../domain/entities/Community'

// Minimal SaveGame-stub
function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    managerName: 'Test',
    managedClubId: 'club1',
    currentSeason: 3,
    currentMatchday: 10,
    currentDate: '2026-01-01',
    players: [],
    clubs: [
      { id: 'club1', name: 'Testlaget', finances: 0 } as unknown as SaveGame['clubs'][0],
      { id: 'club2', name: 'Rival', hasIndoorArena: true } as unknown as SaveGame['clubs'][0],
    ],
    fixtures: [],
    pendingEvents: [],
    transferBids: [],
    handledContractPlayerIds: [],
    sponsors: [],
    seasonSummaries: [],
    scoutReports: {},
    activeScoutAssignment: null,
    scoutBudget: 0,
    playoffBracket: null,
    cupBracket: null,
    league: {} as SaveGame['league'],
    standings: [],
    managedClubTraining: 'general',
    trainingHistory: [],
    mentorships: [],
    loanDeals: [],
    deferredDecisions: [],
    phaseMarksSeen: [],
    version: '1.0',
    lastSavedAt: '2026-01-01T00:00:00Z',
    facilityState: {
      builtNodeIds: ['laktare_ostra'],
    },
    ...overrides,
  } as unknown as SaveGame
}

// ── shouldStartHallTrial ──────────────────────────────────────────────────

describe('shouldStartHallTrial', () => {
  it('returnerar true när inga hinder finns', () => {
    expect(shouldStartHallTrial(makeGame())).toBe(true)
  })

  it('kräver säsong >= 2', () => {
    expect(shouldStartHallTrial(makeGame({ currentSeason: 1 }))).toBe(false)
  })

  it('kräver laktare_ostra', () => {
    expect(shouldStartHallTrial(makeGame({
      facilityState: { builtNodeIds: [] },
    }))).toBe(false)
  })

  it('kräver minst en rival med hall', () => {
    expect(shouldStartHallTrial(makeGame({
      clubs: [
        { id: 'club1', name: 'Testlaget' } as unknown as SaveGame['clubs'][0],
        { id: 'club2', name: 'Rival', hasIndoorArena: false } as unknown as SaveGame['clubs'][0],
      ],
    }))).toBe(false)
  })

  it('blockeras av aktivt bygge', () => {
    expect(shouldStartHallTrial(makeGame({
      facilityState: {
        builtNodeIds: ['laktare_ostra'],
        activeProject: { nodeId: 'nagot', startedMatchday: 1, etaMatchday: 10 },
      },
    }))).toBe(false)
  })

  it('tillåter omstart när bordlagd och cooldown passerad', () => {
    const trial: HallTrial = {
      stage: 'bordlagd',
      support: 48,
      startedSeason: 2,
      stageStartedRound: 5,
      cooldownUntilSeason: 3,
    }
    const game = makeGame({ currentSeason: 3, facilityState: { builtNodeIds: ['laktare_ostra'], hallTrial: trial } })
    expect(shouldStartHallTrial(game)).toBe(true)
  })

  it('blockerar omstart när bordlagd och cooldown ej passerad', () => {
    const trial: HallTrial = {
      stage: 'bordlagd',
      support: 48,
      startedSeason: 2,
      stageStartedRound: 5,
      cooldownUntilSeason: 4,
    }
    const game = makeGame({ currentSeason: 3, facilityState: { builtNodeIds: ['laktare_ostra'], hallTrial: trial } })
    expect(shouldStartHallTrial(game)).toBe(false)
  })

  it('blockerar när trial är aktiv (forankring)', () => {
    const trial: HallTrial = { stage: 'forankring', support: 55, startedSeason: 3, stageStartedRound: 2 }
    expect(shouldStartHallTrial(makeGame({
      facilityState: { builtNodeIds: ['laktare_ostra'], hallTrial: trial },
    }))).toBe(false)
  })
})

// ── computeKravStatus ─────────────────────────────────────────────────────

describe('computeKravStatus', () => {
  it('kapital: godkänt vid kassa >= 1 200 000', () => {
    const game = makeGame({
      clubs: [
        { id: 'club1', name: 'Testlaget', finances: 1_500_000 } as unknown as SaveGame['clubs'][0],
        { id: 'club2', name: 'Rival', hasIndoorArena: true } as unknown as SaveGame['clubs'][0],
      ],
      averageAttendance: 400,
    })
    const krav = computeKravStatus(game)
    expect(krav.kapital).toBe(true)
  })

  it('kapital: underkänt vid låg kassa och ingen patron', () => {
    const game = makeGame({ averageAttendance: 400 })
    const krav = computeKravStatus(game)
    expect(krav.kapital).toBe(false)
  })

  it('kapital: godkänt via aktiv patron med happiness >= 50', () => {
    const game = makeGame({
      mecenater: [{ id: 'm1', isActive: true, happiness: 60 } as unknown as SaveGame['mecenater'][0]],
      averageAttendance: 400,
    })
    const krav = computeKravStatus(game)
    expect(krav.kapital).toBe(true)
  })

  it('styrelse: godkänt om ingen historik (benefit of doubt)', () => {
    const { styrelse } = computeKravStatus(makeGame({ boardObjectiveHistory: [] }))
    expect(styrelse).toBe(true)
  })

  it('styrelse: godkänt om >= 50 % mål nåddes', () => {
    const game = makeGame({
      currentSeason: 3,
      boardObjectiveHistory: [
        { season: 2, objectiveId: 'a', result: 'met', ownerReaction: '' },
        { season: 2, objectiveId: 'b', result: 'failed', ownerReaction: '' },
      ],
    })
    expect(computeKravStatus(game).styrelse).toBe(true)
  })

  it('styrelse: underkänt om < 50 % mål nåddes', () => {
    const game = makeGame({
      currentSeason: 3,
      boardObjectiveHistory: [
        { season: 2, objectiveId: 'a', result: 'failed', ownerReaction: '' },
        { season: 2, objectiveId: 'b', result: 'failed', ownerReaction: '' },
        { season: 2, objectiveId: 'c', result: 'met', ownerReaction: '' },
      ],
    })
    expect(computeKravStatus(game).styrelse).toBe(false)
  })
})
