import type { SaveGame, RippleChain, RippleChainStep } from '../entities/SaveGame'
import type { EventLedgerEntry, EventLedgerType, LedgerConsequence } from '../entities/Narrative'
import { describeRippleChain } from './rippleEffectService'

/**
 * MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md Fas 1 — orsak/verkan som
 * FÖRSTA rena liggarkonsumenten (DOM_ORSAK_VERKAN_SCOPING_2026-09-01.md
 * skrivs om av migreringsplanen: orsak/verkan ÄR liggarens första fönster,
 * inte en fristående feature). Ripple-motorn forkas INTE — samma
 * describeRippleChain (rippleEffectService.ts) som redan diffar de tre
 * systemtriggarna, bara ett nytt anropsställe: beslutsresolution
 * (eventResolver.ts har before/after redan där).
 *
 * Den tidigare transferbudspiloten `pilotTransferBidRippleChain` retirerades
 * 2026-09-03 efter parity-kontroll: samma before/after-diff och samma tre
 * utfall täcks här, medan bara liggaren har en levande konsument.
 */

const FIELD_BY_LABEL: Record<string, LedgerConsequence['field']> = {
  Stämningen: 'fanMood',
  Klacken: 'supporterMood',
  Orten: 'communityStanding',
  Styrelsen: 'boardPatience',
  Sponsorerna: 'sponsorNetworkMood',
  Kassan: 'finances',
  Transferbudget: 'transferBudget',
  Moralen: 'playerMorale',
}

/**
 * significance (0-100, samma skala som clubMemory/weights — se
 * clubMemoryEventBuilders.ts:s spridning 35-90) härledd ur kedjans egen
 * magnitud-skala: högsta stegets magnitud sätter basen, ett Styrelse-steg
 * lägger på ett tillägg — samma "Styrelsen väger tyngst" som
 * rippleChainSignificance (rippleEffectService.ts) redan kodar, uttryckt
 * på liggarens 0-100-skala i stället för den kedje-interna 0-13-poängen.
 */
const MAGNITUDE_SIGNIFICANCE: Record<RippleChainStep['magnitude'], number> = { knappt: 35, tydligt: 55, kraftigt: 75 }
const BOARD_INVOLVED_BONUS = 15

// Namnet är kvar från Fas 1 (beslutsspecifikt) men funktionen är generisk —
// MIGRATIONSPLAN_HANDELSELIGGAREN Fas 4+ (buildSystemRippleLedgerEntry nedan)
// återanvänder den rakt av för system-triggade kedjor. Samma "Styrelsen
// väger tyngst"-princip gäller oavsett vem som orsakade kedjan.
function decisionRippleSignificance(steps: RippleChainStep[]): number {
  const base = steps.reduce((max, s) => Math.max(max, MAGNITUDE_SIGNIFICANCE[s.magnitude]), 0)
  const boardBonus = steps.some(s => s.label === 'Styrelsen') ? BOARD_INVOLVED_BONUS : 0
  return Math.min(100, base + boardBonus)
}

function chainToConsequences(steps: RippleChainStep[]): LedgerConsequence[] {
  return steps.flatMap(s => {
    const field = FIELD_BY_LABEL[s.label]
    return field ? [{ field, dir: s.dir, magnitude: s.magnitude }] : []
  })
}

/**
 * Diffar before/after och bygger en EventLedgerEntry OM beslutet satte
 * igång minst ett andra-ordningens steg — "trivial-brus-golvet"
 * (DOM_ORSAK_VERKAN_SCOPING: "ingen kedja utan ett andra-ordningens steg").
 * Ett beslut som inte rör något av de ripple-bärande fälten alls
 * returnerar null, skriver ingen post — samma golv som en tom
 * describeRippleChain redan uttrycker (`steps` tom), bara namngivet här.
 *
 * `madeByPlayer` avgörs av ANROPAREN (samma HIGH 6-grind som
 * captureSystemDecision/narrativeBeatLog redan följer) — denna funktion
 * antar att den bara kallas för spelarfattade beslut.
 */
export function captureDecisionRipple(
  before: SaveGame,
  after: SaveGame,
  semanticKey: string,
  season: number,
  matchday: number,
  subjectPlayerId?: string,
  subjectClubId?: string,
): EventLedgerEntry | null {
  const chain = describeRippleChain(before, after, 'decision', undefined, matchday, season, subjectPlayerId)
  if (chain.steps.length === 0) return null

  const consequences = chainToConsequences(chain.steps)

  // Skärpning 2026-09-01 (Fas 2-vägval #2): polymorft subject, inte separata
  // id-fält. Fas 1:s generiska infångare känner bara player/club (event.
  // relatedPlayerId/relatedClubId) — 'mecenat' hör bara till A-H9:s
  // beslutsbyggare (seasonDecisionCaptureService.ts), aldrig hit.
  const subject: EventLedgerEntry['subject'] = subjectPlayerId
    ? { kind: 'player', id: subjectPlayerId }
    : subjectClubId
    ? { kind: 'club', id: subjectClubId }
    : undefined

  return {
    type: 'decision',
    semanticKey,
    season,
    matchday,
    subject,
    significance: decisionRippleSignificance(chain.steps),
    consequences,
    madeByPlayer: true,
  }
}

/**
 * MIGRATIONSPLAN_HANDELSELIGGAREN Fas 4+ (2026-09-02) — samma struktur→
 * liggarpost-omvandling som captureDecisionRipple, men för de tre
 * SYSTEMTRIGGARNA (star_injured/big_derby_win/mecenat_left) i stället för
 * spelarfattade beslut. `chain` är redan beräknad av anroparen
 * (describeRippleChain, roundProcessor.ts) — ingen andra before/after-diff
 * här, bara samma steps→consequences-mappning och samma trivial-brus-golv.
 *
 * `madeByPlayer` sätts ALDRIG (till skillnad från captureDecisionRipple) —
 * dessa tre är per definition systemhändelser, ingen spelare fattade beslutet.
 */
export function buildSystemRippleLedgerEntry(
  chain: RippleChain,
  type: EventLedgerType,
  subject?: EventLedgerEntry['subject'],
): EventLedgerEntry | null {
  if (chain.steps.length === 0) return null

  return {
    type,
    semanticKey: `ripple_${chain.trigger}_${subject?.id ?? 'na'}_${chain.season}_${chain.round}`,
    season: chain.season,
    matchday: chain.round,
    subject,
    significance: decisionRippleSignificance(chain.steps),
    consequences: chainToConsequences(chain.steps),
  }
}

/**
 * Läsvägen — orsak/verkan som liggarkonsument. Den senaste 'decision'-posten
 * för INNEVARANDE omgång: samma färskhetsmönster som portalBeats.ts:s
 * `pendingRippleChains[0].round === g.currentMatchday` (identitet via
 * season+matchday+type, inte en syntetisk id — se EventLedgerEntry:s
 * docstring för varför).
 */
export function getLatestDecisionConsequence(game: SaveGame, currentSeason: number, currentMatchday: number): EventLedgerEntry | undefined {
  return (game.eventLedger ?? [])
    .filter(e => e.type === 'decision' && e.season === currentSeason && e.matchday === currentMatchday)
    .at(-1)
}
