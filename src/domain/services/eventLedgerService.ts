import type { SaveGame } from '../entities/SaveGame'
import type { EventLedgerEntry } from '../entities/Narrative'

/**
 * DOM_HANDELSELIGGAREN_2026-09-01.md / MIGRATIONSPLAN_HANDELSELIGGAREN_
 * 2026-09-01.md — Fas 0. Fundamentet: en kanonisk, intern, append-only
 * händelseliggare (`game.eventLedger`). Spelaren ser den ALDRIG.
 *
 * EN skrivväg, samma disciplin som `narrativeLogService.logNarrativeBeat`:
 * ren funktion, tar `game` + en färdig post, returnerar den NYA arrayen —
 * anroparen tilldelar den in i sitt uppdaterade game-objekt. Ingen mutation,
 * ingen annan väg att skriva en liggarpost.
 *
 * INGA konsumenter ännu (Fas 0). Fas 1 (orsak/verkan) blir den första rena
 * läsaren. `EventLedgerEntry`s fält är låsta av Opus (schemat i
 * entities/Narrative.ts) — denna funktion gör medvetet ingen egen
 * fältvalidering utöver TypeScripts unionstyper; posten är redan
 * färdigformad av anroparen.
 */
export function logEvent(game: SaveGame, entry: EventLedgerEntry): EventLedgerEntry[] {
  return [...(game.eventLedger ?? []), entry]
}
