export type SeasonAct = 1 | 2 | 3 | 4

export function getCurrentAct(leagueRound: number): SeasonAct {
  if (leagueRound <= 6) return 1   // Etablering (okt-nov)
  if (leagueRound <= 11) return 2  // Vinterns kärna (dec-jan)
  if (leagueRound <= 18) return 3  // Jakten (jan-feb)
  return 4                          // Avgörandet (feb-mars)
}

export function getActLabel(act: SeasonAct): string {
  switch (act) {
    case 1: return 'Höstens prolog'
    case 2: return 'Vinterns kärna'
    case 3: return 'Jakten'
    case 4: return 'Avgörandet'
  }
}
