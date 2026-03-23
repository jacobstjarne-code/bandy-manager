export interface MonthlyClimate {
  month: number
  avgTemp: number
  tempVariance: number
  snowChance: number
  heavySnowChance: number
  fogChance: number
  thawChance: number
}

export const REGIONAL_CLIMATE: Record<string, MonthlyClimate[]> = {
  'Norrbotten': [
    { month: 10, avgTemp: -2, tempVariance: 5, snowChance: 0.40, heavySnowChance: 0.10, fogChance: 0.05, thawChance: 0.05 },
    { month: 11, avgTemp: -10, tempVariance: 6, snowChance: 0.45, heavySnowChance: 0.15, fogChance: 0.05, thawChance: 0.02 },
    { month: 12, avgTemp: -15, tempVariance: 7, snowChance: 0.40, heavySnowChance: 0.15, fogChance: 0.05, thawChance: 0.01 },
    { month: 1, avgTemp: -18, tempVariance: 8, snowChance: 0.35, heavySnowChance: 0.10, fogChance: 0.05, thawChance: 0.01 },
    { month: 2, avgTemp: -14, tempVariance: 7, snowChance: 0.35, heavySnowChance: 0.10, fogChance: 0.05, thawChance: 0.03 },
    { month: 3, avgTemp: -8, tempVariance: 6, snowChance: 0.30, heavySnowChance: 0.08, fogChance: 0.08, thawChance: 0.10 },
  ],
  'Västerbotten': [
    { month: 10, avgTemp: 1, tempVariance: 4, snowChance: 0.30, heavySnowChance: 0.08, fogChance: 0.08, thawChance: 0.08 },
    { month: 11, avgTemp: -5, tempVariance: 5, snowChance: 0.40, heavySnowChance: 0.12, fogChance: 0.05, thawChance: 0.05 },
    { month: 12, avgTemp: -10, tempVariance: 6, snowChance: 0.40, heavySnowChance: 0.12, fogChance: 0.05, thawChance: 0.02 },
    { month: 1, avgTemp: -13, tempVariance: 7, snowChance: 0.35, heavySnowChance: 0.10, fogChance: 0.05, thawChance: 0.02 },
    { month: 2, avgTemp: -10, tempVariance: 6, snowChance: 0.35, heavySnowChance: 0.10, fogChance: 0.05, thawChance: 0.05 },
    { month: 3, avgTemp: -5, tempVariance: 5, snowChance: 0.25, heavySnowChance: 0.05, fogChance: 0.10, thawChance: 0.15 },
  ],
  'Jämtland': [
    { month: 10, avgTemp: 0, tempVariance: 4, snowChance: 0.35, heavySnowChance: 0.10, fogChance: 0.05, thawChance: 0.08 },
    { month: 11, avgTemp: -6, tempVariance: 5, snowChance: 0.45, heavySnowChance: 0.15, fogChance: 0.05, thawChance: 0.03 },
    { month: 12, avgTemp: -11, tempVariance: 6, snowChance: 0.45, heavySnowChance: 0.15, fogChance: 0.05, thawChance: 0.02 },
    { month: 1, avgTemp: -14, tempVariance: 7, snowChance: 0.40, heavySnowChance: 0.12, fogChance: 0.05, thawChance: 0.02 },
    { month: 2, avgTemp: -10, tempVariance: 6, snowChance: 0.40, heavySnowChance: 0.12, fogChance: 0.05, thawChance: 0.05 },
    { month: 3, avgTemp: -5, tempVariance: 5, snowChance: 0.30, heavySnowChance: 0.08, fogChance: 0.10, thawChance: 0.12 },
  ],
  'Gävleborg': [
    { month: 10, avgTemp: 4, tempVariance: 4, snowChance: 0.15, heavySnowChance: 0.03, fogChance: 0.10, thawChance: 0.10 },
    { month: 11, avgTemp: -1, tempVariance: 5, snowChance: 0.30, heavySnowChance: 0.08, fogChance: 0.10, thawChance: 0.08 },
    { month: 12, avgTemp: -5, tempVariance: 6, snowChance: 0.35, heavySnowChance: 0.10, fogChance: 0.08, thawChance: 0.05 },
    { month: 1, avgTemp: -8, tempVariance: 7, snowChance: 0.30, heavySnowChance: 0.08, fogChance: 0.08, thawChance: 0.05 },
    { month: 2, avgTemp: -6, tempVariance: 6, snowChance: 0.30, heavySnowChance: 0.08, fogChance: 0.10, thawChance: 0.08 },
    { month: 3, avgTemp: -1, tempVariance: 5, snowChance: 0.20, heavySnowChance: 0.05, fogChance: 0.12, thawChance: 0.20 },
  ],
  'Hälsingland': [
    { month: 10, avgTemp: 3, tempVariance: 4, snowChance: 0.20, heavySnowChance: 0.05, fogChance: 0.08, thawChance: 0.10 },
    { month: 11, avgTemp: -2, tempVariance: 5, snowChance: 0.35, heavySnowChance: 0.10, fogChance: 0.08, thawChance: 0.06 },
    { month: 12, avgTemp: -7, tempVariance: 6, snowChance: 0.40, heavySnowChance: 0.12, fogChance: 0.06, thawChance: 0.03 },
    { month: 1, avgTemp: -10, tempVariance: 7, snowChance: 0.35, heavySnowChance: 0.10, fogChance: 0.06, thawChance: 0.03 },
    { month: 2, avgTemp: -8, tempVariance: 6, snowChance: 0.35, heavySnowChance: 0.10, fogChance: 0.08, thawChance: 0.06 },
    { month: 3, avgTemp: -2, tempVariance: 5, snowChance: 0.25, heavySnowChance: 0.06, fogChance: 0.10, thawChance: 0.18 },
  ],
  'Dalarna': [
    { month: 10, avgTemp: 2, tempVariance: 4, snowChance: 0.25, heavySnowChance: 0.06, fogChance: 0.08, thawChance: 0.08 },
    { month: 11, avgTemp: -3, tempVariance: 5, snowChance: 0.35, heavySnowChance: 0.10, fogChance: 0.08, thawChance: 0.05 },
    { month: 12, avgTemp: -8, tempVariance: 6, snowChance: 0.40, heavySnowChance: 0.12, fogChance: 0.06, thawChance: 0.03 },
    { month: 1, avgTemp: -11, tempVariance: 7, snowChance: 0.35, heavySnowChance: 0.10, fogChance: 0.06, thawChance: 0.02 },
    { month: 2, avgTemp: -8, tempVariance: 6, snowChance: 0.35, heavySnowChance: 0.10, fogChance: 0.08, thawChance: 0.05 },
    { month: 3, avgTemp: -3, tempVariance: 5, snowChance: 0.25, heavySnowChance: 0.06, fogChance: 0.10, thawChance: 0.15 },
  ],
  'Västmanland': [
    { month: 10, avgTemp: 6, tempVariance: 3, snowChance: 0.10, heavySnowChance: 0.02, fogChance: 0.12, thawChance: 0.12 },
    { month: 11, avgTemp: 1, tempVariance: 4, snowChance: 0.20, heavySnowChance: 0.05, fogChance: 0.12, thawChance: 0.10 },
    { month: 12, avgTemp: -3, tempVariance: 5, snowChance: 0.30, heavySnowChance: 0.08, fogChance: 0.10, thawChance: 0.08 },
    { month: 1, avgTemp: -5, tempVariance: 6, snowChance: 0.25, heavySnowChance: 0.06, fogChance: 0.10, thawChance: 0.08 },
    { month: 2, avgTemp: -4, tempVariance: 5, snowChance: 0.25, heavySnowChance: 0.06, fogChance: 0.12, thawChance: 0.12 },
    { month: 3, avgTemp: 0, tempVariance: 4, snowChance: 0.15, heavySnowChance: 0.03, fogChance: 0.15, thawChance: 0.25 },
  ],
  'Mälardalen': [
    { month: 10, avgTemp: 7, tempVariance: 3, snowChance: 0.05, heavySnowChance: 0.01, fogChance: 0.15, thawChance: 0.15 },
    { month: 11, avgTemp: 2, tempVariance: 4, snowChance: 0.15, heavySnowChance: 0.03, fogChance: 0.15, thawChance: 0.12 },
    { month: 12, avgTemp: -2, tempVariance: 5, snowChance: 0.25, heavySnowChance: 0.06, fogChance: 0.12, thawChance: 0.10 },
    { month: 1, avgTemp: -4, tempVariance: 6, snowChance: 0.20, heavySnowChance: 0.05, fogChance: 0.12, thawChance: 0.10 },
    { month: 2, avgTemp: -3, tempVariance: 5, snowChance: 0.20, heavySnowChance: 0.05, fogChance: 0.15, thawChance: 0.15 },
    { month: 3, avgTemp: 1, tempVariance: 4, snowChance: 0.10, heavySnowChance: 0.02, fogChance: 0.15, thawChance: 0.30 },
  ],
  'Uppland': [
    { month: 10, avgTemp: 6, tempVariance: 3, snowChance: 0.08, heavySnowChance: 0.02, fogChance: 0.12, thawChance: 0.12 },
    { month: 11, avgTemp: 1, tempVariance: 4, snowChance: 0.18, heavySnowChance: 0.04, fogChance: 0.12, thawChance: 0.10 },
    { month: 12, avgTemp: -3, tempVariance: 5, snowChance: 0.28, heavySnowChance: 0.07, fogChance: 0.10, thawChance: 0.08 },
    { month: 1, avgTemp: -5, tempVariance: 6, snowChance: 0.22, heavySnowChance: 0.06, fogChance: 0.10, thawChance: 0.08 },
    { month: 2, avgTemp: -4, tempVariance: 5, snowChance: 0.22, heavySnowChance: 0.05, fogChance: 0.12, thawChance: 0.12 },
    { month: 3, avgTemp: 0, tempVariance: 4, snowChance: 0.12, heavySnowChance: 0.03, fogChance: 0.15, thawChance: 0.28 },
  ],
  'Västra Götaland': [
    { month: 10, avgTemp: 8, tempVariance: 3, snowChance: 0.03, heavySnowChance: 0.01, fogChance: 0.15, thawChance: 0.20 },
    { month: 11, avgTemp: 3, tempVariance: 4, snowChance: 0.10, heavySnowChance: 0.02, fogChance: 0.15, thawChance: 0.15 },
    { month: 12, avgTemp: 0, tempVariance: 4, snowChance: 0.15, heavySnowChance: 0.04, fogChance: 0.12, thawChance: 0.15 },
    { month: 1, avgTemp: -2, tempVariance: 5, snowChance: 0.15, heavySnowChance: 0.04, fogChance: 0.12, thawChance: 0.15 },
    { month: 2, avgTemp: -1, tempVariance: 4, snowChance: 0.12, heavySnowChance: 0.03, fogChance: 0.15, thawChance: 0.20 },
    { month: 3, avgTemp: 3, tempVariance: 3, snowChance: 0.05, heavySnowChance: 0.01, fogChance: 0.15, thawChance: 0.40 },
  ],
}

export function getClimateForRegionAndMonth(region: string, month: number): MonthlyClimate {
  const data = REGIONAL_CLIMATE[region] ?? REGIONAL_CLIMATE['Gävleborg']
  return data.find(m => m.month === month) ?? data[0]
}
