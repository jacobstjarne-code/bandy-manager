import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'

export interface PatronHappinessTransition {
  patron: SaveGame['patron']
  patronWithdrawnSeason: number | undefined
  withdrawalEvent?: GameEvent
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

  return {
    patron: updatedPatron,
    patronWithdrawnSeason: game.currentSeason,
    withdrawalEvent,
  }
}
