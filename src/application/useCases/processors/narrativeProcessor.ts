import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { VictoryEcho } from '../../../domain/services/postVictoryNarrativeService'
import type { SupporterGroup } from '../../../domain/entities/SaveGame'
import { InboxItemType, MatchEventType, FixtureStatus } from '../../../domain/enums'
import { getRivalry } from '../../../domain/data/rivalries'
import { updateSupporterMembers, reevaluateFavoritePlayer } from '../../../domain/services/supporterService'
import { classifyVictory, generateVictoryEcho } from '../../../domain/services/postVictoryNarrativeService'

export interface NarrativeResult {
  fanMood: number
  supporterGroup: SupporterGroup | undefined
  pendingVictoryEcho: VictoryEcho | undefined
  victoryEchoExpires: number | undefined
  rivalryHistory: SaveGame['rivalryHistory']
  nemesisTracker: SaveGame['nemesisTracker']
  inboxItems: InboxItem[]
}

export function processNarrative(
  game: SaveGame,
  justCompletedManagedFixture: Fixture | null,
  nextMatchday: number,
  newDate: string,
  localRand: () => number,
): NarrativeResult {
  const inboxItems: InboxItem[] = []

  // ── Fan mood + supporter group ──────────────────────────────────────────
  const currentFanMood = game.fanMood ?? 50
  let fanMood = currentFanMood
  let supporterGroup = game.supporterGroup
  if (justCompletedManagedFixture) {
    const isHome = justCompletedManagedFixture.homeClubId === game.managedClubId
    const myScore = isHome ? justCompletedManagedFixture.homeScore : justCompletedManagedFixture.awayScore
    const theirScore = isHome ? justCompletedManagedFixture.awayScore : justCompletedManagedFixture.homeScore
    const won = (myScore ?? 0) > (theirScore ?? 0)
    const lost = (myScore ?? 0) < (theirScore ?? 0)
    const bigWin = won && (myScore ?? 0) >= (theirScore ?? 0) + 3
    const bigLoss = lost && (theirScore ?? 0) >= (myScore ?? 0) + 3
    const fanDelta = bigWin ? 8 : won ? 4 : bigLoss ? -8 : lost ? -4 : 1
    fanMood = Math.max(0, Math.min(100, currentFanMood + fanDelta))
    if (isHome && supporterGroup) {
      supporterGroup = updateSupporterMembers(supporterGroup, won, localRand)
    }
  }

  // ── Victory echo ─────────────────────────────────────────────────────────
  let pendingVictoryEcho = game.pendingVictoryEcho
  let victoryEchoExpires = game.victoryEchoExpires
  if (justCompletedManagedFixture) {
    const victoryType = classifyVictory(justCompletedManagedFixture, game.managedClubId)
    if (victoryType) {
      const opponentId = justCompletedManagedFixture.homeClubId === game.managedClubId
        ? justCompletedManagedFixture.awayClubId
        : justCompletedManagedFixture.homeClubId
      const opponentClub = game.clubs.find(c => c.id === opponentId)
      const opponentName = opponentClub?.shortName ?? opponentClub?.name ?? 'motståndaren'
      const echo = generateVictoryEcho(victoryType, justCompletedManagedFixture, opponentName)
      pendingVictoryEcho = echo
      victoryEchoExpires = nextMatchday + 1
      if (echo.boardMessage) {
        inboxItems.push({
          id: `victory_board_${justCompletedManagedFixture.id}`,
          type: InboxItemType.MediaEvent,
          title: 'Efter vinsten',
          body: echo.boardMessage,
          date: game.currentDate,
          isRead: false,
        })
      }
    } else {
      if (nextMatchday > (victoryEchoExpires ?? 0)) {
        pendingVictoryEcho = undefined
        victoryEchoExpires = undefined
      }
    }
  }

  // ── Supporter favourite reevaluation (every 5 rounds) ────────────────────
  if (nextMatchday % 5 === 0 && supporterGroup) {
    const favResult = reevaluateFavoritePlayer(
      supporterGroup,
      game.players.filter(p => p.clubId === game.managedClubId),
      nextMatchday,
      game.currentSeason,
    )
    if (favResult.changed) {
      inboxItems.push({
        id: `fav_shift_${nextMatchday}_${game.currentSeason}`,
        type: InboxItemType.MediaEvent,
        title: 'Klacken har en ny favorit',
        body: `Klacken sjunger inte längre ${favResult.oldFavoriteName}s namn. ${favResult.newFavoriteName} har tagit över kören.`,
        date: game.currentDate,
        isRead: false,
      } as InboxItem)
      supporterGroup = { ...supporterGroup, favoritePlayerId: favResult.favoritePlayerId }
    }
  }

  // ── Rivalry history ──────────────────────────────────────────────────────
  let rivalryHistory = { ...(game.rivalryHistory ?? {}) }
  if (justCompletedManagedFixture) {
    const isHome = justCompletedManagedFixture.homeClubId === game.managedClubId
    const myScore = isHome ? justCompletedManagedFixture.homeScore : justCompletedManagedFixture.awayScore
    const theirScore = isHome ? justCompletedManagedFixture.awayScore : justCompletedManagedFixture.homeScore
    const opponentId = isHome ? justCompletedManagedFixture.awayClubId : justCompletedManagedFixture.homeClubId

    const won = myScore > theirScore
    const lost = myScore < theirScore
    const resultLabel: 'win' | 'loss' | 'draw' = won ? 'win' : lost ? 'loss' : 'draw'

    const prev = rivalryHistory[opponentId] ?? { wins: 0, losses: 0, draws: 0, currentStreak: 0 }
    const newWins = prev.wins + (won ? 1 : 0)
    const newLosses = prev.losses + (lost ? 1 : 0)
    const newDraws = prev.draws + (!won && !lost ? 1 : 0)
    let newStreak: number
    if (won) {
      newStreak = prev.currentStreak > 0 ? prev.currentStreak + 1 : 1
    } else if (lost) {
      newStreak = prev.currentStreak < 0 ? prev.currentStreak - 1 : -1
    } else {
      newStreak = 0
    }

    rivalryHistory = {
      ...rivalryHistory,
      [opponentId]: {
        wins: newWins,
        losses: newLosses,
        draws: newDraws,
        lastResult: resultLabel,
        currentStreak: newStreak,
      },
    }

    const totalMeetings = newWins + newLosses + newDraws
    if (totalMeetings >= 4) {
      const rival = game.clubs.find(c => c.id === opponentId)
      const managedClub = game.clubs.find(c => c.id === game.managedClubId)
      const alreadySentId = `inbox_rivalry_context_${opponentId}_r${nextMatchday}_${game.currentSeason}`
      if (!game.inbox.some(i => i.id === alreadySentId)) {
        let rivalryBody = ''
        if (newWins > newLosses + newLosses * 0.5 && won) {
          rivalryBody = `${managedClub?.name ?? 'Ni'} dominerar mötet mot ${rival?.name ?? 'motståndaren'} med ${newWins}–${newLosses} i matcher. Dominansen håller i sig.`
        } else if (newLosses > newWins && won) {
          rivalryBody = `Revansch! ${managedClub?.name ?? 'Ni'} bröt den negativa sviten mot ${rival?.name ?? 'motståndaren'} som lett ${newLosses}–${newWins} i möten.`
        } else if (Math.abs(newStreak) >= 2) {
          const streakText = newStreak > 0 ? `${newStreak} raka segrar` : `${Math.abs(newStreak)} raka förluster`
          rivalryBody = `${managedClub?.name ?? 'Ni'} har nu ${streakText} mot ${rival?.name ?? 'motståndaren'}.`
        }
        if (rivalryBody) {
          inboxItems.push({
            id: alreadySentId,
            date: game.currentDate,
            type: InboxItemType.BoardFeedback,
            title: `Rivalmöte: ${rival?.name ?? 'Motståndaren'}`,
            body: rivalryBody,
            relatedClubId: opponentId,
            isRead: false,
          } as InboxItem)
        }
      }
    }
  }

  // ── Nemesis tracker ──────────────────────────────────────────────────────
  let nemesisTracker = { ...(game.nemesisTracker ?? {}) }
  if (justCompletedManagedFixture) {
    const isHome = justCompletedManagedFixture.homeClubId === game.managedClubId
    const opponentClubId = isHome ? justCompletedManagedFixture.awayClubId : justCompletedManagedFixture.homeClubId
    const opponentGoalEvents = justCompletedManagedFixture.events.filter(
      e => e.type === MatchEventType.Goal && e.clubId === opponentClubId && e.playerId,
    )
    const goalsByOpponent: Record<string, number> = {}
    for (const evt of opponentGoalEvents) {
      if (evt.playerId) goalsByOpponent[evt.playerId] = (goalsByOpponent[evt.playerId] ?? 0) + 1
    }
    for (const [playerId, matchGoals] of Object.entries(goalsByOpponent)) {
      const opponentPlayer = game.players.find(p => p.id === playerId)
      if (!opponentPlayer) continue
      const prev = nemesisTracker[playerId] ?? {
        playerId,
        name: `${opponentPlayer.firstName} ${opponentPlayer.lastName}`,
        clubId: opponentClubId,
        goalsAgainstUs: 0,
      }
      const newTotal = prev.goalsAgainstUs + matchGoals
      const shouldSendInbox = newTotal >= 3 && (prev.inboxSentAt == null || prev.inboxSentAt < 3)
      nemesisTracker[playerId] = { ...prev, goalsAgainstUs: newTotal, clubId: opponentClubId }
      if (shouldSendInbox) {
        nemesisTracker[playerId].inboxSentAt = newTotal
        const nemesisClub = game.clubs.find(c => c.id === opponentClubId)
        inboxItems.push({
          id: `inbox_nemesis_${playerId}_${game.currentSeason}`,
          date: game.currentDate,
          type: InboxItemType.BoardFeedback,
          title: `⚠️ Nemesis: ${opponentPlayer.firstName} ${opponentPlayer.lastName}`,
          body: `${opponentPlayer.firstName} ${opponentPlayer.lastName} (${nemesisClub?.name ?? 'motst.'}) har nu gjort ${newTotal} mål mot oss. Är det dags att värva honom istället?`,
          relatedPlayerId: playerId,
          isRead: false,
        } as InboxItem)
      }
    }
  }

  // ── Pre-derby context (upcoming derby preview) ─────────────────────────
  if (justCompletedManagedFixture) {
    const upcomingRivalry = game.fixtures
      .filter(f => f.status === FixtureStatus.Scheduled &&
        (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
      .sort((a, b) => a.matchday - b.matchday)[0]

    if (upcomingRivalry) {
      const rivalry = getRivalry(upcomingRivalry.homeClubId, upcomingRivalry.awayClubId)
      if (rivalry) {
        const opponentId = upcomingRivalry.homeClubId === game.managedClubId
          ? upcomingRivalry.awayClubId : upcomingRivalry.homeClubId
        const rival = game.clubs.find(c => c.id === opponentId)
        const previewId = `inbox_derby_preview_${opponentId}_s${game.currentSeason}`
        const alreadySent = inboxItems.some(i => i.id === previewId) || game.inbox.some(i => i.id === previewId)
        if (!alreadySent && rival) {
          const h2h = rivalryHistory[opponentId]
          const historyStr = h2h && h2h.wins + h2h.losses + h2h.draws >= 2
            ? ` H2H: ${h2h.wins}V–${h2h.draws}O–${h2h.losses}F.`
            : ''
          inboxItems.push({
            id: previewId,
            date: newDate,
            type: InboxItemType.Derby,
            title: `Derby: ${rivalry.name} väntar`,
            body: `${rival.name} är nästa motståndare.${historyStr} Stämningen är hög i stan — derbyt avgör mer än tre poäng.`,
            isRead: false,
          } as InboxItem)
        }
      }
    }
  }

  return {
    fanMood,
    supporterGroup,
    pendingVictoryEcho,
    victoryEchoExpires,
    rivalryHistory,
    nemesisTracker,
    inboxItems,
  }
}
