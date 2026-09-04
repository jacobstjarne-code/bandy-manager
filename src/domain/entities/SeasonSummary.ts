import type { ClubExpectation } from '../enums'
import type { ClubEra } from './SaveGame'
import type { FinanceReason } from '../services/economyService'
import type { BoardPatienceZone } from '../services/portal/boardPatienceZone'
import type { ManagerNarrativeEntry } from './ManagerProfile'

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
  /**
   * HIGH 5 (2026-08-29): färdig, tävlingsmedveten rond-etikett ("Omgång 4",
   * "Cup · kvartsfinal", "Slutspel · semifinal"), satt EN gång vid
   * genereringstillfället via domain/roundLabel.ts. SeasonSummaryScreen
   * renderade tidigare `Omgång {matchday}` — global spelordning presenterad
   * som ligaomgång, vilket gjorde samma derby till "Omgång 8" i årsboken och
   * "Omgång 4" i portalen. Saknas på summaries skapade före detta fält;
   * skärmen faller då tillbaka på matchday som förut. */
  roundLabel?: string
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
  /** `round` = matchday (kronologi). `roundLabel` = det spelaren ska SE —
   *  se MatchHighlight.roundLabel ovan (HIGH 5, 2026-08-29). */
  biggestWin: { opponent: string; score: string; round: number; roundLabel?: string } | null
  worstLoss: { opponent: string; score: string; round: number; roundLabel?: string } | null

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
  /** A-M5 (SEXSÄSONGSAUDITEN 2026-08-26): avstämning för säsongsväxlingens
   *  finansiella hopp (t.ex. −322 → −35 tkr) — de faktiska rollover-posterna
   *  (ligaprispengar/mecenatbidrag/kommunbidrag), frusna här precis som
   *  retiredPlayers/topScorer ovan, oberoende av game.financeLog's 50-cap.
   *  undefined = inga sådana poster utbetalades denna rollover (t.ex. ingen
   *  aktiv mecenat/politiker) — absent, inte en tom lista. Satt i
   *  seasonEndProcessor.ts. */
  offseasonFinanceEntries?: Array<{ label: string; amount: number; reason: FinanceReason }>

  youthIntakeCount: number
  bestYouthProspect: { name: string; position: string; potential: number } | null

  roundPoints: number[]   // points per round for chart (cumulative)

  narrativeSummary: string

  communityStandingStart: number
  communityStandingEnd: number
  communityHighlights: string[]

  cupResult?: 'winner' | 'finalist' | 'semifinal' | 'quarter' | 'eliminated' | null
  /** Säsongsslutets ligatabell plus faktisk truppstyrka för varje klubb.
   * `squadStrength` är snitt-CA för spelare registrerade på klubben i den
   * avslutade säsongens spelarstate. Valfritt för bakåtkompatibla saves. */
  standingsSnapshot?: Array<{ clubId: string; position: number; points: number; squadStrength?: number }>
  storyTriggers?: Array<{
    type: 'academyStarBorn' | 'rivalBoughtOurPlayer' | 'veteranFarewell' | 'hatTrickHero' | 'topScorerDebut' | 'comebackKing'
    headline: string
    body: string
    relatedPlayerId?: string
    relatedClubId?: string
  }>

  keyMoments?: Array<{
    /** `round` bevarar global matchday för kronologi. `roundLabel` är den
     *  tävlingsmedvetna etikett spelaren ska se. */
    round: number
    roundLabel?: string
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
   *  pickSeasonDecisionFromLedger). undefined = ingen sådan handelse löstes denna
   *  säsong, vilket är korrekt: "en säsong utan tungt beslut ska se ut som
   *  en säsong utan tungt beslut." Färdig mening, ingen mall kvar att fylla. */
  mostImportantDecision?: string

  /** SPEC_BERATTAREN steg 4 — agendans högst viktade person-/relationspost,
   *  fryst som Opus färdiga mening. ledgerPostKey gör att den faktiska
   *  årsboksvisningen kan skriva ett idempotent told-kvitto mot kanon. */
  seasonPerson?: {
    text: string
    ledgerPostKey: string
  }

  /** A-H4 (TRIAGE_AUDIT_2026-08-29.md, HIGH 4 i
   *  BANDY_MANAGER_AUDIT_5_SASONGER_KUL_STICKINESS_VISUELL_2026-08-29.md):
   *  en gemensam sanningsmodell för säsongen — uttalat mål, utfall,
   *  relationens slutläge — frusen i EN handling (seasonEndProcessor.ts,
   *  buildSeasonBoardTruth() i boardService.ts) i stället för att årsboken
   *  (expectationVerdict/verdictSentence ovan) och Game Over
   *  (GameOverScreen.tsx) räknar ut varsin partiell dom vid olika tillfällen.
   *  Rotfelet: årsboken dömde mot den grova `seasonStartBoardExpectation`-
   *  enumen medan Game Over läste LIVE game.boardPatience/consecutiveFailures
   *  vid rendertillfället — två ytor, två separata härledningar av "gick
   *  säsongen bra?", som kunde säga emot varandra (8:e plats "överträffade
   *  alla förväntningar" i årsboken, "ihållande besvikelser" i Game Over,
   *  samma säsong).
   *
   *  Absent = summary genererad före A-H4 (gamla saves) — läsare ska falla
   *  tillbaka på de äldre, separata fälten (expectationVerdict resp. live
   *  game.boardPatience/consecutiveFailures), aldrig låtsas att fältet finns.
   *
   *  De tre axlarna är AVSIKTLIGT oberoende (samma princip som
   *  seasonVerdictText i boardService.ts dokumenterar) — en säsong kan vara
   *  `outcome.verdict === 'exceeded'` OCH `relationship.zone === 'ultimatum'`
   *  samtidigt (ackumulerad historik väger tyngre än en enskild bra säsong).
   *  Det är inte en bugg att slå ihop till en gemensam dom — det är två
   *  sanna fakta om samma säsong, och snapshotten håller isär dem medan den
   *  garanterar att alla ytor läser SAMMA två fakta. */
  boardTruth?: SeasonBoardTruth

  /** DOM_ARSBOKEN_MANAGERSEKTION_2026-09-02.md — "Din säsong som tränare".
   *  managerProfile.diary filtrerad till denna säsong, fryst här av samma
   *  skäl som retiredPlayers/topScorer ovan: game.managerProfile.diary
   *  fortsätter växa efter att denna summary sparats, så en live-läsning år
   *  senare hade kunnat visa fel säsongs rader. Texten (arrival/burnout_peak/
   *  burnout_scar/era_shift/rivalry/milestone) är redan skriven vid entry-
   *  tillfället (Opus, eller en dedikerad eventResolver.ts-hook som
   *  burnout_scar) — sektionen RENDERAR den befintliga texten, genererar
   *  ingen ny; bara rubrik + inramningsmening i SeasonSummaryScreen.tsx är
   *  nya och väntar på Opus. Absent = ingen dagboksrad denna säsong, inte en
   *  tom lista — en lugn säsong utan diary-drama får ingen managersektion. */
  managerSeason?: ManagerNarrativeEntry[]
}

