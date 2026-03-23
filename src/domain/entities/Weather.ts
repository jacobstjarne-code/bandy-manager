import type { WeatherCondition, IceQuality } from '../enums'

export interface Weather {
  temperature: number
  condition: WeatherCondition
  windStrength: number
  iceQuality: IceQuality
  snowfall: boolean
  region: string
}

export interface WeatherEffects {
  ballControlPenalty: number
  speedModifier: number
  injuryRiskModifier: number
  goalChanceModifier: number
  attendanceModifier: number
  cancelled: boolean
}

export interface MatchWeather {
  fixtureId: string
  weather: Weather
  effects: WeatherEffects
}
