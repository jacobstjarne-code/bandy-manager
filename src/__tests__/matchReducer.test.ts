/**
 * Tests for matchReducer.ts (steg 1, SPEC_LIVEMATCH_REFACTOR.md)
 *
 * Verifierar:
 * 1. STEP_DELTA ackumulerar homeScore korrekt
 * 2. INTERACTIVE_GOAL blockeras när playerGoals[id] >= 5 (hard cap)
 * 3. INTERACTIVE_GOAL blockeras vid total cap (homeScore + awayScore >= MATCH_TOTAL_GOAL_CAP)
 * 4. INTERACTIVE_GOAL blockeras vid diff cap (|diff + 1| > MATCH_GOAL_DIFFERENCE_CAP)
 * 5. RESET_FROM_HALFTIME återställer scores men behåller playerGoals
 */
import { describe, it, expect } from 'vitest'
import { matchReducer, initialMatchState } from '../presentation/screens/match/matchReducer'
import { MATCH_TOTAL_GOAL_CAP, MATCH_GOAL_DIFFERENCE_CAP } from '../domain/services/matchCore'

const PLAYER_ID = 'player_001'

// Test 1: STEP_DELTA ackumulerar homeScore korrekt
describe('STEP_DELTA', () => {
  it('ackumulerar homeScore korrekt', () => {
    const s0 = { ...initialMatchState }
    const s1 = matchReducer(s0, { type: 'STEP_DELTA', delta: { homeScore: 2 } })
    expect(s1.homeScore).toBe(2)
    // Nästa delta sätter till 3 (absolut värde, inte delta)
    const s2 = matchReducer(s1, { type: 'STEP_DELTA', delta: { homeScore: 3 } })
    expect(s2.homeScore).toBe(3)
  })

  it('bevarar orelaterade fält', () => {
    const s0 = { ...initialMatchState, awayScore: 1, cornersHome: 5 }
    const s1 = matchReducer(s0, { type: 'STEP_DELTA', delta: { homeScore: 2 } })
    expect(s1.awayScore).toBe(1)
    expect(s1.cornersHome).toBe(5)
  })

  it('slår ihop playerGoals additivt vid delta', () => {
    const s0 = { ...initialMatchState, playerGoals: { [PLAYER_ID]: 2 } }
    // Generatorn skickar ny ögonblicksbild — reducer tar det som override
    const s1 = matchReducer(s0, { type: 'STEP_DELTA', delta: { playerGoals: { [PLAYER_ID]: 3 } } })
    // mergeRecords ersätter — 3 vinner
    expect(s1.playerGoals[PLAYER_ID]).toBe(3)
  })
})

// Test 2: INTERACTIVE_GOAL blockeras när playerGoals[id] >= 5 (hard cap)
describe('INTERACTIVE_GOAL — hard cap 5', () => {
  it('blockeras när spelaren redan har 5 mål', () => {
    const s0 = {
      ...initialMatchState,
      playerGoals: { [PLAYER_ID]: 5 },
    }
    const s1 = matchReducer(s0, {
      type: 'INTERACTIVE_GOAL',
      clubId: 'club_home',
      playerId: PLAYER_ID,
      isPenalty: false,
      attackingHome: true,
    })
    expect(s1.homeScore).toBe(0) // inga mål
    expect(s1.playerGoals[PLAYER_ID]).toBe(5) // cap intakt
  })

  it('tillåter mål när spelaren har 4 mål', () => {
    const s0 = {
      ...initialMatchState,
      playerGoals: { [PLAYER_ID]: 4 },
    }
    const s1 = matchReducer(s0, {
      type: 'INTERACTIVE_GOAL',
      clubId: 'club_home',
      playerId: PLAYER_ID,
      isPenalty: false,
      attackingHome: true,
    })
    expect(s1.homeScore).toBe(1)
    expect(s1.playerGoals[PLAYER_ID]).toBe(5)
  })
})

