// DREAM-003: Spridningseffekter
// Systemkorsningar: stjärna skadad, derby-seger, mecenat lämnar.

import type { SaveGame } from '../entities/SaveGame'

export type RippleTrigger =
  | { type: 'star_injured'; playerId: string }
  | { type: 'big_derby_win'; fixtureId: string }
  | { type: 'mecenat_left'; mecenatId: string }

export function applyRipples(game: SaveGame, trigger: RippleTrigger): SaveGame {
  switch (trigger.type) {
    case 'star_injured':
      return applyStarInjuryRipples(game, trigger.playerId)
    case 'big_derby_win':
      return applyBigDerbyWinRipples(game)
    case 'mecenat_left':
      return applyMecenatLeftRipples(game, trigger.mecenatId)
  }
}

function applyStarInjuryRipples(game: SaveGame, playerId: string): SaveGame {
  const player = game.players.find(p => p.id === playerId)
  if (!player) return game

  // Only ripple for managed-club stars (CA ≥ 60)
  if (player.clubId !== game.managedClubId || player.currentAbility < 60) return game

  return {
    ...game,
    fanMood: Math.max(0, (game.fanMood ?? 50) - 5),
  }
}

function applyBigDerbyWinRipples(game: SaveGame): SaveGame {
  let updated = game

  // fanMood +8
  updated = { ...updated, fanMood: Math.min(100, (updated.fanMood ?? 50) + 8) }

  // Supporter group mood +10 (if exists)
  if (updated.supporterGroup) {
    updated = {
      ...updated,
      supporterGroup: {
        ...updated.supporterGroup,
        mood: Math.min(100, (updated.supporterGroup.mood ?? 50) + 10),
      },
    }
  }

  // Community standing +5
  updated = { ...updated, communityStanding: Math.min(100, (updated.communityStanding ?? 50) + 5) }

  // Sponsors: bump all active sponsor incomes by 5% for one season via sponsor mood
  updated = {
    ...updated,
    sponsorNetworkMood: Math.min(100, (updated.sponsorNetworkMood ?? 50) + 5),
  }

  return updated
}

function applyMecenatLeftRipples(game: SaveGame, _mecenatId: string): SaveGame {
  let updated = game

  // communityStanding −8
  updated = { ...updated, communityStanding: Math.max(0, (updated.communityStanding ?? 50) - 8) }

  // boardPatience −10
  updated = { ...updated, boardPatience: Math.max(0, (updated.boardPatience ?? 70) - 10) }

  // Supporter mood −5
  if (updated.supporterGroup) {
    updated = {
      ...updated,
      supporterGroup: {
        ...updated.supporterGroup,
        mood: Math.max(0, (updated.supporterGroup.mood ?? 50) - 5),
      },
    }
  }

  return updated
}
