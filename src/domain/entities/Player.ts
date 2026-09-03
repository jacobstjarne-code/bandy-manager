import type { PlayerPosition, PlayerArchetype } from '../enums'
import type { PlayerTrait } from '../data/playerTraits'
export type { PlayerTrait }

export interface PlayerAttributes {
  skating: number         // 0-100
  acceleration: number    // 0-100
  stamina: number         // 0-100
  ballControl: number     // 0-100
  passing: number         // 0-100
  shooting: number        // 0-100
  dribbling: number       // 0-100
  vision: number          // 0-100
  decisions: number       // 0-100
  workRate: number        // 0-100
  positioning: number     // 0-100
  defending: number       // 0-100
  cornerSkill: number     // 0-100
  goalkeeping: number     // 0-100
  // Hidden attribute — visible in player development screen, not in match view.
  // How fast the player recovers defensive position after an offensive corner.
  // Low = team is exposed in post-corner counter window.
  cornerRecovery: number  // 0-100
}

// Hidden suspension profile — never shown as a label. Surfaces through match patterns.
// Distribution: situation 24%, volym 4%, intensitet 6%, ren 21%, neutral 45%
export type SuspensionProfile = 'situation' | 'volym' | 'intensitet' | 'ren' | 'neutral'

export interface PlayerSeasonStats {
  gamesPlayed: number
  goals: number
  assists: number
  cornerGoals: number
  penaltyGoals: number
  yellowCards: number
  redCards: number
  suspensions: number
  averageRating: number
  minutesPlayed: number
}

export interface PlayerCareerStats {
  totalGames: number
  totalGoals: number
  totalAssists: number
  seasonsPlayed: number
}

export interface CareerMilestone {
  type: 'debutGoal' | 'hatTrick' | 'games100' | 'goals50' | 'promoted' | 'cupWinner'
  season: number
  round: number
  description: string
}

export interface PlayerDayJob {
  title: string        // e.g. "Lärare", "Snickare", "Systemutvecklare"
  flexibility: number  // 50-100 (how compatible with training/matches)
  weeklyIncome: number // 500-3000 SEK extra
}

export interface Player {
  id: string
  firstName: string
  lastName: string
  age: number
  nationality: string
  clubId: string
  // tenure-falt-joinedclubseason (DOM 2026-09-03, Jacob): säsongen spelaren
  // faktiskt gick med i clubId — världsgenerering (=startsäsong), transfer/
  // friövergång (=säsongen övergången sker) eller akademiuppflyttning.
  // Optional för äldre saves (backfyllda approximativt av migrationen, se
  // saveGameMigration.ts). Konsumenter: "År i klubben" (PlayerCard.tsx) +
  // O18 personraden (seasonGoalService.ts).
  joinedClubSeason?: number
  academyClubId?: string
  isHomegrown: boolean
  position: PlayerPosition
  archetype: PlayerArchetype

  salary: number
  contractUntilSeason: number
  marketValue: number

  morale: number       // 0-100
  form: number         // 0-100
  fitness: number      // 0-100
  sharpness: number    // 0-100
  seasonForm: number   // 0-100 — lång axel, tak för fitness-effectivitet

  // Periodiseringsundantag — null/undefined = följer truppen
  periodisationOverride?: 'hall' | 'vila' | null

  dayJob?: PlayerDayJob
  isFullTimePro: boolean // true = no day job, full focus

  currentAbility: number    // 0-100
  // Levande delta för trupp-/gala-ytor. Årsbokens klubbhistoriska
  // mostImproved använder SaveGame.seasonStartSquadSnapshot, eftersom
  // denna Player kan ha bytt klubb innan säsongen summeras.
  startSeasonCA?: number
  caHistory?: Array<{ season: number; ca: number }>
  potentialAbility: number  // 0-100
  developmentRate: number   // 0-100

  injuryProneness: number   // 0-100
  discipline: number        // 0-100
  suspensionProfile?: SuspensionProfile  // hidden — not shown to player

  attributes: PlayerAttributes

  isInjured: boolean
  injuryDaysRemaining: number
  /** Pool 1c (injuryDoctorText.ts, spela-på-mekaniken): true medan spelaren
   *  tillfälligt är fritagen (isInjured=false) för EN specifik match efter att
   *  ha accepterat att spela på en mjuk/mild skada. injuryDaysRemaining fryses
   *  (rörs inte) under tiden — det är det ORIGINALVÄRDE post-match-rullningen
   *  dubblar vid återfall. Om spelaren inte faktiskt startar matchen den var
   *  tänkt för (bänkad/ej vald) återställs isInjured utan att rullningen sker —
   *  gamblet kräver att spelaren verkligen spelade. */
  playingThroughInjury?: boolean
  suspensionGamesRemaining: number
  recentlyInjuredUntil?: number  // matchday — "Ramp först" warn om Bygg/Toppa sätts före detta
  suspensionCause?: { sinceMatchday: number; opponentName: string; matches: number }
  /** A-H3 (DOM_AH3_TILLGANGLIGHET_2026-08-28.md), ben 2: satt när en spelare
   *  som startade matchen under FATIGUE_AVAILABILITY_FLOOR (squadEvaluator.ts
   *  — samma golv som HIGH2s SPELKLARHET_FITNESS_FLOOR) förlorade
   *  sannolikhetskastet om vila/överbelastning (playerStateProcessor.ts,
   *  applyPlayerStateUpdates). SKILD från isInjured — spelaren är inte
   *  skadad, bara vilande/överbelastad. setLineup.ts:s urvalsspärr läser
   *  detta separat så texten aldrig kallar en vilande spelare skadad.
   *  Rullas ut (decrementeras mot 0) i playerStateProcessor.ts:s
   *  recovery-block i BÖRJAN av nästa rundas körning — kostar exakt EN
   *  match, som domen kräver. undefined/0 = tillgänglig. */
  restGamesRemaining?: number

