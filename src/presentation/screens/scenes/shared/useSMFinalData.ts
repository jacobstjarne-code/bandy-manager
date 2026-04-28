/**
 * useSMFinalData — räknar fram all dynamisk data för SM-finalsegerscenen
 * från SaveGame: fixture, score, akademihjälte, slumpat Birger-citat.
 */

import { useMemo } from 'react'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { SM_FINAL_VICTORY_TEMPLATES } from '../../../../domain/data/scenes/smFinalVictoryScene'

export interface SMFinalData {
  myScore: number
  theirScore: number
  homeName: string
  awayName: string
  arenaCapacity: string
  finalArena: string
  bodyText: string
  birgerQuote: string
  birgerAttribution: string
}

export function useSMFinalData(game: SaveGame): SMFinalData {
  const finalFixture = useMemo(() => {
    const candidates = game.fixtures.filter(
      f =>
        f.status === 'completed' &&
        (f.homeClubId === game.managedClubId ||
          f.awayClubId === game.managedClubId) &&
        (f.isFinaldag === true || (f.isCup === true && f.roundNumber >= 4)),
    )
    return candidates.sort((a, b) => b.matchday - a.matchday)[0] ?? null
  }, [game.fixtures, game.managedClubId])

  const homeClub = finalFixture
    ? game.clubs.find(c => c.id === finalFixture.homeClubId)
    : null
  const awayClub = finalFixture
    ? game.clubs.find(c => c.id === finalFixture.awayClubId)
    : null
  const isHome = finalFixture?.homeClubId === game.managedClubId

  const academyHero = useMemo(() => {
    if (!finalFixture?.report?.playerOfTheMatchId) return null
    const player = game.players.find(
      p => p.id === finalFixture.report?.playerOfTheMatchId,
    )
    if (!player) return null
    const promoted = (player as { promotedFromAcademy?: boolean }).promotedFromAcademy
    const promotionSeason = (player as { promotionSeason?: number }).promotionSeason
    if (!promoted || !promotionSeason) return null
    return {
      lastName: player.lastName,
      promotionSeason,
      yearsAgo: Math.max(1, game.currentSeason - promotionSeason),
    }
  }, [finalFixture, game.players, game.currentSeason])

  const bodyText = academyHero
    ? SM_FINAL_VICTORY_TEMPLATES.bodyText
        .replace('Henriksson', academyHero.lastName)
        .replace('{promotionSeason}', String(academyHero.promotionSeason))
        .replace('{yearsAgo}', String(academyHero.yearsAgo))
    : SM_FINAL_VICTORY_TEMPLATES.fallbackBodyText

  const birger = useMemo(() => {
    const idx =
      Math.abs(game.currentSeason * 13 + game.managedClubId.length) %
      SM_FINAL_VICTORY_TEMPLATES.birgerQuotes.length
    return SM_FINAL_VICTORY_TEMPLATES.birgerQuotes[idx]
  }, [game.currentSeason, game.managedClubId])

  return {
    myScore: finalFixture
      ? isHome
        ? finalFixture.homeScore
        : finalFixture.awayScore
      : 0,
    theirScore: finalFixture
      ? isHome
        ? finalFixture.awayScore
        : finalFixture.homeScore
      : 0,
    homeName: homeClub?.name ?? 'Hemmaklubben',
    awayName: awayClub?.name ?? 'Bortaklubben',
    arenaCapacity: finalFixture?.attendance
      ? `${finalFixture.attendance.toLocaleString('sv-SE')} ÅSKÅDARE`
      : SM_FINAL_VICTORY_TEMPLATES.meta.arenaCapacity,
    finalArena: finalFixture?.arenaName ?? 'Studenternas IP',
    bodyText,
    birgerQuote: birger.quote,
    birgerAttribution: birger.attribution,
  }
}
