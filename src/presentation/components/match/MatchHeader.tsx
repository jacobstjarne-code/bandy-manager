import type { Fixture } from '../../../domain/entities/Fixture'
import type { Tactic } from '../../../domain/entities/Club'
import type { MatchWeather } from '../../../domain/entities/Weather'
import { WeatherCondition, TacticMentality, TacticTempo } from '../../../domain/enums'
import { getWeatherEmoji, getIceQualityLabel } from '../../../domain/services/weatherService'
import { getMatchAtmosphere, getCardTint } from '../../utils/matchAtmosphere'

interface MatchHeaderProps {
  fixture: Fixture
  homeClubName: string
  awayClubName: string
  isHome: boolean
  weather?: MatchWeather
  step: 'lineup' | 'tactic' | 'start'
  tactic?: Tactic
}

function getWeatherHint(condition: WeatherCondition): string | null {
  switch (condition) {
    case WeatherCondition.HeavySnow:
      return '⚠️ Tungt snöfall — kort passningsspel. Direktspel straffas hårt.'
    case WeatherCondition.LightSnow:
      return '⚠️ Snö straffar bollkontroll. Säkra passningar rekommenderas.'
    case WeatherCondition.Fog:
      return '⚠️ Dimma — spela centralt. Bredd fungerar dåligt i dålig sikt.'
    case WeatherCondition.Thaw:
      return '⚠️ Töväder — sänk tempot. Högt tempo ökar skaderisken.'
    case WeatherCondition.Clear:
      return '❄️ Bitande kyla. Isen är hård och snabb.'
    default:
      return null
  }
}

function getCoachQuote(tactic: Tactic): string {
  const m = tactic.mentality
  const t = tactic.tempo
  if (t === TacticTempo.High && m === TacticMentality.Offensive) return '"Vi kör från start. Press, press, press."'
  if (t === TacticTempo.Low && m === TacticMentality.Defensive) return '"Tålamod. Säkra bollar. Låt dem göra misstagen."'
  if (m === TacticMentality.Offensive) return '"Vi vill ha bollen. Sök djupled."'
  if (m === TacticMentality.Defensive) return '"Kompakt. Inga luckor. Vi slår till på kontringar."'
  if (tactic.width === 'wide') return '"Sprid spelet. Utnyttja ytorna."'
  return '"Vi kör vår grej. Fokus och disciplin."'
}

const MENTALITY_LABEL: Record<string, string> = {
  [TacticMentality.Offensive]: 'Offensivt', [TacticMentality.Balanced]: 'Balanserat', [TacticMentality.Defensive]: 'Defensivt',
}
const TEMPO_LABEL: Record<string, string> = {
  [TacticTempo.High]: 'Högt tempo', [TacticTempo.Normal]: 'Normalt', [TacticTempo.Low]: 'Lågt tempo',
}

export function MatchHeader({ fixture, homeClubName, awayClubName, isHome, weather, step, tactic }: MatchHeaderProps) {
  const atmo = getMatchAtmosphere(fixture)
  const tint = getCardTint(atmo.tint)
  const opponent = isHome ? awayClubName : homeClubName

  return (
    <div className="card-round" style={{
      margin: '0 12px 10px',
      padding: '14px 16px',
      background: tint !== 'transparent' ? tint : undefined,
      borderLeft: atmo.borderAccent ? `3px solid ${atmo.borderAccent}` : undefined,
    }}>
      {/* Match info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
          Omgång {fixture.roundNumber} · vs {opponent} · {isHome ? 'HEMMA' : 'BORTA'}
        </span>
      </div>

      {atmo.label && (
        <p style={{ fontSize: 11, fontWeight: 700, color: atmo.borderAccent ?? 'var(--accent)', marginBottom: 6 }}>
          {atmo.label}
        </p>
      )}

      {/* Weather — step 1+ */}
      {weather && (
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: step === 'lineup' ? 0 : 6 }}>
          {getWeatherEmoji(weather.weather.condition)}{' '}
          {weather.weather.temperature > 0 ? '+' : ''}{weather.weather.temperature}°C · {getIceQualityLabel(weather.weather.iceQuality)}
        </p>
      )}

      {/* Weather hint — step 2+ */}
      {(step === 'tactic' || step === 'start') && weather && (() => {
        const hint = getWeatherHint(weather.weather.condition)
        return hint ? (
          <p style={{ fontSize: 11, color: 'var(--warning)', marginBottom: step === 'tactic' ? 0 : 6 }}>
            {hint}
          </p>
        ) : null
      })()}

      {/* Tactic summary + coach quote — step 3 */}
      {step === 'start' && tactic && (
        <>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
            Taktik: {TEMPO_LABEL[tactic.tempo] ?? tactic.tempo} · {MENTALITY_LABEL[tactic.mentality] ?? tactic.mentality}
          </p>
          <p style={{ fontSize: 12, fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
            {getCoachQuote(tactic)}
          </p>
        </>
      )}
    </div>
  )
}
