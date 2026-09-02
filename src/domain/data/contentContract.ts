/**
 * INNEHÅLLSKONTRAKTET (O11, SLUTTEST_KO.md) — `docs/DOM_INNEHALLSKONTRAKTET_2026-08-17.md`.
 *
 * Rapportera-först besvarad, 2026-08-20: NEJ, inget enat register finns.
 * Fyra separata källor, ingen av dem en tabell: `GameEventType` (49 värden,
 * GameEvent.ts — 48 vid O11:s ursprungsleverans, `burnoutRelief` tillagd
 * 2026-08-23 samma pass som täckningsgrinden nedan byggdes), `StorylineType`
 * (22, Narrative.ts), `ArcType` (7, Narrative.ts — 8 vid O11:s leverans,
 * 'ledare_crisis' borttagen 2026-08-24, H1-uppföljningen, se BACKLOG.md
 * "Två läsare, en sanning"), `PORTAL_BEATS` (17 id:n, portalBeats.ts — den
 * enda som redan ÄR en array, inte bara en typ).
 * 49+22+7+17 = 95 distinkta narrativa former.
 * Samma arbete som `U5`:s semanticKey-kartläggning, byggda ihop per domens
 * egen instruktion ("gör dem tillsammans, inte två gånger") — U5 var klar
 * (`4e341891`) innan detta pass startade.
 *
 * TÄCKNINGSLÄGE (ärligt, inte optimistiskt, uppdaterat 2026-09-02): 97 rader (95 vid
 * O11:s ursprungsleverans, +1 `burnoutRelief` 2026-08-23, +1 `burnoutCeiling`
 * 2026-09-02), en per canonical
 * id ur de fyra källorna — registret är strukturellt komplett och
 * användbart som HÄNGSTABELL nu (test: contentContract.test.ts). 40 rader
 * har alla sex fälten ifyllda (`filled: true`) — spårade under detta och
 * tidigare pass i samma session (domens motiverande felfall, två pivotal
 * beats, O2-dominansrevisionens granskade val). Resten (57) är
 * `filled: false`, TODO-rader — antalet ratchet:as nu av
 * `scripts/content-contract-guard.ts` (kan inte öka, se ENFORCEMENT nedan).
 * Att fylla i alla 97 korrekt kräver att varje källa läses individuellt —
 * inte något att gissa sig igenom för hastighetens skull, exakt det
 * kontraktet finns för att förhindra.
 *
 * ENFORCEMENT — O11 (2026-08-23, utökad 2026-08-24). Tre mekanismer, INTE
 * `scripts/eventGuardInstrument.ts` (den simulerar spelat state och fångar
 * RESOLVER-kastar — ett annat verktyg, för en annan sorts fel):
 * — GameEventType/StorylineType/ArcType: tre TS-kompileringstidsassertioner
 *   (AssertNoMissingIds nedan) — ingen runtime-representation finns för en
 *   ren string-literal-union, så tsc är den enda platsen kontrollen kan
 *   göras. En ny unionmedlem utan motsvarande _IDS-post failar `npx tsc`
 *   (= npm run build) med id:t namngivet i felmeddelandet.
 * — PortalBeat: `contentContract.test.ts`s egen `PORTAL_BEAT_IDS_ALL vs
 *   PORTAL_BEATS`-test (PortalBeat är en objektinterface, inte en
 *   stringunion — här FINNS en runtime-array att jämföra mot, så en
 *   vitest-assertion är rätt verktyg, inte en TS-assertion).
 * — `scripts/content-contract-guard.ts` (Jacobs order 2026-08-24, kedjad i
 *   `npm run build`): ratchet på antalet `filled: false`-rader, samma
 *   mönster som `ds-guard.mjs`. En helt saknad rad fångas redan av de två
 *   ovan — den här grinden fångar den andra risken domens "Godkänd
 *   när"-rad faktiskt namngav: en NY rad som läggs till men lämnas
 *   ofylld (eller en tidigare ifylld rad som töms) höjer TODO-antalet över
 *   den sparade baslinjen och failar bygget. Att fylla i fler av de 76
 *   befintliga TODO-raderna sänker antalet — informativt, ratchet kan då
 *   dras åt, precis som ds-guard.
 *
 * KOPPLING TILL D1 PUNKT 4 (Jacobs dom, 2026-08-21): "därför nu"-radens
 * getWhyNowLine() läser HÄRIFRÅN (per GameEventType-rad), inte från
 * event-instansen. Ingen av de tjugoen nu ifyllda raderna bär whyNow-data PÅ
 * TYP-NIVÅ — playerUnhappy/mecenatEvent/criticalEconomy sätter den
 * INSTANS-nivå istället (event.whyNow, se respektive rads notes; DÖMT
 * 2026-08-24), economicStress avsiktligt aldrig. Tills en typ-nivå-rad
 * faktiskt sätter ett whyNow-fält, nedgraderar getEffectivePriority
 * (eventQueueService.ts) den till 'normal' om ingen instans heller satt
 * det — MEDVETET, inte en bugg.
 */

import type { GameEventType } from '../entities/GameEvent'
import type { StorylineType, ArcType } from '../entities/Narrative'

export type ContractSource = 'GameEventType' | 'StorylineType' | 'ArcType' | 'PortalBeat'

export interface ContentContractEntry {
  id: string
  source: ContractSource
  /** Fält 1 — exakt villkor, inte en approximation. */
  trigger?: string
  /** Fält 2 — vilka fält ändras, riktning + storleksordning. 'ambient — ingen
   *  state-effekt' är ett giltigt, avsiktligt svar (domens egen regel: om
   *  svaret är "ingen" är det en notis, inte ett beslut). */
  stateEffect?: string
  /** Fält 3 — minst 1 system/person för en vanlig händelse, minst 2 som
   *  pekar isär för en systemhändelse (varsel-mallen). */
  systems?: string[]
  /** Fält 4 — engångs / N omgångar / säsongsslut / permanent. */
  lifespan?: string
  /** Fält 5 — bågens semanticKey (per båge, inte per säsong) + cooldown i
   *  säsonger. undefined cooldown på en satt semanticKey = ingen spärr. */
  semanticKey?: string
  cooldownSeasons?: number
  /** Fält 6 — var spelaren kan se att det hände efteråt. Alltid en explicit
   *  sträng, ALDRIG undefined — 'ingen' är ett giltigt, medvetet svar för
   *  ambient (skiljer "inte bedömt än" från "bedömt: ingen yta finns"). */
  recallSurface?: string
  /** true = alla sex fält verifierade mot koden. false = platshållare. */
  filled: boolean
  notes?: string

  // ── D1 punkt 4 ("därför nu"-raden) — Jacobs dom 2026-08-21: getWhyNowLine
  // läser HÄR, inte på event-instansen. Fälten sätts bara när en av de fyra
  // formerna kan grundas i faktisk, spårad data för denna rad — aldrig som
  // gissning för att "täcka" en pivotal-klassad typ. En rad utan whyNow-fält
  // är enligt domen inte pivotal, och getEffectivePriority (eventQueueService.ts)
  // nedgraderar den till 'normal' tills raden faktiskt spåras och fylls i.
  /** Redan-formaterad tidpunkt, t.ex. "omgång 14", "transferfönstret stänger". */
  deadlineLabel?: string
  /** Förnamnet på den som väntar på besked. */
  whyNowPerson?: string
  /** HELA eventet (inte ett enskilt val, se EventChoice.irreversible för det) går inte att göra ogjort. */
  wholeEventIrreversible?: boolean
  /** Det som avgörs här bär hela säsongen. */
  seasonDefining?: boolean
}

/**
 * D1 (DOM_D1_EVENTVIKTNING_2026-08-19.md) punkt 4 — "därför nu"-raden.
 * "Den sista punkten är den viktigaste: 'därför nu'-raden är inte dekoration
 * på pivotal, den är kriteriet för pivotal." Fem former, denna funktion
 * returnerar den FÖRSTA som matchar i domens prioritetsordning, eller null
 * om ingen av de fyra formerna är satt på contentContract-raden — då är
 * eventet enligt domen inte pivotal, vikten sänks (getEffectivePriority i
 * eventQueueService.ts). Copy ordagrant låst i domen, ingen ny text här.
 */
export function getWhyNowLine(entry: Pick<ContentContractEntry, 'deadlineLabel' | 'whyNowPerson' | 'wholeEventIrreversible' | 'seasonDefining'> | undefined): string | null {
  if (!entry) return null
  if (entry.deadlineLabel) return `Svaret måste komma före ${entry.deadlineLabel}.`
  if (entry.whyNowPerson) return `${entry.whyNowPerson} väntar på besked.`
  if (entry.wholeEventIrreversible) return 'Det här går inte att göra ogjort.'
  if (entry.seasonDefining) return 'Det som bestäms här bär hela våren.'
  return null
}

/**
 * Medium 4 (Skutskär-auditen, 2026-08-22): "Prioritera per undertyp/instans,
 * inte bara GameEventType. En bastu är normal; ett irreversibelt stjärnsälj
 * eller ett faktiskt ultimatum är pivotal." getWhyNowLine() läste tidigare
 * ENBART den TYP-nivå-rad Jacobs D1-dom (2026-08-21) explicit band den till
 * — alla instanser av t.ex. `criticalEconomy` (en bastuinbjudan OCH ett
 * stjärnsälj-ultimatum delar samma GameEventType) fick antingen samma
 * critical-status eller samma nedgradering, aldrig särskiljda.
 *
 * `event.whyNow` (GameEvent.ts) är den nya, PER-INSTANS-satta motsvarigheten
 * — samma fyra fält, samma låsta copy (getWhyNowLine ändras inte, bara VAR
 * den läser ifrån). Konstruktionsstället sätter den bara när formen faktiskt
 * är grundad i spårad data för DEN HÄR instansen (D1:s egen disciplin,
 * oförändrad) — instansen vinner över typ-raden om båda är satta, eftersom
 * en instans-specifik brådska alltid är mer exakt än en typ-generell.
 */
export function getEffectiveWhyNowLine(event: { type: string; whyNow?: Pick<ContentContractEntry, 'deadlineLabel' | 'whyNowPerson' | 'wholeEventIrreversible' | 'seasonDefining'> }): string | null {
  const instanceLine = getWhyNowLine(event.whyNow)
  if (instanceLine) return instanceLine
  return getWhyNowLine(getContentContractEntry('GameEventType', event.type))
}

// Exporterad (A-M3, SEXSÄSONGSAUDITEN 2026-08-26) så eventTypeLabels.test.ts
// kan iterera EXAKT samma 49 id:n utan att skriva en tredje, driftbenägen
// kopia av listan — en sanning, ett ställe (Port 4/OPUS-regel #4).
export const GAME_EVENT_TYPE_IDS = [
  'transferBidReceived', 'contractRequest', 'playerUnhappy', 'starPerformance', 'sponsorOffer',
  'pressConference', 'dayJobConflict', 'bidWar', 'hesitantPlayer', 'communityEvent', 'patronEvent',
  'politicianEvent', 'hallDebate', 'hallProcess', 'licenseHandlingsplan', 'kommunMote', 'gentjanst',
  'icaMaxiEvent', 'patronInfluence', 'spoksponsor', 'detOmojligaValet', 'varsel', 'playerMediaComment',
  'playerPraise', 'captainSpeech', 'playerArc', 'supporterEvent', 'mecenatInteraction',
  'journalistExclusive', 'retirementCeremony', 'economicStress', 'mecenatEvent', 'academyEvent',
  'playoffEvent', 'bandyLetter', 'criticalEconomy', 'schoolAssignment', 'mecenatDinner',
  'refereeMeeting', 'riskySponsorOffer', 'mecenatWithdrawal', 'patronWithdrawal', 'mediaReaction',
  'fanLetter', 'opponentQuote', 'csPress', 'playThroughInjury', 'seasonGoalHalfway',
  // O4 (DOM_BURNOUT_2026-08-17.md, 2026-08-23) — tillagd i samma pass som
  // O11:s täckningsgrind byggdes. Den grinden hade fångat DENNA rad som
  // saknad om den funnits ett par timmar tidigare samma session.
  'burnoutRelief',
  // ANSPRÅK 4, spak 3 (DOM_ANSPAK4_TREDJE_SPAK_NYHET_2026-08-29.md), 2026-08-31.
  // Raden nedan är ifylld direkt (FILLED) — en ny typ som läggs till ofylld
  // hade höjt TODO-antalet och failat content-contract-guard.
  'communityActivityRenewal',
  // DOM_BURNOUT_TAK_2026-09-02 — samma "fyll direkt"-disciplin.
  'burnoutCeiling',
] as const

const STORYLINE_TYPE_IDS = [
  'rescued_from_unemployment', 'went_fulltime_pro', 'refused_to_go_pro', 'left_for_bigger_club',
  'returned_to_club', 'workplace_bond', 'journalist_feud', 'journalist_redemption', 'promotion_sacrifice',
  'career_crossroads_stayed', 'underdog_season', 'relegation_escape', 'gala_winner', 'partner_moved_here',
  'captain_rallied_team', 'hungrig_breakthrough', 'joker_vindicated', 'veteran_farewell', 'veteran_stayed',
  'lokal_hero_moment', 'contract_drama_resolved', 'derby_echo_resolved',
] as const

// 'ledare_crisis' BORTTAGEN (H1-uppföljning, 2026-08-24) — se Narrative.ts:s
// ArcType-kommentar. AssertNoMissingIds nedan hade failat tsc annars
// (Covered extends readonly ArcType[], 'ledare_crisis' är inte längre ett).
const ARC_TYPE_IDS = [
  'hungrig_breakthrough', 'joker_redemption', 'veteran_farewell', 'veteran_final_season',
  'lokal_hero', 'contract_drama', 'derby_echo',
] as const

// O11 (2026-08-23) — ENFORCEMENT, den del av domen som INTE byggdes i
// ursprungspasset ("byggtid-kontroll som vägrar merge av ofyllda rader").
// Tre kompileringstidsassertioner, en per string-literal-unionkälla (ingen
// runtime-representation finns för en TS-typ — PortalBeat är annorlunda,
// se testet i contentContract.test.ts som jämför mot den RIKTIGA
// PORTAL_BEATS-arrayen). Lägger någon till ett nytt GameEventType/
// StorylineType/ArcType-värde utan att lägga till det i motsvarande
// _IDS-array ovan → tsc failar HÄR, med id:t namngivet i felmeddelandet.
// Ingen ny CI-koppling behövs — tsc körs redan som PORT 1 (npm run build,
// och varje commit-gate i CLAUDE.md).
type AssertNoMissingIds<AllIds extends string, Covered extends readonly AllIds[]> =
  [Exclude<AllIds, Covered[number]>] extends [never] ? true : { MISSING_CONTENT_CONTRACT_IDS: Exclude<AllIds, Covered[number]> }
