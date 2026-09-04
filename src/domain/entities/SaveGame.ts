import type { PendingScreen, ClubExpectation } from '../enums'
import type { MatchdaySlot } from '../services/scheduleGenerator'
import type { NotableEventType } from '../data/klackEchoText'
import type { PortalPhase } from '../data/seasonPhases'
import type { SeasonSignature } from './SeasonSignature'
import type { Club, BoardMember, BoardRole, BoardPersonality, TacticChangeLogEntry } from './Club'
import type { Player } from './Player'
import type { League } from './League'
import type { Fixture, TeamSelection } from './Fixture'
import type { MatchWeather } from './Weather'
import type { TrainingFocus, TrainingSession, TrainingProject } from './Training'
import type { PlayoffBracket, PlayoffEliminationInfo } from './Playoff'
import type { CupBracket } from './Cup'
import type { SeasonSummary, SeasonGoalType } from './SeasonSummary'
import type { ScoutReport, ScoutAssignment } from './Scouting'
import type { YouthTeam, Mentorship, MentorshipRecord, LoanDeal, AcademyLevel } from './Academy'
import type { GameEvent, GameEventType, TransferBid } from './GameEvent'
import type { OpponentAnalysis } from '../services/opponentAnalysisService'
import type { StandingRow } from './Standing'
import type { InboxItem } from './Inbox'
import type { TransferOffer, TransferState } from './Transfer'
import type { Sponsor } from './Sponsor'
import type { TalentSearchRequest, TalentSuggestion, TalentSearchResult } from './TalentSearch'
import type { RoundSummaryData } from './RoundSummary'
import type { Moment, MomentSource } from './Moment'
import type { AssistantCoach } from './AssistantCoach'
import type { PendingScene, SceneId } from './Scene'

/** En enda källa för save-schemats version, både vid skapande och migrering. */
export const CURRENT_SAVE_VERSION = '0.3.10'

import type { Mecenat, MecenatType, MecenatPersonality, MecenatDemand, SocialEvent } from './Mecenat'
import type { Referee, RefereeRelation } from './Referee'
import type { CommunityActivities, CommunityActivitiesSince, StaleableActivityKey, Patron, PatronPersonality, LocalPolitician, PoliticalAgenda, PoliticianInteractionLog, FacilityFinancingMode, BoardObjective, SupporterGroup, SupporterCharacter, SupporterRole, MediaProfile, PersonalInterest, FacilityGren, FacilityConsequence, NodeFinancing, FacilityNodeDef, FacilityNodeView, FacilityNodeStatus, FacilityState } from './Community'
import type { Journalist, JournalistPersona, JournalistMemory, TrainerArc, ArcPhase, ArcTransition, StorylineEntry, StorylineType, ClubLegend, AllTimeRecords, NamedCharacter, ArcType, ActiveArc, BandyLetter, SchoolAssignmentRecord, NarrativeLogEntry, EventLedgerType, LedgerConsequence, EventLedgerEntry, LedgerToldRegistry } from './Narrative'
import type { DoctorIdentity } from '../data/injuryDoctorText'

// ── Legibel konsekvens — domino-kedje-typer (används av rippleEffectService + portalBeats) ──
// ÖVERLÄMNING 2 steg 3-underlag (2026-08-12): scope skiljer sju klubbomfattande
// hinkar (Stämningen/Klacken/Orten/Styrelsen/Sponsorerna/Kassan/Transferbudget)
// från en enskild persons fält (Moralen). Odifferentierat i samma array lär
// läsaren att en spelares humör väger lika mycket som hela klubbens — det gör
// det inte. 'club' är default (alla sju ursprungliga steg), 'player' bara för
// steg som diffar ett specifikt event.relatedPlayerId-fält.
// ÖVERLÄMNING 2 steg 3 (2026-08-16): magnitude — tre nivåer, tröskel per
// fälttyp (humör-fält: absoluta poäng, ekonomi-fält: andel av wageBudget,
// se humorMagnitude/economyMagnitude i rippleEffectService.ts). Avgör vilken
// av de tre textraderna i rippleChainText.ts som visas för steget.
export interface RippleChainStep { label: string; dir: 'up' | 'down'; scope: 'club' | 'player'; magnitude: 'knappt' | 'tydligt' | 'kraftigt' }
export interface RippleChain {
  trigger: 'star_injured' | 'big_derby_win' | 'mecenat_left'
    // MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md Fas 1 (orsakVerkanService.ts):
    // den riktiga beslutsidentiteten bärs som EventLedgerEntry.semanticKey.
    // Det returnerade RippleChain-objektet är transient (bara .steps läses,
    // aldrig lagrat/routat på trigger-namnet).
    | 'decision'
  subjectName?: string
  round: number
  season: number
  steps: RippleChainStep[]
}

/**
 * Lokalt kvitto på ett löst val. `eventType` och `madeByPlayer` lades till
 * för U9:s val-entropi; de är optional för att äldre exporterade saves ska
 * fortsätta kunna laddas. Analysen räknar aldrig poster där attributionen
 * saknas, eftersom auto-resolverade val annars skulle se ut som spelarval.
 */
export interface ResolvedChoice {
  eventId: string
  eventType?: GameEventType
  choiceId: string
  label: string
  madeByPlayer?: boolean
}

// ── Re-exports so existing `import from '../entities/SaveGame'` still works ──
export type { Mecenat, MecenatType, MecenatPersonality, MecenatDemand, SocialEvent }
export type { CommunityActivities, CommunityActivitiesSince, StaleableActivityKey, Patron, PatronPersonality, LocalPolitician, PoliticalAgenda, PoliticianInteractionLog, FacilityFinancingMode, BoardObjective, SupporterGroup, SupporterCharacter, SupporterRole, MediaProfile, PersonalInterest, FacilityGren, FacilityConsequence, NodeFinancing, FacilityNodeDef, FacilityNodeView, FacilityNodeStatus, FacilityState }
export type { BoardMember, BoardRole, BoardPersonality }
export type { Journalist, JournalistPersona, JournalistMemory, TrainerArc, ArcPhase, ArcTransition, StorylineEntry, StorylineType, ClubLegend, AllTimeRecords, NamedCharacter, ArcType, ActiveArc, BandyLetter, SchoolAssignmentRecord, NarrativeLogEntry, EventLedgerType, LedgerConsequence, EventLedgerEntry, LedgerToldRegistry }
export type { StandingRow }
export type { InboxItem }
export type { TransferOffer, TransferState }
export type { Sponsor }
export type { TalentSearchRequest, TalentSuggestion, TalentSearchResult }
export type { RoundSummaryData }

export type { Moment, MomentSource }
export type { AssistantCoach, CoachPersonality, CoachBackground } from './AssistantCoach'

export type ClubEra = 'survival' | 'fotfaste' | 'establishment' | 'legacy'

