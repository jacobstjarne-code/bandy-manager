import { useMemo } from 'react'
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

type MatchMode = 'full' | 'commentary' | 'quicksim' | 'silent'

interface StartStepProps {
  startingIds: string[]
  tacticState: Tactic
  matchWeatherData: MatchWeather | undefined
  matchMode: MatchMode
  lineupError: string | null
  onSetMatchMode: (m: MatchMode) => void
  onBack: () => void
  onPlay: () => void
  fixture?: Fixture
  isHome?: boolean
  fanMood?: number
  expectedAttendance?: number
  arenaName?: string
  ritualText?: string
}

export function StartStep({ startingIds, tacticState, matchWeatherData, matchMode, lineupError, onSetMatchMode, onBack, onPlay, fixture, isHome, fanMood, expectedAttendance, arenaName, ritualText }: StartStepProps) {
  const atmosphere = useMemo(
    () => fixture ? getPreMatchAtmosphere(fixture, matchWeatherData, isHome ?? true, fanMood ?? 50) : '',
    [fixture?.id]
  )

  return (
    <div style={{ padding: '0 12px 24px' }}>
      {/* Atmosphere */}
      {fixture && (
        <div className="card-round" style={{
          marginBottom: 12, padding: '10px 14px',
        }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>📣 Pep-talk</p>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 14,
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
            margin: 0,
          }}>
            {atmosphere}
          </p>
        </div>
      )}

      {/* Klacken ritual */}
      {ritualText && (
        <div className="card-round" style={{ marginBottom: 8, padding: '8px 14px' }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>📯 KLACKEN</p>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 11, lineHeight: 1.5, color: 'var(--text-muted)', margin: 0 }}>{ritualText}</p>
        </div>
      )}

      {/* Match context — attendance + arena */}
      {expectedAttendance != null && (
        <div className="card-sharp" style={{ marginBottom: 8, padding: '8px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              🏟️ {arenaName ?? 'Bandyplanen'}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              ~{expectedAttendance} åskådare
            </span>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="card-sharp" style={{ marginBottom: 8, padding: '10px 14px' }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>📋 Sammanfattning</p>
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


      {/* Match mode selector */}
      <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>🎮 Spelläge</p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {([
          { mode: 'full' as MatchMode, icon: '🎥', label: 'Full', desc: 'Alla interaktioner' },
          { mode: 'commentary' as MatchMode, icon: '📝', label: 'Kommentar', desc: 'Följ utan stopp' },
          { mode: 'quicksim' as MatchMode, icon: '⚡', label: 'Snabb', desc: 'Direkt resultat' },
          { mode: 'silent' as MatchMode, icon: '📰', label: 'Tyst', desc: 'Prosarapport' },
        ] as const).map(({ mode, icon, label, desc }) => (
          <button key={mode} onClick={() => onSetMatchMode(mode)} style={{
            flex: 1, padding: '10px 6px',
            background: matchMode === mode ? 'rgba(196,122,58,0.12)' : 'var(--bg-elevated)',
            border: `2px solid ${matchMode === mode ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)', cursor: 'pointer',
          }}>
            <div style={{ fontSize: 18, marginBottom: 3 }}>{icon}</div>
            <div style={{ fontSize: 12, fontWeight: matchMode === mode ? 700 : 500, color: matchMode === mode ? 'var(--accent)' : 'var(--text-secondary)' }}>{label}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
          </button>
        ))}
      </div>

      {lineupError && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>
          {lineupError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onBack} className="btn btn-outline" style={{
          flex: 1, padding: '13px', fontSize: 13,
        }}>
          ← Taktik
        </button>
        <button onClick={onPlay} className="btn btn-copper" style={{
          flex: 2, padding: '13px', fontSize: 14, fontWeight: 700, letterSpacing: '0.3px',
        }}>
          SPELA MATCHEN →
        </button>
      </div>
    </div>
  )
}
