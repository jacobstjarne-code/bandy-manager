import type { SaveGame } from '../../../entities/SaveGame'

/**
 * Synlighetsfix (2026-07-21) — mec.pendingDemand hade noll UI-konsumenter:
 * spelaren fick bara veta om ett krav EFTER att det redan misslyckats
 * (inbox-påminnelsen i eventProcessor.ts, gated på mec.demands — som bara
 * fylls vid MISSLYCKANDE, se Mecenat.ts:s kommentar). Patron-grenen visar
 * sitt krav från skapandet (demands: [newDemand.description] sätts direkt,
 * eventProcessor.ts). Denna triggern gör samma sak för Mecenat: sant så
 * fort en aktiv mecenat har ett obesvarat krav — INTE bakom en patience/
 * happiness-tröskel (till skillnad från patronDemandUnmetOver3Rounds, som
 * bara triggar efter att otåligheten redan sjunkit — det hade återskapat
 * exakt samma "syns för sent"-fel för en mecenats FÖRSTA krav).
 */
export function mecenatHasPendingDemand(game: SaveGame): boolean {
  return (game.mecenater ?? []).some(m => m.isActive && m.pendingDemand !== undefined)
}
