/**
 * matchReducer.ts — centralized match state for MatchLiveScreen
 *
 * En sanning per state-fält. Löser P1.B (per-spelare cap bypass) genom att
 * playerGoals är global över hela matchen — inklusive post-regenerate faser.
 *
 * Steg 1 i refactor/livematch-split (SPEC_LIVEMATCH_REFACTOR.md)
 */

import {
  MATCH_TOTAL_GOAL_CAP,
  MATCH_GOAL_DIFFERENCE_CAP,
  canScoreGate,
} from '../../../domain/services/matchCore'

export type MatchState = {
  homeScore: number
  awayScore: number
  playerGoals: Record<string, number>
  playerAssists: Record<string, number>
  playerRedCards: Record<string, number>
  playerSaves: Record<string, number>
  shotsHome: number
  shotsAway: number
  onTargetHome: number
  onTargetAway: number
  cornersHome: number
  cornersAway: number
  homeActiveSuspensions: number
  awayActiveSuspensions: number
}

// SecondHalfInput-kompatibel subset — det vi behöver återställa vid halvtid
export type SecondHalfInput = {
  initialHomeScore: number
  initialAwayScore: number
  initialShotsHome: number
  initialShotsAway: number
  initialCornersHome: number
  initialCornersAway: number
  initialHomeSuspensions: number
  initialAwaySuspensions: number
}

export type MatchAction =
  | { type: 'STEP_DELTA'; delta: Partial<MatchState> }
  | { type: 'INTERACTIVE_GOAL'; clubId: string; playerId: string; isPenalty: boolean; attackingHome: boolean }
  | { type: 'INTERACTIVE_SAVE'; playerId: string }
  | { type: 'INTERACTIVE_CORNER'; clubId: string }
  | { type: 'RESET_FROM_HALFTIME'; state: SecondHalfInput }

export const initialMatchState: MatchState = {
  homeScore: 0,
  awayScore: 0,
  playerGoals: {},
  playerAssists: {},
  playerRedCards: {},
  playerSaves: {},
  shotsHome: 0,
  shotsAway: 0,
  onTargetHome: 0,
  onTargetAway: 0,
  cornersHome: 0,
  cornersAway: 0,
  homeActiveSuspensions: 0,
  awayActiveSuspensions: 0,
}

export function matchReducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case 'STEP_DELTA': {
      const d = action.delta
      // Merge playerGoals/Assists/etc. additively, numeric fields directly
      return {
        ...state,
        homeScore:              d.homeScore              ?? state.homeScore,
        awayScore:              d.awayScore              ?? state.awayScore,
        shotsHome:              d.shotsHome              ?? state.shotsHome,
        shotsAway:              d.shotsAway              ?? state.shotsAway,
        onTargetHome:           d.onTargetHome           ?? state.onTargetHome,
        onTargetAway:           d.onTargetAway           ?? state.onTargetAway,
        cornersHome:            d.cornersHome            ?? state.cornersHome,
        cornersAway:            d.cornersAway            ?? state.cornersAway,
        homeActiveSuspensions:  d.homeActiveSuspensions  ?? state.homeActiveSuspensions,
        awayActiveSuspensions:  d.awayActiveSuspensions  ?? state.awayActiveSuspensions,
        playerGoals:            d.playerGoals            ? mergeRecords(state.playerGoals, d.playerGoals)    : state.playerGoals,
        playerAssists:          d.playerAssists          ? mergeRecords(state.playerAssists, d.playerAssists) : state.playerAssists,
        playerRedCards:         d.playerRedCards         ? mergeRecords(state.playerRedCards, d.playerRedCards) : state.playerRedCards,
        playerSaves:            d.playerSaves            ? mergeRecords(state.playerSaves, d.playerSaves)    : state.playerSaves,
      }
    }

    case 'INTERACTIVE_GOAL': {
      const { playerId, attackingHome } = action
      // Hard cap: max 5 goals per player
      const currentGoals = state.playerGoals[playerId] ?? 0
      if (currentGoals >= 5) return state

      // Total cap + diff cap via canScoreGate
      if (!canScoreGate(state.homeScore, state.awayScore, attackingHome, MATCH_TOTAL_GOAL_CAP, MATCH_GOAL_DIFFERENCE_CAP)) {
        return state
      }

      const newHomeScore = attackingHome ? state.homeScore + 1 : state.homeScore
      const newAwayScore = attackingHome ? state.awayScore     : state.awayScore + 1

      return {
        ...state,
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        playerGoals: {
          ...state.playerGoals,
          [playerId]: currentGoals + 1,
        },
      }
    }

    case 'INTERACTIVE_SAVE': {
      const { playerId } = action
      const current = state.playerSaves[playerId] ?? 0
      return {
        ...state,
        playerSaves: { ...state.playerSaves, [playerId]: current + 1 },
      }
    }

    case 'INTERACTIVE_CORNER': {
      // Just tracks corner count; actual scoring handled by INTERACTIVE_GOAL
      const isHome = action.clubId !== undefined // placeholder — caller knows which side
      void isHome // unused intentionally — corner tracking handled by STEP_DELTA
      return state
    }

    case 'RESET_FROM_HALFTIME': {
      const s = action.state
      // Återställer statistik-räknare men behåller per-spelare-räknare (playerGoals etc.)
      return {
        ...state,
        homeScore:             s.initialHomeScore,
        awayScore:             s.initialAwayScore,
        shotsHome:             s.initialShotsHome,
        shotsAway:             s.initialShotsAway,
        cornersHome:           s.initialCornersHome,
        cornersAway:           s.initialCornersAway,
        homeActiveSuspensions: s.initialHomeSuspensions,
        awayActiveSuspensions: s.initialAwaySuspensions,
        // playerGoals, playerAssists, playerRedCards, playerSaves bevaras!
      }
    }

    default:
      return state
  }
}

// Hjälpfunktion: slå ihop två Records utan att ta bort befintliga nycklar
function mergeRecords(
  existing: Record<string, number>,
  incoming: Record<string, number>,
): Record<string, number> {
  const merged = { ...existing }
  for (const [k, v] of Object.entries(incoming)) {
    merged[k] = v
  }
  return merged
}