  seasonStats: PlayerSeasonStats       // A5: liga-only (cup separeras till seasonCupStats)
  seasonCupStats?: PlayerSeasonStats   // A5: cup-only denna säsong; careerStats är fortsatt all-tävling
  careerStats: PlayerCareerStats
  /** Antal avslutade säsonger som kapten för spelarens dåvarande klubb. */
  wasCaptainSeasons?: number
  careerMilestones?: CareerMilestone[]
  isOnLoan?: boolean
  loanClubName?: string
  promotedFromAcademy?: boolean
  promotionRound?: number
  /** Säsongen spelaren kallades upp. Krävs för säsongsvisa återblickar. */
  promotionSeason?: number
  isCharacterPlayer?: boolean
  trait?: PlayerTrait
  loyaltyScore?: number  // 0–10
  shirtNumber?: number
  availability?: PlayerAvailability
  lowMoraleDays?: number  // consecutive matchdays with morale < 30
  // E-GRIND0-1 rotorsak (2026-08-24): goals/assists/games är LIGA-ENDAST
  // (statsProcessor.ts:s seasonStats, aldrig seasonCupStats) — oförändrad
  // etablerad semantik, flera läsare (seasonGoalService.ts:s breakthrough/
  // establishedStarter, saveGameMigration.ts:s careerStats-återuppbyggnad)
  // förutsätter det. cupGames/cupGoals/cupAssists tillagda separat, inte
  // adderade in i de befintliga fälten, av samma skäl — de nya fälten är
  // den enda källa som fångar seasonCupStats:s värde VID RÄTT TIDPUNKT
  // (innan säsongsslutets nollställning), vilket löser grind0Truth.test.ts:s
  // K1-kontroll mot en tidigare mekanism (preRolloverSeason) som kunde bli
  // stale av en tyst extra-runda (roundProcessor.ts:1928:s "auto-advance
  // playoff rounds when managed club is eliminated"-rekursion — se
  // SLUTTEST_KO.md för full spårning).
  seasonHistory?: Array<{ season: number; goals: number; assists: number; games: number; rating: number; clubId: string; cupGames?: number; cupGoals?: number; cupAssists?: number }>

  // Sprint 9 — DREAM-012: injury narrative
  familyContext?: string    // generated once, persists across injuries
  injuryNarrative?: string  // current injury story text

  // V1.4 — Player narrative diary (auto-generated)
  // PÅSTÅENDEKARTAN (2026-08-24): döpt om från `narrativeLog` — namnkollision
  // med SaveGame.narrativeBeatLog (gating-logg, ingen text) och
  // ManagerProfile.diary. Se registerfyndet i SLUTTEST_KO.md post 58.
  diary?: Array<{
    season: number
    matchday: number
    text: string
    type: 'milestone' | 'form' | 'injury' | 'transfer' | 'storyline'
    /** Maskinläsbar identitet för påståenden som måste återknyta till en
     *  exakt händelse utan att tolka den svenska visningstexten. */
    semanticKey?:
      | 'first_team_debut'
      | 'first_team_goal'
      | `hat_trick_${number}`
      | `career_goals_${number}`
      | `career_games_${number}`
      | 'academy_promotion'
  }>

  // DREAM-011 — Club legend (one per club, homegrown, never sold)
  isClubLegend?: boolean
  legendBackstory?: string

  // C-T1 — Transfer personality (set once at generation, stable)
  transferPersonality?: 'homebound' | 'ambitious' | 'family' | 'dream_club' | 'default'
  dreamClubId?: string  // only set if transferPersonality === 'dream_club'

  managerNote?: string  // fri text, max 80 tecken, satt av spelaren

  // C-K1 — Landslagsuttagning
  nationalTeamCallups?: number       // total career callups
  lastNationalTeamCallup?: number    // season of last callup
  // Release-svepet 2026-07-21 (Block 2b): durabla flaggor, satta en gång —
  // till skillnad från nationalTeamCallups (räknare som fortsätter växa)
  // behövs en fryst pekare till säsongen OCH matchdagen den första
  // uttagningen skedde, så klubbminnet (clubMemoryService.ts) kan bygga
  // eventet permanent (även efter en andra uttagning) och matcha det mot
  // rätt årsdag. Samma mönster som promotedFromAcademy+promotionRound ovan —
  // matchday (inte leagueRound) krävs eftersom cup-matchdagarna ligger före
  // ligan i kalendern (buildSeasonCalendar: matchday 1-4=cup, sen +4 offset).
  firstNationalTeamCallupSeason?: number
  firstNationalTeamCallupMatchday?: number

  freeAgentSince?: number            // season when player entered free-agent pool (for gallring)
}

export type PlayerAvailability =
  | 'unavailable'
  | 'contract_expiring'
  | 'unhappy'
  | 'surplus'
  | 'financial'
  | 'want_to_leave'
