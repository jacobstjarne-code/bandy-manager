import { useState } from 'react'
import type { LastMinutePressData, PressChoice } from '../../../domain/services/lastMinutePressService'

interface LastMinutePressProps {
  data: LastMinutePressData
  onChoose: (choice: PressChoice) => void
}

const CHOICES = [
  { c: 'allIn' as PressChoice,       icon: '🔥', label: 'Allt fram!',  sub: 'Målvakten upp. Hög risk — hög chans.' },
  { c: 'pushForward' as PressChoice, icon: '💪', label: 'Tryck på',    sub: 'Öka tempot utan att tappa kontrollen.' },
  { c: 'acceptResult' as PressChoice,icon: '🧘', label: 'Acceptera',   sub: 'Spara energi. Nästa match viktigare.' },
]

export function LastMinutePress({ data, onChoose }: LastMinutePressProps) {
  const [choice, setChoice] = useState<PressChoice>('pushForward')
  const [confirmed, setConfirmed] = useState(false)

  function handleConfirm() {
    if (confirmed) return
    setConfirmed(true)
    onChoose(choice)
  }

  const minutesLeft = Math.round(data.stepsLeft * 1.5)

  return (
    <div style={{ margin: '6px 0' }}>
      <div style={{
        background: 'var(--bg-dark)',
        borderRadius: 12,
        padding: 16,
        border: '1.5px solid rgba(176,80,64,0.4)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}>

        {/* Title */}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--warning)', margin: '0 0 6px 0' }}>
          ⏰ SLUTMINUTERNA — {data.minute}' ({minutesLeft} min kvar)
        </p>

        {/* Situation text */}
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)', marginBottom: 2 }}>
          Ni ligger under. Dags att bestämma.
        </p>
        <p style={{ fontSize: 10, color: 'var(--text-light-secondary)', marginBottom: 12 }}>
          Trötthet: {data.fatigueLevel < 20 ? 'låg' : data.fatigueLevel < 40 ? 'medel' : 'hög'} · Utvisningsrisk vid press
        </p>

        {/* Stacked choice buttons */}
        {!confirmed && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {CHOICES.map(({ c, icon, label, sub }) => (
                <button
                  key={c}
                  onClick={() => setChoice(c)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8, textAlign: 'left',
                    border: `1.5px solid ${choice === c ? 'var(--danger)' : 'rgba(176,80,64,0.25)'}`,
                    background: choice === c ? 'rgba(176,80,64,0.15)' : 'var(--bg-dark-surface)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <p style={{ color: 'var(--text-light)', fontSize: 13, fontWeight: 700, margin: 0 }}>{label}</p>
                    <p style={{ color: 'var(--text-light-secondary)', fontSize: 10, margin: 0 }}>{sub}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleConfirm}
              style={{
                width: '100%', padding: 11, borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, var(--danger), #8B3E30)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                letterSpacing: '1px',
                boxShadow: '0 3px 10px rgba(176,80,64,0.4)',
              }}
            >
              BESTÄM →
            </button>
          </>
        )}

        {confirmed && (
          <p style={{ fontSize: 11, color: 'var(--text-light-secondary)', fontStyle: 'italic' }}>
            {choice === 'allIn' ? 'Laget kastar allt framåt.' : choice === 'pushForward' ? 'Trycket ökar.' : 'Laget spelar ut matchen lugnt.'}
          </p>
        )}
      </div>
    </div>
  )
}
