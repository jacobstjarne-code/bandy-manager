/**
 * PenaltyInteraction.tsx — Stålvallen redesign
 *
 * BATCH D-03. Uses InteractionShell with:
 * - timer.style = 'tag' (4s amber)
 * - SVG pitch: goal front-view, LED zones (6 zones V/M/H × HÖGT/LÅGT),
 *   steel-blue GK, amber shooter dot, red shot lane
 * - Monospace LED sub-choice buttons (LÅGT / HÖGT)
 * - cta.variant = 'danger' ("Skjut straffen →")
 *
 * Mekanik (penaltyInteractionService) ORÖRD — DIR_RATES, height modifiers.
 */
import { useState, useEffect } from 'react'
import type { PenaltyInteractionData, PenaltyOutcome, PenaltyDirection, PenaltyHeight } from '../../../domain/services/penaltyInteractionService'
import { InteractionShell } from './InteractionShell'
import type { InteractionPhase } from './InteractionShell'
import type { AssistantCoach } from '../../../domain/entities/AssistantCoach'
import { generateCoachQuote } from '../../../domain/services/assistantCoachService'

interface PenaltyInteractionProps {
  data: PenaltyInteractionData
  outcome: PenaltyOutcome | null
  onChoose: (dir: PenaltyDirection, height: PenaltyHeight) => void
  coach?: AssistantCoach
}

const HEIGHT_OPTIONS: { key: PenaltyHeight; label: string }[] = [
  { key: 'low',  label: 'LÅGT' },
  { key: 'high', label: 'HÖGT' },
]
const DIR_RATES: Record<PenaltyDirection, number> = { left: 0.50, center: 0.35, right: 0.50 }

function combinedRate(d: PenaltyDirection, h: PenaltyHeight): number {
  return Math.max(0.10, Math.min(0.75, DIR_RATES[d] * (h === 'high' ? 0.85 : 1.0)))
}

