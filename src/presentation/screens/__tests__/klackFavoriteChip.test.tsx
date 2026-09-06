import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { PlayerCard } from '../../components/PlayerCard'
import { PlayerRow } from '../SquadScreen'

function makeGame() {
  return createNewGame({ managerName: 'Klacktest', clubId: 'club_malilla', seed: 817 })
}

describe('klackfavorit-chip', () => {
  it('visas på både truppraden och spelarkortet för supportergruppens faktiska favorit', () => {
    const game = makeGame()
    const favoriteId = game.supporterGroup?.favoritePlayerId
    const player = game.players.find(candidate => candidate.id === favoriteId)
    const club = game.clubs.find(candidate => candidate.id === game.managedClubId)
    expect(player).toBeDefined()
    expect(club).toBeDefined()

    const row = renderToStaticMarkup(
      <PlayerRow
        player={player!}
        onClick={() => {}}
        currentSeason={game.currentSeason}
        captainPlayerId={game.captainPlayerId}
        anniversaries={[]}
        isKlackFavorite
      />,
    )
    const card = renderToStaticMarkup(
      <PlayerCard player={player!} clubName={club!.name} game={game} />,
    )

    expect(row).toContain('Klackfavorit')
    expect(card).toContain('Klackfavorit')
  })

  it('visas inte för en annan spelare', () => {
    const game = makeGame()
    const player = game.players.find(candidate =>
      candidate.clubId === game.managedClubId
      && candidate.id !== game.supporterGroup?.favoritePlayerId,
    )
    const club = game.clubs.find(candidate => candidate.id === game.managedClubId)
    expect(player).toBeDefined()
    expect(club).toBeDefined()

    const row = renderToStaticMarkup(
      <PlayerRow
        player={player!}
        onClick={() => {}}
        currentSeason={game.currentSeason}
        captainPlayerId={game.captainPlayerId}
        anniversaries={[]}
        isKlackFavorite={false}
      />,
    )
    const card = renderToStaticMarkup(
      <PlayerCard player={player!} clubName={club!.name} game={game} />,
    )

    expect(row).not.toContain('Klackfavorit')
    expect(card).not.toContain('Klackfavorit')
  })
})
