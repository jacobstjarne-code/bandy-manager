import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { setLineup } from '../setLineup'
import { advanceToNextEvent } from '../advanceToNextEvent'
import { PlayerPosition } from '../../../domain/enums'
import type { SaveGame } from '../../../domain/entities/SaveGame'

function makeGame(): SaveGame {
  return createNewGame({ managerName: 'Jacob', clubId: 'club_forsbacka', season: 2025, seed: 5 })
}

function getValidLineup(game: SaveGame, clubId: string): { startingPlayerIds: string[]; benchPlayerIds: string[] } {
  const clubPlayers = game.players.filter(
    p => p.clubId === clubId && !p.isInjured && p.suspensionGamesRemaining === 0,
  )

  const sorted = [...clubPlayers].sort((a, b) => b.currentAbility - a.currentAbility)

  // Ensure a GK is in starters
  const gkPool = sorted.filter(p => p.position === PlayerPosition.Goalkeeper)
  const outfieldPool = sorted.filter(p => p.position !== PlayerPosition.Goalkeeper)

  const starters: string[] = []
  if (gkPool.length > 0) starters.push(gkPool[0].id)

  for (const p of outfieldPool) {
    if (starters.length >= 11) break
    starters.push(p.id)
  }

  // Fill up if needed
  if (starters.length < 11) {
    for (const p of gkPool.slice(1)) {
      if (starters.length >= 11) break
      starters.push(p.id)
    }
  }

  const starterSet = new Set(starters)
  const bench: string[] = sorted
    .filter(p => !starterSet.has(p.id))
    .slice(0, 5)
    .map(p => p.id)

  return { startingPlayerIds: starters, benchPlayerIds: bench }
}

