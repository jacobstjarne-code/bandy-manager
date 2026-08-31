import type { SaveGame } from '../../domain/entities/SaveGame'
import type { BoardMember, BoardPersonality, BoardRole } from '../../domain/entities/Club'
import type { FacilityState } from '../../domain/entities/Community'
import { PendingScreen } from '../../domain/enums'
import { generateAssistantCoach } from '../../domain/services/assistantCoachService'
import { CLUB_TEMPLATES } from '../../domain/services/worldGenerator'
import type { ClubBoardTemplate } from '../../domain/services/worldGenerator'
import { buildSeasonCalendar } from '../../domain/services/scheduleGenerator'
import { FACILITY_NODE_DEFS } from '../../domain/services/facilityService'
import { computeSeasonVerdictRating, expectationVerdictFromRating } from '../../domain/services/boardService'
import { buildExpectationVerdictSentence } from '../../domain/services/seasonSummaryService'

// B1 §5 — migrera gamla facilityProjects → ny facilityState. SJÄLVSTÄNDIG legacy-shape
// (importerar inte den borttagna FacilityProject-typen) så den överlever utfasningen.
interface LegacyFacilityProject { id: string; status: string; startedMatchday?: number }
const LEGACY_NODE_MAP: Record<string, string> = {
  stralkastare: 'stralkastare',      // samma id i nya trädet (§8 portad)
  gym: 'gym',                        // samma id i nya trädet (§8 portad)
  varmestuga_legacy: 'varmestuga',
  laktare_legacy: 'laktare_ostra',
  ny_arena: 'matchhall',
  // omkladningsrum: släppt (§8 — ingen motsvarande nod, ingen förlust värd en nod)
}
function migrateFacilityState(legacy: LegacyFacilityProject[]): FacilityState {
  const builtNodeIds = legacy
    .filter(p => p.status === 'completed')
    .map(p => LEGACY_NODE_MAP[p.id])
    .filter((id): id is string => !!id)
  // Orphan-fix: pågående gammalt bygge får INTE försvinna — fullföljs i nya modellen
  // som activeProject med kvarvarande omgångar (advanceFacilityState slutför + ger bonusen).
  const inProgress = legacy.find(p => p.status === 'in_progress' && LEGACY_NODE_MAP[p.id])
  if (inProgress) {
    const nodeId = LEGACY_NODE_MAP[inProgress.id]
    const def = FACILITY_NODE_DEFS.find(d => d.id === nodeId)
    const started = inProgress.startedMatchday ?? 0
    return { builtNodeIds, activeProject: { nodeId, startedMatchday: started, etaMatchday: started + (def?.buildRounds ?? 8) } }
  }
  return { builtNodeIds }
}

function strHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0
  return h
}

// KF4 (2026-06-21): deterministisk personlighet per roll (oförändrad seedning).
function defaultPersonalities(clubId: string): Record<BoardRole, BoardPersonality> {
  const personalities: BoardPersonality[] = ['supporter', 'ekonom', 'traditionalist', 'modernist']
  const roles: BoardRole[] = ['ordförande', 'kassör', 'ledamot']
  const seed = strHash(clubId)
  const out = {} as Record<BoardRole, BoardPersonality>
  roles.forEach((role, i) => { out[role] = personalities[(seed + i * 7) % personalities.length] })
  return out
}

// KF4 (2026-06-21): bygg en full game.board[] (EN modell) av template-namn + deterministisk
// personlighet. Används som seed när en gammal save helt saknar styrelse-data.
function defaultBoard(clubId: string): BoardMember[] {
  const template = CLUB_TEMPLATES.find(t => t.id === clubId)?.board
  const pers = defaultPersonalities(clubId)
  const fallback = { firstName: 'Okänd', lastName: 'Styrelseledamot', age: 55, gender: 'm' as const }
  const chair = template?.chairman ?? { ...fallback, firstName: 'Ordföranden', lastName: '' }
  const treasurer = template?.treasurer ?? { ...fallback, firstName: 'Kassören', lastName: '' }
  const member = template?.member ?? { ...fallback, firstName: 'Ledamoten', lastName: '' }
  return [
    { id: 'ordforande-0', ...chair, role: 'ordförande', personality: pers['ordförande'] },
    { id: 'kassor-0', ...treasurer, role: 'kassör', personality: pers['kassör'] },
    { id: 'ledamot-0', ...member, role: 'ledamot', personality: pers['ledamot'] },
  ]
}

