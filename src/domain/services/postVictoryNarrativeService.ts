import type { Fixture } from '../entities/Fixture'
import type { SaveGame } from '../entities/SaveGame'
import { getRivalry } from '../data/rivalries'
import { deriveUtfall } from './matchTypeAxes'
import { isOnCooldown, pickPoolIndexAvoidingCooldown } from './narrativeLogService'

export type VictoryType = 'playoff_derby_win' | 'playoff_win' | 'big_derby_win' | 'derby_win' | 'blowout'

export interface VictoryEcho {
  // TEXT-UTAN-YTA (VILANDE), klassad i release-svepet 2026-07-21 — RADERA
  // INTE. Auditerad, färdig Opus-text (fem segertyper, alla ifyllda nedan
  // i generateVictoryEcho). Enda tänkta konsumenten var dailyBriefingService.
  // ts's generateBriefing() — ett en-radigt "dagens humör"-strip — men den
  // funktionen hade NOLL anropare redan innan filen raderades som död kod
  // (bf1b3cec, 2026-07-20). diaryLine nådde alltså aldrig spelaren, varken
  // före eller efter den raderingen. Ingen dagboks-/krönike-yta finns någon
  // annanstans i kodbasen (verifierat: grep efter dagbok/krönika/diary gav
  // inga skärmar). Väntar på en yta — manager-reflektion, dagbok, vad Design
  // landar i. Rapporterat till design→text-flödet tillsammans med
  // hallprövningen och landslaget.
  diaryLine: string
  // Kafferummets röst — LEVANDE sedan D4-regressionsfixen (coffeeRoomService.ts).
  coffeeLine: string
  /** Cooldown key written only when the coffee-room echo is actually shown. */
  coffeeSemanticKey?: string
  /** Fixed one-line echoes may yield to other coffee-room material while this key is recent. */
  coffeeCooldownSeasons?: number
  boardMessage?: string
}

export const VICTORY_ECHO_BLOWOUT_PREFIX = 'victory_echo_blowout_'
export const VICTORY_ECHO_PLAYOFF_WIN_KEY = 'victory_echo_playoff_win'
export const VICTORY_ECHO_PLAYOFF_DERBY_WIN_KEY = 'victory_echo_playoff_derby_win'
export const VICTORY_ECHO_BIG_DERBY_WIN_KEY = 'victory_echo_big_derby_win'
export const VICTORY_ECHO_DERBY_WIN_KEY = 'victory_echo_derby_win'

/** Presentation timing only: the event remains true even when its fixed line rests. */
export function shouldSurfaceVictoryEcho(game: SaveGame, echo: VictoryEcho): boolean {
  if (!echo.coffeeSemanticKey || !echo.coffeeCooldownSeasons) return true
  return !isOnCooldown(
    game,
    echo.coffeeSemanticKey,
    echo.coffeeCooldownSeasons,
    game.currentSeason,
  )
}

export function classifyVictory(fixture: Fixture, managedClubId: string): VictoryType | null {
  const isHome = fixture.homeClubId === managedClubId
  const myScore = isHome ? (fixture.homeScore ?? 0) : (fixture.awayScore ?? 0)
  const theirScore = isHome ? (fixture.awayScore ?? 0) : (fixture.homeScore ?? 0)
  if (deriveUtfall(fixture, managedClubId) !== 'vunnet') return null

  const isDerby = getRivalry(fixture.homeClubId, fixture.awayClubId) !== null
  const isPlayoff = !!fixture.isKnockout && !fixture.isCup
  const scoreDiff = myScore - theirScore

  if (isPlayoff && isDerby) return 'playoff_derby_win'
  if (isPlayoff) return 'playoff_win'
  if (isDerby && scoreDiff >= 3) return 'big_derby_win'
  if (isDerby) return 'derby_win'
  if (scoreDiff >= 4) return 'blowout'

  return null
}

/**
 * @cites fixture.homeClubId, fixture.homeScore, fixture.awayScore, type
 */
