export interface Rivalry {
  clubIds: [string, string]
  name: string
  intensity: number  // 1-3
}

export const RIVALRIES: Rivalry[] = [
  { clubIds: ['club_sirius', 'club_skutskar'], name: 'Upplandsderbyt', intensity: 3 },
  { clubIds: ['club_edsbyn', 'club_ljusdal'], name: 'Bruksderbyt', intensity: 2 },
  { clubIds: ['club_falun', 'club_soderhamns'], name: 'Daladerbyt', intensity: 3 },
  { clubIds: ['club_tillberga', 'club_villa'], name: 'Slaget om södern', intensity: 2 },
  { clubIds: ['club_broberg', 'club_tillberga'], name: 'Nord mot syd', intensity: 1 },
  { clubIds: ['club_kungalv', 'club_ljusdal'], name: 'Blåderbyt', intensity: 1 },
  { clubIds: ['club_falun', 'club_sandviken'], name: 'Gävledaladerbyt', intensity: 2 },
  { clubIds: ['club_vasteras', 'club_sirius'], name: 'Forsderbyt', intensity: 1 },
  { clubIds: ['club_kungalv', 'club_edsbyn'], name: 'Slaget om Värmland', intensity: 3 },
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
