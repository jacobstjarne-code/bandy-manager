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

// ── Pengar (regel 11: tkr heltal, lön tkr/mån heltal, aldrig kronprecision) ──

/** Marknadsvärde: "1.2 mkr" / "450 tkr". Sub-tkr visas i kr (sällsynt). */
export function formatValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mkr`
  if (v >= 1_000) return `${Math.round(v / 1_000)} tkr`
  return `${v} kr`
}

/** Månadslön: heltal tkr, "15 tkr/mån". Aldrig "15 678 kr/mån". */
export function formatSalary(n: number): string {
  return `${Math.round(n / 1000)} tkr/mån`
}
