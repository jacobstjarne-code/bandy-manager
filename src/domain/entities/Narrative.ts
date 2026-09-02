import type { ClubEra } from './SaveGame'
import type { MatchHighlightCategory } from './SeasonSummary'
import type { TransferRole } from './Moment'

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
  | 'workplace_bond'
  | 'journalist_feud'
  | 'journalist_redemption'
  | 'promotion_sacrifice'
  | 'underdog_season'
  | 'relegation_escape'
  | 'gala_winner'
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
  /** Exact pair/group anchor for storylines involving more than one player. */
  playerIds?: string[]
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
  // MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md Skärpning 3 (Opus dom,
  // femte verklighetskollen) — Moments otäckta källor (Moment.ts's
  // MomentSource, minus 'mecenat_left', som släpptes som död i samma dom).
  | 'star_injury' | 'derby_win' | 'captain_crisis' | 'nemesis_signed'
  | 'rival_sale' | 'sponsor_positive' | 'sponsor_negative'
  | 'mecenat_costshare' | 'transfer_story' | 'season_highlight' | 'era_shift'
  // Fas 4+ (2026-09-02, Opus dom) — mecenat_left-ripplens tredje och sista
  // systemtrigger. `patron_change` fel entitet (Patron ≠ Mecenat),
  // `mecenat_costshare` fel händelse (kostnadsdelning, inte avhopp) — ingen
  // befintlig medlem täckte "en mecenat lämnade", därav ny medlem.
  | 'mecenat_withdrawal'

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

  // ── VEM (valfritt) ──
  // Skärpning 2026-09-01 (Fas 2-vägval #2, Opus dom): polymorft, inte
  // subjectPlayerId/subjectClubId. Tre av A-H9:s beslutsbyggare bär en
  // MECENAT som namngiven person — varken player- eller club-id täcker det.
  // Ett fjärde subjectMecenatId? hade bara flyttat problemet till nästa
  // entitetstyp (en domare? en sponsor? en politiker?); polymorfin bär
  // vilken entitet som helst utan att schemat växer per typ. `kind` sluten
  // union, växer medvetet, aldrig en fri sträng — samma disciplin som `type`.
  // pickSeasonDecisions `namedPerson ? 1 : 0` blir `subject !== undefined`.
  subject?: { kind: 'player' | 'club' | 'mecenat'; id: string }
  // Skärpning 3 (Fas 4 Moment-vägval, 2026-09-01, Opus dom): för genuint
  // två-parts-händelser — en Moment som redan bär BÅDA subjectPlayerId OCH
  // subjectClubId (transfer_story: spelaren + köpande klubben; rival_sale:
  // spelaren + rivalklubben). Legitimt bara när källan redan bär två
  // identiteter — ALDRIG en dumpningsplats för en andra godtycklig referens.
  subject2?: { kind: 'player' | 'club' | 'mecenat'; id: string }

  // ── VAD BLEV DET ──
  outcome?: 'won' | 'lost' | 'neutral'
  /** 0-100, samma skala som clubMemory/weights. */
  significance: number
  /** = ripples åtta fält, VAD SOM SKALVADE — en läsning av describeRippleChain, inte ett andra minne. */
  consequences?: LedgerConsequence[]

  // ── BESLUTS-NATUR (skärpning 2026-09-01, Opus dom, Fas 2-vägval) ──
  // Sätts BARA av type:'decision'-byggare — A-H9:s rangordningsvektor
  // (namngiven person → irreversibelt → spänning → antal system → kr) så
  // pickSeasonDecision (seasonDecisionCaptureService.ts) kan rekonstrueras
  // EXAKT ur liggaren, ingen kvalitetsförlust mot dagens rangordning.
  // En derby-vinst/skada sätter ALDRIG dessa fält — annars luddar de upp
  // schemat för alla andra händelsetyper. Beslutets natur, inte dekoration.
  /** A-H9 rangordningsfält 2. */
  irreversible?: boolean
  /** A-H9 rangordningsfält 3 — pekade valet åt olika håll (gjorde det ont)? */
  tension?: boolean
  /**
   * A-H9 rangordningsfält 4 — HUR BRETT beslutet rörde. EGET fält, INTE
   * `consequences.length`: Code:s korskontroll mot alla nio byggare visade
   * 6/9 underräkning (side_mec1/2 till NOLL) — "spelartrupp" (roster) och
   * "mecenatrelation" (happiness) är verkliga A-H9-dimensioner utanför
   * ripples åtta fält. `consequences` = VAD som skalvade (smalt, ripple-
   * troget); `systemsAffectedCount` = HUR BRETT det rörde (bredare fråga).
   * Två frågor, två fält — length var en elegant-men-fel genväg.
   */
  systemsAffectedCount?: number
  /** A-H9 rangordningsfält 5, sista skiljedomaren. */
  moneyAmount?: number

  // ── URSPRUNG ──
  /** HIGH 6:s attributions-skillnad (beslut vs systemhändelse) — ärvd, aldrig tappad. */
  madeByPlayer?: boolean

  // Skärpning 4 (Fas 4 Moment-vägval #2, 2026-09-02, Opus dom): tre Moment-
  // källors bodyn branchade på ett klassificerande värde (olika MENING per
  // gren) innan title/body strippades till liggaren — det värdet måste bäras
  // strukturerat, annars kan ingen branchad vy-mall skrivas. Bara EN sätts
  // per post, `type` avgör vilken (se Moment.ts).
  eraLabel?: ClubEra                      // era_shift
  transferRole?: TransferRole             // transfer_story
  matchCategory?: MatchHighlightCategory  // season_highlight — Code-fynd, flaggat till Opus
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
  totalGames?: number
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