export interface YouthIntakeRecord {
  season: number
  clubId: string
  date: string
  playerIds: string[]
  topProspectId?: string
}

/**
 * 5.1 Sommaren (SLUTTEST_KO.md, 2026-08-18) — "Medan du var borta"-radernas
 * källa. Fyra typer, ingen till: 'contractExpired' (kontraktet gick ut,
 * spelaren blev fri agent), 'retired' (la av), 'aged' (den äldsta spelaren
 * i truppen efter årets åldersuppdatering — inte varje spelares födelsedag),
 * 'promoted' (akademiuppflyttning). retired/contractExpired/aged skrivs av
 * seasonEndProcessor.ts vid säsongsslut (de kan bara hända då). promoted
 * skrivs av academyActions.ts:s uppflyttningsaktion NÄR den händer (kan ske
 * när som helst under säsongen, inte bara vid övergången) — därför ackumuleras
 * listan under säsongen och töms av Sommarens CTA, inte av seasonEndProcessor.
 */
export interface SeasonTransitionEvent {
  type: 'contractExpired' | 'retired' | 'aged' | 'promoted'
  playerId: string
  playerLastName: string
  /** Bara satt för 'aged'. */
  age?: number
}

/**
 * Förutsättningsfasen, steg 1 (Jacobs dom 2026-08-25, DOM_FORUTSATTNINGSFASEN_
 * 2026-08-24.md + docs/incoming/Forutsattningsfasen-styrelsen-talar-2026-08-25.dc.html,
 * variant 1b). "Styrelsen talar" i Sommaren — kvittensrad + kravband (ribba,
 * riktning, skälsrad). Skrivs EN gång per säsongsslut i seasonEndProcessor.ts,
 * samma loop-varv som redan beräknar boardExpectation-stegningen för hanterad
 * klubb (generatePreSeasonMessage). Läses rent av SeasonTransitionScene.tsx,
 * ingen egen beräkning där — samma mönster som pendingSeasonTransitionEvents.
 *
 * STEG 1: kvittensrad + kravband. STEG 2: högst tre ligarörelser från
 * `aiTransferLog`/`standingsSnapshot` samt skälsradsurval från samma
 * underlag. Upp-/nedflyttningsraderna är avsiktligt vilande eftersom spelet
 * ännu saknar kanonisk divisionsrörelse; UI:t får aldrig hitta på den.
 */
export type BoardReasonSource = 'leagueMovement' | 'results' | 'aiTransfers'

/**
 * Fryst, omedelbar presentationspayload för Sommarens ligarörelser. Kanon
 * ligger kvar i aiTransferLog/SeasonSummary.standingsSnapshot; detta är bara
 * de högst tre fakta som valdes ut vid rollover så att vyn aldrig behöver
 * räkna om en gammal säsongs bedömning mot nyare historik.
 */
export type BoardLeagueMovement =
  | {
      type: 'transfer'
      playerName: string
      fromClubName: string
      toClubName: string
      fee: number
    }
  | {
      type: 'positionTrend'
      clubId: string
      clubName: string
      fromPosition: number
      toPosition: number
    }

export interface BoardAssessment {
  season: number
  previousExpectation: ClubExpectation
  newExpectation: ClubExpectation
  direction: 'raised' | 'lowered' | 'unchanged'
  /** Bara satt när direction !== 'unchanged' — "en ny ribba kan inte renderas utan sin rad." */
  reasonLine?: string
  /** Vilken deklarerad faktaklass skälsraden läser. Saknas när ribban är oförändrad. */
  reasonSource?: BoardReasonSource
  /** Del 2, "vad de vet om läget". Högst tre frysta, kanoniskt belagda fakta. */
  leagueMovements?: BoardLeagueMovement[]
  /**
   * Del 1, "vad de såg" — en kort kvittens av föregående säsong, INTE en
   * upprepning av årsboken (DOM:s ord: "styrelsens läsning av den").
   */
  seasonAcknowledgment: string
}

/**
 * Fryst medlemskap och CA vid starten av en manager-säsong. Årsbokens
 * `mostImproved` får inte härleda kandidatgruppen ur spelarens klubb vid
 * säsongsslut: en spelare kan ha utvecklats i klubben och därefter sålts.
 * `season` + `clubId` gör att en gammal snapshot aldrig kan återanvändas
 * efter rollover eller klubbyte.
 */
export interface SeasonStartSquadSnapshot {
  season: number
  clubId: string
  players: Array<{
    playerId: string
    playerName: string
    startCA: number
  }>
}

export interface SaveGame {
  id: string
  managerName: string
  managedClubId: string
  // K4 (SLUTTEST-KÖN, 2026-08-17): kan bara fyllas framåt, samma logik som
  // builtSeason (facilityService.ts) — undefined för saves skapade innan
  // detta fält fanns, ingen gissning bakåt. Ingen konsument ännu — se
  // domain/data/ruleVersion.ts för regelversionens motivering.
  worldSeed?: number
  ruleVersion?: string

  currentDate: string    // ISO date
  currentSeason: number
  currentMatchday: number   // Aktuell matchdag (för portal-seed) — alltid satt sedan A1-fix
  // Scene-system (SPEC_SCENES_FAS_1 + SPEC_KAFFERUMMET_FAS_1)
  pendingScene?: PendingScene          // Sätts av sceneTriggerService
  shownScenes?: SceneId[]              // Permanent historik (gäller ej recurring coffee_room)
  valetShownSeason?: number            // B1 — säsong då Valet-ceremonin visades (engångs/säsong, idiom som upptaktPhaseMarkSeenSeason). shownScenes duger ej — Valet är recurring per säsong från säsong 2.
  sceneChoices?: Record<string, string> // Spelarens val per sceneId
  lastCoffeeSceneRound?: number        // Round när senaste coffee_room visades
  lastCoffeeSceneIndices?: number[]    // rullande-12 historik av visade pool-index (undviks i nästa scen)

  // A2 (2026-07-19) — kafferummets frågor (COFFEE_ROOM_QUESTIONS). D1-D3.
  coffeeRoomAnsweredQuestions?: string[]   // questionId — pensionerad, ställs aldrig igen
  coffeeRoomAnswers?: Record<string, 'A' | 'B'>  // questionId → valt svar, för återkomsten (D3)
  coffeeRoomPendingReturns?: Array<{
    questionId: string
    answerId: 'A' | 'B'
    answeredMatchday: number
    /** Explicit deadline so rebasning cannot change the seeded 2–6-round delay. */
    dueMatchday?: number
  }>

  // Portal-beats (lättviktiga engångsmoment)
  shownBeats?: string[]                // Beat-nycklar som visats (format: beatId eller beatId_season)

