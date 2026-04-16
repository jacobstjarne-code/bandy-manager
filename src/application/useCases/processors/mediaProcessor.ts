import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { ScoutReport } from '../../../domain/entities/Scouting'
import { generateMediaHeadlines, generateTrendArticles } from '../../../domain/services/mediaService'
import { generatePostMatchHeadline } from '../../../domain/services/journalistService'
import { generateTransferRumor } from '../../../domain/services/rumorService'
import { checkMidSeasonEvents } from '../../../domain/services/midSeasonEventService'
import { checkReputationMilestones, milestonesToInbox } from '../../../domain/services/reputationMilestoneService'
import { generateDeadlineBids, generateDiscountOffer, deadlineBidToInbox, deadlineOfferToInbox } from '../../../domain/services/transferDeadlineService'

export interface MediaResult {
  inboxItems: InboxItem[]
  scoutReportUpdates: Record<string, ScoutReport>
  resolvedEventIds: string[]
  reputationDelta: number
}

export function processMedia(
  game: SaveGame,
  simulatedFixtures: Fixture[],
  justCompletedManagedFixture: Fixture | null,
  nextMatchday: number,
  currentLeagueRound: number | null,
  newDate: string,
  isSecondPassForManagedMatch: boolean,
  localRand: () => number,
): MediaResult {
  const inboxItems: InboxItem[] = []
  const scoutReportUpdates: Record<string, ScoutReport> = {}
  let resolvedEventIds = [...(game.resolvedEventIds ?? [])]
  let reputationDelta = 0

  // Media headlines (all fixtures this round)
  const mediaHeadlines = generateMediaHeadlines(game, simulatedFixtures, nextMatchday, localRand)
  inboxItems.push(...mediaHeadlines)

  // Journalist post-match headline
  if (justCompletedManagedFixture && game.journalist && !isSecondPassForManagedMatch) {
    const headlineItem = generatePostMatchHeadline(
      game.journalist,
      justCompletedManagedFixture,
      game.managedClubId,
      newDate,
      game.currentSeason,
    )
    if (headlineItem) inboxItems.push(headlineItem)
  }

  // Trend articles
  const trendArticles = generateTrendArticles(game, nextMatchday, localRand)
  inboxItems.push(...trendArticles)

  // Transfer rumors (matchday 5-18)
  const rumorResult = generateTransferRumor(game, localRand)
  if (rumorResult) {
    inboxItems.push(rumorResult.inboxItem)
    if (rumorResult.scoutHint) {
      scoutReportUpdates[rumorResult.scoutHint.playerId] = rumorResult.scoutHint
    }
  }

  // Mid-season events
  const midSeasonItems = checkMidSeasonEvents(game)
  inboxItems.push(...midSeasonItems)

  // Reputation milestones — starts at league round 8
  if (currentLeagueRound !== null && currentLeagueRound >= 8 && !isSecondPassForManagedMatch) {
    const repMilestones = checkReputationMilestones(game)
    if (repMilestones.length > 0) {
      inboxItems.push(...milestonesToInbox(repMilestones, game.currentDate))
      resolvedEventIds = [...resolvedEventIds, ...repMilestones.map(m => m.id)]
      for (const milestone of repMilestones) {
        if (milestone.effect?.type === 'reputation') {
          reputationDelta += milestone.effect.amount
        }
      }
    }
  }

  // Transfer deadline events (league rounds 13-15)
  if (currentLeagueRound !== null && currentLeagueRound >= 13 && currentLeagueRound <= 15 && !isSecondPassForManagedMatch) {
    const panicBids = generateDeadlineBids(game, localRand)
    for (const bid of panicBids) {
      inboxItems.push(deadlineBidToInbox(bid, game.currentDate, currentLeagueRound, game.currentSeason))
      resolvedEventIds = [...resolvedEventIds, `deadline_bid_${game.currentSeason}_r${currentLeagueRound}`]
    }
    const discountOffer = generateDiscountOffer(game, localRand)
    if (discountOffer) {
      inboxItems.push(deadlineOfferToInbox(discountOffer, game.currentDate, currentLeagueRound, game.currentSeason))
      resolvedEventIds = [...resolvedEventIds, `deadline_offer_${game.currentSeason}_r${currentLeagueRound}`]
    }
  }

  return { inboxItems, scoutReportUpdates, resolvedEventIds, reputationDelta }
}
