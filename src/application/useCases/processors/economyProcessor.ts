import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Club } from '../../../domain/entities/Club'
import type { Player } from '../../../domain/entities/Player'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { StandingRow } from '../../../domain/entities/SaveGame'
import { FixtureStatus } from '../../../domain/enums'
import {
  calcRoundIncome,
  applyFinanceChange,
} from '../../../domain/services/economyService'
import type { FinanceEntry } from '../../../domain/services/economyService'
import { getRivalry } from '../../../domain/data/rivalries'

export interface EconomyProcessorResult {
  updatedClubs: Club[]
  roundFinanceLog: FinanceEntry[]
}

/**
 * Processes all round income/expenses for managed club and AI clubs,
 * applies cup prize money, and returns updated clubs + finance log entries.
 *
 * @param simulatedFixtures - All fixtures processed this round
 * @param availabilityUpdatedPlayers - Players after availability updates (used for wages)
 * @param currentFanMood - Fan mood value for managed club income calculation
 * @param standings - Current league standings (used by calcRoundIncome)
 * @param nextMatchday - The matchday number being processed
 * @param prizeMoneyByClub - Cup prize money to apply (from cupProcessor)
 * @param localRand - Seeded random function
 */
export function processEconomy(
  game: SaveGame,
  simulatedFixtures: Fixture[],
  availabilityUpdatedPlayers: Player[],
  currentFanMood: number,
  standings: StandingRow[],
  nextMatchday: number,
  prizeMoneyByClub: Record<string, number>,
  localRand: () => number,
): EconomyProcessorResult {
  const roundFinanceLog: FinanceEntry[] = []

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)!
  const managedClubPlayers = availabilityUpdatedPlayers.filter(p => p.clubId === game.managedClubId)
  const managedHomeMatch = simulatedFixtures.find(
    f => f.homeClubId === game.managedClubId && f.status === FixtureStatus.Completed,
  )
  const isHomeMatch = !!managedHomeMatch
  const managedIncome = calcRoundIncome({
    club: managedClub,
    players: managedClubPlayers,
    sponsors: game.sponsors ?? [],
    communityActivities: game.communityActivities,
    volunteers: game.volunteers ?? [],
    fanMood: currentFanMood,
    isHomeMatch,
    matchIsKnockout: managedHomeMatch?.isKnockout ?? false,
    matchIsCup: managedHomeMatch?.isCup ?? false,
    matchHasRivalry: managedHomeMatch
      ? !!getRivalry(managedHomeMatch.homeClubId, managedHomeMatch.awayClubId)
      : false,
    standing: standings.find(s => s.clubId === game.managedClubId) ?? null,
    rand: localRand,
    communityStanding: game.communityStanding,
    isFirstRound: nextMatchday === 1,
  })

  if (managedIncome.weeklyBase !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: managedIncome.weeklyBase, reason: 'weekly_base', label: 'Grundintäkt (reputation)' })
  }
  if (managedIncome.sponsorIncome !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: managedIncome.sponsorIncome, reason: 'sponsorship', label: 'Sponsorintäkter' })
  }
  if (managedIncome.matchRevenue !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: managedIncome.matchRevenue, reason: 'match_revenue', label: `Matchintäkt${isHomeMatch ? ' (hemma)' : ''}` })
  }
  if (managedIncome.communityMatchIncome !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: managedIncome.communityMatchIncome, reason: 'community_round', label: 'Föreningsaktiviteter (match)' })
  }
  if (managedIncome.communityRoundIncome !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: managedIncome.communityRoundIncome, reason: 'community_round', label: 'Föreningsaktiviteter (omgång)' })
  }
  if (managedIncome.volunteerIncome !== 0) {
    const volunteerCount = (game.volunteers ?? []).length
    roundFinanceLog.push({ round: nextMatchday, amount: managedIncome.volunteerIncome, reason: 'community_round', label: `Frivilligas bidrag (${volunteerCount} st)` })
  }
  if (managedIncome.kommunBidrag !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: managedIncome.kommunBidrag, reason: 'kommunbidrag', label: `Kommunbidrag (säsongsstart)` })
  }
  if (managedIncome.weeklyWages !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: -managedIncome.weeklyWages, reason: 'wages', label: 'Löner' })
  }
  if (managedIncome.weeklyArenaCost !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: -managedIncome.weeklyArenaCost, reason: 'arena_maintenance', label: 'Arena-underhåll' })
  }

  let updatedClubs = applyFinanceChange(game.clubs, game.managedClubId, managedIncome.netPerRound)

  // AI clubs: simplified flat estimate
  for (const c of game.clubs) {
    if (c.id === game.managedClubId) continue
    const clubPlayers = availabilityUpdatedPlayers.filter(p => p.clubId === c.id)
    const homeMatch = simulatedFixtures.find(
      f => f.homeClubId === c.id && f.status === FixtureStatus.Completed,
    )
    const totalWages = clubPlayers.reduce((sum, p) => sum + p.salary, 0)
    const weeklyWages = Math.round(totalWages / 4)
    const weeklySponsorship = Math.round(c.reputation * 60)
    const aiMatchRevenue = homeMatch
      ? Math.round(c.reputation * 600 + localRand() * 10000)
      : 0
    updatedClubs = applyFinanceChange(updatedClubs, c.id, weeklySponsorship + aiMatchRevenue - weeklyWages)
  }

  // Cup prize money
  for (const [clubId, amount] of Object.entries(prizeMoneyByClub)) {
    if (amount > 0) {
      updatedClubs = applyFinanceChange(updatedClubs, clubId, amount)
    }
  }

  // Social media reputation boost (+1 every 5th matchday)
  if (game.communityActivities?.socialMedia && nextMatchday % 5 === 0) {
    updatedClubs = updatedClubs.map(c =>
      c.id === game.managedClubId
        ? { ...c, reputation: Math.min(100, c.reputation + 1) }
        : c,
    )
  }

  return { updatedClubs, roundFinanceLog }
}
