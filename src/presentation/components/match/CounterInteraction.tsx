/**
 * CounterInteraction.tsx — Stålvallen redesign
 *
 * BATCH D-04. Uses InteractionShell with:
 * - timer: 5s (T5b, 2026-07-13/14: ringen — se InteractionShell)
 * - SVG pitch: LED palette (amber runner + support, red defenders + GK steel-blue)
 * - Monospace LED sub-choice buttons (BRYT / SPELA AV / BYGG)
 * - cta.variant = 'copper'
 *
 * Mekanik (counterAttackInteractionService) ORÖRD — rates, speed/defender modifiers.
 */
import { useState, useEffect } from 'react'
import type { CounterInteractionData, CounterOutcome, CounterChoice } from '../../../domain/services/counterAttackInteractionService'
import { counterChoiceSuccessRates } from '../../../domain/services/counterAttackInteractionService'
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

const CHOICES: { choice: CounterChoice; label: string }[] = [
  { choice: 'sprint',    label: 'BRYT' },
  { choice: 'earlyBall', label: 'SPELA AV' },
  { choice: 'build',     label: 'BYGG' },
]

/** SVG counter schematic — LED palette */
function CounterPitchSVG({
  data, choice,
}: {
  data: CounterInteractionData
  choice: CounterChoice
}) {
  // Lane color by choice
  const laneColors: Record<CounterChoice, string> = {
    sprint:    'var(--led-attack)',
    earlyBall: 'var(--led-green)',
    build:     'var(--led-amber)',
  }

  return (
    <svg viewBox="0 0 260 120" style={{ width: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="igCtr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--interaction-pitch-start)" />
          <stop offset="100%" stopColor="var(--interaction-pitch-end)" />
        </linearGradient>
        <marker id="arrCtr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={laneColors[choice]} />
        </marker>
      </defs>

      {/* Ice */}
      <rect width="260" height="120" fill="url(#igCtr)" rx="3" />
      {/* Halfway line */}
      <line x1="0" y1="60" x2="260" y2="60" stroke="rgba(180,200,210,0.12)" strokeWidth="0.5" />

      {/* Goal */}
      <rect x="100" y="2" width="60" height="14" fill="none" stroke="rgba(180,200,210,0.55)" strokeWidth="1.5" rx="2" />

      {/* GK */}
      <circle cx="130" cy="12" r="5" fill="var(--led-bg)" stroke="var(--led-them)" strokeWidth="1.4" />
      <text x="130" y="14.5" textAnchor="middle" fontSize="5" fill="var(--led-them)" fontFamily="monospace" fontWeight="700">MV</text>

      {/* Defenders — red LED (2 positioned to defend) */}
      <circle cx="112" cy="34" r="6" fill="var(--led-attack)" opacity="0.75" />
      <text x="112" y="36.5" textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.8)" fontFamily="monospace" fontWeight="700">X</text>
      <circle cx="148" cy="30" r="6" fill="var(--led-attack)" opacity="0.75" />
      <text x="148" y="32.5" textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.8)" fontFamily="monospace" fontWeight="700">X</text>

      {/* Runner — amber LED, pulsing */}
      <circle cx="100" cy="70" r="8" fill="var(--led-amber)" stroke="rgba(255,255,255,0.4)" strokeWidth="2" className="pulse" />
      <text x="100" y="86" textAnchor="middle" fontSize="6" fill="var(--led-amber)" fontFamily="monospace" fontWeight="700">
        {data.runnerName.split(' ').pop()}
      </text>

      {/* Support player */}
      <circle cx="158" cy="80" r="6" fill="var(--led-amber)" opacity="0.6" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <text x="158" y="94" textAnchor="middle" fontSize="6" fill="rgba(255,170,0,0.7)" fontFamily="monospace">
        {data.supportName.split(' ').pop()}
      </text>

      {/* Active run lane to goal */}
      <path
        d={`M100,62 Q${choice === 'sprint' ? '115,40' : choice === 'earlyBall' ? '130,50' : '145,45'} 130,16`}
        fill="none" stroke={laneColors[choice]} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.9"
        markerEnd="url(#arrCtr)"
      />

      {/* Situation label */}
      <text x="215" y="106" textAnchor="end" fontSize="6" fill="rgba(180,200,210,0.4)" fontFamily="monospace">
        {data.defendersBeat === 1 ? '1 MOT 1' : data.defendersBeat === 2 ? '2 MOT 1' : '3 MOT 2'}
      </text>
    </svg>
  )
}

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

  const choiceLabels: Record<CounterChoice, string> = { sprint: 'BRYT', earlyBall: 'SPELA AV', build: 'BYGG' }

  const subChoicesNode = (
    <div className="interaction-sub-choices-row">
      {CHOICES.map(({ choice: c, label }) => {
        const isSelected = choice === c
        return (
          <button
            key={c}
            onClick={() => phase === 'choosing' && setChoice(c)}
            className={`interaction-sub-btn ${isSelected ? 'interaction-sub-btn-selected' : 'interaction-sub-btn-unselected'}`}
            style={{ cursor: phase === 'choosing' ? 'pointer' : 'default' }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )

  return (
    <InteractionShell
      icon="⚡"
      title="KONTRING"
      // T5c/UT-2: fold-hint-uppmaning väntar på Fables textdömning (BACKLOG UT-2)
      foldHintPrompt="[Opus]"
      minute={data.minute}
      timer={{ seconds: 5 }}
      pitch={
        <CounterPitchSVG
          data={data}
          choice={choice}
        />
      }
      subChoices={subChoicesNode}
      readout={{ label: choiceLabels[choice], pct: Math.round(rates[choice] * 100) }}
      coachTip={coachTip}
      coach={coach}
      cta={{ label: 'Kör kontringen', variant: 'copper', onClick: () => handleConfirm() }}
      phase={phase}
      outcome={outcome ? (
        <p style={{
          fontSize: 11,
          color: outcome.type === 'goal' ? 'var(--copper)' : 'rgba(245,241,235,0.65)',
          fontWeight: outcome.type === 'goal' ? 700 : 400,
          fontStyle: outcome.type !== 'goal' ? 'italic' : 'normal',
          fontFamily: outcome.type !== 'goal' ? 'var(--font-display)' : 'var(--font-mono)',
          margin: 0,
        }}>
          {outcome.type === 'goal' ? 'MÅL! ' : ''}{outcome.description}
        </p>
      ) : null}
      onTimeout={() => handleConfirm('earlyBall')}
    />
  )
}
