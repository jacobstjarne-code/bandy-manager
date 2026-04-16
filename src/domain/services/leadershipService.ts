import type { SaveGame } from '../entities/SaveGame'
import type { Player } from '../entities/Player'

export type LeadershipAction = 'lower_tempo' | 'mentor' | 'private_talk' | 'public_praise'

// Cooldowns in matchdays
const COOLDOWNS: Record<LeadershipAction, number> = {
  lower_tempo: 2,
  mentor: 3,
  private_talk: 3,
  public_praise: 5,
}

export function getActiveLeadershipAction(
  game: SaveGame,
  playerId: string,
  action: LeadershipAction,
  currentRound: number,
): { active: boolean; expiresRound: number } | null {
  const entry = (game.leadershipActions ?? []).find(
    a => a.playerId === playerId && a.action === action && a.expiresRound > currentRound,
  )
  return entry ? { active: true, expiresRound: entry.expiresRound } : null
}

export function canUseLeadershipAction(
  game: SaveGame,
  playerId: string,
  action: LeadershipAction,
  currentRound: number,
): boolean {
  const recent = (game.leadershipActions ?? []).filter(
    a => a.playerId === playerId && a.action === action,
  )
  if (recent.length === 0) return true
  const last = recent[recent.length - 1]
  return currentRound >= last.fromRound + COOLDOWNS[action]
}

export interface LeadershipResult {
  playerUpdates: Partial<Player>
  affectedPlayerIds?: string[]  // for public_praise jealousy
  affectedMoraleChange?: number  // jealousy delta (negative)
  feedback: string
  leadershipEntry: NonNullable<SaveGame['leadershipActions']>[number]
}

export function applyLeadershipAction(
  game: SaveGame,
  playerId: string,
  action: LeadershipAction,
  currentRound: number,
): LeadershipResult | null {
  if (!canUseLeadershipAction(game, playerId, action, currentRound)) return null

  const player = game.players.find(p => p.id === playerId)
  if (!player) return null

  const expiresRound = currentRound + COOLDOWNS[action]

  switch (action) {
    case 'lower_tempo': {
      const fitnessGain = 2
      return {
        playerUpdates: { fitness: Math.min(100, (player.fitness ?? 100) + fitnessGain) },
        feedback: `${player.firstName} nickar och andas ut. Kanske tar det ner trycket lite.`,
        leadershipEntry: { playerId, action, fromRound: currentRound, expiresRound, effect: { stat: 'fitness', delta: fitnessGain } },
      }
    }

    case 'mentor': {
      // Find youngest squad player under 22 to mentor
      const youngPlayer = game.players
        .filter(p => p.clubId === game.managedClubId && p.id !== playerId && p.age < 22)
        .sort((a, b) => a.age - b.age)[0]

      const targetName = youngPlayer ? `${youngPlayer.firstName} ${youngPlayer.lastName}` : 'ett ungt proffs'
      return {
        playerUpdates: {},
        feedback: `${player.firstName} tar ${targetName} under sina vingar. Bra för stämningen i omklädningsrummet.`,
        leadershipEntry: { playerId, action, fromRound: currentRound, expiresRound, effect: { stat: 'mentorship', delta: 1 } },
      }
    }

    case 'private_talk': {
      const baseDelta = player.form >= 50 ? 3 : -2
      return {
        playerUpdates: { morale: Math.max(0, Math.min(100, player.morale + baseDelta)) },
        feedback: baseDelta > 0
          ? `${player.firstName} lyssnar. Verkar gå hem.`
          : `${player.firstName} tar det tungt. Svårt samtal.`,
        leadershipEntry: { playerId, action, fromRound: currentRound, expiresRound, effect: { stat: 'morale', delta: baseDelta } },
      }
    }

    case 'public_praise': {
      const moraleGain = 5
      const jealousyDelta = -2
      const squadMates = game.players.filter(
        p => p.clubId === game.managedClubId && p.id !== playerId,
      )
      return {
        playerUpdates: { morale: Math.min(100, player.morale + moraleGain) },
        affectedPlayerIds: squadMates.map(p => p.id),
        affectedMoraleChange: jealousyDelta,
        feedback: `Laget hör på. ${player.firstName} strålar. Några andra ser lite snett på varandra.`,
        leadershipEntry: { playerId, action, fromRound: currentRound, expiresRound, effect: { stat: 'morale', delta: moraleGain } },
      }
    }
  }
}
