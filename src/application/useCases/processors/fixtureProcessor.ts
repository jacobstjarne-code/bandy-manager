import type { Fixture, ManagerChoiceEntry } from '../../../domain/entities/Fixture'
import type { InboxItem, SaveGame } from '../../../domain/entities/SaveGame'
import {
  FixtureStatus,
  InboxItemType,
  MatchEventType,
} from '../../../domain/enums'
import { getRivalry } from '../../../domain/data/rivalries'
import {
  annandagsbandyInbox,
  cupFinalInboxPlaying,
  finaldagInboxPlaying,
  finaldagInboxSpectator,
  type SpecialDateContext,
} from '../../../domain/data/specialDateStrings'

type Lineup = Fixture['homeLineup']

function stripLineup(lineup: Lineup): Lineup {
  if (!lineup) return undefined
  return {
    startingPlayerIds: lineup.startingPlayerIds,
    benchPlayerIds: [],
    tactic: {
      mentality: lineup.tactic.mentality,
      tempo: lineup.tactic.tempo,
      passingRisk: lineup.tactic.passingRisk,
      width: lineup.tactic.width,
      attackingFocus: lineup.tactic.attackingFocus,
      cornerStrategy: lineup.tactic.cornerStrategy,
      penaltyKillStyle: lineup.tactic.penaltyKillStyle,
    },
  }
}

export function generateSpecialDateInbox(
  fixture: Fixture,
  game: SaveGame,
  matchday: number,
): InboxItem[] {
  const items: InboxItem[] = []
  const isHome = fixture.homeClubId === game.managedClubId
  const homeClub = game.clubs.find(c => c.id === fixture.homeClubId)
  const awayClub = game.clubs.find(c => c.id === fixture.awayClubId)
  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)

  const ctx: SpecialDateContext = {
    isHomePlayer: isHome,
    homeClubName: homeClub?.name ?? '',
    awayClubName: awayClub?.name ?? '',
    arenaName: homeClub?.arenaName ?? 'arenan',
    venueCity: homeClub?.shortName ?? '',
    rivalryName: rivalry?.name,
  }

  if (fixture.isFinaldag) {
    const { subject, body } = finaldagInboxPlaying(ctx)
    items.push({
      id: `inbox_finaldag_${game.currentSeason}`,
      date: game.currentDate,
      type: InboxItemType.Playoff,
      title: subject,
      body,
      isRead: false,
    })
    return items
  }

  const storedCal = game.seasonCalendar ?? []
  const slot = storedCal.find(s => s.matchday === matchday)

  if (slot?.isAnnandagen || fixture.isAnnandagen) {
    const { subject, body } = annandagsbandyInbox(ctx)
    items.push({
      id: `inbox_annandagen_match_${game.currentSeason}`,
      date: game.currentDate,
      type: InboxItemType.Derby,
      title: subject,
      body,
      isRead: false,
    })
  } else if (slot?.isCupFinalhelgen && fixture.isCup && fixture.roundNumber === 4) {
    const { subject, body } = cupFinalInboxPlaying(ctx)
    items.push({
      id: `inbox_cupfinalhelg_${fixture.id}`,
      date: game.currentDate,
      type: InboxItemType.Derby,
      title: subject,
      body,
      isRead: false,
    })
  }

  return items
}

export function generateSpecialDateInboxSpectator(game: SaveGame): InboxItem[] {
  const smFinal = game.fixtures.find(f =>
    f.isFinaldag &&
    f.status !== FixtureStatus.Completed &&
    f.homeClubId !== game.managedClubId &&
    f.awayClubId !== game.managedClubId
  )
  if (!smFinal) return []

  const alreadySent = game.inbox.some(i => i.id === `inbox_finaldag_spectator_${game.currentSeason}`)
  if (alreadySent) return []

  const homeClub = game.clubs.find(c => c.id === smFinal.homeClubId)
  const awayClub = game.clubs.find(c => c.id === smFinal.awayClubId)
  const ctx: SpecialDateContext = {
    isHomePlayer: false,
    homeClubName: homeClub?.name ?? '',
    awayClubName: awayClub?.name ?? '',
    arenaName: homeClub?.arenaName ?? 'arenan',
    venueCity: homeClub?.shortName ?? '',
  }
  const { subject, body } = finaldagInboxSpectator(ctx)
  return [{
    id: `inbox_finaldag_spectator_${game.currentSeason}`,
    date: game.currentDate,
    type: InboxItemType.Playoff,
    title: subject,
    body,
    isRead: false,
  }]
}