// KF4 (2026-06-21): slå ihop gammal club.board (namn/kön/ålder) + gammal boardPersonalities
// (personlighet, ev. extra ledamöter) per roll → EN game.board[]. Template-namn vinner.
interface LegacyBoardPersonality { name?: string; role?: BoardRole; personality?: BoardPersonality }
function mergeLegacyBoard(
  clubId: string,
  legacyClubBoard: ClubBoardTemplate | undefined,
  legacyPersonalities: LegacyBoardPersonality[] | undefined,
): BoardMember[] {
  const template = CLUB_TEMPLATES.find(t => t.id === clubId)?.board
  const board = legacyClubBoard ?? template
  const pers = defaultPersonalities(clubId)
  const persByRole = (role: BoardRole): BoardPersonality =>
    legacyPersonalities?.find(p => p.role === role)?.personality ?? pers[role]

  const fallback = { firstName: 'Okänd', lastName: 'Styrelseledamot', age: 55, gender: 'm' as const }
  const chair = board?.chairman ?? { ...fallback, firstName: 'Ordföranden', lastName: '' }
  const treasurer = board?.treasurer ?? { ...fallback, firstName: 'Kassören', lastName: '' }
  const member = board?.member ?? { ...fallback, firstName: 'Ledamoten', lastName: '' }

  const result: BoardMember[] = [
    { id: 'ordforande-0', ...chair, role: 'ordförande', personality: persByRole('ordförande') },
    { id: 'kassor-0', ...treasurer, role: 'kassör', personality: persByRole('kassör') },
    { id: 'ledamot-0', ...member, role: 'ledamot', personality: persByRole('ledamot') },
  ]

  // Extra ledamöter i boardPersonalities (eventResolver-tillägg, t.ex. 'Okänd Investerare').
  // Första ledamot-personligheten har redan konsumerats ovan; resten blir egna poster.
  const extraLedamoter = (legacyPersonalities ?? []).filter(p => p.role === 'ledamot')
  for (let i = 1; i < extraLedamoter.length; i++) {
    const ex = extraLedamoter[i]
    const nameParts = (ex.name ?? 'Okänd Investerare').split(' ')
    const firstName = nameParts[0] ?? 'Okänd'
    const lastName = nameParts.slice(1).join(' ') || 'Investerare'
    result.push({
      id: `ledamot-${i}`,
      firstName, lastName,
      age: 50, gender: 'm',
      role: 'ledamot',
      personality: ex.personality ?? 'modernist',
    })
  }

  return result
}

export const CURRENT_SAVE_VERSION = '0.3.7'

