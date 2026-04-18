import { useState, useEffect } from 'react'
import type { LastMinutePressData, PressChoice } from '../../../domain/services/lastMinutePressService'
import { InteractionShell } from './InteractionShell'
import type { InteractionPhase } from './InteractionShell'
import type { AssistantCoach } from '../../../domain/entities/AssistantCoach'
import { generateCoachQuote } from '../../../domain/services/assistantCoachService'

interface LastMinutePressProps {
  data: LastMinutePressData
  onChoose: (choice: PressChoice) => void
  coach?: AssistantCoach
}

const CHOICES = [
  { c: 'allIn' as PressChoice,        icon: '🔥', label: 'Allt fram!', rates: 0.42 },
  { c: 'pushForward' as PressChoice,  icon: '💪', label: 'Tryck på',   rates: 0.28 },
  { c: 'acceptResult' as PressChoice, icon: '🧘', label: 'Acceptera',  rates: 0.08 },
]

export function LastMinutePress({ data, onChoose, coach }: LastMinutePressProps) {
  const [choice, setChoice] = useState<PressChoice>('pushForward')
  const [phase, setPhase] = useState<InteractionPhase>('choosing')

  const sub = data.scoreDiff < 0 ? 'chasing' : data.scoreDiff > 0 ? 'leading' : 'tied'
  const coachTip = coach ? generateCoachQuote(coach, {
    type: 'last-minute',
    sub,
    margin: Math.abs(data.scoreDiff),
  }) : undefined

  useEffect(() => {
    if (phase === 'locked') {
      const t = setTimeout(() => setPhase('revealed'), 400)
      return () => clearTimeout(t)
    }
    return undefined
  }, [phase])

  function handleConfirm(c = choice) {
    if (phase !== 'choosing') return
    setPhase('locked')
    onChoose(c)
  }

  const minutesLeft = Math.round(data.stepsLeft * 1.5)

  const pitchNode = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)', marginBottom: 2 }}>
        {data.scoreDiff < 0 ? 'Ni ligger under. Dags att bestämma.' : data.scoreDiff > 0 ? 'Ni leder. Håll ihop.' : 'Jämnt läge. Vad väljer du?'}
      </p>
      <p style={{ fontSize: 10, color: 'var(--text-light-secondary)', marginBottom: 8 }}>
        Trötthet: {data.fatigueLevel < 20 ? 'låg' : data.fatigueLevel < 40 ? 'medel' : 'hög'} · {minutesLeft} min kvar
      </p>
      {CHOICES.map(({ c, icon, label, rates }) => (
        <button key={c} onClick={() => phase === 'choosing' && setChoice(c)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, textAlign: 'left',
            border: `1.5px solid ${choice === c ? 'var(--danger)' : 'rgba(176,80,64,0.25)'}`,
            background: choice === c ? 'rgba(176,80,64,0.15)' : 'var(--bg-dark-surface)',
            cursor: phase === 'choosing' ? 'pointer' : 'default',
          }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--text-light)', fontSize: 12, fontWeight: 700, margin: 0 }}>{label}</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: choice === c ? 'var(--danger)' : 'var(--text-light-secondary)' }}>
            {Math.round(rates * 20) * 5}%
          </span>
        </button>
      ))}
    </div>
  )

  return (
    <InteractionShell
      icon="⏰"
      title="SLUTMINUTERNA"
      minute={data.minute}
      timerSeconds={8}
      pitch={pitchNode}
      coachTip={coachTip}
      coach={coach}
      actions={
        <button onClick={() => handleConfirm()} className="btn btn-danger" style={{ width: '100%', padding: 11, fontSize: 13, fontWeight: 700 }}>
          BESTÄM →
        </button>
      }
      phase={phase}
      outcome={
        phase === 'revealed' ? (
          <p style={{ fontSize: 11, color: 'var(--text-light-secondary)', fontStyle: 'italic' }}>
            {choice === 'allIn' ? 'Laget kastar allt framåt.' : choice === 'pushForward' ? 'Trycket ökar.' : 'Laget spelar ut matchen lugnt.'}
          </p>
        ) : null
      }
      onTimeout={() => handleConfirm('pushForward')}
    />
  )
}
