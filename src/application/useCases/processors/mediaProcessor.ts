import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { ScoutReport } from '../../../domain/entities/Scouting'
import { generateMediaHeadlines, generateTrendArticles, generateAbsurdityArticles } from '../../../domain/services/mediaService'
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
  localRand: () => number,
  options?: { skipSideEffects?: boolean },
): MediaResult {
  const isSecondPassForManagedMatch = options?.skipSideEffects ?? false
  const inboxItems: InboxItem[] = []
  const scoutReportUpdates: Record<string, ScoutReport> = {}
  let resolvedEventIds = [...(game.resolvedEventIds ?? [])]
  let reputationDelta = 0

  // Media headlines (all fixtures this round)
  const mediaHeadlines = generateMediaHeadlines(game, simulatedFixtures, nextMatchday, localRand)
  inboxItems.push(...mediaHeadlines)

  // Journalist post-match headline
  if (justCompletedManagedFixture && game.journalist && !isSecondPassForManagedMatch) {
    const prevManagedFixture = game.fixtures
      .filter(f =>
        f.status === 'completed' &&
        f.matchday < justCompletedManagedFixture.matchday &&
        (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId),
      )
      .sort((a, b) => b.matchday - a.matchday)[0]
    const prevLoss = prevManagedFixture != null && (() => {
      const isHome = prevManagedFixture.homeClubId === game.managedClubId
      const myScore = isHome ? prevManagedFixture.homeScore : prevManagedFixture.awayScore
      const theirScore = isHome ? prevManagedFixture.awayScore : prevManagedFixture.homeScore
      return (myScore ?? 0) < (theirScore ?? 0)
    })()
    const oppClubId = justCompletedManagedFixture.homeClubId === game.managedClubId
      ? justCompletedManagedFixture.awayClubId
      : justCompletedManagedFixture.homeClubId
    const oppClub = game.clubs.find(c => c.id === oppClubId)
    const headlineItem = generatePostMatchHeadline(
      game.journalist,
      justCompletedManagedFixture,
      game.managedClubId,
      newDate,
      game.currentSeason,
      prevLoss,
      oppClub?.shortName,
    )
    if (headlineItem) inboxItems.push(headlineItem)
  }

  // Trend articles
  const trendArticles = generateTrendArticles(game, nextMatchday, localRand)
  inboxItems.push(...trendArticles)

  // Småskandal-artiklar (Lager 1 småskandal-arketyp som triggade i denna omgång)
  const absurdityArticles = generateAbsurdityArticles(game, nextMatchday)
  inboxItems.push(...absurdityArticles)

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
