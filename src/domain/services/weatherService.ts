import type { Club } from '../entities/Club'
import type { MatchWeather, Weather, WeatherEffects } from '../entities/Weather'
import { WeatherCondition, IceQuality } from '../enums'
import { getClimateForRegionAndMonth } from '../data/regionalClimate'
import { mulberry32 } from '../utils/random'

function roundToMonth(roundNumber: number): number {
  if (roundNumber <= 4)  return 10  // okt: r1-4
  if (roundNumber <= 7)  return 11  // nov: r5-7
  if (roundNumber <= 11) return 12  // dec: r8-11 (Dec 3, Dec 19, Annandagen, Dec 30)
  if (roundNumber <= 17) return 1   // jan: r12-17
  if (roundNumber <= 22) return 2   // feb: r18-22
  return 3                          // mar: slutspel r23+
}

export function generateMatchWeather(
  season: number,
  roundNumber: number,
  homeClub: Club,
  fixtureId: string,
  seed: number
): MatchWeather {
  void season
  const rand = mulberry32(seed)
  const month = roundToMonth(roundNumber)
  const climate = getClimateForRegionAndMonth(homeClub.region, month)

  // Temperature
  const temp = Math.round(climate.avgTemp + (rand() * climate.tempVariance * 2 - climate.tempVariance))

  // Condition
  let condition: WeatherCondition
  const r = rand()
  if (r < climate.heavySnowChance) {
    condition = WeatherCondition.HeavySnow
  } else if (r < climate.snowChance) {
    condition = WeatherCondition.LightSnow
  } else if (r < climate.snowChance + climate.fogChance) {
    condition = WeatherCondition.Fog
  } else if (temp > -2 && rand() < climate.thawChance) {
    condition = WeatherCondition.Thaw
  } else if (temp < -5) {
    condition = WeatherCondition.Clear
  } else {
    condition = WeatherCondition.Overcast
  }

  const snowfall = condition === WeatherCondition.LightSnow || condition === WeatherCondition.HeavySnow
  const windStrength = Math.round(rand() * rand() * 18)

  // Ice quality
  let iceQuality: IceQuality
  if (homeClub.hasArtificialIce) {
    iceQuality = rand() < 0.7 ? IceQuality.Excellent : IceQuality.Good
  } else if (condition === WeatherCondition.Thaw && temp > 0) {
    const r2 = rand()
    if (r2 < 0.15) iceQuality = IceQuality.Cancelled
    else if (r2 < 0.65) iceQuality = IceQuality.Poor
    else iceQuality = IceQuality.Moderate
  } else if (condition === WeatherCondition.Thaw && temp > -2) {
    const r2 = rand()
    if (r2 < 0.10) iceQuality = IceQuality.Poor
    else if (r2 < 0.40) iceQuality = IceQuality.Moderate
    else iceQuality = IceQuality.Good
  } else if (condition === WeatherCondition.HeavySnow) {
    iceQuality = rand() < 0.30 ? IceQuality.Moderate : IceQuality.Good
  } else if (temp < -10) {
    iceQuality = rand() < 0.70 ? IceQuality.Excellent : IceQuality.Good
  } else if (temp <= -5) {
    const r2 = rand()
    if (r2 < 0.20) iceQuality = IceQuality.Excellent
    else if (r2 < 0.60) iceQuality = IceQuality.Good
    else iceQuality = IceQuality.Moderate
  } else {
    const r2 = rand()
    if (r2 < 0.20) iceQuality = IceQuality.Excellent
    else if (r2 < 0.50) iceQuality = IceQuality.Good
    else iceQuality = IceQuality.Moderate
  }

  // Indoor arena overrides: stable ice, never cancelled
  if (homeClub.hasIndoorArena) {
    iceQuality = IceQuality.Good
  }

  // Effects
  let ballControlPenalty = 0
  let speedModifier = 1.0
  let injuryRiskModifier = 1.0
  let goalChanceModifier = 1.0
  let attendanceModifier = 1.0
  const cancelled = homeClub.hasIndoorArena ? false : iceQuality === IceQuality.Cancelled

  if (condition === WeatherCondition.HeavySnow) {
    ballControlPenalty = 15 + Math.round(rand() * 10)
    speedModifier = 0.85
    goalChanceModifier = 0.90
    attendanceModifier = 0.60
  } else if (condition === WeatherCondition.Thaw && iceQuality === IceQuality.Poor) {
    ballControlPenalty = 20 + Math.round(rand() * 10)
    speedModifier = 0.80
    injuryRiskModifier = 1.30
    goalChanceModifier = 0.85
    attendanceModifier = 0.70
  } else if (condition === WeatherCondition.Thaw && iceQuality === IceQuality.Moderate) {
    ballControlPenalty = 10 + Math.round(rand() * 8)
    speedModifier = 0.88
    injuryRiskModifier = 1.15
    goalChanceModifier = 0.92
    attendanceModifier = 0.75
  } else if (condition === WeatherCondition.LightSnow) {
    ballControlPenalty = 5 + Math.round(rand() * 7)
    speedModifier = 0.92
    goalChanceModifier = 0.95
    attendanceModifier = 0.85
  } else if (condition === WeatherCondition.Fog) {
    ballControlPenalty = 3 + Math.round(rand() * 5)
    goalChanceModifier = 0.90
    attendanceModifier = 0.75
  } else if (condition === WeatherCondition.Clear && temp < -15) {
    speedModifier = 1.05
    ballControlPenalty = Math.round(rand() * 5)
    attendanceModifier = 0.80
  } else if (condition === WeatherCondition.Clear) {
    ballControlPenalty = Math.round(rand() * 3)
  }

  // Ice quality additional effects
  if (iceQuality === IceQuality.Poor && !cancelled) {
    ballControlPenalty = Math.min(30, ballControlPenalty + 8)
    speedModifier = Math.min(speedModifier, 0.82)
    injuryRiskModifier = Math.max(injuryRiskModifier, 1.35)
  } else if (iceQuality === IceQuality.Excellent) {
    speedModifier = Math.min(1.1, speedModifier + 0.03)
  }

  const weather: Weather = { temperature: temp, condition, windStrength, iceQuality, snowfall, region: homeClub.region }
  const effects: WeatherEffects = { ballControlPenalty, speedModifier, injuryRiskModifier, goalChanceModifier, attendanceModifier, cancelled }

  return { fixtureId, weather, effects }
}

