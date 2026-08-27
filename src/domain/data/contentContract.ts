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
 * TÄCKNINGSLÄGE (ärligt, inte optimistiskt, 2026-08-24): 96 rader (95 vid
 * O11:s ursprungsleverans, +1 `burnoutRelief` 2026-08-23), en per canonical
 * id ur de fyra källorna — registret är strukturellt komplett och
 * användbart som HÄNGSTABELL nu (test: contentContract.test.ts). 9 rader
 * har alla sex fälten ifyllda (`filled: true`) — spårade under detta och
 * tidigare pass i samma session (domens motiverande felfall, två pivotal
 * beats, O2-dominansrevisionens granskade val). Resten (87) är
 * `filled: false`, TODO-rader — antalet ratchet:as nu av
 * `scripts/content-contract-guard.ts` (kan inte öka, se ENFORCEMENT nedan).
 * Att fylla i alla 96 korrekt kräver att varje källa läses individuellt —
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
 *   den sparade baslinjen och failar bygget. Att fylla i fler av de 87
 *   befintliga TODO-raderna sänker antalet — informativt, ratchet kan då
 *   dras åt, precis som ds-guard.
 *
 * KOPPLING TILL D1 PUNKT 4 (Jacobs dom, 2026-08-21): "därför nu"-radens
 * getWhyNowLine() läser HÄRIFRÅN (per GameEventType-rad), inte från
 * event-instansen. Ingen av de nio nu ifyllda raderna bär whyNow-data PÅ
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

const GAME_EVENT_TYPE_IDS = [
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
  ...GAME_EVENT_TYPE_IDS.map(id => ({ ...basePlaceholder(id, 'GameEventType'), ...(FILLED[id] ? { ...FILLED[id], filled: true } : {}) })),
  ...STORYLINE_TYPE_IDS.map(id => basePlaceholder(id, 'StorylineType')),
  ...ARC_TYPE_IDS.map(id => basePlaceholder(id, 'ArcType')),
  ...PORTAL_BEAT_IDS_ALL.map(id => ({ ...basePlaceholder(id, 'PortalBeat'), ...(PIVOTAL_FILLED[id] ? { ...PIVOTAL_FILLED[id], filled: true } : {}) })),
]

/** Slagning mot registret — O(n) över 95 rader, ingen indexering behövs vid denna storlek. */
export function getContentContractEntry(source: ContractSource, id: string): ContentContractEntry | undefined {
  return CONTENT_CONTRACT.find(e => e.source === source && e.id === id)
}
