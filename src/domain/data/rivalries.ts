export interface Rivalry {
  clubIds: [string, string]
  name: string
  intensity: number  // 1-3
}

export const RIVALRIES: Rivalry[] = [
  { clubIds: ['club_soderfors', 'club_skutskar'], name: 'Upplandsderbyt', intensity: 3 },
  { clubIds: ['club_lesjofors', 'club_halleforsnas'], name: 'Bruksderbyt', intensity: 2 },
  { clubIds: ['club_gagnef', 'club_heros'], name: 'Daladerbyt', intensity: 3 },
  { clubIds: ['club_rogle', 'club_malilla'], name: 'Slaget om södern', intensity: 2 },
  { clubIds: ['club_karlsborg', 'club_rogle'], name: 'Nord mot syd', intensity: 1 },
  { clubIds: ['club_slottsbron', 'club_halleforsnas'], name: 'Blåderbyt', intensity: 1 },
  { clubIds: ['club_gagnef', 'club_forsbacka'], name: 'Gävledaladerbyt', intensity: 2 },
  { clubIds: ['club_vastanfors', 'club_soderfors'], name: 'Forsderbyt', intensity: 1 },
  { clubIds: ['club_slottsbron', 'club_lesjofors'], name: 'Slaget om Värmland', intensity: 3 },
]

export function getRivalry(clubId1: string, clubId2: string): Rivalry | null {
  return RIVALRIES.find(r =>
    (r.clubIds[0] === clubId1 && r.clubIds[1] === clubId2) ||
    (r.clubIds[0] === clubId2 && r.clubIds[1] === clubId1)
  ) ?? null
}

export function isRivalryMatch(clubId1: string, clubId2: string): boolean {
  return getRivalry(clubId1, clubId2) !== null
}

/**
 * O3/O18 (2026-08-19) — klubbens EN rival, om den har flera (t.ex.
 * club_slottsbron: både Blåderbyt och Slaget om Värmland). Ingen tidigare
 * konsument behövde "min rival" ur en enda klubbs perspektiv, bara
 * "är dessa två rivaler" (getRivalry/isRivalryMatch). Högst intensitet vinner.
 */
export function getPrimaryRivalry(clubId: string): Rivalry | null {
  const matches = RIVALRIES.filter(r => r.clubIds.includes(clubId))
  if (matches.length === 0) return null
  return [...matches].sort((a, b) => b.intensity - a.intensity)[0]
}

export function getRivalClubId(clubId: string): string | null {
  const rivalry = getPrimaryRivalry(clubId)
  if (!rivalry) return null
  return rivalry.clubIds[0] === clubId ? rivalry.clubIds[1] : rivalry.clubIds[0]
}
