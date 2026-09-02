/**
 * O13 / M11 — TRÄNARMARKNADEN, klubbytet (DOM_TRANARMARKNADEN_2026-08-26.md).
 *
 * "Inte en ny värld. Ligan, klubbarna, spelarna och din historik står kvar.
 * Det är hela värdet."
 *
 * Därför anropas `generateWorld` INTE här. Den bygger klubbar och spelare från
 * grunden ur ett seed — att köra den igen hade gett samma tolv klubbnamn men
 * med alla spelare återställda till startvärden, alla transfers ogjorda och
 * all tabellhistorik borta. `worldSeed` (K4) läses och BEVARAS genom bytet;
 * dess roll är att göra den NYA klubbens folk deterministiska, inte att
 * återskapa världen. Det är den konsument K4 väntat på sedan 19 augusti.
 *
 * Fälten nedan är uppdelade i tre högar, och uppdelningen är hela
 * korrektheten i funktionen:
 *
 *   VÄRLD — rörs aldrig. clubs, players, league, fixtures, standings,
 *   seasonCalendar, cupBracket, playoffBracket, transferState, aiCoaches,
 *   referees, pointDeductions, worldSeed, ruleVersion.
 *
 *   KARRIÄR — följer managern. seasonSummaries (varje post bär sin egen
 *   clubId — det är den frysningen som gör en tvåklubbskarriär läsbar,
 *   se HistoryScreen), managerProfile, trainerArc, refereeRelations,
 *   narrativeBeatLog/shownScenes/shownBeats (vad managern REDAN fått
 *   förklarat för sig ska inte förklaras igen).
 *
 *   KLUBB — nollställs och genereras om. Styrelse, patron, kommunalråd,
 *   journalist, doktor, mecenat, klack, volontärer, akademi, anläggning,
 *   sponsorer, klubbrekord, legendarer, brev, skoluppgifter, mentorskap,
 *   rivalitetsstatistik, kafferummets frågor. De handlar om EN klubb och blir
 *   fel i en annan.
 */

import type { SaveGame } from '../../domain/entities/SaveGame'
import type { ManagerProfile, ManagerClubSpell } from '../../domain/entities/ManagerProfile'
import { TrainingType, TrainingIntensity } from '../../domain/enums'
import { mulberry32 } from '../../domain/utils/random'
import { updatePlayerAvailability } from '../../domain/services/playerAvailabilityService'
import { createSeasonSignature } from '../../domain/services/seasonSignatureService'
import { generateAssistantCoach } from '../../domain/services/assistantCoachService'
import { calculateWageBudget } from '../../domain/services/wageBudgetService'
import { buildSeasonStartSquadSnapshot } from '../../domain/services/seasonStartSquadSnapshotService'
import {
  buildDefaultLineup,
  generateManagedClubEntourage,
  generateNamedCharacters,
  stampObjectiveStartValues,
} from './setupManagedClub'

/** Stabil, ordningsoberoende hash av ett klubb-id — saltar seedet per klubb. */
function clubSalt(clubId: string): number {
  let h = 0
  for (let i = 0; i < clubId.length; i++) h = ((h * 31 + clubId.charCodeAt(i)) | 0) >>> 0
  return h % 1_000_003
}

/**
 * Stänger den pågående klubbperioden och öppnar en ny. `seasonsAtClub`
 * nollställs — fältet betyder "säsonger i den här klubben", vilket ytorna som
 * läser det ("Säsong N i klubben") alltid menat. `careerSeasons` bär
 * karriärsumman i stället.
 */
export function advanceProfileToNewClub(
  profile: ManagerProfile,
  fromClubId: string,
  fromClubName: string,
  toClubId: string,
  toClubName: string,
  season: number,
): ManagerProfile {
  const existing = profile.clubSpells ?? []
  const careerSeasons = profile.careerSeasons ?? profile.seasonsAtClub

  // Gamla saves saknar clubSpells helt — perioden i den första klubben måste
  // rekonstrueras här, annars försvinner den ur karriären för alltid.
  const withFirstSpell: ManagerClubSpell[] = existing.length > 0
    ? existing
    : [{
        clubId: fromClubId,
        clubName: fromClubName,
        fromSeason: season - Math.max(0, profile.seasonsAtClub - 1),
      }]

  const closed = withFirstSpell.map((sp, i) =>
    i === withFirstSpell.length - 1 && sp.toSeason === undefined
      ? { ...sp, toSeason: season, endedBy: 'fired' as const }
      : sp
  )

  return {
    ...profile,
    seasonsAtClub: 1,
    careerSeasons,
    clubSpells: [...closed, { clubId: toClubId, clubName: toClubName, fromSeason: season }],
  }
}

