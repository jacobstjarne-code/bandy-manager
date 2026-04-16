import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { GameEvent, TransferBid } from '../../../domain/entities/GameEvent'
import type { Fixture } from '../../../domain/entities/Fixture'
import { InboxItemType } from '../../../domain/enums'
import { generatePostAdvanceEvents, generateEvents } from '../../../domain/services/eventService'
import { createEconomicStressEvent } from '../../../domain/services/events/eventFactories'
import { generateSocialEvent, generateSilentShoutEvent } from '../../../domain/services/mecenatService'

export interface EventProcessorResult {
  gameEvents: GameEvent[]
  inboxItems: InboxItem[]
  updatedMecenater: NonNullable<SaveGame['mecenater']>
  lastEconomicStressRound: number | undefined
}

export function processGameEvents(
  game: SaveGame,
  newBids: TransferBid[],
  justCompletedManagedFixture: Fixture | null | undefined,
  nextMatchday: number,
  localRand: () => number,
): EventProcessorResult {
  const inboxItems: InboxItem[] = []

  const newEvents = generatePostAdvanceEvents(game, newBids, nextMatchday, localRand, justCompletedManagedFixture ?? undefined)
  const communityEvents = generateEvents(game, nextMatchday, localRand)
  const gameEvents: GameEvent[] = [...newEvents, ...communityEvents]

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (managedClub && managedClub.finances < -50000 && managedClub.finances >= -100000) {
    const warnId = `inbox_finance_warn_${game.currentSeason}_${nextMatchday}`
    if (!game.inbox.some(i => i.id === warnId)) {
      inboxItems.push({
        id: warnId,
        date: game.currentDate,
        type: InboxItemType.BoardFeedback,
        title: '⚠️ Ekonomisk varning',
        body: `Kassan är på ${managedClub.finances.toLocaleString('sv-SE')} kr. Om vi når -100k kan licensnämnden agera.`,
        isRead: false,
      })
    }
  }

  let lastEconomicStressRound: number | undefined = game.lastEconomicStressRound
  const stressEvent = createEconomicStressEvent(game, nextMatchday, localRand)
  if (stressEvent) {
    gameEvents.push(stressEvent)
    lastEconomicStressRound = nextMatchday
  }

  let updatedMecenater = (game.mecenater ?? []).map(mec => {
    if (!mec.isActive) return mec
    const roundsSinceInteraction = nextMatchday - (mec.lastInteractionRound ?? 0)
    const decayedHappiness = roundsSinceInteraction > 4
      ? Math.max(0, mec.happiness - 1)
      : mec.happiness
    return { ...mec, happiness: decayedHappiness }
  })

  for (let i = 0; i < updatedMecenater.length; i++) {
    const mec = updatedMecenater[i]
    if (!mec.isActive) continue

    const roundsSinceLastSocial = nextMatchday - (mec.lastSocialRound ?? 0)
    if (roundsSinceLastSocial >= 4 && localRand() < 0.35) {
      const socialEvent = generateSocialEvent(mec, game.currentSeason, nextMatchday, localRand)
      gameEvents.push(socialEvent)
      updatedMecenater = updatedMecenater.map((m, idx) =>
        idx === i ? { ...m, lastSocialRound: nextMatchday } : m
      )
    }

    if (mec.happiness < 30 || mec.silentShout >= 30) {
      const randomPlayer = game.players.find(p => p.clubId === game.managedClubId)
      const playerName = randomPlayer ? `${randomPlayer.firstName} ${randomPlayer.lastName}` : undefined
      const shoutEvent = generateSilentShoutEvent(mec, playerName, localRand)
      if (shoutEvent) {
        gameEvents.push(shoutEvent)
      }
    }

    if (mec.demands.length > 0) {
      const demandId = `inbox_mec_demand_${mec.id}_${nextMatchday}`
      if (!game.inbox.some(item => item.id === demandId) && nextMatchday % 5 === 0) {
        const demandTexts = mec.demands.map(d => d.description ?? d.type).join(', ')
        inboxItems.push({
          id: demandId,
          date: game.currentDate,
          type: InboxItemType.PatronInfluence,
          title: `📋 ${mec.name} påminner`,
          body: `${mec.name} har fortfarande önskemål som inte hanterats: ${demandTexts}.`,
          isRead: false,
        } as InboxItem)
      }
    }
  }

  return { gameEvents, inboxItems, updatedMecenater, lastEconomicStressRound }
}
