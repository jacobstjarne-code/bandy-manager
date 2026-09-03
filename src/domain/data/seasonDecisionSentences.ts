/**
 * seasonDecisionSentences — HIGH 6 (auditen
 * `docs/incoming/BANDY_MANAGER_AUDIT_5_SASONGER_KUL_STICKINESS_VISUELL_2026-08-29.md`):
 * årsbokens "säsongens viktigaste beslut" gav `Inget beslut stack ut i vintras.`
 * två säsonger i rad trots att spelaren fattat heltidskontrakt, kaptensmöte,
 * värmestugebygge och mecenatkonflikt. Rangordningen (pickSeasonDecision) var
 * inte felet — kandidatmängden var det: bara åtta (event.type, choiceId)-par
 * hade en mening att skriva, och `seasonDecisionCaptureService.ts`:s egen
 * filhuvud pekade ut exakt den begränsningen ("en äkta vidgning bortom dessa
 * åtta ... kräver nya låsta meningsmallar innan fler par kan bli kandidater").
 *
 * Detta är de nya meningsmallarna. Tre nya kandidatkällor är byggda och wirade:
 *   1. mecenatEvent/side_mec1 + side_mec2  — att välja sida i en personkonflikt
 *   2. captainSpeech/take_charge + support — kaptensmötet, namngiven person
 *   3. anläggningsbygge (facilityState)    — utanför GameEvent, egen infångare
 *
 * ⚠️ TEXTEN ÄR OPUS. Code skriver aldrig svensk speltext (CLAUDE.md, hård
 * regel). Datainhämtningen, verifieringen mot speltillståndet och
 * interpolationen nedan är färdigwirade — men MALLARNA ÄR TOMMA. Med tom mall
 * returnerar getters nedan `null`, och byggaren i
 * seasonDecisionCaptureService.ts returnerar då `null` istället för en kandidat
 * med tom mening. Det är den bärande invarianten: en tom mening får ALDRIG
 * skrivas till händelseliggaren, för då kan pickSeasonDecisionFromLedger välja
 * den och årsboken renderar en blank rad — sämre än att falla tillbaka på
 * SEASON_DECISION_NONE_TEXT. Testet
 * `seasonDecisionCaptureService.test.ts` → "tom mall ⇒ ingen kandidat" bevakar
 * det, och `sentenceFor*`-funktionerna nedan är exporterade separat så att
 * meningsbygget kan testas mot en injicerad mall utan att mallen fylls här.
 *
 * Opus fyller de fyra konstanterna nedan. Tokens som redan är wirade och
 * garanterat ifyllda vid anropet:
 *
 *   MECENAT_CONFLICT_SIDE  {backed}   mecenaten du ställde dig bakom (+15)
 *                          {other}    mecenaten som fick stå tillbaka (−10)
 *   CAPTAIN_TAKE_CHARGE    {captain}  kaptenens fulla namn
 *                          {last}     kaptenens efternamn
 *   CAPTAIN_SUPPORT        {captain}  kaptenens fulla namn
 *                          {last}     kaptenens efternamn
 *   FACILITY_BUILD         {facility} nodens etikett ur FACILITY_NODE_DEFS
 *                                     ("Värmestuga", "Läktare — östra", …)
 *                          {cost}     vad klubben faktiskt drog ur kassan,
 *                                     färdigformaterat ("120 tkr")
 *
 * Formregeln (Jacobs dom, se seasonDecisionCaptureService.ts:s filhuvud):
 * Form 1 (påtvingat — något tvingade fram händelsen) nämner ALDRIG vinsten,
 * bara kostnaden. Form 2 (sökt — ett bud, ett erbjudande, en möjlighet) nämner
 * BÅDA. Formklassning för de fyra nya:
 *   - MECENAT_CONFLICT_SIDE : form 1 (konflikten kom till dig, du valde bort en)
 *   - CAPTAIN_TAKE_CHARGE   : form 1 (kaptenen bad, du sa nej och tog priset)
 *   - CAPTAIN_SUPPORT       : form 2 (laget vann något, styrelsen förlorade)
 *   - FACILITY_BUILD        : form 2 (du sökte upp bygget, det gav och tog)
 */

import { formatValue } from '../format'

// ── Tokens ────────────────────────────────────────────────────────────────

export interface MecenatConflictSideTokens {
  /** Mecenaten du ställde dig bakom. */
  backed: string
  /** Mecenaten som fick stå tillbaka. */
  other: string
}

export interface CaptainSpeechTokens {
  /** Kaptenens fulla namn. */
  captain: string
  /** Kaptenens efternamn — för den kortare varianten i samma mening. */
  last: string
}

