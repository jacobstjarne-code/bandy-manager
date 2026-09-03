import type { SaveGame } from '../entities/SaveGame'
import { FixtureStatus } from '../enums'
import { safeStandingPosition } from './standingsService'
import { BOARD_EXPECTATION_ANCHOR_POSITION } from './boardService'

export type SeasonContext = 'firstSeason' | 'relegationFight' | 'topRace' | 'midTable'

export function getSeasonContext(game: SaveGame): SeasonContext {
  if ((game.seasonSummaries?.length ?? 0) === 0) return 'firstSeason'

  const completedLeague = game.fixtures.filter(
    f => f.status === FixtureStatus.Completed && !f.isCup && !f.isKnockout &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  ).length

  if (completedLeague < 8) return 'midTable'

  // Redan gated av completedLeague<8 ovan, men safeStandingPosition
  // (PASTAENDEKARTAN, LÄST-FÖRE-INITIERING, 2026-08-26) är den kanoniska
  // vägen — konsekvent med övriga fixade instanser, inte en ny gissning.
  const pos = safeStandingPosition(game.standings, game.managedClubId) ?? 6
  // sluttest-be-blind-seasoncontext (DOM 2026-09-03, Jacob): "säsongskontexten
  // är ramen för hur säsongen ska läsas; förväntan hör dit." Fasta band (9/3)
  // ersatta med avstånd från förväntans ankare — samma gap-mönster och
  // samma delade BOARD_EXPECTATION_ANCHOR_POSITION som trainerArcService.ts/
  // midSeasonEventService.ts. Trösklarna (gap<=-3/gap>=3) är de gamla
  // absoluta värdena omräknade vid MidTable-ankaret (6), oförändrad känsla
  // för en MidTable-klubb.
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const anchor = managedClub ? BOARD_EXPECTATION_ANCHOR_POSITION[managedClub.boardExpectation] : 6
  const gap = anchor - pos
  if (gap <= -3) return 'relegationFight'
  if (gap >= 3) return 'topRace'
  return 'midTable'
}
