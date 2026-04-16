import type { Fixture } from '../entities/Fixture'
import type { MatchWeather } from '../entities/Weather'
import { WeatherCondition } from '../enums'

export interface AwayTrip {
  fixtureId: string
  hotel: 'pensionat' | 'mellanklass' | 'nice'
  extraMeal: boolean
  weatherWarning?: string
  mikrobeslut: 'stay_home' | 'book_nice' | 'ask_foundation' | null
}

export const HOTEL_NAMES: Record<AwayTrip['hotel'], string> = {
  pensionat: 'Pensionat Gamla Brukshotellet',
  mellanklass: 'Best Western',
  nice: 'Hotell Stadsparken',
}

export const RESOLVED_TEXTS: Record<'stay_home' | 'book_nice' | 'ask_foundation', string> = {
  stay_home: 'Laget åker samma kväll. Sena ankomster, trötta ben.',
  book_nice: 'Bättre hotell bokat. Truppen sover gott.',
  ask_foundation: 'Föreningen bekostar resan. Ekonomi klarad.',
}

export function generateAwayTrip(fixture: Fixture, matchWeather: MatchWeather | undefined): AwayTrip {
  const isHeavyWeather = matchWeather?.weather.condition === WeatherCondition.HeavySnow || (matchWeather?.weather.temperature ?? 0) < -15
  return {
    fixtureId: fixture.id,
    hotel: 'pensionat',
    extraMeal: false,
    weatherWarning: isHeavyWeather ? 'Snöoväder prognostiserat — 2h extra restid' : undefined,
    mikrobeslut: null,
  }
}
