/**
 * Cup-final-intro — kort scen innan cupfinal.
 * Triggas en gång per säsong, om managed club har en cup-final framför sig.
 *
 * Inte SM-final-tonalitet (den är payoff). Det här är *innan* — spänd, inte triumferande.
 */

import type { SaveGame } from '../../entities/SaveGame'
import { FixtureStatus } from '../../enums'

export interface CupFinalIntroBeat {
  id: string
  autoAdvance?: boolean
  durationMs?: number
  body: string
  cta?: string
}

function findUpcomingCupFinal(game: SaveGame) {
  return game.fixtures
    .filter(f =>
      f.isCup &&
      f.status === FixtureStatus.Scheduled &&
      f.roundNumber >= 4 &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    )
    .sort((a, b) => a.matchday - b.matchday)[0]
}

export function getCupFinalIntroBeats(game: SaveGame): CupFinalIntroBeat[] {
  const club = game.clubs.find(c => c.id === game.managedClubId)
  if (!club) return []

  const final = findUpcomingCupFinal(game)
  if (!final) return []

  const isHome = final.homeClubId === game.managedClubId
  const opponentId = isHome ? final.awayClubId : final.homeClubId
  const opponent = game.clubs.find(c => c.id === opponentId)
  const opponentName = opponent?.shortName ?? opponent?.name ?? 'motståndaren'

  return [
    {
      id: 'inramning',
      autoAdvance: true,
      durationMs: 3500,
      body: `Cupfinal.

*Två lag kvar. Ingen omspelning.*`,
    },
    {
      id: 'motstandare',
      body: `${isHome ? 'Hemma mot' : 'Borta mot'} ${opponentName}.

Det här är inget träningstillfälle. En match. Sen är det över.`,
      cta: 'Vad är på spel?',
    },
    {
      id: 'avslut',
      body: `Vinst ger en pokal i klubblokalen. Förlust ger en sommar att inte prata om det.

Bygden vet om matchen. Spelarna vet om bygden.`,
      cta: 'Då kör vi',
    },
  ]
}

export function shouldTriggerCupFinalIntro(game: SaveGame): boolean {
  // One-shot per säsong via shownScenes med säsongsnyckel-mönstret.
  // Eftersom shownScenes är SceneId[] räcker det att lägga in cup_final_intro;
  // vid säsongsbyte rensas den från listan av roundProcessor (om det implementeras).
  // Tills vidare: räcker en gång per save.
  if ((game.shownScenes ?? []).includes('cup_final_intro')) return false

  const final = findUpcomingCupFinal(game)
  if (!final) return false

  // Kolla att vi inte redan spelat finalen
  const finalPlayed = game.fixtures.some(f =>
    f.isCup &&
    f.roundNumber >= 4 &&
    f.season === game.currentSeason &&
    f.status === FixtureStatus.Completed &&
    (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )
  if (finalPlayed) return false

  return true
}
