export interface Rivalry {
  clubIds: [string, string]
  name: string
  intensity: number  // 1-3
}

export const RIVALRIES: Rivalry[] = [
  { clubIds: ['club_sandviken', 'club_edsbyn'], name: 'Gävleborgsderbyt', intensity: 3 },
  { clubIds: ['club_ljusdal', 'club_edsbyn'], name: 'Hälsinglandsderbyt', intensity: 2 },
  { clubIds: ['club_ljusdal', 'club_broberg'], name: 'Hälsinglandsderbyt', intensity: 2 },
  { clubIds: ['club_sandviken', 'club_broberg'], name: 'Gävleborgsderbyt', intensity: 2 },
  { clubIds: ['club_vasteras', 'club_tillberga'], name: 'Västmanlandsderbyt', intensity: 3 },
  { clubIds: ['club_villa', 'club_kungalv'], name: 'Västsvenska derbyt', intensity: 2 },
  { clubIds: ['club_sirius', 'club_skutskar'], name: 'Upplandsderbyt', intensity: 1 },
  { clubIds: ['club_soderhamns', 'club_broberg'], name: 'Söderhamnskampen', intensity: 3 },
  { clubIds: ['club_falun', 'club_edsbyn'], name: 'Dalarna mot Hälsingland', intensity: 2 },
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
