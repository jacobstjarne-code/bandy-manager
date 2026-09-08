import type { SaveGame } from '../entities/SaveGame'
import type { Player } from '../entities/Player'
import type { AcademyLevel } from '../entities/Academy'
import type { ClubLegend, EventLedgerEntry, StorylineEntry } from '../entities/Narrative'
import type { Scandal } from './scandalService'
import { facilityCompletedBeatKey } from './facilityService'
import { buildSeasonCalendar } from './scheduleGenerator'
import { buildStorylineResolutionLedgerEntry } from './storylineLedgerService'

type PlayerDiaryEntry = NonNullable<Player['diary']>[number]

function isKnownPlayerMilestoneCode(value: string): boolean {
  return value === 'first_team_debut'
    || value === 'first_team_goal'
    || value === 'academy_promotion'
    || /^hat_trick_\d+$/.test(value)
    || /^career_goals_\d+$/.test(value)
    || /^career_games_\d+$/.test(value)
}

function belongedToClubInSeason(player: Player, clubId: string, season: number): boolean {
  const seasonClub = (player.seasonHistory ?? []).find(item => item.season === season)?.clubId
  if (seasonClub) return seasonClub === clubId
  if (player.promotionSeason === season && player.academyClubId) return player.academyClubId === clubId
  return player.clubId === clubId
}

const CLUB_HISTORY_TYPES = new Set<EventLedgerEntry['type']>([
  'academy_promotion',
  'national_team_callup',
  'retirement',
  'facility_built',
  'scandal',
  'player_milestone',
  'storyline_resolution',
])

function legacyStorylineGlobalMatchday(storyline: StorylineEntry): number {
  const slot = buildSeasonCalendar(storyline.season).find(item =>
    item.type === 'league' && item.leagueRound === storyline.matchday,
  )
  return slot?.matchday ?? storyline.matchday
}

export function buildFacilityBuiltLedgerEntry(input: {
  nodeId: string
  season: number
  matchday: number
  clubId: string
  hasExactMatchday?: boolean
}): EventLedgerEntry {
  return {
    type: 'facility_built',
    semanticKey: facilityCompletedBeatKey({
      nodeId: input.nodeId,
      matchday: input.matchday,
      season: input.hasExactMatchday === false ? undefined : input.season,
    }),
    season: input.season,
    matchday: input.matchday,
    subject: { kind: 'club', id: input.clubId },
    significance: 35,
  }
}

export function buildAcademyPromotionLedgerEntry(input: {
  playerId: string
  clubId: string
  season: number
  matchday: number
}): EventLedgerEntry {
  return {
    type: 'academy_promotion',
    semanticKey: `academy_promotion_${input.playerId}_s${input.season}_m${input.matchday}`,
    season: input.season,
    matchday: input.matchday,
    subject: { kind: 'player', id: input.playerId },
    subject2: { kind: 'club', id: input.clubId },
    significance: 55,
  }
}

/** DOM_AKADEMI_LIGGARE §1: betalningen och löftet om nästa nivå. */
export function buildAcademyUpgradeStartedLedgerEntry(input: {
  clubId: string
  season: number
  matchday: number
  fromLevel: Exclude<AcademyLevel, 'elite'>
  toLevel: Exclude<AcademyLevel, 'basic'>
  costKr: number
  readySeason: number
}): EventLedgerEntry {
  return {
    type: 'academy_upgrade_started',
    semanticKey: `academy_upgrade_started_${input.clubId}_s${input.season}_${input.fromLevel}_${input.toLevel}`,
    season: input.season,
    matchday: input.matchday,
    clubId: input.clubId,
    subject: { kind: 'club', id: input.clubId },
    significance: 40,
    academyUpgrade: {
      fromLevel: input.fromLevel,
      toLevel: input.toLevel,
      costKr: input.costKr,
      readySeason: input.readySeason,
    },
  }
}

/** DOM_AKADEMI_LIGGARE §1: sommaren då den köpta nivån faktiskt slår till. */
export function buildAcademyUpgradeCompletedLedgerEntry(input: {
  clubId: string
  season: number
  matchday: number
  level: Exclude<AcademyLevel, 'basic'>
}): EventLedgerEntry {
  return {
    type: 'academy_upgrade_completed',
    semanticKey: `academy_upgrade_completed_${input.clubId}_s${input.season}_${input.level}`,
    season: input.season,
    matchday: input.matchday,
    clubId: input.clubId,
    subject: { kind: 'club', id: input.clubId },
    significance: 55,
    academyUpgrade: { level: input.level },
  }
}

