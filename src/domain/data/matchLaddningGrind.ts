// A3 — Match-laddning grind.
// Pure function: game + nextFixture → which beat to show (scene / band / none).
// Spec: docs/CODE-LEVERANS-MATCH-LADDNING-A3-2026-06-10.md §9

import type { SaveGame } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
import { getRoundCharacter, getStreakLength, type RoundCharacter } from './roundCharacter'
import type { LaddningOccasion, LaddningState } from './matchLaddningText'

// Band shows on: first reach ≥3, deepens to a milestone, or breaks.
const STREAK_MILESTONES = [3, 5, 7, 10]

export type LaddningBeat =
  | { tier: 'scene'; occasion: LaddningOccasion; isFinal: boolean }
  | { tier: 'band'; state: LaddningState; streakLength: number; isBroken: boolean }
  | { tier: 'none' }

export function computeLaddningBeat(game: SaveGame, nextFixture: Fixture): LaddningBeat {
  const char = getRoundCharacter(game)

  // Occasion tier — highest priority, maps to full scene
  if (nextFixture.isFinaldag === true) return { tier: 'scene', occasion: 'final', isFinal: true }
  if (nextFixture.isAnnandagen === true) return { tier: 'scene', occasion: 'annandagen', isFinal: false }
  if (nextFixture.isNyarsbandy === true) return { tier: 'scene', occasion: 'nyar', isFinal: false }
  if (nextFixture.isCup === true || char === 'cup_day') return { tier: 'scene', occasion: 'cup', isFinal: false }
  if (char === 'pre_derby') return { tier: 'scene', occasion: 'derby', isFinal: false }
  if (char === 'premiere') return { tier: 'scene', occasion: 'premiar', isFinal: false }

  // Broken streak beat — round immediately after streak ends
  const brokenState = getJustBrokenState(game, char)
  if (brokenState !== null) return { tier: 'band', state: brokenState, streakLength: 0, isBroken: true }

  // Active streak band — only on change-marker (≥3 / milestone / first)
  if (char === 'winning_streak' || char === 'losing_streak') {
    const state: LaddningState = char === 'winning_streak' ? 'winning_streak' : 'losing_streak'
    const streakLen = getStreakLength(game)
    if (shouldShowStreakBand(game, state, streakLen)) {
      return { tier: 'band', state, streakLength: streakLen, isBroken: false }
    }
  }

  return { tier: 'none' }
}

function getJustBrokenState(game: SaveGame, char: RoundCharacter): LaddningState | null {
  if (char === 'winning_streak' || char === 'losing_streak') return null
  const saved = game.matchLaddningBandShown
  if (!saved || saved.streakLength < 3) return null
  if (saved.matchday >= game.currentMatchday) return null
  // Only show broken beat within 2 matchdays of the last band
  if (saved.matchday < game.currentMatchday - 2) return null
  return saved.stateType
}

function shouldShowStreakBand(game: SaveGame, state: LaddningState, streakLen: number): boolean {
  const saved = game.matchLaddningBandShown

  // Within same matchday (user navigated back) — always show if same type
  if (saved?.matchday === game.currentMatchday && saved?.stateType === state) return true

  // First trigger or type changed
  if (!saved || saved.stateType !== state) return true

  // Show when a milestone is crossed since last shown
  return STREAK_MILESTONES.some(m => m > saved.streakLength && m <= streakLen)
}
