import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { AnslagKey } from '../../../domain/data/anslag/cupAnslag'
import { CUP_ANSLAG } from '../../../domain/data/anslag/cupAnslag'
import { isClubDirektkvalad } from '../../../domain/services/anslagService'

interface AnslagOverlayProps {
  game: SaveGame
  anslagKey: AnslagKey
  onDismiss: () => void
}

export function AnslagOverlay({ game, anslagKey, onDismiss }: AnslagOverlayProps) {
  const anslag = CUP_ANSLAG[anslagKey]
  const bracket = game.cupBracket
  const club = game.clubs.find(c => c.id === game.managedClubId)

  const isDirektkvalad = bracket && club ? isClubDirektkvalad(bracket, club.id) : false
  const direktkvalSuffix = isDirektkvalad && anslag.bodyDirektkval && club
    ? anslag.bodyDirektkval.replace('{clubName}', club.name)
    : ''
  const fullBody = anslag.body + direktkvalSuffix

  const isWinner = anslagKey === 'cup_done_winner'

  return (
    <div className="anslag-overlay" onClick={onDismiss}>
      <div className={`anslag-card${isWinner ? ' winner' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="anslag-chapter">{anslag.chapter}</div>
        <div
          className="anslag-text"
          dangerouslySetInnerHTML={{ __html: fullBody }}
        />
        <div className="anslag-cta" onClick={onDismiss}>Tryck för att fortsätta</div>
      </div>
    </div>
  )
}
