import type { SaveGame } from '../entities/SaveGame'
import { getNextManagedFixture } from './portal/triggers/matchTriggers'
import { getUpcomingAnchor, type UpcomingAnchor } from './calendarLookahead'
import { safeStandingPosition } from './standingsService'
import { deriveUtfall } from './matchTypeAxes'
import type { Fixture } from '../entities/Fixture'

/**
 * B3 (2026-07-19): Granska slutar i dag i administration ("KLAR — NÄSTA
 * OMGÅNG"). Den ska sluta i nästa laddade sak — Design äger PLACERINGEN
 * (var i Granska-flödet, vilken vikt mot CTA:n) och Fable äger MALLEN
 * ("Nästa: {opponent} {hemma/borta}. {form-mening}."). Denna funktion är
 * BARA Code:s del: hämta fakta som redan finns i state, ingen ny text.
 * Bygg inte in den i en yta innan Design har placerat den.
 */

export type FormResult = 'V' | 'O' | 'F'

export interface NextOpponentTeaserFacts {
  opponentName: string
  opponentShortName: string
  isHome: boolean
  isLeagueMatch?: boolean
  matchday: number
  date: string | null
  opponentForm: FormResult[]        // senaste 5, äldst→nyast
  opponentLeaguePosition: number | null
  managedLeaguePosition: number | null
  /** B3 (2026-07-20, hook-kroken): faktiska tabellpoäng — "två poäng skiljer" kräver den exakta differensen, inte platsdifferensen. */
  opponentLeaguePoints: number | null
  managedLeaguePoints: number | null
  /** Motståndarens obesegrade svit på den planen laget nu möter dem på (hemma/borta), denna säsong. 0 om ingen svit eller ingen data. */
  opponentUnbeatenStreakAtVenue: number
  opponentUnbeatenStreakSinceDate: string | null
  previousMeetingThisSeason: {
    date: string | null
    managedScore: number
    opponentScore: number
    isHome: boolean
    outcome?: FormResult
    isLeagueMatch?: boolean
  } | null
  calendarAnchor: UpcomingAnchor | null
}

function resultFor(managedId: string, fixture: Fixture): FormResult {
  const outcome = deriveUtfall(fixture, managedId)
  if (outcome === 'vunnet') return 'V'
  if (outcome === 'forlorat') return 'F'
  return 'O'
}

export function getNextOpponentTeaserFacts(game: SaveGame): NextOpponentTeaserFacts | null {
  const managedId = game.managedClubId
  const nextFixture = getNextManagedFixture(game)
  if (!nextFixture) return null

  const opponentId = nextFixture.homeClubId === managedId ? nextFixture.awayClubId : nextFixture.homeClubId
  const opponent = game.clubs.find(c => c.id === opponentId)
  if (!opponent) return null

  const isHome = nextFixture.homeClubId === managedId

  // Motståndarens form — senaste 5 avslutade ligamatcher (alla motståndare, inte bara mot oss)
  const opponentCompleted = game.fixtures
    .filter(f => f.status === 'completed' && f.season === game.currentSeason
      && (nextFixture.isKnockout || (!f.isCup && !f.isKnockout))
      && (f.homeClubId === opponentId || f.awayClubId === opponentId))
    .sort((a, b) => a.matchday - b.matchday)
  const opponentForm = opponentCompleted.slice(-5).map(f =>
    resultFor(opponentId, f)
  )

  // Motståndarens obesegrade svit PÅ DEN PLANEN vi nu möter dem (deras hemmaplan om vi
  // spelar borta, deras bortaplan om vi spelar hemma), räknat bakåt från senaste sådan match.
  const venueFixtures = opponentCompleted.filter(f =>
    isHome ? f.awayClubId === opponentId : f.homeClubId === opponentId
  )
  let unbeatenStreak = 0
  let streakSinceDate: string | null = null
  for (let i = venueFixtures.length - 1; i >= 0; i--) {
    const f = venueFixtures[i]
    const result = resultFor(opponentId, f)
    if (result === 'F') break
    unbeatenStreak++
    streakSinceDate = f.date ?? streakSinceDate
  }
  if (unbeatenStreak === 0) streakSinceDate = null

  // Tidigare möte denna säsong (om spelat)
  const priorMeeting = game.fixtures
    .filter(f =>
      f.status === 'completed' && f.season === game.currentSeason &&
      ((f.homeClubId === managedId && f.awayClubId === opponentId) ||
       (f.homeClubId === opponentId && f.awayClubId === managedId))
    )
    .sort((a, b) => b.matchday - a.matchday)[0]

  const previousMeetingThisSeason = priorMeeting ? {
    date: priorMeeting.date ?? null,
    managedScore: priorMeeting.homeClubId === managedId ? (priorMeeting.homeScore ?? 0) : (priorMeeting.awayScore ?? 0),
    opponentScore: priorMeeting.homeClubId === managedId ? (priorMeeting.awayScore ?? 0) : (priorMeeting.homeScore ?? 0),
    isHome: priorMeeting.homeClubId === managedId,
    outcome: resultFor(managedId, priorMeeting),
    isLeagueMatch: !priorMeeting.isCup && !priorMeeting.isKnockout,
  } : null

  return {
    opponentName: opponent.name,
    opponentShortName: opponent.shortName ?? opponent.name,
    isHome,
    isLeagueMatch: !nextFixture.isCup && !nextFixture.isKnockout,
    matchday: nextFixture.matchday,
    date: nextFixture.date ?? null,
    opponentForm,
    // LÄST-FÖRE-INITIERING (PASTAENDEKARTAN, 2026-08-26): safeStandingPosition
    // ger null om klubben ännu inte spelat en ligamatch denna säsong, istf
    // en alfabetisk skuggposition. .points lämnas orört — 0 poäng vid 0
    // spelade matcher är sant, inte vilseledande som en gissad rang är.
    opponentLeaguePosition: safeStandingPosition(game.standings, opponentId),
    managedLeaguePosition: safeStandingPosition(game.standings, managedId),
    opponentLeaguePoints: game.standings.find(s => s.clubId === opponentId)?.points ?? null,
    managedLeaguePoints: game.standings.find(s => s.clubId === managedId)?.points ?? null,
    opponentUnbeatenStreakAtVenue: unbeatenStreak,
    opponentUnbeatenStreakSinceDate: streakSinceDate,
    previousMeetingThisSeason,
    calendarAnchor: getUpcomingAnchor(game),
  }
}
