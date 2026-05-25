/**
 * useCupFinalData — räknar fram all dynamisk data för cup-finalsegerscenen
 * från SaveGame: fixture, score, akademihjälte, slumpat Birger-citat.
 */

import { useMemo } from 'react'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { CUP_FINAL_VICTORY_TEMPLATES } from '../../../../domain/data/scenes/cupFinalVictoryScene'

export interface CupFinalData {
  homeScore: number
  awayScore: number
  homeName: string
  awayName: string
  arenaCapacity: string
  finalArena: string
  bodyText: string
  birgerQuote: string
  birgerAttribution: string
}

export function useCupFinalData(game: SaveGame): CupFinalData {
  const finalFixture = useMemo(() => {
    const candidates = game.fixtures.filter(
      f =>
        f.status === 'completed' &&
        (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
        f.isCup === true &&
        f.roundNumber >= 4,
    )
    return candidates.sort((a, b) => b.matchday - a.matchday)[0] ?? null
  }, [game.fixtures, game.managedClubId])

  const homeClub = finalFixture ? game.clubs.find(c => c.id === finalFixture.homeClubId) : null
  const awayClub = finalFixture ? game.clubs.find(c => c.id === finalFixture.awayClubId) : null

  const academyHero = useMemo(() => {
    if (!finalFixture?.report?.playerOfTheMatchId) return null
    const player = game.players.find(p => p.id === finalFixture.report?.playerOfTheMatchId)
    if (!player) return null
    const promoted = (player as { promotedFromAcademy?: boolean }).promotedFromAcademy
    const promotionSeason = (player as { promotionSeason?: number }).promotionSeason
    if (!promoted || !promotionSeason) return null
    const matchEvents = finalFixture.events ?? []
    const goalEvent = matchEvents.find(
      e => (e as { playerId?: string; type?: string }).playerId === player.id &&
        (e as { type?: string }).type === 'goal',
    )
    const minute = (goalEvent as { minute?: number } | undefined)?.minute ?? null
    return {
      lastName: player.lastName,
      promotionSeason,
      yearsAgo: Math.max(1, game.currentSeason - promotionSeason),
      minute,
    }
  }, [finalFixture, game.players, game.currentSeason])

  const bodyText = academyHero
    ? CUP_FINAL_VICTORY_TEMPLATES.bodyText
        .replace(/{playerName}/g, academyHero.lastName)
        .replace('{minute}', String(academyHero.minute ?? '?'))
        .replace('{promotionSeason}', String(academyHero.promotionSeason))
        .replace('{yearsAgo}', String(academyHero.yearsAgo))
    : CUP_FINAL_VICTORY_TEMPLATES.fallbackBodyText

  const birger = useMemo(() => {
    const idx =
      Math.abs(game.currentSeason * 11 + game.managedClubId.length * 3) %
      CUP_FINAL_VICTORY_TEMPLATES.birgerQuotes.length
    return CUP_FINAL_VICTORY_TEMPLATES.birgerQuotes[idx]
  }, [game.currentSeason, game.managedClubId])

  const attendance = finalFixture?.attendance
  const arenaCapacity = attendance
    ? CUP_FINAL_VICTORY_TEMPLATES.meta.arenaCapacity.replace(
        '{arenaCapacity}',
        attendance.toLocaleString('sv-SE'),
      )
    : ''

  return {
    homeScore: finalFixture?.homeScore ?? 0,
    awayScore: finalFixture?.awayScore ?? 0,
    homeName: homeClub?.name ?? 'Hemmaklubben',
    awayName: awayClub?.name ?? 'Bortaklubben',
    arenaCapacity,
    finalArena: finalFixture?.arenaName ?? 'Cuparenon',
    bodyText,
    birgerQuote: birger.quote,
    birgerAttribution: birger.attribution,
  }
}