/** DOM_AKADEMI_LIGGARE §1: ett nytt mentorband, med startvärdena frusna. */
export function buildMentorshipStartedLedgerEntry(input: {
  clubId: string
  season: number
  matchday: number
  juniorId: string
  mentorId: string
  juniorCaAtStart: number
  developmentRateAtStart: number
}): EventLedgerEntry {
  return {
    type: 'mentorship_started',
    semanticKey: `mentorship_started_${input.juniorId}_${input.mentorId}_s${input.season}`,
    season: input.season,
    matchday: input.matchday,
    clubId: input.clubId,
    subject: { kind: 'player', id: input.juniorId },
    subject2: { kind: 'player', id: input.mentorId },
    significance: 35,
    mentorship: {
      mentorId: input.mentorId,
      juniorCaAtStart: input.juniorCaAtStart,
      developmentRateAtStart: input.developmentRateAtStart,
    },
  }
}

/** DOM_AKADEMI_LIGGARE §1: utfallet när ett befintligt mentorband stängs. */
export function buildMentorshipEndedLedgerEntry(input: {
  clubId: string
  season: number
  matchday: number
  juniorId: string
  mentorId: string
  reason: 'graduated' | 'promoted' | 'aged_out' | 'cancelled'
  juniorCaAtEnd: number
  seasons: number
}): EventLedgerEntry {
  return {
    type: 'mentorship_ended',
    semanticKey: `mentorship_ended_${input.juniorId}_${input.mentorId}_s${input.season}_${input.reason}`,
    season: input.season,
    matchday: input.matchday,
    clubId: input.clubId,
    subject: { kind: 'player', id: input.juniorId },
    subject2: { kind: 'player', id: input.mentorId },
    significance: 50,
    mentorship: {
      reason: input.reason,
      juniorCaAtEnd: input.juniorCaAtEnd,
      seasons: input.seasons,
    },
  }
}

/** DOM_AKADEMI_LIGGARE §1/§6: alla kullvägar skriver samma kanoniska typ. */
export function buildYouthIntakeLedgerEntry(input: {
  clubId: string
  season: number
  matchday: number
  count: number
  topProspectId?: string
  topProspectStars?: number
  academyLevel: AcademyLevel
  source: 'summer' | 'school' | 'partner'
}): EventLedgerEntry {
  return {
    type: 'youth_intake',
    semanticKey: `youth_intake_${input.clubId}_s${input.season}_${input.source}`,
    season: input.season,
    matchday: input.matchday,
    clubId: input.clubId,
    subject: { kind: 'club', id: input.clubId },
    significance: 35 + ((input.topProspectStars ?? 0) >= 4 ? 15 : 0),
    youthIntake: {
      count: input.count,
      topProspectId: input.topProspectId,
      topProspectStars: input.topProspectStars,
      academyLevel: input.academyLevel,
      source: input.source,
    },
  }
}

/**
 * akademi-junior-fyller-20 (DOM_AKADEMI_LIGGARE_2026-09-04 §4/§1). subject
 * = junioren; `subjectSnapshot` fylls av `logEvent` vid skrivtillfället
 * (spelaren finns ännu i game.youthTeam.players just då, men är borta ur
 * den arrayen så fort rollover eller uppflyttningen kört). significance
 * 45 bas, 60 om ≥3 stjärnor (samma tröskel som beslutskortet).
 */
export function buildYouthAgedOutLedgerEntry(input: {
  playerId: string
  clubId: string
  season: number
  matchday: number
  outcome: 'released' | 'other_club'
  stars: number
  caAtExit: number
}): EventLedgerEntry {
  return {
    type: 'youth_aged_out',
    semanticKey: `youth_aged_out_${input.playerId}_s${input.season}`,
    season: input.season,
    matchday: input.matchday,
    clubId: input.clubId,
    subject: { kind: 'player', id: input.playerId },
    significance: input.stars >= 3 ? 60 : 45,
    youthAgedOut: { outcome: input.outcome, stars: input.stars, caAtExit: input.caAtExit },
  }
}

