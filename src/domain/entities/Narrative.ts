import type { ClubEra } from './SaveGame'
import type { MatchHighlightCategory } from './SeasonSummary'
import type { TransferRole } from './Moment'
import type { AcademyLevel } from './Academy'

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
  /** C-SY1 Pilot 2: stabil identitet för den faktiskt visade pressfrågan. */
  questionId?: string
  /** C-SY1 Pilot 2: stabil identitet för svaret spelaren faktiskt valde. */
  answerId?: string
  /** Personen frågan gällde, när interaktionen var spelarbunden. */
  subjectPlayerId?: string
  /** Matchen interaktionen gällde; används som orsak, aldrig som tidsaxel. */
  fixtureId?: string
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

export interface StorylineEntry extends BaseArc {
  id: string
  type: StorylineType
  /** BaseArc-projektion: storylines har ingen separat fas-state. */
  phase?: 'building' | 'resolved'
  /** BaseArc-projektion: person-, klubb- eller relationsankare när sådan finns. */
  subject?: string
  /** BaseArc-projektion av den befintliga tidsaxeln. */
  startedSeason?: number
  startedMatchday?: number
  season: number
  matchday: number
  playerId?: string
  /** Exact pair/group anchor for storylines involving more than one player. */
  playerIds?: string[]
  clubId?: string
  /** Motpart när upplösningen är klubb-till-klubb, t.ex. ett derbyeko. */
  relatedClubId?: string
  /** Rått utfall för kanoniska återkopplingar; aldrig färdig ton eller text. */
  outcome?: EventLedgerEntry['outcome']
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
  | 'storyline_resolution' | 'scandal' | 'national_team_callup'
  | 'decision'
  | 'decision_lifecycle'
  // MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md Skärpning 3 (Opus dom,
  // femte verklighetskollen) — Moments otäckta källor (Moment.ts's
  // MomentSource, minus 'mecenat_left', som släpptes som död i samma dom).
  | 'star_injury' | 'derby_win' | 'captain_crisis' | 'nemesis_signed'
  | 'rival_sale' | 'sponsor_positive' | 'sponsor_negative'
  | 'mecenat_costshare' | 'transfer_story' | 'season_highlight' | 'era_shift'
  // Fas 4+ (2026-09-02, Opus dom) — mecenat_left-ripplens tredje och sista
  // systemtrigger. `patron_change` (se DOM 2026-09-03 nedan) fel entitet
  // (Patron ≠ Mecenat), `mecenat_costshare` fel händelse (kostnadsdelning,
  // inte avhopp) — ingen befintlig medlem täckte "en mecenat lämnade",
  // därav ny medlem.
  | 'mecenat_withdrawal'
  // DOM_PATRON_MECENAT_LAST_2026-09-02.md (Jacobs dom) — patron→liggaren.
  // `patron_change` (RETIRERAD DOM 2026-09-03, liggare-k9: TA BORT ur
  // unionen — ersatt av emerge/withdrawal, konsumentkartans §11) fanns
  // redan men konstruerades ALDRIG någonstans (varken i det gamla
  // MemoryEventType eller här) — för generisk för att bära både
  // anskaffning och uttåg (samma polaritetsdelning som sponsor_positive/
  // negative och transfer_signed/sold), lämnad orörd. patron_withdrawal är
  // medvetet skild från mecenat_withdrawal — grundpelarens uttåg är en egen,
  // tyngre sak (domens ord), inte samma händelse på en annan entitet.
  | 'patron_emerge' | 'patron_withdrawal'
  // DOM_DOMARRELATION_2026-09-02 (Jacobs beslut, nivå 3) — clubReaction-
  // valet (respekt/protest) blir sant på riktigt: när den ackumulerade
  // domar-attityden korsar en tröskel (genuin fejd vid -2, genuint
  // förtroende vid +2) skrivs en liggarpost. Två separata typer, samma
  // polaritetsmönster som patron_emerge/withdrawal och sponsor_positive/
  // negative — inte en typ + outcome-fält.
  | 'referee_feud' | 'referee_trust'
  // Burnout-bågens strukturerade fasminne. Besluten ligger fortsatt som
  // type:'decision'; denna typ säger bara att zonen markerades, lättade eller
  // slöts. semanticKey bär fas+zon, aldrig färdig prosa.
  | 'manager_burnout'
  // DOM_ROSTINTRODUKTIONER_2026-09-06 — själva introduktionen HÄNDE och
  // hör därför till kanon. Behörigheten att tala ligger separat i
  // SaveGame.introducedVoices och härleds aldrig tillbaka ur ledgern.
  | 'voice_introduced'
  // DOM_AKADEMI_LIGGARE_2026-09-04 §4 (akademi-junior-fyller-20, Jacobs kall
  // 2026-09-05: JA) — en P19-spelare som fyller tjugo utan uppflyttning
  // försvann tidigare ljudlöst (game.youthTeam.players filtrerades bort,
  // ingen post, ingen konsument). subject = junioren.
  | 'youth_aged_out'
  // DOM_AKADEMI_LIGGARE_2026-09-04 §1: investeringen och den senare
  // färdigställningen är två verkliga tidpunkter. Båda ägs av klubben;
  // payloaden nedan bär betalad nivåväxling respektive nivån som slog till.
  | 'academy_upgrade_started' | 'academy_upgrade_completed'
  // DOM_AKADEMI_LIGGARE §1/§3: ett mentorband är en tvåpersonshändelse.
  // subject = junior, subject2 = mentor; båda snapshotas av logEvent.
  | 'mentorship_started' | 'mentorship_ended'
  | 'youth_intake'
  | 'loan_started' | 'loan_returned'
  // RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md §3 (liggare-ny-board-verdict):
  // styrelsens säsongsdom fanns bara som `SeasonSummary.boardTruth` (en
  // frusen F-projektion) — Krönikan/Berättaren kunde aldrig minnas att
  // styrelsen tappade tålamodet ett visst år. subject = managed club.
  | 'board_verdict'
  // RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md §3 (liggare-ny-license-event):
  // licensnämndens dom (varning/poängavdrag/nekad/cleared) fanns bara som
  // ett Inbox-brev + en frusen zon på game.licenseStatus — Krönikan/
  // årsboken kunde aldrig peka tillbaka på "det året licensen var hotad".
  // subject = managed club.
  | 'license_event'
  // RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md §3 (liggare-ny-facility-trial-
  // outcome): ett bordlagt/nedlagt/kommun-nekat hallbygge glömdes — bara
  // `facility_built` skrevs, och bara VID lyckat bygge. subject = managed
  // club (hallProcessService.ts's trial är enkel-klubbsdata).
  | 'facility_trial_outcome'
  // RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md §3 (liggare-ny-community-shift):
  // när orten korsar 30/50/70 finns ingen post — "orten vände i februari"
  // kunde inte minnas. Spegel av repMilestone-mönstret (reputationMilestone-
  // Service.ts), fast på communityStanding-axeln. subject = managed club.
  | 'community_shift'
  // RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md §3 + SPEC_BERATTAREN §5
  // (liggare-ny-letter): brevet skrivs idag BARA till `game.bandyLetters`
  // (en ficka) — Efterklangs followUp läser fickan direkt, Berättaren ser
  // den aldrig. subject = managed club (avsändaren är namngiven i
  // subjectSnapshot, inte en spårad entitet med egen kind).
  | 'letter'
  // DOM_K12_TRANSFER_TARGET_MISSED_2026-09-08 (liggare-k12): ett utgående
  // bud som resolvar rejected/expired — spelaren vi jagade och missade.
  // EGEN typ, INTE en fjärde TransferRole: TransferRole/transfer_story
  // betyder "VÅR spelare LÄMNADE", vilket aldrig hände honom (han var
  // aldrig vår). subject = den jagade spelaren, subject2 = hans klubb vid
  // budtillfället (bägge snapshotas av logEvent).
  | 'transfer_target_missed'
  // DOM_MANAGER_ATERKOMST_2026-09-08 (stickiness-copy-roster §4, "återkomst
  // till gamla klubben"): managern tar en klubb hen tränat förr — sant och
  // bevisbart via managerProfile.clubSpells, men skedde vid signeringen och
  // hör därför ontologiskt i liggaren, inte som ett state-undantag pushen
  // läser direkt (skulle kringgå redaktören/dirigenten). subject = klubben
  // som tas över. Skrivs av switchManagedClub.ts.
  | 'manager_return'
  // TEXTLEVERANS_OPUS_2026-09-08 (stickiness-copy-roster B12-mönstret, SMAL
  // scope-dom): tre raka ligaomgångar med minst en utvisning under
  // formation_523 — mönstret HÄNDER (blir sant) exakt vid tredje matchen,
  // hör därför i liggaren precis som manager_return, inte som ett live
  // state-undantag pushadaptern räknar fram själv. subject = managed club
  // (mönstret är managerns eget taktikval, ingen motpart). Skrivs av
  // clubMemoryEventBuilders.ts's buildTacticalPatternSuspension523LedgerEntry,
  // anropad från matchOutcomeProcessor.ts. Den generella 13-faktorsversionen
  // (valfri kostnadsfaktor, inte bara formation_523) är POST_LAUNCH.
  | 'tactical_pattern_suspension'
  // DOM_STYRELSEMOTE_NY_KLUBB_2026-09-10 (tillstånd N): övertagandet är ett
  // durabelt karriärfaktum, oavsett om det är managerns första gång hos
  // klubben eller en återkomst (manager_return täcker bara det senare).
  // subject = klubben som tas över. Belägg för tillstånd N; det aktiva
  // tillståndet ägs av managerProfile.seasonsAtClub + clubSpells, inte
  // denna post ensam. Skrivs av switchManagedClub.ts.
  | 'manager_appointed'

/**
 * `RippleChainStep` (SaveGame.ts) utan `label`/`scope` — de är vy-beslut
 * (etikett + vem den gäller), hör till konsumenten, inte liggaren. `field`
 * är RippleChainSteps `label` uttryckt som fältnamn i stället för svensk
 * text: Stämningen→fanMood, Klacken→supporterMood, Orten→communityStanding,
 * Styrelsen→boardPatience, Sponsorerna→sponsorNetworkMood, Kassan→finances,
 * Transferbudget→transferBudget, Moralen→playerMorale,
 * Domaren→refereeRelationship. `dir`/`magnitude`
 * återanvänder ripple-kedjans egen skala rakt av — ingen ny form.
 */
export interface LedgerConsequence {
  field: 'fanMood' | 'communityStanding' | 'boardPatience'
        | 'sponsorNetworkMood' | 'supporterMood' | 'playerMorale'
        | 'finances' | 'transferBudget' | 'refereeRelationship'
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
  /** Present only for decision_lifecycle entries: the concrete queue id. */
  sourceEventId?: string
  /** Present only for decision_lifecycle entries. */
  resolution?: 'resolved' | 'expired'