export function processUpcomingFixtureInbox(
  fixtures: Fixture[],
  game: SaveGame,
  nextMatchday: number,
): {
  inboxItems: InboxItem[]
  pendingAnnandagsVal: boolean
  upcomingManagedFixture?: Fixture
} {
  const inboxItems: InboxItem[] = []
  let pendingAnnandagsVal = game.pendingAnnandagsVal ?? false
  // Ett obesvarat arrangemangsval får inte bli ett permanent portalkort när
  // själva annandagsmatchen redan är spelad. Behåll valet fram till avslag,
  // men pensionera det så snart dess enda möjliga målmatch har passerat.
  const completedAnnandagenHomeFixture = fixtures.find(fixture =>
    fixture.isAnnandagen &&
    fixture.homeClubId === game.managedClubId &&
    fixture.status === FixtureStatus.Completed
  )
  if (pendingAnnandagsVal && completedAnnandagenHomeFixture) {
    pendingAnnandagsVal = false
  }
  const annandagenHomeFixture = (!game.annandagsValGjort && !game.pendingAnnandagsVal)
    ? fixtures.find(fixture =>
        fixture.isAnnandagen &&
        fixture.homeClubId === game.managedClubId &&
        fixture.status === FixtureStatus.Scheduled
      )
    : undefined
  if (annandagenHomeFixture && annandagenHomeFixture.matchday - nextMatchday === 2) {
    pendingAnnandagsVal = true
  }

  const scheduled = fixtures.filter(fixture => fixture.status === FixtureStatus.Scheduled)
  if (scheduled.length === 0) return { inboxItems, pendingAnnandagsVal }

  const upcomingMatchday = Math.min(...scheduled.map(fixture => fixture.matchday))
  const upcomingManagedFixture = scheduled.find(fixture =>
    fixture.matchday === upcomingMatchday &&
    (fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId)
  )
  if (upcomingManagedFixture) {
    for (const item of generateSpecialDateInbox(upcomingManagedFixture, game, upcomingMatchday)) {
      if (!game.inbox.some(existing => existing.id === item.id)) inboxItems.push(item)
    }
  } else {
    inboxItems.push(...generateSpecialDateInboxSpectator(game))
  }

  return { inboxItems, pendingAnnandagsVal, upcomingManagedFixture }
}

export function stripCompletedFixture(
  fixture: Fixture,
  managedFixtureId?: string,
  managedClubId?: string,
): Fixture {
  if (fixture.id === managedFixtureId) return fixture
  if (fixture.status !== FixtureStatus.Completed) return fixture

  const isManagedFixture = managedClubId != null &&
    (fixture.homeClubId === managedClubId || fixture.awayClubId === managedClubId)
  // Årsbokens toppbetyg aggregerar dessa rapporter. Att bara bevara derbyn,
  // sena matcher och storsegrar skapade en systematiskt skev restmängd.
  // Bevara därför betygen för alla egna matcher; AI-rapporter komprimeras än.
  const preserveRatings = isManagedFixture

  // Keep durable scoring/suspension facts. Transient live-match events are
  // discarded here so completed fixtures do not make saves grow indefinitely.
  const strippedEvents = fixture.events
    .filter(event => event.type === MatchEventType.Goal || event.type === MatchEventType.Suspension)
    .map(event => ({ ...event, description: '' }))

  return {
    ...fixture,
    events: strippedEvents,
    homeLineup: stripLineup(fixture.homeLineup),
    awayLineup: stripLineup(fixture.awayLineup),
    report: preserveRatings || !fixture.report
      ? fixture.report
      : { ...fixture.report, playerRatings: {} },
  }
}

export function ensureManagerChoiceLog(fixture: Fixture, game: SaveGame): Fixture {
  if (fixture.report?.managerChoiceLog) return fixture
  const isHome = fixture.homeClubId === game.managedClubId
  const lineup = isHome ? fixture.homeLineup : fixture.awayLineup
  const choiceLog: ManagerChoiceEntry[] = []
  if (game.captainPlayerId) {
    choiceLog.push({ type: 'captain', playerId: game.captainPlayerId, detail: game.captainPlayerId })
  }
  for (const playerId of lineup?.startingPlayerIds ?? []) {
    const player = game.players.find(candidate => candidate.id === playerId)
    if (player && (player.fitness ?? 100) < 40) {
      choiceLog.push({
        type: 'started_tired',
        playerId,
        detail: `condition_${Math.round(player.fitness ?? 0)}`,
        ...(lineup?.autoSelected && { autoSelected: true }),
      })
    }
  }
  for (const playerId of lineup?.benchPlayerIds ?? []) {
    const player = game.players.find(candidate => candidate.id === playerId)
    if (player && (player.fitness ?? 100) > 80) {
      choiceLog.push({ type: 'bench_fit', playerId, detail: `condition_${Math.round(player.fitness ?? 0)}` })
    }
  }
  if (choiceLog.length === 0 || !fixture.report) return fixture
  return { ...fixture, report: { ...fixture.report, managerChoiceLog: choiceLog } }
}

// User-action items must survive the ordinary inbox-retention sweep.
export const INBOX_PROTECTED_TYPES = new Set<InboxItemType>([
  InboxItemType.TransferOffer,
  InboxItemType.ContractExpiring,
  InboxItemType.Retirement,
  InboxItemType.TransferBidReceived,
  InboxItemType.YouthIntake,
  InboxItemType.ScoutReport,
  InboxItemType.TransferDeadline,
])
