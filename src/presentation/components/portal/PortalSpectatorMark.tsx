import { useEffect } from 'react'
import { isManagedClubSpectator } from '../../../domain/data/seasonPhases'
import { pickSpectatorMarkCopy } from '../../../domain/data/spectatorMarkText'
import { useGameStore } from '../../store/gameStore'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface Props { game: SaveGame }

export function PortalSpectatorMark({ game }: Props) {
  const { markPhaseAcknowledged } = useGameStore()
  const seen = game.phaseMarksSeen ?? []
  const shouldShow = isManagedClubSpectator(game) && !seen.includes('spectator')

  useEffect(() => {
    if (shouldShow) markPhaseAcknowledged('spectator')
  }, [shouldShow, markPhaseAcknowledged])

  if (!shouldShow) return null

  const copy = pickSpectatorMarkCopy(game)

  return (
    <div className="portal-spectatormark">
      <div className="portal-spectatormark-eyebrow">{copy.eyebrow}</div>
      <div className="portal-spectatormark-quote">"{copy.quote}"</div>
      <div className="portal-spectatormark-helper">{copy.helper}</div>
    </div>
  )
}
