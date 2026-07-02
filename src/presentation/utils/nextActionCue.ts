import type { SaveGame } from '../../domain/entities/SaveGame'
import { getRoundDate } from '../../domain/services/scheduleGenerator'

export interface NextActionCue {
  text: string
  tone: 'default' | 'warning'
}

/**
 * Drag 3 (§11, punkt 6) — "Vad nu?"-affordansen. Speglar EXAKT samma grenar
 * som PortalScreen.tsx:s handleAdvance (decision-grind → managed match nästa
 * omgång → lineup-status → annars), så raden aldrig kan säga något CTA:n
 * motsäger. Ren funktion → enhetstestbar, ingen ny spellogik — bara ord över
 * befintligt beslutsträd. Egen fil (inte i PortalScreen.tsx) för att undvika
 * PortalScreen.tsx:s modulsidoeffekter (soundEffects/gameStore-rehydrering)
 * vid import i testmiljön.
 */
export function getNextActionCue(game: SaveGame): NextActionCue {
  if (game.pendingWeeklyDecision != null) {
    return { text: 'Veckans beslut väntar — ta det först.', tone: 'warning' }
  }

  const scheduledFixtures = game.fixtures.filter(f => f.status === 'scheduled')
  if (scheduledFixtures.length === 0) {
    return { text: 'Näst på tur: spela omgången.', tone: 'default' }
  }

  const nextMatchday = Math.min(...scheduledFixtures.map(f => f.matchday))
  const managedMatchInNextRound = scheduledFixtures.find(
    f => f.matchday === nextMatchday && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )
  if (!managedMatchInNextRound) {
    return { text: 'Näst på tur: spela omgången.', tone: 'default' }
  }

  const oppId = managedMatchInNextRound.homeClubId === game.managedClubId
    ? managedMatchInNextRound.awayClubId
    : managedMatchInNextRound.homeClubId
  const opp = game.clubs.find(c => c.id === oppId)
  const oppName = opp?.shortName ?? opp?.name ?? '?'

  if (!game.managedClubPendingLineup) {
    return { text: `Näst på tur: sätt laget inför ${oppName}.`, tone: 'default' }
  }

  const DAYS = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör']
  const dateStr = managedMatchInNextRound.date || getRoundDate(game.currentSeason, managedMatchInNextRound.roundNumber)
  const day = DAYS[new Date(dateStr).getDay()]
  return { text: `Näst på tur: matchen mot ${oppName}, ${day}.`, tone: 'default' }
}