/**
 * liggare-ny-board-verdict (RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md §3):
 * styrelsens säsongsdom, satt vid säsongsslut ur samma redan beräknade
 * `boardTruth`/`objectiveOutcome` seasonEndProcessor.ts fryser till
 * `SeasonSummary`. En post, inte en ny modell.
 */
export function buildBoardVerdictLedgerEntry(input: {
  clubId: string
  season: number
  matchday: number
  verdict: 'exceeded' | 'met' | 'failed'
  objectiveStatus: 'met' | 'partial' | 'failed'
  patienceBand: 'stabilt' | 'under_press' | 'ultimatum'
  /** Höjer significance till 60 när förra säsongens post också var 'failed' — se anropsstället. */
  repeatedFailure: boolean
}): EventLedgerEntry {
  return {
    type: 'board_verdict',
    semanticKey: `board_verdict_${input.clubId}_s${input.season}`,
    season: input.season,
    matchday: input.matchday,
    clubId: input.clubId,
    subject: { kind: 'club', id: input.clubId },
    significance: input.repeatedFailure ? 60 : 45,
    boardVerdict: {
      verdict: input.verdict,
      objectiveStatus: input.objectiveStatus,
      patienceBand: input.patienceBand,
    },
  }
}

/**
 * liggare-ny-license-event (RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md §3):
 * significance 50/75/95 per MASTER_OPPET-radens skiss. 'cleared' delar
 * 'first_warning'-tröskeln (50) — båda är "zonen ändrades, måttligt
 * anmärkningsvärt", inte de eskalerande brotten 'point_deduction'/
 * 'license_denied' bär (75/95). Ett medvetet val (radens tre siffror
 * täcker fyra statusar), inte en gissning — dokumenterat här i stället för
 * en fjärde uppfunnen nivå.
 */
export function buildLicenseEventLedgerEntry(input: {
  clubId: string
  season: number
  matchday: number
  status: 'cleared' | 'first_warning' | 'point_deduction' | 'license_denied'
  deficitKr?: number
  pointsDeducted?: number
}): EventLedgerEntry {
  const significance = input.status === 'point_deduction' ? 75
    : input.status === 'license_denied' ? 95
    : 50
  return {
    type: 'license_event',
    semanticKey: `license_event_${input.clubId}_s${input.season}`,
    season: input.season,
    matchday: input.matchday,
    clubId: input.clubId,
    subject: { kind: 'club', id: input.clubId },
    significance,
    licenseEvent: {
      status: input.status,
      ...(input.deficitKr !== undefined ? { deficitKr: input.deficitKr } : {}),
      ...(input.pointsDeducted !== undefined ? { pointsDeducted: input.pointsDeducted } : {}),
    },
  }
}

/**
 * liggare-ny-facility-trial-outcome (RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md
 * §3): significance 50/65 per MASTER_OPPET-radens skiss — "50 (65 vid
 * nej/nedlagd)". Ett rent röstningsbordläggning ('bordlagd'-outcome) är den
 * enda som stannar på 50; alla nej-svar och alla nedlagd-utfall (oavsett
 * `stage`) väger tyngre.
 */
export function buildFacilityTrialOutcomeLedgerEntry(input: {
  clubId: string
  season: number
  matchday: number
  stage: 'bordlagd' | 'nedlagd'
  outcome: 'bordlagd' | 'nedlagd_fall' | 'nedlagd_egen' | 'kommun_nej' | 'nedlagd_ingen_finansiering'
  support: number
}): EventLedgerEntry {
  const significance = input.outcome === 'bordlagd' ? 50 : 65
  return {
    type: 'facility_trial_outcome',
    semanticKey: `facility_trial_outcome_${input.clubId}_s${input.season}`,
    season: input.season,
    matchday: input.matchday,
    clubId: input.clubId,
    subject: { kind: 'club', id: input.clubId },
    significance,
    facilityTrialOutcome: {
      stage: input.stage,
      outcome: input.outcome,
      support: input.support,
    },
  }
}

