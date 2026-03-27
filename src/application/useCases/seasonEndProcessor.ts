import type { SaveGame, InboxItem } from '../../domain/entities/SaveGame'
import type { Player } from '../../domain/entities/Player'
import type { GameEvent } from '../../domain/entities/GameEvent'
import { FixtureStatus, InboxItemType } from '../../domain/enums'
import { calculateStandings } from '../../domain/services/standingsService'
import { generateYouthIntake } from '../../domain/services/youthIntakeService'
import { generateSchedule } from '../../domain/services/scheduleGenerator'
import {
  generateCupFixtures,
} from '../../domain/services/cupService'
import {
  createYouthIntakeItem,
} from '../../domain/services/inboxService'
import { mulberry32 } from '../../domain/utils/random'
import { generateYouthTeam } from '../../domain/services/academyService'
import { calculateKommunBidrag, generateNewPolitician } from '../../domain/services/politicianService'
import { generateSeasonVerdict, generatePreSeasonMessage } from '../../domain/services/boardService'
import { generateSeasonSummary } from '../../domain/services/seasonSummaryService'
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

  // Generate season summary now that all financial updates (prize money, patron, etc.) are done
  seasonSummary = generateSeasonSummary({ ...game, clubs: updatedClubs })

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
  const leagueFixtures = newScheduleFixtures.map(sf => ({
    id: `fixture_${nextSeason}_r${sf.roundNumber}_${sf.homeClubId}_vs_${sf.awayClubId}`,
    leagueId: `league_${nextSeason}`,
    season: nextSeason,
    roundNumber: sf.roundNumber,
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
  const { bracket: newCupBracket, fixtures: newCupFixtures } = generateCupFixtures(
    updatedClubs.map(c => c.id),
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
      ...player.careerStats,
      seasonsPlayed: (player.careerStats?.seasonsPlayed ?? 0) + 1,
    },
    caHistory: [
      ...(player.caHistory ?? []),
      { season: game.currentSeason, ca: player.currentAbility },
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

  // Retirement check: age 34+ CA<40: 50%, age 37+: 70%, age 39+: always
  for (const player of resetPlayers) {
    const mustRetire = player.age >= 39
    const r = retirementRand()
    const retires = mustRetire
      || (player.age >= 37 && r < 0.7)
      || (player.age >= 34 && player.currentAbility < 40 && r < 0.5)
    if (retires) {
      retiredPlayerIds.add(player.id)
      if (player.clubId === game.managedClubId) {
        const seasonsActive = player.age - 18  // rough career length estimate
        retirementMessages.push({
          id: `inbox_retirement_${player.id}_${nextSeason}`,
          date: game.currentDate,
          type: InboxItemType.Retirement,
          title: `${player.firstName} ${player.lastName} avslutar karriären`,
          body: `${player.firstName} ${player.lastName} (${player.age} år) meddelar att han lägger skridskorna på hyllan efter ${Math.max(1, seasonsActive)} säsonger i bandyn. Tack för allt!`,
          isRead: false,
        } as InboxItem)
      }
    }
  }

  const activePlayers = resetPlayers.filter(p => !retiredPlayerIds.has(p.id))

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

  if (newBoardPatience <= 15 || newConsecutiveFailures >= 3) {
    managerFired = true
  }

  // Remove retired players from all club squads
  const clubsWithRetirements = updatedClubs.map(club => ({
    ...club,
    squadPlayerIds: club.squadPlayerIds.filter(id => !retiredPlayerIds.has(id)),
  }))

  // ── Tvångsnedflyttning effects (license denied) ───────────────────────────
  let clubsAfterLicense = clubsWithRetirements
  let playersAfterLicense = activePlayers
  let sponsorsAfterLicense = game.sponsors ?? []
  let licFireManager = false

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

    licFireManager = false  // Manager survives but demoted
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
  const seasonEndPendingEvents: GameEvent[] = []
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

  const updatedGame: SaveGame = {
    ...game,
    currentSeason: nextSeason,
    currentDate: `${nextSeason}-10-01`,
    clubs: clubsAfterLicense,
    players: playersAfterLicense,
    fixtures: newFixtures,
    league: newLeague,
    standings: calculateStandings(updatedClubs.map(c => c.id), []),
    inbox: [...game.inbox, ...newInboxItems, ...retirementMessages].slice(-75),
    youthIntakeHistory: youthRecords,
    managedClubPendingLineup: undefined,
    matchWeathers: [],
    trainingHistory: [],
    playoffBracket: null,
    cupBracket: newCupBracket,
    seasonSummaries: [...(game.seasonSummaries ?? []), seasonSummary].slice(-5),
    showSeasonSummary: true,
    showBoardMeeting: (managerFired || licFireManager) ? false : undefined,
    showPreSeason: (managerFired || licFireManager) ? false : true,
    managerFired: managerFired ? true : undefined,
    fanMood: licenseReview?.status === 'denied'
      ? Math.max(0, (game.fanMood ?? 50) - 15)
      : game.fanMood,
    seasonStartFinances: updatedClubs.find(c => c.id === game.managedClubId)?.finances,
    scoutReports: game.scoutReports ?? {},
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
    trainingProjects: [],
    communityActivities: game.communityActivities
      ? { ...game.communityActivities, julmarknad: false }
      : game.communityActivities,
    youthTeam: generateYouthTeam(
      updatedClubs.find(c => c.id === game.managedClubId) ?? game.clubs.find(c => c.id === game.managedClubId)!,
      (() => {
        if (game.academyUpgradeInProgress && game.academyUpgradeSeason === nextSeason) {
          return game.academyLevel === 'basic' ? 'developing' : 'elite'
        }
        return game.academyLevel ?? 'basic'
      })(),
      nextSeason,
      baseSeed + 77777,
    ),
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
    resolvedEventIds: [
      ...(game.resolvedEventIds ?? []),
      ...(licenseReview?.status !== 'denied' ? [] : []),
      gravId,
      raddId,
    ].slice(-200),
  }

  return { game: updatedGame, roundPlayed: null, seasonEnded: true }
}
