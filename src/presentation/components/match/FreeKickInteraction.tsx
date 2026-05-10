/**
 * FreeKickInteraction.tsx — Stålvallen redesign
 *
 * BATCH D-02. Uses InteractionShell with:
 * - timer.style = 'tag' (4s amber)
 * - SVG pitch: LED palette (amber kicker, red wall, steel-blue GK)
 * - Monospace LED sub-choice buttons (SKJUT / CHIP / KORT)
 * - cta.variant = 'copper'
 *
 * Mekanik (freeKickInteractionService) ORÖRD — rates, wall/distance modifiers.
 */
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

const CHOICES: { choice: FreeKickChoice; label: string; sublabel: string }[] = [
  { choice: 'shoot',    label: 'SKJUT',  sublabel: 'direkt' },
  { choice: 'chipPass', label: 'CHIP',   sublabel: 'chip' },
  { choice: 'layOff',   label: 'KORT',   sublabel: 'lay-off' },
]

/** SVG freekick schematic — Stålvallen LED palette */
function FreeKickPitchSVG({
  data, choice, rates, phase, onSetChoice,
}: {
  data: FreeKickInteractionData
  choice: FreeKickChoice
  rates: Record<FreeKickChoice, number>
  phase: InteractionPhase
  onSetChoice: (c: FreeKickChoice) => void
}) {
  // Ball position (bottom-center area)
  const ballX = 130, ballY = 125

  // Lane endpoints based on choice
  const lanes: Record<FreeKickChoice, { x2: number; y2: number; color: string }> = {
    shoot:    { x2: 130, y2: 14, color: '#FF3B0F' },
    chipPass: { x2: 100, y2: 50, color: '#FFAA00' },
    layOff:   { x2: 170, y2: 90, color: '#66FF33' },
  }

  return (
    <svg viewBox="0 0 260 150" style={{ width: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="igF" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A2628" />
          <stop offset="100%" stopColor="#0E1518" />
        </linearGradient>
        <marker id="arrFK" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={lanes[choice].color} />
        </marker>
      </defs>

      {/* Ice */}
      <rect width="260" height="150" fill="url(#igF)" rx="3" />

      {/* Goal outline */}
      <rect x="75" y="4" width="110" height="20" fill="none" stroke="rgba(180,200,210,0.55)" strokeWidth="1.5" rx="2" />
      <rect x="77" y="6" width="106" height="16" fill="rgba(255,255,255,0.04)" />

      {/* GK */}
      <circle cx="130" cy="16" r="6" fill="#0A0A0A" stroke="#6FB6E8" strokeWidth="1.4" />
      <text x="130" y="18.5" textAnchor="middle" fontSize="5" fill="#6FB6E8" fontFamily="monospace" fontWeight="700">MV</text>

      {/* Wall — red LED blocks */}
      <rect
        x={112} y="48"
        width={Math.max(12, data.wallSize * 9)} height="12"
        rx="3" fill="#FF3B0F" opacity="0.75"
      />
      <text x="130" y="75" textAnchor="middle" fontSize="6" fill="rgba(180,200,210,0.4)" fontFamily="monospace">
        MUR · {data.wallSize} MAN
      </text>

      {/* Distance marker */}
      <line x1="130" y1="82" x2="130" y2="118" stroke="rgba(180,200,210,0.2)" strokeWidth="0.8" strokeDasharray="3,2" />
      <text x="145" y="103" fontSize="6" fill="rgba(180,200,210,0.4)" fontFamily="monospace">{data.distanceMeters}m</text>

      {/* Shot lane to chosen target */}
      <path
        d={`M${ballX},${ballY} Q${(ballX + lanes[choice].x2) / 2},${(ballY + lanes[choice].y2) / 2} ${lanes[choice].x2},${lanes[choice].y2}`}
        fill="none" stroke={lanes[choice].color} strokeWidth="1.5" strokeDasharray="3,2" opacity="0.85"
        markerEnd="url(#arrFK)"
      />

      {/* Ball */}
      <circle cx={ballX} cy={ballY} r="5" fill="#FFAA00" stroke="#fff" strokeWidth="1.5" />
      {/* Kicker name */}
      <text x={ballX} y={ballY + 14} textAnchor="middle" fontSize="6" fill="#FFAA00" fontFamily="monospace" fontWeight="700">
        {data.kickerName.split(' ').pop()}
      </text>

      {/* Choice lanes (dim — all 3 visible, active one is bright) */}
      {(Object.entries(lanes) as [FreeKickChoice, typeof lanes[FreeKickChoice]][]).map(([c, lane]) => {
        const isActive = choice === c
        const rate = rates[c]
        return (
          <g key={c} opacity={isActive ? 1 : 0.3}
            onClick={() => phase === 'choosing' && onSetChoice(c)}
            style={{ cursor: phase === 'choosing' ? 'pointer' : 'default' }}
          >
            <text
              x={lane.x2 + (c === 'layOff' ? 8 : -8)} y={lane.y2}
              textAnchor={c === 'layOff' ? 'start' : 'end'}
              fontSize="5.5" fill={lane.color} fontFamily="monospace" fontWeight="700"
              style={{ pointerEvents: 'none' }}
            >{Math.round(rate * 100)}%</text>
          </g>
        )
      })}
    </svg>
  )
}

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

  const choiceLabels: Record<FreeKickChoice, string> = { shoot: 'SKJUT', chipPass: 'CHIP', layOff: 'KORT' }

  return (
    <InteractionShell
      icon="🏒"
      title="FRISLAG"
      minute={data.minute ?? 0}
      timer={{ seconds: 4, style: 'tag' }}
      pitch={
        <FreeKickPitchSVG
          data={data}
          choice={choice}
          rates={rates}
          phase={phase}
          onSetChoice={setChoice}
        />
      }
      subChoices={subChoicesNode}
      readout={{ label: choiceLabels[choice], pct: Math.round(rates[choice] * 100) }}
      coachTip={coachTip}
      coach={coach}
      cta={{ label: 'Slå frislaget →', variant: 'copper', onClick: () => handleConfirm() }}
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
          {outcome.type === 'goal' ? '🏒 MÅL! ' : ''}{outcome.description}
        </p>
      ) : null}
      onTimeout={() => handleConfirm('shoot')}
    />
  )
}
