import { useState } from 'react'
import type { LastMinutePressData, PressChoice } from '../../../domain/services/lastMinutePressService'

interface LastMinutePressProps {
  data: LastMinutePressData
  onChoose: (choice: PressChoice) => void
}

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
      <div className="card-sharp" style={{ padding: '12px 14px', borderLeft: '3px solid var(--danger)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--danger)', margin: 0 }}>
            ⏰ {data.minute}:e MINUTEN
          </p>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{minutesLeft} min kvar</span>
        </div>

        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
          Ni ligger under. Dags att bestämma.
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
          Laget känner av matchbilden.
        </p>

        {!confirmed && (
          <>
            {([
              { c: 'allIn' as PressChoice, icon: '🔥', label: 'Allt fram!', sub: 'Hög risk. Målvakten fram.' },
              { c: 'pushForward' as PressChoice, icon: '💪', label: 'Tryck på', sub: 'Balanserat. Öka tempot.' },
              { c: 'acceptResult' as PressChoice, icon: '🧘', label: 'Acceptera', sub: 'Spara energi. Nästa match.' },
            ] as const).map(({ c, icon, label, sub }) => (
              <button
                key={c}
                onClick={() => setChoice(c)}
                style={{
                  width: '100%', padding: '10px 12px', marginBottom: 6,
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: choice === c ? 'rgba(196,122,58,0.12)' : 'var(--bg-elevated)',
                  border: `2px solid ${choice === c ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: choice === c ? 700 : 500, color: choice === c ? 'var(--accent)' : 'var(--text-primary)' }}>{label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</div>
                </div>
              </button>
            ))}

            <button
              onClick={handleConfirm}
              className="btn btn-copper"
              style={{ width: '100%', padding: '11px', fontSize: 13, fontWeight: 700, marginTop: 4 }}
            >
              BESTÄM →
            </button>
          </>
        )}

        {confirmed && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {choice === 'allIn' ? 'Laget kastar allt framåt.' : choice === 'pushForward' ? 'Trycket ökar.' : 'Laget spelar ut matchen lugnt.'}
          </p>
        )}
      </div>
    </div>
  )
}
