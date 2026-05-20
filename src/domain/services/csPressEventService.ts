/**
 * C-B1 — CS-villkorad pressfråga
 * Triggas när det hanterade laget håller noll i en hemmaseriematch.
 * Journalisten ber tränaren kommentera.
 */

import type { SaveGame } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
import type { GameEvent } from '../entities/GameEvent'
import type { Player } from '../entities/Player'
import { PlayerPosition } from '../enums'
import { pickCSPressQuestion, CS_PRESS_CHOICE_BUTTONS } from '../data/csPressEventText'

// ── CS streak ────────────────────────────────────────────────────────────────

/**
 * How many consecutive CS has the managed club had in home league matches,
 * including the current fixture?
 */
export function computeCSStreak(game: SaveGame, currentFixture: Fixture): number {
  const managedId = game.managedClubId
  const isHome = currentFixture.homeClubId === managedId

  // This match must be a clean sheet (opponent scored 0)
  const theirGoals = isHome
    ? (currentFixture.awayScore ?? 0)
    : (currentFixture.homeScore ?? 0)
  if (theirGoals !== 0) return 0

  // Count consecutive CS in prior completed league home matches (same season)
  const priorLeagueHomeMatches = game.fixtures
    .filter(f =>
      f.id !== currentFixture.id &&
      f.status === 'completed' &&
      !f.isCup &&
      f.homeClubId === managedId &&
      f.season === game.currentSeason,
    )
    .sort((a, b) => b.matchday - a.matchday)

  let streak = 1
  for (const f of priorLeagueHomeMatches) {
    const opponentGoals = f.awayScore ?? 0
    if (opponentGoals === 0) {
      streak++
    } else {
      break
    }
  }
  return streak
}

// ── Trigger decision ─────────────────────────────────────────────────────────

export function shouldTriggerCSPress(
  game: SaveGame,
  currentFixture: Fixture,
  streak: number,
  rand: () => number,
): boolean {
  // Only home league matches
  if (currentFixture.isCup) return false
  if (currentFixture.homeClubId !== game.managedClubId) return false

  // Opponent must have 0 goals (CS)
  const theirGoals = currentFixture.awayScore ?? 0
  if (theirGoals !== 0) return false

  // Journalist must exist
  if (!game.journalist) return false

  // Cooldown: 4 rounds between CS press events
  const currentMatchday = currentFixture.matchday
  if (
    game.lastCSPressMatchday !== undefined &&
    currentMatchday - game.lastCSPressMatchday < 4
  ) return false

  // Probability by streak
  const prob = streak >= 3 ? 0.60 : streak === 2 ? 0.35 : 0.25
  return rand() < prob
}

// ── Player selection ──────────────────────────────────────────────────────────

export function pickCSPressPlayer(
  game: SaveGame,
  fixture: Fixture,
  rand: () => number,
): Player | null {
  const managedId = game.managedClubId
  const lineup = fixture.homeClubId === managedId
    ? fixture.homeLineup
    : fixture.awayLineup
  const startingIds = new Set(lineup?.startingPlayerIds ?? [])

  const managedPlayers = game.players.filter(
    p => p.clubId === managedId && startingIds.has(p.id) && !p.isInjured,
  )
  if (managedPlayers.length === 0) return null

  const getRating = (playerId: string) => {
    const p = managedPlayers.find(mp => mp.id === playerId)
    return p?.seasonStats?.averageRating ?? 5.0
  }

  const r = rand()
  if (r < 0.55) {
    // 55% GK
    const gks = managedPlayers.filter(p => p.position === PlayerPosition.Goalkeeper)
    if (gks.length > 0) return gks.reduce((a, b) => getRating(a.id) >= getRating(b.id) ? a : b)
  } else if (r < 0.85) {
    // 30% best defender
    const defs = managedPlayers.filter(p => p.position === PlayerPosition.Defender)
    if (defs.length > 0) return defs.reduce((a, b) => getRating(a.id) >= getRating(b.id) ? a : b)
  }
  // 15% best Half (defensive midfielder in bandy)
  const halfs = managedPlayers.filter(p => p.position === PlayerPosition.Half)
  if (halfs.length > 0) return halfs.reduce((a, b) => getRating(a.id) >= getRating(b.id) ? a : b)
  // fallback: best rated starting player
  return managedPlayers.reduce((a, b) => getRating(a.id) >= getRating(b.id) ? a : b)
}

// ── Event builder ─────────────────────────────────────────────────────────────

export function buildCSPressEvent(
  game: SaveGame,
  fixture: Fixture,
  player: Player,
): GameEvent {
  const journalist = game.journalist!
  const relationship = journalist.relationship ?? game.journalistRelationship ?? 50
  const question = pickCSPressQuestion(player, fixture.id, relationship)

  return {
    id: `csPress_${fixture.id}`,
    type: 'csPress',
    title: journalist.name,
    body: question,
    choices: [
      { id: 'individual', label: CS_PRESS_CHOICE_BUTTONS.individual, effect: { type: 'noOp' } },
      { id: 'team',       label: CS_PRESS_CHOICE_BUTTONS.team,       effect: { type: 'noOp' } },
      { id: 'system',     label: CS_PRESS_CHOICE_BUTTONS.system,     effect: { type: 'noOp' } },
      { id: 'silent',     label: CS_PRESS_CHOICE_BUTTONS.silent,     effect: { type: 'noOp' } },
    ],
    resolved: false,
    priority: 'normal',
    relatedPlayerId: player.id,
    relatedFixtureId: fixture.id,
  }
}
