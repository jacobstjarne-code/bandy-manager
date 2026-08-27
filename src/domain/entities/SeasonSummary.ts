import type { ClubExpectation } from '../enums'
import type { ClubEra } from './SaveGame'

// O3 (DOM_EGET_SASONGSMAL_2026-08-17.md) — spelarens eget säsongsmål, valt i
// Sommaren. Sex fasta typer, interpolerade namn, ingen AI-generering.
export type SeasonGoalType = 'playoff' | 'establish' | 'playerCarry' | 'rival' | 'facility' | 'keepSquad'
export type SeasonGoalOutcome = 'met' | 'close' | 'not'

/**
 * Tre fält, inget mer (Jacobs dom, ordagrant). referenceId saknas för mål
 * utan naturlig enskild referens (playoff/establish/keepSquad). Ingen
 * frusen visningsetikett sparas här medvetet — seasonGoalService.ts slår
 * upp namnet live vid renderingstillfället (med graciös degradering om
 * referensen inte längre går att hitta, t.ex. en spelare som lämnat
 * klubben flera säsonger senare) i stället för att bryta "tre fält".
 */
export interface SeasonGoalRecord {
  type: SeasonGoalType
  referenceId?: string
  outcome: SeasonGoalOutcome
}

export type MatchHighlightCategory =
  | 'comeback'
  | 'late_winner'
  | 'big_win'
  | 'underdog_upset'
  | 'cup_drama'
  | 'derby_win'
  | 'playoff_decisive'

export interface MatchHighlight {
  fixtureId: string
  matchday: number
  opponentName: string
  homeScore: number
  awayScore: number
  isHome: boolean
  category: MatchHighlightCategory
  narrative: string
  potmName?: string
  shareImageReady: boolean
}

export interface SeasonSummary {
  /** Stabilt, globalt unikt id (2026-08-22, förutsättning för delbarhet —
   *  se SVAR_ARKITEKTUR_SAVEGAME). Härlett ur `${game.id}_s${season}_${clubId}`
   *  vid genereringstillfället i seasonSummaryService.ts, inte array-index.
   *  Gamla saves saknar fältet — saveGameMigration.ts backfyller det med
   *  samma formel vid inläsning. */
  id: string
  season: number
  clubId: string
  clubName: string

  finalPosition: number
  points: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  playoffResult: 'champion' | 'finalist' | 'semifinal' | 'quarterfinal' | 'didNotQualify' | null
  /** 2026-08-17 (Stickiness-audit): satt HÄR, vid genereringstillfället, medan
   *  game.playoffBracket fortfarande är den här säsongens — INTE härlett senare
   *  i SeasonSummaryScreen genom att läsa game.playoffBracket, som nollställs
   *  vid rollover och därför blir opålitligt (eller pekar på en SENARE säsongs
   *  bracket) för en gammal summary. Klubb-id, inte namn — game.clubs
   *  nollställs aldrig, säkert att slå upp mot när som helst. */
  eliminatedByClubId?: string
  /** Fixtures-id för matchen som avgjorde serien (sista matchen där vinnaren
   *  nådde vinst-tröskeln) — samma rollover-säkra motivering som ovan. */
  decidingFixtureId?: string
  decidingRound?: number
  /** PÅSTÅENDEKARTAN (2026-08-24): satt HÄR, vid genereringstillfället, av
   *  samma skäl som eliminatedByClubId — game.playoffBracket.champion
   *  nollställs vid rollover och är opålitligt för en gammal summary.
   *  SeasonSummaryScreen.tsx:s smWinnerSentence läste tidigare det live-fältet
   *  direkt (kunde tappa vem som blev mästare efter en säsongsväxling).
   *  Klubb-id, inte namn — game.clubs nollställs aldrig, säkert att slå upp
   *  mot när som helst. */
  championClubId?: string

  boardExpectation: ClubExpectation
  metExpectation: boolean
  expectationVerdict: 'exceeded' | 'met' | 'failed'
  /**
   * M8 (audit 5c9a7a8, 2026-08-24): domens EGEN mening, lagrad separat från
   * narrativeSummary-blobben (som bakar in den som sin FÖRSTA mening men
   * aldrig kan uppdateras säkert i efterhand utan att gissa i resten av
   * texten). Saknas på poster skapade före denna dom — saveGameMigration.ts
   * backfyller den då genom att räkna om domen från redan lagrade fält
   * (boardExpectation/finalPosition/playoffResult, alla stabila) och bygga
   * om ENDAST denna mening (buildExpectationVerdictSentence,
   * seasonSummaryService.ts) — aldrig resten av narrativeSummary.
   */
  verdictSentence?: string
  /**
   * M8: satt av migreringen ENDAST när omräkningen ovan gav en ANNAN dom än
   * den som redan låg bakad i narrativeSummary — dvs den gamla texten
   * bevisligen byggde på en tröskeltabell som senare rättades (A5,
   * 2026-08-17). HistoryScreen.tsx visar då verdictSentence som rättelse
   * bredvid den arkiverade originaltexten, istf att tyst skriva över den.
   */
  legacyVerdictWasCorrected?: boolean

  topScorer: { playerId: string; name: string; goals: number; assists: number } | null
  topAssister: { playerId: string; name: string; assists: number } | null
  topRated: { playerId: string; name: string; avgRating: number; games: number } | null
  mostImproved: { playerId: string; name: string; caGain: number; startCA: number; endCA: number } | null
  youngPlayer: { playerId: string; name: string; age: number; goals: number; avgRating: number } | null