describe('setLineup', () => {
  it('valid lineup returns success: true', () => {
    const game = makeGame()
    const { startingPlayerIds, benchPlayerIds } = getValidLineup(game, 'club_forsbacka')

    const result = setLineup({
      game,
      clubId: 'club_forsbacka',
      startingPlayerIds,
      benchPlayerIds,
    })

    expect(result.success).toBe(true)
  })

  it('10 players (not 11) returns error about exactly 11 players', () => {
    const game = makeGame()
    const { startingPlayerIds } = getValidLineup(game, 'club_forsbacka')
    const tenPlayers = startingPlayerIds.slice(0, 10)

    const result = setLineup({
      game,
      clubId: 'club_forsbacka',
      startingPlayerIds: tenPlayers,
      benchPlayerIds: [],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('11')
    }
  })

  it('injured player in lineup returns error mentioning player name', () => {
    const game = makeGame()
    const { startingPlayerIds, benchPlayerIds } = getValidLineup(game, 'club_forsbacka')

    // Manually injure the first starter
    const injuredPlayerId = startingPlayerIds[0]
    const modifiedPlayers = game.players.map(p =>
      p.id === injuredPlayerId ? { ...p, isInjured: true } : p,
    )
    const modifiedGame = { ...game, players: modifiedPlayers }

    const result = setLineup({
      game: modifiedGame,
      clubId: 'club_forsbacka',
      startingPlayerIds,
      benchPlayerIds,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const injuredPlayer = game.players.find(p => p.id === injuredPlayerId)!
      expect(result.error).toContain(injuredPlayer.firstName)
    }
  })

  it('suspended player in lineup returns error', () => {
    const game = makeGame()
    const { startingPlayerIds, benchPlayerIds } = getValidLineup(game, 'club_forsbacka')

    const suspendedPlayerId = startingPlayerIds[0]
    const modifiedPlayers = game.players.map(p =>
      p.id === suspendedPlayerId ? { ...p, suspensionGamesRemaining: 3 } : p,
    )
    const modifiedGame = { ...game, players: modifiedPlayers }

    const result = setLineup({
      game: modifiedGame,
      clubId: 'club_forsbacka',
      startingPlayerIds,
      benchPlayerIds,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('avstängd')
    }
  })

  it('no goalkeeper in lineup is allowed (warning shown in UI, not hard block)', () => {
    const game = makeGame()
    const clubPlayers = game.players.filter(
      p => p.clubId === 'club_forsbacka' && !p.isInjured && p.suspensionGamesRemaining === 0,
    )
    const outfieldOnly = clubPlayers
      .filter(p => p.position !== PlayerPosition.Goalkeeper)
      .sort((a, b) => b.currentAbility - a.currentAbility)
      .slice(0, 11)
      .map(p => p.id)

    if (outfieldOnly.length < 11) {
      // Not enough outfield players to test; skip
      return
    }

    const result = setLineup({
      game,
      clubId: 'club_forsbacka',
      startingPlayerIds: outfieldOnly,
      benchPlayerIds: [],
    })

    // GK-less lineup is now allowed — warning shown in LineupStep UI instead of hard block
    expect(result.success).toBe(true)
  })

  it('A-H3 (DOM_AH3_TILLGANGLIGHET_2026-08-28.md): vilande spelare (restGamesRemaining) i lineup returnerar fel, SKILT från isInjured', () => {
    const game = makeGame()
    const { startingPlayerIds, benchPlayerIds } = getValidLineup(game, 'club_forsbacka')

    const restedPlayerId = startingPlayerIds[0]
    const modifiedPlayers = game.players.map(p =>
      p.id === restedPlayerId ? { ...p, restGamesRemaining: 1 } : p,
    )
    const modifiedGame = { ...game, players: modifiedPlayers }

    const result = setLineup({
      game: modifiedGame,
      clubId: 'club_forsbacka',
      startingPlayerIds,
      benchPlayerIds,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const restedPlayer = game.players.find(p => p.id === restedPlayerId)!
      expect(result.error).toContain(restedPlayer.firstName)
      // Texten får ALDRIG säga "skadad" om orsaken är vila/överbelastning.
      expect(result.error).not.toContain('skadad')
      expect(result.error).not.toContain('avstängd')
    }
  })

  it('A-H3: restGamesRemaining=0 (nedräknat klart) blockerar INTE — spelaren är åter valbar', () => {
    const game = makeGame()
    const { startingPlayerIds, benchPlayerIds } = getValidLineup(game, 'club_forsbacka')

    const modifiedPlayers = game.players.map(p =>
      p.id === startingPlayerIds[0] ? { ...p, restGamesRemaining: 0 } : p,
    )
    const modifiedGame = { ...game, players: modifiedPlayers }

    const result = setLineup({
      game: modifiedGame,
      clubId: 'club_forsbacka',
      startingPlayerIds,
      benchPlayerIds,
    })

    expect(result.success).toBe(true)
  })

  it('player from wrong club returns error', () => {
    const game = makeGame()
    const { startingPlayerIds, benchPlayerIds } = getValidLineup(game, 'club_forsbacka')

    // Replace one player with a player from a different club
    const wrongClubPlayer = game.players.find(p => p.clubId === 'club_soderfors')!
    const modifiedStarters = [...startingPlayerIds]
    modifiedStarters[modifiedStarters.length - 1] = wrongClubPlayer.id

    const result = setLineup({
      game,
      clubId: 'club_forsbacka',
      startingPlayerIds: modifiedStarters,
      benchPlayerIds,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('tillhör inte klubben')
    }
  })

  it('avvisar en utlånad spelare även om clubId fortfarande pekar på ägarklubben', () => {
    const game = makeGame()
    const { startingPlayerIds, benchPlayerIds } = getValidLineup(game, 'club_forsbacka')
    const loanedId = startingPlayerIds[0]
    const modifiedGame = {
      ...game,
      players: game.players.map(p => p.id === loanedId ? { ...p, isOnLoan: true } : p),
      clubs: game.clubs.map(c => c.id === game.managedClubId
        ? { ...c, squadPlayerIds: c.squadPlayerIds.filter(id => id !== loanedId) }
        : c),
    }

    const result = setLineup({
      game: modifiedGame,
      clubId: game.managedClubId,
      startingPlayerIds,
      benchPlayerIds,
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('matchtruppen')
  })

  it('valid lineup is stored in game.managedClubPendingLineup', () => {
    const game = makeGame()
    const { startingPlayerIds, benchPlayerIds } = getValidLineup(game, 'club_forsbacka')

    const result = setLineup({
      game,
      clubId: 'club_forsbacka',
      startingPlayerIds,
      benchPlayerIds,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.game.managedClubPendingLineup).toBeDefined()
      expect(result.game.managedClubPendingLineup?.startingPlayerIds).toEqual(startingPlayerIds)
    }
  })

  it('after advanceToNextEvent with pending lineup: managedClubPendingLineup is cleared', () => {
    const game = makeGame()
    const { startingPlayerIds, benchPlayerIds } = getValidLineup(game, 'club_forsbacka')

    const lineupResult = setLineup({
      game,
      clubId: 'club_forsbacka',
      startingPlayerIds,
      benchPlayerIds,
    })
    expect(lineupResult.success).toBe(true)
    if (!lineupResult.success) return

    const gameWithLineup = lineupResult.game
    expect(gameWithLineup.managedClubPendingLineup).toBeDefined()

    const advanceResult = advanceToNextEvent(gameWithLineup, 1)
    expect(advanceResult.game.managedClubPendingLineup).toBeUndefined()
  })
})
