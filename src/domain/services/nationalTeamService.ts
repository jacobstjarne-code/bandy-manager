import type { SaveGame } from '../entities/SaveGame'

const CALLUP_COUNT_MIN = 3
const CALLUP_COUNT_MAX = 5

export function selectNationalTeam(game: SaveGame): string[] {
  // Only players from the managed club are tracked
  const squad = game.players.filter(p =>
    p.clubId === game.managedClubId && !p.isInjured && p.suspensionGamesRemaining === 0
  )
  if (squad.length === 0) return []

  // Sort by CA × form boost
  const scored = squad
    .map(p => ({
      id: p.id,
      score: p.currentAbility + (p.form > 65 ? 3 : 0),
      position: p.position,
      ca: p.currentAbility,
    }))
    .sort((a, b) => b.score - a.score)

  // Pick top candidate per position, then fill to min count
  const picked: string[] = []
  const positions = Array.from(new Set(scored.map(s => s.position)))

  for (const pos of positions) {
    const best = scored.find(s => s.position === pos && !picked.includes(s.id))
    if (best) picked.push(best.id)
    if (picked.length >= CALLUP_COUNT_MAX) break
  }

  // Fill to min if needed
  for (const s of scored) {
    if (picked.length >= CALLUP_COUNT_MIN) break
    if (!picked.includes(s.id)) picked.push(s.id)
  }

  // Seed-based: use season to make it deterministic per save
  const seed = game.currentSeason * 997 + 23
  const count = CALLUP_COUNT_MIN + (seed % (CALLUP_COUNT_MAX - CALLUP_COUNT_MIN + 1))
  return picked.slice(0, count)
}

export function applyCallupEffects(game: SaveGame, playerIds: string[]): SaveGame {
  const round = game.currentMatchday
  const updated = game.players.map(p => {
    if (!playerIds.includes(p.id)) return p
    return {
      ...p,
      nationalTeamCallups: (p.nationalTeamCallups ?? 0) + 1,
      lastNationalTeamCallup: game.currentSeason,
    }
  })
  return {
    ...game,
    players: updated,
    activeNationalTeamCamp: { startRound: round, endRound: round + 1, playerIds },
  }
}

export function applyReturnEffects(game: SaveGame): SaveGame {
  const camp = game.activeNationalTeamCamp
  if (!camp) return game
  const updated = game.players.map(p => {
    if (!camp.playerIds.includes(p.id)) return p
    return {
      ...p,
      form: Math.min(100, p.form + 4),
      morale: Math.min(100, p.morale + 6),
    }
  })
  return { ...game, players: updated, activeNationalTeamCamp: undefined }
}