/** SVG penalty schematic — front-view goal, 6 zones, LED palette */
function PenaltyPitchSVG({
  dir, height, phase, onSetDir,
}: {
  dir: PenaltyDirection
  height: PenaltyHeight
  phase: InteractionPhase
  onSetDir: (d: PenaltyDirection) => void
}) {
  const zones: { d: PenaltyDirection; x: number; label: string }[] = [
    { d: 'left',   x: 22, label: 'V' },
    { d: 'center', x: 94, label: 'M' },
    { d: 'right',  x: 168, label: 'H' },
  ]
  const zoneW = [70, 72, 70]

  // Zone Y for shot target (low = bottom third, high = top third)
  const zoneY = height === 'low' ? 72 : 22
  const dirXCenter = dir === 'left' ? 57 : dir === 'center' ? 130 : 203

  return (
    <svg viewBox="0 0 260 110" style={{ width: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="iceP" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--interaction-pitch-start)" />
          <stop offset="100%" stopColor="var(--interaction-pitch-end)" />
        </linearGradient>
        <marker id="arrP" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="var(--led-attack)" />
        </marker>
      </defs>

      <rect width="260" height="110" fill="url(#iceP)" rx="3" />

      {/* Goalposts */}
      <line x1="20" y1="10" x2="20" y2="90" stroke="rgba(180,200,210,0.7)" strokeWidth="2.5" />
      <line x1="240" y1="10" x2="240" y2="90" stroke="rgba(180,200,210,0.7)" strokeWidth="2.5" />
      <line x1="20" y1="10" x2="240" y2="10" stroke="rgba(180,200,210,0.7)" strokeWidth="2.5" />
      {/* Net lines */}
      <line x1="20" y1="90" x2="240" y2="90" stroke="rgba(180,200,210,0.2)" strokeWidth="0.8" strokeDasharray="4,2" />
      <line x1="93" y1="10" x2="93" y2="90" stroke="rgba(180,200,210,0.12)" strokeWidth="0.8" />
      <line x1="167" y1="10" x2="167" y2="90" stroke="rgba(180,200,210,0.12)" strokeWidth="0.8" />

      {/* Height divider */}
      <line x1="20" y1="50" x2="240" y2="50" stroke="rgba(180,200,210,0.08)" strokeWidth="0.5" strokeDasharray="6,3" />

      {/* 6 zone rects (3 dir × 2 height) — only 3 shown (one row for current height) */}
      {zones.map(({ d, x, label }, i) => {
        const isSelected = dir === d
        const w = zoneW[i]
        const rectY = height === 'low' ? 52 : 12
        const rh = 36
        return (
          <g key={d}
            onClick={() => phase === 'choosing' && onSetDir(d)}
            style={{ cursor: phase === 'choosing' ? 'pointer' : 'default' }}
          >
            <rect
              x={x} y={rectY} width={w} height={rh} rx="2"
              fill={isSelected ? 'rgba(102,255,51,0.14)' : 'rgba(180,200,210,0.04)'}
              stroke={isSelected ? 'var(--led-green)' : 'rgba(180,200,210,0.2)'}
              strokeWidth={isSelected ? 1.5 : 0.8}
              strokeDasharray={isSelected ? undefined : '3,2'}
            />
            <text
              x={x + w / 2} y={rectY + 16}
              textAnchor="middle" fontSize="11"
              fill={isSelected ? 'var(--led-green)' : 'rgba(180,200,210,0.45)'}
              fontFamily="monospace" fontWeight="700"
              style={{ pointerEvents: 'none' }}
            >{label}</text>
            <text
              x={x + w / 2} y={rectY + 28}
              textAnchor="middle" fontSize="6"
              fill={isSelected ? 'var(--led-green)' : 'rgba(180,200,210,0.35)'}
              fontFamily="monospace"
              style={{ pointerEvents: 'none' }}
            >{Math.round(combinedRate(d, height) * 100)}%</text>
          </g>
        )
      })}

      {/* GK — steel-blue, center blocking pose */}
      <rect x="121" y="38" width="18" height="32" rx="4" fill="none" stroke="var(--led-them)" strokeWidth="1.5" opacity="0.7" />
      <circle cx="130" cy="32" r="7" fill="none" stroke="var(--led-them)" strokeWidth="1.5" opacity="0.7" />
      <text x="130" y="97" textAnchor="middle" fontSize="6" fill="rgba(111,182,232,0.5)" fontFamily="monospace" fontWeight="700">MV</text>

      {/* Shot lane */}
      <path
        d={`M130,102 Q${(130 + dirXCenter) / 2},${height === 'high' ? 40 : 90} ${dirXCenter},${zoneY}`}
        fill="none" stroke="var(--led-attack)" strokeWidth="1.5" strokeDasharray="2,1.5" opacity="0.8"
        markerEnd="url(#arrP)"
      />
      {/* Shooter dot */}
      <circle cx="130" cy="102" r="4" fill="var(--led-amber)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
    </svg>
  )
}

export function PenaltyInteraction({ data, outcome, onChoose, coach }: PenaltyInteractionProps) {
  const [dir, setDir] = useState<PenaltyDirection>('left')
  const [height, setHeight] = useState<PenaltyHeight>('low')
  const [phase, setPhase] = useState<InteractionPhase>('choosing')

  const coachTip = coach ? generateCoachQuote(coach, {
    type: 'penalty',
    sub: 'default',
    playerName: data.shooterName.split(' ').pop(),
  }) : undefined

  useEffect(() => {
    if (!outcome) return
    setPhase('locked')
    const t = setTimeout(() => setPhase('revealed'), 600)
    return () => clearTimeout(t)
  }, [outcome])

  function handleConfirm(d = dir, h = height) {
    if (phase !== 'choosing') return
    setPhase('locked')
    onChoose(d, h)
  }

  const subChoicesNode = (
    <div className="interaction-sub-choices-row">
      {HEIGHT_OPTIONS.map(({ key, label }) => {
        const isSelected = height === key
        return (
          <button
            key={key}
            onClick={() => phase === 'choosing' && setHeight(key)}
            className={`interaction-sub-btn ${isSelected ? 'interaction-sub-btn-selected' : 'interaction-sub-btn-unselected'}`}
            style={{ cursor: phase === 'choosing' ? 'pointer' : 'default' }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )

  const dirLabels: Record<PenaltyDirection, string> = { left: 'V', center: 'M', right: 'H' }

  return (
    <InteractionShell
      icon="🎯"
      title="STRAFF"
      minute={data.minute}
      timer={{ seconds: 4, style: 'tag' }}
      pitch={
        <PenaltyPitchSVG
          dir={dir}
          height={height}
          phase={phase}
          onSetDir={setDir}
        />
      }
      subChoices={subChoicesNode}
      readout={{ label: `${dirLabels[dir]} · ${height === 'low' ? 'LÅGT' : 'HÖGT'}`, pct: Math.round(combinedRate(dir, height) * 100) }}
      coachTip={coachTip}
      coach={coach}
      cta={{ label: 'Skjut straffen', variant: 'danger', onClick: () => handleConfirm() }}
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
      onTimeout={() => handleConfirm('left', 'low')}
    />
  )
}