  // Portal fas-markeringar (visas en gång per fas per säsong)
  // 2026-07-19: PortalPhase (inte SeasonPhase) — sjufasmodellens fasnamn
  // (annandagen/vinterkris/våroffensiv/slutspurt) + playoff/spectator.
  // Nollställs vid säsongsskifte i seasonEndProcessor.ts — annars ser en
  // spelare t.ex. annandagen en enda gång på tio säsonger.
  phaseMarksSeen: PortalPhase[]        // default [], nollställs varje säsongsskifte
  upptaktPhaseMarkSeenSeason?: number  // C-SD2: säsong då upptakt-PhaseMark visats (engångs/säsong)

  // Fas-anslag (säsongskapitel-overlay)
  seenAnslag?: import('../services/anslagService').AnslagKey[]

  /** Season calendar built once at season creation. Single source of truth for all date lookups. */
  seasonCalendar?: MatchdaySlot[]

  clubs: Club[]
  players: Player[]
  league: League
  fixtures: Fixture[]
  standings: StandingRow[]
  inbox: InboxItem[]

  transferState: TransferState
  youthIntakeHistory: YouthIntakeRecord[]
  matchWeathers: MatchWeather[]

  managedClubPendingLineup?: TeamSelection
  lineupConfirmedThisRound?: boolean
  managedClubTraining: TrainingFocus
  trainingHistory: TrainingSession[]
  trainingProjects?: TrainingProject[]

  tutorialSeen?: boolean          // deprecated — migration: if true, skip coachMarksSeen
  coachMarksSeen?: boolean         // deprecated — pensioneras med CoachMarks, ersatt av Tillträdet
  onboardingComplete?: boolean     // Tillträdet-flödet slutfört (sätts vid F4)
  /**
   * M1 (audit 5c9a7a8, 2026-08-24): vilken av de TVÅ onboarding-skärmarna
   * ("Ankomsten" /intro, "Tillträdet" /tilltrade) spelaren faktiskt är på.
   * Utan detta kunde routern bara skicka en avbruten spelare till
   * /tilltrade — aldrig till /intro — så ett avbrott mitt i Ankomsten
   * (t.ex. byte till annan save och tillbaka) hoppade över hela scenen
   * istf att återuppta den. Satt till 'arrival' vid createNewGame(), skrivs
   * till 'tilltrade' när ArrivalScene slutförs (setOnboardingScreen-
   * action). Gamla saves saknar fältet — migrationen backfyller 'tilltrade'
   * (bevarar tidigare beteende, INTE 'arrival', för att inte kasta en
   * redan-förbi-Ankomsten-spelare bakåt).
   */
  onboardingScreen?: 'arrival' | 'tilltrade'
  /**
   * M1: Tillträdets interna steg (F1 Ankomst/trupp, F2 Startelva, F3 Hörnan,
   * F4 Klart) — samma bugg som ovan men EN nivå djupare: TilltradeScreen.tsx
   * höll detta i lokal useState, så ett avbrott (byte till annan save och
   * tillbaka) dumpade spelaren på steg 1 igen, oavsett var de faktiskt var.
   * undefined = steg 1 (inte påbörjat/precis startat).
   */
  tilltradeStep?: 1 | 2 | 3 | 4
  dismissedHints?: string[]
  lastCompletedFixtureId?: string   // id of most recently completed managed-club fixture
  // O15 (2026-08-18/19, DOM 1b): Taktikens två lägen. tacticAdvancedMode persisteras
  // så "Avancerat" inte är en spärr man öppnar varje vecka (Jacobs villkor) —
  // satt via egen store-action (setTacticAdvancedMode, samma persistGameSnapshot-
  // mönster som preferredMatchMode). tacticChangeLog är avancerat lägets
  // "Vad du ändrat i år"-historik, se TacticChangeLogEntry (Club.ts).
  tacticAdvancedMode?: boolean
  tacticChangeLog?: TacticChangeLogEntry[]
  chemistryStats?: Record<string, number>  // key = sortedId1|sortedId2, value = shared minutes

  playoffBracket: PlayoffBracket | null
  cupBracket: CupBracket | null
  // A2 (långspelsaudit, 10 säsonger, 2026-08-17): resolved vid elimineringstillfället
  // i playoffProcessor.ts — AnslagOverlay läser detta direkt istf att härleda
  // motståndare/resultat ur playoffBracket vid render. Nollställs vid säsongsskifte
  // (seasonEndProcessor.ts) tillsammans med playoffBracket.
  lastPlayoffElimination?: PlayoffEliminationInfo | null

  pendingScreen?: PendingScreen | null
  seasonSummaries: SeasonSummary[]
  seasonStartFinances?: number  // club finances at season start
  /** Källan för årsbokens mostImproved. Saknas på legacy-saves där ett
   *  pågående säsongsstartsmedlemskap inte längre kan återskapas säkert. */
  seasonStartSquadSnapshot?: SeasonStartSquadSnapshot
  /** A-H1 (SEXSÄSONGSAUDITEN 2026-08-26, spår 2 rot a — "ett fält med flera
   *  semantiker"): managedClub.boardExpectation stegas till NÄSTA säsongs
   *  krav i seasonEndProcessor.ts INNAN generateSeasonSummary läser den —
   *  årsboken/historiken riskerade då att döma den AVSLUTADE säsongen mot
   *  ett krav som aldrig gällde under den. Samma mönster som seasonStartFinances
   *  ovan: satt i createNewGame.ts (initialt boardExpectation) och skrivs om
   *  i seasonEndProcessor.ts EFTER att generateSeasonSummary/generateSeasonVerdict/
   *  computeBoardPatienceUpdate redan läst det gamla värdet, till klubbens nya
   *  (stegade) boardExpectation — som då blir "säsongsstart" för NÄSTA
   *  varv. Alla retrospektiva ytor (årsbok, historik, styrelsebetyg-kortet,
   *  avskedsbeslutet) läser detta fältet, aldrig club.boardExpectation direkt,
   *  eftersom det senare kan redan vara framåtstegat vid läsningstillfället. */
  seasonStartBoardExpectation?: ClubExpectation

  /** Framgångskurvan steg 3 fix (2026-08-28) — DEDIKERADE, ocappade
   *  säsongsräknare för investSurplus (boardObjectiveService.ts). financeLog
   *  är arkitektoniskt en ROLLANDE VISNINGSLOGG (EkonomiTab "senaste
   *  transaktioner"), capad till FINANCE_LOG_MAX=50 poster DELAT över ALLA
   *  kategorier (economyService.ts) — en dominant klubbs säsong skriver
   *  180-330+ poster (5-9/omgång × 35-40 omgångar via cup/slutspel), så en
   *  tidig kontraktsförlängning eller transfer trängs ut ur loggen långt
   *  innan säsongsslut (empiriskt bevisat, se
   *  scripts/framgangskurvan-ansprak3-investsurplus-matning-2026-08-28.ts).
   *  Dessa två fält räknas i stället direkt vid handlingstillfället
   *  (renewContract i transferActions.ts, executeTransfer i
   *  transferService.ts) och nollställs vid säsongsstart, samma mönster
   *  som seasonStartFinances ovan (satt i createNewGame.ts, rullat i
   *  seasonEndProcessor.ts). financeLog-posterna skrivs fortfarande —
   *  detta ersätter bara COUNT-källan för investSurplus, inte visningsloggen. */
  seasonContractExtensionCount?: number
  /** Nettosumma av transfer_in/transfer_out DENNA säsong, samma teckenkonvention
   *  som FinanceEntry.amount: positivt = nettoINTÄKT (sålt mer än köpt),
   *  negativt = nettoUTGIFT (köpt mer än sålt). Se seasonContractExtensionCount
   *  ovan för varför detta inte längre härleds ur financeLog. */
  seasonNetTransferSpend?: number

