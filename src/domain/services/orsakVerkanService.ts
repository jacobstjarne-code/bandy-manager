import type { SaveGame, RippleChainStep } from '../entities/SaveGame'
import type { EventLedgerEntry, LedgerConsequence } from '../entities/Narrative'
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
 * "Ingen gammalt fält att retirera — den föds ren" (migreringsplanen).
 * pilotTransferBidRippleChain (SaveGame.ts, ÖVERLÄMNING 2 steg 1-pilot)
 * rörs INTE av detta — det är en smalare, transferbuds-specifik pilot som
 * lever kvar oförändrad parallellt, inte en föregångare den här filen
 * ersätter.
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

function decisionRippleSignificance(steps: RippleChainStep[]): number {
  const base = steps.reduce((max, s) => Math.max(max, MAGNITUDE_SIGNIFICANCE[s.magnitude]), 0)
  const boardBonus = steps.some(s => s.label === 'Styrelsen') ? BOARD_INVOLVED_BONUS : 0
  return Math.min(100, base + boardBonus)
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

  const consequences: LedgerConsequence[] = chain.steps.flatMap(s => {
    const field = FIELD_BY_LABEL[s.label]
    return field ? [{ field, dir: s.dir, magnitude: s.magnitude }] : []
  })

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
