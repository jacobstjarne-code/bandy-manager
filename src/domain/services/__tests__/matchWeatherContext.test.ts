import { describe, expect, it } from 'vitest'
import { IceQuality, WeatherCondition } from '../../enums'
import { pickWeatherCommentary } from '../matchUtils'

describe('kallväderskommentarer följer ismodellen', () => {
  it('beskriver inte bollen som trög på hård kall is', () => {
    const weather = {
      temperature: -18,
      condition: WeatherCondition.Clear,
      windStrength: 1,
      iceQuality: IceQuality.Excellent,
      snowfall: false,
      region: 'Norrland',
    }

    for (const roll of [0, 0.2, 0.4, 0.6, 0.8, 0.99]) {
      const line = pickWeatherCommentary(weather, () => roll, new Map())
      expect(line).not.toContain('går trögt i kylan')
    }
  })
})
