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
/**
 * Låg 1 + Medium 5 (Skutskär-auditen, 2026-08-22): sant när den hanterade
 * klubben inte har någon egen match kvar schemalagd — säsongen är
 * funktionellt slut för SPELAREN, även om andra klubbars serier fortsätter
 * (t.ex. resten av slutspelet efter en egen kvartsfinalförlust). Delad
 * mellan nextActionCue.ts (Low 1) och gameFlowActions.ts (Medium 5 —
 * rensar daterade sponsorerbjudanden ur kön i samma ögonblick).
 */
export function hasManagedClubFutureFixture(game: SaveGame): boolean {
  return game.fixtures.some(
    f => f.status === 'scheduled' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )
}

export function getNextActionCue(game: SaveGame): NextActionCue {
  if (game.pendingWeeklyDecision != null) {
    return { text: 'Veckans beslut väntar — ta det först.', tone: 'warning' }
  }

  // Low 1 (Skutskär-auditen, 2026-08-22): "Näst på tur: spela omgången"
  // visades även när den hanterade klubben INTE hade någon match kvar att
  // spela (utslagen ur slutspelet — bara andra klubbars serier återstod).
  // Spelaren såg "Säsongen är slut" och "spela omgången" på samma vy
  // samtidigt. Kollar den hanterade klubbens EGNA kvarvarande matcher,
  // inte bara om NÅGON match är schemalagd någonstans i ligan.
  if (!hasManagedClubFutureFixture(game)) {
    return { text: 'Säsongen är slut för er del — avsluta säsongen.', tone: 'default' }
  }

  const scheduledFixtures = game.fixtures.filter(f => f.status === 'scheduled')
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