/**
 * liggare-ny-community-shift: de tre trösklarna radens beskrivning namnger
 * ordagrant ("när orten korsar 30/50/70"). En ren tröskel-korsning, INTE en
 * ny amount/probability-ramp — D031:s "gata aldrig en effekt bakom cs>N"
 * (communityStandingScaling.ts) gäller inte här, samma sak repMilestone-
 * mönstret (cs>55/cs<45-band) redan är undantaget: en diskret narrativ
 * milstolpe, inte en gömd effekt-vägg.
 *
 * Returnerar null om `from`/`to` inte korsar någon av de tre trösklarna
 * (t.ex. en liten rörelse inom samma band) — anropsstället skriver då ingen
 * post, samma "max en per omgång, bara vid faktisk händelse"-disciplin som
 * hallProcess-utfallen.
 */
const COMMUNITY_SHIFT_THRESHOLDS = [30, 50, 70]

export function detectCommunityShiftDirection(from: number, to: number): 'up' | 'down' | null {
  if (to === from) return null
  for (const threshold of COMMUNITY_SHIFT_THRESHOLDS) {
    if (from < threshold && to >= threshold) return 'up'
    if (from >= threshold && to < threshold) return 'down'
  }
  return null
}

export function buildCommunityShiftLedgerEntry(input: {
  clubId: string
  season: number
  matchday: number
  from: number
  to: number
  direction: 'up' | 'down'
}): EventLedgerEntry {
  return {
    type: 'community_shift',
    semanticKey: `community_shift_${input.clubId}_s${input.season}_m${input.matchday}`,
    season: input.season,
    matchday: input.matchday,
    clubId: input.clubId,
    subject: { kind: 'club', id: input.clubId },
    significance: 55,
    communityShift: { from: input.from, to: input.to, direction: input.direction },
  }
}

/** liggare-ny-letter: significance 40 per MASTER_OPPET-radens skiss. */
export function buildLetterLedgerEntry(input: {
  clubId: string
  season: number
  matchday: number
  letterId: string
  kind: 'fan_mail'
  senderName: string
  senderAge?: number
}): EventLedgerEntry {
  return {
    type: 'letter',
    semanticKey: `letter_${input.clubId}_${input.letterId}`,
    season: input.season,
    matchday: input.matchday,
    clubId: input.clubId,
    subject: { kind: 'club', id: input.clubId },
    subjectSnapshot: { name: input.senderName, ...(input.senderAge !== undefined ? { age: input.senderAge } : {}) },
    significance: 40,
    letter: { letterId: input.letterId, kind: input.kind },
  }
}

export function buildNationalTeamCallupLedgerEntry(input: {
  playerId: string
  clubId: string
  season: number
  matchday: number
}): EventLedgerEntry {
  return {
    type: 'national_team_callup',
    semanticKey: `national_team_callup_${input.playerId}_s${input.season}_m${input.matchday}`,
    season: input.season,
    matchday: input.matchday,
    subject: { kind: 'player', id: input.playerId },
    subject2: { kind: 'club', id: input.clubId },
    significance: 60,
  }
}

export function buildRetirementLedgerEntry(legend: ClubLegend, clubId: string): EventLedgerEntry | null {
  if (!legend.playerId) return null
  return {
    type: 'retirement',
    semanticKey: `retirement_${legend.playerId}_s${legend.retiredSeason}`,
    season: legend.retiredSeason,
    matchday: 22,
    subject: { kind: 'player', id: legend.playerId },
    subject2: { kind: 'club', id: clubId },
    significance: 90,
  }
}

export function buildScandalLedgerEntry(scandal: Scandal, managedClubId: string): EventLedgerEntry | null {
  if (scandal.affectedClubId !== managedClubId) return null
  return {
    type: 'scandal',
    semanticKey: scandal.id,
    season: scandal.season,
    matchday: scandal.triggerRound,
    subject: { kind: 'club', id: scandal.affectedClubId },
    subject2: scandal.secondaryClubId
      ? { kind: 'club', id: scandal.secondaryClubId }
      : undefined,
    significance: 70,
  }
}

/**
 * Player.diary är en cappad vy-cache. Bara strukturerat igenkännbara,
 * permanenta milstolpar får flyttas till kanon; fri text eller form/skada
 * ska aldrig smugglas in i semanticKey.
 */
