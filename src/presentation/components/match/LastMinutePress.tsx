/**
 * LastMinutePress.tsx — Stålvallen redesign
 *
 * BATCH B-02. Uses new InteractionShell with:
 * - timer: 8s (ringen — T5b, 2026-07-13/14: nu den enda representationen, delad med de fyra andra panelerna)
 * - riskRow always shown
 * - cta.variant = 'danger' ("Spräng igenom →")
 * - SVG pitch: hel plan, 10 amber spelare i högt formation, 5 röda risk-pilar
 *
 * Mekanik (lastMinutePressService) ORÖRD — rates, modifiers, default pushForward.
 */
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

const CHOICES: { c: PressChoice; label: string; rates: number }[] = [
  { c: 'allIn',        label: 'ALLT FRAM',  rates: 0.42 },
  { c: 'pushForward',  label: 'TRYCK PÅ',   rates: 0.28 },
  { c: 'acceptResult', label: 'HÅLL UT',    rates: 0.08 },
]

const RISK_ROW = ['FOUL +25', 'SLÄPPER IN +15', 'TIMEOUT → TRYCK PÅ']

/** SVG pitch schematic for last-minute press — hela plan, högt formation, röda risk-pilar */
function LastMinutePitchSVG({ choice }: { choice: PressChoice }) {
  // 10 amber player dots in high formation (4-3-3 pushed up)
  const players: [number, number][] = [
    // GK
    [50, 88],
    // Defenders (high line)
    [20, 68], [37, 70], [63, 70], [80, 68],
    // Midfielders
    [30, 50], [50, 48], [70, 50],
    // Forwards
    [28, 28], [50, 24], [72, 28],
  ]

  // Risk arrows (upward) from midfield zone
  const arrows: [number, number, number, number][] = [
    [25, 55, 25, 30],
    [37, 55, 35, 28],
    [50, 55, 50, 22],
    [63, 55, 65, 28],
    [75, 55, 75, 30],
  ]

  const activeColor = choice === 'allIn' ? 'var(--led-red)' : 'var(--led-amber)'

  return (
    <svg
      viewBox="0 0 100 100"
      style={{ width: '100%', height: 120, display: 'block' }}
    >
      {/* Plan outline */}
      <rect x="5" y="5" width="90" height="90" rx="2" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
      {/* Halvtidslinje */}
      <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
      {/* Mittcirkel */}
      <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      {/* Straffområde (övre) */}
      <rect x="25" y="5" width="50" height="18" rx="1" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
      {/* Mål (övre) */}
      <rect x="38" y="5" width="24" height="4" rx="1" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />

      {/* "ALLT FRAM" text label (only when allIn selected) */}
      {choice === 'allIn' && (
        <text x="50" y="17" textAnchor="middle" fill="var(--led-red)" fontSize="5" fontWeight="700" fontFamily="monospace" letterSpacing="1">
          ALLT FRAM
        </text>
      )}

      {/* Risk arrows */}
      {arrows.map(([x1, y1, x2, y2], i) => (
        <g key={i} opacity={choice === 'allIn' ? 1 : 0.5}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--led-red)" strokeWidth="0.8" strokeDasharray="2,1" />
          <polygon
            points={`${x2-1.5},${y2+2} ${x2+1.5},${y2+2} ${x2},${y2-1}`}
            fill="var(--led-red)"
          />
        </g>
      ))}

      {/* Player dots */}
      {players.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r="3"
          fill={i === 0 ? 'var(--steel)' : activeColor}
          opacity={i === 0 ? 0.8 : 0.9}
        />
      ))}
    </svg>
  )
}

export function LastMinutePress({ data, onChoose, coach }: LastMinutePressProps) {
  const [choice, setChoice] = useState<PressChoice>('pushForward')
  const [phase, setPhase] = useState<InteractionPhase>('choosing')

  const sub = data.scoreDiff < 0 ? 'chasing' : data.scoreDiff > 0 ? 'leading' : 'tied'
  const coachTip = coach ? generateCoachQuote(coach, {
    type: 'last-minute',
    sub,
    margin: Math.abs(data.scoreDiff),
  }) : undefined

  // Lärdom #7: phase is written by this effect — must NOT be in deps
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

  // Sub-choices — monospace LED buttons
  const subChoicesNode = (
    <div style={{ display: 'flex', gap: 6 }}>
      {CHOICES.map(({ c, label }) => {
        const isSelected = choice === c
        return (
          <button
            key={c}
            onClick={() => phase === 'choosing' && setChoice(c)}
            style={{
              flex: 1,
              padding: '8px 4px',
              background: isSelected ? 'rgba(102,255,51,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isSelected ? 'var(--led-green)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 4,
              color: isSelected ? 'var(--led-green)' : 'rgba(245,241,235,0.5)',
              fontFamily: 'var(--font-mono)',
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '0.8px',
              cursor: phase === 'choosing' ? 'pointer' : 'default',
              boxShadow: isSelected ? '0 0 6px rgba(102,255,51,0.3)' : 'none',
              textAlign: 'center',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )

  return (
    <InteractionShell
      icon="⏰"
      title="SLUTMINUTERNA"
      // T5c/UT-2: fold-hint-uppmaning, textdömd av Fable 2026-07-16
      foldHintPrompt="STÄLL IN LAGET"
      minute={data.minute}
      timer={{ seconds: 8 }}
      pitch={<LastMinutePitchSVG choice={choice} />}
      subChoices={subChoicesNode}
      readout={{ label: CHOICES.find(c => c.c === choice)?.label ?? '', pct: Math.round((CHOICES.find(c => c.c === choice)?.rates ?? 0) * 100) }}
      riskRow={RISK_ROW}
      coachTip={coachTip}
      coach={coach}
      cta={{ label: 'Spräng igenom', variant: 'danger', onClick: () => handleConfirm() }}
      phase={phase}
      outcome={
        phase === 'revealed' ? (
          <p style={{
            fontSize: 11,
            color: 'rgba(245,241,235,0.65)',
            fontStyle: 'italic',
            fontFamily: 'var(--font-display)',
            margin: 0,
          }}>
            {choice === 'allIn' ? 'Laget kastar allt framåt.' : choice === 'pushForward' ? 'Trycket ökar.' : 'Laget spelar ut matchen lugnt.'}
          </p>
        ) : null
      }
      onTimeout={() => handleConfirm('pushForward')}
    />
  )
}
