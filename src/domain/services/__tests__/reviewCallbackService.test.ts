import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { MatchEventType, PlayerPosition } from '../../enums'
import type { EventLedgerEntry } from '../../entities/Narrative'
import type { Fixture } from '../../entities/Fixture'
import { CLUB_TEMPLATES } from '../worldGenerator'
import { markLedgerPostTold } from '../ledgerToldService'
import { selectReviewCallback } from '../reviewCallbackService'

function setup() {
  const game = createNewGame({ managerName: 'Test Manager', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
  const opponent = game.clubs.find(club => club.id !== game.managedClubId)!
  const player = game.players.find(candidate => candidate.clubId === game.managedClubId)!
  const movedPlayers = game.players.map(candidate => candidate.id === player.id
    ? { ...candidate, clubId: opponent.id, position: PlayerPosition.Forward }
    : candidate)
  const fixture: Fixture = {
    ...game.fixtures[0],
    id: 'callback_fixture',
    season: game.currentSeason,
    matchday: 6,
    homeClubId: game.managedClubId,
    awayClubId: opponent.id,
    status: 'completed',
    events: [{
      minute: 23,
      type: MatchEventType.Goal,
      clubId: opponent.id,
      playerId: player.id,
      description: 'Mål',
    }],
    report: {
      playerRatings: { [player.id]: 8.5 },
      shotsHome: 1, shotsAway: 1, onTargetHome: 1, onTargetAway: 1,
      savesHome: 0, savesAway: 0, cornersHome: 0, cornersAway: 0,
      penaltiesHome: 0, penaltiesAway: 0, possessionHome: 50, possessionAway: 50,
      playerOfTheMatchId: player.id,
    },
  }
  const sale: EventLedgerEntry = {
    type: 'transfer_sold',
    semanticKey: `transfer_sold:${player.id}`,
    clubId: game.managedClubId,
    season: game.currentSeason,
    matchday: 0,
    subject: { kind: 'player', id: player.id },
    subject2: { kind: 'club', id: opponent.id },
    significance: 55,
  }
  return { game: { ...game, players: movedPlayers, fixtures: [fixture] }, opponent, player: movedPlayers.find(p => p.id === player.id)!, fixture, sale }
}

describe('Berättaren steg 5 — Granska-callbacks', () => {
  it('knyter en aktuell försäljning till motståndarens målskytt', () => {
    const { game, player, fixture, sale } = setup()
    const callback = selectReviewCallback({ ...game, eventLedger: [sale] }, fixture)

    expect(callback).toEqual({
      kind: 'former_player_goal',
      text: `${player.firstName} ${player.lastName}, som ni sålde i somras. Mål — mot er.`,
      post: sale,
    })
  })

  it('använder den positionsbundna raden för en äldre före detta spelare som blir matchens spelare', () => {
    const { game, player, fixture, sale } = setup()
    const olderSale = { ...sale, season: game.currentSeason - 1 }
    const callback = selectReviewCallback({ ...game, eventLedger: [olderSale] }, fixture)

    expect(callback?.kind).toBe('former_player_potm')
    expect(callback?.text).toBe(`${player.firstName} ${player.lastName}. Er förre forward, matchens spelare mot er.`)
  })

  it('läcker inte en annan klubbs försäljningspost och upprepar inte en review-told post', () => {
    const { game, fixture, sale } = setup()
    expect(selectReviewCallback({ ...game, eventLedger: [{ ...sale, clubId: 'club_other' }] }, fixture)).toBeNull()

    const ledgerTold = markLedgerPostTold({}, sale, 'review', {
      season: game.currentSeason,
      matchday: fixture.matchday,
    })
    expect(selectReviewCallback({ ...game, eventLedger: [sale], ledgerTold }, fixture)).toBeNull()
  })

  it('visar första återkomsten till en avslutad klubbperiod, men inte möte två', () => {
    const { game, opponent, fixture } = setup()
    const returnGame = {
      ...game,
      managerProfile: {
        ...game.managerProfile!,
        clubSpells: [
          { clubId: opponent.id, clubName: opponent.name, fromSeason: game.currentSeason - 2, toSeason: game.currentSeason, endedBy: 'fired' as const },
          { clubId: game.managedClubId, clubName: 'Nya klubben', fromSeason: game.currentSeason },
        ],
      },
      eventLedger: [],
    }
    expect(selectReviewCallback(returnGame, fixture)).toEqual({
      kind: 'manager_return',
      text: 'Första gången tillbaka. Läktaren minns, åt båda hållen.',
    })

    const earlier = { ...fixture, id: 'earlier_return', matchday: fixture.matchday - 1 }
    expect(selectReviewCallback({ ...returnGame, fixtures: [earlier, fixture] }, fixture)).toBeNull()
  })

  it('knyter Årets spelare i en annan klubb till managerns tidigare personliga mål', () => {
    const { game, opponent, player, fixture } = setup()
    const oldClub = game.clubs.find(club => club.id !== game.managedClubId && club.id !== opponent.id)!
    const personalGoal: EventLedgerEntry = {
      type: 'player_milestone',
      semanticKey: `player_milestone:${player.id}:s${game.currentSeason - 2}:m0:manager_personal_goal`,
      clubId: oldClub.id,
      managerId: game.id,
      season: game.currentSeason - 2,
      matchday: 0,
      subject: { kind: 'player', id: player.id },
      significance: 40,
    }
    const award: EventLedgerEntry = {
      type: 'player_milestone',
      semanticKey: `player_milestone:${player.id}:s${game.currentSeason}:m22:arets_spelare`,
      clubId: opponent.id,
      season: game.currentSeason,
      matchday: 22,
      subject: { kind: 'player', id: player.id },
      significance: 75,
    }

    expect(selectReviewCallback({ ...game, eventLedger: [personalGoal, award] }, fixture)).toEqual({
      kind: 'developed_player_award',
      text: `${player.firstName} ${player.lastName} årets spelare. Det började i ${oldClub.name}.`,
      post: award,
    })
  })
})