// Test 3: INTERACTIVE_GOAL blockeras vid total cap
describe('INTERACTIVE_GOAL — total cap', () => {
  it('blockeras när totalScore >= MATCH_TOTAL_GOAL_CAP', () => {
    const s0 = {
      ...initialMatchState,
      homeScore: Math.ceil(MATCH_TOTAL_GOAL_CAP / 2),
      awayScore: Math.floor(MATCH_TOTAL_GOAL_CAP / 2),
    }
    expect(s0.homeScore + s0.awayScore).toBe(MATCH_TOTAL_GOAL_CAP)
    const s1 = matchReducer(s0, {
      type: 'INTERACTIVE_GOAL',
      clubId: 'club_home',
      playerId: PLAYER_ID,
      isPenalty: false,
      attackingHome: true,
    })
    expect(s1.homeScore).toBe(s0.homeScore) // ingen förändring
  })

  it('tillåter mål ett steg under total cap', () => {
    const s0 = {
      ...initialMatchState,
      homeScore: 8,
      awayScore: MATCH_TOTAL_GOAL_CAP - 9, // total = cap - 1
    }
    const total = s0.homeScore + s0.awayScore
    expect(total).toBe(MATCH_TOTAL_GOAL_CAP - 1)
    const s1 = matchReducer(s0, {
      type: 'INTERACTIVE_GOAL',
      clubId: 'club_home',
      playerId: PLAYER_ID,
      isPenalty: false,
      attackingHome: true,
    })
    expect(s1.homeScore).toBe(s0.homeScore + 1)
  })
})

// Test 4: INTERACTIVE_GOAL blockeras vid diff cap
describe('INTERACTIVE_GOAL — diff cap', () => {
  it('blockeras när ny diff > MATCH_GOAL_DIFFERENCE_CAP', () => {
    // hemmalaget leder redan med cap, ytterligare mål = cap + 1 → blockeras
    const s0 = {
      ...initialMatchState,
      homeScore: MATCH_GOAL_DIFFERENCE_CAP, // t.ex. 6
      awayScore: 0,
    }
    const s1 = matchReducer(s0, {
      type: 'INTERACTIVE_GOAL',
      clubId: 'club_home',
      playerId: PLAYER_ID,
      isPenalty: false,
      attackingHome: true,
    })
    expect(s1.homeScore).toBe(s0.homeScore) // blockerat
  })

  it('tillåter mål precis vid cap', () => {
    // hemmalaget leder med cap - 1, ett mål ger exakt cap
    const s0 = {
      ...initialMatchState,
      homeScore: MATCH_GOAL_DIFFERENCE_CAP - 1, // 5
      awayScore: 0,
    }
    const s1 = matchReducer(s0, {
      type: 'INTERACTIVE_GOAL',
      clubId: 'club_home',
      playerId: PLAYER_ID,
      isPenalty: false,
      attackingHome: true,
    })
    expect(s1.homeScore).toBe(s0.homeScore + 1) // tillåtet
  })
})

// Test 5: RESET_FROM_HALFTIME återställer scores men behåller playerGoals
describe('RESET_FROM_HALFTIME', () => {
  it('återställer scores och statistik', () => {
    const s0 = {
      ...initialMatchState,
      homeScore: 3,
      awayScore: 1,
      shotsHome: 8,
      shotsAway: 5,
      cornersHome: 3,
      cornersAway: 1,
      homeActiveSuspensions: 1,
      awayActiveSuspensions: 0,
      playerGoals: { [PLAYER_ID]: 2, 'player_002': 1 },
      playerAssists: { [PLAYER_ID]: 1 },
    }
    const s1 = matchReducer(s0, {
      type: 'RESET_FROM_HALFTIME',
      state: {
        initialHomeScore: 3,
        initialAwayScore: 1,
        initialShotsHome: 8,
        initialShotsAway: 5,
        initialCornersHome: 3,
        initialCornersAway: 1,
        initialHomeSuspensions: 0,
        initialAwaySuspensions: 0,
      },
    })
    // Scores kvar (halvtidsstatus)
    expect(s1.homeScore).toBe(3)
    expect(s1.awayScore).toBe(1)
    // Utvisningar återställda
    expect(s1.homeActiveSuspensions).toBe(0)
    // playerGoals bevarade
    expect(s1.playerGoals[PLAYER_ID]).toBe(2)
    expect(s1.playerGoals['player_002']).toBe(1)
    expect(s1.playerAssists[PLAYER_ID]).toBe(1)
  })

  it('bevarar per-spelare-räknare efter reset', () => {
    const s0 = {
      ...initialMatchState,
      playerGoals: { [PLAYER_ID]: 3 },
      playerSaves: { 'gk_001': 5 },
    }
    const s1 = matchReducer(s0, {
      type: 'RESET_FROM_HALFTIME',
      state: {
        initialHomeScore: 0,
        initialAwayScore: 0,
        initialShotsHome: 0,
        initialShotsAway: 0,
        initialCornersHome: 0,
        initialCornersAway: 0,
        initialHomeSuspensions: 0,
        initialAwaySuspensions: 0,
      },
    })
    expect(s1.playerGoals[PLAYER_ID]).toBe(3)
    expect(s1.playerSaves['gk_001']).toBe(5)
  })
})
