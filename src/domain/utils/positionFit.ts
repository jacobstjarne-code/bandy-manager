import { PlayerPosition } from '../enums'

const ADJACENT_POSITIONS: Readonly<Record<PlayerPosition, readonly PlayerPosition[]>> = {
  [PlayerPosition.Goalkeeper]: [],
  [PlayerPosition.Defender]: [PlayerPosition.Half],
  [PlayerPosition.Half]: [PlayerPosition.Defender, PlayerPosition.Midfielder],
  [PlayerPosition.Midfielder]: [PlayerPosition.Half, PlayerPosition.Forward],
  [PlayerPosition.Forward]: [PlayerPosition.Midfielder],
}

/** Kanonisk positionspassning för motor, auto-assign och uppställnings-UI. */
export function getPositionFit(playerPosition: PlayerPosition, slotPosition: PlayerPosition): number {
  if (playerPosition === slotPosition) return 1
  if (ADJACENT_POSITIONS[playerPosition].includes(slotPosition)) return 0.9
  return 0.75
}
