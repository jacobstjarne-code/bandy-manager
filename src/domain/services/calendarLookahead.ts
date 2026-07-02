import type { SaveGame } from '../entities/SaveGame'
import { getRivalry } from '../data/rivalries'
import { getNextManagedFixture } from './portal/triggers/matchTriggers'

export type UpcomingAnchorKind = 'annandag' | 'nyar' | 'cupfinalhelg' | 'derby'

export interface UpcomingAnchor {
  kind: UpcomingAnchorKind
  matchdaysUntil: number
}

const LOOKAHEAD_MATCHDAYS = 5

/**
 * Letar framåt från game.currentMatchday (exklusive) i seasonCalendar +
 * nästa managed-fixture efter ett kommande "ankare" — annandagen/nyårsbandy/
 * cupfinalhelgen (rena kalenderslot, klubb-oberoende) eller derby (managed
 * clubs nästa fixture har rivalry). Närmast vinner. Vid krock samma matchdag
 * prioriteras kalenderankaret (starkare kulturellt) — löst genom att
 * kalenderkollen körs före derbykollen i samma varv.
 */
export function getUpcomingAnchor(game: SaveGame): UpcomingAnchor | null {
  const calendar = game.seasonCalendar ?? []
  const currentMatchday = game.currentMatchday ?? 0

  const nextFixture = getNextManagedFixture(game)
  const isDerby = !!nextFixture && getRivalry(nextFixture.homeClubId, nextFixture.awayClubId) !== null

  for (let d = currentMatchday + 1; d <= currentMatchday + LOOKAHEAD_MATCHDAYS; d++) {
    const slot = calendar.find(s => s.matchday === d)
    const matchdaysUntil = d - currentMatchday
    if (slot?.isAnnandagen) return { kind: 'annandag', matchdaysUntil }
    if (slot?.isNyarsbandy) return { kind: 'nyar', matchdaysUntil }
    if (slot?.isCupFinalhelgen) return { kind: 'cupfinalhelg', matchdaysUntil }
    if (isDerby && nextFixture!.matchday === d) return { kind: 'derby', matchdaysUntil }
  }

  return null
}