  /**
   * Klubben som händelsen inträffade för. Liggaren följer hela
   * managerkarriären och kan därför inte behandlas som enkel-klubbsdata när
   * spelaren byter jobb. Valfritt endast för äldre sparfiler; alla nya
   * skrivvägar stämplas centralt av logEvent/appendMomentsAndEntriesToLedger.
  */
  clubId?: string
  /** Legacy-backfillens sista utväg när ursprungsklubben inte kan beläggas. */
  clubIdInferred?: boolean
  /**
   * Den managerkarriär som äger händelsen när posten beskriver ett val,
   * managerns eget öde eller ett personligt spelaruppdrag. Frånvaro betyder
   * att posten tillhör klubben/världen, inte att nuvarande manager antas.
   */
  managerId?: string

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
  // 'patron' tillagd DOM_PATRON_MECENAT_LAST_2026-09-02.md (Jacobs dom) —
  // samma polymorfa union, en fjärde entitetstyp. Patron.id är fältet
  // subject.id pekar på (aldrig patron.name — id är en identitet, namnet
  // slås upp via id:t vid vy-tillfället, samma mönster som player/club/mecenat).
  // 'referee' tillagd DOM_DOMARRELATION_2026-09-02.md (Jacobs dom) — samma
  // polymorfa union, en femte entitetstyp. Referee.id (redan ett stabilt
  // id-fält, ingen patron-liknande migrering behövs).
  subject?: { kind: 'player' | 'club' | 'mecenat' | 'patron' | 'referee' | 'voice'; id: string }
  // Skärpning 3 (Fas 4 Moment-vägval, 2026-09-01, Opus dom): för genuint
  // två-parts-händelser — en Moment som redan bär BÅDA subjectPlayerId OCH
  // subjectClubId (transfer_story: spelaren + köpande klubben; rival_sale:
  // spelaren + rivalklubben). Legitimt bara när källan redan bär två
  // identiteter — ALDRIG en dumpningsplats för en andra godtycklig referens.
  subject2?: { kind: 'player' | 'club' | 'mecenat'; id: string }
  /**
   * DOM_AKADEMI_LIGGARE_2026-09-04 §2 + DOM_SUBJECT2SNAPSHOT_2026-09-08: en
   * spelares namn ska överleva att personen försvinner ur den array
   * subject.id pekar in i (game.players för en såld/pensionerad spelare,
   * game.youthTeam.players för en P19-spelare som åldras ut eller flyttas
   * upp — ingen av arrayerna behåller en post för den som lämnat). Fyllt av
   * `logEvent` vid skrivtillfället, ENDAST när `subject.kind === 'player'`
   * — subject2:s spelarnamn (om `subject2.kind === 'player'`) bärs av det
   * SEPARATA syskonfältet `subject2Snapshot` nedan, inte av detta fält (ett
   * enda platt fält kan inte bära två namn — se subject2Snapshot). Bara
   * namn/position/ålder — inga andra fält, ingen duplicering av
   * spelarschemat. `resolveSubjectName` läser snapshotet FÖRST, `game.players`
   * som fallback (bakåtkompatibelt, äldre poster saknar fältet).
   */
  subjectSnapshot?: { name: string; position?: string; age?: number }
  /**
   * DOM_SUBJECT2SNAPSHOT_2026-09-08: speglar `subjectSnapshot` exakt, men
   * för `subject2` — fyllt av `logEvent` ENDAST när `subject2.kind ===
   * 'player'` (t.ex. akademins mentorship_started/ended, där subject=junior
   * och subject2=mentor, båda spelare, båda kan lämna sina arrayer). Två
   * platta fält, inte en nycklad/array-struktur — schemat har redan bundit
   * sig vid platt subject+subject2, och detta speglar den formen. Icke-
   * spelare (club/mecenat) slås upp via id vid vy-tillfället, snapshotas
   * aldrig — bara spelare lämnar en array på det sätt som kräver det.
   */
  subject2Snapshot?: { name: string; position?: string; age?: number }