// export, inte lokal const — tsconfig har noUnusedLocals:true, och dessa
// tre existerar ENDAST för sin typkontroll-sidoeffekt (aldrig lästa).
export const _gameEventTypeIdsCoverAllTypes: AssertNoMissingIds<GameEventType, typeof GAME_EVENT_TYPE_IDS> = true
export const _storylineTypeIdsCoverAllTypes: AssertNoMissingIds<StorylineType, typeof STORYLINE_TYPE_IDS> = true
export const _arcTypeIdsCoverAllTypes: AssertNoMissingIds<ArcType, typeof ARC_TYPE_IDS> = true

// Egen lista (inte importerad från portalBeats.ts) — samma motiv som O6/B12
// hela sessionen: contentContract ska kunna granskas utan att köra kod, och
// en importerad array kan tysta driva isär sig från denna fil om källan
// ändras utan att någon minns att uppdatera registret. Test:et nedan
// jämför INTE mot PORTAL_BEATS.length automatiskt av samma skäl — en
// avsiktlig, synlig lista, inte en beräknad.
const PORTAL_BEAT_IDS_ALL = [
  'board_failure', 'ripple_consequence', 'callback_streak', 'callback_derby_memory', 'callback_snub',
  'callback_sale', 'callback_nemesis', 'callback_legend_mentor', 'callback_legend_debut',
  'callback_legend_record', 'season_opener', 'first_win', 'first_derby', 'halftime',
  'transfer_window_open', 'last_league_round', 'facility_completed',
] as const

function basePlaceholder(id: string, source: ContractSource): ContentContractEntry {
  return { id, source, filled: false }
}

