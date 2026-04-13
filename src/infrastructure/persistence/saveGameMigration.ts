import type { SaveGame } from '../../domain/entities/SaveGame'

export const CURRENT_SAVE_VERSION = '0.2.0'

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
  if (data.resolvedEventIds === undefined) data.resolvedEventIds = []
  if (data.transferBids === undefined) data.transferBids = []
  if (data.seasonSummaries === undefined) data.seasonSummaries = []
  if (data.scoutReports === undefined) data.scoutReports = {}
  if (data.trainingHistory === undefined) data.trainingHistory = []
  if (data.trainingProjects === undefined) data.trainingProjects = []
  if (data.playerConversations === undefined) data.playerConversations = {}
  if (data.doctorQuestionsUsed === undefined) data.doctorQuestionsUsed = 0
  if (data.scoutBudget === undefined) data.scoutBudget = 3
  if (data.communityStanding === undefined) data.communityStanding = 50
  if (data.journalistRelationship === undefined) data.journalistRelationship = 50
  if (data.playoffBracket === undefined) data.playoffBracket = null
  if (data.cupBracket === undefined) data.cupBracket = null
  if (data.showSeasonSummary === undefined) data.showSeasonSummary = false
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
  if (data.trainerArc === undefined) data.trainerArc = { current: 'established', history: [], seasonCount: 1, bestFinish: 6, titlesWon: 0, consecutiveLosses: 0, consecutiveWins: 0, boardWarningGiven: false }
  // V1.0 — Journalist character (created on-demand if missing)
  if (data.journalist === undefined) data.journalist = null

  // ── players: ensure each player has newer optional fields ──────────────
  if (Array.isArray(data.players)) {
    data.players = (data.players as Record<string, unknown>[]).map(p => {
      if (p.promotedFromAcademy === undefined) p.promotedFromAcademy = false
      if (p.careerMilestones === undefined) p.careerMilestones = []
      if (p.startSeasonCA === undefined) p.startSeasonCA = p.currentAbility
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

  // ── version stamp ────────────────────────────────────────────────────────
  data.version = CURRENT_SAVE_VERSION

  return data as unknown as SaveGame
}
