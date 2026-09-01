/**
 * Gemensam basstruktur för alla arc-lika system.
 * Specifika arc-typer (TrainerArc, ActiveArc) utökar detta.
 * Fält är optional för bakåtkompatibilitet med befintliga sparade spel.
 */
export interface BaseArc {
  id?: string
  type?: string           // arc-typ-nyckel
  subject?: string        // vem/vad handlar det om
  phase?: string          // aktuell fas
  startedMatchday?: number
  startedSeason?: number
  expiresMatchday?: number
}

export interface NamedCharacter {
  id: string
  name: string
  role: string
  age?: number
  isAlive?: boolean
  morale?: number
}

export type JournalistPersona = 'supportive' | 'critical' | 'analytical' | 'sensationalist'

export interface JournalistMemory {
  season: number
  matchday: number
  event: string       // 'refused_press', 'good_answer', 'bad_answer', 'big_win', 'crisis'
  sentiment: number   // -10 to +10
  opponentShort?: string  // B1 — motståndaren matchen gällde, för Efterklang-premiss ("…efter {opp}")
}

export interface Journalist {
  name: string
  outlet: string        // e.g. "Gefle Dagblad", from localPaperName
  persona: JournalistPersona
  style: 'neutral' | 'provocative' | 'supportive'
  relationship: number  // 0-100, replaces journalistRelationship
  memory: JournalistMemory[]  // last 10 interactions
  pressRefusals: number       // times manager refused press conference
  favoritePlayerId?: string   // player they write about most
  lastInteractionMatchday?: number
  lastTriggeredRelationship?: number  // snapshot used by detectRelationshipEvent
}

export type ArcPhase =
  | 'newcomer'
  | 'honeymoon'
  | 'grind'
  | 'questioned'
  | 'crisis'
  | 'redemption'
  | 'established'
  | 'legendary'
  | 'farewell'

export interface ArcTransition {
  from: ArcPhase
  to: ArcPhase
  matchday: number
  season: number
  reason: string
}

export interface TrainerArc extends BaseArc {
  type?: 'trainer'
  subject?: 'manager'
  phase?: ArcPhase
  current: ArcPhase     // behåll för bakåtkompatibilitet — primär fas-källa
  history: ArcTransition[]
  seasonCount: number
  bestFinish: number
  titlesWon: number
  consecutiveLosses: number
  consecutiveWins: number
  boardWarningGiven: boolean
  lastCountedFixtureId?: string
}

export type StorylineType =
  | 'rescued_from_unemployment'
  | 'went_fulltime_pro'
  | 'refused_to_go_pro'
  | 'left_for_bigger_club'
  | 'returned_to_club'
  | 'workplace_bond'
  | 'journalist_feud'
  | 'journalist_redemption'
  | 'promotion_sacrifice'
  | 'career_crossroads_stayed'
  | 'underdog_season'
  | 'relegation_escape'
  | 'gala_winner'
  | 'partner_moved_here'
  | 'captain_rallied_team'
  // Arc resolutions
  | 'hungrig_breakthrough'
  | 'joker_vindicated'
  | 'veteran_farewell'
  | 'veteran_stayed'
  | 'lokal_hero_moment'
  | 'contract_drama_resolved'
  | 'derby_echo_resolved'

export interface StorylineEntry {
  id: string
  type: StorylineType
  season: number
  matchday: number
  playerId?: string
  clubId?: string
  description: string
  displayText: string
  resolved: boolean
}

/**
 * U5 (SLUTTEST_KO.md, 2026-08-17) — DOM GIVEN. En delad logg, en skrivväg,
 * två läsvägar: narrativ cooldown per båge (isOnCooldown, U5) och
 * systemhändelsebudget per säsong (systemhandelseBudgetOk, O19). Ersätter
 * INTE de åtta befintliga cooldown-/dedupmekanismerna (resolvedEventIds,
 * resolvedWeeklyDecisions, shownBeats, shownScenes, activeArcs,
 * sourceCooldowns, cardStaleTracking, klackEcho) under migreringen — de
 * ligger kvar parallellt tills alla källor skriver hit. Se
 * narrativeLogService.ts.
 */
export interface NarrativeLogEntry {
  semanticKey: string
  season: number
  round: number
  systemhandelse?: boolean
}

/**
 * DOM_HANDELSELIGGAREN_2026-09-01.md / MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md
 * (Opus schema, låst 2026-09-01) — Fas 0. En kanonisk, intern, append-only
 * händelseliggare. Spelaren ser den ALDRIG. "Rå sanning i botten, all mening
 * i ytorna": inget fält bär ton — ingen `text`/`emoji`/`sentence`/`kind`/
 * `title`. De genereras i respektive konsuments vy ur fälten nedan.
 *
 * Sluten union, inte fri sträng — samma disciplin som NarrativeLogEntry
 * ovan redan slår fast (en fri kategori luddar upp det enda som gör loggen
 * läsbar). Startmängden: clubMemoryService.ts's MemoryEventType plus
 * besluts-typerna. Utöka när en migrerande källa (Fas 3+) bär en typ
 * unionen inte täcker — ALDRIG en fri sträng som flykt; det är ett vägval
 * (Opus dömer), inte en tyst fältutökning.
 */
export type EventLedgerType =
  | 'season_finish' | 'cup_final' | 'sm_final' | 'derby_result'
  | 'big_win' | 'big_loss' | 'player_milestone' | 'academy_promotion'
  | 'retirement' | 'facility_built' | 'transfer_signed' | 'transfer_sold'
  | 'patron_change' | 'storyline_resolution' | 'scandal' | 'national_team_callup'
  | 'decision'

