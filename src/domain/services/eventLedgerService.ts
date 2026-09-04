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
 * `EventLedgerEntry`s fält är låsta av Opus (schemat i
 * entities/Narrative.ts). Funktionen gör medvetet ingen egen
 * fältvalidering utöver TypeScripts unionstyper; posten är redan
 * färdigformad av anroparen.
 */
export function logEvent(game: SaveGame, entry: EventLedgerEntry): EventLedgerEntry[] {
  const withClub = entry.clubId ? entry : { ...entry, clubId: game.managedClubId }
  const withManager = (withClub.type === 'decision' || withClub.type === 'manager_burnout')
    && !withClub.managerId
    ? { ...withClub, managerId: game.id }
    : withClub
  return [
    ...(game.eventLedger ?? []),
    withManager,
  ]
}

/**
 * DOM_LIGGARE_CLUBID_2026-09-04 §2 — klubbens kanoniska läsväg.
 * Subject kan vara en spelare, motpart eller domare och får aldrig användas
 * för att gissa vem som äger posten. Legacy-poster stämplas av migreringen.
 */
export function readClubLedger(
  game: Pick<SaveGame, 'eventLedger' | 'managedClubId'>,
  clubId = game.managedClubId,
): EventLedgerEntry[] {
  return (game.eventLedger ?? []).filter(entry => entry.clubId === clubId)
}

/** Managerperspektivet följer karriären över klubbgränser. */
export function readManagerLedger(
  game: Pick<SaveGame, 'eventLedger' | 'id'>,
  managerId = game.id,
): EventLedgerEntry[] {
  return (game.eventLedger ?? []).filter(entry => entry.managerId === managerId)
}