  /** A-H2b (DOM_AH2B_RETENTION_2026-08-28) — obemötta marknadskrav beräknade
   *  vid säsongsslut (seasonEndProcessor.ts), för den hanterade klubbens
   *  aktiva förstalagsspelare vars `salary` ligger under
   *  `computeContractMinSalary` (economyService.ts). Presenteras samlat på
   *  PendingScreen.ContractDemands (mellan SeasonSummary och styrelsemötets
   *  scen) — se contractDemandService.ts för beräkning/tillämpning.
   *  Tömd (undefined) av resolveContractDemands (gameFlowActions.ts) när
   *  spelaren tagit ställning till varje krav. minSalary/currentSalary är
   *  ett ÖGONBLICKSVÄRDE från säsongsslutet — rörs inte om spelaren dröjer
   *  med beslutet. */
  pendingContractDemands?: import('../services/contractDemandService').ContractDemand[]

  scoutReports: Record<string, ScoutReport>    // key = playerId
  activeScoutAssignment: ScoutAssignment | null
  scoutBudget: number

  pendingEvents: GameEvent[]
  transferBids: TransferBid[]
  handledContractPlayerIds: string[]

  sponsors: Sponsor[]
  fanMood?: number  // 0-100, starts 50
  lastRivalSaleMatchday?: number  // C-T9 — matchday of most recent rival sale
  lastRivalSaleInfo?: {
    soldPlayerName: string
    buyerClubName: string
    buyerClubId: string
    /** Oföränderlig händelseaxel för Callback. Till skillnad från den separata
     *  recency-ankaren ovan rebases dessa två värden inte vid rollover. Valfria
     *  för bakåtkompatibilitet med saves skapade före fälten fanns. */
    saleSeason?: number
    saleMatchday?: number
  }  // B1 — för Efterklang-premiss + Callback-beat
  lastIncomingBidMatchday?: number  // C-O2 — matchday when AI last bid on managed club's player

  boardPatience?: number         // 0–100, starts 70
  /** U1 andra halvan (2026-08-22): "senast räknade fixture" för den löpande
   *  omgångsvisa boardPatience-uppdateringen (updateRunningBoardPatience,
   *  boardService.ts) — samma idempotens-mönster som trainerArc.lastCountedFixtureId,
   *  förhindrar dubbelräkning om funktionen någonsin anropas två gånger för
   *  samma omgång. */
  boardPatienceLastCountedFixtureId?: string
  consecutiveFailures?: number   // seasons ended in bottom half without improvement
  managerFired?: boolean
  /**
   * O13 (DOM_TRANARMARKNADEN_2026-08-26): säsongen avskedet BESLUTADES.
   * Skrivs på båda avskedsvägarna — seasonEndProcessor (sportsligt/licens,
   * där rollovern redan hunnit stega currentSeason ett steg när flaggan
   * läses) och postRoundFlagsProcessor (konkurs mitt i säsongen, där den
   * inte har det). Utan fältet kan uppehållssimuleringen inte veta hur
   * mycket som återstår att spela — de två vägarna ser identiska ut i
   * efterhand men betyder olika saker.
   */
  firedAtSeason?: number
  /**
   * MASTER_OPPET.md managerfired-vag-osynlig (2026-09-01): konkursvägens
   * avskedsorsak. Bara satt av postRoundFlagsProcessor (finansiellt
   * game-over mitt i säsongen) — den sportsliga/licens-vägen har ingen
   * motsvarighet här eftersom DEN avskedsorsaken redan lever frusen i
   * SeasonSummary.boardTruth.relationship.firedReason vid det tillfället.
   * Utan detta fält föll GameOverScreen tillbaka på att GISSA orsaken ur
   * game.boardPatience/consecutiveFailures — värden som fortsätter räknas
   * under resten av den redan-förlorade säsongen och kan peka på fel skäl.
   */
  firedReason?: 'boardPatience' | 'consecutiveFailures' | 'licenseDenied' | 'bankruptcy'
  /**
   * O13: uppehållet mellan två jobb. Sätts när spelaren väljer att låta
   * säsongen spelas utan sig, bär vad som hände och vilka klubbar som
   * ringde. `undefined` = ingen pågående tränarmarknad.
   */
  careerBreak?: import('../services/careerBreakService').CareerBreakState
  /** Meritbuffert (Jacobs koefficientdom 2026-08-23, DOM_MERITBUFFERT_2026-08-23.md,
   *  O5-acceptanstestets fynd: en klubb med tre raka SM-guld sparkades två
   *  säsonger senare efter en normal svacka, eftersom boardPatience-formeln
   *  inte hade något minne av tidigare framgång). Byggs upp av
   *  computeBoardPatienceUpdate när en säsong möter/överträffar
   *  boardExpectation (gap >= 0), förbrukas INNAN en understigande säsongs
   *  negativa delta rör boardPatience. Scope: bara säsongsslutets
   *  positionsterm — rör inte den löpande omgångstermen eller
   *  förlustsvit-tillägget, som redan har sitt eget tak. */
  meritBuffer?: number

  rivalryHistory?: Record<string, {
    wins: number
    losses: number
    draws: number
    lastResult?: 'win' | 'loss' | 'draw'
    currentStreak: number  // positive = win streak, negative = loss streak
  }>

  opponentAnalyses?: Record<string, OpponentAnalysis>  // key = opponentClubId

  activeTalentSearch: TalentSearchRequest | null
  talentSearchResults: TalentSearchResult[]

  doctorQuestionsUsed?: number  // resets each round, max 5

  playerConversations?: Record<string, number>  // playerId → roundNumber of last conversation

  youthTeam?: YouthTeam
  academyLevel: AcademyLevel
  academyUpgradeInProgress?: boolean
  academyUpgradeSeason?: number
  facilityUpgradeSeason?: number
  mentorships: Mentorship[]
  mentorshipHistory?: MentorshipRecord[]
  loanDeals: LoanDeal[]
  version: string
  lastSavedAt: string   // ISO datetime
  // M2 (audit 5c9a7a8, 2026-08-24): monotont löpnummer för optimistisk
  // concurrency-kontroll mellan flikar. saveSaveGame() ökar den med 1 vid
  // varje lyckad skrivning. Om en skrivning ser en HÖGRE revision redan på
  // disk än den flik-lokala tabellen (senast lästa/skrivna för denna save-id)
  // känner till, har en annan flik hunnit skriva emellan — skrivningen
  // avvisas som konflikt istället för att tyst skriva över den nyare kopian.
  revision?: number

