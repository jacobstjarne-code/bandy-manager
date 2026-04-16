import type { Fixture } from '../entities/Fixture'
import type { SaveGame } from '../entities/SaveGame'
import { getRivalry } from '../data/rivalries'

export type VictoryType = 'playoff_derby_win' | 'playoff_win' | 'big_derby_win' | 'derby_win' | 'blowout'

export interface VictoryEcho {
  diaryLine: string
  coffeeLine: string
  boardMessage?: string
}

export function classifyVictory(fixture: Fixture, managedClubId: string): VictoryType | null {
  const isHome = fixture.homeClubId === managedClubId
  const myScore = isHome ? (fixture.homeScore ?? 0) : (fixture.awayScore ?? 0)
  const theirScore = isHome ? (fixture.awayScore ?? 0) : (fixture.homeScore ?? 0)
  if (myScore <= theirScore) return null

  const isDerby = getRivalry(fixture.homeClubId, fixture.awayClubId) !== null
  const isPlayoff = fixture.matchday > 22
  const scoreDiff = myScore - theirScore

  if (isPlayoff && isDerby) return 'playoff_derby_win'
  if (isPlayoff) return 'playoff_win'
  if (isDerby && scoreDiff >= 3) return 'big_derby_win'
  if (isDerby) return 'derby_win'
  if (scoreDiff >= 4) return 'blowout'

  return null
}

export function generateVictoryEcho(
  type: VictoryType,
  fixture: Fixture,
  opponentName: string,
): VictoryEcho {
  const score = `${fixture.homeScore}-${fixture.awayScore}`

  switch (type) {
    case 'playoff_derby_win':
      return {
        diaryLine: `Triumfen över ${opponentName} ekar fortfarande i korridorerna. Ingen hade sovit ordentligt på tre dagar.`,
        coffeeLine: `Kioskvakten: "Jag sålde korv till fyra personer som grät. Dom bad inte om ursäkt."`,
        boardMessage: `Ordföranden: "Det är sånt här som gör att jag satt mig i den här stolen. Tack."`,
      }
    case 'playoff_win':
      return {
        diaryLine: `Slutspelsvinsten mot ${opponentName} satte sig. Klubben känns tyngre på ett gott sätt.`,
        coffeeLine: `Sekreteraren: "Det ringde tre gamla medlemmar i förmiddags. Ingen ville något. De bara ville prata."`,
      }
    case 'big_derby_win':
      return {
        diaryLine: `${score} mot ${opponentName} är redan en berättelse. Det kommer pratas om den i fem år.`,
        coffeeLine: `Materialaren: "Jag hittade fyra flaskor i sargarna. Två var tomma."`,
      }
    case 'derby_win':
      return {
        diaryLine: `Derbyvinsten sitter bra. Bygden kan andas en vecka till.`,
        coffeeLine: `Någon skrev "${opponentName.toUpperCase()} ÅKTE HEM" på tavlan i omklädningsrummet. Ingen har tagit bort det.`,
      }
    case 'blowout':
      return {
        diaryLine: `${score} är en hård siffra. Det vet vi. Men det var en säsong vi behövde den.`,
        coffeeLine: `Ingen sa mycket efter match. Det var inte tystnaden efter förlust. Det var tystnaden efter en stor middag.`,
      }
  }
}

export function hasPendingEcho(game: SaveGame): boolean {
  if (!game.pendingVictoryEcho) return false
  const currentMatchday = game.fixtures
    .filter(f => f.status === 'completed')
    .sort((a, b) => b.matchday - a.matchday)[0]?.matchday ?? 0
  return currentMatchday <= (game.victoryEchoExpires ?? 0)
}
