import type { SaveGame } from '../entities/SaveGame'
import { fixtureSeed, mulberry32 } from '../utils/random'

export type SeasonalRollContext = Pick<
  SaveGame,
  'id' | 'worldSeed' | 'managedClubId' | 'currentSeason'
>

/**
 * Ett deterministiskt enhetskast för en händelse som prövas högst en gång per
 * save, klubb och säsong. Producenten äger fortfarande sin domännyckel,
 * namnrymd och sannolikhet; den här funktionen äger bara seedkontraktet.
 */
export function seasonalUnitRoll(
  game: SeasonalRollContext,
  eventKey: string,
  namespace: string,
): number {
  const saveSeed = game.worldSeed ?? game.id
  const seed = fixtureSeed(
    `${saveSeed}:${game.managedClubId}:${game.currentSeason}:${eventKey}:${namespace}`,
  )
  return mulberry32(seed)()
}
