import type { GameEvent } from '../../domain/entities/GameEvent'

/** Momentbilden hör till det stabila första hallbeslutet, inte alla generiska
 * hallprocesshändelser. Event-id:t är kanoniskt och säsongs-suffixat. */
export function getEventIllustrationName(event: Pick<GameEvent, 'id' | 'type'>): string | undefined {
  return event.type === 'hallProcess' && event.id.startsWith('hallprocess_d1_s')
    ? 'club-democracy'
    : undefined
}