/**
 * Byter managed klubb i en BEFINTLIG värld. Anropas när spelaren tackat ja
 * till ett erbjudande på tränarmarknaden.
 */
export function switchManagedClub(game: SaveGame, newClubId: string): SaveGame {
  const oldClubId = game.managedClubId
  const oldClub = game.clubs.find(c => c.id === oldClubId)
  const newClub = game.clubs.find(c => c.id === newClubId)
  if (!newClub) return game

  const season = game.currentSeason
  const entourageSeed = (((game.worldSeed ?? 42) + clubSalt(newClubId) + season * 1013) | 0) >>> 0
  const rand = mulberry32(entourageSeed + 12345)

  // Lönebudget sätts om för den nya klubben, samma formel som createNewGame.
  // hasIndoorArena rörs INTE (till skillnad från createNewGame, som tvingar
  // false på spelarens startklubb): det är en nybörjarregel för spelets
  // första klubb, inte ett världsfaktum. Att slå sönder en arena som redan
  // står där hade varit en världsmutation, vilket domen uttryckligen förbjuder.
  const wageBudget = calculateWageBudget(game.players, newClubId)
  const clubs = game.clubs.map(c => c.id === newClubId ? { ...c, wageBudget } : c)
  const managedClub = clubs.find(c => c.id === newClubId)!

  const entourage = generateManagedClubEntourage({
    clubId: newClubId,
    season,
    civicSeason: season,
    clubs,
    players: game.players,
    rand,
    entourageSeed,
    objectiveContext: {
      players: game.players,
      clubs,
      rivalryHistory: {},
      fanMood: 50,
      currentSeason: season,
      boardObjectiveHistory: [],
    },
  })

  const managerProfile = game.managerProfile
    ? advanceProfileToNewClub(
        game.managerProfile,
        oldClubId,
        oldClub?.name ?? oldClubId,
        newClubId,
        managedClub.name,
        season,
      )
    : undefined

  const switched: SaveGame = {
    ...game,

    // ── VÄRLD: orörd (allt som inte listas nedan kommer från ...game) ──────

    // ── KARRIÄR ──────────────────────────────────────────────────────────
    managedClubId: newClubId,
    managerProfile,
    managerFired: undefined,
    firedAtSeason: undefined,
    firedReason: undefined,
    careerBreak: undefined,

    // ── KLUBB: nollställd och omgenererad ────────────────────────────────
    clubs,
    managedClubPendingLineup: buildDefaultLineup(newClubId, game.players, managedClub),
    lineupConfirmedThisRound: false,
    managedClubTraining: { type: TrainingType.Physical, intensity: TrainingIntensity.Normal },
    trainingHistory: [],
    trainingProjects: [],
    managedClubPeriodisation: undefined,
    managedClubPeriodisationSince: undefined,
    captainPlayerId: undefined,
    chemistryStats: {},

    board: entourage.board,
    patron: entourage.patron,
    localPolitician: entourage.localPolitician,
    previousKommunBidrag: undefined,
    politicianLastInteraction: undefined,
    journalist: entourage.journalist,
    doctor: entourage.doctor,
    doctorQuestionsUsed: 0,
    mecenater: entourage.mecenater,
    supporterGroup: entourage.supporterGroup,
    volunteers: entourage.volunteers,
    volunteerMorale: {},
    localPaperName: entourage.localPaperName,
    communityActivities: entourage.communityActivities,
    // ANSPRÅK 4, spak 3: ny klubb, ny ort — klockan börjar om.
    communityActivitiesSince: {},
    sponsors: entourage.sponsors,
    namedCharacters: generateNamedCharacters(entourageSeed + 99991),
    assistantCoach: generateAssistantCoach(`${game.id}_${newClubId}`),

    youthTeam: entourage.youthTeam,
    academyLevel: 'basic',
    academyUpgradeInProgress: undefined,
    academyUpgradeSeason: undefined,
    facilityUpgradeSeason: undefined,
    youthIntakeHistory: [],
    facilityState: { builtNodeIds: [] },

    // Styrelsen är ny och börjar på nytt förtroende. 70 är samma startvärde
    // som en ny karriär får — den nya styrelsen känner varken meriterna eller
    // avskedet, den anställde just den här managern.
    boardPatience: 70,
    boardTrust: 0,
    consecutiveFailures: 0,
    meritBuffer: 0,
    boardAssessment: undefined,
    boardObjectives: entourage.boardObjectives,
    boardObjectiveHistory: [],
    seasonStartBoardExpectation: managedClub.boardExpectation,
    seasonStartFinances: managedClub.finances,
    seasonStartSquadSnapshot: buildSeasonStartSquadSnapshot(game.players, newClubId, season),
    seasonStartSnapshot: undefined,
    seasonContractExtensionCount: 0,
    seasonNetTransferSpend: 0,

    fanMood: 50,
    communityStanding: 50,
    communityStandingDelta: undefined,
    journalistRelationship: 50,
    sponsorNetworkMood: 70,

    licenseStatus: undefined,
    licenseRiskScore: undefined,
    licenseReview: undefined,
    licenseWarningCount: 0,
    financeWarningGivenThisSeason: false,
    wageBudgetOverrunRounds: 0,
    wageBudgetWarningSent: false,
    economicCrisisState: undefined,
    financeLog: [],

    // Klubbminnet: rekord, legendarer, brev, skoluppgifter, mentorband och
    // rivalitetsstatistik tillhör klubben, inte managern. Den gamla klubbens
    // versioner ligger kvar i DESS värld — de följer inte med hit.
    allTimeRecords: undefined,
    clubLegends: [],
    storylines: [],
    rivalryHistory: {},
    nemesisTracker: {},
    mentorships: [],
    mentorshipHistory: [],
    loanDeals: [],
    bandyLetters: [],
    bandyLetterThisSeason: undefined,
    schoolAssignmentArchive: [],
    schoolAssignmentThisSeason: undefined,
    recentMoments: [],
    currentEra: undefined,
    activeScandals: [],
    scandalHistory: [],
    activeAnniversaries: [],
    anniversariesSeen: [],
    lastTeamPhotoSeason: undefined,

    // Kafferummets frågor är samtal med DEN HÄR klubbens folk. Pensionerade
    // frågor och köade återkomster hör till människorna som ställde dem.
    lastCoffeeSceneRound: undefined,
    lastCoffeeSceneIndices: [],
    coffeeRoomAnsweredQuestions: [],
    coffeeRoomAnswers: {},
    coffeeRoomPendingReturns: [],
    lastCoffeeQuoteHash: undefined,

    // Inkorg och beslutsköer: allt i dem gällde den gamla klubben.
    inbox: [],
    pendingEvents: [],
    deferredDecisions: [],
    pendingContractDemands: undefined,
    pendingWeeklyDecision: undefined,
    resolvedWeeklyDecisions: [],
    weeklyDecisionLastRound: undefined,
    pendingRetirementDecision: undefined,
    pendingScreen: null,
    pendingScene: undefined,
    transferBids: [],
    handledContractPlayerIds: [],
    opponentAnalyses: {},
    scoutReports: {},
    activeScoutAssignment: null,
    scoutBudget: 10,
    activeTalentSearch: null,
    talentSearchResults: [],

    phaseMarksSeen: [],
    upptaktPhaseMarkSeenSeason: undefined,
    seenAnslag: [],
    visitedScreensThisRound: [],
    annandagsValGjort: null,
    pendingAnnandagsVal: false,
    pendingAnnandagsGratisentreVal: false,
    pendingAnnandagsMediaRubrik: undefined,
    pendingAnnandagsKlack: undefined,
    seasonGoalChosenForSeason: undefined,
    activeSeasonGoal: undefined,
    pendingSeasonTransitionEvents: [],
    seasonDecisionCandidates: [],
  }

  const signature = createSeasonSignature(
    switched,
    mulberry32(entourageSeed + season * 1337 + 99),
  )

  const withAvailability: SaveGame = {
    ...switched,
    players: updatePlayerAvailability(switched),
    currentSeasonSignature: signature,
  }

  return {
    ...withAvailability,
    // Samma efterbehandling som createNewGame: utan den visar nivåmålen en
    // falsk nolla tills första avstämningen (SLUTTEST 2026-08-08 punkt 4b).
    boardObjectives: stampObjectiveStartValues(withAvailability.boardObjectives ?? [], withAvailability),
  }
}