/**
 * `RippleChainStep` (SaveGame.ts) utan `label`/`scope` — de är vy-beslut
 * (etikett + vem den gäller), hör till konsumenten, inte liggaren. `field`
 * är RippleChainSteps `label` uttryckt som fältnamn i stället för svensk
 * text: Stämningen→fanMood, Klacken→supporterMood, Orten→communityStanding,
 * Styrelsen→boardPatience, Sponsorerna→sponsorNetworkMood, Kassan→finances,
 * Transferbudget→transferBudget, Moralen→playerMorale. `dir`/`magnitude`
 * återanvänder ripple-kedjans egen skala rakt av — ingen ny form.
 */
export interface LedgerConsequence {
  field: 'fanMood' | 'communityStanding' | 'boardPatience'
        | 'sponsorNetworkMood' | 'supporterMood' | 'playerMorale'
        | 'finances' | 'transferBudget'
  dir: 'up' | 'down'
  magnitude: 'knappt' | 'tydligt' | 'kraftigt'
}

/**
 * Ingen `id`-post. Append-only + `season`+`matchday`+`type`+subject är
 * identitet nog (samma mönster som clubMemoryService.ts's `buildEventId`,
 * som konstruerar sin identitet ur exakt de fälten). Ingen syntetisk nyckel
 * som kan divergera.
 *
 * Ingen referens tillbaka till det gamla minnet (rippleChainId/
 * decisionCandidateId el. dyl.) — MEDVETET. En sådan länk gör liggaren
 * beroende av det den ska ersätta, och retire-steget (migreringsplanens
 * regel 2) kan då aldrig köras rent. Posten står på egna ben från Fas 0.
 */
export interface EventLedgerEntry {
  // ── VAD ──
  type: EventLedgerType
  /** narrativeBeatLogs nyckel, bärs vidare redan nu så Fas 3 inte behöver bakåtfylla. */
  semanticKey: string

  // ── NÄR ──
  season: number
  /** Kronologi, ALDRIG rond-identitet i UI (roundLabel-regeln). */
  matchday: number

  // ── VEM (valfritt, minst ett för entitets-händelser) ──
  subjectPlayerId?: string
  subjectClubId?: string

  // ── VAD BLEV DET ──
  outcome?: 'won' | 'lost' | 'neutral'
  /** 0-100, samma skala som clubMemory/weights. */
  significance: number
  consequences?: LedgerConsequence[]

  // ── URSPRUNG ──
  /** HIGH 6:s attributions-skillnad (beslut vs systemhändelse) — ärvd, aldrig tappad. */
  madeByPlayer?: boolean
}

export interface BandyLetter {
  id: string
  senderName: string
  senderAge: number
  senderOrigin: string
  season: number
  text: string
  playerReply?: string
  savedInArchive: boolean
}

export interface SchoolAssignmentRecord {
  season: number
  youngPlayerName: string
  choiceLabel: string
  archiveText: string
}

export interface ClubLegend {
  name: string
  position: string
  seasons: number
  totalGoals: number
  totalAssists: number
  titles: string[]
  memorableStory?: string
  retiredSeason: number
  playerId?: string
  role?: 'youth_coach' | 'scout' | 'farewell'
}

export interface AllTimeRecords {
  mostGoalsSeason: { playerName: string; goals: number; season: number } | null
  mostAssistsSeason: { playerName: string; assists: number; season: number } | null
  highestRatingSeason: { playerName: string; rating: number; season: number } | null
  bestFinish: { position: number; season: number } | null
  biggestWin: { score: string; opponent: string; season: number; round: number } | null
  championSeasons: number[]
  cupWinSeasons: number[]
}

export type ArcType =
  | 'hungrig_breakthrough'    // Ung hungrig spelare som kämpar för genombrott
  | 'joker_redemption'        // Joker som kostar/räddar — oförutsägbar
  | 'veteran_farewell'        // Veteran med utgående kontrakt, sista säsongen?
  | 'veteran_final_season'    // Veteran 34+ vars kontrakt löper ut detta år — hela säsongen-arc
  // 'ledare_crisis' BORTTAGEN (H1-uppföljning, 2026-08-24, Jacobs dom) —
  // dubblerade postAdvanceEvents.ts:s captainSpeech (samma trigger, "3
  // förluster i rad"), som är kanon. Se saveGameMigration.ts för migrering
  // av saves med en ledare_crisis-arc mid-flight, och BACKLOG.md "Två
  // läsare, en sanning" för full historik. Återanvänd inte strängen.
  | 'lokal_hero'              // Lokalhjälte som gör något stort
  | 'contract_drama'          // Spelare med utgående kontrakt som fått ett bud
  | 'derby_echo'              // POST-derby efterdyningar (2 omgångar)

export interface ActiveArc extends BaseArc {
  id: string
  type: ArcType
  subject?: string            // spelarnamn (sätts när arc skapas)
  startedSeason?: number
  playerId?: string
  opponentClubId?: string     // derby_echo
  startedMatchday: number
  phase: 'building' | 'peak' | 'resolving'
  expiresMatchday: number
  eventsFired: string[]       // event IDs redan genererade
  decisionsMade: string[]     // choice IDs spelaren valt
  data?: Record<string, unknown>
}
