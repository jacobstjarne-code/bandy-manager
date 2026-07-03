import type { SaveGame } from '../entities/SaveGame'

// M16 (regelboksanpassning 2026-07-03): förtjänstmodell. Ersätter den tidigare
// alltid-3-till-5-uttagna-logiken (underminerade "säsongens guldkorn"-premissen
// i landslagText — varje bruksklubb fick garanterat flera landslagsspelare).
// Bara spelare med currentAbility ≥ tröskeln kvalar. Tröskeln kalibrerad via
// Monte Carlo mot samma tier/CA-fördelning som worldGenerator.ts genererar
// (tierFromReputation: top ≥75 rep → CA 55-75 bas, mid 55-74 rep → CA 42-62
// bas, under <55 rep → CA 30-52 bas, alla ±8 jitter): vid tröskel 66 får en
// toppklubb (rep ≥75) konsekvent 2 uttagna (cap), en mittenklubb (rep 55-74,
// "bruksklubb") i snitt 0,6-0,7 (dvs oftast 0, ibland 1), en klubb under 55
// rep i praktiken aldrig. 0 uttagna är ett GILTIGT utfall — no-opas tyst av
// anropskoden i roundProcessor.ts (calledUpIds.length > 0-grinden finns redan).
export const LANDSLAGS_CA_TROSKEL = 66
export const CALLUP_CAP = 2

export function selectNationalTeam(game: SaveGame): string[] {
  // Only players from the managed club are tracked
  const squad = game.players.filter(p =>
    p.clubId === game.managedClubId && !p.isInjured && p.suspensionGamesRemaining === 0
  )

  const qualified = squad
    .filter(p => p.currentAbility >= LANDSLAGS_CA_TROSKEL)
    .map(p => ({ id: p.id, score: p.currentAbility + (p.form > 65 ? 3 : 0) }))
    .sort((a, b) => b.score - a.score)

  return qualified.slice(0, CALLUP_CAP).map(p => p.id)
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