  // ── VAD BLEV DET ──
  outcome?: 'won' | 'lost' | 'neutral'
  /** 0-100, samma skala som clubMemory/weights. */
  significance: number
  /** = ripples åtta fält, VAD SOM SKALVADE — en läsning av describeRippleChain, inte ett andra minne. */
  consequences?: LedgerConsequence[]

  // ── BESLUTS-NATUR (skärpning 2026-09-01, Opus dom, Fas 2-vägval) ──
  // Sätts BARA av type:'decision'-byggare — A-H9:s rangordningsvektor
  // (namngiven person → irreversibelt → spänning → antal system → kr) så
  // pickSeasonDecisionFromLedger (seasonDecisionCaptureService.ts) kan rekonstrueras
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
  /**
   * arsbok-generisk-beslutssats (DOM 2026-09-06, Opus): beslutets etikett SOM
   * SPELAREN SÅG DEN (`choice.label`), satt generiskt vid skrivtillfället —
   * inte en ny prosa-mall per typ. Bär den neutrala årsboksmeningens
   * `{Handling}`-token när ingen specialskriven `composeSeasonDecisionSentence`-
   * gren känner igen `semanticKey`n. En sluten byggarmängd (åtta handskrivna
   * fall) täcker inte "varje" `madeByPlayer`-beslut per domen — det gör
   * `actionLabel` + `moneyAmount` tillsammans, generiskt, utan ny textmall.
   */
  actionLabel?: string
  /**
   * arsbok-skuld-recurringcost (DOM 2026-09-06, Opus): en återkommande framtida
   * kostnad skild från engångsbeloppet i `moneyAmount` — t.ex. kommunlånets
   * årskostnad över dess löptid. Satt GENERISKT ur den resulterande spelstatusen
   * (samma before/after-princip som `moneyAmount` redan använder), aldrig
   * härledd/gissad. `composeGenericDecisionSentence` fyller "och {skuld} framåt"
   * bara när fältet finns — hellre ingen skuldsats än en falsk.
   */
  recurringCost?: { amountPerSeason: number; seasons: number }

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
  /** youth_aged_out (DOM_AKADEMI_LIGGARE §4). `other_club` reserverat, produceras inte i v1. */
  youthAgedOut?: { outcome: 'released' | 'other_club'; stars: number; caAtExit: number }
  /** DOM_AKADEMI_LIGGARE §1. Formen skiljs av vilka fält händelsetypen kräver. */
  academyUpgrade?:
    | { fromLevel: Exclude<AcademyLevel, 'elite'>; toLevel: Exclude<AcademyLevel, 'basic'>; costKr: number; readySeason: number }
    | { level: Exclude<AcademyLevel, 'basic'> }
  /** DOM_AKADEMI_LIGGARE §1/§3. Händelsetypen avgör vilken gren som gäller. */
  mentorship?:
    | { mentorId: string; juniorCaAtStart: number; developmentRateAtStart: number }
    | { reason: 'graduated' | 'promoted' | 'aged_out' | 'cancelled'; juniorCaAtEnd: number; seasons: number }
  /** DOM_AKADEMI_LIGGARE §1/§6: en gemensam form för varje verklig kullväg. */
  youthIntake?: {
    count: number
    topProspectId?: string
    topProspectStars?: number
    academyLevel: AcademyLevel
    source: 'summer' | 'school' | 'partner'
  }
  /** DOM_AKADEMI_LIGGARE §1/§3: start respektive mätbart returutfall. */
  loan?:
    | { toClubId: string; occasions: number; caAtStart: number }
    | { caAtStart: number; caAtReturn: number; loanBonus: number; matches: number; goals: number; avgRating: number }
  /**
   * board_verdict (liggare-ny-board-verdict). `verdict` återanvänder
   * `expectationVerdictFromRating`s befintliga tre värden ordagrant —
   * INTE omspårningsradens skiss ('over'/'as_expected'/'under'), som var en
   * ogenomförd nyuppfinning av en etikett koden redan hade. `objectiveStatus`
   * är en tre-vägs sammanfattning av säsongens `boardObjectives`-status
   * (finns 'failed' → 'failed'; annars finns 'at_risk'/'active' → 'partial';
   * annars → 'met'), ur samma `objectiveOutcome`-räkning seasonEndProcessor.ts
   * redan bygger. `patienceBand` = `boardPatienceZoneFromScore`s zon.
   */
  boardVerdict?: {
    verdict: 'exceeded' | 'met' | 'failed'
    objectiveStatus: 'met' | 'partial' | 'failed'
    patienceBand: 'stabilt' | 'under_press' | 'ultimatum'
  }
  /**
   * license_event (liggare-ny-license-event). `status` är licenseService.ts's
   * FAKTISKA `LicenseActionType` (inte importerad — entities importerar
   * aldrig services, samma mönster som boardVerdict ovan), inte en ny
   * etikettuppsättning. `deficitKr` sätts bara vid ett underskottsår
   * (`checkLicenseStatus`s netResult < 0). `pointsDeducted` sätts bara vid
   * `status: 'point_deduction'` och återanvänder den redan hårdkodade
   * straffmagnituden (3) från `licensePendingDeductions`, ingen ny siffra.
   */
  licenseEvent?: {
    status: 'cleared' | 'first_warning' | 'point_deduction' | 'license_denied'
    deficitKr?: number
    pointsDeducted?: number
  }
  /**
   * facility_trial_outcome (liggare-ny-facility-trial-outcome). `stage` är
   * hallProcessService.ts's `HallTrialStage` vid resolutionen (bara
   * 'bordlagd'/'nedlagd' här — de enda terminala icke-bygge-utfallen).
   * `outcome` återanvänder `PROVNING_RESOLUTION`s FYRA befintliga nycklar
   * ordagrant (hallProvningData.ts) plus en femte (`nedlagd_ingen_finansiering`)
   * för den enda vägen utan egen låst text (eventResolver.ts's kommentar:
   * "förhandlingens ANDRA nej ... rörs inte") — ingen ny etikett för de fyra
   * som redan finns, ingen ny PROSA för den femte (bara en intern nyckel,
   * ingen konsument renderar den ännu). `support` är trialens stödnivå vid
   * resolutionstillfället.
   */
  facilityTrialOutcome?: {
    stage: 'bordlagd' | 'nedlagd'
    outcome: 'bordlagd' | 'nedlagd_fall' | 'nedlagd_egen' | 'kommun_nej' | 'nedlagd_ingen_finansiering'
    support: number
  }
  /**
   * community_shift (liggare-ny-community-shift). `from`/`to` är de faktiska
   * communityStanding-talen omgången skiftade mellan (inte tröskelvärdet
   * 30/50/70 som utlöste posten) — samma sak den låsta texten fyller i.
   */
  communityShift?: {
    from: number
    to: number
    direction: 'up' | 'down'
  }
  /**
   * letter (liggare-ny-letter). `kind` har idag bara ETT verkligt medlem —
   * `saveBandyLetter` (DREAM-010) producerar enbart fanpost — men är en
   * union, inte en enkel boolean, så nästa brevtyp (SPEC_BERATTAREN §5
   * nämner fler) inte kräver ett schemabrott. `letterId` = BandyLetter.id
   * (== eventId vid skrivtillfället). Avsändaren bärs av `subjectSnapshot`
   * ({name, age}), inte av `subject` — brevskribenten är ingen spårad
   * entitet med egen `subject.kind`.
   */
  letter?: {
    letterId: string
    kind: 'fan_mail'
  }

