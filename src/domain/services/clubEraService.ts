import type { SaveGame, ClubEra } from '../entities/SaveGame'

/**
 * Determines the current era of the managed club based on historical results,
 * reputation, and finances. Era filters available weekly decisions and board objectives.
 *
 * survival     — early or struggling: low rep/finances or repeated poor finishes
 * establishment — mid-table stability, growing fanbase
 * legacy       — sustained success, high reputation
 */
export function calculateClubEra(game: SaveGame): ClubEra {
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (!managedClub) return 'survival'

  const rep = managedClub.reputation
  const finances = managedClub.finances

  // Look at last 3 seasons of summaries for the managed club
  const recentSummaries = (game.seasonSummaries ?? [])
    .filter(s => s.clubId === game.managedClubId)
    .slice(-3)

  const avgPosition = recentSummaries.length > 0
    ? recentSummaries.reduce((sum, s) => sum + s.finalPosition, 0) / recentSummaries.length
    : 8

  const hasWonTitle = recentSummaries.some(s => s.playoffResult === 'champion')
  const hasReachedPlayoffs = recentSummaries.some(
    s => s.playoffResult && s.playoffResult !== 'didNotQualify',
  )

  // Legacy: high reputation + strong results or title won
  if (rep >= 70 && (hasWonTitle || (avgPosition <= 3 && hasReachedPlayoffs))) {
    return 'legacy'
  }

  // Establishment: stable mid-table or growing club
  if (rep >= 45 || (avgPosition <= 7 && finances >= 0)) {
    return 'establishment'
  }

  // Survival: struggling financially or on the pitch
  return 'survival'
}

export function eraLabel(era: ClubEra): string {
  switch (era) {
    case 'survival': return 'Kamp för överlevnad'
    case 'establishment': return 'Bygger ett lag'
    case 'legacy': return 'Klubbens storhetstid'
  }
}

export function eraDescription(era: ClubEra): string {
  switch (era) {
    case 'survival': return 'Klubben befinner sig i ett kritiskt läge. Varje poäng räknas.'
    case 'establishment': return 'Grunden är lagd. Nu handlar det om att ta nästa steg.'
    case 'legacy': return 'Klubben skriver historia. Pressen att leverera är enorm.'
  }
}
