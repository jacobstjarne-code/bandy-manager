import type { SaveGame, InboxItem, AllTimeRecords } from '../../domain/entities/SaveGame'
import type { Player } from '../../domain/entities/Player'
import type { GameEvent } from '../../domain/entities/GameEvent'
import { FixtureStatus, InboxItemType, PlayerPosition } from '../../domain/enums'
import { PLAYER_FIRST_NAMES, PLAYER_LAST_NAMES } from '../../domain/data/playerNames'
import { calculateStandings } from '../../domain/services/standingsService'
import { generateYouthIntake } from '../../domain/services/youthIntakeService'
import { generateSchedule, buildSeasonCalendar } from '../../domain/services/scheduleGenerator'
import {
  generateCupFixtures,
} from '../../domain/services/cupService'
import {
  createYouthIntakeItem,
} from '../../domain/services/inboxService'
import { mulberry32 } from '../../domain/utils/random'
import { shouldRetire } from '../../domain/services/playerDevelopmentService'
import { generateRetirementData, generateFarewellQuote } from '../../domain/services/retirementService'
import { generateYouthTeam, carryOverYouthTeam } from '../../domain/services/academyService'
import { calculateKommunBidrag, generateNewPolitician } from '../../domain/services/politicianService'
import { generateSeasonVerdict, generatePreSeasonMessage } from '../../domain/services/boardService'
import { generateSeasonSummary } from '../../domain/services/seasonSummaryService'
import { updateLoyaltyScores } from '../../domain/services/characterPlayerService'
import { processAITransfers } from '../../domain/services/aiTransferService'
import { generateNominations, generateGalaEvent, generateGalaInbox } from '../../domain/services/bandyGalaService'
import { checkSeasonEndArc } from '../../domain/services/trainerArcService'
import { evaluateObjective, generateBoardObjectives } from '../../domain/services/boardObjectiveService'
import { updateSilentShout } from '../../domain/services/mecenatService'
import type { LicenseReview } from '../../domain/entities/SaveGame'
import type { AdvanceResult } from './advanceTypes'

