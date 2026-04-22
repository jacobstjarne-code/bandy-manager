import { useState, useEffect } from 'react'
import type { CounterInteractionData, CounterOutcome, CounterChoice } from '../../../domain/services/counterAttackInteractionService'
import { counterChoiceSuccessRates, formatCounterRate } from '../../../domain/services/counterAttackInteractionService'
import { InteractionShell } from './InteractionShell'
import type { InteractionPhase } from './InteractionShell'
import type { AssistantCoach } from '../../../domain/entities/AssistantCoach'
import { generateCoachQuote } from '../../../domain/services/assistantCoachService'

interface CounterInteractionProps {
  data: CounterInteractionData
  outcome: CounterOutcome | null
  onChoose: (choice: CounterChoice) => void
  coach?: AssistantCoach
}

const CHOICES: { choice: CounterChoice; emoji: string; label: string }[] = [
  { choice: 'sprint',    emoji: '⚡', label: 'Bryter igenom' },
  { choice: 'earlyBall', emoji: '🎯', label: 'Spela av' },
  { choice: 'build',     emoji: '🧠', label: 'Bygga upp' },
]

export function CounterInteraction({ data, outcome, onChoose, coach }: CounterInteractionProps) {
  const [choice, setChoice] = useState<CounterChoice>('earlyBall')
  const [phase, setPhase] = useState<InteractionPhase>('choosing')

  const rates = counterChoiceSuccessRates(data)

  const coachTip = coach ? generateCoachQuote(coach, {
    type: 'counter',
    sub: data.runnerSpeed > 70 ? 'fast-runner' : data.defendersBeat >= 2 ? 'outnumbered' : 'default',
    playerName: data.runnerName.split('. ')[1] ?? data.runnerName,
  }) : undefined

  useEffect(() => {
    if (!outcome) return
    setPhase('locked')
    const t = setTimeout(() => setPhase('revealed'), 600)
    return () => clearTimeout(t)
  }, [outcome])

  function handleConfirm(c = choice) {
    if (phase !== 'choosing') return
    setPhase('locked')
    onChoose(c)
  }

  const defText = data.defendersBeat === 1 ? '1 mot 1' : data.defendersBeat === 2 ? '2 mot 1' : '3 mot 2'

  const pitchNode = (
    <>
      <svg viewBox="0 0 260 120" width="100%" style={{ display: 'block', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
        <defs>
          <linearGradient id="igC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bg)" />
            <stop offset="100%" stopColor="var(--border)" />
          </linearGradient>
          <marker id="arC" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0L10 5L0 10z" fill="var(--accent)" />
          </marker>
        </defs>
        <rect width="260" height="120" fill="url(#igC)" rx="4" />
        <rect x="100" y="2" width="60" height="14" fill="none" stroke="#999" strokeWidth="1.5" rx="2" />
        <circle cx="130" cy="12" r="5" fill="var(--bg-leather)" opacity="0.7" />
        <text x="130" y="15" textAnchor="middle" fontSize="5" fill="white" fontWeight="700">MV</text>
        <circle cx="112" cy="34" r="6" fill="var(--danger)" opacity="0.6" />
        <text x="112" y="37" textAnchor="middle" fontSize="5" fill="white">X</text>
        <circle cx="148" cy="30" r="6" fill="var(--danger)" opacity="0.6" />
        <text x="148" y="33" textAnchor="middle" fontSize="5" fill="white">X</text>
        <circle cx="100" cy="70" r="8" fill="var(--accent)" stroke="#fff" strokeWidth="2" />
        <text x="100" y="86" textAnchor="middle" fontSize="6" fill="var(--accent)" fontWeight="600">
          {data.runnerName.split(' ').pop()}
        </text>
        <circle cx="158" cy="80" r="6" fill="var(--accent)" opacity="0.6" stroke="#fff" strokeWidth="1.5" />
        <text x="158" y="94" textAnchor="middle" fontSize="6" fill="var(--text-light-secondary)">
          {data.supportName.split(' ').pop()}
        </text>
        <line x1="100" y1="62" x2="115" y2="42" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arC)" />
      </svg>

      <div style={{ display: 'flex', gap: 5 }}>
        {CHOICES.map(({ choice: c, emoji, label }) => {
          const rate = rates[c]
          const isSelected = choice === c
          return (
            <button
              key={c}
              onClick={() => phase === 'choosing' && setChoice(c)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '8px 4px', borderRadius: 8,
                border: `1.5px solid ${isSelected ? 'var(--accent)' : 'rgba(196,122,58,0.25)'}`,
                background: isSelected ? 'var(--bg-dark-elevated)' : 'var(--bg-dark-surface)',
                cursor: phase === 'choosing' ? 'pointer' : 'default',
              }}
            >
              <span style={{ fontSize: 16 }}>{emoji}</span>
              <span style={{ color: 'var(--text-light)', fontSize: 10, fontWeight: 600, textAlign: 'center' }}>{label}</span>
              <span style={{ color: isSelected ? 'var(--accent)' : 'var(--text-light-secondary)', fontSize: 10, fontWeight: 700 }}>
                {formatCounterRate(rate)}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )

  return (
    <InteractionShell
      icon="⚡"
      title="KONTRING"
      minute={data.minute}
      timerSeconds={5}
      stats={
        <>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)' }}>
            {data.runnerName} slår igenom!
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-light-secondary)', marginLeft: 'auto' }}>{defText}</span>
        </>
      }
      pitch={pitchNode}
      coachTip={coachTip}
      coach={coach}
      actions={
        <button onClick={() => handleConfirm()} className="btn btn-primary" style={{ width: '100%', marginTop: 6 }}>
          KÖR KONTRINGEN →
        </button>
      }
      phase={phase}
      outcome={outcome ? (
        <div style={{
          background: outcome.type === 'goal' ? 'rgba(196,122,58,0.15)' : 'var(--bg-dark-surface)',
          borderLeft: outcome.type === 'goal' ? '3px solid var(--accent)' : '3px solid var(--bg-dark-elevated)',
          padding: '6px 8px', borderRadius: 4,
        }}>
          <p style={{ fontSize: 12, fontWeight: outcome.type === 'goal' ? 700 : 400, color: outcome.type === 'goal' ? 'var(--accent)' : 'var(--text-light-secondary)', margin: 0 }}>
            {outcome.type === 'goal' ? '🏒 MÅL! ' : ''}{outcome.description}
          </p>
        </div>
      ) : null}
      onTimeout={() => handleConfirm('earlyBall')}
    />
  )
}
