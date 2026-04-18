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
}

const DELIVERY_OPTIONS: { key: CornerDelivery; emoji: string; label: string }[] = [
  { key: 'hard',  emoji: '💨', label: 'Hårt' },
  { key: 'low',   emoji: '🎯', label: 'Lågt' },
  { key: 'short', emoji: '🤫', label: 'Kort' },
]

export function CornerInteraction({ data, outcome, onChoose, coach }: CornerInteractionProps) {
  const [zone, setZone] = useState<CornerZone>('center')
  const [delivery, setDelivery] = useState<CornerDelivery>('hard')
  const [phase, setPhase] = useState<InteractionPhase>('choosing')
  const [cornerSide] = useState<'right' | 'left'>(() => Math.random() < 0.5 ? 'right' : 'left')

  const topZone: CornerZone = cornerSide === 'right' ? 'near' : 'far'
  const bottomZone: CornerZone = cornerSide === 'right' ? 'far' : 'near'
  const topLabel = cornerSide === 'right' ? 'NÄRA' : 'BORTRE'
  const bottomLabel = cornerSide === 'right' ? 'BORTRE' : 'NÄRA'

  const rates = cornerZoneSuccessRates(data)
  const topRate = rates[topZone]
  const centerRate = rates['center']
  const bottomRate = rates[bottomZone]

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

  function handleTimeout() {
    handleConfirm('near', 'hard')
  }

  const pitchNode = (
    <>
      <svg viewBox="0 0 220 110" width="100%" style={{ display: 'block', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
        <defs>
          <linearGradient id="iceC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bg)" />
            <stop offset="100%" stopColor="var(--border)" />
          </linearGradient>
          <marker id="arrowC" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="var(--accent)" />
          </marker>
        </defs>
        <rect width="220" height="110" fill="url(#iceC)" rx="4" />
        <path d="M70,0 A70,55 0 0,1 70,110" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" />
        <rect x="0" y="37" width="5" height="36" fill="none" stroke="#999" strokeWidth="1.5" rx="1" />
        <circle cx="14" cy="55" r="5" fill="var(--bg-leather)" opacity="0.7" />
        <text x="14" y="57" textAnchor="middle" fontSize="5" fill="white" fontWeight="700">MV</text>
        {[38, 48, 58, 68].map((y, i) => (
          <circle key={i} cx="6" cy={y} r="3" fill="var(--danger)" opacity="0.5" />
        ))}

        {/* Top zone */}
        <rect x="22" y="8" width="52" height="24" rx="4"
          fill={zone === topZone ? 'rgba(196,122,58,0.35)' : 'rgba(196,122,58,0.08)'}
          stroke={zone === topZone ? 'var(--accent)' : 'rgba(196,122,58,0.4)'}
          strokeWidth={zone === topZone ? '1.5' : '0.8'}
          style={{ cursor: phase === 'choosing' ? 'pointer' : 'default' }}
          onClick={() => phase === 'choosing' && setZone(topZone)}
        />
        <text x="48" y="20" fontSize="7" fill={zone === topZone ? 'var(--accent)' : 'var(--text-light-secondary)'}
          textAnchor="middle" fontWeight={zone === topZone ? '700' : '500'} style={{ pointerEvents: 'none' }}>
          {topLabel}
        </text>
        <text x="48" y="29" fontSize="6" fill={zone === topZone ? 'var(--accent)' : 'var(--text-light-secondary)'}
          textAnchor="middle" style={{ pointerEvents: 'none' }} opacity="0.8">
          {formatRate(topRate)}
        </text>

        {/* Center zone */}
        <rect x="22" y="40" width="52" height="24" rx="4"
          fill={zone === 'center' ? 'rgba(196,122,58,0.35)' : 'rgba(196,122,58,0.08)'}
          stroke={zone === 'center' ? 'var(--accent)' : 'rgba(196,122,58,0.4)'}
          strokeWidth={zone === 'center' ? '1.5' : '0.8'}
          style={{ cursor: phase === 'choosing' ? 'pointer' : 'default' }}
          onClick={() => phase === 'choosing' && setZone('center')}
        />
        <text x="48" y="52" fontSize="7" fill={zone === 'center' ? 'var(--accent)' : 'var(--text-light-secondary)'}
          textAnchor="middle" fontWeight={zone === 'center' ? '700' : '500'} style={{ pointerEvents: 'none' }}>
          MITT
        </text>
        <text x="48" y="61" fontSize="6" fill={zone === 'center' ? 'var(--accent)' : 'var(--text-light-secondary)'}
          textAnchor="middle" style={{ pointerEvents: 'none' }} opacity="0.8">
          {formatRate(centerRate)}
        </text>

        {/* Bottom zone */}
        <rect x="22" y="72" width="52" height="24" rx="4"
          fill={zone === bottomZone ? 'rgba(196,122,58,0.35)' : 'rgba(196,122,58,0.08)'}
          stroke={zone === bottomZone ? 'var(--accent)' : 'rgba(196,122,58,0.4)'}
          strokeWidth={zone === bottomZone ? '1.5' : '0.8'}
          style={{ cursor: phase === 'choosing' ? 'pointer' : 'default' }}
          onClick={() => phase === 'choosing' && setZone(bottomZone)}
        />
        <text x="48" y="84" fontSize="7" fill={zone === bottomZone ? 'var(--accent)' : 'var(--text-light-secondary)'}
          textAnchor="middle" fontWeight={zone === bottomZone ? '700' : '500'} style={{ pointerEvents: 'none' }}>
          {bottomLabel}
        </text>
        <text x="48" y="93" fontSize="6" fill={zone === bottomZone ? 'var(--accent)' : 'var(--text-light-secondary)'}
          textAnchor="middle" style={{ pointerEvents: 'none' }} opacity="0.8">
          {formatRate(bottomRate)}
        </text>

        {/* Corner arrow */}
        {(() => {
          const cx = 5
          const cy = cornerSide === 'right' ? 5 : 105
          const nearY = cornerSide === 'right' ? 20 : 84
          const farY = cornerSide === 'right' ? 84 : 20
          const zoneY = zone === 'near' ? nearY : zone === 'center' ? 52 : farY
          const tx = 22
          const cpx = cx + (tx - cx) * 0.5
          const cpy = cy + (zoneY - cy) * 0.1
          return (
            <path d={`M${cx},${cy} Q${cpx},${cpy} ${tx},${zoneY}`}
              fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arrowC)" />
          )
        })()}

        {/* Corner flag */}
        {(() => {
          const cx = 5
          const cy = cornerSide === 'right' ? 5 : 105
          const dir = cornerSide === 'right' ? -1 : 1
          return (
            <>
              <line x1={cx} y1={cy} x2={cx} y2={cy + dir * 8} stroke="var(--accent)" strokeWidth="1.2" />
              <polygon points={`${cx},${cy + dir * 8} ${cx + 6},${cy + dir * 5} ${cx},${cy + dir * 2}`} fill="var(--accent)" />
            </>
          )
        })()}

        {/* Rush lines */}
        <line x1="140" y1="20" x2="74" y2="20" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="3,2" />
        <line x1="150" y1="55" x2="74" y2="52" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="3,2" />
        <line x1="140" y1="84" x2="74" y2="84" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="3,2" />
        <circle cx="140" cy="20" r="4" fill="var(--accent)" opacity="0.7" />
        <circle cx="150" cy="55" r="4" fill="var(--accent)" opacity="0.7" />
        <circle cx="140" cy="84" r="4" fill="var(--accent)" opacity="0.7" />
        <text x="15" y={cornerSide === 'right' ? 14 : 102} fontSize="6" fill="var(--accent)" fontWeight="600" textAnchor="start">
          {cornerSide === 'right' ? 'HÖGER' : 'VÄNSTER'}
        </text>
      </svg>

      {/* Delivery selector */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
        {DELIVERY_OPTIONS.map(({ key, emoji, label }) => (
          <button
            key={key}
            onClick={() => phase === 'choosing' && setDelivery(key)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '8px 4px', borderRadius: 8,
              border: `1.5px solid ${delivery === key ? 'var(--accent)' : 'rgba(196,122,58,0.25)'}`,
              background: delivery === key ? 'var(--bg-dark-elevated)' : 'var(--bg-dark-surface)',
              cursor: phase === 'choosing' ? 'pointer' : 'default',
            }}
          >
            <span style={{ fontSize: 16 }}>{emoji}</span>
            <span style={{ color: 'var(--text-light)', fontSize: 11, fontWeight: 600 }}>{label}</span>
          </button>
        ))}
      </div>
    </>
  )

  const actionsNode = (
    <button onClick={() => handleConfirm()} className="btn btn-primary" style={{ width: '100%', marginTop: 6 }}>
      SLÅ HÖRNAN →
    </button>
  )

  const outcomeNode = outcome ? (
    <p style={{
      fontSize: 12,
      color: outcome.type === 'goal' ? 'var(--success)' : 'var(--text-secondary)',
      fontWeight: outcome.type === 'goal' ? 700 : 400,
      lineHeight: 1.4,
    }}>
      {outcome.type === 'goal' ? '🏒 MÅL! ' : ''}{outcome.description}
    </p>
  ) : null

  return (
    <InteractionShell
      icon="📐"
      title="HÖRNA"
      minute={data.minute}
      timerSeconds={5}
      stats={
        <>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)' }}>
            {data.cornerTakerName.split('. ')[1] ?? data.cornerTakerName}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-light-secondary)', marginLeft: 'auto' }}>
            {data.topRusherName} rusar
          </span>
        </>
      }
      pitch={pitchNode}
      coachTip={coachTip}
      coach={coach}
      actions={actionsNode}
      phase={phase}
      outcome={outcomeNode}
      onTimeout={handleTimeout}
    />
  )
}
