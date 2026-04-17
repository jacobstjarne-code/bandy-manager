import type { SaveGame, ClubEra } from '../entities/SaveGame'

/**
 * Era beräknas från trainerArc (seasonCount, bestFinish, titlesWon) + communityStanding.
 *
 * legacy       — ≥5 säsonger OCH (bästa placering ≤4 ELLER ≥1 titel) OCH CS ≥70
 * establishment — ≥3 säsonger OCH bästa placering ≤10 OCH CS ≥50
 * survival     — annars
 */
export function calculateClubEra(game: SaveGame): ClubEra {
  const arc = game.trainerArc
  const cs = game.communityStanding ?? 50

  if (!arc) return 'survival'

  if (arc.seasonCount >= 5 && (arc.bestFinish <= 4 || arc.titlesWon >= 1) && cs >= 70) {
    return 'legacy'
  }
  if (arc.seasonCount >= 3 && arc.bestFinish <= 10 && cs >= 50) {
    return 'establishment'
  }
  return 'survival'
}

export function eraLabel(era: ClubEra): string {
  switch (era) {
    case 'survival': return 'Överlevnad'
    case 'establishment': return 'Etablering'
    case 'legacy': return 'Storhetstid'
  }
}

export function eraFullLabel(era: ClubEra): string {
  switch (era) {
    case 'survival': return 'Kamp för överlevnad'
    case 'establishment': return 'Etablering'
    case 'legacy': return 'Klubbens storhetstid'
  }
}

export function eraDescription(era: ClubEra): string {
  switch (era) {
    case 'survival': return 'Klubben befinner sig i ett kritiskt läge. Varje poäng räknas.'
    case 'establishment': return 'Orten räknar er inte längre som nykomlingar. Förväntningarna växer.'
    case 'legacy': return 'Det är inte längre bara bandy. Det är ortens identitet.'
  }
}
