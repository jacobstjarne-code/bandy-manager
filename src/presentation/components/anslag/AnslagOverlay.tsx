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

  let variantBody = pickAnslagVariant(anslag, game.currentSeason, anslagKey, game.managedClubId)

  // Template-variable resolution for cup_final_pre
  if (anslagKey === 'cup_final_pre') {
    const finalFixture = game.fixtures.find(f =>
      f.isCup && f.roundNumber >= 4 &&
      f.season === game.currentSeason &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    )
    if (finalFixture) {
      const isHome = finalFixture.homeClubId === game.managedClubId
      const opponentId = isHome ? finalFixture.awayClubId : finalFixture.homeClubId
      const opponent = game.clubs.find(c => c.id === opponentId)
      const vsLabel = isHome ? 'Hemma mot' : 'Borta mot'
      const motståndare = opponent?.shortName ?? opponent?.name ?? 'okänd'
      variantBody = variantBody
        .replace('{vsLabel}', vsLabel)
        .replace('{motståndare}', motståndare)
    }
  }

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