// ── Ifyllda rader — merge:as in på canonical id, ersätter platshållaren ──
// Källor: domens motiverande felfall (Varför-tabellen), pivotal-beats
// spårade under U5 forts (denna session), O2-dominansrevisionens granskade val.
const FILLED: Partial<Record<string, Omit<ContentContractEntry, 'id' | 'source' | 'filled'>>> = {
  transferBidReceived: {
    trigger: 'Ett inkommande pending TransferBid skapas bara när transferfönstret inte är stängt, inget annat aktivt inkommande bud finns, slumpen faller inom computeBidChance och en frisk, icke-kapten bland hanterade klubbens högst rankade 40 % kan väljas (generateIncomingBids, transferService.ts). Samma bidReceivedEvent används från både Händelser och Marknad.',
    stateEffect: `'accept': executeTransfer sätter bid.status='accepted', flyttar player.clubId och båda klubbarnas squadPlayerIds, sätter spelarens lön/kontraktslängd, för över offerAmount mellan klubbarnas finances, minskar köparens transferBudget och bokför försäljningen; egen akademiprodukt ger dessutom fanMood -8. 'reject': bid.status='rejected' och spelarens morale minskar med round(5 × transferRejectMoraleWeight), golv 0. 'counter': när counterCount<2 sätts offerAmount till min(avrundat 1,3×bud, 2×marketValue), expiresRound +1 och counterCount +1; fabrikens val visas inte när gränsen två motbud är nådd.`,
    systems: ['spelartrupp och kontrakt', 'klubbekonomi och transferbudget', 'spelarmoral (avslag)', 'supporterstämning (försäljning av egen akademiprodukt)'],
    lifespan: 'Det inkommande budet är pending till svar eller expiresRound (normalt tre matchdagar efter att AI-budet skapas; manuellt säljflöde två). Motbud förlänger fristen en matchdag; högst två motbud erbjuds.',
    semanticKey: 'transferBidReceived',
    recallSurface: 'Före svar: Inkorg + Marknad/Händelser med svarsfrist. Efter accept: trupp, klubbkassa/financeLog och eventuellt transfernotis; accept kan dessutom väljas som säsongens viktigaste beslut i säsongssammanfattningen. Efter avslag finns ingen varaktig spelarvänd historik utöver kvarvarande spelare/moral; efter motbud ligger det uppdaterade budet kvar på Marknad. resolvedChoices/narrativeBeatLog/eventLedger är interna bärare, inte egna historikvyer.',
    notes: 'Verifierad 2026-09-02 mot transferService.ts, eventFactories.ts, eventResolver.ts, transferActions.ts och seasonDecisionCaptureService.ts samt befintliga transfer/ripple-tester. Ingen source-cooldown finns för typen; cooldownSeasons lämnas därför medvetet undefined. Acceptera har dessutom liggarnyckeln transferBidReceived:accept för säsongsbeslutet, medan den generiska händelseloggen använder typnyckeln ovan.',
  },
  contractRequest: {
    trigger: 'På matchdag 5, 10, 15 eller 20 väljs högst currentAbility bland hanterade klubbens spelare med currentAbility>50, contractUntilSeason<=currentSeason+1 och id som inte redan finns i handledContractPlayerIds; högst ett kontraktskort skapas i passet och bara om tvåkortsgränsen inte redan nåtts (generatePostAdvanceEvents, postAdvanceEvents.ts).',
    stateEffect: `'extend3': contractUntilSeason=currentSeason+3, salary=avrundat 1,2×nuvarande lön till närmaste 1000 och morale +10 (tak 100). 'extend1': contractUntilSeason=currentSeason+1, oförändrad lön och morale +10 (tak 100). 'reject': kontrakt/lön lämnas orörda och morale -10 (golv 0). Alla tre lägger playerId i handledContractPlayerIds för att stoppa ett nytt kort samma säsong. Vid säsongsslut läser kontraktsutgången contractUntilSeason — ett avslag på ett kontrakt som löper ut gör spelaren till fri agent; handled-markeringen ger inte längre ett gratis extraår.`,
    systems: ['spelarkontrakt och lön', 'spelarmoral', 'spelartrupp vid kontraktsutgång'],
    lifespan: 'Ett måste-beslut med deadlineRound satt till regelsäsongens sista matchdag. Samma spelare får högst en förfrågan per säsong; handledContractPlayerIds nollställs vid säsongsskiftet. Ett obesvarat/avslaget utgående kontrakt löper ut vid rollover.',
    semanticKey: 'contractRequest',
    recallSurface: 'Före svar: primärt måste-kort på Portalen, Granska och deadlinevarning under de sista tre omgångarna. Efter förlängning: spelarens lön och kontraktsår på Trupp/Spelarkort och Marknad/Kontrakt. Efter avslag: lägre moral på spelaren; om avtalet löper ut syns avhoppet i Inkorg och Sommarens kontraktsutgång. Ingen separat permanent beslutshistorik; resolvedChoices/narrativeBeatLog är interna bärare.',
    notes: 'Verifierad och rättad 2026-09-02 mot postAdvanceEvents.ts, eventFactories.ts, eventResolver.ts, decisionTierService.ts och seasonEndProcessor.ts. O11-spårningen hittade att seasonEndProcessor tidigare misstolkade handledContractPlayerIds som "förnyad" även efter rejectContract och lät ett utgånget avtal leva vidare; regressionen kör nu avslag→rollover och kräver contractExpired. Ingen source-cooldown finns; cooldownSeasons är medvetet undefined.',
  },
  licenseHandlingsplan: {
    trigger: 'Vid säsongsskiftet beräknar checkLicenseStatus säsongens ekonomiska netto mot seasonStartSnapshot.finances och flyttar licenseRiskScore med +20 för ett noll/underskottsår eller −18 för ett plusår, klampat 0–100. Om den nya kanoniska zonen är first_warning (40–59) eller point_deduction (60–79) skapas licenseHandlingsplan_{avslutad säsong}; kortet landar i nästa säsongs kö med deadlineRound satt till dess sista regelsäsongs-matchday.',
    stateEffect: `sparplan ger managed club en omedelbar inkomst på avrundat 80 % av licenseReview.requiredCapital, eller 40 000 kr när den parallella reviewn saknar requiredCapital; exakt tkr-belopp visas på valet och bokförs i financeLog. membership ger communityStanding +8. sponsors ger managed clubs reputation +3. Om en aktiv patron finns ger patron +15 happiness och uttrycker samtidigt att inga pengar tillkommer. Alla mätare klampas via de gemensamma effektvägarna. Inget val ändrar licenseRiskScore/status direkt; nästa säsongsslut prövar den faktiska ekonomiska utvecklingen igen.`,
    systems: ['kanonisk licensrisk och nästa säsongs deadline', 'klubbekonomi och financeLog', 'communityStanding eller klubbrykte', 'patronrelation när patronvalet finns'],
    lifespan: 'Ett nytt måste-kort per säsong som slutar i varnings- eller poängavdragszonen. State-deltat består tills andra system ändrar det; licenszonen består separat tills checkLicenseStatus prövar nästa säsongs netto. Kortet är brytpunkt-mode, undantas beslutstaket och har ingen försvarbar auto-resolution; om det trots måste-nivån når rollover rinner det ut uttryckligt.',
    semanticKey: 'licenseHandlingsplan vid resolution; instans-id licenseHandlingsplan_{avslutad säsong}; source_kommunen startar åtta omgångars källcooldown',
    recallSurface: 'Före svar visas handlingsplanen som Portalens primära måste-beslut med deadlinevarning. Efter svar syns inkomst/kassa i Ekonomi och financeLog, communityStanding på ortytorna, reputation på klubben eller patronens happiness på patronytan. Den kanoniska licenszonen visas fortsatt i Ekonomi och licensbeskedet i Inkorg; resolutionen skrivs dessutom i resolvedChoices/narrativeBeatLog och en eventuell utrinning som DecisionRollover-post.',
    notes: 'Verifierad och rättad 2026-09-02 mot seasonEndProcessor.ts, licenseService.ts, eventResolver.ts, economyService.ts, decisionTierService.ts, decisionBudgetService.ts, sourceCooldownService.ts och deferredRolloverService.ts. Tidigare dom hade redan flyttat triggern från licenseReview-systemet till den licenseRiskScore/status som faktiskt avgör licensen. O11 blockerades eftersom valtexten lovade sparade kostnader, sponsorpengar och patronhjälp som state inte levererade. Opus avpreciserade valen till de faktiska utfallen: exakt engångsinkomst, +8 CS, +3 rykte respektive +15 välvilja utan pengar. Ny regression skapar kortet genom riktig handleSeasonEnd och provar alla fyra utfall, deadline, upplösning och befintlig kommuncooldown; ingen parallell licensplansmekanik skapades.',
  },
  starPerformance: {
    trigger: 'Efter en avslutad match: senaste completed fixture för hanterade klubben har report.playerRatings, rand()>0,5, minst en fortfarande hanterad spelare har rating>=8,5 och event_star_{playerId}_{roundPlayed} finns varken i pendingEvents eller resolvedEventIds. När flera kvalificerar väljer rotateSubject högst rating efter att de senast figurerade spelarna (min(truppstorlek−3, 5)) uteslutits; eventblocket får totalt skapa högst två händelser.',
    stateEffect: `Enda valet 'ok' har boostMorale +5 på den betygsatta relatedPlayerId, klampat till 100. Texten påstår bara namn och det faktiska matchbetyget från fixture.report.playerRatings; ingen form-, fitness- eller utvecklingseffekt antyds eller appliceras.`,
    systems: ['spelarmoral', 'matchrapportens spelarbetyg', 'personal-beatens subjektsrotation'],
    lifespan: 'Engångskort för spelare+roundPlayed. En ny 8,5+-prestation kan skapa ett nytt kort i en senare match; subjektsrotationen utesluter högst de fem senast figurerade spelarna men släpper hela poolen om alla kandidater annars är uteslutna.',
    semanticKey: 'starPerformance vid resolution; star_performance_{playerId} vid generering för subjektsrotation',
    recallSurface: 'Kortet visas under Granska → Spelare och premissens 8,5+-betyg finns kvar i matchrapporten. Efter kvittering syns moralökningen på spelaren, men kortet har ingen egen permanent spelarvänd historik. narrativeBeatLog/resolvedChoices är interna bärare.',
    notes: 'Verifierad 2026-09-02 mot postAdvanceEvents.ts, eventCardInlineStrings.ts, eventResolver.ts, roundProcessor.ts, narrativeCoordinatorService.ts och GranskaSpelare.tsx. Ingen säsongscooldown finns (cooldownSeasons medvetet undefined): personal-kanalen har ett separat recency-fönster på tre omgångar och rotationKey styr vem som väljs, medan event.type loggas först när kortet kvitteras. Ny regression kör faktisk 8,7-generator→kort→resolver och kräver +5 moral.',
  },
  pressConference: {
    trigger: 'Efter varje färdigsimulerad match där hanterade klubben deltog bygger generatePressConference ett kort. Matchutfallet (inklusive straffavgörande), derby, hemma/borta, tävling, final, marginal, ligapoäng, halvtidsunderläge, sen kvittering, kryssvit, mittfältsdominans och omgång filtrerar grundfrågan; därefter kan peak-arc (40 %), löst storyline (30 % med max två frågor per storyline och säsong), community/mecenat/anläggning/akademi eller negativt journalistminne överstyra. Centralredaktören kan sedan tränga undan kortet vid presskanalskollision, global tvåkortsgräns eller pressConference-recency.',
    stateEffect: `Tre kontextbehöriga svar och alltid 'refuse_press' erbjuds. Ett vanligt svar applicerar sitt deklarerade moraleEffect (−3…+8) på alla spelare i hanterade klubben, klampat 0–100; positivt värde ger namngiven journalist +3 relation och good_answer-minne, noll/negativt ger −3 och bad_answer-minne. Vägran ger lagmoral −3, journalist −8 relation, ökar pressRefusals och skriver refused_press; exakt tredje vägran skapar en kritisk artikel och sätter journalist.style='provocative'. Båda journalistrelationerna klampas 0–100. Alla val publicerar sitt exakta mediaQuote i Inkorg och rensar pendingPressConference.`,
    systems: ['lagmoral', 'journalistrelation och journalistminne', 'media/Inkorg', 'arc/storyline/community som frågekontext', 'centralredaktörens presskanal'],
    lifespan: 'Ett kort för den nyss spelade matchen; id:t är säsong+fixture.roundNumber och eventet rensas när ett svar registreras. Grundfrågor spärras fem omgångar via press_q_-nyckeln när alternativ finns; erbjudna svar spärras resten av samma säsong via press_response_-nycklar, med pool-fallback om allt är spärrat. Storyline-frågan har separat budget två per storyline och säsong.',
    semanticKey: 'pressConference vid resolution; press_q_{faktisk frågetext} och press_response_{responseId} vid generering; eventuell press_storyline_{story.id}',
    recallSurface: 'Granska visar den väntande frågan och valen. Efter svar ligger publiceringscitatet i Inkorg; journalistens relationsvärde och de tio senaste minnena syns via journalist-/Efterklangytorna. Lagets moral syns på spelarna. Efter tredje vägran ligger den kritiska artikeln i Inkorg och journalistens provokativa stil består.',
    notes: 'Verifierad och rättad 2026-09-02 mot pressConferenceService.ts, matchSimProcessor.ts, roundProcessor.ts, eventResolver.ts, journalistService.ts, narrativeCoordinatorService.ts, GranskaOversikt.tsx och pressens eligibility-/minnestester. O11-spårningen hittade att legacyfältet journalistRelationship saknade 0–100-klamp för vanliga svar och kunde avvika från den namngivna journalistens korrekt klampade relation; båda håll låses nu i regression. Ingen source-cooldown finns, så cooldownSeasons är medvetet undefined; fråga, erbjudna svar och storyline använder de befintliga narrativeBeatLog-nycklarna ovan i stället.',
  },
  dayJobConflict: {
    trigger: 'Tre undertyper i generatePostAdvanceEvents, alla inom blockets max två event: (a) grundkonflikt med 15 % chans när en frisk deltidsanställd spelare har dayJob.flexibility<70 och startat minst 3 av de 5 senaste färdigspelade matcherna; högst en gång per spelare och femomgångsperiod. (b) befordran med 5 % chans för deltidsanställd med dayJob, flexibility>60 och morale>50; en gång per spelare och säsong. (c) schemakrock med 8 % chans för deltidsanställd med dayJob och flexibility<65; en gång per spelare och matchdag.',
    stateEffect: `Grundkonflikt: 'vila' ger morale +10 OCH restGamesRemaining=1 via den befintliga enmatchsvilan; 'press' ger morale −3; 'goPro' sätter isFullTimePro=true, tar bort dayJob, höjer salary till avrundat 1,5× och morale +15 samt, när spelaren själv valde, skriver went_fulltime_pro-storyline. Befordran är uttryckligen råd, inte ett registrerat jobbyte: 'encourage' morale +8, 'discourage' −3. Schemakrock: 'skip_warmup' morale −2; 'bench' morale −5 OCH restGamesRemaining=1. Alla moralvärden klampas 0–100. Den tidigare undertexten 'risk för skada' är borttagen eftersom ingen skaderisk applicerades.`,
    systems: ['spelarmoral', 'laguttagning/tillgänglighet via befintlig enmatchsvila', 'spelarens dagjobb och heltidsstatus', 'lön och träningsutveckling för heltidsproffs', 'storyline/säsongssammanfattning efter goPro'],
    lifespan: 'Grundkonflikten är spärrad per spelare och femomgångsperiod; befordran per spelare och säsong; schemakrock per spelare och matchdag. restGamesRemaining kostar exakt nästa match och rullas därefter ned. Heltidsstatus, borttaget dagjobb, lön och spelarvald storyline består permanent. Obesvarade varianter saknar noOp och rinner därför ut uttryckligt vid säsongsrollover.',
    semanticKey: 'dayJobConflict vid resolution; inget separat source-cooldown-minne',
    recallSurface: 'Före svar visas kortet under Granska → Spelare. Vila/bänkning syns som otillgänglighet i laguttagningen nästa match; moral, heltidsstatus, dagjobb och lön syns på spelaren. En spelarvald goPro sparas som went_fulltime_pro-storyline och kan återkomma i pressfrågor och säsongssammanfattning. Övriga svar har ingen egen permanent historikyta.',
    notes: 'Verifierad och rättad 2026-09-02 mot postAdvanceEvents.ts, eventFactories.ts, eventResolver.ts, Player.ts, setLineup.ts, playerStateProcessor.ts, narrativeCoordinatorService.ts och seasonSummaryService.ts. Två text→state-hål stängdes genom att återanvända restGamesRemaining för "vila"/"bänken"; den okodade skaderiskfrasen togs bort. Dessutom matchar befordrans factory-id nu generatorns säsongs-id, så resolvedEventIds faktiskt stoppar samma befordran från att återkomma under säsongen. Ingen source-cooldown finns; personal-kanalens separata recency är tre omgångar.',
  },
  bidWar: {
    trigger: 'För varje utgående TransferBid med direction=outgoing och status=pending rullar generatePostAdvanceEvents 20 % chans per omgång, så länge eventblockets tvåkortsgräns inte redan är fylld och event_bidwar_{bid.id} varken ligger i pendingEvents eller resolvedEventIds.',
    stateEffect: `'raise': raiseBid sätter budets offerAmount till avrundat 1,3× nuvarande belopp (närmaste 5 000 kr) och expiresRound +1; status, klubbkassa och transferBudget ändras inte vid beslutet. Pengarna dras först om säljande klubb och spelare senare accepterar och executeTransfer genomför affären. 'hold': noOp — ursprungsbud och ursprunglig frist står kvar.`,
    systems: ['utgående transferbud och svarsfrist', 'senare transferavgörande', 'klubbekonomi först vid genomförd affär'],
    lifespan: 'Engångskort per bid-id. Ett höjt bud ligger pending minst en extra omgång; därefter accepterar, avslår eller motbjuder AI enligt resolveOutgoingBid. Obesvarat vid säsongsrollover väljer hold/noOp genom den deklarerade decline-policyn.',
    semanticKey: 'bidWar vid resolution; inget separat source-cooldown-minne',
    recallSurface: 'Före och efter valet syns budets aktuella belopp/status och frist på Marknad; senare accept/avslag/motbud skrivs till Inkorg. Om affären genomförs syns spelaren i truppen, ekonomin i klubbkassa/financeLog och transfern i relevanta transferhistorikytor. Själva budkrigskortet har ingen egen permanent historikvy.',
    notes: 'Verifierad och rättad 2026-09-02 mot postAdvanceEvents.ts, eventFactories.ts, eventResolver.ts, transferService.ts, transferProcessor.ts och transferActions.ts. Kortet påstod tidigare omedelbar kostnad (subtitle "−hela budet") och att höjningen skulle "säkra affären", men raiseBid reserverar inga pengar och garanterar inget utfall; båda falska påståendena är borttagna. Regressionen kräver 100→130 tkr, frist +1 och oförändrad kassa/budget vid själva beslutet. Ingen source-cooldown finns; cooldownSeasons är medvetet undefined.',
  },
  communityEvent: {
    trigger: 'Samlings-typ med fem källor. (1) Tolv fasta ortsaktiviteter i generateCommunityActivitiesEvents på omgång 1–16, några med 30–50 % slump och state-gates för kiosk/lotteri/bandyskola/funktionärer. (2) Karaktärsspelare: veteranpension och jubileum omgång 1, ledare utan kapten omgång 2, hungrig spelare med ≥5 mål eller ≥6,5 betyg från omgång 16 (60 %). (3) Dagjobbskollegor på samma lokala arbetsgivare (3 % i postAdvanceEvents). (4) P19: skolkonflikt 12 % omgång 3–18 och distriktsuttagning omgång 8/15 för 1–2 spelare med potential>50. (5) Bandygalan vid säsongsslut. De vanliga orts-/karaktärshändelserna kräver eventkö-cooldown och beslutsbudget i eventProcessor; exakta event-id:n dedupliceras mot pendingEvents+resolvedEventIds.',
    stateEffect: 'Varierar per undertyp, men alla synliga löften är kopplade: ortsaktiviteter ändrar klubbkassa (−25 tkr…+20 tkr), kiosk/lotteri/bandyplay/funktionärer/julmarknad, fanMood (fika +8, bilbingo/gala +5) eller faciliteter (ismaskin ±5, renovering +15/−5), klampade 0–100 där relevant. Karaktärsval ändrar communityStanding +1…+5 eller journalistRelationship +2; kapten-ja sätter dessutom captainPlayerId på den namngivna ledaren. Kollegor ger exakt de två namngivna spelarna morale +5. Skolkonflikt ger ungdomens confidence ±8; distriktsuttagning verkar bara på selectedPlayerIds (send: confidence +15, developmentRate +2, borta två P19-matcher; keep: confidence −5). Gala ger reputation +1, eller +3 och fanMood +5 med vinnare. noOp-val lämnar state orört.',
    systems: ['ortenaktiviteter och löpande match-/omgångsekonomi', 'communityStanding/fanMood/journalistrelation', 'faciliteter', 'lagkapten och karaktärsspelare', 'P19 confidence/utveckling/tillgänglighet', 'Bandygalan och klubbrykte'],
    lifespan: 'Ortsaktiviteter är engångs-id:n; aktiverade kiosk/lotteri/bandyplay/funktionärer består och deras startår skrivs i communityActivitiesSince, julmarknad nollställs säsongsvis. Kaptenvalet består tills spelaren/uppställningen ändras; kollegiebonusen är engångs. Skolkonflikt kan återkomma med nytt matchdags-id, distriktsuttagning två fasta gånger per säsong och frånvaron täcker exakt två P19-matcher. Gala en gång per säsong. Obesvarade varianter med noOp avböjs vid rollover; övriga rinner ut uttryckligt.',
    semanticKey: 'communityEvent vid resolution; inget enhetligt undertyps-key eller source-cooldown-minne',
    recallSurface: 'Aktiverade ortsaktiviteter syns på Orten och i efterföljande ekonomi/financeLog; faciliteter, fanMood, communityStanding och rykte syns på sina ordinarie ytor. Kaptenen syns i laguttagningen och matchmotorn. P19-effekter syns i akademilaget och tillgängligheten. Gala-vinnare har separata Inkorgsposter/storylines skapade av galasystemet; en spelarvald communityEvent-resolution sparar annars ingen egen permanent kortvy.',
    notes: 'Verifierad och rättad 2026-09-02 mot communityEvents.ts, communityActivitiesEvents.ts, characterPlayerService.ts, youthProcessor.ts, bandyGalaService.ts, postAdvanceEvents.ts, eventResolver.ts, economyService.ts och Granska-klassningen. Kaptenvalet var tidigare falskt (bara +2 communityStanding); det återanvänder nu SaveGame.captainPlayerId. Fika saknade sin 500-kronorskostnad, bilbingo saknade +5 fanMood och faciliteter kunde gå under noll; rättat och regressionstestat. Julmarknad/loppis/bandyskola/ismaskin/funktionärsdag/renovering hade stale eller motsägande body/subtitle jämfört med faktisk state och är nu avpreciserade till de effekter som verkligen appliceras. Ingen säsongscooldown finns; orten-kanalens budget och per-id-deduplicering är separata mekanismer.',
  },
  patronEvent: {
    trigger: 'Två anskaffningsvägar och fem relationsvarianter. En startpatron skapas med 75 % chans när klubbens reputation är minst 35 och får sitt enda intro på omgång 3. Utan aktiv patron skapar roundProcessor ett patron_emerge-kort när klubbepoken inte är survival, communityStanding är minst 60 och ett tidigare avhopp ligger mer än två säsonger tillbaka; erbjudandet får bara komma en gång per säsong. För aktiv patron: missnöje på omgång 5–10 vid happiness<60, avhoppshot från omgång 8 vid happiness<30, stilinvändning omgång 11–13 vid wantsStyle, icke-offensiv faktisk taktik och happiness 30–70 samt bonus omgång 10–14 vid happiness>80. Exakta id:n dedupliceras mot pendingEvents+resolvedEventIds.',
    stateEffect: `Intro: 'welcome' ger patronHappiness +20, 'cautious' +5; det redan aktiva årliga bidraget ändras inte. Emergence: welcome/cautious skapar patronen med samma deklarerade årsbelopp och start-happiness 80/65; decline är noOp. Missnöje ger +15 eller −10 happiness. Avhoppshot: meet ger +30 och patronen förblir aktiv; accept ger −50, vilket vid triggerns happiness<30 når noll, avaktiverar patronen, sätter patronWithdrawnSeason och köar patronWithdrawal. Stilval ger +12/+5/−15. Bonusens thank ger både 20 000 kr via ekonomiService och +10 happiness. Happiness klampas 0–100; samma gemensamma resolver används även inuti multiEffect.`,
    systems: ['patronrelation och avhopps-cooldown', 'årligt patronbidrag och klubbekonomi', 'communityStanding/klubbepok som anskaffnings- och avhoppsvillkor', 'klubbtaktik som villkor för stilinvändning', 'besluts- och narrativlogg'],
    lifespan: 'Emergence och bonus är engångskort per säsong; initialt intro visas högst en gång och undertrycks när samma patron redan introducerats via emergence. Missnöje, avhoppshot och stilinvändning får egna säsong+omgång-id:n och kan därför återkomma i en senare säsong utan att gamla resolvedEventIds blockerar. En aktiv patron ger sitt contribution vid varje säsongsslut och ökar totalContributed/influence; avhopp stoppar bidraget och spärrar ny anskaffning i två hela säsonger. Obesvarade patronEvent med noOp avböjs vid rollover; varianter utan noOp rinner ut uttryckligt.',
    semanticKey: 'patronEvent vid resolution; exakta patron_intro/patron_emerge/patron_unhappy/patron_withdraw/patron_style/patron_bonus-id:n för instansdeduplicering',
    recallSurface: 'Före svar syns patronkortet under Granska → Orten. Efter emergence/avhopp syns aktiv patron, relation, inflytande och årsbelopp på patron-/ortytorna; års- och bonusbidrag syns i klubbkassan/financeLog och årsbeloppet dessutom i Inkorg vid säsongsslut. Ett avhopp ger ett eget patronWithdrawal-kort och cooldown-state. Resolutionen skrivs även till resolvedChoices, narrativeBeatLog och eventLedger, men de är interna bärare snarare än en separat spelvänd patronhistorik.',
    notes: 'Verifierad och rättad 2026-09-02 mot setupManagedClub.ts, patronEvents.ts, communityEvents.ts, roundProcessor.ts, eventResolver.ts, seasonEndProcessor.ts, deferredRolloverService.ts och patronens befintliga CS-/ekonomitester. O11-spårningen hittade tre återkomstfel: missnöje/avhoppshot/stil saknade säsong i id:t, decline på emergence kontrollerades inte mot resolvedEventIds och en via emergence accepterad patron fick ett dubbelt intro. Text/state-svepet rättade dessutom +10/+30-, +3/+5- och −8/−15-glapp, tog bort två oregistrerade framtidslöften och kopplade bonusens utlovade +10 relation till den befintliga patronHappiness-mekaniken. Ingen separat source-cooldown finns; den uttryckliga tvåsäsongsspärren gäller bara efter patronavhopp.',
  },
  politicianEvent: {
    trigger: 'Fem agendakort från generatePoliticianEvents. Youth: omgång 4, agenda youth och relationship>30. Savings: omgång 6 och agenda savings. Prestige: omgång 8 och agenda prestige. Inclusion: omgång 5 och agenda inclusion. Varning: från omgång 10 när relationship<30, högst en gång per säsong. Agenda-id:n bär mandatets slutår och dedupliceras mot pendingEvents+resolvedEventIds, så samma politiker får ämnet högst en gång men en framtida politiker med samma agenda blockeras inte.',
    stateEffect: `Youth ger politicianRelationship +10/−5. Savings: comply ger +8 relationship OCH ett bestående kommunBidragModifier +5 000 kr ovanpå den ordinarie dynamiska säsongsutbetalningen; pushback ger −5 relationship. Prestige ger +12 relationship och +5 reputation, eller −5 relationship. Inclusion: start_program ger bestående kommunBidragModifier +6 000 kr/säsong, fanMood +5 och communityStanding +3; bara det valet schemalägger programmets eftertext. counter ger communityStanding +1; already_open ger relationship −5. Varning: invite +10 relationship, open_letter communityStanding +3, board_contact boardPatience +2 och relationship −3, low_profile noOp. Relation, reputation, fanMood, communityStanding och boardPatience klampas till respektive 0–100-gräns; kommunbidraget har golv noll.`,
    systems: ['kommunalrådets relation och mandat', 'kommunbidragets dynamiska säsongsutbetalning', 'klubbrykte och communityStanding/fanMood', 'styrelsens tålamod', 'valspecificerad eftertext'],
    lifespan: 'Agendakorten är engångshändelser per politikermandat; varningen kan återkomma högst en gång per säsong så länge relationen är under 30. Relationship och övriga mätare består tills de ändras. kommunBidragModifier består under samma politiker och läggs på varje säsongsutbetalning, men följer inte med när kommunvalet skapar en ny politiker. Ett obesvarat varningskort kan välja low_profile/noOp vid rollover; övriga varianter utan noOp rinner ut uttryckligt.',
    semanticKey: 'politicianEvent vid resolution; politician_{agenda}_{mandatExpires} respektive politician_warning_{currentSeason} för instansdeduplicering',
    recallSurface: 'Före svar visas kortet under Granska → Orten. Efter svar syns relationen och aktuellt kommunbidrag på kommun-/ortytorna; reputation, fanMood, communityStanding och boardPatience på sina ordinarie ytor. Bidragsdeltat märks i klubbkassan/financeLog och säsongsslutets Inkorgspost när det betalas. Accepterat inkluderingsprogram ger dessutom ett Inkorgseko 3–5 matchdagar senare; nej- och motförslag gör det inte.',
    notes: 'Verifierad och rättad 2026-09-02 mot politicianEvents.ts, politicianService.ts, eventResolver.ts, seasonEndProcessor.ts, deferredRolloverService.ts och eventResolverEffectSchema/politicianService-testerna. Det redan dokumenterade savings-felet var fortfarande verkligt: subtitlen lovade +8 relation/+5 tkr men koden gav +10 relation och inga pengar. Inclusion skrev +6 tkr till kommunBidrag, men seasonEnd räknade om fältet utan deltats effekt; kommunBidragModifier gör nu båda beloppen verkligt återkommande via samma calculateKommunBidrag-väg. Eftertexten låg tidigare på hela eventet och skickades även efter avslag; EventChoice kan nu bära den utan specialfall. Agenda-id:n var globala över hela karriären och är nu per mandat. Två oregistrerade framtidslöften har avpreciserats till omedelbara, sanningsenliga svar. O20:s separata balansfrågor om dominans/K5/K3 ändras inte här.',
  },
  hallDebate: {
    trigger: 'Ingen levande trigger. De två tidigare generatorerna hallDebateService.ts och hallDebateEvents.ts raderades 2026-08-17 som död, överlappande kod när hallProcessService.ts blev den enda hallprocessen. Sökning i src visar ingen produktion av GameEvent med type=hallDebate; unionmedlemmen ligger kvar som kompatibilitet för äldre serialiserade pendingEvents och i fullständiga klassificeringsregister.',
    stateEffect: 'Ingen canonical hallDebate-effekt finns längre. Om ett äldre save fortfarande innehåller ett serialiserat hallDebate-kort kör resolveEvent dess medsparade EventChoice.effect genom den vanliga resolvern, loggar resolutionen och startar källcooldown för kommunen; ingen hallDebate-specifik specialgren eller separat hall-state muteras. Nya hallbeslut använder hallProcess-effekten och HallTrial-tillståndsmaskinen.',
    systems: ['legacy-save-kompatibilitet för pendingEvents', 'generisk eventresolution och kommunen-cooldown', 'ersatt av HallTrial/hallProcess'],
    lifespan: 'Nya instanser kan inte skapas. Ett event som redan ligger i ett äldre save består tills spelaren svarar; vid säsongsrollover väljs dess medsparade noOp-val om ett sådant finns, annars dokumenteras uttrycklig utrinning. Den levande hallProcess-livscykeln dokumenteras på nästa separata kontraktsrad.',
    semanticKey: 'hallDebate endast vid resolution av ett äldre serialiserat kort; ingen ny source-instansnyckel',
    recallSurface: 'Ingen ny spelvänd yta. Ett äldre väntande kort kan visas via den generiska Granska/eventytan och dess medsparade effekt syns på respektive ordinarie state-yta; efter resolution återstår endast de generiska resolvedChoices/narrativeBeatLog/eventLedger-spåren. Hallens levande status visas via hallProcess/HallTrial-ytorna.',
    notes: 'Verifierad 2026-09-02 mot communityEvents.ts, hallProcessService.ts, GameEvent.ts, decisionTierService.ts, narrativeCoordinatorService.ts, sourceCooldownService.ts, deferredRolloverService.ts och hela src-sökningen efter hallDebate. Detta är medvetet en tombstone, inte en ofärdig feature: MASTER_OPPET-raden hall-debatt-handler-gammal dokumenterar att den gamla specialresolvringen och dess write-only-räknare också raderades 2026-09-01. Att bygga en ny generator här skulle bryta den etablerade principen om en hallmekanik; nästa rad, hallProcess, är den levande sanningen. cooldownSeasons är medvetet undefined eftersom typen saknar levande källcooldown/livscykel.',
  },
  hallProcess: {
    trigger: 'Hallprövningen kan starta från säsong 2 när det ordinarie anläggningsträdet är fullt, inget annat bygge pågår och minst en rival har inomhusarena. Ett tidigare bordlagt/nedlagt försök måste först nå cooldownUntilSeason. Därefter producerar HallTrial-tillståndsmaskinen exakt nästa steg: förankringsbeslut efter 3/6/8 matchdagar i obligatorisk ordning, omröstning efter 10, kravkontroll, kommunförhandling efter 2, patronreservväg efter 6 och ett seedat 25-procentigt fördyringskort efter 11 byggmatchdagar.',
    stateEffect: `Startvalet skapar HallTrial(stage='forankring'); inte_nu är noOp. Förankringen ändrar support med +8, seedat +14/−10, +6, −8, +5 eller villkorat −5/0; avbryta sätter stage='nedlagd', cooldown en säsong och supporterGroup.mood +3. Omröstningen lägger dessutom på verkliga derby-/förlustsvitsdeltan och går till krav vid stöd ≥60, bordlagd +1 säsong vid 40–59 eller nedlagd +2 säsonger under 40. Uppfyllda krav öppnar förhandling. Kommun/patron finansierar 40 % av 1,8 mkr och klubben debiteras 1,08 mkr; egen väg debiteras 1,8 mkr. Alla tre startar det kanoniska matchhall-bygget på 20 matchdagar. Fördyring skjut_till debiterar 360 tkr; pausa fryser byggets återstående tid till nästa säsong.`,
    systems: ['FacilityState/HallTrial och det kanoniska anläggningsträdet', 'medlemsstöd från klack, communityStanding och matchutfall', 'krav på kassa/patron, publikunderlag och styrelseresultat', 'kommunalråd/mecenatfinansiering', 'klubbkassa och financeLog', 'supporterGroup.mood samt hallens inbox-/kafferumseko'],
    lifespan: 'En flerfasig process över matchdagar och vid behov säsonger. Steg-id:n är säsongsbundna (`hallprocess_*_s{season}`); stage, stöd och cooldown består i FacilityState. Vid säsongsrollover rebasas både stageStartedRound och ett aktivt bygges ETA till den nya currentMatchday-nollpunkten. För pausat bygge räknas återstående tid från pausögonblicket, så pausrundor förbrukar ingen byggtid. Matchhallen slutförs av den ordinarie facility-pipelinen och blir därefter permanent byggd.',
    semanticKey: 'hallProcess vid resolution; instans-id hallprocess_{start|d1|d2|d3|res|krav_adv|fh1|fh2|fhnej|fordyring}_s{currentSeason}',
    recallSurface: 'Pågående stage, stöd/krav, paus och bygg-ETA visas via HallProvning-/anläggningsytorna från samma FacilityState. Valens support och exakta klubbkostnad visas på beslutskortet; debiteringen syns i klubbkassa/financeLog. Bordlagd/nedlagd/egen nedläggning ger permanent inboxpost och ett kort kafferumseko. Färdig hall påverkar ordinarie arena-, publik- och anläggningsytor genom den befintliga matchhall-noden.',
    notes: 'Verifierad och rättad 2026-09-02 mot facilityNodes.ts, facilityService.ts, hallProcessService.ts, communityEvents.ts, eventResolver.ts, roundProcessor.ts, seasonEndProcessor.ts, hallProvningData.ts och hallProcessTruth.test.ts. O11-svepet hittade att d2/d3/omröstning inte verkligen krävde tidigare resolutioner, kommunens två val var byte-identiska, låg kommunrelation saknade sammanhängande reservutfall, utlovad finansiering debiterade ingen byggkostnad och paus var noOp. Finansieringen ligger nu på den kanoniska matchhall-noden i stället för i en parallell tabell. Klass-svepet efter absoluta matchday-värden hittade dessutom både etaMatchday och HallTrial.stageStartedRound vid rollover; båda bevarar nu återstående/elapsed tid.',
  },
  kommunMote: {
    trigger: 'generatePoliticianEvents skapar mötet exakt på omgång 3 när en lokalpolitiker finns, demandsMet inte är satt och varken säsongens kommot_demand_{mandatExpires}_{currentSeason}-id eller samma politikers agenda-id redan finns i pendingEvents/resolvedEventIds. Ett besvarat möte sätter demandsMet=true; en nyvald politiker får ett nytt state och kan därför skapa ett nytt möte.',
    stateEffect: `Savings ger politicianRelationship +10/−5. Youth ger +15 om bandySchool redan finns, annars −5; A-lagsprioritering ger −8. Prestige ger +12/−5. Inclusion ger communityStanding +5 eller relationship −3. Infrastructure ger relationship +10/−5. Alla svar sätter den befintliga livscykelmarkören localPolitician.demandsMet=true och startar kommunens gemensamma källcooldown på 8 omgångar. Relationship och communityStanding klampas 0–100.`,
    systems: ['lokalpolitikerns relation, mandat och demandsMet-livscykel', 'communityStanding och befintlig bandySchool', 'kommunens gemensamma källcooldown'],
    lifespan: 'Ett besvarat möte per lokalpolitiker; effekten består tills respektive mätare ändras eller en ny politiker tillträder. Ett obesvarat kommunmöte saknar neutralt noOp-val och rinner därför ut uttryckligt vid säsongsrollover i stället för att systemet väljer sida åt spelaren.',
    semanticKey: 'kommunMote vid resolution; instans-id kommot_demand_{mandatExpires}_{currentSeason}; dessutom source_kommunen för den delade källcooldownen',
    recallSurface: 'Före svar visas mötet under Granska → Orten. Efter svar syns relationen på kommun-/ortytorna och inclusion-valets communityStanding på ordinarie ort-/klubbytor. Valet loggas också i resolvedChoices, narrativeBeatLog och eventLedger; en uttrycklig utrinning ger en DecisionRollover-post i Inkorg.',
    notes: 'Verifierad och rättad 2026-09-02 mot politicianEvents.ts, eventResolver.ts, communityEvents.ts, sourceCooldownService.ts och deferredRolloverService.ts. Generatorn läste tidigare demandsMet men ingen kod skrev fältet, så särskilt infrastructure-varianten kunde återkomma varje säsong. Flera labels lovade dessutom framtida lönestopp, bandyskola, inkluderingsprogram eller anläggningsinvestering utan motsvarande state. Copy beskriver nu det omedelbara ställningstagande som den deklarerade mätareffekten faktiskt bär; ingen parallell löne-, program- eller anläggningsmekanik skapades.',
  },
  gentjanst: {
    trigger: 'generatePoliticianEvents prövar exakt på omgång 2 när en lokalpolitiker har corruption>=50. Ett seedat rand-värde under 0,4 skapar kortet om mandatets canonical id gentjanst_{mandatExpires} inte redan finns i pendingEvents/resolvedEventIds. Legacy-id:n med gammalt säsongssuffix räknas också som sedda. En ny mandatperiod ger en ny möjlighet.',
    stateEffect: `yes ger politicianRelationship +20; community ger +5; no ger relationship −10 och boardPatience +3 genom den vanliga multiEffect-motorn. Relation och styrelsetålamod klampas 0–100. Alla svar startar kommunens gemensamma källcooldown på 8 omgångar. Ingen spelare skapas, flyttas eller läggs till i A-/P19-truppen.`,
    systems: ['lokalpolitikerns relation, korruption och mandat', 'styrelsens tålamod', 'kommunens gemensamma källcooldown'],
    lifespan: 'Ett skapat kort per politikermandat; mätareffekterna består tills de ändras och cooldownen löper åtta omgångar. Om 40-procentsprövningen missar kan en ny prövning ske nästa säsong inom samma mandat. Ett obesvarat kort saknar neutralt noOp-val och rinner ut uttryckligt vid säsongsrollover.',
    semanticKey: 'gentjanst vid resolution; instans-id gentjanst_{mandatExpires}; dessutom source_kommunen för den delade källcooldownen',
    recallSurface: 'Före svar visas kortet under Granska → Orten. Efter svar syns politicianRelationship och boardPatience på sina ordinarie kommun-/styrelseytor. Valet loggas också i resolvedChoices, narrativeBeatLog och eventLedger; en uttrycklig utrinning ger en DecisionRollover-post i Inkorg.',
    notes: 'Verifierad och rättad 2026-09-02 mot politicianEvents.ts, communityEvents.ts, eventResolver.ts, sourceCooldownService.ts och deferredRolloverService.ts. Den gamla copy:n lovade att en namngiven släkting skulle få provträna men effekten ändrade bara relationen; nu är gentjänsten uttryckligen att förmedla en befintlig kontaktväg, utan en parallell provspelare-/träningsmekanik. Det tidigare säsongsbundna id:t motsade kommentaren ”new politician” och lät samma person be om samma släkting varje år; canonical id är nu mandatbundet med legacy-deduplicering.',
  },
  icaMaxiEvent: {
    trigger: 'generateSponsorEvents skapar kortet på varje currentRound som är delbar med 4 när sponsors-listan innehåller en ICA Maxi-sponsor med icaMaxi=true och contractRounds>0. Instans-id icamaxi_visit_r{currentRound}_{currentSeason} dedupliceras mot pendingEvents/resolvedEventIds.',
    stateEffect: `send_player kör en vanlig multiEffect: managed clubs finances +5 000 kr och communityStanding +2, båda via den kanoniska effektmotorn; pengarna får en financeLog-post och communityStanding klampas 0–100. decline är noOp. Ingen dold spelarmoral-, disciplin- eller frånvaroeffekt finns.`,
    systems: ['aktivt sponsoravtal och dess contractRounds', 'klubbkassa och financeLog', 'communityStanding'],
    lifespan: 'Ett engångsbeslut per fyrtal av omgång och säsong så länge ICA Maxi-avtalet är aktivt. Kassadeltat och communityStanding består efter resolution; obesvarat kort landar på sitt uttryckliga decline/noOp vid säsongsrollover och dokumenteras i Inkorg.',
    semanticKey: 'icaMaxiEvent vid resolution; instans-id icamaxi_visit_r{currentRound}_{currentSeason}',
    recallSurface: 'Före svar visas kortet under Granska som ett sponsorbeslut. Efter ja syns beloppet i klubbkassan/financeLog och communityStanding på ordinarie ort-/klubbytor. Resolutionen skrivs dessutom till resolvedChoices, narrativeBeatLog och eventLedger; ett rollover-avslag får en DecisionRollover-post i Inkorg.',
    notes: 'Verifierad och rättad 2026-09-02 mot setupManagedClub.ts, sponsorEvents.ts, eventResolver.ts, deferredRolloverService.ts och icaMaxiEventTruth.test.ts. O2 hade redan identifierat en dold id-/disciplinberoende moral +5/−3 på en slumpvald frisk spelare; den specialgrenen är nu borttagen eftersom varken kortet eller valet valde/namngav en spelare. Textens ”5 000 kr extra/omg” kunde läsas som en återkommande sponsorintäkt men effekten betalas en gång, så copy anger nu ”den här omgången”. Det oanvända legacyfältet Sponsor.icaMaxi_active driver ingen mekanik.',
  },
  patronInfluence: {
    trigger: 'generatePatronEvents kräver en aktiv patron. Inflytandekortet skapas när influence är 60–79 och goodwill>=20, med id patron_influence_60_{currentSeason}. Den akutare ignored-varianten skapas när goodwill<20 och influence>30, med id patron_ignored_{currentSeason}; goodwill-grinden gör att båda inte skapas samtidigt. Respektive id dedupliceras mot pendingEvents/resolvedEventIds.',
    stateEffect: `Inflytandekort: listen ger patron.happiness +20 och influence +10; decline ger happiness −5. Ignored-kort: apologize ger goodwill +20 utan att ändra happiness/influence; ignore ger happiness −50. Alla tre patronfält klampas 0–100. Om −50 når happiness=0 används den gemensamma applyPatronHappiness-vägen: patronen avaktiveras, patronWithdrawnSeason sätts och ett patronWithdrawal-kort köas.`,
    systems: ['patronens happiness, influence och goodwill', 'patronens befintliga avhoppskedja', 'säsongsbunden eventdeduplicering'],
    lifespan: 'Högst en instans av respektive variant per säsong. Mätareffekterna består tills de ändras; influence>=80 stänger 60-eskaleringen och goodwill>=20 stänger ignored-varianten. Ett event som lämnas obesvarat saknar noOp-val och rinner därför ut uttryckligt vid rollover.',
    semanticKey: 'patronInfluence vid resolution; instans-id patron_influence_60_{currentSeason} respektive patron_ignored_{currentSeason}',
    recallSurface: 'Före svar visas kortet under Granska → Orten. Efter svar syns patronens relation/inflytande/goodwill på patron-/ortytorna; ett faktiskt avhopp får dessutom patronWithdrawal-kort och senare withdrawal-spår. Resolutionen skrivs till resolvedChoices, narrativeBeatLog och eventLedger; en utrinning får DecisionRollover-post i Inkorg.',
    notes: 'Verifierad och rättad 2026-09-02 mot patronEvents.ts, eventResolver.ts, roundProcessor.ts, deferredRolloverService.ts och patronInfluenceTruth.test.ts. listen lovade tidigare +20 relation och ökat inflytande men gav bara happiness +15; båda utlovade effekterna går nu genom befintliga multiEffect-grenar. apologize gav egentligen goodwill +20 via patronInfluence-effectens value-fält men kallade det +15 relation. ignore gav egentligen happiness −50, inte −20, och kan direkt aktivera den redan kanoniska avhoppsvägen. Goodwill-krisen prioriteras nu så två motsägelsefulla patronInfluence-kort inte skapas samma omgång.',
  },
  spoksponsor: {
    trigger: 'generatePostAdvanceEvents erbjuder det canonical id:t ghostSponsorOffered när färre än två andra post-advance-events redan valts, managed clubs finances<0, reputation>60, ingen patron finns och currentSeason>=2. Id:t saknar säsong och dedupliceras mot pendingEvents/resolvedEventIds, så erbjudandet kan skapas högst en gång per karriär.',
    stateEffect: `accept kör multiEffect med managed clubs finances +150 000 kr och communityStanding −5, skriver pengarna i financeLog och lägger därefter en full BoardMember på game.board: Okänd Investerare, role=ledamot, personality=modernist. decline ger boardPatience −5. Ekonomi/communityStanding/boardPatience klampas enligt respektive canonical effektväg; styrelseledamoten består och kan äga modernistiska boardObjectives kommande säsonger.`,
    systems: ['klubbkassa och financeLog', 'communityStanding', 'den kanoniska BoardMember-/boardObjective-modellen', 'styrelsens tålamod'],
    lifespan: 'Ett irreversibelt erbjudande per karriär genom det globala id:t. Pengar och mätardeltan består tills de ändras; accepterad ledamot ligger kvar i board. Båda valen har state-effekt, så ett obesvarat kort rinner ut uttryckligt vid rollover i stället för att ett av dem väljs åt spelaren.',
    semanticKey: 'spoksponsor vid resolution; globalt instans-id ghostSponsorOffered',
    recallSurface: 'Före svar visas kortet under Granska → Orten. Efter accept syns pengarna i kassa/financeLog, communityStanding på ortytorna och Okänd Investerare i den gemensamma styrelsestaten samt som möjlig ägare till framtida mål. Decline syns via boardPatience. Resolutionen loggas även i resolvedChoices, narrativeBeatLog och eventLedger; utrinning får DecisionRollover-post i Inkorg.',
    notes: 'Verifierad och rättad 2026-09-02 mot postAdvanceEvents.ts, eventResolver.ts, boardObjectiveService.ts, seasonEndProcessor.ts, deferredRolloverService.ts och spoksponsorTruth.test.ts. KF4 hade redan konsoliderat investeraren till en riktig BoardMember; O11/O2-glappet var att valets subtitle bara deklarerade pengar och CS trots att en permanent, röstande ledamot tillkom. Styrelseplatsen visas nu på samma val. Ingen separat sponsor-/styrelsemodell infördes. Eftersom decline kostar boardPatience −5 finns inget neutralt noOp-val som rollover får gissa.',
  },
  detOmojligaValet: {
    trigger: 'generatePostAdvanceEvents prövar eventet när färre än två andra post-advance-events redan valts, managed clubs finances<−50 000 kr och en egen akademiuppflyttad spelare med currentAbility>50 finns. Sannolikheten skalar kontinuerligt med communityStanding via getCsDetOmojligaValetProbability (3 % vid CS 0 till 15 % vid CS 100). Id detOmojligaValet_{currentSeason} dedupliceras mot pendingEvents/resolvedEventIds.',
    stateEffect: `sell ger finances +180 000 kr, communityStanding −12, fanMood −15 och journalistRelationship −10; därefter flyttas relatedPlayerId till clubId='free_agent', tas bort ur managed clubs squadPlayerIds och får ett media-inboxspår. Resolvern kastar om spelaren inte verkligen lämnat. keep lämnar kassa och spelare oförändrade men ger communityStanding +5 och fanMood +8. Alla mätare klampas till sina canonical gränser och pengarna loggas i financeLog.`,
    systems: ['licens-/ekonomikris och klubbkassa', 'spelartrupp och akademibakgrund', 'communityStanding och fanMood', 'journalistrelation och media/årsbok'],
    lifespan: 'Högst en instans per säsong och markerad som systemhandelse, därför undantagen det vanliga surfacing-taket. Försäljningen är irreversibel; keep-deltan består tills de ändras. Ett obesvarat kort har inget neutralt val och rinner ut uttryckligt vid rollover.',
    semanticKey: 'detOmojligaValet vid resolution; instans-id detOmojligaValet_{currentSeason}; sell loggas även som detOmojligaValet:sell i eventLedger/årsboksunderlaget',
    recallSurface: 'Före svar visas det som systemhändelse i Granska. Efter sell syns kassan/financeLog, den saknade truppspelaren/free-agent-statusen, relationsmätarna, en Media-post i Inkorg och en verifierad årsboksmening. Efter keep syns spelaren kvar samt CS/fanMood. Båda skrivs i resolvedChoices/narrativeBeatLog; utrinning ger DecisionRollover-post.',
    notes: 'Verifierad och rättad 2026-09-02 mot postAdvanceEvents.ts, communityStandingScaling.ts, eventResolver.ts, seasonDecisionCaptureService.ts, deferredRolloverService.ts och detOmojligaValetSell.test.ts. H3:s hårda squad-invariant och 5/5-systemwiring var redan korrekt. Kvarvarande påståendeglapp var copy: +180 tkr garanterar inte att en godtyckligt djup skuld ”räddas”, keep ändrar ingen licensstatus trots ”riskera licensproblem”, och journalistRelationship −10 saknades ur subtitlen. Texten beskriver nu exakt kassadeltat/oförändrad kassa och alla fyra synliga säljkonsekvenser.',
  },
  varsel: {
    trigger: 'generatePostAdvanceEvents prövar varslet när färre än två andra events valts, roundPlayed är 8–14 och rand<0,10. Kandidater är egna, icke-heltidsproffs med dayJob hos en arbetsgivare som findEmployerForJob klassar som medium/stor; den största arbetsgivargruppen väljs. Canonical id event_varsel_s{currentSeason} dedupliceras mot pendingEvents/resolvedEventIds, alltså högst ett varsel per säsong.',
    stateEffect: `support ger exakt de namngivna berörda spelarna morale +5. offer_pro sätter var och en isFullTimePro=true, tar bort dayJob, höjer månadslönen till avrundat 1,5× och ger morale +15 genom den gemensamma makeFullTimePro-vägen; vid spelarval skrivs dessutom went_fulltime_pro/rescued_from_unemployment-storylines, men inte vid auto-resolution. nothing ger de berörda morale −8. Moral klampas 0–100 och heltidslönen påverkar den ordinarie löpande ekonomin.`,
    systems: ['namngiven lokal arbetsgivare och spelarnas dayJob', 'spelarstatus, lön och moral', 'klubbens löpande lönekostnad', 'storyline och årsbokens viktigaste beslut'],
    lifespan: 'Högst ett systemhändelsekort per säsong, undantaget det vanliga surfacing-taket. Moral består tills den ändras; heltidsstatus, borttaget dagjobb och 1,5× lön består. Ett obesvarat varsel saknar neutralt noOp-val och rinner ut uttryckligt vid rollover.',
    semanticKey: 'varsel vid resolution; instans-id event_varsel_s{currentSeason}; offer_pro loggas dessutom som varsel:offer_pro i eventLedger/årsboksunderlaget',
    recallSurface: 'Före svar visas varslet som systemhändelse i Granska. Efteråt syns berördas moral, heltidsstatus och lön på trupp-/spelarytorna samt lönekostnaden i ekonomin. Spelarvalt offer_pro kan ge storyline och en verifierad årsboksmening; alla val skrivs i resolvedChoices/narrativeBeatLog och relevanta eventLedger-spår. Utrinning ger DecisionRollover-post i Inkorg.',
    notes: 'Verifierad och preciserad 2026-09-02 mot postAdvanceEvents.ts, eventFactories.ts, eventResolver.ts, seasonDecisionCaptureService.ts, deferredRolloverService.ts, varselDedupe.test.ts och choiceLabelSvepNoOps.test.ts. Tidigare fixar hade redan förenat id:t, riktat moral till rätt spelare, byggt multiEffect-grenen för makeFullTimePro och säkrat årsbokens faktiska löne-/statusändring. Sista textglappet var support-valets ”extra träning” utan träningsstate och ”alla” utan målgrupp; copy säger nu exakt stöd/+5 moral för alla berörda, utan en parallell träningsmekanik.',
  },
  playerMediaComment: {
    trigger: 'Efter en spelad omgång, när eventblocket ännu har plats och 12 %-slumpen faller in: minst tre färdigspelade matcher för hanterade klubben finns, och en egen spelare har morale<30, currentAbility>=55 samt färre än tre starter i de högst tio senaste matcherna. rotateSubject utesluter upp till de fem senast figurerade kvalificerade spelarna innan slumpvalet; pending/resolved canonical id stoppar samma spelare+omgång.',
    stateEffect: `'talk' ger den namngivna spelaren morale +8, 'confront' ger −5 och 'ignore' ger −2; eventResolver klampar samtliga utfall till 0–100 via den gemensamma boostMorale-effekten. Ingen journalist-, kontrakts-, speltids- eller transferstate ändras, och texten lovar inte någon sådan följd.`,
    systems: ['spelarmoral', 'startelvehistorik från de senaste matcherna', 'centralredaktörens presskanal och subjektsrotation'],
    lifespan: 'Engångskort per spelare och global matchday. Samma spelare kan kvalificera igen en senare omgång, men presskanalens femomgångs-recency stoppar typen från att yta för tätt och subjektsrotationen prioriterar andra kvalificerade spelare. Ett obesvarat kort rinner ut uttryckligt vid säsongsrollover.',
    semanticKey: 'playerMediaComment vid resolution; player_media_{playerId} vid generering för subjektsrotation',
    recallSurface: 'Före svar visas kortet under Granska → Spelare. Efter svar syns moraländringen på spelaren; kortet har ingen egen permanent spelarvänd historik. resolvedChoices, narrativeBeatLog och rotationKey-loggen är interna bärare.',
    notes: 'Verifierad och rättad 2026-09-02 mot postAdvanceEvents.ts, eventFactories.ts, eventResolver.ts, roundProcessor.ts, narrativeCoordinatorService.ts, granskaEventClassifier.ts och deferredRolloverService.ts. O11-spårningen hittade två produktionsfel: fabriken använde Date.now() trots att generatorn deduplicerade på spelare+omgång, och 0 starter av 0 matcher kunde beskrivas som etablerad brist på speltid. Canonical id är nu gemensamt och minst tre verkliga matcher krävs; copy beskriver exakt utebliven startplats. Ingen source-/säsongscooldown finns, så cooldownSeasons lämnas medvetet undefined.',
  },
  captainSpeech: {
    trigger: 'De tre senaste färdigspelade, icke-cup- och icke-knockoutmatcherna för hanterade klubben är ligaförluster, en kapten med morale>50 kan identifieras (captainPlayerId först, annars första egna spelaren med morale>50, age>=25 och currentAbility>=50), och event_captain_speech_s{currentSeason} finns inte i pendingEvents/resolvedEventIds. Kortet skapas högst en gång per säsong och måste rymmas under eventblockets tvåkortstak.',
    stateEffect: `'support': alla spelare i hanterade klubben får morale +8 om kaptenens moral var minst 70 när kortet skapades, annars +5, och boardPatience −3; båda klampas 0–100. Vid ett spelarvalt och lyckat supportutfall skrivs captain_rallied_team-storylinen. 'take_charge': den namngivna kaptenens morale −5, klampat vid 0. 'decline': noOp — ingen state ändras. Auto-resolution applicerar mekaniken men skriver aldrig den spelartillskrivna storylinen eller säsongsbeslutet.`,
    systems: ['lagmoral', 'kaptenens moral', 'styrelsens tålamod', 'storyline, pressåterkoppling och säsongssammanfattning'],
    lifespan: 'Högst ett kort per säsong genom säsongsscopat canonical id. Morale och boardPatience består tills andra händelser ändrar dem; en spelarvald support-storyline består i säsongens berättelse och kan återkallas i press/årsbok. Vid rollover väljs det uttryckliga noOp-valet decline om kortet defererats.',
    semanticKey: 'captainSpeech vid resolution; event-id event_captain_speech_s{season}; spelarvald support skapar captain_rallied_team',
    recallSurface: 'Före svar visas kortet med namngiven kapten under Granska → Spelare. Efteråt syns morale och boardPatience på sina ordinarie ytor. Spelarvald support kan återkomma som captain_rallied_team i pressfrågor och säsongssammanfattning; support/take_charge kan dessutom bli säsongens viktigaste beslut. Ett rollover-default lämnar DecisionRollover-post i Inkorg.',
    notes: 'Verifierad och rättad 2026-09-02 mot postAdvanceEvents.ts, eventFactories.ts, eventResolver.ts, seasonDecisionCaptureService.ts, seasonSummaryService.ts, pressConferenceService.ts, granskaEventClassifier.ts och deferredRolloverService.ts. Tidigare H1/High6-fixar hade redan förenat den dubbla kaptenmekaniken, bytt till global matchday-sortering, kopplat lagmoral+styrelsekostnad, säkrat spelar-attribution och säsongsdedup. O11-spårningen hittade att en satt captainPlayerId kringgick morale>50-gaten, att Granska-kortet saknade relatedPlayerId och att support-subtitlen dolde båda numeriska state-effekterna; alla tre är nu låsta i regression. Ingen separat source-cooldown finns, så cooldownSeasons lämnas medvetet undefined.',
  },
  playerArc: {
    trigger: 'Samlings-typ för fem interaktiva peak-/avslutsevent från progressArcs. hungrig_breakthrough: en <=24-årig hungrig spelare har tre raka laguttagningsmatcher utan mål och har fortfarande inte gjort mål sedan arc-start. joker_redemption: en joker fick en suspension i nyss spelad match. veteran_farewell: veterantrait, age>=30, utgående kontrakt och matchday>=15. veteran_final_season: age>=34 med utgående kontrakt vid matchday<=1, ceremoni vid säsongsavslut. contract_drama: form>65, utgående kontrakt och ett fortfarande pending inkommande bud. Högst två aktiva icke-derby-arcs och en arc per spelare; varje event-id lagras i arc.eventsFired.',
    stateEffect: `hungrig: back_him morale +5/developmentRate −4, pressure morale −5, alternatives −15. joker: back_joker morale +8/discipline −4; bench_joker morale −10 och restGamesRemaining minst 1. veteran_farewell: extend_veteran contractUntilSeason=currentSeason+2, morale +10 och supporterMood +6; farewell_veteran morale −20, releasePlayer och supporterMood −14. veteran_final_season: ceremony_flowers hela lagets morale +15 och klubbkassa −10 000 kr; ceremony_simple veteranens morale +5. contract_drama: extend_now kontrakt +1 år och morale +10; wait_drama kontrakt oförändrat/morale −5; let_go morale −25 och releasePlayer. Numeriska värden klampas till respektive etablerade intervall. Varje val skrivs dessutom till rätt arcs decisionsMade.`,
    systems: ['spelarmoral och lagmoral', 'utvecklingstakt eller disciplin', 'kontrakt, truppstatus och enmatchstillgänglighet', 'klackens stämning och klubbekonomi', 'arc/storyline och efterföljande press/årsbok'],
    lifespan: 'Arc-bågarna byggs över 2–8 globala matchdays och tas bort när de löser sig eller passerar expiresMatchday. Kontrakt, release, developmentRate och discipline består; restGamesRemaining kostar nästa match. Arc-beslut och event är engångs inom respektive arc. Obesvarade playerArc-kort rinner ut uttryckligt vid säsongsrollover; aktiva arc-tidsankare omräknas separat mot nästa säsongs nollpunkt.',
    semanticKey: 'playerArc vid resolution; arcens id/eventsFired/decisionsMade skiljer undertyp och val; lyckade utfall kan skapa hungrig_breakthrough, joker_vindicated, veteran_stayed, veteran_farewell eller contract_drama_resolved',
    recallSurface: 'Före svar visas namngivet kort under Granska → Spelare (veteran_farewell är dessutom systemhändelse). Efteråt syns kontrakt/trupp/tillgänglighet/moral/disciplin/utveckling, klackstämning och ekonomi på ordinarie ytor. Resolvade arc-storylines återkommer i press, klubbminne och säsongssammanfattning där respektive utfall faktiskt skapats; utrinning lämnar DecisionRollover-post i Inkorg.',
    notes: 'Verifierad och rättad 2026-09-02 mot arcService.ts, eventResolver.ts, deferredRolloverService.ts, pressConferenceService.ts, seasonSummaryService.ts och arc-/veteranregressionerna. Tidigare O2/H1/påståendekartepass hade redan gjort arcarna nåbara, reverifierat stale peak-premisser, byggt fyra motvikter, genomfört veteranens tvåårsförlängning/release och kopplat storylines till verkliga utfall. O11-spårningen hittade kvar: contract_drama/extend_now lovade ännu förlängning men gav bara moral, wait_drama lovade en ospårad avhoppsrisk, jokerbänkning bänkade ingen och flera subtitles dolde eller antydde andra effekter än state. Lösningen återanvänder extendContract/restPlayer och anger alla faktiska deltan; ingen parallell arc-effektmotor skapades. Ingen separat source-/säsongscooldown finns, så cooldownSeasons lämnas medvetet undefined.',
  },
  supporterEvent: {
    trigger: 'Fyra säsongsscopade klackevent från generateSupporterEvents. Tifo: global matchday 5–7, tifoDone=false och 70 % chans. Konflikt: matchday 9–11 efter genomfört tifo, inte redan denna säsong och 50 %. Öppet brev: matchday 8–16 och supporterGroup.mood<35, utan slump. Bortaresa: matchday 6–15, mood>=50, inte redan denna säsong, en schemalagd icke-cup-bortamatch med global matchday inom 0–3 och 45 %. Canonical säsongs-id:n dedupliceras mot pending/resolved.',
    stateEffect: `Tifo: yes supporterMood +5/communityStanding +2 och maybe supporterMood +2; båda sätter tifoDone och global tifoDoneMatchday. no ger supporterMood −3 utan tifoDone. Konflikt: both supporterMood +5/fanMood +3, sture supporterMood −2, elin supporterMood +3/communityStanding +1; alla sätter conflictSeason/conflictMatchday. Öppet brev: respond_publicly supporterMood +8/communityStanding +2, meet_privately supporterMood +5, ignore supporterMood −2. Bortaresa: subsidize klubbkassa −5 000 kr/supporterMood +8/communityStanding +3, encourage supporterMood +5, acknowledge +2; alla sätter awayTripSeason/awayTripMatchday. Mood/fan/CS klampas 0–100 och ekonomin använder ordinarie financeLog-väg.`,
    systems: ['klackens stämning och säsongsmarkörer', 'communityStanding och fanMood', 'klubbekonomi för bussbidraget', 'klackens efterklang på Orten'],
    lifespan: 'Varje undertyp högst en gång per säsong genom säsongs-id och tifo/conflict/awayTrip-markörer. Moral-/CS-/ekonomideltan består; klackens eventefterklang visas i tre globala matchdays från resolutionen. Obesvarade kort saknar neutralt val och rinner ut uttryckligt vid rollover.',
    semanticKey: 'supporterEvent vid resolution; canonical event-id skiljer tifo/conflict/open_letter/away_trip och säsong',
    recallSurface: 'Före svar visas valbärande supporterEvent i Granska → Översikt genom reaktionsklassningens choice-regel. Efteråt syns supporterMood/medlemmar och de tre markörförsedda eventen på Orten/Klacken i tre matchdays; communityStanding, fanMood och klubbkassa syns på ordinarie ytor. resolvedChoices/narrativeBeatLog är interna bärare; utrinning ger DecisionRollover-post i Inkorg.',
    notes: 'Verifierad och rättad 2026-09-02 mot supporterEvents.ts, eventResolver.ts, klackPresenter.ts, granskaEventClassifier.ts och deferredRolloverService.ts. O11-spårningen hittade att bortaresans globala currentRound jämfördes med fixture.roundNumber, specialmarkörerna tidsstämplades från processorns lastProcessedMatchday-cursor och efterklangen hittade på derby, genomförd resa, tretton resenärer och fasta +12/+8 trots att valen gav andra utfall. Källan använder nu fixture.matchday/game.currentMatchday och återberättandet håller sig till fakta som alla möjliga valutfall stöder. Konfliktvalets pengaikon och ospårade personbesvikelse är ersatta med faktiska fanMood/supporterMood-deltan. Ingen separat source-cooldown finns; cooldownSeasons lämnas medvetet undefined.',
  },
  mecenatInteraction: {
    trigger: 'En aktiv mecenat med happiness<40 nås i generatePostAdvanceEvents när eventblocket har plats. För samma mecenat får högst en intervention per säsong skapas: canonical prefix event_mec_intervention_{mecenatId}_s{season}_ kontrolleras mot både pendingEvents och resolvedEventIds. Kortet är systemhändelse och month-tier; eventtypens orten-kanal konkurrerar dessutom med andra orten-kort i centralredaktören.',
    stateEffect: `Personlighetsanpassat invite_right ger mecenatens happiness +18, drar 8 000 kr för showman, 5 000 kr för tyst_kraft eller 6 000 kr för övriga och sätter lastInteractionRound=currentMatchday. invite_generic ger happiness +8 utan kostnad och tidsstämplar samma verkliga interaktion. ignore är noOp; då står den gamla interaktionstidpunkten kvar och eventProcessorns befintliga −1 happiness efter mer än fyra omgångars tystnad kan fortsätta. Happiness klampas 0–100 och kostnaden bokförs via ordinarie financeLog.`,
    systems: ['mecenatens happiness och interaktionsklocka', 'klubbekonomi', 'eventbudget/centralredaktörens orten-kanal'],
    lifespan: 'Högst en intervention per mecenat och säsong. Happiness/kostnad består; lastInteractionRound pausar den ordinarie tystnadsnedgången tills mer än fyra nya matchdays passerat. Ett obesvarat kort auto-resolvas till det uttryckliga noOp-valet ignore vid rollover och lämnar en DecisionRollover-post.',
    semanticKey: 'mecenatInteraction vid resolution; canonical event-id innehåller mecenatId+säsong+matchday',
    recallSurface: 'Före svar visas month-tier-kortet på Portalen med mecenatens namn, företag, happiness och kostnad. Efter svar syns mecenatrelationen och klubbkassa/financeLog på ordinarie ytor; resolvedChoices/narrativeBeatLog är interna bärare. Rollover-defaulten syns i Inkorg.',
    notes: 'Verifierad och rättad 2026-09-02 mot postAdvanceEvents.ts, eventFactories.ts, eventResolver.ts, eventProcessor.ts, decisionTierService.ts, narrativeCoordinatorService.ts och deferredRolloverService.ts. O11-spårningen hittade att ”no existing intervention queued this season” implementerats med ett prefix utan säsong och därför blockerade samma mecenat över framtida säsonger, samt att en aktiv mecenats happiness ändrades utan att lastInteractionRound uppdaterades. ID:t är nu säsongsscopat och den befintliga generiska mecenatHappiness-vägen tidsstämplar både aktivering och aktiva interaktioner med canonical currentMatchday; ingen parallell cooldown byggdes. Ingen separat source-cooldown finns, så cooldownSeasons lämnas medvetet undefined.',
  },
  journalistExclusive: {
    trigger: 'Efter en spelad omgång när eventblocket har plats: game.journalist finns med canonical relationship>=65, 15 %-slumpen faller in och narrativeBeatLog saknar journalist_exclusive_player_-post för aktuell säsong. Bland egna friska spelare väljer den delade rotateSubject högst currentAbility efter att alla tidigare figurerade nuvarande truppspelare uteslutits; när hela truppen gått ett varv släpps poolen. Canonical spelare+global matchday-id dedupliceras mot pending/resolved, och presskanalens budget/recency kan tränga undan kortet.',
    stateEffect: `accept ger relatedPlayerId morale +10, communityStanding +1 och journalistens relation +5. decline ger relation −5. Den generiska journalistRelationship-effekten klampar 0–100 och dual-write:ar både canonical game.journalist.relationship och legacy game.journalistRelationship samt sätter journalist.lastInteractionMatchday=currentMatchday; ingen dold rapport-, ekonomi- eller kontraktseffekt finns.`,
    systems: ['spelarmoral', 'communityStanding', 'canonical journalistrelation och interaktionstid', 'centralredaktörens presskanal och karriärbreda spelarrotation'],
    lifespan: 'Högst ett exklusivt reportage per säsong. Samma spelare väljs inte igen förrän hela den nuvarande truppen figurerat; relation/moral/CS består tills andra händelser ändrar dem. Ett obesvarat kort saknar neutralt val och rinner ut uttryckligt vid rollover.',
    semanticKey: 'journalistExclusive vid resolution; journalist_exclusive_player_{playerId} vid generering för säsongsspärr och karriärbred rotation; source_lokaltidningen vid resolution',
    recallSurface: 'Före svar visas bakgrundskortet där press-/Granskaflödet placerar det, med namngiven journalist och spelartagg. Efter svar syns spelarmoral, communityStanding och den canonical journalistrelationen på ordinarie ytor; narrativeBeatLog/resolvedChoices är interna bärare. Utrinning lämnar DecisionRollover-post i Inkorg.',
    notes: 'Verifierad och rättad 2026-09-02 mot postAdvanceEvents.ts, eventFactories.ts, eventResolver.ts, journalistService.ts, journalistRelationshipScene.ts, narrativeCoordinatorService.ts, sourceCooldownService.ts och deferredRolloverService.ts. A-H4a/Centralredaktören hade redan byggt säsongsspärren och det skyddade karriärvarvet. O11-spårningen hittade att båda reportagevalen bara ändrade det gamla journalistRelationship-fältet medan generatorn och relationens UI läser game.journalist.relationship; den utlovade +5/−5-effekten var därför osynlig och påverkade inte framtida eligibility. Den gemensamma effekten dual-write:ar nu canonical+legacy i både toppnivå- och multiEffect-grenen; ingen parallell reporterlogik skapades. Ingen contentContract-cooldown i säsonger finns utöver de uttryckliga loggnycklarna ovan, så cooldownSeasons lämnas undefined.',
  },
  academyEvent: {
    trigger: 'Efter en färdigspelad match för den hanterade klubben granskar processYouth den senast spelade fixture den har tillgång till. En målskytt skapar kortet bara om spelaren fortfarande tillhör klubben, är högst 21 år, har promotedFromAcademy=true och careerStats.totalGames exakt 1. Canonical id event_breakthrough_{playerId} stoppas mot både pendingEvents och resolvedEventIds; högst ett genombrottskort skapas per processorpass.',
    stateEffect: `Enda valet 'ack' har effect.type='noOp': spelarens moral, form, utveckling, statistik och klubbens övriga state lämnas oförändrade. Kortet kvitterar bara ett redan inträffat debutmål. Premissen kommer från fixture.events och den redan infällda careerStats.totalGames===1; eventet bär relatedPlayerId för exakt samma spelare.`,
    systems: ['akademibakgrund och karriärstatistik', 'matchhändelsens målskytt/minut', 'Granska → Spelare och eventköns deduplicering'],
    lifespan: 'Högst ett genombrottskort per spelare under hela karriären genom stabilt spelar-id och kravet totalGames===1. Om samma fixture läses igen blockeras den medan kortet är pending eller efter resolution. Vid säsongsrollover används kortets uttryckliga noOp-val ack och en DecisionRollover-post skapas.',
    semanticKey: 'academyEvent vid resolution; instans-id event_breakthrough_{playerId}',
    recallSurface: 'Före svar visas kortet under Granska → Spelare med den berörda spelarens tagg; debutmålet finns kvar i matchrapport/statistik. Efter kvittering finns ingen separat permanent spelarvänd beslutshistorik eftersom ingen ny effekt har valts; resolvedChoices och narrativeBeatLog är interna bärare. Ett rollover-default syns i Inkorg.',
    notes: 'Verifierad och rättad 2026-09-02 mot youthProcessor.ts, eventResolver.ts, granskaEventClassifier.ts, GranskaSpelare.tsx, eventQueueService.ts och deferredRolloverService.ts. HIGH 8 hade redan gjort id:t stabilt, krävt verklig förstamatch och avgränsat till egna akademiprodukter. O11-spårningen hittade att typen routes till spelarytan men saknade relatedPlayerId, så den namngivna spelaren inte kunde visas som tagg; generatorn bär nu samma id som premissen. Kvitteringen är avsiktligt noOp: texten beskriver bara redan inträffad matchdata och lovar ingen ny mekanisk belöning. Ingen separat source-/säsongscooldown finns, så cooldownSeasons lämnas medvetet undefined.',
  },
  playoffEvent: {
    trigger: 'Tre fasbundna kort. QF skapas av handlePlayoffStart när den kanoniska tabellen placerar managed club topp 8 och playoff_qf_{season} saknas i pending, deferred och resolved. SF/final skapas av processPlayoffRound när hela föregående fasen är avgjord, managed club faktiskt finns i den nya bracketen och respektive playoff_sf_/playoff_final_{season}-id saknas i alla tre köminnen. QF-textens första-året-kontrast läser verklig seasonSummaries.playoffResult; SF/final väljer en befintlig aktiv mecenat/supporterledare eller ordförande-fallback.',
    stateEffect: `Alla tre instanser har exakt ett 'ack'-val med noOp. Kvitteringen ändrar ingen trupp-, klubb-, ekonomi-, relations-, bracket- eller matchstate; den tar bort kortet och skriver den vanliga resolvedChoices-/narrativeBeatLog-posten. Själva slutspelsavancemanget, CS-belöningen och resultatnotiserna beräknas separat av playoffProcessor från spelade matcher och tillskrivs aldrig ack-valet.`,
    systems: ['slutspelstabell och levande bracketfas', 'säsongshistorik för tidigare slutspel', 'befintlig mecenat/supporterledare som narrativ avsändare', 'pending/deferred/resolved-köernas fasdeduplicering'],
    lifespan: 'Högst ett QF-, SF- och finalkort per säsong. Varje kort är giltigt bara medan managed club lever i exakt den fasen; staleEventIds och isPlayoffNarrativeCardStillValid rensar pending/deferred om fasen avslutas eller klubben elimineras, inklusive live-matchens direkta bracketväg. Ett kvarvarande kort auto-kvitteras inte vid rollover utan rinner ut uttryckligt.',
    semanticKey: 'playoffEvent vid resolution; instans-id playoff_qf_{season}, playoff_sf_{season} respektive playoff_final_{season}',
    recallSurface: 'Före svar surfar den aktuella fasens notis på Portalens month-yta. Efter kvittering finns ingen separat beslutseffekt att visa; verkliga resultat, avancemang/eliminering och bracketen syns i slutspelsvyer och Inkorg, medan resolvedChoices/narrativeBeatLog är interna bärare. Utrinning syns som DecisionRollover-post.',
    notes: 'Verifierad och rättad 2026-09-02 mot playoffTransition.ts, playoffProcessor.ts, playoffNarrativeService.ts, playoffService.ts, eventResolver.ts, decisionTierService.ts och deferredRolloverService.ts. Tidigare A3/HIGH 5-fixar hade redan gjort fasgiltighet konsumtionstidskontrollerad, rensat gamla QF/SF/finalkort och härlett roundNumber/matchday utan hårdkodning. O11 hittade två kvarvarande glapp: QF-startens dedupe glömde deferredDecisions, och tre rena enknapps-noOp-kvitteringar var felklassade som dilemma. Dedupe läser nu samma tre köminnen som SF/final, och playoffEvent är notis-mode men behåller month-tierns avsedda synlighet. Samma klassning rättades för academyEvent. Ingen parallell slutspelsmekanik byggdes.',
  },
  bandyLetter: {
    trigger: 'generateBandyLetterEvent prövas varje global matchday 10–18. Den kräver att bandyLetterThisSeason inte redan är aktuell säsong, att canonical event_bandy_letter_{season} saknas i resolvedEventIds, pendingEvents och deferredDecisions samt att managed club finns. Matchday+säsong väljer deterministiskt en av tre brevformer och strukturerad avsändare (namn, 68–85 år och ort); eventprocessorns centrala budget/routing avgör när det faktiskt ytar.',
    stateEffect: `Varje val använder saveBandyLetter och lägger exakt ett BandyLetter i det permanenta arkivet med event-id, avsändarens strukturerade namn/ålder/ort, säsong, originaltext, savedInArchive=true och valt replyText eller inget svar. bandyLetterThisSeason sätts till currentSeason. Spelarnas moral, klubbekonomi, communityStanding och relationer ändras inte; den tidigare dolda +3-lagmoralbonusen är borttagen eftersom inget val eller brev deklarerade den.`,
    systems: ['brevarkivet och strukturerad avsändardata', 'säsongsdeduplicering över pending/deferred/resolved', 'Granskas reaktionsyta', 'Efterklangens säsongsbundna brevminne'],
    lifespan: 'Högst ett brev per säsong. Det arkiverade brevet och spelarens eventuella svar består i karriärhistoriken; Efterklang kan referera till brev från innevarande säsong. bandyLetterThisSeason nollställs vid rollover. Ett obesvarat brev har inget neutralt val — samtliga alternativ skulle skriva ett arkiv/svar — och rinner därför ut uttryckligt.',
    semanticKey: 'bandyLetter vid resolution; instans-id event_bandy_letter_{season}',
    recallSurface: 'Före svar visas brevet med sina riktiga svar under Granska → Reaktioner/Översikt. Efter svar visas full brevtext och eventuellt svar permanent under Historia → Brev; samma säsongs avsändare kan dessutom återkomma i Portalens Efterklang. resolvedChoices/narrativeBeatLog är interna bärare; ett obesvarat brevs utrinning syns i Inkorg.',
    notes: 'Verifierad och rättad 2026-09-02 mot bandyLetterService.ts, eventProcessor.ts, eventResolver.ts, granskaEventClassifier.ts, HistoryScreen.tsx, pickEfterklang.ts och deferredRolloverService.ts. O11 hittade att deferred-kön inte ingick i engångsspärren, att avsändarens ålder/ort sparades som 0/tomt trots att generatorn kände dem, att varje arkiv-/svarsval gav en helt dold +3-lagmoral och att rollover policynamngav decline trots att inget noOp fanns. Samma canonical köspärr används nu, avsändardata bärs strukturerat, den odeklarerade bonusen är borttagen och policyn är explicit expire. Ingen parallell brev- eller morale-mekanik byggdes. Copy-polish kvar för Opus: reply_warm-labeln skriver ”filen” där brevets kropp handlar om ”filten”; detta är inte ett state-glapp och hindrar inte kontraktets sex fält.',
  },
  schoolAssignment: {
    trigger: 'generateSchoolAssignmentEvent prövas global matchday 10–12 och kräver att schoolAssignmentThisSeason inte redan är aktuell säsong, att event_school_assignment_{season} saknas i resolved/pending/deferred samt att en fortfarande egen spelare med academyClubId=managedClubId och age<=21 finns. Den yngsta kvalificerade väljs. tell_notable erbjuds bara när seasonSummaries innehåller en topp 3-/SM-final-/SM-guldsäsong; tell_legend bara när clubLegends har en post; tell_now finns alltid.',
    stateEffect: `Varje erbjudet val har saveSchoolAssignment med obligatorisk replyText. Resolutionen lägger en SchoolAssignmentRecord i det permanenta arkivet med currentSeason, den relatedPlayerId-belagda spelarens aktuella namn (avsändarnamn som fallback), exakt valt choiceLabel och exakt replyText; schoolAssignmentThisSeason sätts till currentSeason. Ingen spelar-, klubb-, ekonomi-, moral-, utvecklings- eller relationsstate ändras. Resolvern kastar om replyText saknas i stället för att skapa en tom historikpost.`,
    systems: ['egen akademispelare och spelaridentitet', 'verklig seasonSummaries-/clubLegends-historik', 'skoluppgiftsarkivet', 'personal-kanalens surfacingbudget och Granska → Spelare'],
    lifespan: 'Högst en skolintervju per säsong genom canonical id och schoolAssignmentThisSeason. Den valda arkivposten består under karriären; säsongsmarkören nollställs vid rollover. Ett obesvarat kort har inget neutralt val eftersom varje alternativ skriver en specifik historieberättelse, och rinner därför ut uttryckligt.',
    semanticKey: 'schoolAssignment vid resolution; instans-id event_school_assignment_{season}',
    recallSurface: 'Före svar visas den namngivna unga spelaren och de historiskt tillgängliga valen under Granska → Spelare. Efter svar visas spelarens namn, vald label och full arkivtext permanent under Historia → Skoluppgifter. resolvedChoices/narrativeBeatLog är interna bärare; utrinning syns i Inkorg.',
    notes: 'Verifierad och rättad 2026-09-02 mot schoolAssignmentService.ts, eventProcessor.ts, eventResolver.ts, narrativeCoordinatorService.ts, granskaEventClassifier.ts, HistoryScreen.tsx och deferredRolloverService.ts. Eventets textval var redan knutna till faktisk säsong-/legenddata och den namngivna akademispelaren, utan dolda numeriska effekter. O11 hittade att deferred-kön saknades i engångsspärren och att rollover var märkt decline trots att inget noOp-val finns; båda använder nu samma sanning som brevet. Dessutom är replyText ett hårt resolverkrav så framtida trasiga val inte kan spara tom historia. Ingen parallell skol-/historikmekanik byggdes.',
  },
  hesitantPlayer: {
    trigger: `Transferbud där bid.buyingClubId har lägre reputation än spelarens nuvarande klubb (hesitantPlayerEvent, eventFactories.ts:40)`,
    stateEffect: `'convince': boostMorale +15 (targetPlayerId=bid.playerId). 'accept': noOp — verifierat av O2-revisionen (2026-08-20), ingen dold effekt.`,
    systems: ['spelarmoral', 'transferbud'],
    lifespan: 'engångs',
    semanticKey: 'hesitant_player',
    cooldownSeasons: 0,
    recallSurface: 'ingen — modal stängs, ingen loggpost',
    notes: 'Domens eget referensfall för O2. Ärligt: bara två val, ingen tredje "no-op med löfte om mer"-risk kvar i denna specifika event.',
  },
  playerPraise: {
    trigger: 'Spelare med hög form/matchbelastning triggar praise-event (playerPraiseEvent-mönstret, eventFactories.ts ~199)',
    stateEffect: `'vila'-valet: boostMorale +10 — INTE en fitness/vila-effekt, spelaren spelar nästa match som vanligt. Domens Varför-tabell citerar just detta som exempel på ett löfte texten INTE höll ("Ge honom vila" → spelaren vilade inte).`,
    systems: ['spelarmoral'],
    lifespan: 'engångs',
    recallSurface: 'ingen',
    notes: 'Kvarstående gap, inte fixat i detta pass — texten kan fortfarande lova mer än effekten ger. Kräver Opus-text för att antingen korrigera löftet eller bygga en riktig vila-mekanik.',
  },
  sponsorOffer: {
    trigger: 'postAdvanceEvents.ts:~599 (generateSponsorOffer, sponsorService.ts) — en gång per omgång om activeSponsors<maxSponsors.',
    stateEffect: `Plain (ingen rival i samma kategori): 'accept' lägger till sponsorn, ingen kostnad. 'reject': noOp — ren kvitteringsknapp, O2-dominansfynd (0f96f1c2). Konfliktvariant (O1, 2026-08-22, en aktiv sponsor i samma kategori finns redan): 'accept' lägger till den nya OCH nollställer rivalens contractRounds (avtalet slutar) OCH communityStanding -6. 'reject': noOp, rivalen behåller sin plats.`,
    systems: ['ekonomi', 'communityStanding (bara konfliktvarianten)'],
    lifespan: 'engångs',
    recallSurface: 'ingen',
    notes: 'O1 (DOM_VARSLET_SOM_SYSTEMMALL_2026-08-17.md) — sponsorn med ett problem, högst prioriterade kandidaten, byggd 2026-08-22. 4/5 av mallen: punkt 2 (spelare/funktionär redan mött) ouppfylld, sponsorer är företag. Därför INTE systemhandelse:true. Text (title/body/subtitles på konfliktvarianten) väntar Opus — placeholder \'[Opus]\' i koden.',
  },

  // ── De fyra kritiska typerna (Jacobs order, 2026-08-22, dömda 2026-08-24)
  // — spårade FÖRST, före de återstående 85, eftersom D1 punkt 4:s
  // self-kontroll (2026-08-21) nedgraderar till 'normal' tills whyNow-data
  // finns. Alla fyra domar fällda: criticalEconomy fas 3 och playerUnhappy
  // (bara med aktiv bid) sätter whyNow INSTANS-NIVÅ i sina konstruktions-
  // ställen — typ-nivå-raderna här förblir avsiktligt osatta. mecenatEvent
  // sätter whyNow bara på EN av åtta undertyper (90+ styrelsehot), samma
  // instans-mönster. economicStress förblir avsiktligt utan whyNow
  // permanent — inte ett kvarstående gap, se dess notes.
  playerUnhappy: {
    trigger: 'player.morale < 35 OCH bänkad (ej startande) i minst 2 av senaste 3 spelade matcher för hanterade klubben (postAdvanceEvents.ts:128-151).',
    stateEffect: `'promise'-valet: boostMorale +10 (targetPlayerId). 'hold': noOp — missnöjet kvarstår oadresserat, ingen nedåtgående konsekvens modellerad om spelaren ignoreras.`,
    systems: ['spelarmoral'],
    lifespan: 'engångs per säsong (event-id inkluderar currentSeason — samma spelare kan trigga igen nästa säsong)',
    recallSurface: 'ingen',
    notes: 'DÖMT 2026-08-24: pivotal bara när irreversibel, dvs. spelaren faktiskt kan lämna — inte bara är sur. Wirat instans-nivå (eventFactories.ts, unhappyPlayerEvent): whyNowPerson=spelarens förnamn sätts BARA när en aktiv, inkommande pending transferbid finns för spelaren (samma game.transferBids-källa som transferBidReceived). Ingen bud → whyNow osatt → normal, per D1 punkt 4. Typ-nivå-raden här förblir avsiktligt utan whyNow-fält — beslutet är per-instans, inte per-typ.',
  },
  economicStress: {
    trigger: 'managedClub.finances mellan -100 000 och +50 000 kr ("stress-zonen"), throttlead till max 1 händelse per 6 omgångar (game.lastEconomicStressRound). Tre slumpmässigt valda flavor-varianter (materialarens klubbor / bussbolagets avtal / kioskvaktens korvavtal), ingen unik semantisk identitet per variant.',
    stateEffect: 'Litet ekonomiskt val per variant: -5000 till +4000 kr, eller en moraleDelta -2 (materialar-variantens "vänta"-val). Ingen av de tre bär en verklig kris.',
    systems: ['ekonomi'],
    lifespan: 'engångs, kan återkomma var 6:e omgång så länge zonen gäller',
    recallSurface: 'ingen',
    notes: 'DÖMT 2026-08-24: INTE pivotal, avsiktligt. En ekonomisk varning är ett tillstånd, inte en fråga som kräver svar just nu — criticalEconomy fas 3 är redan den pivotala ekonomikanalen, en andra hade varit en för mycket. whyNow lämnas permanent osatt här (inte "ännu inte spårat") — event nedgraderas till normal per D1 punkt 4, vilket är det avsedda utfallet, inte ett kvarstående gap.',
  },
  mecenatEvent: {
    trigger: 'ÅTTA separata undertyper, samma GameEventType, olika villkor (mecenatService.ts): (a) generateMecenatIntroEvent — ny mecenat presenterar sig, triggervillkor satt vid mecenat-generering, ej vidare spårat. (b) generateSocialEvent — periodisk social inbjudan (jakt/middag/golf/bastu/vin/segling/hockey/vernissage), typ vald slumpmässigt ur mecenatens businessType, säsongsfiltrerad. (c–f) generateSilentShoutEvent — fyra trösklar på mecenat.silentShout: 30–49 medieomnämnande (15% chans/omgång), 50–69 transferförslag (20% chans, kräver namngiven spelare), 70–89 taktikpress (15% chans, kräver ej redan offensiv taktik), 90+ styrelsehot (20% chans). (g) generateMecenatConflictEvent — två mecenater med motstridiga önskemål, triggervillkor ej vidare spårat. (h) generateMecenatAllianceEvent — två mecenater vill samfinansiera samma projekt, triggervillkor ej vidare spårat. (i) checkMecenatRetirement — mecenat.yearsActive ≥ retirementThreshold (default 6) ELLER age ≥ 70, ej redan announced.',
    stateEffect: 'Nästan alla varianter: mecenatHappiness ±5 till ±30 beroende på val. Konflikt/allians: multiEffect på båda mecenaternas happiness samtidigt. Retirement: ingen direkt stateeffekt i själva announcement-eventet.',
    systems: ['mecenatrelation', 'ekonomi (enstaka varianter, t.ex. intervention-kostnad)'],
    lifespan: 'engångs per tillfälle — silentShout-varianterna kan återkomma om siffran stiger igen efter en tidigare händelse',
    recallSurface: 'ingen enhetlig — varierar per undertyp, ej kartlagd denna session',
    notes: 'DÖMT 2026-08-24: 8 undertyper delar inte en whyNow-rad — wirat per undertyp istf. Bara EN av de åtta (generateSilentShoutEvent, 90+ styrelsehot) sätter whyNowPerson=mecenat.name, den enda grenen vars text faktiskt uttalar en verklig avhoppsrisk ("överväger jag att dra mig tillbaka"), inte bara en relationssiffra. De andra sju (intro/social/media/transfer/taktik/conflict/alliance/retirement) saknar whyNow avsiktligt — regeln kontrollerar sig själv, de nedgraderas till normal. Typ-nivå-raden här förblir avsiktligt utan whyNow-fält — beslutet är per-instans, inte per-typ.',
  },
  criticalEconomy: {
    trigger: 'managedClub.finances < -200 000 kr (economicCrisisService.ts). Fas 1 (awareness) triggar direkt. Fas 2 (pressure) triggar 3 omgångar efter fas 1 startade, om ej redan löst. Fas 3 (decision) triggar 5 omgångar efter fas 1, om ej löst.',
    stateEffect: 'Fas 1: inget direkt, möte bokas. Fas 2: "present_plan" −20 000 kr, "accept_loss" löser krisen naturligt. Fas 3 (tre vägar): "sell_star" +350 000 kr + spelaren SÄLJS (permanent), "take_loan" +300 000 kr löpande kostnad, "ask_mecenat" +200 000 kr − mecenatlojalitet 30. Fas 3s sell_star är redan O19-märkt systemhandelse:true.',
    systems: ['ekonomi', 'spelartrupp (fas 3, sälj-alternativet)', 'mecenatrelation (fas 3, mecenat-alternativet)'],
    lifespan: 'en sammanhängande båge över minst 5 omgångar (fas 1→2→3), sedan löst för säsongen',
    recallSurface: 'ingen',
    notes: 'whyNow WIRAD INSTANS-NIVÅ (O2 lager 1, 2026-08-24): fas 3s event (economicCrisisService.ts) sätter whyNowPerson="Johan Bergstedt" (ekonomichefen) direkt på GameEvent.whyNow — inte via denna typ-nivå-rad, som förblir avsiktligt osatt. Fas 1/2s kroppstext antyder deadlines ("Jag vill träffa dig. I morgon.", "inom två veckor") men INGEN är en mekanisk deadline i koden (fas 3 triggar strikt matchday-baserat) — att sätta deadlineLabel från dessa citat vore att koda in ett löfte texten inte håller, samma klass av fel som playerPraise-fyndet. sell_star-valet fick consequenceLevel="costly"/costLabel/irreversible (D1 punkt 3s fält) 2026-08-26 (L4) — var den enda verkliga instansen av dessa fält i hela kodbasen, tidigare bara testade i consequenceMarker.test.ts.',
  },
}