  communityActivities?: CommunityActivities
  /** ANSPRÅK 4, spak 3 — nyhetstretmillen (DOM_ANSPAK4_TREDJE_SPAK_NYHET_2026-08-29.md).
   *  Säsongen varje CS-bärande ortsaktivitet senast var NY (aktiverad eller
   *  förnyad). Läses av communityProcessor.ts (staleness-avtrappningen) och
   *  communityRenewalService.ts (förnyelsebeslutet). Saknat fält/saknad nyckel
   *  backfylls med innevarande säsong — aldrig bakåtdaterat. */
  communityActivitiesSince?: CommunityActivitiesSince
  volunteers?: string[]
  volunteerMorale?: Record<string, number>  // name → morale 0-100
  localPaperName?: string
  patron?: Patron
  localPolitician?: LocalPolitician
  previousKommunBidrag?: number
  politicianLastInteraction?: PoliticianInteractionLog
  board?: BoardMember[]   // KF4: EN styrelsemodell (ersätter boardPersonalities + club.board)
  lastEconomicStressRound?: number
  /** Säsongen då det tvååriga exklusiva kioskavtalet åter kan omförhandlas. */
  kioskSupplyContractUntilSeason?: number
  /** Bussavtalet från ekonomikrisens mikrobeslut. Originalspecen låser
   *  kostnaden till 2 000 kr/omgång och bindningen till tre säsonger. */
  busContractRoundCost?: number
  busContractUntilSeason?: number
  pendingPressConference?: import('../entities/GameEvent').GameEvent
  pendingCSPress?: import('../entities/GameEvent').GameEvent
  lastCSPressMatchday?: number  // for C-B1 cooldown tracking
  budgetPriority?: 'squad' | 'balanced' | 'youth'
  resolvedEventIds?: string[]  // event IDs that have been resolved — prevents re-triggering
  /** PÅSTÅENDEKARTAN (2026-08-24): den nedskrivna sanningen "vad valde spelaren"
   *  — saknades helt. DecisionCard.tsx:s "Du valde: X" fanns tidigare bara i
   *  GranskaScreen.tsx:s flyktiga useState (chosenLabels/resolvedEventIds),
   *  nollställd vid remount. Skrivs i eventResolver.ts:s resolveEvent(), på
   *  alla fem exit-punkter (samma cap-mönster som resolvedEventIds, senaste
   *  200). label är ett snapshot av choice.label vid resolutionstillfället —
   *  om poolen någonsin randomiseras ska kvittot visa vad spelaren FAKTISKT
   *  såg, inte en omslagen nutida text. */
  resolvedChoices?: ResolvedChoice[]

  // V1.0 — Named journalist with memory
  journalist?: Journalist

  // Pool 1a/1e (2026-07-18) — per-save named doctor, speglar journalist
  doctor?: DoctorIdentity

  // V0.9 NÄTET fields
  financeWarningGivenThisSeason?: boolean  // true once warning/license-denial inbox sent; reset at season end
  /**
   * Jacobs körorder 2026-09-01 (financelog-gap-diagnos): dedup-minne för
   * kommunstöds engångsbidrag (contextualSponsorService.ts). Tidigare
   * dedup:ades via en sponsor-post i game.sponsors med triggeredBy=
   * 'cs_over_70' — men den posten skapades med contractRounds:1, och
   * sponsorProcessor.ts:s GENERISKA decrement+filter-svep (körs varje
   * omgång, för ALLA sponsorer) rensade bort den efter EN enda omgång.
   * Resultat: bidraget (kontinuerligt CS-skalat, tak 80 000 kr) betalades
   * ut på nytt vid varje kontrollomgång (5/11/18) — upp till 3x/säsong
   * istf 1x, mätt till 60-136k kr extra per säsong (framgangsekonomin-
   * kommunbidrag-matning). Lagras här (säsongsnumret, inte en boolean —
   * återställs alltså aldrig aktivt, bara ointressant nästa säsong) EFTERSOM
   * dedup-minnet måste överleva HELA säsongen, oavsett vad som händer med
   * själva sponsor-arrayen.
   */
  kommunstodPaidSeason?: number
  previousRecommendedFormation?: string    // last known coach recommendation; inbox sent when it changes
  communityStanding?: number     // 0-100, starts 50
  communityStandingDelta?: number  // delta since last round (positive = up, negative = down)
  journalistRelationship?: number  // 0-100, starts 50
  sponsorNetworkMood?: number    // 0-100, collective mood
  /** O4 (DOM_BURNOUT_2026-08-17.md, 2026-08-23): satt av burnoutRelief-eventets
   *  "Sänk tempot på träningen"-val. Priset för handlingen — inte en ny mätare,
   *  bara en tillfällig override av den redan existerande trainingIntensity-
   *  effekten (roundProcessor.ts tvingar 'light' fram till denna omgång,
   *  oavsett vad spelaren själv valt i Träna-fliken). */
  burnoutTrainingSlowdownUntilRound?: number
  /**
   * DOM_BURNOUT_TAK_2026-09-02 (C) — "Kliv tillbaka"-valets GARANTERADE
   * nedgång. Roten till GPT:s 100→97-fynd: updateManagerBurnout()s vanliga
   * press/återhämtning-dragkamp kan nettas nästan till noll under sustained
   * press (en dominant men pressad säsong), så taket aldrig faktiskt släpper.
   * Medan denna omgång ≤ detta fält gäller en STOR, garanterad bonus-decay
   * OVANPÅ den vanliga formeln (managerProfileService.ts) — pressen kan
   * fortfarande dämpa den, men aldrig helt äta upp den. Satt av
   * 'startBurnoutCeilingRecovery'-subeffekten (eventResolver.ts), samma
   * "tillfällig override tills omgång N"-mönster som burnoutTrainingSlowdown-
   * UntilRound ovan. Under samma fönster tvingas även taktikrekommendationen
   * bort helt (getBurnoutTacticSuppression, burnoutReliefService.ts) —
   * "du tappar kontroll, laget driver" (domens ord).
   */
  burnoutCeilingRecoveryUntilRound?: number

  // Sprint 5: named characters
  namedCharacters?: NamedCharacter[]

  // All-time records
  allTimeRecords?: AllTimeRecords

  // Finance log — last FINANCE_LOG_MAX entries for the managed club
  financeLog?: import('../services/economyService').FinanceEntry[]

  // V1.0 — Mecenater + Anläggning
  mecenater?: Mecenat[]
  facilityState?: FacilityState          // B1: facility tree state

