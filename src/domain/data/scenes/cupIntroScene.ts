/**
 * Cup-intro — kort scen innan första cupmatchen säsong 1.
 * Etablerar att cupen är pre-season, inte allvar — men inte heller meningslös.
 *
 * All svensk text lever här. Inget hårdkodas i komponenten.
 */

import type { SaveGame } from '../../entities/SaveGame'
import { FixtureStatus } from '../../enums'

export interface CupIntroBeat {
  id: string
  autoAdvance?: boolean
  durationMs?: number
  body: string
  cta?: string
}

export function getCupIntroBeats(game: SaveGame): CupIntroBeat[] {
  const club = game.clubs.find(c => c.id === game.managedClubId)
  if (!club) return []

  // Hitta nästa cupmatch för managed club
  const nextCup = game.fixtures
    .filter(f =>
      f.isCup &&
      f.status === FixtureStatus.Scheduled &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    )
    .sort((a, b) => a.matchday - b.matchday)[0]

  const isHome = nextCup ? nextCup.homeClubId === game.managedClubId : false
  const opponentId = nextCup ? (isHome ? nextCup.awayClubId : nextCup.homeClubId) : null
  const opponent = opponentId ? game.clubs.find(c => c.id === opponentId) : null
  const opponentName = opponent?.shortName ?? opponent?.name ?? 'motståndaren'

  return [
    {
      id: 'inramning',
      autoAdvance: true,
      durationMs: 3500,
      body: `Förstarunda i cupen. Innan serien drar igång.

*"Lottningen kunde varit värre."*`,
    },
    {
      id: 'motstandare',
      body: `${isHome ? 'Hemma mot' : 'Borta mot'} ${opponentName}.

Förstarundan brukar avgöras tidigt. Eller inte.`,
      cta: 'Och?',
    },
    {
      id: 'avslut',
      body: `Vinst ger kvartsfinal. Förlust ger en söndag mer att träna.

Ingen kommer minnas matchen — utom om ni förlorar.`,
      cta: 'Då kör vi',
    },
  ]
}

export function shouldTriggerCupIntro(game: SaveGame): boolean {
  // One-shot per säsong: visa innan första cupmatchen.
  // Använd shownScenes med säsongs-suffix för att tillåta nästa säsong.
  // shownScenes är SceneId[], så vi kollar om någon entry matchar denna säsong
  if ((game.shownScenes ?? []).some(s => s === 'cup_intro')) {
    // Visad redan denna körning — kolla om det var denna säsong via lastSavedAt
    // Enkelhet: tillåt bara en cup_intro per session, regenerera vid säsongsstart
    // För säsongsövergång hanteras detta via roundProcessor som rensar cup_intro från shownScenes
    return false
  }

  // Måste finnas en kommande cupmatch för managed club
  const hasUpcomingCup = game.fixtures.some(f =>
    f.isCup &&
    f.status === FixtureStatus.Scheduled &&
    (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )
  if (!hasUpcomingCup) return false

  // Inga cupmatcher ska redan vara spelade denna säsong
  const hasPlayedCupThisSeason = game.fixtures.some(f =>
    f.isCup &&
    f.season === game.currentSeason &&
    f.status === FixtureStatus.Completed &&
    (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )
  if (hasPlayedCupThisSeason) return false

  return true
}