export function getPlayerMilestoneCode(entry: PlayerDiaryEntry): string | null {
  if (entry.type !== 'milestone') return null
  if (entry.semanticKey && isKnownPlayerMilestoneCode(entry.semanticKey)) return entry.semanticKey

  const text = entry.text.toLowerCase()
  if (text.includes('första a-lagsmål') || text === 'första målet.') return 'first_team_goal'
  if (text.includes('a-lagsdebut')) return 'first_team_debut'

  const hatTrick = entry.text.match(/hattrick[^\d]*(\d+) mål/i)
  if (hatTrick) return `hat_trick_${hatTrick[1]}`
  const careerGoals = entry.text.match(/mål nummer (\d+)/i)
  if (careerGoals) return `career_goals_${careerGoals[1]}`
  const careerGames = entry.text.match(/match nummer (\d+)/i)
  if (careerGames) return `career_games_${careerGames[1]}`
  if (text.includes('tar klivet upp till a-laget')) return 'academy_promotion'
  return null
}

export function buildPlayerMilestoneLedgerEntry(
  playerId: string,
  clubId: string,
  entry: PlayerDiaryEntry,
): EventLedgerEntry | null {
  const code = getPlayerMilestoneCode(entry)
  if (!code) return null
  const significance = code.includes('_100') ? 60
    : code === 'first_team_debut' || code === 'first_team_goal' ? 40
    : 35
  return {
    type: 'player_milestone',
    semanticKey: `player_milestone:${playerId}:s${entry.season}:m${entry.matchday}:${code}`,
    season: entry.season,
    matchday: entry.matchday,
    subject: { kind: 'player', id: playerId },
    subject2: { kind: 'club', id: clubId },
    significance,
  }
}

export function getPlayerMilestoneCodeFromLedger(entry: EventLedgerEntry): string | null {
  if (entry.type !== 'player_milestone') return null
  const code = entry.semanticKey.match(/:([^:]+)$/)?.[1]
  return code && isKnownPlayerMilestoneCode(code) ? code : null
}

export function getFacilityNodeIdFromLedger(entry: EventLedgerEntry): string | null {
  if (entry.type !== 'facility_built' || !entry.semanticKey.startsWith('facility_completed_')) return null
  return entry.semanticKey
    .replace(/^facility_completed_/, '')
    .replace(/_s\d+_m\d+$/, '') || null
}