export function migrateSaveGame(raw: unknown): SaveGame {
  const data = raw as Record<string, unknown>

  // ── communityActivities: ensure newer optional flags exist ─────────────
  if (data.communityActivities && typeof data.communityActivities === 'object') {
    const ca = data.communityActivities as Record<string, unknown>
    if (ca.socialMedia === undefined) ca.socialMedia = false
    if (ca.vipTent === undefined) ca.vipTent = false
    if (ca.bandySchool === undefined) ca.bandySchool = false
  }

  // ── communityActivitiesSince: staleness-klockan (ANSPRÅK 4, spak 3) ────
  // DOM_ANSPAK4_TREDJE_SPAK_NYHET_2026-08-29.md. BACKFYLLNING, INTE
  // BAKÅTDATERING: en save där kiosken varit igång sedan säsong 1 får
  // startsäsong = INNEVARANDE säsong, inte 1. Ingen spelare ska vakna upp till
  // en ort som redan tröttnat på allt hen byggt under det gamla systemet.
  // (Samma backfyllning sker även i communityProcessor.ts varje omgång — den
  // här raden är för att fältet ska finnas direkt vid laddning, inte först
  // efter nästa advance.)
  if (data.communityActivitiesSince === undefined) {
    const ca = (data.communityActivities ?? {}) as Record<string, unknown>
    const season = typeof data.currentSeason === 'number' ? data.currentSeason : 1
    const since: Record<string, number> = {}
    for (const key of ['bandyplay', 'functionaries', 'bandySchool', 'socialMedia', 'pensionarskaffe', 'soppkvall', 'skolbesok']) {
      if (ca[key] === true) since[key] = season
    }
    for (const key of ['kiosk', 'lottery']) {
      if (typeof ca[key] === 'string' && ca[key] !== 'none') since[key] = season
    }
    data.communityActivitiesSince = since
  }

  // ── top-level optional fields introduced after v0.1.0 ─────────────────
  // M1 (audit 5c9a7a8, 2026-08-24): backfyll 'tilltrade' (INTE 'arrival') för
  // gamla saves som redan är mitt i onboarding — bevarar exakt tidigare
  // routerbeteende (som alltid skickade till /tilltrade). Bara NYA saves
  // (createNewGame.ts) sätter 'arrival' explicit. En redan färdig save
  // (onboardingComplete !== false) behöver inte fältet alls.
  if (data.onboardingScreen === undefined && data.onboardingComplete === false) {
    data.onboardingScreen = 'tilltrade'
  }
  if (data.fanMood === undefined) data.fanMood = 50
  if (data.boardPatience === undefined) data.boardPatience = 70
  if (data.consecutiveFailures === undefined) data.consecutiveFailures = 0
  if (data.pendingEvents === undefined) data.pendingEvents = []
  if (data.pendingDecisions === undefined) data.pendingDecisions = []
  if (data.deferredDecisions === undefined) data.deferredDecisions = []
  if (data.lastRumorRound === undefined) data.lastRumorRound = 0
  if (data.lastEventQueueRound === undefined) data.lastEventQueueRound = 0
  if (data.resolvedEventIds === undefined) data.resolvedEventIds = []
  if (data.resolvedChoices === undefined) data.resolvedChoices = []
  if (data.transferBids === undefined) data.transferBids = []
  if (data.seasonSummaries === undefined) data.seasonSummaries = []
  // SeasonSummary.id (2026-08-22) — förutsättning för delbarhet, tillagt efter
  // v0.3.3. Gamla saves har summaries utan `id`; backfyll med samma formel
  // som seasonSummaryService.ts använder vid genereringstillfället, annars
  // saknar äldre karriärer id på precis de summaries som fanns FÖRE migrationen.
  if (Array.isArray(data.seasonSummaries)) {
    data.seasonSummaries = (data.seasonSummaries as Record<string, unknown>[]).map(s => {
      if (s.id !== undefined) return s
      return { ...s, id: `${data.id as string}_s${s.season as number}_${s.clubId as string}` }
    })
  }
  // M8 (audit 5c9a7a8, 2026-08-24): "2:a plats sägs uppfylla krav att vinna
  // serien; 1:a plats sägs överträffa krav att vinna." A5 (2026-08-17,
  // commit 6f1d36a1) rättade VILKEN dom som väljs live (computeSeasonVerdict-
  // Rating/expectationVerdictFromRating, boardService.ts) — men en
  // SeasonSummary skapad FÖRE den commiten bär fortfarande den gamla,
  // bevisligen felaktiga domen frusen i expectationVerdict/metExpectation
  // och i den bakade narrativeSummary-textens FÖRSTA mening. Ingen tidigare
  // migrering rörde detta. Räkna om domen från redan lagrade, stabila fält
  // (boardExpectation, finalPosition, playoffResult — ingen gissning) och,
  // BARA om den skiljer sig från vad som redan bakats in: skriv rätt dom
  // till de strukturerade fälten och bygg om ENDAST domsmeningen som en
  // separat verdictSentence. Resten av narrativeSummary (formtrend,
  // toppmålskytt, cupresultat, storylines) rörs ALDRIG — den är inte bevisat
  // fel, och att gissa ihop den på nytt för en gammal säsong är en annan,
  // riskablare operation än att rätta en binär dom. HistoryScreen.tsx visar
  // verdictSentence som en synlig rättelse bredvid den arkiverade
  // originaltexten när legacyVerdictWasCorrected är satt — skriver aldrig
  // tyst över den gamla texten.
  if (Array.isArray(data.seasonSummaries)) {
    data.seasonSummaries = (data.seasonSummaries as Record<string, unknown>[]).map(s => {
      const boardExpectation = s.boardExpectation as import('../../domain/enums').ClubExpectation | undefined
      const finalPosition = s.finalPosition as number | undefined
      if (boardExpectation === undefined || typeof finalPosition !== 'number') return s
      const isChampion = s.playoffResult === 'champion'
      const rating = computeSeasonVerdictRating(boardExpectation, finalPosition, 12)
      const correctVerdict = expectationVerdictFromRating(boardExpectation, rating, isChampion)
      if (s.expectationVerdict === correctVerdict) return s
      const clubName = (s.clubName as string | undefined) ?? ''
      const season = (s.season as number | undefined) ?? 0
      const verdictSentence = buildExpectationVerdictSentence(clubName, correctVerdict, finalPosition, boardExpectation, isChampion, season)
      return {
        ...s,
        expectationVerdict: correctVerdict,
        metExpectation: correctVerdict !== 'failed',
        verdictSentence,
        legacyVerdictWasCorrected: true,
      }
    })
  }
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
  if (data.facilityState === undefined) data.facilityState = migrateFacilityState((data.facilityProjects as LegacyFacilityProject[] | undefined) ?? [])
  if (data.boardObjectives === undefined) data.boardObjectives = []
  if (data.aiTransferLog === undefined) data.aiTransferLog = []
  // SLUTTEST RUNDA 3 (2026-08-08, punkt 3): startValue är ett nytt fält (krävs
  // för en riktig avståndsbaserad progressbar på lägre-är-bättre-mål). Saves
  // från före detta saknar det. currentValue som fallback-start är inte
  // historiskt korrekt (vi vet inte var laget stod när målet begärdes), men
  // ger en stapel som rör sig åt rätt håll i stället för en som ljuger.
  data.boardObjectives = (data.boardObjectives as Record<string, unknown>[]).map(obj =>
    obj.startValue === undefined ? { ...obj, startValue: obj.currentValue } : obj
  )
  if (data.boardObjectiveHistory === undefined) data.boardObjectiveHistory = []
  // KF4 (2026-06-21): konsolidera styrelsen till EN game.board[]. Slå ihop gammal
  // club.board (namn/kön/ålder, från managed-klubben) + gammal boardPersonalities
  // (personlighet + ev. extra ledamöter) per roll. Template-namn vinner. Sedan raderas
  // de gamla fälten. Saknas allt → defaultBoard från CLUB_TEMPLATES.
  if (data.board === undefined) {
    const clubId = (data.managedClubId as string) ?? ''
    const legacyPersonalities = data.boardPersonalities as LegacyBoardPersonality[] | undefined
    const managedRaw = Array.isArray(data.clubs)
      ? (data.clubs as Record<string, unknown>[]).find(c => c.id === clubId)
      : undefined
    const legacyClubBoard = managedRaw?.board as ClubBoardTemplate | undefined
    if (legacyClubBoard || legacyPersonalities) {
      data.board = mergeLegacyBoard(clubId, legacyClubBoard, legacyPersonalities)
    } else {
      data.board = defaultBoard(clubId)
    }
  }
  delete data.boardPersonalities
  if (data.trainerArc === undefined) data.trainerArc = { current: 'established', history: [], seasonCount: 1, bestFinish: 6, titlesWon: 0, consecutiveLosses: 0, consecutiveWins: 0, boardWarningGiven: false }
  // V1.0 — Journalist character (created on-demand if missing)
  if (data.journalist === undefined) data.journalist = null
  // Pool 1a/1e (2026-07-18) — doctor character (fromRole falls back gracefully if missing)
  if (data.doctor === undefined) data.doctor = null

  // ── localPolitician: ensure newer optional fields exist ───────────────
  if (data.localPolitician && typeof data.localPolitician === 'object') {
    const pol = data.localPolitician as Record<string, unknown>
    if (pol.mediaProfile === undefined) pol.mediaProfile = 'tystlåten'
    if (pol.personalInterest === undefined) pol.personalInterest = 'ingenting'
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
  if (data.mentorshipHistory === undefined) data.mentorshipHistory = []
  // managerProfile.diary (tidigare .narrativeLog) — se PÅSTÅENDEKARTAN-blocket
  // nedan, precis före version stamp: den flyttar BEFINTLIG data dit, denna
  // gamla raden satte bara tomt om saknat och skulle annars köras FÖRE
  // flytten och kollidera med den.
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

  // ── clubhouse på varje klubb (KF4: club.board utgår — styrelsen lever på game.board) ──
  // Tidigare seedades även club.board här (SPEC_INLEDNING_FAS_2). KF4 konsoliderade
  // styrelsen till game.board ovan; ev. kvarvarande stale club.board på gamla saves rensas.
  if (Array.isArray(data.clubs)) {
    data.clubs = (data.clubs as Record<string, unknown>[]).map(c => {
      if (c.clubhouse === undefined) {
        const template = CLUB_TEMPLATES.find(t => t.id === c.id)
        if (template) c.clubhouse = template.clubhouse
      }
      delete c.board
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

  // ── K2 — karriärstatistikens dubblering, retroaktiv rättning (SLUTTEST_KO.md,
  //    2026-08-19). Roten (K1, redan fixad `b4ad8279`): seasonEndProcessor.ts
  //    ADDERADE seasonStats till careerStats vid rollover, TROTS att
  //    statsProcessor.ts redan ackumulerar careerStats matchvis hela säsongen.
  //    Redan spelade saves bär den dubblade — eller vid flera rollovers,
  //    kompounderade — summan permanent i sin sparade careerStats. K1 stoppar
  //    framtida dubblering; K2 rättar det som redan hänt.
  //
  //    Jacobs dom (alternativ a): räkna om det som går. totalGames/totalGoals/
  //    totalAssists görs om till en REN härledning ur seasonHistory (redan
  //    avslutade säsonger, ligadel, redan kapad till senaste tio — samma
  //    gräns seasonHistory:s egen .slice(-10) redan sätter, ingen extra
  //    logik krävs för att hålla den) + seasonStats (innevarande säsongs
  //    LEVANDE ligatally — aldrig träffad av dubbleringsbuggen eftersom
  //    statsProcessor.ts skriver den matchvis, inte vid rollover).
  //    Cupdelen av redan avslutade säsonger finns inte bevarad någonstans
  //    (seasonCupStats nollställs varje rollover, arkiveras aldrig) — och
  //    allt bortom tio säsonger tillbaka är redan kastat ur seasonHistory.
  //    Båda FÖRBLIR förlorade, per domen: gissa aldrig bakåt, skriv ingen
  //    kompensation. En halverad men sann siffra slår en påhittad hel.
  //
  //    Körs varje laddning, ovillkorat — självläkande cache, inte en
  //    engångsflagga. En redan korrekt save räknar om till EXAKT samma tal
  //    den redan hade (seasonHistory+seasonStats ÄR sanningskällan;
  //    careerStats.totalGames/totalGoals/totalAssists blir en ren härledning
  //    av dem, aldrig mer en egen ackumulator som kan glida isär).
  //
  //    SÄKERHETSSPÄRR: kör bara om seasonHistory faktiskt är en array. En
  //    save från innan fältet fanns har seasonHistory===undefined — att då
  //    räkna om skulle nollställa en veterans hela karriär (värre än
  //    halverad, total förlust) istället för att lämna den orörd. Ingen data
  //    att räkna om ur betyder ingen ändring, inte en gissning.
  if (Array.isArray(data.players)) {
    data.players = (data.players as Record<string, unknown>[]).map(p => {
      if (!Array.isArray(p.seasonHistory)) return p
      const history = p.seasonHistory as Array<{ goals?: number; assists?: number; games?: number }>
      const current = p.seasonStats as { gamesPlayed?: number; goals?: number; assists?: number } | undefined
      const historyGames = history.reduce((sum, h) => sum + (h.games ?? 0), 0)
      const historyGoals = history.reduce((sum, h) => sum + (h.goals ?? 0), 0)
      const historyAssists = history.reduce((sum, h) => sum + (h.assists ?? 0), 0)
      const currentGames = current?.gamesPlayed ?? 0
      const currentGoals = current?.goals ?? 0
      const currentAssists = current?.assists ?? 0
      const prevCareer = (p.careerStats as Record<string, unknown> | undefined) ?? {}
      return {
        ...p,
        careerStats: {
          ...prevCareer,
          totalGames: historyGames + currentGames,
          totalGoals: historyGoals + currentGoals,
          totalAssists: historyAssists + currentAssists,
          seasonsPlayed: history.length + (currentGames > 0 ? 1 : 0),
        },
      }
    })
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

  // ── H1-uppföljning (människoupplevelse-audit 7024f8a, 2026-08-24): ledare_crisis
  // borttagen (Jacobs dom — captainSpeech är kanon, se eventFactories.ts). En
  // save med en ledare_crisis-arc mid-flight (building/peak/resolving) skulle
  // annars bli permanent spärrad: arcen matchar ingen typ-gren i progressArcs()
  // längre, räknas ändå mot canAddArc()s tak på 2 samtidiga icke-derby-arcer,
  // och kan aldrig själv resolvera/expira ur den koden. Ett kvarliggande
  // ledare_peak_event_-GameEvent (typ 'playerArc', delad med de andra
  // spelararcerna — kan inte filtreras på type) skulle bli en dinglande,
  // oresolverbar kort. Städas här, inte lämnat som en tyst landmine.
  if (Array.isArray(data.activeArcs)) {
    data.activeArcs = (data.activeArcs as Record<string, unknown>[]).filter(a => a.type !== 'ledare_crisis')
  }
  if (Array.isArray(data.pendingEvents)) {
    data.pendingEvents = (data.pendingEvents as { id?: string }[]).filter(
      e => !e.id?.startsWith('ledare_peak_event_')
    )
  }
  if (Array.isArray(data.inbox)) {
    data.inbox = (data.inbox as { id?: string }[]).filter(
      i => !i.id?.startsWith('inbox_ledare_building_inbox_')
    )
  }

  // ── PÅSTÅENDEKARTAN (2026-08-24): narrativeLog döpt om på tre olika register
  // (namnkollision, inte samma register — se SLUTTEST_KO.md post 58). Flyttar
  // BEFINTLIG DATA till de nya fältnamnen, rör inte bara `undefined` — en save
  // med en manager som redan har burnout/era-shift-poster eller en spelare med
  // en fylld karriärdagbok får annars den historiken tyst amputerad vid nästa
  // laddning, exakt den klass av fel dagens pass fixat sju andra instanser av.
  if (data.narrativeLog !== undefined) {
    data.narrativeBeatLog = data.narrativeLog
    delete data.narrativeLog
  }
  if (data.managerProfile && typeof data.managerProfile === 'object') {
    const mp = data.managerProfile as Record<string, unknown>
    if (mp.narrativeLog !== undefined) {
      mp.diary = mp.narrativeLog
      delete mp.narrativeLog
    } else if (mp.diary === undefined) {
      mp.diary = []
    }
  }
  if (Array.isArray(data.players)) {
    data.players = (data.players as Record<string, unknown>[]).map(p => {
      if (p.narrativeLog === undefined) return p
      const { narrativeLog, ...rest } = p
      return { ...rest, diary: narrativeLog }
    })
  }

  // ── version stamp ────────────────────────────────────────────────────────
  data.version = CURRENT_SAVE_VERSION

  return data as unknown as SaveGame
}
