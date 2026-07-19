import type { SaveGame } from '../entities/SaveGame'
import { getNextManagedFixture } from './portal/triggers/matchTriggers'
import { getUpcomingAnchor, type UpcomingAnchor } from './calendarLookahead'

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
  matchday: number
  date: string | null
  opponentForm: FormResult[]        // senaste 5, äldst→nyast
  opponentLeaguePosition: number | null
  managedLeaguePosition: number | null
  /** Motståndarens obesegrade svit på den planen laget nu möter dem på (hemma/borta), denna säsong. 0 om ingen svit eller ingen data. */
  opponentUnbeatenStreakAtVenue: number
  opponentUnbeatenStreakSinceDate: string | null
  previousMeetingThisSeason: {
    date: string | null
    managedScore: number
    opponentScore: number
    isHome: boolean
  } | null
  calendarAnchor: UpcomingAnchor | null
}

function resultFor(managedId: string, homeId: string, homeScore: number, awayScore: number): FormResult {
  const isHome = homeId === managedId
  const own = isHome ? homeScore : awayScore
  const opp = isHome ? awayScore : homeScore
  if (own > opp) return 'V'
  if (own < opp) return 'F'
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
    .filter(f => f.status === 'completed' && !f.isCup && (f.homeClubId === opponentId || f.awayClubId === opponentId))
    .sort((a, b) => a.matchday - b.matchday)
  const opponentForm = opponentCompleted.slice(-5).map(f =>
    resultFor(opponentId, f.homeClubId, f.homeScore ?? 0, f.awayScore ?? 0)
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
    const result = resultFor(opponentId, f.homeClubId, f.homeScore ?? 0, f.awayScore ?? 0)
    if (result === 'F') break
    unbeatenStreak++
    streakSinceDate = f.date ?? streakSinceDate
  }
  if (unbeatenStreak === 0) streakSinceDate = null

  // Tidigare möte denna säsong (om spelat)
  const priorMeeting = game.fixtures
    .filter(f =>
      f.status === 'completed' && !f.isCup && f.season === game.currentSeason &&
      ((f.homeClubId === managedId && f.awayClubId === opponentId) ||
       (f.homeClubId === opponentId && f.awayClubId === managedId))
    )
    .sort((a, b) => b.matchday - a.matchday)[0]

  const previousMeetingThisSeason = priorMeeting ? {
    date: priorMeeting.date ?? null,
    managedScore: priorMeeting.homeClubId === managedId ? (priorMeeting.homeScore ?? 0) : (priorMeeting.awayScore ?? 0),
    opponentScore: priorMeeting.homeClubId === managedId ? (priorMeeting.awayScore ?? 0) : (priorMeeting.homeScore ?? 0),
    isHome: priorMeeting.homeClubId === managedId,
  } : null

  return {
    opponentName: opponent.name,
    opponentShortName: opponent.shortName ?? opponent.name,
    isHome,
    matchday: nextFixture.matchday,
    date: nextFixture.date ?? null,
    opponentForm,
    opponentLeaguePosition: game.standings.find(s => s.clubId === opponentId)?.position ?? null,
    managedLeaguePosition: game.standings.find(s => s.clubId === managedId)?.position ?? null,
    opponentUnbeatenStreakAtVenue: unbeatenStreak,
    opponentUnbeatenStreakSinceDate: streakSinceDate,
    previousMeetingThisSeason,
    calendarAnchor: getUpcomingAnchor(game),
  }
}