function appendUnique(existing: EventLedgerEntry[], additions: EventLedgerEntry[]): EventLedgerEntry[] {
  const seen = new Set(existing.map(entry => `${entry.type}|${entry.semanticKey}`))
  const unique = additions.filter(entry => {
    const key = `${entry.type}|${entry.semanticKey}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return unique.length === 0 ? existing : [...existing, ...unique]
}

/**
 * Laddinfrastrukturens idempotenta strangler-backfill. Den tar bara
 * strukturerat beläggbara, historiska händelser vars läsare flyttats till
 * liggaren. Cache/live-state (journalistminne, Efterklang och cooldowns)
 * ligger uttryckligen kvar i sina egna lager.
 */
export function backfillClubHistoryLedger(game: SaveGame): EventLedgerEntry[] {
  const clubForSeason = (season: number): string | undefined => {
    const summaryClubs = [...new Set(
      (game.seasonSummaries ?? [])
        .filter(summary => summary.season === season)
        .map(summary => summary.clubId)
        .filter((clubId): clubId is string => typeof clubId === 'string'),
    )]
    if (summaryClubs.length === 1) return summaryClubs[0]
    const spellClubs = [...new Set(
      (game.managerProfile?.clubSpells ?? [])
        .filter(spell => season >= spell.fromSeason && (spell.toSeason === undefined || season <= spell.toSeason))
        .map(spell => spell.clubId),
    )]
    if (spellClubs.length === 1) return spellClubs[0]
    if (season === game.currentSeason) return game.managedClubId
    return undefined
  }
  const existing = (game.eventLedger ?? [])
    .filter(entry => entry && typeof entry.semanticKey === 'string')
    .map(entry => {
      const withManager = !entry.managerId && (entry.type === 'decision' || entry.type === 'manager_burnout')
        ? { ...entry, managerId: game.id }
        : entry
      if (withManager.clubId) return withManager
      const clubId = clubForSeason(entry.season)
      return clubId
        ? { ...withManager, clubId }
        : { ...withManager, clubId: game.managedClubId, clubIdInferred: true }
    })
  const additions: EventLedgerEntry[] = []
  const managedClubId = game.managedClubId
  if (typeof managedClubId !== 'string') return existing

  for (const [nodeId, season] of Object.entries(game.facilityState?.builtSeasons ?? {})) {
    const completion = (game.facilityState?.unseenCompletedFacilities ?? [])
      .filter(item => item.nodeId === nodeId && item.season === season)
      .sort((a, b) => b.matchday - a.matchday)[0]
    additions.push(buildFacilityBuiltLedgerEntry({
      nodeId,
      season,
      matchday: completion?.matchday ?? 1,
      clubId: managedClubId,
      hasExactMatchday: completion !== undefined,
    }))
  }

  for (const player of game.players ?? []) {
    if (
      player.promotedFromAcademy
      && player.promotionSeason !== undefined
      && belongedToClubInSeason(player, managedClubId, player.promotionSeason)
    ) {
      additions.push(buildAcademyPromotionLedgerEntry({
        playerId: player.id,
        clubId: managedClubId,
        season: player.promotionSeason,
        matchday: player.promotionRound ?? 1,
      }))
    }
    if (
      player.firstNationalTeamCallupSeason !== undefined
      && belongedToClubInSeason(player, managedClubId, player.firstNationalTeamCallupSeason)
    ) {
      additions.push(buildNationalTeamCallupLedgerEntry({
        playerId: player.id,
        clubId: managedClubId,
        season: player.firstNationalTeamCallupSeason,
        matchday: player.firstNationalTeamCallupMatchday ?? 1,
      }))
    }
    for (const diaryEntry of player.diary ?? []) {
      if (!belongedToClubInSeason(player, managedClubId, diaryEntry.season)) continue
      const ledgerEntry = buildPlayerMilestoneLedgerEntry(player.id, managedClubId, diaryEntry)
      if (ledgerEntry) additions.push(ledgerEntry)
    }
  }

  for (const summary of game.seasonSummaries ?? []) {
    const goal = summary.personalGoal
    if (goal?.type !== 'playerCarry' || !goal.referenceId || !summary.clubId) continue
    additions.push({
      type: 'player_milestone',
      semanticKey: `player_milestone:${goal.referenceId}:s${summary.season}:m0:manager_personal_goal`,
      clubId: summary.clubId,
      managerId: game.id,
      season: summary.season,
      matchday: 0,
      subject: { kind: 'player', id: goal.referenceId },
      subject2: { kind: 'club', id: summary.clubId },
      significance: 40,
      madeByPlayer: true,
    })
  }

  const scandals = [...(game.scandalHistory ?? []), ...(game.activeScandals ?? [])]
  for (const scandal of scandals) {
    const entry = buildScandalLedgerEntry(scandal, managedClubId)
    if (entry) additions.push(entry)
  }

  for (const legend of game.clubLegends ?? []) {
    const entry = buildRetirementLedgerEntry(legend, managedClubId)
    if (entry) additions.push(entry)
  }

  for (const storyline of game.storylines ?? []) {
    if (!storyline.resolved) continue
    if (storyline.clubId && storyline.clubId !== managedClubId) continue
    const anchoredPlayerIds = [...new Set([
      ...(storyline.playerId ? [storyline.playerId] : []),
      ...(storyline.playerIds ?? []),
    ])]
    if (!storyline.clubId && anchoredPlayerIds.length > 0) {
      const belongs = anchoredPlayerIds.some(playerId => {
        const player = game.players.find(item => item.id === playerId)
        return player ? belongedToClubInSeason(player, managedClubId, storyline.season) : false
      })
      if (!belongs) continue
    }
    const entry = buildStorylineResolutionLedgerEntry(
      storyline,
      legacyStorylineGlobalMatchday(storyline),
    )
    if (entry) additions.push(entry)
  }

  return appendUnique(
    existing,
    additions
      .filter(entry => CLUB_HISTORY_TYPES.has(entry.type))
      .map(entry => entry.clubId ? entry : { ...entry, clubId: managedClubId }),
  )
}