/**
 * A-H4 — se `SeasonSummary.boardTruth` ovan för den fulla motiveringen.
 * Byggs ENDAST av `buildSeasonBoardTruth()` (boardService.ts) — aldrig
 * konstruerad direkt av en anropare, så alla tre fält alltid är beräknade
 * av samma pure functions (computeSeasonVerdictRating/
 * expectationVerdictFromRating/boardPatienceZoneFromScore) som resten av
 * styrelsekoden redan delar.
 */
export interface SeasonBoardTruth {
  /** Vad styrelsen konkret krävde denna säsong — inte bara enumnamnet. */
  statedGoal: {
    expectation: ClubExpectation
    /** Positionen ClubExpectation-nivån konkret motsvarar
     *  (BOARD_EXPECTATION_ANCHOR_POSITION, boardService.ts) — "utmana
     *  toppen" blir siffran 4, inte bara etiketten. */
    anchorPosition: number
    /** Styrelsens egen kortfras för målet (BOARD_EXPECTATION_TEXT). */
    label: string
  }
  /** Vad som faktiskt hände — samma rating/dom som styrelsebetyget och
   *  årsboken (computeSeasonVerdictRating/expectationVerdictFromRating),
   *  aldrig en egen tröskeltabell. */
  outcome: {
    finalPosition: number
    /** 1–5, samma skala som inkorgens styrelsebetyg. */
    rating: 1 | 2 | 3 | 4 | 5
    verdict: 'exceeded' | 'met' | 'failed'
    isChampion: boolean
  }
  /** Var relationen stod i SAMMA ögonblick — efter säsongsslutets fulla
   *  boardPatience-uppdatering (löpande delen UNDER säsongen +
   *  säsongsslutets egen term + objektivkostnad), samma värde som skrivs
   *  till `game.boardPatience`/`game.consecutiveFailures` för nästa säsong. */
  relationship: {
    boardPatienceAfter: number
    zone: BoardPatienceZone
    consecutiveFailuresAfter: number
    managerFired: boolean
    /** Varför avskedet skedde — undefined när managerFired===false.
     *  'boardPatience'/'consecutiveFailures' speglar samma två sportsliga
     *  avskedsvägar seasonEndProcessor.ts redan avgör (avstängda för
     *  Survive-tiern), 'licenseDenied' den finansiella/administrativa
     *  vägen som gäller även för Survive. 'bankruptcy' hör INTE hemma i en
     *  boardTruth-snapshot (den avskedsvägen sker mitt i säsongen, innan
     *  seasonEndProcessor någonsin körs för den säsongen — se
     *  SaveGame.firedReason) men delar samma unionstyp så
     *  gameOverBoardStatement kan hantera båda källorna utan cast. */
    firedReason?: 'boardPatience' | 'consecutiveFailures' | 'licenseDenied' | 'bankruptcy'
  }
}
