/**
 * eventActions — mappar event-typ till knapprad-val för EventCardInline.
 *
 * Extraherar action-logiken ur EventOverlay så att både overlay och
 * inline-kortet kan använda samma källa.
 *
 * EventAction är en UI-facing struct: label + choiceId.
 * Resolvering sker via resolveEvent(eventId, choiceId) i store.
 */

import type { GameEvent } from '../entities/GameEvent'

export interface EventAction {
  label: string
  choiceId: string
  isPrimary?: boolean
}

/**
 * Returnerar knapprad-val för ett givet event.
 * Primär källa är event.choices — de är redan korrekt definierade
 * per event-typ av respektive event-generator.
 *
 * Atmospheric events med en enda choice visas som "Kvittera".
 * För event utan choices returneras en fallback-kvittering.
 */
export function getActionsForEvent(event: GameEvent): EventAction[] {
  const choices = event.choices ?? []

  if (choices.length === 0) {
    return [{ label: 'Kvittera', choiceId: 'no_choice', isPrimary: true }]
  }

  return choices.map((choice, idx) => ({
    label: choice.label,
    choiceId: choice.id,
    isPrimary: idx === 0,
  }))
}
