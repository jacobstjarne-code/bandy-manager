import type { SaveGame } from '../../domain/entities/SaveGame'
import type { BoardMember, BoardPersonality, BoardRole } from '../../domain/entities/Community'
import { PendingScreen } from '../../domain/enums'
import { generateAssistantCoach } from '../../domain/services/assistantCoachService'
import { CLUB_TEMPLATES } from '../../domain/services/worldGenerator'
import { buildSeasonCalendar } from '../../domain/services/scheduleGenerator'

function strHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0
  return h
}

function defaultBoardPersonalities(clubId: string): BoardMember[] {
  const personalities: BoardPersonality[] = ['supporter', 'ekonom', 'traditionalist', 'modernist']
  const roles: [BoardRole, string][] = [['ordförande', 'Ordföranden'], ['kassör', 'Kassören'], ['ledamot', 'Ledamoten']]
  const seed = strHash(clubId)
  return roles.map(([role, name], i) => ({
    name,
    role,
    personality: personalities[(seed + i * 7) % personalities.length],
  }))
}

export const CURRENT_SAVE_VERSION = '0.3.1'

export function migrateSaveGame(raw: unknown): SaveGame {
  const data = raw as Record<string, unknown>

  // ── communityActivities: ensure newer optional flags exist ─────────────
  if (data.communityActivities && typeof data.communityActivities === 'object') {
    const ca = data.communityActivities as Record<string, unknown>
    if (ca.socialMedia === undefined) ca.socialMedia = false
    if (ca.vipTent === undefined) ca.vipTent = false
    if (ca.bandySchool === undefined) ca.bandySchool = false
  }

  // ── top-level optional fields introduced after v0.1.0 ─────────────────
  if (data.fanMood === undefined) data.fanMood = 50
  if (data.boardPatience === undefined) data.boardPatience = 70
  if (data.consecutiveFailures === undefined) data.consecutiveFailures = 0
  if (data.pendingEvents === undefined) data.pendingEvents = []
  if (data.pendingDecisions === undefined) data.pendingDecisions = []
  if (data.deferredDecisions === undefined) data.deferredDecisions = []
  if (data.lastRumorRound === undefined) data.lastRumorRound = 0
  if (data.lastEventQueueRound === undefined) data.lastEventQueueRound = 0
  if (data.resolvedEventIds === undefined) data.resolvedEventIds = []
  if (data.transferBids === undefined) data.transferBids = []
  if (data.seasonSummaries === undefined) data.seasonSummaries = []
  if (data.scoutReports === undefined) data.scoutReports = {}
  if (data.trainingHistory === undefined) data.trainingHistory = []
  if (data.trainingProjects === undefined) data.trainingProjects = []
  if (data.playerConversations === undefined) data.playerConversations = {}
  if (data.leadershipActions === undefined) data.leadershipActions = []
  if (data.doctorQuestionsUsed === undefined) data.doctorQuestionsUsed = 0
  if (data.scoutBudget === undefined) data.scoutBudget = 3
  if (data.communityStanding === undefined) data.communityStanding = 50
  if (data.journalistRelationship === undefined) data.journalistRelationship = 50
  // C-B1: CS press event tracking
  if (data.lastCSPressMatchday === undefined) data.lastCSPressMatchday = 0
  // pendingCSPress defaults to undefined — no migration needed
  if (data.playoffBracket === undefined) data.playoffBracket = null
  if (data.cupBracket === undefined) data.cupBracket = null
  // v0.3.1 — säsongsbage
  if (data.managedClubPeriodisation === undefined) data.managedClubPeriodisation = 'hall'
  // ARCH-003: migrate old show* booleans to pendingScreen enum
  if (data.pendingScreen === undefined) {
    if (data.showSeasonSummary) data.pendingScreen = PendingScreen.SeasonSummary
    else if (data.showBoardMeeting) data.pendingScreen = PendingScreen.BoardMeeting
    else if (data.showPreSeason) data.pendingScreen = PendingScreen.PreSeason
    else if (data.showHalfTimeSummary) data.pendingScreen = PendingScreen.HalfTimeSummary
    else if (data.showPlayoffIntro) data.pendingScreen = PendingScreen.PlayoffIntro
    else if (data.showQFSummary) data.pendingScreen = PendingScreen.QFSummary
    else data.pendingScreen = null
  }
  delete data.showSeasonSummary
  delete data.showBoardMeeting
  delete data.showPreSeason
  delete data.showHalfTimeSummary
  delete data.showPlayoffIntro
  delete data.showQFSummary
  if (data.activeScoutAssignment === undefined) data.activeScoutAssignment = null
  if (data.allTimeRecords === undefined) data.allTimeRecords = null
  // tutorialSeen is deprecated — migrate to coachMarksSeen
  if (data.tutorialSeen && data.coachMarksSeen === undefined) data.coachMarksSeen = true

  // V1.0 — Storylines, Legacy, Market tracking
  if (data.storylines === undefined) data.storylines = []
  if (data.clubLegends === undefined) data.clubLegends = []
  if (data.previousMarketValues === undefined) data.previousMarketValues = {}
  if (data.financeLog === undefined) data.financeLog = []
  if (data.pendingFollowUps === undefined) data.pendingFollowUps = []
  if (data.mecenater === undefined) data.mecenater = []
  if (data.facilityProjects === undefined) data.facilityProjects = []
  if (data.boardObjectives === undefined) data.boardObjectives = []
  if (data.boardObjectiveHistory === undefined) data.boardObjectiveHistory = []
  if (data.boardPersonalities === undefined) data.boardPersonalities = defaultBoardPersonalities(data.managedClubId as string ?? '')
  if (data.trainerArc === undefined) data.trainerArc = { current: 'established', history: [], seasonCount: 1, bestFinish: 6, titlesWon: 0, consecutiveLosses: 0, consecutiveWins: 0, boardWarningGiven: false }
  // V1.0 — Journalist character (created on-demand if missing)
  if (data.journalist === undefined) data.journalist = null

  // ── localPolitician: ensure newer optional fields exist ───────────────
  if (data.localPolitician && typeof data.localPolitician === 'object') {
    const pol = data.localPolitician as Record<string, unknown>
    if (pol.mediaProfile === undefined) pol.mediaProfile = 'tystlåten'
    if (pol.personalInterest === undefined) pol.personalInterest = 'ingenting'
    if (pol.oppositionStrength === undefined) pol.oppositionStrength = 40
    if (pol.popularitet === undefined) pol.popularitet = 55
  }

  // ── players: ensure each player has newer optional fields ──────────────
  if (Array.isArray(data.players)) {
    data.players = (data.players as Record<string, unknown>[]).map(p => {
      if (p.injuryNarrative === undefined) p.injuryNarrative = undefined
      if (p.familyContext === undefined) p.familyContext = undefined
      if (p.promotedFromAcademy === undefined) p.promotedFromAcademy = false
      if (p.careerMilestones === undefined) p.careerMilestones = []
      if (p.startSeasonCA === undefined) p.startSeasonCA = p.currentAbility
      // C-T1 — backfill transferPersonality for existing saves
      if (p.transferPersonality === undefined) {
        const seed = strHash(p.id as string)
        const v = seed % 100
        p.transferPersonality = v < 35 ? 'homebound'
          : v < 65 ? 'default'
          : v < 80 ? 'ambitious'
          : v < 92 ? 'family'
          : 'dream_club'
        // dreamClubId is not backfilled here (clubs may not be available in migration)
        // dream_club players act as reluctant sellers until a new game is started
      }
      // v0.3.1 — säsongsbage
      if (p.seasonForm === undefined) p.seasonForm = 60
      if (!p.seasonStats || typeof p.seasonStats !== 'object') {
        p.seasonStats = { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 }
      } else {
        const ss = p.seasonStats as Record<string, unknown>
        if (ss.penaltyGoals === undefined) ss.penaltyGoals = 0
        if (ss.suspensions === undefined) ss.suspensions = 0
        if (ss.minutesPlayed === undefined) ss.minutesPlayed = 0
      }
      return p
    })
  }

  // ── BUG-012: Club ID normalization (legacy saves from v1.3 and earlier) ──
  const CLUB_ID_MIGRATION: Record<string, string> = {
    club_sandviken:  'club_forsbacka',
    club_sirius:     'club_soderfors',
    club_vasteras:   'club_vastanfors',
    club_broberg:    'club_karlsborg',
    club_villa:      'club_malilla',
    club_falun:      'club_gagnef',
    club_ljusdal:    'club_halleforsnas',
    club_edsbyn:     'club_lesjofors',
    club_tillberga:  'club_rogle',
    club_kungalv:    'club_slottsbron',
    club_soderhamns: 'club_heros',
  }
  const mapId = (id: string): string => CLUB_ID_MIGRATION[id] ?? id
  const hasOldIds = Object.keys(CLUB_ID_MIGRATION).some(old =>
    data.managedClubId === old ||
    (Array.isArray(data.clubs) && (data.clubs as Record<string, unknown>[]).some(c => c.id === old))
  )
  if (hasOldIds) {
    if (typeof data.managedClubId === 'string') data.managedClubId = mapId(data.managedClubId)
    if (Array.isArray(data.clubs)) {
      data.clubs = (data.clubs as Record<string, unknown>[]).map(c => ({
        ...c, id: typeof c.id === 'string' ? mapId(c.id) : c.id,
      }))
    }
    if (Array.isArray(data.players)) {
      data.players = (data.players as Record<string, unknown>[]).map(p => ({
        ...p,
        clubId: typeof p.clubId === 'string' ? mapId(p.clubId) : p.clubId,
        academyClubId: typeof p.academyClubId === 'string' ? mapId(p.academyClubId) : p.academyClubId,
      }))
    }
    if (Array.isArray(data.fixtures)) {
      data.fixtures = (data.fixtures as Record<string, unknown>[]).map(f => ({
        ...f,
        homeClubId: typeof f.homeClubId === 'string' ? mapId(f.homeClubId) : f.homeClubId,
        awayClubId: typeof f.awayClubId === 'string' ? mapId(f.awayClubId) : f.awayClubId,
      }))
    }
    if (Array.isArray(data.standings)) {
      data.standings = (data.standings as Record<string, unknown>[]).map(s => ({
        ...s, clubId: typeof s.clubId === 'string' ? mapId(s.clubId) : s.clubId,
      }))
    }
  }

  // V1.4 — narrative / supporter fields
  if (data.rivalryHistory === undefined) data.rivalryHistory = {}
  if (data.nemesisTracker === undefined) data.nemesisTracker = {}
  if (data.volunteers === undefined) data.volunteers = []
  if (data.volunteerMorale === undefined) data.volunteerMorale = 70

  // V1.5 — DREAM features (Sprint 14)
  if (data.bandyLetters === undefined) data.bandyLetters = []
  // bandyLetterThisSeason, schoolAssignmentThisSeason, economicCrisisState — undefined is the correct default
  if (data.schoolAssignmentArchive === undefined) data.schoolAssignmentArchive = []
  // lastTeamPhotoSeason — undefined is fine (no photo yet)

  // M2 — obligatoriska fält som saknades i migrationen
  if (data.handledContractPlayerIds === undefined) data.handledContractPlayerIds = []
  if (data.matchWeathers === undefined) data.matchWeathers = []
  if (data.mentorships === undefined) data.mentorships = []
  if (data.loanDeals === undefined) data.loanDeals = []
  if (data.talentSearchResults === undefined) data.talentSearchResults = []
  if (data.youthIntakeHistory === undefined) data.youthIntakeHistory = []
  if (data.transferState === undefined) data.transferState = { freeAgents: [], pendingOffers: [] }
  if (data.academyLevel === undefined) data.academyLevel = 'basic'

  // M7 — Orten-feed
  if (data.recentMoments === undefined) data.recentMoments = []

  // ── players: ensure isClubLegend field exists ────────────────────────────
  if (Array.isArray(data.players)) {
    data.players = (data.players as Record<string, unknown>[]).map(p => {
      if (p.isClubLegend === undefined) p.isClubLegend = false
      return p
    })
  }

  // ── Sprint 18 — AssistantCoach ───────────────────────────────────────────
  if (data.assistantCoach === undefined) {
    data.assistantCoach = generateAssistantCoach(typeof data.id === 'string' ? data.id : 'default')
  }

  // ── Sprint 23 — Chemistry ─────────────────────────────────────────────────
  if (data.chemistryStats === undefined) {
    data.chemistryStats = {}
  }

  // ── SPEC_BESLUTSEKONOMI_STEG_2 — currentMatchday ─────────────────────────
  // currentMatchday was never set by roundProcessor before this fix.
  // Derive from completed fixtures if possible, otherwise default to 1.
  if (data.currentMatchday === undefined) {
    const fixtures = data.fixtures as Array<Record<string, unknown>> | undefined
    const completed = (fixtures ?? []).filter(f => f.status === 'completed')
    const matchdays = completed.map(f => typeof f.matchday === 'number' ? f.matchday : 0)
    data.currentMatchday = matchdays.length > 0 ? Math.max(...matchdays) : 1
  }

  // ── SPEC_INLEDNING_FAS_2 — migrate old BoardMeeting/PreSeason pendingScreen ─
  // BoardMeetingScreen och PreSeasonScreen är borttagna. Om en save har
  // pendingScreen = 'board_meeting' eller 'pre_season', rensa det.
  if (data.pendingScreen === PendingScreen.BoardMeeting || data.pendingScreen === PendingScreen.PreSeason) {
    data.pendingScreen = null
  }

  // 2026-05-29: BoardMeeting ska aldrig trigga säsong 1. Rensa stale pendingScene.
  if ((data.pendingScene as Record<string, unknown> | undefined)?.sceneId === 'board_meeting' && data.currentSeason === 1) {
    data.pendingScene = null
  }

  // ── SPEC_INLEDNING_FAS_2 — board + clubhouse på varje klubb ─────────────
  if (Array.isArray(data.clubs)) {
    data.clubs = (data.clubs as Record<string, unknown>[]).map(c => {
      if (c.board === undefined || c.clubhouse === undefined) {
        const template = CLUB_TEMPLATES.find(t => t.id === c.id)
        if (template) {
          if (c.board === undefined) c.board = template.board
          if (c.clubhouse === undefined) c.clubhouse = template.clubhouse
        }
      }
      return c
    })
  }

  // ── B11 T6 — Build seasonCalendar if missing (single source of truth) ────
  // Old saves lack seasonCalendar — build once from currentSeason.
  if (data.seasonCalendar === undefined && typeof data.currentSeason === 'number') {
    data.seasonCalendar = buildSeasonCalendar(data.currentSeason as number)
  }

  // ── Backfill isAnnandagen / isNyarsbandy + date + tipoffHour on fixtures ──
  // These flags were introduced 2026-05-18. date/tipoffHour introduced B11.
  // Completed fixtures: preserve date/tipoffHour if already set, else stamp from calendar.
  // Scheduled fixtures: always stamp from calendar (may be missing).
  if (Array.isArray(data.fixtures)) {
    const calendarCache = new Map<number, ReturnType<typeof buildSeasonCalendar>>()
    data.fixtures = (data.fixtures as Record<string, unknown>[]).map(f => {
      const season = typeof f.season === 'number' ? f.season : 0
      if (!calendarCache.has(season)) calendarCache.set(season, buildSeasonCalendar(season))
      const cal = calendarCache.get(season)!
      const matchday = typeof f.matchday === 'number' ? f.matchday : -1

      if (!f.isCup) {
        const slot = cal.find(s => s.matchday === matchday && s.type === 'league')
        if (slot) {
          if (f.isAnnandagen === undefined && slot.isAnnandagen) f.isAnnandagen = true
          if (f.isNyarsbandy === undefined && slot.isNyarsbandy) f.isNyarsbandy = true
          if (f.isWindowDeadlineDay === undefined && slot.isWindowDeadlineDay) f.isWindowDeadlineDay = true
          // Stamp date + tipoffHour if missing (only on Scheduled fixtures, preserve Completed)
          if (f.date === undefined && slot.date) f.date = slot.date
          if (f.tipoffHour === undefined && slot.tipoffHour !== undefined) f.tipoffHour = slot.tipoffHour
        }
      } else {
        // Cup fixtures: stamp from cup-type slots
        const cupSlot = cal.find(s => s.matchday === matchday && s.type === 'cup')
        if (cupSlot) {
          if (f.date === undefined && cupSlot.date) f.date = cupSlot.date
          if (f.tipoffHour === undefined && cupSlot.tipoffHour !== undefined) f.tipoffHour = cupSlot.tipoffHour
        }
      }
      return f
    })
  }

  // ── C-SD1 — remove dead summer fields (inSummerScene / seasonDoneAck) ─────
  delete data.inSummerScene
  delete data.seasonDoneAck

  // ── C-P1 — cardStaleTracking ─────────────────────────────────────────────
  if (data.cardStaleTracking === undefined) data.cardStaleTracking = {}

  // ── A5 — cup/liga stat-split: rensa förorenad seasonStats (cup-mål hade adderats
  //    till ligastatistiken). Re-summera ur denna säsongs completed fixtures, delat
  //    på isCup. careerStats lämnas orört (all-tävling). Körs en gång per save som
  //    saknar seasonCupStats. ──────────────────────────────────────────────────
  if (Array.isArray(data.players) && Array.isArray(data.fixtures)) {
    const players = data.players as Record<string, unknown>[]
    const needsSplit = players.some(p => p.seasonCupStats === undefined)
    if (needsSplit) {
      const season = data.currentSeason as number
      const fixtures = (data.fixtures as Record<string, unknown>[]).filter(
        f => f.status === 'completed' && f.season === season
      )
      const recompute = (playerId: string, isCup: boolean) => {
        const subset = fixtures.filter(f => !!f.isCup === isCup)
        const s = { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 }
        let ratingSum = 0, ratingCount = 0
        for (const f of subset) {
          const home = (f.homeLineup as { startingPlayerIds?: string[] } | undefined)?.startingPlayerIds ?? []
          const away = (f.awayLineup as { startingPlayerIds?: string[] } | undefined)?.startingPlayerIds ?? []
          const started = home.includes(playerId) || away.includes(playerId)
          if (!started) continue
          s.gamesPlayed += 1
          s.minutesPlayed += 90
          const events = (f.events as Array<Record<string, unknown>>) ?? []
          for (const e of events) {
            if (e.playerId !== playerId) continue
            if (e.type === 'goal') { s.goals += 1; if (e.isCornerGoal) s.cornerGoals += 1; if (e.isPenaltyGoal) s.penaltyGoals += 1 }
            else if (e.type === 'assist') s.assists += 1
            else if (e.type === 'redCard' || e.type === 'suspension') s.redCards += 1
          }
          const rating = (f.report as { playerRatings?: Record<string, number> } | undefined)?.playerRatings?.[playerId]
          if (rating !== undefined) { ratingSum += rating; ratingCount += 1 }
        }
        s.averageRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 100) / 100 : 0
        return s
      }
      data.players = players.map(p => {
        const id = p.id as string
        return { ...p, seasonStats: recompute(id, false), seasonCupStats: recompute(id, true) }
      })
    }
  }

  // ── B5: expiresRound migration — backfill open TransferBidReceived without deadline ─────
  if (Array.isArray(data.inbox)) {
    const currentRound = (data.currentMatchday as number | undefined) ?? 0
    data.inbox = (data.inbox as Record<string, unknown>[]).map(item => {
      if (item.type === 'transferBidReceived' && item.expiresRound == null) {
        return { ...item, expiresRound: currentRound + 2 }
      }
      return item
    })
  }

  // ── version stamp ────────────────────────────────────────────────────────
  data.version = CURRENT_SAVE_VERSION

  return data as unknown as SaveGame
}
