import { WeatherCondition } from '../../domain/enums'
import type { MatchWeather } from '../../domain/entities/Weather'

export interface WeatherAdviceItem {
  icon: string
  text: string
  severity: 'danger' | 'warning' | 'info' | 'positive'
  isViolated: boolean
}

export function getDetailedWeatherAdvice(
  weather: MatchWeather | undefined,
  tactic: { tempo: string; passingRisk: string; width: string; press: string; cornerStrategy: string }
): WeatherAdviceItem[] {
  if (!weather) return []
  const w = weather.weather
  const items: WeatherAdviceItem[] = []

  if (w.condition === WeatherCondition.HeavySnow) {
    items.push({
      icon: tactic.passingRisk === 'direct' ? '🚫' : '⚠️',
      text: tactic.passingRisk === 'direct'
        ? 'Direktspel i tungt snöfall: -10 extra bollkontrollpenalty'
        : 'Tungt snöfall — säkert passningsspel rekommenderas',
      severity: tactic.passingRisk === 'direct' ? 'danger' : 'warning',
      isViolated: tactic.passingRisk === 'direct',
    })
    if (tactic.tempo === 'high') {
      items.push({
        icon: '🚫',
        text: 'Högt tempo i snö: +15% fatigue per match',
        severity: 'danger',
        isViolated: true,
      })
    }
    if (tactic.cornerStrategy === 'aggressive') {
      items.push({
        icon: '✅',
        text: 'Aggressiva hörnor påverkas minimalt av snö — bra val',
        severity: 'positive',
        isViolated: false,
      })
    }
    if (tactic.passingRisk === 'safe') {
      items.push({
        icon: '✅',
        text: 'Säkert passningsspel fungerar bra i snö — bra val',
        severity: 'positive',
        isViolated: false,
      })
    }
  }

  if (w.condition === WeatherCondition.Thaw) {
    if (tactic.tempo === 'high') {
      items.push({
        icon: '🚫',
        text: 'Högt tempo på blöt is: extrem fatigue + markant ökad skaderisk',
        severity: 'danger',
        isViolated: true,
      })
    } else {
      items.push({
        icon: '💧',
        text: 'Blöt is — sänk tempot för att undvika skador',
        severity: 'warning',
        isViolated: false,
      })
    }
    if (tactic.press === 'high') {
      items.push({
        icon: '⚠️',
        text: 'Hög press på blöt is: +10% extra fatigue',
        severity: 'warning',
        isViolated: true,
      })
    }
    if (tactic.width === 'narrow') {
      items.push({
        icon: '✅',
        text: 'Smalt centralt spel fungerar bättre i töväder',
        severity: 'positive',
        isViolated: false,
      })
    }
  }

  if (w.condition === WeatherCondition.Fog) {
    if (tactic.width === 'wide') {
      items.push({
        icon: '🚫',
        text: 'Brett spel i dimma: långa passningar missar ofta',
        severity: 'danger',
        isViolated: true,
      })
    }
    if (tactic.passingRisk === 'direct') {
      items.push({
        icon: '🚫',
        text: 'Direktspel i dimma: svårt att sikta, tappade bollar',
        severity: 'danger',
        isViolated: true,
      })
    }
    if (tactic.width === 'narrow' && tactic.passingRisk === 'safe') {
      items.push({
        icon: '✅',
        text: 'Smalt centralt + säkert passningsspel: bästa val i dimma',
        severity: 'positive',
        isViolated: false,
      })
    } else if (tactic.width !== 'wide' && tactic.passingRisk !== 'direct') {
      items.push({
        icon: '💡',
        text: 'Dimma — spela centralt och kort för bäst effekt',
        severity: 'info',
        isViolated: false,
      })
    }
  }

  if (w.temperature < -15) {
    if (tactic.tempo === 'high') {
      items.push({
        icon: '⚠️',
        text: 'Extrem kyla + högt tempo: ökad skaderisk',
        severity: 'warning',
        isViolated: true,
      })
    }
    if (tactic.press === 'high') {
      items.push({
        icon: '⚠️',
        text: 'Hög press i extrem kyla: +10% extra fatigue',
        severity: 'warning',
        isViolated: true,
      })
    }
    if (tactic.tempo !== 'high' && tactic.press !== 'high') {
      items.push({
        icon: '🥶',
        text: `Extrem kyla (${w.temperature}°) — din taktik hanterar kylan bra`,
        severity: 'info',
        isViolated: false,
      })
    }
  }

  if ((w.condition === WeatherCondition.Clear || w.condition === WeatherCondition.Overcast) &&
      w.temperature >= -10 && w.temperature <= 5) {
    items.push({
      icon: '✅',
      text: 'Perfekta förhållanden — alla stilar fungerar',
      severity: 'positive',
      isViolated: false,
    })
  }

  return items
}
