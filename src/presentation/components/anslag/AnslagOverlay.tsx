import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { AnslagKey } from '../../../domain/services/anslagService'
import { pickAnslagVariant, getAnslagData, isClubDirektkvalad, buildBoardReportText } from '../../../domain/services/anslagService'

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

  // Template-variable resolution for cup anslag with {vsLabel} and {motståndare}
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

  if (anslagKey === 'cup_first_match') {
    const round1Fixture = game.fixtures.find(f =>
      f.isCup && f.roundNumber === 1 &&
      f.season === game.currentSeason &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    )
    if (round1Fixture) {
      const isHome = round1Fixture.homeClubId === game.managedClubId
      const opponentId = isHome ? round1Fixture.awayClubId : round1Fixture.homeClubId
      const opponent = game.clubs.find(c => c.id === opponentId)
      const vsLabel = isHome ? 'Hemma mot' : 'Borta mot'
      const motståndare = opponent?.shortName ?? opponent?.name ?? 'okänd'
      variantBody = variantBody
        .replace('{vsLabel}', vsLabel)
        .replace('{motståndare}', motståndare)
    }
  }

  // Template-variable resolution for season_kickoff (board anslag)
  if (anslagKey === 'season_kickoff' && club) {
    const board = club.board
    if (board) {
      const reportText = buildBoardReportText(game)
      variantBody = variantBody
        .replace(/{clubhouse}/g, club.clubhouse ?? 'klubbhuset')
        .replace(/{chairmanFirstName}/g, board.chairman.firstName)
        .replace(/{chairmanLastName}/g, board.chairman.lastName)
        .replace(/{treasurerFirstName}/g, board.treasurer.firstName)
        .replace(/{treasurerLastName}/g, board.treasurer.lastName)
        .replace(/{memberFirstName}/g, board.member.firstName)
        .replace(/{memberLastName}/g, board.member.lastName)
        .replace(/{reportText}/g, reportText)
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
