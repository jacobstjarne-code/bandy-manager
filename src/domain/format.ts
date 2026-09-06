/**
 * format.ts — kanoniska, rena presentationsprimitiver (positions­etiketter + pengar).
 *
 * VARFÖR DOMAIN OCH INTE presentation/utils: både domänen (rumorService,
 * eventFactories) och presentationslagret behöver dessa. Domänen får ALDRIG
 * importera från presentation, så enda stället en ENDA sanning kan bo som
 * båda lagren delar är här. `presentation/utils/formatters.ts` re-exporterar
 * dessa så befintliga import-ställen är oförändrade.
 *
 * Tre strata fanns tidigare (MV/B/YH/MF/A vs MV/B/YH/MF/FW vs Målvakt/Back/…
 * i 3 lokala kopior + en trasig prosa-variant). Detta är nu enda källan.
 */

import { PlayerPosition } from './enums'
import { seasonSpanLabel } from './utils/seasonYear'

// ── Positionsetiketter ───────────────────────────────────────────────
// Kort: scoreboard, pills, tabeller. Lång: kort, formulär, prosa.
// Kanon (CLAUDE.md): MV/B/YH/MF/A.

const POSITION_SHORT: Record<PlayerPosition, string> = {
  [PlayerPosition.Goalkeeper]: 'MV',
  [PlayerPosition.Defender]: 'B',
  [PlayerPosition.Half]: 'YH',
  [PlayerPosition.Midfielder]: 'MF',
  [PlayerPosition.Forward]: 'A',
}

const POSITION_LONG: Record<PlayerPosition, string> = {
  [PlayerPosition.Goalkeeper]: 'Målvakt',
  [PlayerPosition.Defender]: 'Back',
  [PlayerPosition.Half]: 'Ytterhalv',
  [PlayerPosition.Midfielder]: 'Mittfältare',
  [PlayerPosition.Forward]: 'Anfallare',
}

export function positionShort(pos: PlayerPosition): string {
  return POSITION_SHORT[pos] ?? pos
}

export function positionLong(pos: PlayerPosition): string {
  return POSITION_LONG[pos] ?? pos
}

// O18 fält 2 (SASONGENS_BESLUT, Jacobs dom 2026-08-24): sell_star-radens
// {position}-ord, bestämd form, kolloquiala bandytermer — INTE POSITION_LONG
// (som ger "Anfallare"/"Ytterhalv", formella etiketter för kort/tabeller).
// Jacobs egna ord, ordagrant: "mittfältaren, backen, forwarden, halvan".
const POSITION_DEFINITE: Record<PlayerPosition, string> = {
  [PlayerPosition.Goalkeeper]: 'målvakten',
  [PlayerPosition.Defender]: 'backen',
  [PlayerPosition.Half]: 'halvan',
  [PlayerPosition.Midfielder]: 'mittfältaren',
  [PlayerPosition.Forward]: 'forwarden',
}

export function positionDefinite(pos: PlayerPosition): string {
  return POSITION_DEFINITE[pos] ?? pos
}

// ── Pengar (regel 11: tkr heltal, lön tkr/mån heltal, aldrig kronprecision) ──

/** Marknadsvärde: "1,2 mkr" / "450 tkr". Sub-tkr visas i kr (sällsynt). */
export function formatValue(v: number): string {
  if (v >= 1_000_000) return `${formatDecimalComma(v / 1_000_000)} mkr`
  if (v >= 1_000) return `${Math.round(v / 1_000)} tkr`
  return `${v} kr`
}

/** Månadslön: heltal tkr, "15 tkr/mån". Aldrig "15 678 kr/mån". */
export function formatSalary(n: number): string {
  return `${Math.round(n / 1000)} tkr/mån`
}

// ── Decimaltal (M46, textaudit 2026-07-04) ──────────────────────────
// toFixed(1) ger punktdecimal ("8.2") — svensk speltext ska ha kommatecken.
// Kanonisk källa så samma fel inte upprepas fil för fil.