  // V1.0 — aktiva storylines + frusen vytext för lösta poster under
  // strangler-migreringen. Löst-händelsens kanoniska existens/tid bor i
  // eventLedger som storyline_resolution; narrativeBeatLog är fortsatt
  // en separat visnings-cooldown.
  storylines?: StorylineEntry[]
  clubLegends?: ClubLegend[]

  // U5 (SLUTTEST_KO.md, 2026-08-17) — narrativLoggen, se Narrative.ts:s
  // NarrativeLogEntry-kommentar och narrativeLogService.ts.
  // PÅSTÅENDEKARTAN (2026-08-24): döpt om från `narrativeLog` — samma namn
  // fanns tidigare på tre olika register (SaveGame/Player/ManagerProfile),
  // en namnkollision, inte en strukturell duplicering (se registerfyndet i
  // SLUTTEST_KO.md post 58). Detta är gating-loggen (semanticKey/säsong/
  // omgång, ingen text) — Player/ManagerProfile:s textdagböcker heter nu
  // `diary`.
  narrativeBeatLog?: NarrativeLogEntry[]

  // DOM_HANDELSELIGGAREN_2026-09-01.md / MIGRATIONSPLAN_HANDELSELIGGAREN_
  // 2026-09-01.md, Fas 0 — kanonisk, intern, append-only händelseliggare.
  // Spelaren ser den ALDRIG. Skrivvägar: eventLedgerService.logEvent
  // (orsak/verkan Fas 1, säsongens beslut Fas 2) + Fas 4:s
  // momentLedgerService.appendMomentsToLedger (recentMoments' 12 källor,
  // roundProcessor/seasonEndProcessor). narrativeBeatLog subsumerades ALDRIG
  // (Fas 3 struken, se migreringsplanen) — eget lager, egen norm.
  eventLedger?: EventLedgerEntry[]

  // SPEC_BERATTAREN_2026-09-04 §4 — ett gemensamt, textfritt kvitto på
  // vilka liggarposter som redan berättats på vilken yta. Gamla ytspecifika
  // register lever kvar tills respektive konsument migrerats (retire-last).
  ledgerTold?: LedgerToldRegistry

  // O18 fält 2 (SASONGENS_BESLUT_2026-08-23.md, Jacobs dom 2026-08-24):
  // "säsongens viktigaste beslut" — tidigare en egen kandidatlista här
  // (seasonDecisionCandidates), retirerad LIGGARE-PRIO 4 (2026-09-03):
  // samtliga tre kandidatkällor (eventResolver.ts, gameStore.ts,
  // gameFlowActions.ts) skriver bara till eventLedger nu (type:'decision');
  // seasonEndProcessor.ts läser den via pickMostImportantDecisionText, ingen
  // parallell fälllista kvar.

  // V1.0 — Market value tracking (previous round values for delta display)
  previousMarketValues?: Record<string, number>  // playerId → last known marketValue

  // V1.0 — Follow-up system for event consequences
  pendingFollowUps?: import('../entities/GameEvent').FollowUp[]

  // V1.0 — Board objectives (secondary goals)
  boardObjectives?: BoardObjective[]
  boardTrust?: number               // 0-N; increments per met objective, förtroendepott fires at ≥2 via consecutive flagships
  boardObjectiveHistory?: Array<{
    season: number
    objectiveId: string
    result: 'met' | 'failed'
    ownerReaction: string
    label?: string   // måletikett för BoardMeeting-eval (tillagd 2026-06-01)
  }>

  /**
   * AI-klubbars transferlogg (Jacobs order 2026-08-25: "billigt och sant" —
   * processAITransfers (aiTransferService.ts) beräknade redan denna data per
   * transfer och kastade den. Skrivs i seasonEndProcessor.ts direkt efter
   * anropet, capped senaste 200 (samma mönster som resolvedEventIds).
   * Underlag för Förutsättningsfasen steg 2 (ligarörelser i Sommaren) —
   * ingen UI-konsument byggd än, väntar på den egna ordern.
   */
  aiTransferLog?: Array<{
    season: number
    playerId: string
    playerName: string
    fromClubId: string
    fromClubName: string
    toClubId: string
    toClubName: string
    fee: number
  }>

  // V1.0 — Trainer narrative arc
  trainerArc?: TrainerArc

  // V1.1 — Onboarding (0 = not started, 1-3 = guided rounds, 4+ = done)
  onboardingStep?: number

  // V1.2 — Screen visit tracking (for nudge progress in dashboard agenda)
  visitedScreensThisRound?: string[]  // e.g. ['squad', 'transfers', 'club']

  // Sprint 2 — Supporter group (klack)
  supporterGroup?: SupporterGroup

  // Sprint 3 — Veckans beslut
  pendingWeeklyDecision?: import('../services/weeklyDecisionService').WeeklyDecision
  resolvedWeeklyDecisions?: string[]  // `${id}_${season}` — prevents re-picking same decision
  weeklyDecisionLastRound?: number    // round when last decision was generated — enforces cooldown

  // Beslutsekonomi — throttling (decisionBudgetService)
  pendingDecisions?: unknown[]       // reserved for future use (deferred display)
  deferredDecisions: GameEvent[]     // queue for decisions blocked by budget cap (max 10)
  lastRumorRound?: number            // round when last transfer rumor was generated (cooldown: 3)
  lastEventQueueRound?: number       // round when last community event was generated (cooldown: 2)

  // Sprint 4 — Visuell progression
  aiCoaches?: Record<string, import('../services/aiCoachService').AICoach>
  averageAttendance?: number      // rolling average across completed home matches
  previousAverageAttendance?: number  // previous round's average (for delta)

  // V1.3 — Player Arc Controller
  activeArcs?: ActiveArc[]

  // V1.5 — Senast processade matchdag (sätts av roundProcessor — förhindrar dubbelprocess vid cup)
  lastProcessedMatchday?: number

  // V1.5 — Kafferumscitat (förhindrar samma citat två omgångar i rad)
  lastCoffeeQuoteHash?: number

  // Kapten
  captainPlayerId?: string

  // T3 — Halvtidsbeslut (temporärt fält, rensas i saveLiveMatchResult)
  lastHalftimeDecision?: 'lugna' | 'pressa' | 'prata'

  // THE_BOMB 3.1 — State of the Club (visas i PreSeasonScreen säsong 2+)
  seasonStartSnapshot?: {
    season: number
    finalPosition: number
    finances: number
    communityStanding: number
    squadSize: number
    supporterMembers: number
    academyPromotions: number
    era?: ClubEra | 'unknown'   // Klubbminne B6 — era vid säsongsstarten (migration: 'unknown')
  }

  // V1.4 — Nemesis tracker (opponent player who keeps scoring against us)
  nemesisTracker?: Record<string, {
    playerId: string
    name: string
    clubId: string
    goalsAgainstUs: number
    matchesScoredIn: number   // distinct matches with ≥1 goal (match-spärr, BUG-2)
    inboxSentAt?: number  // goalsAgainstUs count when inbox was last sent
    signedBy?: string     // our clubId if signed
  }>