export function generateVictoryEcho(
  type: VictoryType,
  fixture: Fixture,
  opponentName: string,
  managedClubId: string,
  game?: SaveGame,
): VictoryEcho {
  // M32 (textaudit 2026-07-03): var alltid hemma-borta oavsett perspektiv —
  // en 2–5-bortaseger blev "2-5 mot {opponent}", läst som en förlust.
  const isHome = fixture.homeClubId === managedClubId
  const myScore = isHome ? fixture.homeScore : fixture.awayScore
  const theirScore = isHome ? fixture.awayScore : fixture.homeScore
  const score = `${myScore}-${theirScore}`

  switch (type) {
    case 'playoff_derby_win':
      return {
        diaryLine: `Triumfen över ${opponentName} ekar fortfarande i korridorerna. Ingen hade sovit ordentligt på tre dagar.`,
        coffeeLine: `Kioskvakten: "Jag sålde korv till fyra personer som grät. Dom bad inte om ursäkt."`,
        coffeeSemanticKey: VICTORY_ECHO_PLAYOFF_DERBY_WIN_KEY,
        coffeeCooldownSeasons: 2,
        boardMessage: `Ordföranden: "Det är för sånt här jag satte mig i den här stolen. Tack."`,
      }
    case 'playoff_win':
      return {
        diaryLine: `Slutspelsvinsten mot ${opponentName} satte sig. Klubben känns tyngre på ett gott sätt.`,
        coffeeLine: `Sekreteraren: "Det ringde tre gamla medlemmar i förmiddags. Ingen ville något. De bara ville prata."`,
        coffeeSemanticKey: VICTORY_ECHO_PLAYOFF_WIN_KEY,
        coffeeCooldownSeasons: 2,
      }
    case 'big_derby_win':
      return {
        diaryLine: `${score} mot ${opponentName} är redan en berättelse. Det kommer pratas om den i fem år.`,
        coffeeLine: `Materialaren: "Jag hittade fyra flaskor bakom sargen. Två var tomma."`,
        coffeeSemanticKey: VICTORY_ECHO_BIG_DERBY_WIN_KEY,
        coffeeCooldownSeasons: 2,
      }
    case 'derby_win':
      return {
        diaryLine: `Derbyvinsten sitter bra. Bygden kan andas en vecka till.`,
        coffeeLine: isHome
          ? `Någon skrev "${opponentName.toUpperCase()} ÅKTE HEM" på tavlan i omklädningsrummet. Ingen har tagit bort det.`
          : `Någon skrev "VI VANN BORTA MOT ${opponentName.toUpperCase()}" på tavlan i omklädningsrummet. Ingen har tagit bort det.`,
        coffeeSemanticKey: VICTORY_ECHO_DERBY_WIN_KEY,
        coffeeCooldownSeasons: 2,
      }
    case 'blowout':
      {
        const pool = [
          `Ingen sa mycket efter match. Det var inte tystnaden efter förlust. Det var tystnaden efter en stor middag.`,
          `Resultattavlan släcktes sent. Någon hade redan hunnit skriva ${score} på whiteboarden i korridoren.`,
          `Materialaren räknade klubborna två gånger. ”Efter en sån där match vill man bara att allt ska ligga kvar precis som det låg.”`,
          `Det kom folk förbi klubbhuset utan ärende. De ville mest säga siffrorna högt en gång till: ${score}.`,
        ]
        const index = game
          ? pickPoolIndexAvoidingCooldown(
              game,
              game.currentSeason,
              pool.length,
              VICTORY_ECHO_BLOWOUT_PREFIX,
              game.currentMatchday * 31 + fixture.id.length,
              2,
            )
          : 0
      return {
        diaryLine: `${score} är en hård siffra. Det vet vi. Men det var en säsong vi behövde den.`,
        coffeeLine: pool[index],
        coffeeSemanticKey: `${VICTORY_ECHO_BLOWOUT_PREFIX}${index}`,
        coffeeCooldownSeasons: 2,
      }
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
