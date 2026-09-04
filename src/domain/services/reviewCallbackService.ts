import { MatchEventType, PlayerPosition } from '../enums'
import type { Fixture } from '../entities/Fixture'
import type { EventLedgerEntry } from '../entities/Narrative'
import type { SaveGame } from '../entities/SaveGame'
import { currentChronology } from './currentChronology'
import { agendaForSurface, redaktoren } from './redaktorenService'
import { toldMarksFor } from './ledgerToldService'
import { getManagerReturnContext } from './managerReturnService'

export type ReviewCallbackKind =
  | 'former_player_goal'
  | 'former_player_potm'
  | 'manager_return'
  | 'developed_player_award'

export interface ReviewCallback {
  kind: ReviewCallbackKind
  text: string
  post?: EventLedgerEntry
}

const FORMER_PLAYER_TYPES = new Set<EventLedgerEntry['type']>([
  'transfer_sold',
  'transfer_story',
  'nemesis_signed',
])

function opponentId(game: SaveGame, fixture: Fixture): string | null {
  if (fixture.homeClubId === game.managedClubId) return fixture.awayClubId
  if (fixture.awayClubId === game.managedClubId) return fixture.homeClubId
  return null
}

function playerName(game: SaveGame, playerId: string): string | null {
  const player = game.players.find(candidate => candidate.id === playerId)
  return player ? `${player.firstName} ${player.lastName}` : null
}

const FORMER_POSITION: Record<PlayerPosition, string> = {
  [PlayerPosition.Goalkeeper]: 'målvakt',
  [PlayerPosition.Defender]: 'back',
  [PlayerPosition.Half]: 'halv',
  [PlayerPosition.Midfielder]: 'mittfältare',
  [PlayerPosition.Forward]: 'forward',
}

function selectFormerPlayerCallback(game: SaveGame, fixture: Fixture): ReviewCallback | null {
  const opponent = opponentId(game, fixture)
  if (!opponent) return null
  const opponentPlayerIds = new Set(
    game.players.filter(player => player.clubId === opponent).map(player => player.id),
  )
  const potmId = fixture.report?.playerOfTheMatchId
  const scorerIds = new Set(fixture.events
    .filter(event => event.type === MatchEventType.Goal && event.clubId === opponent && event.playerId)
    .map(event => event.playerId!))

  const agenda = agendaForSurface(redaktoren(game, currentChronology(game)), 'review')
  for (const item of agenda) {
    const { post } = item
    const subjectId = post.subject?.kind === 'player' ? post.subject.id : null
    if (!subjectId || !opponentPlayerIds.has(subjectId) || !FORMER_PLAYER_TYPES.has(post.type)) continue
    if (toldMarksFor(game.ledgerTold, post).some(mark => mark.surface === 'review')) continue
    const name = playerName(game, subjectId)
    if (!name) continue

    if (scorerIds.has(subjectId) && post.season === fixture.season && post.matchday === 0) {
      return {
        kind: 'former_player_goal',
        text: `${name}, som ni sålde i somras. Mål — mot er.`,
        post,
      }
    }
    if (potmId === subjectId) {
      const player = game.players.find(candidate => candidate.id === subjectId)!
      return {
        kind: 'former_player_potm',
        text: `${name}. Er förre ${FORMER_POSITION[player.position]}, matchens spelare mot er.`,
        post,
      }
    }
  }
  return null
}

function isPersonalGoalPost(post: EventLedgerEntry, managerId: string): boolean {
  return post.type === 'player_milestone'
    && post.managerId === managerId
    && post.semanticKey.endsWith(':manager_personal_goal')
    && post.subject?.kind === 'player'
}

function isPlayerOfTheYearPost(post: EventLedgerEntry): boolean {
  return post.type === 'player_milestone'
    && post.semanticKey.endsWith(':arets_spelare')
    && post.subject?.kind === 'player'
}

function selectDevelopedPlayerCallback(game: SaveGame): ReviewCallback | null {
  const awards = (game.eventLedger ?? [])
    .filter(isPlayerOfTheYearPost)
    .filter(post => post.clubId !== game.managedClubId)
    .filter(post => !toldMarksFor(game.ledgerTold, post).some(mark => mark.surface === 'review'))
    .sort((a, b) => (b.season - a.season) || (b.matchday - a.matchday))

  for (const award of awards) {
    const playerId = award.subject!.id
    const goal = (game.eventLedger ?? [])
      .filter(post => isPersonalGoalPost(post, game.id) && post.subject!.id === playerId)
      .sort((a, b) => (b.season - a.season) || (b.matchday - a.matchday))[0]
    if (!goal?.clubId || goal.clubId === award.clubId) continue
    const name = playerName(game, playerId)
    const oldClub = game.clubs.find(club => club.id === goal.clubId)?.name
    if (!name || !oldClub) continue
    return {
      kind: 'developed_player_award',
      text: `${name} årets spelare. Det började i ${oldClub}.`,
      post: award,
    }
  }
  return null
}

/** SPEC_BERATTAREN §5: exakt en callback, med relationen före bakgrunden. */
export function selectReviewCallback(game: SaveGame, fixture: Fixture): ReviewCallback | null {
  const formerPlayer = selectFormerPlayerCallback(game, fixture)
  if (formerPlayer) return formerPlayer
  if (getManagerReturnContext(game, fixture)) {
    return {
      kind: 'manager_return',
      text: 'Första gången tillbaka. Läktaren minns, åt båda hållen.',
    }
  }
  return selectDevelopedPlayerCallback(game)
}
