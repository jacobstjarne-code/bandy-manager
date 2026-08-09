/**
 * SLUTTEST RUNDA 4 (2026-08-08, punkt 3) — "vädret syns inte i snabbläget".
 * getGranskaWeatherEffectLine läser sparad MatchWeather-data (funkar oavsett
 * simuleringsläge, till skillnad från live-kommentaren som bara genereras i
 * mode:'full'). Villkorsordning: nederbörd/sikt FÖRE extremkyla.
 */
import { describe, it, expect } from 'vitest'
import { getGranskaWeatherEffectLine } from '../presentation/screens/granska/GranskaOversikt'
import { WeatherCondition, IceQuality } from '../domain/enums'
import type { Weather } from '../domain/entities/Weather'

function makeWeather(overrides: Partial<Weather>): Weather {
  return { temperature: 0, condition: WeatherCondition.Clear, windStrength: 5, iceQuality: IceQuality.Good, snowfall: false, region: 'Uppland', ...overrides }
}

describe('getGranskaWeatherEffectLine', () => {
  it('undefined weather → ingen rad', () => {
    expect(getGranskaWeatherEffectLine(undefined)).toBeNull()
  })

  it('Thaw → regn/knottrig is-raden', () => {
    expect(getGranskaWeatherEffectLine(makeWeather({ condition: WeatherCondition.Thaw })))
      .toBe('Det regnade. Isen var knottrig hela matchen.')
  })

  it('HeavySnow → drivor-raden', () => {
    expect(getGranskaWeatherEffectLine(makeWeather({ condition: WeatherCondition.HeavySnow })))
      .toBe('Ymnigt snöfall. Bollen dog i drivorna.')
  })

  it('LightSnow → trögare boll-raden', () => {
    expect(getGranskaWeatherEffectLine(makeWeather({ condition: WeatherCondition.LightSnow })))
      .toBe('Lätt snöfall över isen. Bollen gick trögare än den brukar.')
  })

  it('Fog → dimma-raden', () => {
    expect(getGranskaWeatherEffectLine(makeWeather({ condition: WeatherCondition.Fog })))
      .toBe('Dimman låg tät. Långt spel var ingen idé.')
  })

  it('temp under -15 med Clear condition → sträng kyla-raden', () => {
    expect(getGranskaWeatherEffectLine(makeWeather({ condition: WeatherCondition.Clear, temperature: -18 })))
      .toBe('Sträng kyla. Bollen studsade hårt och händerna domnade.')
  })

  it('temp exakt -15 räknas INTE som sträng kyla (villkoret är under -15)', () => {
    expect(getGranskaWeatherEffectLine(makeWeather({ condition: WeatherCondition.Clear, temperature: -15 })))
      .toBeNull()
  })

  it('kyla + snöfall samtidigt → nederbörden vinner, inte kyla-raden', () => {
    expect(getGranskaWeatherEffectLine(makeWeather({ condition: WeatherCondition.HeavySnow, temperature: -20 })))
      .toBe('Ymnigt snöfall. Bollen dog i drivorna.')
  })

  it('Clear/Overcast utan extremkyla → ingen rad, tystnad är information', () => {
    expect(getGranskaWeatherEffectLine(makeWeather({ condition: WeatherCondition.Clear, temperature: 2 }))).toBeNull()
    expect(getGranskaWeatherEffectLine(makeWeather({ condition: WeatherCondition.Overcast, temperature: -3 }))).toBeNull()
  })
})
