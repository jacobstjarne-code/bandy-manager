import type { SaveGame } from '../../../entities/SaveGame'
import type { Fixture } from '../../../entities/Fixture'
import { getRivalry } from '../../../data/rivalries'
import { PlayoffRound } from '../../../enums'

/** Returnerar nästa schemalagda fixture för managed club. */
export function getNextManagedFixture(game: SaveGame): Fixture | null {
  const managedId = game.managedClubId

  // Kolla om laget är eliminerat i slutspelet
  const bracket = game.playoffBracket
  let eliminated = false
  if (bracket) {
    const allSeries = [
      ...(bracket.quarterFinals ?? []),
      ...(bracket.semiFinals ?? []),
      ...(bracket.final ? [bracket.final] : []),
    ]
    eliminated = allSeries.some(s => s.loserId === managedId)
  }

  return game.fixtures
    .filter(f => {
      if (f.status !== 'scheduled') return false
      if (f.homeClubId !== managedId && f.awayClubId !== managedId) return false
      if (eliminated && f.matchday > 26 && !f.isCup) return false
      return true
    })
    .sort((a, b) => a.matchday - b.matchday || (b.isCup ? 1 : 0) - (a.isCup ? 1 : 0))[0] ?? null
}

/** Returnerar motståndarens klubb-id för given fixture. */
function getOpponentId(game: SaveGame, fixture: Fixture): string {
  return fixture.homeClubId === game.managedClubId
    ? fixture.awayClubId
    : fixture.homeClubId
}

/** Nästa match är ett derby (rivalry existerar). */
export function nextMatchIsDerby(game: SaveGame): boolean {
  const next = getNextManagedFixture(game)
  if (!next) return false
  const opponentId = getOpponentId(game, next)
  return getRivalry(game.managedClubId, opponentId) !== null
}

/** Nästa match är SM-finalen. */
export function nextMatchIsSMFinal(game: SaveGame): boolean {
  const next = getNextManagedFixture(game)
  if (!next) return false
  // isFinaldag-flagga sätts på SM-final-fixturet
  if (next.isFinaldag) return true
  // Fallback: kolla om det är en playoff-final
  if (game.playoffBracket?.final) {
    const series = game.playoffBracket.final
    if (series.round === PlayoffRound.Final && series.fixtures.includes(next.id)) return true
  }
  return false
}

/**
 * B2 (2026-07-19): nästa match är cupfinalen. Cupfinalen faller idag till
 * next_match (vikt 10) trots färdig ceremoni (cupFinalVictoryScene,
 * cupanslagens "Pokalen är vår") — portalen pekar aldrig på den i förväg.
 * Samma bracket-lookup-mönster som MatchLiveScreen.tsx:s isCupFinal
 * (round === 4 i cupBracket.matches).
 */
export function nextMatchIsCupFinal(game: SaveGame): boolean {
  const next = getNextManagedFixture(game)
  if (!next || !next.isCup) return false
  const bracket = game.cupBracket
  if (!bracket) return false
  const finalMatch = bracket.matches.find(m => m.round === 4)
  return finalMatch?.fixtureId === next.id
}

/**
 * B2 (2026-07-19): nästa match är en aktiv veteran_farewell-arcs spelares
 * sista hemmamatch i säsongen — samma gate som pool 2:s matchdagsceremoni
 * (MatchLaddningScene) och kafferummet redan använder, återanvänd här
 * istf en tredje beräkning av samma villkor.
 */
/** Nästa match är en hemmamatch. */
export function nextMatchIsHome(game: SaveGame): boolean {
  const next = getNextManagedFixture(game)
  if (!next) return false
  return next.homeClubId === game.managedClubId
}

/** Nästa match är en stor match (derby ELLER SM-final). */
export function nextMatchIsBigGame(game: SaveGame): boolean {
  return nextMatchIsDerby(game) || nextMatchIsSMFinal(game)
}

/** Returnerar antalet dagar till nästa match (0 = idag, -1 = ingen). */
export function daysUntilNextMatch(game: SaveGame): number {
  const next = getNextManagedFixture(game)
  if (!next) return -1
  const today = new Date(game.currentDate)
  const dateStr = next.date ?? ''
  if (!dateStr) return -1
  const matchDate = new Date(dateStr)
  const diff = Math.round((matchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

/** Alltid true — används som fallback-trigger. */
export function alwaysTrue(_game: SaveGame): boolean {
  return true
}
