// Latitud-baserade positioner per landskap. Används för geografisk avståndsbias.
const REGION_LATITUDE: Record<string, number> = {
  'Norrbotten': 95,
  'Västernorrland': 80,
  'Hälsingland': 70,
  'Dalarna': 60,
  'Gästrikland': 57,
  'Uppland': 50,
  'Södermanland': 45,
  'Västmanland': 52,
  'Värmland': 55,
  'Småland': 30,
  'Skåne': 5,
}

// 0 steg (samma region), 1-4 steg (graderade avstånd)
export function getRegionDistance(region1: string, region2: string): 0 | 1 | 2 | 3 | 4 {
  const lat1 = REGION_LATITUDE[region1] ?? 50
  const lat2 = REGION_LATITUDE[region2] ?? 50
  const diff = Math.abs(lat1 - lat2)
  if (diff <= 10) return 0
  if (diff <= 25) return 1
  if (diff <= 45) return 2
  if (diff <= 70) return 3
  return 4
}
