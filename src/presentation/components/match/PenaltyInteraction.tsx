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

const HEIGHT_OPTIONS: { key: PenaltyHeight; emoji: string; label: string; rate: number }[] = [
  { key: 'low',  emoji: '🧊', label: 'Lågt',  rate: 0.55 },
  { key: 'high', emoji: '⬆️', label: 'Högt',  rate: 0.42 },
]
const DIR_RATES: Record<PenaltyDirection, number> = { left: 0.50, center: 0.35, right: 0.50 }

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

  // Combined success rate (dir × height)
  function combinedRate(d: PenaltyDirection, h: PenaltyHeight): number {
    return Math.max(0.10, Math.min(0.75, DIR_RATES[d] * (h === 'high' ? 0.85 : 1.0)))
  }

  const pitchNode = (
    <>
      <svg viewBox="0 0 260 110" width="100%" style={{ display: 'block', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
        <defs>
          <linearGradient id="iceP" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--border)" />
            <stop offset="100%" stopColor="var(--border-dark)" />
          </linearGradient>
          <marker id="arrowP" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="var(--danger)" />
          </marker>
        </defs>
        <rect width="260" height="110" fill="url(#iceP)" rx="4" />
        <line x1="20" y1="10" x2="20" y2="90" stroke="#666" strokeWidth="3" />
        <line x1="240" y1="10" x2="240" y2="90" stroke="#666" strokeWidth="3" />
        <line x1="20" y1="10" x2="240" y2="10" stroke="#666" strokeWidth="3" />
        <line x1="20" y1="90" x2="240" y2="90" stroke="#999" strokeWidth="1" strokeDasharray="4,2" />
        <rect x="22" y="12" width="216" height="76" fill="rgba(255,255,255,0.3)" />
        <line x1="93" y1="10" x2="93" y2="90" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
        <line x1="167" y1="10" x2="167" y2="90" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
        <rect x="121" y="38" width="18" height="32" rx="4" fill="none" stroke="var(--bg-leather)" strokeWidth="1.5" opacity="0.7" />
        <circle cx="130" cy="32" r="7" fill="none" stroke="var(--bg-leather)" strokeWidth="1.5" opacity="0.7" />
        <text x="130" y="80" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.5)" fontWeight="600">MÅLVAKT</text>

        {/* Left zone */}
        <rect x="22" y="12" width="70" height="76" rx="2"
          fill={dir === 'left' ? 'rgba(176,80,64,0.3)' : 'rgba(176,80,64,0.08)'}
          stroke={dir === 'left' ? 'var(--danger)' : 'rgba(176,80,64,0.3)'}
          strokeWidth={dir === 'left' ? '2' : '1'}
          style={{ cursor: phase === 'choosing' ? 'pointer' : 'default' }}
          onClick={() => phase === 'choosing' && setDir('left')}
        />
        <text x="57" y="50" textAnchor="middle" fontSize="10" fill={dir === 'left' ? 'white' : 'rgba(255,255,255,0.6)'}
          fontWeight="700" style={{ pointerEvents: 'none' }}>V</text>
        <text x="57" y="62" textAnchor="middle" fontSize="6" fill={dir === 'left' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'}
          style={{ pointerEvents: 'none' }}>{Math.round(combinedRate('left', height) * 20) * 5}%</text>

        {/* Center zone */}
        <rect x="94" y="12" width="72" height="76" rx="2"
          fill={dir === 'center' ? 'rgba(176,80,64,0.2)' : 'rgba(176,80,64,0.04)'}
          stroke={dir === 'center' ? 'var(--danger)' : 'rgba(176,80,64,0.25)'}
          strokeWidth={dir === 'center' ? '2' : '1'}
          style={{ cursor: phase === 'choosing' ? 'pointer' : 'default' }}
          onClick={() => phase === 'choosing' && setDir('center')}
        />
        <text x="130" y="50" textAnchor="middle" fontSize="10" fill={dir === 'center' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'}
          fontWeight="700" style={{ pointerEvents: 'none' }}>M</text>
        <text x="130" y="62" textAnchor="middle" fontSize="6" fill={dir === 'center' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)'}
          style={{ pointerEvents: 'none' }}>{Math.round(combinedRate('center', height) * 20) * 5}%</text>

        {/* Right zone */}
        <rect x="168" y="12" width="70" height="76" rx="2"
          fill={dir === 'right' ? 'rgba(176,80,64,0.3)' : 'rgba(176,80,64,0.08)'}
          stroke={dir === 'right' ? 'var(--danger)' : 'rgba(176,80,64,0.3)'}
          strokeWidth={dir === 'right' ? '2' : '1'}
          style={{ cursor: phase === 'choosing' ? 'pointer' : 'default' }}
          onClick={() => phase === 'choosing' && setDir('right')}
        />
        <text x="203" y="50" textAnchor="middle" fontSize="10" fill={dir === 'right' ? 'white' : 'rgba(255,255,255,0.6)'}
          fontWeight="700" style={{ pointerEvents: 'none' }}>H</text>
        <text x="203" y="62" textAnchor="middle" fontSize="6" fill={dir === 'right' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'}
          style={{ pointerEvents: 'none' }}>{Math.round(combinedRate('right', height) * 20) * 5}%</text>

        {/* Ball path */}
        {(() => {
          const from = { x: 130, y: 100 }
          const zoneX = dir === 'left' ? 57 : dir === 'center' ? 130 : 203
          const zoneY = height === 'low' ? 72 : 28
          const cp = { x: (from.x + zoneX) / 2, y: height === 'high' ? 40 : 90 }
          return (
            <path d={`M ${from.x},${from.y} Q ${cp.x},${cp.y} ${zoneX},${zoneY}`}
              fill="none" stroke="var(--danger)" strokeWidth="1.5" strokeDasharray="2,1.5" opacity="0.75" markerEnd="url(#arrowP)" />
          )
        })()}
        <circle cx="130" cy="102" r="4" fill="var(--danger)" stroke="#fff" strokeWidth="1.5" />
      </svg>

      {/* Height selector */}
      <div style={{ display: 'flex', gap: 6 }}>
        {HEIGHT_OPTIONS.map(({ key, emoji, label }) => (
          <button key={key} onClick={() => phase === 'choosing' && setHeight(key)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '8px 6px', borderRadius: 8,
              border: `1.5px solid ${height === key ? 'var(--danger)' : 'rgba(196,122,58,0.25)'}`,
              background: height === key ? 'rgba(176,80,64,0.15)' : 'var(--bg-dark-surface)',
              cursor: phase === 'choosing' ? 'pointer' : 'default',
            }}>
            <span style={{ fontSize: 16 }}>{emoji}</span>
            <span style={{ color: 'var(--text-light)', fontSize: 11, fontWeight: 600 }}>{label}</span>
          </button>
        ))}
      </div>
    </>
  )

  return (
    <InteractionShell
      icon="🎯"
      title="STRAFF"
      minute={data.minute}
      timerSeconds={5}
      stats={
        <>
          <span style={{ fontSize: 10, color: 'var(--text-light-secondary)' }}>Skytt:</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)' }}>
            {data.shooterName.split(' ').slice(-1)[0]}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-light-secondary)', marginLeft: 'auto' }}>
            vs {data.keeperName.split(' ').slice(-1)[0]}
          </span>
        </>
      }
      pitch={pitchNode}
      coachTip={coachTip}
      coach={coach}
      actions={
        <button onClick={() => handleConfirm()} className="btn btn-danger" style={{ width: '100%', padding: 11, fontSize: 13, fontWeight: 700, marginTop: 8 }}>
          SKJUT STRAFFEN →
        </button>
      }
      phase={phase}
      outcome={outcome ? (
        <p style={{ fontSize: 12, color: outcome.type === 'goal' ? 'var(--success)' : outcome.type === 'miss' ? 'var(--warning)' : 'var(--text-secondary)', fontWeight: outcome.type === 'goal' ? 700 : 400, lineHeight: 1.4, margin: 0 }}>
          {outcome.type === 'goal' ? '🏒 MÅL! ' : ''}{outcome.description}
        </p>
      ) : null}
      onTimeout={() => handleConfirm('left', 'low')}
    />
  )
}