  /**
   * liggare-k9-doda-typer (DOM 2026-09-04, Opus): matchresultatet ÄR rå
   * sanning (det hände, siffrorna är fakta) — och när `game.fixtures`
   * nollställs varje rollover (k10) är denna post den ENDA plats där
   * resultatet överlever bortom innevarande säsong. Satt bara på de fem
   * match-resultat-typerna (se `isMatchResultEntry` nedan) — aldrig en
   * generisk payload-påse för andra typer.
   */
  result?: MatchResultPayload
  /**
   * transfer_target_missed (DOM_K12_TRANSFER_TARGET_MISSED_2026-09-08).
   * `bidKr` = det utgående budets `offerAmount` vid resolutionstillfället
   * (rejected/expired) — inte marknadsvärdet. `targetClubId` = klubben han
   * spelade för DÅ (`bid.sellingClubId`), fryst separat från `subject2` så
   * en senare klubbyte inte förväxlas med budtillfällets identitet.
   */
  transferTargetMissed?: { bidKr: number; targetClubId: string }
}

/**
 * SPEC_BERATTAREN_2026-09-04 §4 — alla berättande ytor delar samma
 * kvitto. Push är en yta i Berättaren, inte en separat redaktion.
 */
export type NarrativeSurface =
  | 'portal'
  | 'efterklang'
  | 'press'
  | 'yearbook'
  | 'review'
  | 'coffee_room'
  | 'push'

export interface LedgerToldMark {
  surface: NarrativeSurface
  season: number
  matchday: number
}

export type LedgerToldRegistry = Record<string, LedgerToldMark[]>

export interface MatchResultPayload {
  goalsFor: number
  goalsAgainst: number
  opponentClubId: string
  home: boolean
  competition: 'league' | 'cup' | 'playoff' | 'final'
  stage?: string
}

const MATCH_RESULT_LEDGER_TYPES = new Set<EventLedgerType>(['cup_final', 'sm_final', 'derby_result', 'big_win', 'big_loss'])

/**
 * Typvakt — DOM 2026-09-04:s "bara tillåten på de fem matchtyperna".
 * `season_finish` är MEDVETET UTANFÖR (Code-fynd 2026-09-04): dess data
 * (slutplacering) förloras aldrig — `game.seasonSummaries[].finalPosition`
 * ackumuleras för alltid (till skillnad från `game.fixtures`, som nollställs
 * varje rollover), så season_finish behöver aldrig `result`. Se
 * clubMemoryService.ts's `seasonFinishDataForSeason`.
 */
export function isMatchResultEntry(entry: EventLedgerEntry): entry is EventLedgerEntry & { result: MatchResultPayload } {
  return MATCH_RESULT_LEDGER_TYPES.has(entry.type) && entry.result !== undefined
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