const FILLED_ANSPRAK4: Partial<Record<string, Omit<ContentContractEntry, 'id' | 'source' | 'filled'>>> = {
  communityActivityRenewal: {
    trigger: 'En aktiv ortsaktivitet vars staleness-multiplikator fallit till ≤ ACTIVITY_RENEWAL_TRIGGER_MULTIPLIER (0,95) — nås bara över rykte 80, aldrig av en liten klubb. Utöver det: source cooldown "orten" (6 omgångar) inte aktiv, canAddDecision-budgeten öppen, klubben har råd med kostnaden, och aktiviteten har inte redan fått ett förnyelsebeslut denna säsong. Genereras i eventProcessor.ts, konstrueras i communityRenewalService.ts:generateCommunityRenewalEvent.',
    stateEffect: `'renew': effect 'renewCommunityActivity' — club.finances −getActivityRenewalCost(rykte) (10 tkr vid rykte 80, 40 tkr vid rykte 100) OCH communityActivitiesSince[key] = currentSeason (staleness-klockan nollställd, aktiviteten tillbaka på full färskhet). VÄG C (2026-08-31): färskheten konsumeras av getOrtFreshnessFactor → computeAttendanceRate, alltså av PUBLIKEN — inte av csBoost, som sedan dess är oberoende av staleness. Ingen communityStanding-ändring — domens SKYDDAT-punkt. 'decline': noOp — aktiviteten står kvar och fortsätter tappa dragningskraft nästa säsong.`,
    systems: ['publikintäkt (ortFreshnessFactor → computeAttendanceRate)', 'ekonomi (klubbkassan)'],
    lifespan: 'engångs per aktivitet och säsong; återkommer så länge klubben är stor nog att aktiviteten hinner slitas igen',
    semanticKey: 'community_activity_renewal',
    cooldownSeasons: 0,
    recallSurface: 'Ortsfliken (aktivitetens status) + kassaförändringen i financeLog. Ingen egen loggpost.',
    notes: 'Domens formulering "denna månad-nivå för normalt, måste-nivå bara om CS är på väg under en uttågströskel" är bara HALVT byggd: tier är statiskt month. Den villkorade eskaleringen kräver ett per-instans tier-åsidosättande som arkitekturen inte har, och måste-listan är stängd (Jacobs dom) — flaggat till Jacob, medvetet inte kringgått. Texten (title/body/valetiketter) är TOM i communityRenewalText.ts tills Opus levererar; kortet renderar då ingen prosa, per CLAUDE.md:s hårda regel.',
  },
}

