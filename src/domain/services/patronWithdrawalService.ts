import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'
import type { EventLedgerEntry } from '../entities/Narrative'
import { jobbetForsvannEvent } from './events/eventFactories'

export interface PatronHappinessTransition {
  patron: SaveGame['patron']
  patronWithdrawnSeason: number | undefined
  withdrawalEvent?: GameEvent
  /** DOM_PATRON_MECENAT_LAST_2026-09-02.md — satt bara vid en genuin
   *  nollpunktsövergång (samma villkor som withdrawalEvent). Ingen
   *  madeByPlayer-spärr: avhoppet är en systemkonsekvens av ackumulerad
   *  happiness, inte ett enskilt spelarval — samma princip som de
   *  ripple-triggade liggarposterna (star_injury/mecenat_withdrawal). */
  ledgerEntry?: EventLedgerEntry
  /** C-T8 (SPEC_FORHANDLING_TERMER_2026-09-04) §3C — jobbet_forsvann-kort för
   *  varje spelare vars jobbgaranti var bunden till DEN HÄR patronen, satt
   *  bara vid en genuin nollpunktsövergång (samma villkor som withdrawalEvent). */
  jobLossEvents?: GameEvent[]
}

/**
 * Gemensam nollpunktsövergång för alla patron-happiness-skrivare.
 * Att nå noll betyder mer än en siffra: patronen blir inaktiv, cooldownen
 * startar och ett enda avhoppsbesked skapas.
 */
export function applyPatronHappinessTransition(
  game: SaveGame,
  amount: number,
): PatronHappinessTransition {
  if (!game.patron?.isActive) {
    return {
      patron: game.patron,
      patronWithdrawnSeason: game.patronWithdrawnSeason,
    }
  }

  const patron = game.patron
  const happiness = Math.max(0, Math.min(100, (patron.happiness ?? 50) + amount))
  const updatedPatron = { ...patron, happiness, isActive: happiness > 0 }
  if (happiness > 0) {
    return {
      patron: updatedPatron,
      patronWithdrawnSeason: game.patronWithdrawnSeason,
    }
  }

  const withdrawalId = `patron_withdrawal_${game.currentSeason}`
  const alreadyKnown = [...(game.pendingEvents ?? []), ...(game.deferredDecisions ?? [])]
    .some(event => event.id === withdrawalId) ||
    (game.resolvedEventIds ?? []).includes(withdrawalId)
  const withdrawalEvent: GameEvent | undefined = alreadyKnown
    ? undefined
    : {
        id: withdrawalId,
        type: 'patronWithdrawal',
        title: `${patron.name} drar sig ur`,
        body: `${patron.name} har bestämt sig. Det grundläggande bidraget — ${Math.round(patron.contribution / 1000)} tkr/säsong — upphör. Klubben tappar sin dolda grundpelare.`,
        choices: [{
          id: 'acknowledge',
          label: 'Noterat',
          effect: { type: 'patronWithdrawn' },
        }],
        resolved: false,
      }
  // DOM_PATRON_MECENAT_LAST_2026-09-02.md — patron→liggaren. significance 95,
  // högre än allt i MOMENT_LEDGER_SIGNIFICANCE (topp 85) och högre än
  // mecenat_withdrawal (dynamisk, ripple-buren) — "fundamentet knakar" är
  // medvetet den tyngsta händelseklassen liggaren bär. Skriven vid samma
  // villkor (!alreadyKnown) som withdrawalEvent, aldrig en andra gång.
  const ledgerEntry: EventLedgerEntry | undefined = alreadyKnown
    ? undefined
    : {
        type: 'patron_withdrawal',
        semanticKey: withdrawalId,
        season: game.currentSeason,
        matchday: game.currentMatchday,
        subject: { kind: 'patron', id: patron.id },
        significance: 95,
      }

  // C-T8 §3C/§6 — samma jobbet_forsvann-kort som sponsorProcessor.ts bygger
  // för sponsoravgång, här för patronens jobbgarantier. alreadyKnown-grinden
  // ovan skyddar bara withdrawalId (avhoppskortet); jobLossEvents dedupliceras
  // separat via jobbetForsvannEvent()s eget instans-id (samma spelare/säsong/
  // omgång kan inte producera två identiska kort).
  const jobLossEvents = game.players
    .filter(p => p.jobGuaranteeSponsorId === patron.id)
    .map(p => jobbetForsvannEvent(p, patron.name, game))

  return {
    patron: updatedPatron,
    patronWithdrawnSeason: game.currentSeason,
    withdrawalEvent,
    ledgerEntry,
    jobLossEvents,
  }
}