export function getWeatherEmoji(condition: WeatherCondition): string {
  switch (condition) {
    case WeatherCondition.Clear: return '☀️'
    case WeatherCondition.Overcast: return '☁️'
    case WeatherCondition.LightSnow: return '🌨'
    case WeatherCondition.HeavySnow: return '❄️'
    case WeatherCondition.Fog: return '🌫'
    case WeatherCondition.Thaw: return '🌧'
  }
}

export function getIceQualityLabel(quality: IceQuality): string {
  switch (quality) {
    case IceQuality.Excellent: return 'Utmärkt is'
    case IceQuality.Good: return 'Bra is'
    case IceQuality.Moderate: return 'Godkänd is'
    case IceQuality.Poor: return 'Dålig is'
    case IceQuality.Cancelled: return 'Inställd'
  }
}

export function getConditionLabel(condition: WeatherCondition): string {
  switch (condition) {
    case WeatherCondition.Clear: return 'Klart'
    case WeatherCondition.Overcast: return 'Mulet'
    case WeatherCondition.LightSnow: return 'Lätt snöfall'
    case WeatherCondition.HeavySnow: return 'Ymnigt snöfall'
    case WeatherCondition.Fog: return 'Dimma'
    case WeatherCondition.Thaw: return 'Töväder'
  }
}