const FILLED_BURNOUT_TAK: Partial<Record<string, Omit<ContentContractEntry, 'id' | 'source' | 'filled'>>> = {
  burnoutCeiling: {
    trigger: 'managerProfile.burnoutScore legat på EXAKT 100 i ≥ BURNOUT_CEILING_TRIGGER_ROUNDS raka omgångar (shouldTriggerBurnoutCeilingChoice, managerProfileService.ts) OCH burnoutCeilingChoiceOffered inte redan satt för denna sammanhängande episod. Genereras i eventProcessor.ts, konstrueras i burnoutCeilingService.ts:generateBurnoutCeilingEvent.',
    stateEffect: `'step_back': multiEffect — 'startBurnoutCeilingRecovery' sätter burnoutCeilingRecoveryUntilRound (garanterad bonus-decay + tvingad full taktikundertryckning under fönstret, se managerProfileService.ts/burnoutReliefService.ts), 'startTrainingSlowdown' (samma mekanik som burnoutRelief, återanvänd), 'boardPatience' −BURNOUT_CEILING_BOARD_PATIENCE_COST (tålamodskostnaden). 'push_through': noOp mekaniskt — inget omedelbart pris, risken är narrativ (permanens). BÅDA: en post i managerProfile.diary (type 'burnout_scar') och managerProfile.burnoutScar sätts permanent ('stepped_back'/'hardened') via en dedikerad eventResolver.ts-hook (samma mönster som varsel/offer_pro), inte via en generisk effekttyp.`,
    systems: ['managerProfile (burnoutScore, diary, burnoutScar)', 'boardPatience (step_back)', 'taktikrekommendation (step_back, tvingad undertryckning)', 'träningsintensitet (step_back, återanvänd burnoutTrainingSlowdownUntilRound)'],
    lifespan: 'engångs per sammanhängande takepisod (roundsAtBurnoutCeiling nollställs när scoret sjunker under 100, vilket öppnar för en ny episod senare i karriären)',
    semanticKey: 'burnout_ceiling_choice',
    cooldownSeasons: 0,
    recallSurface: 'managerProfile.diary (TranareTab.tsx, permanent) — ärret syns där resten av karriären. Ingen egen loggpost utöver diaryn.',
    notes: 'DOM_BURNOUT_TAK_2026-09-02 (Jacobs beslut A+C+D, GPT:s burnout-audit). FLAGGAT precis som communityActivityRenewal ovan: domen kallar mekaniken "icke-deferbar, samma som andra måste-kort" men namnger inte decisionTierService.ts:s stängda måste-lista explicit — tier satt till \'month\' tills Jacob uttryckligen utökar listan. C:s "verkliga release" är den faktiska buggfixen för GPT:s 100→97-fynd (updateManagerBurnout()s press/återhämtning-dragkamp kunde nettas nästan till noll under sustained press) — se burnoutCeilingRecoveryUntilRound (SaveGame.ts). Mallsträngar (title/body/choice-etiketter/ärr-diaryrad) levererade av Opus 2026-09-02 — inget platshållarläckage kvar. Magnituderna (N omgångar vid taket, återhämtningsfönstrets längd/styrka, board-kostnaden) är fortsatt D-fact-placeholders, Jacobs känslo-kalibrering väntar en mätning (dominant-men-pressad-scenariot, domens eget "godkänt när").',
  },
}