export interface FacilityBuildTokens {
  /** Nodens etikett, ordagrant ur FACILITY_NODE_DEFS (ingen ny prosa). */
  facility: string
  /** Vad klubben drog ur kassan, färdigformaterat ("120 tkr"). */
  cost: string
}

/** Bygger facility-tokens ur nodetikett + faktiskt debiterat belopp. */
export function buildFacilityBuildTokens(label: string, clubCostKr: number): FacilityBuildTokens {
  return { facility: label, cost: formatValue(clubCostKr) }
}

// ── A-H9:s ursprungliga åtta (MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md
// Fas 2) — flyttade hit ORDAGRANT ur seasonDecisionCaptureService.ts:s
// builders, som tidigare interpolerade dem inline. Ingen ny text — samma
// meningar, bara i mallformen de fyra HIGH 6-mallarna ovan redan använder,
// så årsboksvyn kan komponera dem ur en EventLedgerEntry i stället för
// gameBefore/gameAfter. Se seasonDecisionLedgerView.ts för anropsstället.

export interface NamedPersonTokens {
  /** Spelarens/mecenatens fulla namn, exakt som candidate.namedPerson bar. */
  name: string
}

export interface SellStarTokens extends NamedPersonTokens {
  /** positionDefinite(player.position) — redan färdigformaterad. */
  position: string
}

export interface AmountOnlyTokens {
  /** Färdigformaterat belopp ("350 tkr"). */
  amount: string
}

export interface NamedPersonAndAmountTokens extends NamedPersonTokens, AmountOnlyTokens {}

export interface OfferProSingleTokens {
  /** Bara efternamnet — samma som originalets confirmedPlayers[0].lastName. */
  lastName: string
  amount: string
}

const SELL_STAR = 'Du sålde {name}. Det kostade er {position}.'
const ASK_MECENAT = 'Du bad {name} om hjälp. Det kostade er hans förtroende.'
const TAKE_LOAN = 'Du tog lånet. Det kostade er varje månad sedan dess.'
const OFFER_PRO_SINGLE = 'Du gav {lastName} heltidskontrakt. Det kostade {amount} i året.'
const OFFER_PRO_MULTI = 'Du gav de varslade heltidskontrakt. Det kostade {amount} i året.'
const DET_OMOJLIGA_VALET_SELL = 'Du sålde {name} innan han hunnit spela klart. Det kostade er akademins bästa år.'
const DET_OMOJLIGA_VALET_KEEP = 'Du lät det vara. {name} spelar kvar.'
const TRANSFER_BID_ACCEPT = 'Du tog budet på {name}. Det gav {amount}, och tog {name}.'
const MECENAT_OFFER_TRIBUTE = 'Du tackade av {name} som han förtjänade. Det gav ett avsked ingen glömmer, och tog 25 tkr.'

export function sentenceForSellStar(template: string, t: SellStarTokens): string | null {
  return fill(template, { name: t.name, position: t.position })
}
export function getSellStarSentence(t: SellStarTokens): string | null {
  return sentenceForSellStar(SELL_STAR, t)
}

export function sentenceForAskMecenat(template: string, t: NamedPersonTokens): string | null {
  return fill(template, { name: t.name })
}
export function getAskMecenatSentence(t: NamedPersonTokens): string | null {
  return sentenceForAskMecenat(ASK_MECENAT, t)
}

export function sentenceForTakeLoan(template: string): string | null {
  return fill(template, {})
}
export function getTakeLoanSentence(): string | null {
  return sentenceForTakeLoan(TAKE_LOAN)
}

export function sentenceForOfferProSingle(template: string, t: OfferProSingleTokens): string | null {
  return fill(template, { lastName: t.lastName, amount: t.amount })
}
export function getOfferProSingleSentence(t: OfferProSingleTokens): string | null {
  return sentenceForOfferProSingle(OFFER_PRO_SINGLE, t)
}

export function sentenceForOfferProMulti(template: string, t: AmountOnlyTokens): string | null {
  return fill(template, { amount: t.amount })
}
export function getOfferProMultiSentence(t: AmountOnlyTokens): string | null {
  return sentenceForOfferProMulti(OFFER_PRO_MULTI, t)
}

export function sentenceForDetOmojligaValetSell(template: string, t: NamedPersonTokens): string | null {
  return fill(template, { name: t.name })
}
export function getDetOmojligaValetSellSentence(t: NamedPersonTokens): string | null {
  return sentenceForDetOmojligaValetSell(DET_OMOJLIGA_VALET_SELL, t)
}

export function sentenceForDetOmojligaValetKeep(template: string, t: NamedPersonTokens): string | null {
  return fill(template, { name: t.name })
}
export function getDetOmojligaValetKeepSentence(t: NamedPersonTokens): string | null {
  return sentenceForDetOmojligaValetKeep(DET_OMOJLIGA_VALET_KEEP, t)
}

