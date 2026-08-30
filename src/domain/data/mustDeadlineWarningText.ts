/**
 * mustDeadlineWarningText — HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md)
 * + auditens MEDIUM 16.
 *
 * Domen: "Ett måste-event som skulle rinna ut med en oåterkallelig förlust ska
 * dessutom få en förvarning FÖRE fristen ('2 kontrakt löper ut om 3 omgångar'
 * — auditens MEDIUM 16, exakt)."
 *
 * ⚠️ TEXTEN ÄR OPUS. Code skriver aldrig svensk speltext (CLAUDE.md, hård
 * regel). Derivationen är byggd och testad (getUpcomingMustDeadlines,
 * decisionTierService.ts) och wiringen är klar (MustDeadlineWarning +
 * must_deadline_warning i initCardBag.ts) — men mallen nedan är TOM. Med tom
 * mall renderar kortet ingenting alls; det är avsiktligt (hellre en osynlig
 * yta i 24h än fel ton permanent i kodbasen).
 *
 * Opus fyller: TEMPLATE nedan. Tokens som redan är wirade och räknade:
 *   {count}          antal måste-beslut vars frist är inom fönstret
 *   {rounds}         omgångar kvar till den TIDIGASTE fristen
 *   {noun}           'kontrakt' / 'licenskrav' etc — se buildWarningTokens
 * Målraden (MEDIUM 16, ordagrant): "2 kontrakt löper ut om 3 omgångar".
 */

import type { GameEventType } from '../entities/GameEvent'
import type { MustDeadline } from '../services/decisionTierService'

export interface MustDeadlineWarningTokens {
  count: number
  rounds: number
  /** Dominerande måste-typ i urvalet — styr substantivet i raden. */
  dominantType: GameEventType | null
}

export function buildWarningTokens(deadlines: MustDeadline[]): MustDeadlineWarningTokens {
  if (deadlines.length === 0) return { count: 0, rounds: 0, dominantType: null }
  const counts = new Map<GameEventType, number>()
  for (const d of deadlines) {
    counts.set(d.event.type, (counts.get(d.event.type) ?? 0) + 1)
  }
  let dominantType: GameEventType | null = null
  let best = 0
  for (const [type, n] of counts) {
    if (n > best) { best = n; dominantType = type }
  }
  return {
    count: deadlines.length,
    // getUpcomingMustDeadlines sorterar redan tidigast frist först.
    rounds: deadlines[0].roundsRemaining,
    dominantType,
  }
}

// Opus levererar — lämna tom tills dess. ALDRIG en placeholder-mening.
const TEMPLATE: string = ''

/** Förvarningsraden, eller '' så länge Opus inte levererat mallen. */
export function getMustDeadlineWarningLine(deadlines: MustDeadline[]): string {
  if (deadlines.length === 0) return ''
  if (!TEMPLATE) return ''
  const t = buildWarningTokens(deadlines)
  return TEMPLATE
    .replace(/\{count\}/g, String(t.count))
    .replace(/\{rounds\}/g, String(t.rounds))
}
