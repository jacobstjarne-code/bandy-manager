import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Club } from '../../../domain/entities/Club'
import type { Player } from '../../../domain/entities/Player'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { StandingRow } from '../../../domain/entities/SaveGame'
import { FixtureStatus } from '../../../domain/enums'
import {
  calcRoundIncome,
  applyFinanceChange,
  effectiveWeatherAttendance,
} from '../../../domain/services/economyService'
import { getJournalistAttendanceModifier } from '../../../domain/services/journalistVisibilityService'
import type { FinanceEntry } from '../../../domain/services/economyService'
import { getRivalry } from '../../../domain/data/rivalries'
import { generateVolunteerRoster } from '../../../domain/services/volunteerService'
import { FACILITY_NODE_DEFS } from '../../../domain/data/facilityNodes'
import { getOrtFreshnessFactor, getSeasonsActive } from '../../../domain/services/communityRenewalService'
import { getActivityStalenessMultiplier } from '../../../domain/services/communityStandingScaling'

export interface EconomyProcessorResult {
  updatedClubs: Club[]
  roundFinanceLog: FinanceEntry[]
  clearAnnandagsGratisentreVal?: boolean  // P1: true when gratisentré income was applied
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
  options?: { skipSideEffects?: boolean },
): EconomyProcessorResult {
  if (options?.skipSideEffects) {
    return { roundFinanceLog: [], updatedClubs: game.clubs }
  }
  const roundFinanceLog: FinanceEntry[] = []

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)!
  const managedClubPlayers = availabilityUpdatedPlayers.filter(p => p.clubId === game.managedClubId)
  const managedHomeMatch = simulatedFixtures.find(
    f => f.homeClubId === game.managedClubId && f.status === FixtureStatus.Completed,
  )
  const isHomeMatch = !!managedHomeMatch
  const legendSalaryCost = ((game.clubLegends ?? [])
    .filter(l => l.role === 'youth_coach' || l.role === 'scout').length) * 500
  const volunteerSeedNum = game.managedClubId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + game.currentSeason * 17
  const volunteerRoster = generateVolunteerRoster(volunteerSeedNum, 4)
  // O5 kraft 2: byggda nodens upkeepCost, en per byggd nod (FacilityState.builtNodeIds)
  const builtFacilityUpkeepCosts = (game.facilityState?.builtNodeIds ?? [])
    .map(id => FACILITY_NODE_DEFS.find(def => def.id === id)?.upkeepCost ?? 0)
  const managedIncome = calcRoundIncome({
    club: managedClub,
    players: managedClubPlayers,
    sponsors: game.sponsors ?? [],
    communityActivities: game.communityActivities,
    volunteers: game.volunteers ?? [],
    volunteerRoster,
    sponsorNetworkMood: game.sponsorNetworkMood,
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
    legendSalaryCost,
    journalistAttendanceModifier: getJournalistAttendanceModifier(game),
    weatherAttendanceModifier: effectiveWeatherAttendance(
      game.matchWeathers?.find(mw => mw.fixtureId === managedHomeMatch?.id)?.effects.attendanceModifier,
      managedClub.hasIndoorArena,
      Boolean(managedHomeMatch?.isFinaldag || managedHomeMatch?.isAnnandagen || (managedHomeMatch?.matchday ?? 0) > 22),
    ),
    builtFacilityUpkeepCosts,
    matchAttendance: managedHomeMatch?.attendance,
    builtNodeIds: game.facilityState?.builtNodeIds,
    // ANSPRÅK 4, spak 3 / väg C (2026-08-31): ortsprogrammets färskhet
    // multipliceras in i publikandelen. Bara den hanterade klubben — AI-klubbar
    // nedan har en egen flat uppskattning och ingen staleness-klocka.
    freshnessFactor: getOrtFreshnessFactor(game, managedClub.reputation),
    streamingFreshnessMultiplier: getActivityStalenessMultiplier(
      getSeasonsActive(game.communityActivitiesSince, 'bandyplay', game.currentSeason),
      managedClub.reputation,
    ),
    municipalLoanAnnualCost: game.currentSeason < (game.municipalLoanUntilSeason ?? 0)
      ? (game.municipalLoanAnnualCost ?? 0)
      : 0,
    busContractRoundCost: game.currentSeason < (game.busContractUntilSeason ?? 0)
      ? (game.busContractRoundCost ?? 0)
      : 0,
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
  if (managedIncome.facilityUpkeep !== 0) {
    const builtCount = (game.facilityState?.builtNodeIds ?? []).length
    roundFinanceLog.push({ round: nextMatchday, amount: -managedIncome.facilityUpkeep, reason: 'facility_upkeep', label: `Anläggningsdrift (${builtCount} byggda noder)` })
  }
  if (managedIncome.municipalLoanCost !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: -managedIncome.municipalLoanCost, reason: 'event', label: 'Kommunlån' })
  }
  if (managedIncome.busContractCost !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: -managedIncome.busContractCost, reason: 'event', label: 'Bussavtal' })
  }
  if (managedIncome.weeklyWages !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: -managedIncome.weeklyWages, reason: 'wages', label: 'Löner' })
  }
  if (managedIncome.weeklyArenaCost !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: -managedIncome.weeklyArenaCost, reason: 'arena_maintenance', label: 'Arena-underhåll' })
  }
  if (managedIncome.weeklyLegendCost !== 0) {
    roundFinanceLog.push({ round: nextMatchday, amount: -managedIncome.weeklyLegendCost, reason: 'wages', label: 'Legendlöner' })
  }

  // P1 — Annandagen val C (gratisentré): nollsätt biljettintäkt och justera net
  let netForManagedClub = managedIncome.netPerRound
  let clearAnnandagsGratisentreVal = false
  if (game.pendingAnnandagsGratisentreVal && managedHomeMatch?.isAnnandagen && isHomeMatch) {
    netForManagedClub -= managedIncome.matchRevenue
    clearAnnandagsGratisentreVal = true
    if (managedIncome.matchRevenue !== 0) {
      // Replace matchRevenue entry in finance log with 0
      let idx = -1
      for (let i = roundFinanceLog.length - 1; i >= 0; i--) {
        if (roundFinanceLog[i].reason === 'match_revenue') { idx = i; break }
      }
      if (idx >= 0) roundFinanceLog.splice(idx, 1)
      roundFinanceLog.push({ round: nextMatchday, amount: 0, reason: 'match_revenue', label: 'Matchintäkt (gratisentré — annandagen)' })
    }
  }

  let updatedClubs = applyFinanceChange(game.clubs, game.managedClubId, netForManagedClub)

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
      if (clubId === game.managedClubId) {
        roundFinanceLog.push({ round: nextMatchday, amount, reason: 'cup_prize', label: 'Cupvinstpengar' })
      }
    }
  }

  // Social media reputation boost (+1 every 5th matchday) — TIDIGARE helt
  // frikopplat från placering (sidofynd B, DOM_ANSPAK4_ORTSUNDERHALL_2026-08-29.md):
  // club_malilla (mittenklubb, placering 5/8/6 tre säsonger i rad) nådde
  // rykte 100 på tre säsonger av bara denna tick, oavsett sportslig
  // prestation — ca +6 rykte/säsong ovanpå D028:s säsongsdelta (boardService.ts
  // SEASON_REPUTATION_DELTA, som toppar på +4/säsong och ÄGER det
  // prestationskopplade ryktedeltat).
  //
  // Gate på absolut tabellplacering (topp 3), inte på D028:s
  // förväntansband (computeSeasonVerdictRating) — det bandet är redan
  // generöst för MidTable (4-8 av 12 klubbar ger högsta betyg där), så att
  // återanvända det hade INTE stoppat club_malilla. Topp 3 matchar
  // tröskeln "dominant klubb" redan används i mätfamiljen
  // (ansprak4-ortsunderhall-matning-2026-08-30.ts: club_vastanfors,
  // verifierad topp-3 i 10/10 säsonger) — en genuint dominant klubb
  // fortsätter få tick:en nästan varje gång, en mittenklubb med ordinära
  // resultat får den nästan aldrig.
  //
  // `played > 0`-kravet undviker PÅSTÅENDEKARTAN-fällan (standingsService.ts):
  // vid noll spelade matcher är alla klubbar på 0 poäng och tie-breaken ger
  // en alfabetisk skuggplacering, inte en verklig.
  const TOP_TABLE_REPUTATION_THRESHOLD = 3
  if (game.communityActivities?.socialMedia && nextMatchday % 5 === 0) {
    const managedStanding = standings.find(s => s.clubId === game.managedClubId)
    const isNearTopOfTable = !!managedStanding
      && managedStanding.played > 0
      && managedStanding.position <= TOP_TABLE_REPUTATION_THRESHOLD
    if (isNearTopOfTable) {
      updatedClubs = updatedClubs.map(c =>
        c.id === game.managedClubId
          ? { ...c, reputation: Math.min(100, c.reputation + 1) }
          : c,
      )
    }
  }

  return { updatedClubs, roundFinanceLog, clearAnnandagsGratisentreVal }
}
