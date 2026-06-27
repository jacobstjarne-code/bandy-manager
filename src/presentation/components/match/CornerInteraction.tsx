/**
 * CornerInteraction.tsx — Stålvallen redesign
 *
 * BATCH D-01. Uses InteractionShell with:
 * - timer.style = 'tag' (5s amber)
 * - SVG pitch: LED palette (amber own, red defenders, steel-blue GK, green selected zone)
 * - Monospace LED sub-choice buttons (HÅRT / LÅGT / KORT)
 * - cta.variant = 'copper'
 *
 * Mekanik (cornerInteractionService) ORÖRD — zones, rates, delivery logic.
 */
import { useState, useEffect } from 'react'
import type { CornerInteractionData, CornerOutcome, CornerZone, CornerDelivery } from '../../../domain/services/cornerInteractionService'
import { cornerZoneSuccessRates, formatRate } from '../../../domain/services/cornerInteractionService'
import { InteractionShell } from './InteractionShell'
import type { InteractionPhase } from './InteractionShell'
import type { AssistantCoach } from '../../../domain/entities/AssistantCoach'
import { generateCoachQuote } from '../../../domain/services/assistantCoachService'

interface CornerInteractionProps {
  data: CornerInteractionData
  outcome: CornerOutcome | null
  onChoose: (zone: CornerZone, delivery: CornerDelivery) => void
  coach?: AssistantCoach
  /** Övningsläge (Tillträdet F3): släck 5s-timern — spelaren får all tid.
   *  Konsekvens-suppression sköts av harnesset (onChoose), inte här. */
  practice?: boolean
}

const DELIVERY_OPTIONS: { key: CornerDelivery; label: string }[] = [
  { key: 'hard',  label: 'HÅRT' },
  { key: 'low',   label: 'LÅGT' },
  { key: 'short', label: 'KORT' },
]