export function sentenceForTransferBidAccept(template: string, t: NamedPersonAndAmountTokens): string | null {
  return fill(template, { name: t.name, amount: t.amount })
}
export function getTransferBidAcceptSentence(t: NamedPersonAndAmountTokens): string | null {
  return sentenceForTransferBidAccept(TRANSFER_BID_ACCEPT, t)
}

export function sentenceForMecenatOfferTribute(template: string, t: NamedPersonTokens): string | null {
  return fill(template, { name: t.name })
}
export function getMecenatOfferTributeSentence(t: NamedPersonTokens): string | null {
  return sentenceForMecenatOfferTribute(MECENAT_OFFER_TRIBUTE, t)
}

/**
 * HIGH 1 (DOM_HIGH1_BURNOUT_LEDGER_2026-09-02): composer-strukturen för
 * burnout-takets två val. Opus ordagranna meningar levererades 2026-09-02;
 * samma `fill`-väg används som för övriga beslut.
 */
export function sentenceForBurnoutCeiling(template: string): string | null {
  return fill(template, {})
}

export function getBurnoutCeilingStepBackSentence(): string | null {
  return sentenceForBurnoutCeiling(BURNOUT_CEILING_STEP_BACK)
}

export function getBurnoutCeilingPushThroughSentence(): string | null {
  return sentenceForBurnoutCeiling(BURNOUT_CEILING_PUSH_THROUGH)
}

// ── Interpolation ─────────────────────────────────────────────────────────

/**
 * Fyller {token}-platshållare. Returnerar `null` för tom mall — det är
 * signalen byggarna i seasonDecisionCaptureService.ts läser för att helt låta
 * bli att skapa en kandidat. Aldrig '' (en tom sträng är en giltig mening för
 * pickSeasonDecision och skulle renderas som en blank rad i årsboken).
 */
function fill(template: string, tokens: Record<string, string>): string | null {
  if (!template) return null
  let out = template
  for (const [key, value] of Object.entries(tokens)) {
    out = out.split(`{${key}}`).join(value)
  }
  return out
}

// ── Mallar — Opus levererar. ALDRIG en placeholder-mening. ─────────────────

const MECENAT_CONFLICT_SIDE = 'Du valde {backed}s sida när mecenaterna drabbade samman. {other} glömmer inte vem du släppte.'
const CAPTAIN_TAKE_CHARGE = '{captain} bad om att få ta kommandot i krisen. Du tog det själv, och {last} kände av det.'
const CAPTAIN_SUPPORT = 'Du ställde dig bakom {captain} inför laget. Omklädningsrummet slöt sig, men styrelsen noterade att du valde {last} före dem.'
const FACILITY_BUILD = '{facility} stod klar. Den kostade {cost} ur kassan, men blir kvar längre än de flesta beslut.'
const BURNOUT_CEILING_STEP_BACK = 'Du klev tillbaka en period när det tog för hårt. Första gången du valde dig själv.'
const BURNOUT_CEILING_PUSH_THROUGH = 'Du körde vidare fast kroppen sa ifrån. Det satte sina spår.'

// ── Meningsbyggare (mall injicerbar för test) ─────────────────────────────
// `sentenceFor*` tar mallen som parameter så att interpolationslogiken kan
// testas mot en injicerad mall oberoende av prosan. `get*Sentence` är
// produktionsvägen och läser den låsta, levererade konstanten.

export function sentenceForMecenatConflictSide(template: string, t: MecenatConflictSideTokens): string | null {
  return fill(template, { backed: t.backed, other: t.other })
}

export function getMecenatConflictSideSentence(t: MecenatConflictSideTokens): string | null {
  return sentenceForMecenatConflictSide(MECENAT_CONFLICT_SIDE, t)
}

export function sentenceForCaptainTakeCharge(template: string, t: CaptainSpeechTokens): string | null {
  return fill(template, { captain: t.captain, last: t.last })
}

export function getCaptainTakeChargeSentence(t: CaptainSpeechTokens): string | null {
  return sentenceForCaptainTakeCharge(CAPTAIN_TAKE_CHARGE, t)
}

export function sentenceForCaptainSupport(template: string, t: CaptainSpeechTokens): string | null {
  return sentenceForCaptainTakeCharge(template, t) // samma tokenuppsättning
}

export function getCaptainSupportSentence(t: CaptainSpeechTokens): string | null {
  return sentenceForCaptainSupport(CAPTAIN_SUPPORT, t)
}

export function sentenceForFacilityBuild(template: string, t: FacilityBuildTokens): string | null {
  return fill(template, { facility: t.facility, cost: t.cost })
}

export function getFacilityBuildSentence(t: FacilityBuildTokens): string | null {
  return sentenceForFacilityBuild(FACILITY_BUILD, t)
}
