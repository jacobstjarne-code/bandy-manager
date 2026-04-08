import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { CupBracket, CupMatch } from '../../../domain/entities/Cup'
import { FixtureStatus, InboxItemType } from '../../../domain/enums'
import {
  updateCupBracketAfterRound,
  generateNextCupRound,
  getCupRoundName,
} from '../../../domain/services/cupService'

export interface CupProcessorResult {
  updatedCupBracket: CupBracket | null
  cupNewFixtures: Fixture[]
  cupInboxItems: InboxItem[]
  /** Prize money to add per club (apply via applyFinanceChange in orchestrator) */
  prizeMoneyByClub: Record<string, number>
}

/**
 * Processes cup bracket updates, generates next-round fixtures, and calculates prize money.
 *
 * @param simulatedFixtures - All fixtures processed this round (newly simulated + live-played completed)
 * @param fixturesCompletedBeforeRound - IDs of fixtures already completed before this advance() call
 */
export function processCupRound(
  game: SaveGame,
  simulatedFixtures: Fixture[],
  fixturesCompletedBeforeRound: Set<string>,
  currentDate: string,
): CupProcessorResult {
  const result: CupProcessorResult = {
    updatedCupBracket: game.cupBracket ?? null,
    cupNewFixtures: [],
    cupInboxItems: [],
    prizeMoneyByClub: {},
  }

  if (!result.updatedCupBracket || result.updatedCupBracket.completed) return result

  // Only update bracket with NEWLY completed cup fixtures (not live-played ones already counted
  // by saveLiveMatchResult → updateCupBracketAfterRound in matchActions)
  const newlyCompletedCupThisRound = simulatedFixtures.filter(f =>
    f.status === FixtureStatus.Completed && f.isCup && !fixturesCompletedBeforeRound.has(f.id)
  )

  if (newlyCompletedCupThisRound.length > 0) {
    result.updatedCupBracket = updateCupBracketAfterRound(
      result.updatedCupBracket,
      newlyCompletedCupThisRound,
    )

    const roundsWithMatches = [...new Set(result.updatedCupBracket.matches.map(m => m.round))]
    const maxRound = Math.max(...roundsWithMatches)
    const currentRoundMatches = result.updatedCupBracket.matches.filter(m => m.round === maxRound)
    const currentRoundComplete = currentRoundMatches.every(m => m.winnerId)

    if (currentRoundComplete) {
      if (maxRound === 4) {
        // Cup final complete — set winner and mark completed
        const finalMatch = currentRoundMatches[0]
        result.updatedCupBracket = {
          ...result.updatedCupBracket,
          winnerId: finalMatch.winnerId,
          completed: true,
        }

        const managedIsWinner = finalMatch.winnerId === game.managedClubId
        const managedIsRunnerUp =
          !managedIsWinner &&
          (finalMatch.homeClubId === game.managedClubId || finalMatch.awayClubId === game.managedClubId)

        if (managedIsWinner) {
          const winnerClub = game.clubs.find(c => c.id === finalMatch.winnerId)
          result.cupInboxItems.push({
            id: `inbox_cup_winner_${game.currentSeason}`,
            date: currentDate,
            type: InboxItemType.Playoff,
            title: '🏆 CUPVINNARE!',
            body: `${winnerClub?.name} vinner Svenska Cupen ${game.currentSeason}! En fantastisk bedrift!`,
            isRead: false,
          } as InboxItem)
        } else if (managedIsRunnerUp) {
          const winnerClub = game.clubs.find(c => c.id === finalMatch.winnerId)
          result.cupInboxItems.push({
            id: `inbox_cup_final_loss_${game.currentSeason}`,
            date: currentDate,
            type: InboxItemType.Playoff,
            title: 'Cupfinalen förlorad',
            body: `${winnerClub?.name ?? 'Motståndaren'} tog cuptiteln. En stark insats att ta sig till finalen.`,
            isRead: false,
          } as InboxItem)
        }
      } else {
        // Generate next cup round fixtures
        const { updatedBracket, newFixtures } = generateNextCupRound(
          result.updatedCupBracket,
          maxRound,
          game.currentSeason,
        )
        result.updatedCupBracket = updatedBracket
        result.cupNewFixtures = newFixtures
      }

      // Check managed club elimination (non-final rounds)
      if (!result.updatedCupBracket.completed) {
        for (const match of currentRoundMatches) {
          if (
            match.winnerId &&
            match.winnerId !== game.managedClubId &&
            (match.homeClubId === game.managedClubId || match.awayClubId === game.managedClubId)
          ) {
            const winner = game.clubs.find(c => c.id === match.winnerId)
            const roundName = getCupRoundName(match.round)
            result.cupInboxItems.push({
              id: `inbox_cup_elim_${game.currentSeason}_r${match.round}`,
              date: currentDate,
              type: InboxItemType.Playoff,
              title: `Utslagna ur cup${roundName}`,
              body: `${winner?.name ?? 'Motståndaren'} gick vidare. Cupäventyret är över för i år.`,
              isRead: false,
            } as InboxItem)
            break
          }
        }
      }
    }
  }

  // ── Prize money ─────────────────────────────────────────────────────────────
  // Apply to ALL completed cup fixtures this round (including live-played ones whose bracket was
  // already updated by matchActions — prize money is NOT applied there, only here).
  const CUP_PRIZES: Record<number, number> = { 1: 10000, 2: 30000, 3: 50000, 4: 150000 }
  const RUNNER_UP_PRIZE = 50000

  const completedCupThisRound = simulatedFixtures.filter(
    f => f.status === FixtureStatus.Completed && f.isCup,
  )

  for (const fixture of completedCupThisRound) {
    const match: CupMatch | undefined = result.updatedCupBracket!.matches.find(m => m.fixtureId === fixture.id)
    if (!match || !match.winnerId) continue

    const winnerId: string = match.winnerId
    const loserId = fixture.homeClubId === winnerId ? fixture.awayClubId : fixture.homeClubId
    const winPrize = CUP_PRIZES[match.round] ?? 0
    const losePrize = match.round === 4 ? RUNNER_UP_PRIZE : 0

    result.prizeMoneyByClub[winnerId] = (result.prizeMoneyByClub[winnerId] ?? 0) + winPrize
    if (losePrize > 0) {
      result.prizeMoneyByClub[loserId] = (result.prizeMoneyByClub[loserId] ?? 0) + losePrize
    }
  }

  return result
}
