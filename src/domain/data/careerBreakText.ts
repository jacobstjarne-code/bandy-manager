/**
 * O13 / M11 — TRÄNARMARKNADEN, textpool (DOM_TRANARMARKNADEN_2026-08-26.md).
 *
 * ⚠️ ALL SPELARTEXT I DEN HÄR FILEN ÄR PLATSHÅLLARE OCH VÄNTAR PÅ OPUS.
 *
 * CLAUDE.md, SVENSK TEXT — CODE SKRIVER ALDRIG: Code får skriva literalen
 * '[Opus]' som platshållare men aldrig egen svensk prosa. Filen är samlad på
 * ETT ställe (i stället för utspridd i CareerBreakScreen.tsx) så
 * textleveransen blir en fil att öppna, och så platshållargrinden
 * (tests/grind/opusPlaceholderGate.ts) har en enda rad att ta bort när
 * texten är levererad.
 *
 * Varje export nedan har en docstring som säger VAD meningen ska göra och
 * VILKEN data den får. Tonen är bandysvensk understatement — konkret bild
 * framför sammanfattning (se docs/WRITING_GUIDELINES_BANDY_MANAGER.md).
 *
 * ENDA UNDANTAGET: `CAREER_BREAK_NO_CALL_TITLE` nedan är inte Code-skriven.
 * Den är citerad ORDAGRANT ur domen (rad 46: "Ingen ringde den här gången.")
 * och är därför Jacobs egen text, inte en platshållare.
 */

import type { CareerBreakReport, CareerBreakSeasonLine, CareerOffer } from '../services/careerBreakService'

// ── Steg 1: säsongen som spelades utan dig ─────────────────────────────────

/** Liten versal etikett över rubriken. Motsvarar "SPELETS SLUT" på Game Over. */
export const CAREER_BREAK_SEASON_EYEBROW = '[Opus]'

/** Skärmens rubrik. Kort, versal, samma vikt som "DU HAR SPARKATS". */
export const CAREER_BREAK_SEASON_TITLE = '[Opus]'

/**
 * Ingressen: du satt hemma, någon annan tog över. Ett stycke, två-tre
 * meningar. Data: gamla klubbens namn, efterträdarens namn, hur många
 * säsonger som passerade.
 */
export function careerBreakSeasonIntro(_report: CareerBreakReport): string {
  return '[Opus]'
}

/**
 * En rad per simulerad säsong: var gamla klubben slutade, och vem som vann.
 * Data: säsong, gamla klubbens placering, mästarklubbens namn (kan saknas).
 */
export function careerBreakSeasonLine(_line: CareerBreakSeasonLine, _report: CareerBreakReport): string {
  return '[Opus]'
}

/**
 * Domen över uppehållet: gick det bättre eller sämre utan dig? Detta är
 * ögonblicket domen kallar "att hinna sitta med det" — meningen ska inte
 * trösta och inte håna. Data: placering under spelaren, bästa placering
 * under efterträdaren, `formerClubDidWorse`.
 */
export function careerBreakVerdict(_report: CareerBreakReport): string {
  return '[Opus]'
}

/** Knappen som går vidare till frågan. Först här ställs den. */
export const CAREER_BREAK_CONTINUE_CTA = '[Opus]'

// ── Steg 2: tränarmarknaden ────────────────────────────────────────────────

export const CAREER_BREAK_MARKET_EYEBROW = '[Opus]'
export const CAREER_BREAK_MARKET_TITLE = '[Opus]'

/**
 * Ingressen på marknadsskärmen. Data: antal erbjudanden (1–3). Tonen ska
 * skilja på ett samtal och tre — ett är en nåd, tre är en marknad.
 */
export function careerBreakMarketIntro(_offerCount: number): string {
  return '[Opus]'
}

/**
 * En rad under varje klubbkort: varför stolen är ledig. Data: klubbens
 * slutplacering, tränaren som fick gå, och om det är spelarens gamla klubb.
 */
export function careerOfferReason(_offer: CareerOffer): string {
  return '[Opus]'
}

/** Märkning på den gamla klubbens kort (domens skärpning 2). */
export const CAREER_BREAK_FORMER_CLUB_BADGE = '[Opus]'

/** Knapptexten på ett klubbkort. */
export const CAREER_BREAK_ACCEPT_CTA = '[Opus]'

// ── Steg 2b: ingen ringde (skärpning 3) ────────────────────────────────────

/**
 * ORDAGRANT UR DOMEN (DOM_TRANARMARKNADEN_2026-08-26.md rad 46) — Jacobs
 * egen text, inte en platshållare. Ändras inte utan ny dom.
 */
export const CAREER_BREAK_NO_CALL_TITLE = 'Ingen ringde den här gången.'

/**
 * Ett stycke under rubriken ovan. Ska säga att det är slut utan att be om
 * ursäkt för det — "En tränarmarknad utan botten är ingen marknad."
 */
export const CAREER_BREAK_NO_CALL_BODY = '[Opus]'

/** Knappen till en helt ny karriär, den enda vägen vidare härifrån. */
export const CAREER_BREAK_NEW_CAREER_CTA = '[Opus]'

// ── Game Over: den nya, tredje vägen ───────────────────────────────────────

/**
 * Knappen på Game Over-skärmen som startar uppehållet. Den ska INTE lova ett
 * jobb — den lovar bara att säsongen spelas. Frågan kommer efteråt.
 */
export const CAREER_BREAK_START_CTA = '[Opus]'