const PIVOTAL_FILLED: Partial<Record<string, Omit<ContentContractEntry, 'id' | 'source' | 'filled'>>> = {
  board_failure: {
    trigger: `boardObjectives.some(status==='failed') (portalBeats.ts:134)`,
    stateEffect: 'Ingen mekanisk state-effekt — ren text/severity-eskalering (1→2→3) baserad på boardPatience. Ambient-liknande i mekanik, men severity 3 renderas som kris-band.',
    systems: ['styrelsens tålamod'],
    lifespan: 'N omgångar (tills nästa boardObjective-utvärdering)',
    semanticKey: 'board_failure',
    cooldownSeasons: 2,
    recallSurface: 'ingen egen — härleds ur boardObjectives-status i Portal',
    notes: 'Pivotal (U5 forts, c2e34591). keyFn bakar in severity+säsong i den nyckel som skrivs till shownBeats — isOnCooldown matchar separat mot det stabila beat.id.',
  },
  ripple_consequence: {
    trigger: 'pendingRippleChains[0].round === currentMatchday (portalBeats.ts:175)',
    stateEffect: 'Ingen egen — renderar en redan beräknad rippleEffectService-kedja (stjärnskada/derbyseger/mecenatavhopp), stegvis lista + klausul.',
    systems: ['varierar per trigger (Orten/Styrelsen/Sponsorerna, se STEP_VERBS)'],
    lifespan: 'engångs (visas en gång; kedjan finns kvar i arrayen för ev. framtida konsument, t.ex. en granska-vy)',
    semanticKey: 'ripple_consequence',
    cooldownSeasons: 2,
    recallSurface: 'ingen (framtida granska-vy nämnd som möjlig, inte byggd)',
    notes: 'Pivotal. keyFn (trigger+omgång+säsong) matchar aldrig "ripple_consequence" som sträng — en extra logNarrativeBeat-post på beat.id krävdes separat i dismissBeat för att isOnCooldown ska hitta träffen.',
  },
}

export const CONTENT_CONTRACT: ContentContractEntry[] = [
  ...GAME_EVENT_TYPE_IDS.map(id => {
    const filled = FILLED[id] ?? FILLED_ANSPRAK4[id] ?? FILLED_BURNOUT_TAK[id]
    return { ...basePlaceholder(id, 'GameEventType'), ...(filled ? { ...filled, filled: true } : {}) }
  }),
  ...STORYLINE_TYPE_IDS.map(id => basePlaceholder(id, 'StorylineType')),
  ...ARC_TYPE_IDS.map(id => basePlaceholder(id, 'ArcType')),
  ...PORTAL_BEAT_IDS_ALL.map(id => ({ ...basePlaceholder(id, 'PortalBeat'), ...(PIVOTAL_FILLED[id] ? { ...PIVOTAL_FILLED[id], filled: true } : {}) })),
]

/** Slagning mot registret — O(n) över 97 rader, ingen indexering behövs vid denna storlek. */
export function getContentContractEntry(source: ContractSource, id: string): ContentContractEntry | undefined {
  return CONTENT_CONTRACT.find(e => e.source === source && e.id === id)
}