/** SVG corner schematic — Stålvallen LED palette */
function CornerPitchSVG({
  zone, delivery, cornerSide, topZone, bottomZone, topLabel, bottomLabel,
  topRate, centerRate, bottomRate, phase, onSetZone,
}: {
  zone: CornerZone
  delivery: CornerDelivery
  cornerSide: 'right' | 'left'
  topZone: CornerZone
  bottomZone: CornerZone
  topLabel: string
  bottomLabel: string
  topRate: number
  centerRate: number
  bottomRate: number
  phase: InteractionPhase
  onSetZone: (z: CornerZone) => void
}) {
  const zones: { z: CornerZone; label: string; rate: number; y: number }[] = [
    { z: topZone,    label: topLabel,    rate: topRate,    y: 14 },
    { z: 'center',   label: 'MITT',      rate: centerRate, y: 48 },
    { z: bottomZone, label: bottomLabel, rate: bottomRate, y: 88 },
  ]

  // Corner pin position
  const cx = 5
  const cy = cornerSide === 'right' ? 5 : 125
  const dir = cornerSide === 'right' ? 1 : -1

  // Selected zone y-center for arrow target
  const zoneYMap: Record<string, number> = {
    [topZone]:    28,
    center:       65,
    [bottomZone]: 102,
  }
  const arrowTargetY = zoneYMap[zone] ?? 65

  return (
    <svg viewBox="0 0 220 130" style={{ width: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="iceCG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A2628" />
          <stop offset="100%" stopColor="#0E1518" />
        </linearGradient>
        <marker id="arrCG" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#66FF33" />
        </marker>
      </defs>

      {/* Ice */}
      <rect width="220" height="130" fill="url(#iceCG)" rx="3" />
      {/* Penalty arc */}
      <path d="M70,0 A70,65 0 0,1 70,130" fill="none" stroke="rgba(180,200,210,0.18)" strokeWidth="0.7" />
      {/* Goal */}
      <rect x="0" y="46" width="5" height="38" fill="none" stroke="rgba(180,200,210,0.55)" strokeWidth="1.5" />
      {/* GK */}
      <circle cx="14" cy="65" r="5" fill="#0A0A0A" stroke="#6FB6E8" strokeWidth="1.4" />
      <text x="14" y="67.5" textAnchor="middle" fontSize="5" fill="#6FB6E8" fontFamily="monospace" fontWeight="700">MV</text>
      {/* 4 defenders — red LED */}
      {[48, 58, 72, 82].map((y, i) => (
        <circle key={i} cx={i < 2 ? 16 : 22} cy={y} r="3" fill="#FF3B0F" opacity="0.85" />
      ))}

      {/* 3 zones */}
      {zones.map(({ z, label, rate, y }) => {
        const isSelected = zone === z
        const h = z === 'center' ? 34 : 28
        return (
          <g key={z} onClick={() => phase === 'choosing' && onSetZone(z)} style={{ cursor: phase === 'choosing' ? 'pointer' : 'default' }}>
            <rect
              x="30" y={y} width="40" height={h} rx="2"
              fill={isSelected ? 'rgba(102,255,51,0.12)' : 'rgba(180,200,210,0.04)'}
              stroke={isSelected ? '#66FF33' : 'rgba(180,200,210,0.25)'}
              strokeWidth={isSelected ? 1.5 : 0.8}
              strokeDasharray={isSelected ? undefined : '3,2'}
            />
            <text
              x="50" y={y + (h / 2) - 3}
              textAnchor="middle" fontSize="6"
              fill={isSelected ? '#66FF33' : 'rgba(180,200,210,0.45)'}
              fontFamily="monospace" fontWeight="700" letterSpacing="1"
              style={{ pointerEvents: 'none' }}
            >{label}</text>
            <text
              x="50" y={y + (h / 2) + 7}
              textAnchor="middle" fontSize="5.5"
              fill={isSelected ? '#66FF33' : 'rgba(180,200,210,0.4)'}
              fontFamily="monospace"
              style={{ pointerEvents: 'none' }}
            >{formatRate(rate)}</text>
          </g>
        )
      })}

      {/* Corner flag */}
      <line x1={cx} y1={cy} x2={cx} y2={cy + dir * 8} stroke="#FFAA00" strokeWidth="1.2" />
      <polygon points={`${cx},${cy + dir * 8} ${cx + 6},${cy + dir * 5} ${cx},${cy + dir * 2}`} fill="#FFAA00" />

      {/* Pass arrow from corner to selected zone */}
      <path
        d={`M${cx},${cy} Q${cx + (70 - cx) * 0.3},${(cy + arrowTargetY) / 2} 30,${arrowTargetY}`}
        fill="none" stroke="#66FF33" strokeWidth="1.5" strokeDasharray="4,3"
        markerEnd="url(#arrCG)"
      />

      {/* Rush lines — 3 amber attacker dots */}
      {[20, 65, 102].map((y, i) => (
        <g key={i}>
          <line x1={140 + i * 10} y1={y} x2="74" y2={y} stroke="#FFAA00" strokeWidth="0.8" strokeDasharray="3,2" opacity="0.7" />
          <circle cx={140 + i * 10} cy={y} r="4" fill="#FFAA00" opacity="0.85" />
        </g>
      ))}

      {/* Delivery hint top-right */}
      <text
        x="215" y="12" textAnchor="end" fontSize="6"
        fill="#FFAA00" fontFamily="monospace" fontWeight="700" opacity="0.7"
      >{delivery === 'hard' ? 'HÅRT' : delivery === 'low' ? 'LÅGT' : 'KORT'}</text>
    </svg>
  )
}

export function CornerInteraction({ data, outcome, onChoose, coach, practice }: CornerInteractionProps) {
  const [zone, setZone] = useState<CornerZone>('center')
  const [delivery, setDelivery] = useState<CornerDelivery>('hard')
  const [phase, setPhase] = useState<InteractionPhase>('choosing')
  const [cornerSide] = useState<'right' | 'left'>(() => Math.random() < 0.5 ? 'right' : 'left')

  const topZone: CornerZone = cornerSide === 'right' ? 'near' : 'far'
  const bottomZone: CornerZone = cornerSide === 'right' ? 'far' : 'near'
  const topLabel = cornerSide === 'right' ? 'NÄRA' : 'BORTRE'
  const bottomLabel = cornerSide === 'right' ? 'BORTRE' : 'NÄRA'

  const rates = cornerZoneSuccessRates(data)

  const coachTip = coach ? generateCoachQuote(coach, {
    type: 'corner',
    sub: 'default',
  }) : undefined

  useEffect(() => {
    if (!outcome) return
    setPhase('locked')
    const t = setTimeout(() => setPhase('revealed'), 600)
    return () => clearTimeout(t)
  }, [outcome])

  function handleConfirm(z = zone, d = delivery) {
    if (phase !== 'choosing') return
    setPhase('locked')
    onChoose(z, d)
  }

  const subChoicesNode = (
    <div className="interaction-sub-choices-row">
      {DELIVERY_OPTIONS.map(({ key, label }) => {
        const isSelected = delivery === key
        return (
          <button
            key={key}
            onClick={() => phase === 'choosing' && setDelivery(key)}
            className={`interaction-sub-btn ${isSelected ? 'interaction-sub-btn-selected' : 'interaction-sub-btn-unselected'}`}
            style={{ cursor: phase === 'choosing' ? 'pointer' : 'default' }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )

  const zoneLabel = zone === 'center' ? 'MITT' : zone === 'near' ? 'NÄRA' : 'BORTRE'
  const zoneRate = rates[zone]

  return (
    <InteractionShell
      icon="📐"
      title="HÖRNA"
      minute={data.minute}
      timer={{ seconds: 5, style: 'tag' }}
      untimed={practice}
      pitch={
        <CornerPitchSVG
          zone={zone}
          delivery={delivery}
          cornerSide={cornerSide}
          topZone={topZone}
          bottomZone={bottomZone}
          topLabel={topLabel}
          bottomLabel={bottomLabel}
          topRate={rates[topZone]}
          centerRate={rates['center']}
          bottomRate={rates[bottomZone]}
          phase={phase}
          onSetZone={setZone}
        />
      }
      subChoices={subChoicesNode}
      readout={{ label: zoneLabel, pct: Math.round(zoneRate * 100) }}
      coachTip={coachTip}
      coach={coach}
      cta={{ label: 'Slå hörnan', variant: 'copper', onClick: () => handleConfirm() }}
      phase={phase}
      outcome={outcome ? (
        <p style={{
          fontSize: 11,
          color: outcome.type === 'goal' ? 'var(--copper)' : 'rgba(245,241,235,0.65)',
          fontWeight: outcome.type === 'goal' ? 700 : 400,
          fontStyle: outcome.type !== 'goal' ? 'italic' : 'normal',
          fontFamily: outcome.type !== 'goal' ? 'var(--font-display)' : 'var(--font-mono)',
          margin: 0,
          letterSpacing: outcome.type === 'goal' ? '0.5px' : undefined,
        }}>
          {outcome.type === 'goal' ? 'MÅL! ' : ''}{outcome.description}
        </p>
      ) : null}
      onTimeout={() => handleConfirm('near', 'hard')}
    />
  )
}
