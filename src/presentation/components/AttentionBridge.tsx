import { useEffect, useMemo, useRef } from 'react'
import {
  consumeNotificationOpen,
  acknowledgeNarrativeDeliveryReceipts,
  getNarrativeDeliveryReceipts,
  recordNotificationEvent,
  syncAttentionSnapshot,
  updateAppBadge,
  recordMeaningfulNotificationAction,
} from '../../infrastructure/attention/attentionClient'
import { useGameStore } from '../store/gameStore'

function playerDecisionCount(game: NonNullable<ReturnType<typeof useGameStore.getState>['game']>): number {
  const eventChoices = (game.resolvedChoices ?? []).filter(choice => choice.madeByPlayer === true).length
  return eventChoices + (game.resolvedWeeklyDecisions?.length ?? 0)
}

/**
 * Tunn browser-adapter. All kandidatlogik ligger i domänen; komponenten
 * synkar bara efter uttrycklig opt-in (ingen installationsidentitet skapas
 * här) och håller Badging API i fas med lokalt, sant state.
 */
export function AttentionBridge() {
  const game = useGameStore(state => state.game)
  const markNarrativePushDelivered = useGameStore(state => state.markNarrativePushDelivered)
  const unreadInboxCount = useMemo(
    () => game?.inbox.filter(item => !item.isRead).length ?? 0,
    [game?.inbox],
  )
  const previousGameState = useRef<{
    id: string
    season: number
    lineupConfirmed: boolean
    lastCompletedFixtureId?: string
    playerDecisions: number
  } | null>(null)

  useEffect(() => {
    const openedFromNotification = consumeNotificationOpen()
    if (!openedFromNotification) {
      void recordNotificationEvent('app_opened').catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!game) return
    let cancelled = false
    void getNarrativeDeliveryReceipts()
      .then(async receipts => {
        if (cancelled || useGameStore.getState().game?.id !== game.id) return
        const currentSaveReceipts = receipts.filter(receipt => receipt.saveId === game.id)
        for (const receipt of currentSaveReceipts) {
          markNarrativePushDelivered(receipt.narrativePost)
        }
        // Kvittera först efter att den lokala store-uppdateringen körts. Om
        // nätet faller repeteras de idempotenta kvittona vid nästa appstart.
        await acknowledgeNarrativeDeliveryReceipts(
          currentSaveReceipts.map(receipt => receipt.deliveryId),
        )
      })
      .catch(error => {
        if (import.meta.env.DEV) console.info('[Attention] Delivery receipt sync skipped:', error)
      })
    return () => { cancelled = true }
  }, [game?.id, markNarrativePushDelivered])

  useEffect(() => {
    void updateAppBadge(unreadInboxCount)
  }, [unreadInboxCount])

  useEffect(() => {
    if (!game) {
      previousGameState.current = null
      return
    }
    const previous = previousGameState.current
    if (previous?.id === game.id) {
      if (!previous.lineupConfirmed && game.lineupConfirmedThisRound === true) {
        recordMeaningfulNotificationAction('lineup_confirmed')
      }
      if (game.lastCompletedFixtureId && game.lastCompletedFixtureId !== previous.lastCompletedFixtureId) {
        recordMeaningfulNotificationAction('match_played')
      }
      const decisions = playerDecisionCount(game)
      if (decisions > previous.playerDecisions) {
        recordMeaningfulNotificationAction('decision_resolved')
      }
      if (game.currentSeason > previous.season) {
        recordMeaningfulNotificationAction('season_transitioned')
      }
    }
    previousGameState.current = {
      id: game.id,
      season: game.currentSeason,
      lineupConfirmed: game.lineupConfirmedThisRound === true,
      lastCompletedFixtureId: game.lastCompletedFixtureId,
      playerDecisions: playerDecisionCount(game),
    }
  }, [
    game?.id,
    game?.currentSeason,
    game?.lineupConfirmedThisRound,
    game?.lastCompletedFixtureId,
    game?.resolvedChoices,
    game?.resolvedWeeklyDecisions,
  ])

  useEffect(() => {
    if (!game) return
    const timeout = window.setTimeout(() => {
      void syncAttentionSnapshot(game).catch(error => {
        if (import.meta.env.DEV) console.info('[Attention] Snapshot sync skipped:', error)
      })
    }, 750)
    return () => window.clearTimeout(timeout)
  }, [game?.id, game?.revision, game?.lastSavedAt])

  return null
}
