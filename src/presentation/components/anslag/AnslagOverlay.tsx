import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { AnslagKey } from '../../../domain/services/anslagService'
import { pickAnslagVariant, getAnslagData, isClubDirektkvalad } from '../../../domain/services/anslagService'

interface AnslagOverlayProps {
  game: SaveGame
  anslagKey: AnslagKey
  onDismiss: () => void
}

export function AnslagOverlay({ game, anslagKey, onDismiss }: AnslagOverlayProps) {
  const anslag = getAnslagData(anslagKey)
  const bracket = game.cupBracket
  const club = game.clubs.find(c => c.id === game.managedClubId)

  const variantBody = pickAnslagVariant(anslag, game.currentSeason, anslagKey, game.managedClubId)

  const isDirektkvalad = anslagKey === 'cup_start' && bracket && club
    ? isClubDirektkvalad(bracket, club.id)
    : false
  const finalBody = variantBody + (
    isDirektkvalad && anslag.bodyDirektkval && club
      ? anslag.bodyDirektkval.replace('{clubName}', club.name)
      : ''
  )

  const isWinner = anslagKey === 'cup_done_winner'

  return (
    <div className="anslag-overlay" onClick={onDismiss}>
      <div className={`anslag-card${isWinner ? ' winner' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="anslag-chapter">{anslag.chapter}</div>
        <div
          className="anslag-text"
          dangerouslySetInnerHTML={{ __html: finalBody }}
        />
        <div className="anslag-cta" onClick={onDismiss}>Tryck för att fortsätta</div>
      </div>
    </div>
  )
}
