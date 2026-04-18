import { useState, useEffect } from 'react'
import type { FreeKickInteractionData, FreeKickOutcome, FreeKickChoice } from '../../../domain/services/freeKickInteractionService'
import { InteractionShell } from './InteractionShell'
import type { InteractionPhase } from './InteractionShell'
import type { AssistantCoach } from '../../../domain/entities/AssistantCoach'
import { generateCoachQuote } from '../../../domain/services/assistantCoachService'

interface FreeKickInteractionProps {
  data: FreeKickInteractionData
  outcome: FreeKickOutcome | null
  onChoose: (choice: FreeKickChoice) => void
  coach?: AssistantCoach
}

const BASE_RATES: Record<FreeKickChoice, number> = { shoot: 0.28, chipPass: 0.22, layOff: 0.15 }

const CHOICES: { choice: FreeKickChoice; emoji: string; label: string }[] = [
  { choice: 'shoot',    emoji: '💥', label: 'Skjut' },
  { choice: 'chipPass', emoji: '⤴️', label: 'Chip' },
  { choice: 'layOff',   emoji: '↩️', label: 'Kort' },
]

export function FreeKickInteraction({ data, outcome, onChoose, coach }: FreeKickInteractionProps) {
  const [choice, setChoice] = useState<FreeKickChoice>('shoot')
  const [phase, setPhase] = useState<InteractionPhase>('choosing')

  const coachTip = coach ? generateCoachQuote(coach, {
    type: 'freekick',
    sub: data.wallSize <= 2 ? 'wall-small' : data.distanceMeters > 20 ? 'distance-long' : 'default',
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

  // Adjust rates based on wall size and distance
  const wallBonus = data.wallSize <= 2 ? 0.06 : data.wallSize >= 4 ? -0.04 : 0
  const distPenalty = data.distanceMeters > 22 ? -0.06 : data.distanceMeters < 14 ? 0.04 : 0
  const rates: Record<FreeKickChoice, number> = {
    shoot: Math.max(0.08, BASE_RATES.shoot + wallBonus + distPenalty),
    chipPass: Math.max(0.08, BASE_RATES.chipPass - distPenalty * 0.5),
    layOff: Math.max(0.08, BASE_RATES.layOff),
  }

  const pitchNode = (
    <>
      <svg viewBox="0 0 260 150" width="100%" style={{ display: 'block', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
        <defs>
          <linearGradient id="igF" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bg)" />
            <stop offset="100%" stopColor="var(--border)" />
          </linearGradient>
        </defs>
        <rect width="260" height="150" fill="url(#igF)" rx="4" />
        <rect x="75" y="4" width="110" height="20" fill="none" stroke="#888" strokeWidth="2" rx="2" />
        <rect x="77" y="6" width="106" height="16" fill="rgba(0,0,0,0.04)" />
        <circle cx="130" cy="16" r="6" fill="var(--bg-leather)" opacity="0.7" />
        <text x="130" y="19" textAnchor="middle" fontSize="5" fill="white" fontWeight="700">MV</text>
        <rect x="112" y="48" width={data.wallSize * 9} height="12" rx="3" fill="var(--danger)" opacity="0.75" />
        <text x="130" y="72" textAnchor="middle" fontSize="6" fill="#888">MUR · {data.wallSize} man</text>
        <line x1="130" y1="82" x2="130" y2="118" stroke="var(--border-dark)" strokeWidth="0.8" strokeDasharray="3,2" />
        <text x="145" y="102" fontSize="6" fill="#999">{data.distanceMeters}m</text>
        <circle cx="130" cy="125" r="5" fill="var(--accent)" stroke="#fff" strokeWidth="1.5" />
        <text x="130" y="140" textAnchor="middle" fontSize="6" fill="var(--accent)" fontWeight="600">
          {data.kickerName.split(' ').pop()}
        </text>
      </svg>

      <div style={{ display: 'flex', gap: 5 }}>
        {CHOICES.map(({ choice: c, emoji, label }) => {
          const rate = rates[c]
          const isSelected = choice === c
          return (
            <button key={c} onClick={() => phase === 'choosing' && setChoice(c)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '8px 4px', borderRadius: 8,
                border: `1.5px solid ${isSelected ? 'var(--accent)' : 'rgba(196,122,58,0.25)'}`,
                background: isSelected ? 'var(--bg-dark-elevated)' : 'var(--bg-dark-surface)',
                cursor: phase === 'choosing' ? 'pointer' : 'default',
              }}>
              <span style={{ fontSize: 16 }}>{emoji}</span>
              <span style={{ color: 'var(--text-light)', fontSize: 10, fontWeight: 600 }}>{label}</span>
              <span style={{ color: isSelected ? 'var(--accent)' : 'var(--text-light-secondary)', fontSize: 10, fontWeight: 700 }}>
                {Math.round(rate * 20) * 5}%
              </span>
            </button>
          )
        })}
      </div>
    </>
  )

  return (
    <InteractionShell
      icon="🏒"
      title="FRISLAG"
      minute={data.minute ?? 0}
      timerSeconds={5}
      stats={
        <>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)' }}>
            {data.kickerName.split(' ').slice(-2).join(' ')}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-light-secondary)', marginLeft: 'auto' }}>
            {data.distanceMeters}m · mur {data.wallSize} man
          </span>
        </>
      }
      pitch={pitchNode}
      coachTip={coachTip}
      coach={coach}
      actions={
        <button onClick={() => handleConfirm()} className="btn btn-primary" style={{ width: '100%', marginTop: 6 }}>
          SLÅ FRISLAGET →
        </button>
      }
      phase={phase}
      outcome={outcome ? (
        <div style={{ background: outcome.type === 'goal' ? 'rgba(196,122,58,0.15)' : 'var(--bg-dark-surface)', borderLeft: `3px solid ${outcome.type === 'goal' ? 'var(--accent)' : 'var(--bg-dark-elevated)'}`, padding: '6px 8px', borderRadius: 4 }}>
          <p style={{ fontSize: 12, fontWeight: outcome.type === 'goal' ? 700 : 400, color: outcome.type === 'goal' ? 'var(--accent)' : 'var(--text-light-secondary)', margin: 0 }}>
            {outcome.type === 'goal' ? '🏒 MÅL! ' : ''}{outcome.description}
          </p>
        </div>
      ) : null}
      onTimeout={() => handleConfirm('shoot')}
    />
  )
}