  totalGoals: number
  totalAssists: number
  totalCornerGoals: number
  totalCleanSheets: number
  longestWinStreak: number
  longestLossStreak: number
  biggestWin: { opponent: string; score: string; round: number } | null
  worstLoss: { opponent: string; score: string; round: number } | null

  homeRecord: { wins: number; draws: number; losses: number }
  awayRecord: { wins: number; draws: number; losses: number }
  firstHalfPoints: number
  secondHalfPoints: number
  formTrend: 'improving' | 'stable' | 'declining'

  totalInjuries: number
  mostInjuredPlayer: { name: string; injuries: number } | null

  startFinances: number
  endFinances: number
  financialChange: number

  youthIntakeCount: number
  bestYouthProspect: { name: string; position: string; potential: number } | null

  roundPoints: number[]   // points per round for chart (cumulative)

  narrativeSummary: string

  communityStandingStart: number
  communityStandingEnd: number
  communityHighlights: string[]

  cupResult?: 'winner' | 'finalist' | 'semifinal' | 'quarter' | 'eliminated' | null
  standingsSnapshot?: Array<{ clubId: string; position: number; points: number }>
  storyTriggers?: Array<{
    type: 'academyStarBorn' | 'rivalBoughtOurPlayer' | 'veteranFarewell' | 'hatTrickHero' | 'topScorerDebut' | 'comebackKing'
    headline: string
    body: string
    relatedPlayerId?: string
    relatedClubId?: string
  }>

  keyMoments?: Array<{
    round: number
    // 'storyline' (påståendesvepet #5, MASTER.md, 2026-08-24): resolvade
    // arc-berättelser (t.ex. contract_drama_resolved, en BITTER avresa)
    // hårdkodades tidigare till 'bigWin' — SeasonSummaryScreen.tsx:s
    // ikonval läser type, inte bara displayText, så en avskedstext kunde
    // visas med en ✅-ikon. 'storyline' ger en neutral ikon (📖) istf en
    // matchresultat-ikon som kan motsäga texten bredvid den.
    type: 'bigWin' | 'bigLoss' | 'hatTrick' | 'derbyWin' | 'derbyLoss' | 'comeback' | 'lateWinner' | 'storyline'
    headline: string
    body: string
    fixtureId?: string
    relatedPlayerId?: string
  }>

  matchOfTheSeason?: MatchHighlight

  signatureRubric?: string

  retiredPlayers?: Array<{
    playerId: string
    name: string
    age: number
    position: string
    seasons: number
    totalGoals: number
    totalGames: number
    farewell: string
    bestMoment?: string
    isLegend: boolean
  }>

  // ── O18 (DOM_ARSBOKEN_RYGGRAD_2026-08-17.md) — årsbokens fem fält ────────
  // Ett fält per säsong, aldrig en lista. En händelselös säsong bär FÄRRE
  // fält (odefinierat), inte utfyllnad. Fält 2 (säsongens viktigaste beslut)
  // byggs inte än — kräver O19-märkning som inte finns.

  /** Fält 1 — spelarens eget mål och utfall (O3). Absent = inget valdes
   *  (eller sparet föregår O3) — årsboken visar "Du lovade ingenting...". */
  personalGoal?: SeasonGoalRecord

  /** Fält 3 — största personförändringen denna säsong. Namnet fryses här
   *  (samma motivering som retiredPlayers/topScorer ovan: spelaren kan vara
   *  borta ur game.players när Historik läses år senare). Prioritetsordning
   *  vid val (Code, 2026-08-19): legendspelare som slutade > akademispelare
   *  som slog igenom > spelare som gick från reserv till bärande roll. */
  personChange?: {
    kind: 'retired' | 'breakthrough' | 'establishedStarter'
    playerId: string
    name: string
    seasons?: number   // 'retired' — antal säsonger i klubben
  }

  /** Fält 4 — rivalitetens ställning denna säsong (ligamatcher mot klubbens
   *  rival, om en finns — se domain/data/rivalries.ts). */
  rivalryStanding?: {
    rivalClubId: string
    rivalName: string
    wins: number
    draws: number
    losses: number
  }

  /** Fält 5 — klubbens epok vid årets slut (calculateClubEra-snapshot,
   *  taget innan trainerArc rullas över till nästa säsong). Historik visar
   *  bara en rad när epoken SKIFTADE mot föregående sparade säsong. */
  clubEra?: ClubEra

  /** U1 andra halvan, ändring 6 (Jacobs dom 2026-08-22, efter Skutskär-
   *  auditen): boardObjectives fyra riktiga tillstånd vid säsongsslut —
   *  förutsättningen för årsbokens tvåsanningsmening ("Plats 8 överträffade
   *  målet. Två uppdrag missades."). Bara data, ingen text — den svenska
   *  meningen skrivs av Opus när fältet finns att läsa (verdictText(),
   *  SeasonSummaryScreen.tsx). */
  objectiveOutcome?: {
    met: number
    atRisk: number
    active: number
    failed: number
  }

  /** O18 fält 2 (SASONGENS_BESLUT_2026-08-23.md, Jacobs dom 2026-08-24):
   *  säsongens viktigaste beslut — den rankade vinnaren bland de O19-märkta
   *  systemhandelse-val spelaren faktiskt löste (seasonDecisionCaptureService.ts,
   *  pickSeasonDecision). undefined = ingen sådan handelse löstes denna
   *  säsong, vilket är korrekt: "en säsong utan tungt beslut ska se ut som
   *  en säsong utan tungt beslut." Färdig mening, ingen mall kvar att fylla. */
  mostImportantDecision?: string
}