export function formatDecimalComma(n: number): string {
  return n.toFixed(1).replace('.', ',')
}

/** Matchbetyg: "8,2". */
export function formatRating(rating: number): string {
  return formatDecimalComma(rating)
}

// ── Kontraktskronologi (SEXSÄSONGSAUDITEN 2026-08-26, SPÅR 2a) ──────────────
// `contractUntilSeason` är den SISTA säsongen kontraktet gäller (inklusive) —
// samma säsongstal som `game.currentSeason` (kalenderår, se createNewGame.ts
// — säsong 2026 osv), INGET offset. `contractUntilSeason === currentSeason`
// betyder "gäller ut den här säsongen" (fortfarande giltigt, sista året).
// `contractUntilSeason < currentSeason` för en aktiv spelare (kvar på en
// klubb, inte fri agent) är ett trasigt tillstånd — se
// gameInvariants.ts:checkStaleContracts.
//
// Innan denna formatterare fanns minst tre skilda presentationer av samma
// tal: PlayerCard.tsx adderade +1 (bugg — visade fel årtal), ContractsTab.tsx
// och RenewContractModal.tsx visade rått tal med olika ordval ("t.o.m. 2028"
// vs "t.o.m. säsong 2028"), och eventFactories.ts räknade "N säsong(er) kvar"
// separat med egen `-`-uträkning. Detta är nu enda källan för båda formerna.

/** "t.o.m. säsong 2028/29" — kanonisk text för kontraktets sista säsong. Bandyårs-span, inget offset. */
export function formatContractUntil(contractUntilSeason: number): string {
  // B1 (Designgranskning fresh-eyes 2026-09-03, blockerare): "t.o.m. säsong
  // undefined" läckte till spelaren i PlayerCard.tsx + RenewContractModal.tsx
  // när contractUntilSeason av någon anledning var undefined/NaN vid render
  // (typen lovar number, men en trasig datakoppling kan ändå skicka in
  // fel värde) — guard här stänger hela klassen på källan i stället för
  // patch per anropsställe.
  if (!Number.isFinite(contractUntilSeason)) return 'kontraktstid saknas'
  // design-d2 (sluttest-narrative-truth-grind R1, 2026-09-06): en absolut
  // säsongsreferens visas som bandyårs-span (seasonSpanLabel), aldrig ett
  // naket kalenderår — samma kanon GameHeader/HistoryScreen/ChampionScreen
  // redan följer.
  return `t.o.m. säsong ${seasonSpanLabel(contractUntilSeason)}`
}

/** Säsonger kvar på kontraktet. 0 = sista/innevarande säsongen. Negativt = redan utgånget (invariant-brott för en aktiv spelare). */
export function contractSeasonsRemaining(contractUntilSeason: number, currentSeason: number): number {
  return contractUntilSeason - currentSeason
}

/** "2 säsonger kvar" / "1 säsong kvar" / "Sista säsongen" / "Kontrakt utgånget" — kanonisk kvar-text. */
export function formatContractRemaining(contractUntilSeason: number, currentSeason: number): string {
  const remaining = contractSeasonsRemaining(contractUntilSeason, currentSeason)
  if (remaining < 0) return 'Kontrakt utgånget'
  if (remaining === 0) return 'Sista säsongen'
  if (remaining === 1) return '1 säsong kvar'
  return `${remaining} säsonger kvar`
}

/**
 * "1 vecka" / "4 veckor" — kanonisk veckoform, samma böjningsdisciplin som
 * formatContractRemaining. Skrevs 2026-08-31 för audit-fyndet "4 veckor":
 * "4 veckor" var korrekt svenska, felet var SINGULAR-fallet — PlayerCard
 * renderade "1 veckor kvar" för en skada med 1–7 dagar kvar.
 * Mönstret fanns redan inline i inboxService.ts:285 — här blir det ett ställe.
 */
export function formatWeeks(weeks: number): string {
  return weeks === 1 ? '1 vecka' : `${weeks} veckor`
}