export function handleSeasonEnd(game: SaveGame, seed?: number): AdvanceResult {
  // seasonSummary is generated AFTER all financial updates (prize money, patron, etc.)
  // so the financial change reflects the full season end income.
  // The variable is populated later in this function.
  let seasonSummary: ReturnType<typeof generateSeasonSummary>

  const allFixtures = game.fixtures
  const completedFixtures = allFixtures.filter(f => f.status === FixtureStatus.Completed && !f.isCup)
  const standings = calculateStandings(game.league.teamIds, completedFixtures)

  const newInboxItems: InboxItem[] = []

  // Board verdict at season end
  const managedClubStanding = standings.find(s => s.clubId === game.managedClubId)
  if (managedClubStanding) {
    const managedClub = game.clubs.find(c => c.id === game.managedClubId)
    if (managedClub) {
      const { title, body } = generateSeasonVerdict(
        managedClub.boardExpectation,
        managedClubStanding.position,
        game.clubs.length,
      )
      newInboxItems.push({
        id: `inbox_board_verdict_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.BoardFeedback,
        title,
        body,
        isRead: false,
      } as InboxItem)
    }
  }

  // ── License check (V0.9) ──────────────────────────────────────────────────
  const licenseRand = mulberry32((seed ?? game.currentSeason * 12345) + 777123)
  const managedClubForLicense = game.clubs.find(c => c.id === game.managedClubId)
  let licenseReview: LicenseReview | undefined = game.licenseReview
  let licenseWarningCount = game.licenseWarningCount ?? 0

  if (managedClubForLicense) {
    const licFinances = managedClubForLicense.finances
    const hasYouth = !!(game.youthTeam) || !!(game.communityActivities?.bandyplay)
    const prevDenied = game.licenseReview?.status === 'denied'

    let failCount = 0
    if (licFinances <= 0) failCount++
    if (!hasYouth) failCount++
    if (prevDenied) failCount++

    let licStatus: LicenseReview['status']
    if (licFinances < -200000 || licenseWarningCount >= 3) {
      licStatus = 'denied'
    } else if (failCount === 0) {
      licStatus = 'approved'
    } else if (failCount === 1) {
      licStatus = 'warning'
    } else {
      licStatus = 'continued_review'
    }

    if (licStatus === 'approved') {
      licenseWarningCount = 0
    } else if (licStatus === 'warning' || licStatus === 'continued_review') {
      licenseWarningCount++
    }

    licenseReview = {
      season: game.currentSeason,
      status: licStatus,
      requiredCapital: licFinances < 0 ? Math.abs(licFinances) : undefined,
      warningCount: licenseWarningCount,
    }

    if (licStatus === 'approved') {
      newInboxItems.push({
        id: `inbox_license_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.LicenseReview,
        title: 'Licensnämnden: Licens beviljad',
        body: `Licensnämnden har granskat ${managedClubForLicense.name} och beviljar licens för nästa säsong. Fortsätt det goda arbetet.`,
        isRead: false,
      } as InboxItem)
    } else if (licStatus === 'warning') {
      newInboxItems.push({
        id: `inbox_license_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.LicenseReview,
        title: 'Licensnämnden: Varning utfärdad',
        body: `Licensnämnden har identifierat brister hos ${managedClubForLicense.name}. En formell varning utfärdas. Handlingsplan krävs.`,
        isRead: false,
      } as InboxItem)
    } else if (licStatus === 'continued_review') {
      newInboxItems.push({
        id: `inbox_license_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.LicenseReview,
        title: 'Licensnämnden: Fortsatt granskning',
        body: `Licensnämnden ger ${managedClubForLicense.name} fortsatt villkorlig licens. Flera kriterier uppfylls inte. Omedelbara åtgärder krävs.`,
        isRead: false,
      } as InboxItem)
    } else if (licStatus === 'denied') {
      // Tvångsnedflyttning
      newInboxItems.push({
        id: `inbox_license_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.LicenseReview,
        title: 'LICENSNÄMNDEN: LICENS NEKAD — TVÅNGSNEDFLYTTNING',
        body: `Licensnämnden nekar ${managedClubForLicense.name} licens för elitbandyn. Klubben tvingas ta konsekvenserna. Tre spelare lämnar pga elitserieklausul. Majoriteten av sponsorerna drar sig ur. Styrelsen beslutar att tränaren stannar — men under hårt tryck.`,
        isRead: false,
      } as InboxItem)
    }

    // Inbox notification for handlingsplan (the actual GameEvent is created below in seasonEndPendingEvents)
    if (licStatus === 'warning' || licStatus === 'continued_review') {
      newInboxItems.push({
        id: `inbox_handlingsplan_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.LicenseReview,
        title: 'Licensnämnden kräver handlingsplan',
        body: 'Öppna händelserna för att svara på licensnämndens krav.',
        isRead: false,
      } as InboxItem)
    }
  }

  // Youth intake for all clubs
  const youthPlayers: Player[] = []
  const youthRecords = [...game.youthIntakeHistory]
  const updatedClubs = game.clubs.map(club => ({ ...club }))

  let youthIntakeResultForManagedClub: ReturnType<typeof generateYouthIntake> | null = null

  const baseSeed = seed ?? (game.currentSeason * 12345)

  for (let i = 0; i < updatedClubs.length; i++) {
    const club = updatedClubs[i]
    const existingPlayers = [...game.players, ...youthPlayers].filter(
      p => p.clubId === club.id,
    )
    const intakeResult = generateYouthIntake({
      club,
      existingPlayers,
      season: game.currentSeason,
      date: game.currentDate,
      seed: baseSeed + i,
    })

    youthPlayers.push(...intakeResult.newPlayers)
    updatedClubs[i] = {
      ...club,
      squadPlayerIds: [...club.squadPlayerIds, ...intakeResult.newPlayers.map(p => p.id)],
    }
    youthRecords.push(intakeResult.record)

    if (club.id === game.managedClubId) {
      youthIntakeResultForManagedClub = intakeResult
    }
  }

  // Prize money and transfer budget update for all clubs
  const PRIZE_MONEY = [200000, 150000, 120000, 100000, 80000,
    60000, 50000, 40000, 30000, 25000, 20000, 15000]

  for (let i = 0; i < updatedClubs.length; i++) {
    const clubStanding = standings.find(s => s.clubId === updatedClubs[i].id)
    const position = clubStanding?.position ?? 12
    const prize = PRIZE_MONEY[position - 1] ?? 10000
    updatedClubs[i] = {
      ...updatedClubs[i],
      finances: updatedClubs[i].finances + prize,
      transferBudget: Math.max(0, Math.round((updatedClubs[i].finances + prize) * 0.15)),
    }
  }

  // Patron contribution at season end
  if (game.patron?.isActive && (game.patron.contribution ?? 0) > 0) {
    const patronIdx = updatedClubs.findIndex(c => c.id === game.managedClubId)
    if (patronIdx !== -1) {
      updatedClubs[patronIdx] = {
        ...updatedClubs[patronIdx],
        finances: updatedClubs[patronIdx].finances + game.patron.contribution,
      }
      newInboxItems.push({
        id: `inbox_patron_contribution_${game.currentSeason + 1}`,
        date: game.currentDate,
        type: InboxItemType.BoardFeedback,
        title: `${game.patron.name} bidrar till klubben`,
        body: `${game.patron.name} skänker ${game.patron.contribution.toLocaleString('sv-SE')} kr till klubben som sitt årliga bidrag. Tack för ditt stöd!`,
        isRead: false,
      } as InboxItem)
    }
  }

  // KommunBidrag at season end — dynamic calculation (V0.9)
  if (game.localPolitician) {
    const politIdx = updatedClubs.findIndex(c => c.id === game.managedClubId)
    if (politIdx !== -1) {
      const polClub = updatedClubs[politIdx]
      const commStanding = game.communityStanding ?? 50
      const dynamicBidrag = calculateKommunBidrag(game.localPolitician, polClub, commStanding, game)
      // Update the stored kommunBidrag value for display
      // (we update the politician below in the updatedGame)
      updatedClubs[politIdx] = {
        ...updatedClubs[politIdx],
        finances: updatedClubs[politIdx].finances + dynamicBidrag,
      }
      newInboxItems.push({
        id: `inbox_kommunbidrag_${game.currentSeason + 1}`,
        date: game.currentDate,
        type: InboxItemType.KommunBidrag,
        title: `Kommunbidrag utbetalat`,
        body: `${game.localPolitician.name} meddelar att kommunens bidrag på ${dynamicBidrag.toLocaleString('sv-SE')} kr har betalats ut. Beräknat utifrån ert ungdomsengagemang (${(game.youthTeam?.players.length ?? 0)} ungdomar), kommunens välvilja och er lokala ställning (${commStanding}/100).`,
        isRead: false,
      } as InboxItem)
    }
  }

  // Budget priority effects at season end
  if (game.budgetPriority && game.budgetPriority !== 'balanced') {
    const bpIdx = updatedClubs.findIndex(c => c.id === game.managedClubId)
    if (bpIdx !== -1) {
      const c = updatedClubs[bpIdx]
      if (game.budgetPriority === 'squad') {
        updatedClubs[bpIdx] = {
          ...c,
          transferBudget: Math.round((c.transferBudget ?? 0) * 1.2),
          facilities: Math.max(0, (c.facilities ?? 50) - 1),
        }
      } else if (game.budgetPriority === 'youth') {
        updatedClubs[bpIdx] = {
          ...c,
          transferBudget: Math.round((c.transferBudget ?? 0) * 0.7),
          youthQuality: Math.min(100, (c.youthQuality ?? 50) + 3),
        }
      }
    }
  }

  // Youth intake inbox for managed club
  if (youthIntakeResultForManagedClub !== null) {
    const managedClub = updatedClubs.find(c => c.id === game.managedClubId)!
    newInboxItems.push(
      createYouthIntakeItem(
        youthIntakeResultForManagedClub,
        managedClub,
        game.currentDate,
        youthIntakeResultForManagedClub.scoutTexts,
      ),
    )
  }

  const nextSeason = game.currentSeason + 1

  // Board pre-season message for managed club
  const managedClubAfterPrize = updatedClubs.find(c => c.id === game.managedClubId)
  if (managedClubAfterPrize) {
    const clubStanding = standings.find(s => s.clubId === managedClubAfterPrize.id)
    const lastPos = clubStanding?.position ?? 12
    const finChange = managedClubAfterPrize.finances - (game.seasonStartFinances ?? managedClubAfterPrize.finances)

    const { title, body, newExpectation } = generatePreSeasonMessage(
      managedClubAfterPrize, standings, lastPos, finChange
    )

    // Update club expectation for next season
    const managedIdx = updatedClubs.findIndex(c => c.id === game.managedClubId)
    if (managedIdx !== -1) {
      updatedClubs[managedIdx] = { ...updatedClubs[managedIdx], boardExpectation: newExpectation }
    }

    newInboxItems.push({
      id: `inbox_board_preseason_${nextSeason}`,
      date: `${nextSeason}-09-15`,
      type: InboxItemType.BoardFeedback,
      title,
      body,
      isRead: false,
    } as InboxItem)
  }

  // Generate new schedule for next season
  const newScheduleFixtures = generateSchedule(updatedClubs.map(c => c.id), nextSeason)
  const nextSeasonCalendar = buildSeasonCalendar(nextSeason)
  const leagueFixtures = newScheduleFixtures.map(sf => ({
    id: `fixture_${nextSeason}_r${sf.roundNumber}_${sf.homeClubId}_vs_${sf.awayClubId}`,
    leagueId: `league_${nextSeason}`,
    season: nextSeason,
    roundNumber: sf.roundNumber,
    matchday: nextSeasonCalendar.find(s => s.type === 'league' && s.leagueRound === sf.roundNumber)?.matchday ?? sf.roundNumber,
    homeClubId: sf.homeClubId,
    awayClubId: sf.awayClubId,
    status: FixtureStatus.Scheduled,
    homeScore: 0,
    awayScore: 0,
    events: [],
    report: undefined,
    homeLineup: undefined,
    awayLineup: undefined,
  }))

  // Generate cup fixtures for next season
  const cupSeasonSeed = nextSeason * 7919 + 42
  const cupSeasonRand = mulberry32(cupSeasonSeed)
  const clubsSortedByRep = [...updatedClubs].sort((a, b) => (b.reputation ?? 50) - (a.reputation ?? 50))
  const { bracket: newCupBracket, fixtures: newCupFixtures } = generateCupFixtures(
    clubsSortedByRep.map(c => c.id),
    nextSeason,
    cupSeasonRand,
  )
  const newFixtures = [...leagueFixtures, ...newCupFixtures]

  const newLeague = {
    ...game.league,
    id: `league_${nextSeason}`,
    season: nextSeason,
    fixtureIds: leagueFixtures.map(f => f.id),
  }

  // Reset player season stats, recover fitness, age players
  const allPlayers = [...game.players, ...youthPlayers]
  const retirementRand = mulberry32(baseSeed + 99991)
  const retiredPlayerIds = new Set<string>()
  const retirementMessages: InboxItem[] = []

  const resetPlayers = allPlayers.map(player => ({
    ...player,
    age: player.age + 1,
    fitness: Math.min(100, player.fitness + 15),
    startSeasonCA: player.currentAbility,
    careerStats: {
      totalGames: (player.careerStats?.totalGames ?? 0) + (player.seasonStats?.gamesPlayed ?? 0),
      totalGoals: (player.careerStats?.totalGoals ?? 0) + (player.seasonStats?.goals ?? 0),
      totalAssists: (player.careerStats?.totalAssists ?? 0) + (player.seasonStats?.assists ?? 0),
      seasonsPlayed: (player.careerStats?.seasonsPlayed ?? 0) + 1,
    },
    caHistory: [
      ...(player.caHistory ?? []),
      { season: game.currentSeason, ca: player.currentAbility },
    ].slice(-10),
    seasonHistory: [
      ...(player.seasonHistory ?? []),
      {
        season: game.currentSeason,
        goals: player.seasonStats?.goals ?? 0,
        assists: player.seasonStats?.assists ?? 0,
        games: player.seasonStats?.gamesPlayed ?? 0,
        rating: Math.round((player.seasonStats?.averageRating ?? 0) * 10) / 10,
        clubId: player.clubId,
      },
    ].slice(-10),
    seasonStats: {
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      cornerGoals: 0,
      penaltyGoals: 0,
      yellowCards: 0,
      redCards: 0,
      suspensions: 0,
      averageRating: 0,
      minutesPlayed: 0,
    },
  }))

  // Retirement check — delegated to shouldRetire() in playerDevelopmentService
  const retiredManagedPlayers: ReturnType<typeof generateRetirementData>[] = []
  for (const player of resetPlayers) {
    const retires = shouldRetire(player, retirementRand)
    if (retires) {
      retiredPlayerIds.add(player.id)
      if (player.clubId === game.managedClubId) {
        const retData = generateRetirementData(player, game.managedClubId)
        retiredManagedPlayers.push(retData)
        retirementMessages.push({
          id: `inbox_retirement_${player.id}_${nextSeason}`,
          date: game.currentDate,
          type: InboxItemType.Retirement,
          title: `${player.firstName} ${player.lastName} avslutar karriären`,
          body: `${player.firstName} ${player.lastName} (${player.age} år) lägger skridskorna på hyllan. ${retData.totalGames > 0 ? `${retData.totalGames} matcher, ${retData.totalGoals} mål. ` : ''}${generateFarewellQuote(player)}`,
          isRead: false,
        } as InboxItem)
      }
    }
  }

  // ── WEAK-007: Nemesis pensioneras — rensa tracker, skicka inbox ───────────
  let updatedNemesisTracker = { ...(game.nemesisTracker ?? {}) }
  for (const pid of retiredPlayerIds) {
    const retiringPlayer = resetPlayers.find(p => p.id === pid)
    if (!retiringPlayer) continue
    for (const [key, nemesis] of Object.entries(updatedNemesisTracker)) {
      if (nemesis.playerId === retiringPlayer.id) {
        retirementMessages.push({
          id: `inbox_nemesis_retired_${retiringPlayer.id}_${nextSeason}`,
          date: game.currentDate,
          type: InboxItemType.BoardFeedback,
          title: 'Nemesis lägger av',
          body: `${retiringPlayer.firstName} ${retiringPlayer.lastName} avslutar karriären. Han gjorde ${nemesis.goalsAgainstUs} mål mot oss. En epok är över.`,
          isRead: false,
        } as InboxItem)
        delete updatedNemesisTracker[key]
      }
    }
  }

  // ── Legacy — retiring managed club players become legends if 3+ seasons ──
  const retirementCeremonyEvents: GameEvent[] = []
  const newLegends = [...(game.clubLegends ?? [])]
  for (const pid of retiredPlayerIds) {
    const player = resetPlayers.find(p => p.id === pid)
    if (!player || player.clubId !== game.managedClubId) continue
    const seasonsInClub = (player.careerStats?.seasonsPlayed ?? 1)
    if (seasonsInClub >= 3) {
      const storyline = (game.storylines ?? []).find(s => s.playerId === pid && s.resolved)
      newLegends.push({
        name: `${player.firstName[0]}. ${player.lastName}`,
        position: player.position,
        seasons: seasonsInClub,
        totalGoals: player.careerStats?.totalGoals ?? 0,
        totalAssists: player.careerStats?.totalAssists ?? 0,
        titles: [],
        memorableStory: storyline?.displayText,
        retiredSeason: nextSeason,
      })
      // Special inbox for legend
      retirementMessages.push({
        id: `inbox_legend_${player.id}_${nextSeason}`,
        date: game.currentDate,
        type: InboxItemType.BoardFeedback,
        title: `🎖️ ${player.firstName} ${player.lastName} — en legend tackar för sig`,
        body: `${seasonsInClub} säsonger, ${player.careerStats?.totalGoals ?? 0} mål. ${storyline ? `"${storyline.displayText}"` : 'En spelare som betydde mycket.'} Fansen: "Tack för allt!"`,
        isRead: false,
      } as InboxItem)

      // Retirement ceremony event with choices
      const playerName = `${player.firstName} ${player.lastName}`
      retirementCeremonyEvents.push({
        id: `retirement_ceremony_${player.id}_${nextSeason}`,
        type: 'retirementCeremony',
        title: `🎖️ Pensionsceremoni — ${playerName}`,
        body: `${playerName} lägger bandyn på hyllan efter ${seasonsInClub} säsonger. Vill du erbjuda en roll i föreningen?`,
        relatedPlayerId: player.id,
        resolved: false,
        sender: { name: playerName, role: 'Avgående spelare' },
        choices: [
          {
            id: 'youth_coach',
            label: 'Erbjud roll som ungdomstränare',
            subtitle: '⭐ +5 reputation',
            effect: { type: 'reputation', amount: 5 },
          },
          {
            id: 'scout',
            label: 'Erbjud roll som scout',
            subtitle: '🔍 +3 scoutbudget',
            effect: { type: 'noOp' },
          },
          {
            id: 'farewell',
            label: 'Tack och lycka till',
            effect: { type: 'noOp' },
          },
        ],
      } as GameEvent)
    }
  }

  // ── Contract expiry — players whose contracts have run out ───────────────
  const handledContractIds = new Set(game.handledContractPlayerIds ?? [])
  const contractExpiredIds = new Set<string>()
  const contractExpiryInbox: InboxItem[] = []

  for (const player of resetPlayers) {
    if (retiredPlayerIds.has(player.id)) continue          // already retiring
    if (handledContractIds.has(player.id)) continue        // renewed during season
    if (player.contractUntilSeason > game.currentSeason) continue  // still valid

    contractExpiredIds.add(player.id)

    if (player.clubId === game.managedClubId) {
      contractExpiryInbox.push({
        id: `inbox_contract_expired_${player.id}_${nextSeason}`,
        date: game.currentDate,
        type: InboxItemType.ContractExpiring,
        title: `${player.firstName} ${player.lastName} lämnar klubben`,
        body: `${player.firstName} ${player.lastName}s kontrakt har löpt ut. Han lämnar som fri agent.`,
        isRead: false,
      } as InboxItem)
    }
  }

  const activePlayers = resetPlayers
    .filter(p => !retiredPlayerIds.has(p.id))
    .map(p => contractExpiredIds.has(p.id) ? { ...p, clubId: 'free_agent' } : p)

  // ── Board patience update ─────────────────────────────────────────────
  const totalTeams = game.clubs.length
  const finalPos = managedClubStanding?.position ?? totalTeams
  const currentPatience = game.boardPatience ?? 70
  const currentFailures = game.consecutiveFailures ?? 0

  let newBoardPatience = currentPatience
  let newConsecutiveFailures = currentFailures
  let managerFired = false

  const topThird = Math.ceil(totalTeams / 3)
  const bottomThird = totalTeams - Math.floor(totalTeams / 3) + 1

  if (finalPos <= 2) {
    // Promotion zone
    newBoardPatience = Math.min(100, currentPatience + 20)
    newConsecutiveFailures = 0
  } else if (finalPos <= topThird) {
    // Top 3 (but not top 2)
    newBoardPatience = Math.min(100, currentPatience + 15)
    newConsecutiveFailures = 0
  } else if (finalPos >= bottomThird) {
    // Bottom 3
    newBoardPatience = Math.max(0, currentPatience - 20)
    newConsecutiveFailures = currentFailures + 1
  } else {
    // Mid-table (pos 4-7 approximately)
    newConsecutiveFailures = 0
  }

  // NOTE: Firing check moved AFTER board objectives evaluation (line ~699)
  // so objective success/failure affects the decision

  // Remove retired and contract-expired players from all club squads
  const clubsWithRetirements = updatedClubs.map(club => ({
    ...club,
    squadPlayerIds: club.squadPlayerIds.filter(
      id => !retiredPlayerIds.has(id) && !contractExpiredIds.has(id)
    ),
  }))

  // ── Tvångsnedflyttning effects (license denied) ───────────────────────────
  let clubsAfterLicense = clubsWithRetirements
  let playersAfterLicense = updateLoyaltyScores(activePlayers)
  let sponsorsAfterLicense = game.sponsors ?? []

  if (licenseReview?.status === 'denied' && managedClubForLicense) {
    // Remove 3 random managed players
    const managedSquadIds = clubsAfterLicense.find(c => c.id === game.managedClubId)?.squadPlayerIds ?? []
    const shuffledIds = [...managedSquadIds].sort(() => licenseRand() - 0.5)
    const removedIds = new Set(shuffledIds.slice(0, Math.min(3, shuffledIds.length)))
    playersAfterLicense = playersAfterLicense.map(p =>
      removedIds.has(p.id) && p.clubId === game.managedClubId
        ? { ...p, clubId: 'free_agent' }
        : p
    )
    clubsAfterLicense = clubsAfterLicense.map(c =>
      c.id === game.managedClubId
        ? {
            ...c,
            reputation: Math.max(0, (c.reputation ?? 50) - 15),
            squadPlayerIds: c.squadPlayerIds.filter(id => !removedIds.has(id)),
          }
        : c
    )
    // Remove 60% of sponsors
    const keepCount = Math.ceil(sponsorsAfterLicense.length * 0.4)
    sponsorsAfterLicense = sponsorsAfterLicense.slice(0, keepCount)

  }

  // ── Kommunval — every 4th season, 50% chance of new politician ───────────
  let nextPolitician = game.localPolitician
  const kommunvalRand = mulberry32(baseSeed + 444777)
  if (nextSeason % 4 === 0 && kommunvalRand() < 0.5) {
    const newPol = generateNewPolitician(baseSeed + nextSeason * 31, nextSeason)
    nextPolitician = newPol
    newInboxItems.push({
      id: `inbox_kommunval_${nextSeason}`,
      date: game.currentDate,
      type: InboxItemType.KommunBidrag,
      title: `Kommunval: ${newPol.name} ny kommunalråd`,
      body: `${newPol.name} (${newPol.party}) är kommunens nya kommunalråd med agenda "${newPol.agenda}". Kommunbidraget beräknas om baserat på deras prioriteringar. Relation startar på 40/100.`,
      isRead: false,
    } as InboxItem)
  }

  // ── Patron contribution + influence escalation ─────────────────────────────
  let updatedPatron = game.patron
  if (updatedPatron?.isActive) {
    const newInfluence = Math.min(100, (updatedPatron.influence ?? 30) + 5)
    const newTotalContributed = (updatedPatron.totalContributed ?? 0) + updatedPatron.contribution

    if (newInfluence >= 80 && (updatedPatron.influence ?? 30) < 80) {
      newInboxItems.push({
        id: `inbox_patron_demands_${nextSeason}`,
        date: game.currentDate,
        type: InboxItemType.PatronInfluence,
        title: `${updatedPatron.name} kräver inflytande`,
        body: `${updatedPatron.name} har bidragit med totalt ${newTotalContributed.toLocaleString('sv-SE')} kr och känner att han förtjänar mer att säga till om i klubbens beslut.`,
        isRead: false,
      } as InboxItem)
    }

    updatedPatron = {
      ...updatedPatron,
      influence: newInfluence,
      totalContributed: newTotalContributed,
    }
  }

  // ── Media effects (journalist relationship) ────────────────────────────────
  let newJournalistRelationship = game.journalistRelationship ?? 50
  let newCommunityStanding = game.communityStanding ?? 50

  // Grävande artikel trigger: journalist unhappy + bad finances or license warning
  const managedClubFin = clubsWithRetirements.find(c => c.id === game.managedClubId)?.finances ?? 0
  const gravId = `gravande_artikel_${game.currentSeason}`
  const resolvedSet = new Set(game.resolvedEventIds ?? [])
  if (
    newJournalistRelationship < 30 &&
    (managedClubFin < -50000 || licenseReview?.status === 'warning' || licenseReview?.status === 'continued_review') &&
    !resolvedSet.has(gravId)
  ) {
    newCommunityStanding = Math.max(0, newCommunityStanding - 5)
    newJournalistRelationship = Math.max(0, newJournalistRelationship - 5)
    newInboxItems.push({
      id: `inbox_gravande_${game.currentSeason}`,
      date: game.currentDate,
      type: InboxItemType.MediaEvent,
      title: 'Lokaltidningen granskar ekonomin',
      body: `${game.localPaperName ?? 'Lokaltidningen'} publicerar en kritisk granskning av ${managedClubForLicense?.name ?? 'klubbens'} ekonomi. Kommunen och sponsorer reagerar negativt.`,
      isRead: false,
    } as InboxItem)
    // Reduce sponsor network mood and politician relationship
    if (nextPolitician) {
      nextPolitician = { ...nextPolitician, relationship: Math.max(0, nextPolitician.relationship - 10) }
    }
  }

  // Räddande artikel trigger: journalist happy + youth team good record
  const raddId = `raddande_artikel_${game.currentSeason}`
  const youthWins = game.youthTeam?.seasonRecord?.w ?? 0
  if (
    newJournalistRelationship > 70 &&
    game.youthTeam &&
    youthWins > 5 &&
    !resolvedSet.has(raddId)
  ) {
    newCommunityStanding = Math.min(100, newCommunityStanding + 5)
    newInboxItems.push({
      id: `inbox_raddande_${game.currentSeason}`,
      date: game.currentDate,
      type: InboxItemType.MediaEvent,
      title: 'Lokaltidningen skriver helsida om akademin',
      body: `${game.localPaperName ?? 'Lokaltidningen'} hyllar ${managedClubForLicense?.name ?? 'klubbens'} ungdomsverksamhet med en helsida. Kommunen och sponsorer reagerar positivt.`,
      isRead: false,
    } as InboxItem)
    if (nextPolitician) {
      nextPolitician = { ...nextPolitician, relationship: Math.min(100, nextPolitician.relationship + 5) }
    }
  }

  // ── Build handlingsplan pending event if needed ───────────────────────────
  const seasonEndPendingEvents: GameEvent[] = [...retirementCeremonyEvents]
  if (licenseReview?.status === 'warning' || licenseReview?.status === 'continued_review') {
    const handlingsplanEvent: GameEvent = {
      id: `licenseHandlingsplan_${game.currentSeason}`,
      type: 'licenseHandlingsplan',
      title: 'Licensnämndens krav: Handlingsplan',
      body: `Licensnämnden kräver en handlingsplan för att säkra ${managedClubForLicense?.name ?? 'klubbens'} framtida licens. Välj er strategi noggrant.`,
      choices: [
        {
          id: 'sparplan',
          label: 'Sparplan — dra ner på löner och kostnader',
          effect: { type: 'multiEffect', subEffects: JSON.stringify([
            { type: 'income', amount: Math.round((licenseReview.requiredCapital ?? 50000) * 0.8) },
          ]) },
        },
        {
          id: 'membership',
          label: 'Medlemsdrivning — engagera lokala krafter',
          effect: { type: 'communityStanding', amount: 8 },
        },
        {
          id: 'sponsors',
          label: 'Fler sponsorer — lova synlighet och PR',
          effect: { type: 'reputation', amount: 3 },
        },
        ...(updatedPatron?.isActive ? [{
          id: 'patron',
          label: `Patronen — be ${updatedPatron.name} om hjälp`,
          effect: { type: 'patronHappiness' as const, amount: 15 },
        }] : []),
      ],
      resolved: false,
    }
    seasonEndPendingEvents.push(handlingsplanEvent)
  }

  // ── Board objectives — evaluate + generate new ────────────────────────────
  const objectiveResults: Array<{ season: number; objectiveId: string; result: 'met' | 'failed'; ownerReaction: string }> = []
  for (const obj of game.boardObjectives ?? []) {
    const result = evaluateObjective(obj, game)
    const finalStatus = result.status === 'met' ? 'met' as const : 'failed' as const
    objectiveResults.push({
      season: game.currentSeason,
      objectiveId: obj.id,
      result: finalStatus,
      ownerReaction: finalStatus === 'met' ? obj.successReward : obj.failureConsequence,
    })
    newInboxItems.push({
      id: `inbox_boardobj_end_${obj.id}_${game.currentSeason}`,
      date: game.currentDate,
      type: InboxItemType.BoardFeedback,
      title: finalStatus === 'met' ? `✅ ${obj.label} — uppfyllt` : `❌ ${obj.label} — misslyckat`,
      body: finalStatus === 'met' ? obj.successReward : obj.failureConsequence,
      isRead: false,
    } as InboxItem)
  }

  // Board objectives affect patience: each failure costs -5, each success gives +3
  const objFailures = objectiveResults.filter(r => r.result === 'failed').length
  const objSuccesses = objectiveResults.filter(r => r.result === 'met').length
  newBoardPatience = Math.max(0, Math.min(100, newBoardPatience - objFailures * 5 + objSuccesses * 3))

  // Firing check — AFTER objectives so success/failure affects the decision
  if (newBoardPatience <= 15 || newConsecutiveFailures >= 3) {
    managerFired = true
  }

  const objRand = mulberry32((seed ?? 42) + game.currentSeason * 777)
  const managedClubForObj = updatedClubs.find(c => c.id === game.managedClubId)
  const newSeasonObjectives = managedClubForObj && game.boardPersonalities
    ? generateBoardObjectives(managedClubForObj, game, game.boardPersonalities, objRand)
    : []

  // ── Bandygalan ────────────────────────────────────────────────────────────
  const galaNominations = generateNominations(game)
  if (galaNominations.length > 0) {
    seasonEndPendingEvents.push(generateGalaEvent(game, galaNominations))
    const { inboxItems: galaInbox, storylines: galaStorylines } = generateGalaInbox(galaNominations, game)
    newInboxItems.push(...galaInbox)
    galaStorylines.forEach(s => (game.storylines ?? []).push(s))
  }

  // ── Funktionärsdöd (2%/säsong vid age >= 65) ──────────────────────────────
  const deathRand = mulberry32((seed ?? 42) + game.currentSeason * 31337)
  let updatedNamedCharacters = (game.namedCharacters ?? []).map(c => ({ ...c }))
  let communityStandingDelta = 0
  for (const char of updatedNamedCharacters) {
    if (char.isAlive === false) continue
    if (!char.id.startsWith('func_')) continue
    const age = char.age ?? 55
    const deathChance = age >= 65 ? 0.02 : 0
    if (deathChance > 0 && deathRand() < deathChance) {
      char.isAlive = false
      char.age = age + 1
      communityStandingDelta += 3
      const mourner = updatedNamedCharacters.find(c => c.isAlive !== false && c.id !== char.id && c.id.startsWith('func_'))
      newInboxItems.push({
        id: `inbox_functionary_death_${char.id}_${game.currentSeason}`,
        date: `${nextSeason}-10-01`,
        type: InboxItemType.Community,
        title: `${char.name} har gått bort`,
        body: `${char.name}, ${char.role?.toLowerCase() ?? 'funktionär'} sedan många år, avled under sommaren. Föreningen sörjer.${mourner ? ` "${mourner.name}: Vi saknar ${char.name}."` : ''}`,
        isRead: false,
      } as InboxItem)
    } else {
      char.age = age + 1
    }
  }

  // ── AI transfers between seasons ─────────────────────────────────────────
  const aiTransferResult = processAITransfers(
    playersAfterLicense,
    clubsAfterLicense,
    nextSeason,
    game.managedClubId,
    baseSeed + 55555,
  )
  playersAfterLicense = aiTransferResult.updatedPlayers
  clubsAfterLicense = aiTransferResult.updatedClubs

  // ── AI squad replenishment: ensure every AI club has ≥ 18 players ─────────
  const replenishRand = mulberry32(baseSeed + 77777)
  const replenishPositions = [
    PlayerPosition.Goalkeeper,
    PlayerPosition.Defender, PlayerPosition.Defender, PlayerPosition.Defender,
    PlayerPosition.Midfielder, PlayerPosition.Midfielder,
    PlayerPosition.Forward, PlayerPosition.Forward,
  ]
  const emptySeasonStats = { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 }
  const emptyCareerStats = { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 }

  const replenishedPlayers: Player[] = []
  const replenishedClubs = clubsAfterLicense.map(club => {
    if (club.id === game.managedClubId) return club
    const squadSize = club.squadPlayerIds.length
    if (squadSize >= 20) return club

    const needed = 20 - squadSize
    const newIds: string[] = []
    for (let i = 0; i < needed; i++) {
      const posIndex = i % replenishPositions.length
      const pos = replenishPositions[posIndex]
      const caBase = Math.round(club.reputation * 0.45 + 15)
      const ca = Math.max(20, Math.min(70, caBase + Math.floor(replenishRand() * 16) - 8))
      const age = 20 + Math.floor(replenishRand() * 12)
      const attrs = { skating: ca - 5, acceleration: ca - 5, stamina: ca - 3, ballControl: ca - 5, passing: ca - 5, shooting: ca - 5, dribbling: ca - 5, vision: ca - 5, decisions: ca - 5, workRate: ca, positioning: ca - 5, defending: ca - 5, cornerSkill: ca - 10, goalkeeping: pos === PlayerPosition.Goalkeeper ? ca : 10, cornerRecovery: ca - 5 }
      const id = `replenish_${club.id}_s${nextSeason}_${squadSize + i}`
      const player: Player = {
        id,
        firstName: PLAYER_FIRST_NAMES[Math.floor(replenishRand() * PLAYER_FIRST_NAMES.length)],
        lastName: PLAYER_LAST_NAMES[Math.floor(replenishRand() * PLAYER_LAST_NAMES.length)],
        age,
        nationality: 'svenska',
        clubId: club.id,
        isHomegrown: age <= 23,
        position: pos,
        archetype: 'TwoWaySkater' as Player['archetype'],
        salary: Math.round(ca * 120 + 2000),
        contractUntilSeason: nextSeason + 2 + Math.floor(replenishRand() * 2),
        marketValue: ca * 1500,
        morale: 60, form: 55, fitness: 70, sharpness: 50,
        isFullTimePro: ca >= 50,
        currentAbility: ca,
        potentialAbility: Math.min(90, ca + 5 + Math.floor(replenishRand() * 15)),
        developmentRate: age <= 22 ? 60 : 35,
        injuryProneness: 25, discipline: 65,
        attributes: attrs,
        isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
        seasonStats: emptySeasonStats, careerStats: emptyCareerStats,
      }
      replenishedPlayers.push(player)
      newIds.push(id)
    }
    return { ...club, squadPlayerIds: [...club.squadPlayerIds, ...newIds] }
  })

  if (replenishedPlayers.length > 0) {
    playersAfterLicense = [...playersAfterLicense, ...replenishedPlayers]
    clubsAfterLicense = replenishedClubs
  }

  const notableTransfers = aiTransferResult.transfers.filter(t => t.fee > 50000).slice(0, 3)
  if (notableTransfers.length > 0) {
    const transferText = notableTransfers
      .map(t => `${t.playerName}: ${t.fromClubName} → ${t.toClubName}${t.fee > 0 ? ` (${Math.round(t.fee / 1000)} tkr)` : ' (fri agent)'}`)
      .join('\n')
    newInboxItems.push({
      id: `inbox_ai_transfers_${nextSeason}`,
      date: game.currentDate,
      type: InboxItemType.Transfer,
      title: `Övergångar inför säsong ${nextSeason}`,
      body: `Några anmärkningsvärda övergångar:\n${transferText}`,
      isRead: false,
    } as InboxItem)
  }

  // Generate season summary with the final communityStanding (after all season-end adjustments)
  seasonSummary = {
    ...generateSeasonSummary(
      { ...game, clubs: updatedClubs },
      Math.min(100, newCommunityStanding + communityStandingDelta),
    ),
    retiredPlayers: retiredManagedPlayers.length > 0 ? retiredManagedPlayers : undefined,
  }

  const updatedGame: SaveGame = {
    ...game,
    currentSeason: nextSeason,
    currentDate: `${nextSeason}-10-01`,
    clubs: clubsAfterLicense,
    players: playersAfterLicense,
    fixtures: newFixtures,
    league: newLeague,
    standings: calculateStandings(updatedClubs.map(c => c.id), []),
    inbox: [...game.inbox, ...newInboxItems, ...retirementMessages, ...contractExpiryInbox].slice(-75),
    transferState: {
      ...game.transferState,
      freeAgents: [
        ...(game.transferState?.freeAgents ?? []),
        ...playersAfterLicense.filter(p => contractExpiredIds.has(p.id)),
      ],
    },
    youthIntakeHistory: youthRecords,
    managedClubPendingLineup: undefined,
    matchWeathers: [],
    trainingHistory: [],
    playoffBracket: null,
    cupBracket: newCupBracket,
    seasonSummaries: [...(game.seasonSummaries ?? []), seasonSummary].slice(-5),
    showSeasonSummary: true,
    showBoardMeeting: managerFired ? false : undefined,
    showPreSeason: managerFired ? false : true,
    seasonStartSnapshot: managerFired ? game.seasonStartSnapshot : (() => {
      const managedClub = game.clubs.find(c => c.id === game.managedClubId)
      const standing = game.standings.find(s => s.clubId === game.managedClubId)
      const academyPromoCount = (game.youthIntakeHistory ?? []).filter(r =>
        r.season === game.currentSeason && r.clubId === game.managedClubId
      ).reduce((sum, r) => sum + r.playerIds.length, 0)
      return {
        season: game.currentSeason,
        finalPosition: standing?.position ?? 12,
        finances: managedClub?.finances ?? 0,
        communityStanding: game.communityStanding ?? 50,
        squadSize: game.players.filter(p => p.clubId === game.managedClubId).length,
        supporterMembers: game.supporterGroup?.members ?? 0,
        academyPromotions: academyPromoCount,
      }
    })(),
    managerFired: managerFired ? true : undefined,
    fanMood: licenseReview?.status === 'denied'
      ? Math.max(0, (game.fanMood ?? 50) - 15)
      : game.fanMood,
    seasonStartFinances: updatedClubs.find(c => c.id === game.managedClubId)?.finances,
    scoutReports: Object.fromEntries(
      Object.entries(game.scoutReports ?? {})
        .filter(([, r]) => nextSeason - r.scoutedSeason < 2)
    ),
    activeScoutAssignment: null,
    scoutBudget: 10,
    transferBids: [],
    pendingEvents: seasonEndPendingEvents,
    handledContractPlayerIds: [],
    sponsors: sponsorsAfterLicense,
    opponentAnalyses: {},
    activeTalentSearch: null,
    talentSearchResults: game.talentSearchResults ?? [],
    boardPatience: newBoardPatience,
    consecutiveFailures: newConsecutiveFailures,
    rivalryHistory: game.rivalryHistory ?? {},
    clubLegends: newLegends,
    mecenater: (game.mecenater ?? []).map(m => m.isActive ? updateSilentShout(m) : m),
    facilityProjects: game.facilityProjects ?? [],
    storylines: game.storylines ?? [],
    boardObjectives: newSeasonObjectives,
    boardObjectiveHistory: [
      ...(game.boardObjectiveHistory ?? []),
      ...objectiveResults,
    ],
    trainerArc: checkSeasonEndArc(
      game.trainerArc ?? { current: 'newcomer', history: [], seasonCount: 0, bestFinish: 12, titlesWon: 0, consecutiveLosses: 0, consecutiveWins: 0, boardWarningGiven: false },
      game.playoffBracket?.champion === game.managedClubId,
      game.currentSeason
    ),
    trainingProjects: [],
    communityActivities: game.communityActivities
      ? { ...game.communityActivities, julmarknad: false }
      : game.communityActivities,
    youthTeam: (() => {
      const managedClub = updatedClubs.find(c => c.id === game.managedClubId) ?? game.clubs.find(c => c.id === game.managedClubId)!
      const nextAcademyLevel = (() => {
        if (game.academyUpgradeInProgress && game.academyUpgradeSeason === nextSeason) {
          return game.academyLevel === 'basic' ? 'developing' : 'elite'
        }
        return game.academyLevel ?? 'basic'
      })()
      // Carry over existing youth players (age them up, retain under-20s) rather than generating fresh
      if (game.youthTeam && game.youthTeam.players.length > 0) {
        return carryOverYouthTeam(game.youthTeam, managedClub, nextAcademyLevel, nextSeason, baseSeed + 77777)
      }
      return generateYouthTeam(managedClub, nextAcademyLevel, nextSeason, baseSeed + 77777)
    })(),
    academyLevel: (() => {
      // If upgrade was scheduled for this season, apply it
      if (game.academyUpgradeInProgress && game.academyUpgradeSeason === nextSeason) {
        return game.academyLevel === 'basic' ? 'developing' : 'elite'
      }
      return game.academyLevel ?? 'basic'
    })(),
    academyUpgradeInProgress: game.academyUpgradeSeason === nextSeason ? false : game.academyUpgradeInProgress,
    academyUpgradeSeason: game.academyUpgradeSeason === nextSeason ? undefined : game.academyUpgradeSeason,
    mentorships: [],
    loanDeals: [],
    // V0.9 fields
    licenseReview,
    licenseWarningCount,
    namedCharacters: updatedNamedCharacters,
    communityStanding: Math.min(100, newCommunityStanding + communityStandingDelta),
    journalistRelationship: newJournalistRelationship,
    sponsorNetworkMood: game.sponsorNetworkMood ?? 70,
    patron: updatedPatron,
    localPolitician: nextPolitician
      ? {
          ...nextPolitician,
          kommunBidrag: nextPolitician
            ? calculateKommunBidrag(
                nextPolitician,
                clubsAfterLicense.find(c => c.id === game.managedClubId) ?? managedClubForLicense!,
                newCommunityStanding,
                { ...game, communityStanding: newCommunityStanding }
              )
            : (game.localPolitician?.kommunBidrag ?? 0),
        }
      : game.localPolitician,
    politicianLastInteraction: {},
    nemesisTracker: updatedNemesisTracker,
    resolvedEventIds: [
      ...(game.resolvedEventIds ?? []),
      ...(licenseReview?.status !== 'denied' ? [] : []),
      gravId,
      raddId,
    ].slice(-200),
  }

  return { game: { ...updatedGame, allTimeRecords: updateAllTimeRecords(updatedGame, seasonSummary) }, roundPlayed: null, seasonEnded: true }
}

