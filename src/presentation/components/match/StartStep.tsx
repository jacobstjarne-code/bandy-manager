import type { Tactic } from '../../../domain/entities/Club'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { MatchWeather } from '../../../domain/entities/Weather'
import { WeatherCondition } from '../../../domain/enums'
// Weather display moved to MatchHeader
import { getRivalry } from '../../../domain/data/rivalries'
import { tacticRows } from '../../utils/tacticData'

function tacticLabel(key: keyof Tactic, value: string): string {
  const row = tacticRows.find(r => r.key === key)
  const opt = row?.options.find(o => o.value === value)
  return opt?.label ?? value
}

function getPreMatchAtmosphere(
  fixture: Fixture,
  weather: MatchWeather | undefined,
  isHome: boolean,
  fanMood: number,
): string {
  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)
  if (rivalry) {
    const t = ['Derbystämning. Du hör bortaläktaren redan från omklädningsrummet.',
      'Derby. Tre poäng räcker inte — det här handlar om stolthet.',
      `${rivalry.name}. Hela orten pratar om den här matchen.`]
    return t[Math.floor(Math.random() * t.length)]
  }
  if (fixture.isKnockout) {
    const t = ['Allt har lett fram till det här. Förloraren åker hem.',
      'Slutspel. Inga andra chanser. Allt eller inget.']
    return t[Math.floor(Math.random() * t.length)]
  }
  if (fixture.isCup) return 'Cupmatch. En chans. Vinn eller åk hem.'
  if (weather?.weather.condition === WeatherCondition.HeavySnow)
    return 'Snön vräker ner. Det här blir en fight, inte en uppvisning.'
  if (weather?.weather.condition === WeatherCondition.Fog)
    return 'Dimma över planen. Strålkastarna kämpar mot mörkret.'
  if (weather?.weather.condition === WeatherCondition.Thaw)
    return 'Plusgrader och blöt is. Inte en dag för fint spel.'
  if (isHome && fanMood > 65) {
    const t = ['Strålkastarna lyser upp planen. Publiken strömmar in.',
      'Hemmamatch. Planen är preparerad. Laget är redo.']
    return t[Math.floor(Math.random() * t.length)]
  }
  if (isHome && fanMood < 35)
    return 'Glest på läktarna. De som kommit väntar på att bli övertygade.'
  if (!isHome) {
    const t = ['Bortaplan. Lång bussresa bakom er. Dags att visa varför ni kom.',
      'Borta. Liten klick supportrar har följt med. Gör det värt resan.']
    return t[Math.floor(Math.random() * t.length)]
  }
  return 'Omklädningsrummet är tyst. Alla vet vad som gäller.'
}

interface StartStepProps {
  startingIds: string[]
  tacticState: Tactic
  matchWeatherData: MatchWeather | undefined
  useLiveMode: boolean
  lineupError: string | null
  onSetLiveMode: (v: boolean) => void
  onBack: () => void
  onPlay: () => void
  fixture?: Fixture
  isHome?: boolean
  fanMood?: number
}

export function StartStep({ startingIds, tacticState, matchWeatherData, useLiveMode, lineupError, onSetLiveMode, onBack, onPlay, fixture, isHome, fanMood }: StartStepProps) {
  return (
    <div style={{ padding: '0 12px 24px' }}>
      {/* Atmosphere */}
      {fixture && (
        <div className="card-round" style={{
          marginBottom: 12, padding: '14px 16px',
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 14,
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
        }}>
          {getPreMatchAtmosphere(fixture, matchWeatherData, isHome ?? true, fanMood ?? 50)}
        </div>
      )}

      {/* Summary */}
      <div className="card-sharp" style={{ marginBottom: 10, padding: '12px 14px' }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>📋 Sammanfattning</p>
        {[
          { label: 'Startspelare', value: `${startingIds.length} valda ✓`, color: 'var(--success)' },
          { label: 'Mentalitet', value: tacticLabel('mentality', tacticState.mentality) },
          { label: 'Tempo', value: tacticLabel('tempo', tacticState.tempo) },
          { label: 'Press', value: tacticLabel('press', tacticState.press) },
          { label: 'Passning', value: tacticLabel('passingRisk', tacticState.passingRisk) },
          { label: 'Hörnstrategi', value: tacticLabel('cornerStrategy', tacticState.cornerStrategy) },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: row.color ?? 'var(--text-primary)' }}>{row.value}</span>
          </div>
        ))}
      </div>


      {/* Live / Snabbsim toggle */}
      <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>🎮 Spelläge</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button onClick={() => onSetLiveMode(true)} style={{
          flex: 1, padding: '12px 8px',
          background: useLiveMode ? 'rgba(196,122,58,0.12)' : 'var(--bg-elevated)',
          border: `2px solid ${useLiveMode ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)', cursor: 'pointer',
        }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>🎙</div>
          <div style={{ fontSize: 13, fontWeight: useLiveMode ? 700 : 500, color: useLiveMode ? 'var(--accent)' : 'var(--text-secondary)' }}>Live</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Följ händelserna</div>
        </button>
        <button
          onClick={() => onSetLiveMode(false)}
          style={{
            flex: 1, padding: '12px 8px',
            background: !useLiveMode ? 'rgba(196,122,58,0.12)' : 'var(--bg-elevated)',
            border: `2px solid ${!useLiveMode ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
          }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>⏩</div>
          <div style={{ fontSize: 13, fontWeight: !useLiveMode ? 700 : 500, color: !useLiveMode ? 'var(--accent)' : 'var(--text-secondary)' }}>Snabbsim</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Direkt resultat</div>
        </button>
      </div>

      {lineupError && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>
          {lineupError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onBack} className="btn btn-outline" style={{
          flex: 1, padding: '13px', fontSize: 14,
        }}>
          ← Ändra taktik
        </button>
        <button onClick={onPlay} className="btn btn-copper" style={{
          flex: 2, padding: '13px', fontSize: 15, fontWeight: 700, letterSpacing: '0.3px',
        }}>
          SPELA MATCHEN →
        </button>
      </div>
    </div>
  )
}
