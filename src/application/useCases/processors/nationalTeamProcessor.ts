import type { EventLedgerEntry } from '../../../domain/entities/Narrative'
import type { Player } from '../../../domain/entities/Player'
import type { InboxItem, SaveGame } from '../../../domain/entities/SaveGame'
import { InboxItemType } from '../../../domain/enums'
import { SNUB_SCENE_LINES } from '../../../domain/data/landslagText'
import {
  applyCallupEffects,
  applyReturnEffects,
  CALLUP_CAP,
  LANDSLAGS_CA_TROSKEL,
  selectNationalTeam,
} from '../../../domain/services/nationalTeamService'

export interface NationalTeamRoundResult {
  players: Player[]
  inboxItems: InboxItem[]
  ledgerEntries: EventLedgerEntry[]
  activeCamp: SaveGame['activeNationalTeamCamp']
  lastSnub: SaveGame['lastNationalSnub']
  callupBonusTkr: number
  pendingCallupModal: SaveGame['pendingCallupModal']
  pendingReturn: SaveGame['pendingNationalTeamReturn']
  returnExpires: SaveGame['nationalTeamReturnExpires']
}

export function processNationalTeamRound(
  game: SaveGame,
  players: Player[],
  nextMatchday: number,
  isCupRound: boolean,
  isPlayoffRound: boolean,
): NationalTeamRoundResult {
  let updatedPlayers = players
  let activeCamp = game.activeNationalTeamCamp
  let lastSnub = game.lastNationalSnub
  let callupBonusTkr = 0
  let pendingCallupModal = game.pendingCallupModal
  let pendingReturn = game.pendingNationalTeamReturn
  let returnExpires = game.nationalTeamReturnExpires
  const inboxItems: InboxItem[] = []
  const ledgerEntries: EventLedgerEntry[] = []

  const calendarSlot = (game.seasonCalendar ?? []).find(slot => slot.matchday === nextMatchday)
  if (calendarSlot?.isLandslagsuppehall && !isCupRound && !isPlayoffRound && !game.activeNationalTeamCamp) {
    const calledUpIds = selectNationalTeam({ ...game, players: updatedPlayers })
    if (calledUpIds.length > 0) {
      const callupResult = applyCallupEffects(game, updatedPlayers, calledUpIds, nextMatchday)
      updatedPlayers = callupResult.players
      activeCamp = callupResult.activeNationalTeamCamp
      inboxItems.push(...callupResult.inboxItems)
      callupBonusTkr = callupResult.callupModal.bonusTkr
      pendingCallupModal = callupResult.callupModal
      ledgerEntries.push(...callupResult.ledgerEntries)
    }

    if (calledUpIds.length < CALLUP_CAP) {
      const snubCandidate = updatedPlayers
        .filter(player =>
          player.clubId === game.managedClubId &&
          !calledUpIds.includes(player.id) &&
          player.currentAbility < LANDSLAGS_CA_TROSKEL &&
          player.currentAbility >= LANDSLAGS_CA_TROSKEL - 5
        )
        .sort((left, right) => right.currentAbility - left.currentAbility)[0]

      if (snubCandidate) {
        updatedPlayers = updatedPlayers.map(player => player.id === snubCandidate.id
          ? {
              ...player,
              form: Math.max(0, player.form - 3),
              morale: Math.max(0, player.morale - 5),
            }
          : player
        )
        lastSnub = {
          playerId: snubCandidate.id,
          season: game.currentSeason,
          round: nextMatchday,
        }
        const template = SNUB_SCENE_LINES[game.currentSeason % SNUB_SCENE_LINES.length]
        const body = template.replace('{spelare}', `${snubCandidate.firstName} ${snubCandidate.lastName}`)
        const inboxId = `inbox_vm_snub_${game.currentSeason}`
        if (!game.inbox.some(item => item.id === inboxId)) {
          inboxItems.push({
            id: inboxId,
            date: game.currentDate,
            type: InboxItemType.Community,
            title: 'Förbi utan VM-kallelse',
            body,
            isRead: false,
          })
        }
      }
    }
  }

  if (game.activeNationalTeamCamp && nextMatchday > game.activeNationalTeamCamp.endRound) {
    const returnResult = applyReturnEffects(game, updatedPlayers, game.activeNationalTeamCamp)
    updatedPlayers = returnResult.players
    activeCamp = undefined
    inboxItems.push(...returnResult.inboxItems)
    pendingReturn = { text: returnResult.returnLine }
    returnExpires = nextMatchday + 1
  } else if (nextMatchday > (returnExpires ?? 0)) {
    pendingReturn = undefined
    returnExpires = undefined
  }

  return {
    players: players.map(player => updatedPlayers.find(updated => updated.id === player.id) ?? player),
    inboxItems,
    ledgerEntries,
    activeCamp,
    lastSnub,
    callupBonusTkr,
    pendingCallupModal,
    pendingReturn,
    returnExpires,
  }
}