function updateAllTimeRecords(
  game: SaveGame,
  summary: ReturnType<typeof generateSeasonSummary>,
): AllTimeRecords {
  const prev = game.allTimeRecords ?? {
    mostGoalsSeason: null,
    mostAssistsSeason: null,
    highestRatingSeason: null,
    bestFinish: null,
    biggestWin: null,
    championSeasons: [],
    cupWinSeasons: [],
  }

  const season = summary.season

  let mostGoalsSeason = prev.mostGoalsSeason
  if (summary.topScorer && (!mostGoalsSeason || summary.topScorer.goals > mostGoalsSeason.goals)) {
    mostGoalsSeason = { playerName: summary.topScorer.name, goals: summary.topScorer.goals, season }
  }

  let mostAssistsSeason = prev.mostAssistsSeason
  if (summary.topAssister && (!mostAssistsSeason || summary.topAssister.assists > mostAssistsSeason.assists)) {
    mostAssistsSeason = { playerName: summary.topAssister.name, assists: summary.topAssister.assists, season }
  }

  let highestRatingSeason = prev.highestRatingSeason
  if (summary.topRated && (!highestRatingSeason || summary.topRated.avgRating > highestRatingSeason.rating)) {
    highestRatingSeason = { playerName: summary.topRated.name, rating: summary.topRated.avgRating, season }
  }

  let bestFinish = prev.bestFinish
  if (!bestFinish || summary.finalPosition < bestFinish.position) {
    bestFinish = { position: summary.finalPosition, season }
  }

  let biggestWin = prev.biggestWin
  if (summary.biggestWin) {
    const [homeGoals, awayGoals] = summary.biggestWin.score.split('–').map(Number)
    const margin = Math.abs((homeGoals ?? 0) - (awayGoals ?? 0))
    const prevMargin = biggestWin
      ? Math.abs((Number(biggestWin.score.split('–')[0]) || 0) - (Number(biggestWin.score.split('–')[1]) || 0))
      : -1
    if (margin > prevMargin) {
      biggestWin = { score: summary.biggestWin.score, opponent: summary.biggestWin.opponent, season, round: summary.biggestWin.round }
    }
  }

  const championSeasons = summary.playoffResult === 'champion'
    ? [...prev.championSeasons, season]
    : prev.championSeasons

  const cupWinSeasons = summary.cupResult === 'winner'
    ? [...(prev.cupWinSeasons ?? []), season]
    : (prev.cupWinSeasons ?? [])

  return { mostGoalsSeason, mostAssistsSeason, highestRatingSeason, bestFinish, biggestWin, championSeasons, cupWinSeasons }
}