  // Sprint G — preferred match mode (persists between matches)
  preferredMatchMode?: 'full' | 'commentary' | 'quicksim' | 'silent'

  // Sprint 18 — Assistenttränare
  assistantCoach?: AssistantCoach

  // Sprint 12 — Segrarens eko (WEAK-014)
  pendingVictoryEcho?: import('../services/postVictoryNarrativeService').VictoryEcho
  victoryEchoExpires?: number  // matchday after which echo is cleared

  // C-K1 — Landslagsuttagning
  activeNationalTeamCamp?: { startRound: number; endRound: number; playerIds: string[] }
  lastNationalSnub?: { playerId: string; season: number; round: number }
  // Release-svepet 2026-07-21 (Block 2a): hemkomsten var bara en inbox-rad
  // (INBOX-PRINCIPEN-brott — syntes aldrig i en spelarvy). pendingNationalTeamReturn
  // ytar RETURN_SCENE_LINES i kafferummet, samma pending+expires-mönster som
  // pendingVictoryEcho/victoryEchoExpires ovan.
  pendingNationalTeamReturn?: { text: string }
  nationalTeamReturnExpires?: number
  // Release-svepet 2026-07-21 (Block 2c): ceremonimodal vid uttagning, samma
  // en-gång-visa-och-avfärda-mönster som pendingAnnandagsVal — men med en
  // datapayload (namn + synlig ekonomibonus) istf en ren boolean.
  pendingCallupModal?: { playerIds: string[]; names: string[]; bonusTkr: number }
  // Release-svepet 2026-07-21 (Block 3c) — hallprövningens resolution-eko
  // (PROVNING_RESOLUTION), samma pending+expires-mönster som
  // pendingVictoryEcho/victoryEchoExpires. Sätts av eventResolver.ts:s
  // hallProcess-case, konsumeras av coffeeRoomService.ts.
  pendingHallEcho?: { text: string }
  hallEchoExpires?: number

  // Legibel konsekvens — transient, rensas varje omgång. ÖVERLÄMNING 2
  // (2026-08-17): plural sedan Jacobs korrigering — chainSignificance kastade
  // tidigare bort alla kedjor utom en per omgång; nu sparas alla, rangordnade
  // (index 0 = mest signifikant, se chainSignificance i roundProcessor.ts).
  pendingRippleChains?: RippleChain[]

  // Sprint 11 — Truppledarskap (NARR-005)
  leadershipActions?: Array<{
    playerId: string
    action: 'lower_tempo' | 'mentor' | 'private_talk' | 'public_praise'
    fromRound: number
    expiresRound: number
    effect: { stat: string; delta: number }
    mentoredPlayerId?: string   // PC-6: mentor-åtgärden länkar mentorn till en ung spelare (CA-bonus medan aktiv)
  }>

  // DREAM-010 — Bandybrev till klubben
  bandyLetters?: BandyLetter[]
  bandyLetterThisSeason?: number  // season when last letter was sent — prevents duplicates

  // DREAM-002 — Ekonomisk kris narrativ bana
  economicCrisisState?: {
    startedSeason: number
    startedMatchday: number
    phase: 'awareness' | 'pressure' | 'decision' | 'resolved'
    eventsFired: string[]
    // `outcome` = resolutionsvägen (sold_star/loan/mecenat/natural_recovery). Återanvänds
    // som Efterklang-efterdyningens resolutionType — inget separat resolutionType-fält (dublett).
    outcome?: 'sold_star' | 'loan' | 'mecenat' | 'natural_recovery'
    resolvedMatchday?: number          // efterdyning — counter-oberoende stämpel vid resolution
    soldToSurvivePlayerName?: string   // endast sold_star — fångas FÖRE removePlayerId
  }
  /** Kommunlånet från ekonomikrisens fas 3. Tre säsongers bindning;
   *  årskostnaden kommer från den låsta originalspecens debtLoad=100 000. */
  municipalLoanAnnualCost?: number
  municipalLoanUntilSeason?: number

  // DREAM-014 — Tyst mode (extend preferredMatchMode handled here)
  // Uses preferredMatchMode: 'silent' (existing field extended)

  // DREAM-016 — Bandyhistorisk skoluppgift
  schoolAssignmentThisSeason?: number  // season of last assignment
  schoolAssignmentArchive?: SchoolAssignmentRecord[]

  // DREAM-013 — Lagfotografiet (photos stored in IndexedDB, here just track last generated)
  lastTeamPhotoSeason?: number

  // M7 — Orten feed: rolling window of narrative moments (max 5, newest first).
  // MIGRATIONSPLAN_HANDELSELIGGAREN Fas 4 (2026-09-01): dual-write. ClubMemoryView
  // (den enda text-renderande läsaren) läser numera game.eventLedger via
  // momentLedgerService.getRecentMomentsFromLedger. collectActiveMemories
  // (den tidigare andra läsaren) retirerad LIGGARE-PRIO 4 (2026-09-03, noll
  // produktionskonsumenter) — fältet skrivs fortfarande (äldre saves,
  // eventuella andra läsare), egen retirering, opportunistiskt.
  recentMoments?: Moment[]

  // M14 — Klubbens era (beräknas varje säsongsstart)
  currentEra?: ClubEra

  // Sprint 25g — Domarsystem
  referees?: Referee[]
  refereeRelations?: RefereeRelation[]
  pendingRefereeMeeting?: import('./GameEvent').GameEvent

  // Sprint 25h — Bandyskandaler (Lager 1)
  activeScandals?: import('../services/scandalService').Scandal[]
  scandalHistory?: import('../services/scandalService').Scandal[]
  // Point deductions applied in calculateStandings (current season)
  pointDeductions?: Record<string, number>
  // Point deductions applied at next season start
  pendingPointDeductions?: Record<string, number>

  // Sprint 25h — Lager 3: Licensnämnden
  // 2026-08-26 (Jacobs dom, RAPPORT_ACKUMULATOR_FORSLAG_2026-08-26.md):
  // consecutiveLossSeasons (binär räknare, minneslös — en positiv säsong
  // nollställde ALLT) ersatt av licenseRiskScore, en ackumulator (0-100,
  // samma princip som meritBuffer). licenseStatus lever kvar som den ZON
  // (clear/first_warning/point_deduction/license_denied) poängen ligger i —
  // härledd, inte en egen tillståndsmaskin längre.
  licenseStatus?: import('../services/licenseService').LicenseStatus
  licenseRiskScore?: number

