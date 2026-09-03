/**
 * communityRenewalText — ANSPRÅK 4, spak 3 (nyhetstretmillen),
 * `docs/DOM_ANSPAK4_TREDJE_SPAK_NYHET_2026-08-29.md`.
 *
 * Domen, §Mekanik: "Spelaren SER 'supportrarna tröttnar på X — förnya för Y kr?'
 * och VÄLJER. Aldrig en tyst post från kassan."
 *
 * ⚠️ TEXTEN ÄR OPUS. Code skriver aldrig svensk speltext (CLAUDE.md, hård
 * regel). Mekaniken är byggd och mätt (communityRenewalService.ts,
 * communityStandingScaling.ts), och interpolationen nedan är färdigwirad — men
 * mallarna är TOMMA. Med tom mall renderar kortet ingen text alls; det är
 * avsiktligt (hellre en synlig lucka i 24h än fel ton permanent i kodbasen).
 *
 * Opus fyller: TITLE, BODY, RENEW_LABEL, DECLINE_LABEL nedan. Tokens som redan
 * är wirade och räknade av buildRenewalTokens():
 *   {activity}   aktivitetens namn i ortsvyn ("Kiosken", "Skolbesök", …)
 *   {cost}       nyhetsinvesteringens pris, färdigformaterat ("75 tkr")
 *   {seasons}    antal säsonger aktiviteten varit klubbens stående erbjudande
 *   {wear}       hur mycket av effekten som är kvar, i procent ("71 %")
 *
 * Namnen i ACTIVITY_LABEL nedan är INTE ny prosa — de är ordagrant de etiketter
 * ytan redan visar (OrtenTab.tsx / EkonomiTab.tsx), återanvända så kortet och
 * fliken säger samma ord om samma sak.
 */

import type { StaleableActivityKey } from '../entities/Community'

/** Aktivitetsnamn — ordagrant från OrtenTab.tsx/EkonomiTab.tsx, ingen ny text. */
export const ACTIVITY_LABEL: Record<StaleableActivityKey, string> = {
  kiosk: 'Bandykiosken',
  lottery: 'Föreningslotteriet',
  bandySchoolBasic: 'Bandyskola för barn',
  bandyplay: 'Bandyplay',
  functionaries: 'Funktionärer',
  bandySchool: 'Bandyskola',
  socialMedia: 'Sociala medier',
  pensionarskaffe: 'Pensionärskaffe',
  soppkvall: 'Soppkväll med laget',
  skolbesok: 'Skolbesök',
}

export interface CommunityRenewalTokens {
  activity: string
  /** Färdigformaterat pris, t.ex. "75 tkr". */
  cost: string
  seasons: number
  /** 'säsong' (1) / 'säsonger' (fler) — böjs så "{seasons} {seasonWord}" aldrig blir "1 säsonger". */
  seasonWord: string
  /** Kvarvarande effekt i procent, t.ex. "71 %". */
  wear: string
}

export function buildRenewalTokens(
  key: StaleableActivityKey,
  costKr: number,
  seasonsActive: number,
  stalenessMultiplier: number,
): CommunityRenewalTokens {
  return {
    activity: ACTIVITY_LABEL[key],
    cost: `${Math.round(costKr / 1000)} tkr`,
    seasons: seasonsActive,
    seasonWord: seasonsActive === 1 ? 'säsong' : 'säsonger',
    wear: `${Math.round(stalenessMultiplier * 100)} %`,
  }
}

function fill(template: string, t: CommunityRenewalTokens): string {
  if (!template) return ''
  return template
    .replace(/\{activity\}/g, t.activity)
    .replace(/\{cost\}/g, t.cost)
    .replace(/\{seasons\}/g, String(t.seasons))
    .replace(/\{seasonWord\}/g, t.seasonWord)
    .replace(/\{wear\}/g, t.wear)
}

// Opus levererar 2026-08-31.
const TITLE = 'Supportrarna tröttnar på {activity}'
const BODY = 'Orten har sett {activity} i {seasons} {seasonWord}. Nyhetens behag har lagt sig — {wear} av dragningskraften finns kvar. En nysatsning väcker liv i det igen, men kostar {cost}.'
const RENEW_LABEL = 'Satsa på nytt ({cost})'
const DECLINE_LABEL = 'Låt det bero'

export function getRenewalTitle(t: CommunityRenewalTokens): string {
  return fill(TITLE, t)
}

export function getRenewalBody(t: CommunityRenewalTokens): string {
  return fill(BODY, t)
}

export function getRenewalChoiceLabel(t: CommunityRenewalTokens): string {
  return fill(RENEW_LABEL, t)
}

export function getDeclineChoiceLabel(t: CommunityRenewalTokens): string {
  return fill(DECLINE_LABEL, t)
}
