/**
 * O13 / M11 — TRÄNARMARKNADEN, textpool (DOM_TRANARMARKNADEN_2026-08-26.md).
 *
 * SVENSK TEXT LEVERERAD AV OPUS 2026-08-29. Tonen är bandysvensk
 * understatement — konkret bild framför sammanfattning, ingen tröst och ingen
 * hån (domen: "att hinna sitta med det"). Se
 * docs/WRITING_GUIDELINES_BANDY_MANAGER.md.
 *
 * CLAUDE.md, SVENSK TEXT — CODE SKRIVER ALDRIG: Code får skriva literalen
 * '[Opus]' som platshållare men aldrig egen svensk prosa. Filen är samlad på
 * ETT ställe (i stället för utspridd i CareerBreakScreen.tsx) så
 * textleveransen blir en fil att öppna.
 */

import type { CareerBreakReport, CareerBreakSeasonLine } from '../services/careerBreakService'
import { seasonSpanLabel } from '../utils/seasonYear'

// ── Steg 1: säsongen som spelades utan dig ─────────────────────────────────

/** Liten versal etikett över rubriken. Motsvarar "SPELETS SLUT" på Game Over. */
export const CAREER_BREAK_SEASON_EYEBROW = 'EFTER AVSKEDET'

/** Skärmens rubrik. Kort, versal, samma vikt som "DU HAR SPARKATS". */
export const CAREER_BREAK_SEASON_TITLE = 'LAGET SPELADE VIDARE'

/**
 * Ingressen: du satt hemma, någon annan tog över. Ett stycke, två-tre
 * meningar. Data: gamla klubbens namn, efterträdarens namn, hur många
 * säsonger som passerade.
 */
export function careerBreakSeasonIntro(report: CareerBreakReport): string {
  const span = report.seasonsSimulated === 1 ? 'En säsong' : `${report.seasonsSimulated} säsonger`
  return `Du satt hemma medan ${report.replacementCoachName} tog över ${report.formerClubName}. ${span} gick utan dig. Det här hände under tiden.`
}

/**
 * En rad per simulerad säsong: var gamla klubben slutade, och vem som vann.
 * Data: säsong, gamla klubbens placering, mästarklubbens namn (kan saknas).
 */
export function careerBreakSeasonLine(line: CareerBreakSeasonLine, report: CareerBreakReport): string {
  const tail = line.championClubName ? ` ${line.championClubName} vann.` : ''
  return `Säsong ${seasonSpanLabel(line.season)}: ${report.formerClubName} på plats ${line.formerClubPosition}.${tail}`
}

/**
 * Domen över uppehållet: gick det bättre eller sämre utan dig? Detta är
 * ögonblicket domen kallar "att hinna sitta med det" — meningen ska inte
 * trösta och inte håna. Data: placering under spelaren, bästa placering
 * under efterträdaren, `formerClubDidWorse`.
 */
export function careerBreakVerdict(report: CareerBreakReport): string {
  if (report.formerClubDidWorse) {
    return `${report.formerClubName} klarade sig sämre efter dig. Bäst blev plats ${report.bestPositionUnderReplacement}, mot din plats ${report.positionUnderPlayer} sista säsongen. Någon där inne vet vad de gjorde.`
  }
  return `${report.formerClubName} klarade sig bra ändå. Plats ${report.bestPositionUnderReplacement} under efterträdaren, mot din plats ${report.positionUnderPlayer}. Klubben gick vidare, som klubbar gör.`
}

/** Knappen som går vidare till frågan. Först här ställs den. */
export const CAREER_BREAK_CONTINUE_CTA = 'Se vad som väntar'

// ── Steg 2: tränarmarknaden ────────────────────────────────────────────────

export const CAREER_BREAK_MARKET_EYEBROW = 'TRÄNARMARKNADEN'
export const CAREER_BREAK_MARKET_TITLE = 'TOMMA STOLAR'

/**
 * Ingressen på marknadsskärmen. Data: antal erbjudanden (1–3). Tonen ska
 * skilja på ett samtal och tre — ett är en nåd, tre är en marknad.
 */
export function careerBreakMarketIntro(offerCount: number): string {
  if (offerCount <= 1) {
    return 'En klubb ringde. Bara en, men den räcker.'
  }
  if (offerCount === 2) {
    return 'Två klubbar ringde. Båda står utan tränare av samma skäl som du står utan klubb.'
  }
  return 'Tre klubbar ringde. Alla tre sparkade någon medan du satt hemma. Det är en marknad.'
}

/**
 * En rad under varje klubbkort: varför stolen är ledig. Data: klubbens
 * slutplacering, tränaren som fick gå, och om det är spelarens gamla klubb.
 */
export function careerOfferReason(offer: { lastPosition: number; departedCoachName: string; isFormerClub: boolean }): string {
  if (offer.isFormerClub) {
    return `Din gamla klubb. ${offer.departedCoachName || 'Efterträdaren'} tog över och gjorde det sämre. Plats ${offer.lastPosition}.`
  }
  const coach = offer.departedCoachName ? `${offer.departedCoachName} fick gå.` : 'Tränaren fick gå.'
  return `Plats ${offer.lastPosition}. ${coach}`
}

/**
 * Klubbens egen pitch, en rad på klubbkortet. Domen: inte en jobbmarknad,
 * ingen förhandling — en klubb som misslyckats som ändå ringer. Rösten är
 * ärlig och lågmäld, aldrig en glansig säljbroschyr. Data: om det är gamla
 * klubben, och klubbens rykte (låg = ödmjukare pitch).
 */
export function careerOfferPitch(offer: { isFormerClub: boolean; reputation: number }): string {
  if (offer.isFormerClub) {
    return 'Vi borde inte behöva ringa dig. Vi gör det ändå. Kom hem och laga det du byggde.'
  }
  if (offer.reputation < 45) {
    return 'Klubben har inte mycket att komma med. En stol, en trupp och en styrelse som vill se laget rätat upp. Räcker det?'
  }
  return 'Klubben har sett bättre år. Stolen är din om du vill ha den, vi lovar inget mer än så.'
}

/** Märkning på den gamla klubbens kort (domens skärpning 2). */
export const CAREER_BREAK_FORMER_CLUB_BADGE = 'DIN GAMLA KLUBB'

/** Knapptexten på ett klubbkort. */
export const CAREER_BREAK_ACCEPT_CTA = 'Ta stolen'

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
export const CAREER_BREAK_NO_CALL_BODY = 'Ingen klubb har en stol åt dig. En tränarmarknad utan botten är ingen marknad, och den här nådde sin botten. Härifrån finns bara en ny början, någon annanstans.'

/** Knappen till en helt ny karriär, den enda vägen vidare härifrån. */
export const CAREER_BREAK_NEW_CAREER_CTA = 'Börja om'

// ── Game Over: den nya, tredje vägen ───────────────────────────────────────

/**
 * Knappen på Game Over-skärmen som startar uppehållet. Den ska INTE lova ett
 * jobb — den lovar bara att säsongen spelas. Frågan kommer efteråt.
 */
export const CAREER_BREAK_START_CTA = 'Se hur det går utan dig'