  // Säsongssignatur (SPEC_SAESONGSSIGNATUR_KAPITEL_C). pastSeasonSignatures
  // (rå SeasonSignature-historik, upp till 10 säsonger) retirerat LIGGARE-
  // PRIO 4 (2026-09-03): aldrig läst i produktion — den synliga historiken
  // bärs redan av seasonSummaries[].signatureRubric (frusen text per
  // säsong, SeasonSummaryScreen.tsx). Äldre saves kan fortfarande bära
  // fältet i sin sparade JSON; migrateSaveGame rör det inte, det är bara
  // dött viktlöst bagage — ingen migrering krävs (regressionstest:
  // pastSeasonSignaturesRetireMigration.test.ts).
  currentSeasonSignature?: SeasonSignature
  shownSeasonSignatureRevealSeason?: number  // season when reveal was last shown

  // Sprint 25h — Lager 2: Egna beslut med risk
  wageBudgetOverrunRounds?: number     // consecutive rounds above wageBudget
  wageBudgetWarningSent?: boolean      // first Licensnämnden warning sent
  riskySponsorContract?: {
    sponsorId: string
    riskMaturityRound: number          // earliest round when risk can fire
    season: number
  }
  riskySponsorOfferSentThisSeason?: number  // season when last offer was generated
  patronWithdrawnSeason?: number       // patron re-emergence cooldown: blocks new patron for 2 seasons after patron withdrawal
  mecenatWithdrawnSeason?: number       // lock new mecenat spawn for 2 seasons after a mecenat withdrawal

  // F1 Stage 2 — per-source cooldowns (shown on SourceSecondaryCard)
  sourceCooldowns?: Partial<Record<string, { roundsLeft: number; totalRounds: number }>>

  // C-P1 — Stale-bias per portal-kort
  // firstShownAt: matchday when card first entered layout (B9 T2B: gap halverar, ej nollställer)
  // lastShownAt: most recent matchday when card was in layout (used to detect gaps)
  // shownCount: B9 T2 — total visningsfrekvens (frekvensgolv för maxvikt)
  cardStaleTracking?: Record<string, { firstShownAt: number; lastShownAt: number; shownCount?: number }>

  // C-B2 — Klack-echo (notable result memory)
  klackEcho?: {
    type: NotableEventType
    resultMatchday: number
    initialWeight: number
    currentWeight: number
    decayPerRound: number
  }

  // B6 — Klubbminne anniversary-system
  activeAnniversaries?: import('../services/clubMemoryService').ActiveAnniversary[]
  anniversariesSeen?: string[]       // eventIds som dismissats

  // C-B3 — Pensionsval
  pendingRetirementDecision?: {
    playerId: string
    quote: string  // player quote shown on card
  }
  lastRetirementSeason?: number       // season when last retirement decision was triggered
  retirementCeremonyCounter?: number  // increments each time a player retires via portal card

  // Score steg 5 — snapshot-pipeline (rullande ligaomgångar, senaste 22)
  scoreSnapshots?: {
    standingsPosition: number[]   // managed klubbs tabellplacering per liga-omgång
    journalistRelation: number[]  // journalist.relationship per liga-omgång
    playerForm: number[]          // managed klubbs avg form per liga-omgång
  }

  // R1 — Decision-fatigue (kö-åldring + tryckindikator)
  fatigueHistory?: number[]   // rullande 7 omgångars meter-värde (matar Sparkline)
  fatigueHotStreak?: number   // consecutive hot-pressure-omgångar (driver fatigue-scen)

  // Squad-pulse (Tier 2C) — rullande 10 omgångars trupp-hälsa
  teamFitnessHistory?: Array<{
    matchday: number
    avgFitness: number
    avgMorale: number
    injuryCount: number
    avgSeasonForm?: number   // ny axel — undefined på äldre poster
    avgSharpness?: number    // ny axel — undefined på äldre poster
  }>

  // Periodisering — säsongsbåge
  managedClubPeriodisation?: 'bygg' | 'hall' | 'toppa' | 'vila'
  managedClubPeriodisationSince?: number  // matchday när läget sattes (för Toppa-spike-tracking)

  // Portal-kurering — story-slot rotation
  lastStorySlotType?: string     // kind från FÖREGÅENDE matchdag — läses av buildPortal, fryst under matchdagen
  currentStorySlotType?: string  // kind visad UNDER pågående matchdag — skrivs vid render, promotas vid omgångsövergång

  // P1 — Annandagsplanering val-mekanik
  annandagsValGjort?: 'A' | 'B' | 'C' | 'D' | null  // val gjort denna säsong
  pendingAnnandagsVal?: boolean                        // trigger: 2 omgångar innan hemmamatch
  pendingAnnandagsGratisentreVal?: boolean             // val C: nollsätt biljettintäkt på matchdagen
  pendingAnnandagsMediaRubrik?: {                      // konsekvensledja: mediarubrik omg+1
    val: 'A' | 'B' | 'C' | 'D'
    triggerRound: number
  }
  pendingAnnandagsKlack?: {                            // konsekvensledja: klack-reaktion omg+2
    val: 'A' | 'B' | 'C' | 'D'
    triggerRound: number
  }

  // C-MK1 — Manager som karaktär (Fas 1)
  managerProfile?: import('./ManagerProfile').ManagerProfile

  // A3 — Match-laddning svit-förändrings-markör
  matchLaddningBandShown?: {
    matchday: number
    streakLength: number
    stateType: 'winning_streak' | 'losing_streak'
  }

  // 5.1 Sommaren — se SeasonTransitionEvent-kommentaren ovan för skrivvägarna.
  pendingSeasonTransitionEvents?: SeasonTransitionEvent[]
  /** Förutsättningsfasen — se BoardAssessment-kommentaren ovan. */
  boardAssessment?: BoardAssessment
  /**
   * Återinträdesguard för Sommaren (Jacobs DOM, 2026-08-18): "skärmen är
   * nåbar bara när säsongens mål ännu inte är valt (O3)." O3 (DOM_EGET_
   * SASONGSMAL_2026-08-17.md) är specad men obyggd — det här fältet är
   * VAD O3 SEN TAR ÖVER. När O3:s målväljare byggs ska den skriva till
   * SAMMA fält (currentSeason), inte en egen "sedd"-flagga. Sommaren är
   * passerad exakt när seasonGoalChosenForSeason === game.currentSeason.
   */
  seasonGoalChosenForSeason?: number

  /**
   * O3 (DOM_EGET_SASONGSMAL_2026-08-17.md) — spelarens eget säsongsmål,
   * valt i Sommaren, för INNEVARANDE säsong. Arbetsfält: konsumeras och
   * skrivs till SeasonSummary.personalGoal vid säsongsslut
   * (seasonEndProcessor.ts), och nollställs där — nästa Sommaren skriver
   * ett nytt. trackedPlayerIds bär extra bokföring 'keepSquad' behöver för
   * att mäta utfallet (vilka kontrakt gick ut vid valtillfället) utan att
   * bryta SeasonGoalRecords "tre fält, inget mer".
   */
  activeSeasonGoal?: {
    type: SeasonGoalType
    referenceId?: string
    trackedPlayerIds?: string[]
    chosenSeason: number
  }
}
