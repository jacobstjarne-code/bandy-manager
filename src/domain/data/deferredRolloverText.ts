/**
 * deferredRolloverText — HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md),
 * §"Rollover — aldrig tyst".
 *
 * Domen: varje obesvarat beslut som ligger kvar i `deferredDecisions` vid
 * säsongsbytet får ANTINGEN ett dokumenterat default-utfall ("X löstes av sig
 * självt: [utfall]") ELLER en uttrycklig utrinning ("X hann aldrig behandlas
 * och rann ut"). Raden är alltid EN inboxpost, aldrig noll.
 *
 * ⚠️ TEXTEN ÄR OPUS. Code skriver aldrig svensk speltext (CLAUDE.md, hård
 * regel). Strukturen nedan är färdigwirad — interpolationen har allt den
 * behöver (eventets titel, det valda alternativets etikett, säsongen) — men
 * varianterna är TOMMA tills Opus levererar. Tills dess renderas posten utan
 * text; en synlig lucka är billigare än fel ton som blir kvar i kodbasen.
 *
 * Opus fyller: RESOLVED_VARIANTS och EXPIRED_VARIANTS nedan (title + body,
 * med {title}/{outcome}/{season}-tokens). Ingen annan fil behöver röras —
 * deferredRolloverService.ts läser redan härifrån.
 */

import type { GameEvent } from '../entities/GameEvent'

export interface DeferredRolloverTextContext {
  /** Beslutet som låg kvar i kön vid säsongsbytet. */
  event: GameEvent
  /** Etiketten på det default-val som tillämpades. undefined vid utrinning. */
  chosenLabel?: string
  /** Säsongen som just avslutades (den beslutet hörde till). */
  season: number
}

export interface DeferredRolloverText {
  title: string
  body: string
}

/** Fyller {title}/{outcome}/{season} i en mall. Tom mall → tom sträng. */
function fill(template: string, ctx: DeferredRolloverTextContext): string {
  if (!template) return ''
  return template
    .replace(/\{title\}/g, ctx.event.title)
    .replace(/\{outcome\}/g, ctx.chosenLabel ?? '')
    .replace(/\{season\}/g, String(ctx.season))
}

// Opus levererar — lämna tom tills dess. ALDRIG en placeholder-mening.
const RESOLVED_VARIANTS: DeferredRolloverText[] = []

// Opus levererar — lämna tom tills dess. ALDRIG en placeholder-mening.
const EXPIRED_VARIANTS: DeferredRolloverText[] = []

/** "X löstes av sig självt: [utfall]" — default-utfallet tillämpades. */
export function getDeferredResolvedText(ctx: DeferredRolloverTextContext): DeferredRolloverText {
  const variant = RESOLVED_VARIANTS[0]
  if (!variant) return { title: '', body: '' }
  return { title: fill(variant.title, ctx), body: fill(variant.body, ctx) }
}

/** "X hann aldrig behandlas och rann ut" — inget default-utfall deklarerat. */
export function getDeferredExpiredText(ctx: DeferredRolloverTextContext): DeferredRolloverText {
  const variant = EXPIRED_VARIANTS[0]
  if (!variant) return { title: '', body: '' }
  return { title: fill(variant.title, ctx), body: fill(variant.body, ctx) }
}
