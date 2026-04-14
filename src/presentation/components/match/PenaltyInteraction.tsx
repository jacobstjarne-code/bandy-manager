import { useState } from 'react'
import type { PenaltyInteractionData, PenaltyOutcome, PenaltyDirection, PenaltyHeight } from '../../../domain/services/penaltyInteractionService'

interface PenaltyInteractionProps {
  data: PenaltyInteractionData
  outcome: PenaltyOutcome | null
  onChoose: (dir: PenaltyDirection, height: PenaltyHeight) => void
}

const HEIGHT_OPTIONS: { key: PenaltyHeight; emoji: string; label: string; sub: string }[] = [
  { key: 'low',  emoji: '🧊', label: 'Lågt',  sub: 'Säkrare' },
  { key: 'high', emoji: '⬆️', label: 'Högt',  sub: 'Svårare rädda' },
]

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-dark)',
  borderRadius: 12,
  padding: 16,
  border: '1.5px solid rgba(176,80,64,0.4)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
}

const infoRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '6px 8px',
  background: 'var(--bg-dark-surface)',
  border: '1px solid rgba(176,80,64,0.2)',
  borderRadius: 4,
  marginBottom: 10,
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 9, color: 'var(--text-light-secondary)', marginBottom: 4,
  fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const,
}

export function PenaltyInteraction({ data, outcome, onChoose }: PenaltyInteractionProps) {
  const [dir, setDir] = useState<PenaltyDirection>('left')
  const [height, setHeight] = useState<PenaltyHeight>('low')
  const [confirmed, setConfirmed] = useState(false)

  const minuteStr = `${data.minute}:a`

  function handleConfirm() {
    if (confirmed) return
    setConfirmed(true)
    onChoose(dir, height)
  }

  return (
    <div style={{ margin: '6px 0' }}>
      <div style={cardStyle}>

        {/* Title */}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--danger)', margin: '0 0 8px 0' }}>
          🎯 STRAFF — {minuteStr} minuten
        </p>

        {/* Info row */}
        <div style={infoRowStyle}>
          <span style={{ fontSize: 10, color: 'var(--text-light-secondary)' }}>Skytt:</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)' }}>
            {data.shooterName.split(' ').slice(-1)[0]}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-light-secondary)', marginLeft: 'auto' }}>
            vs {data.keeperName.split(' ').slice(-1)[0]}
          </span>
        </div>

        {/* Zone label */}
        <p style={sectionLabelStyle}>VÄLJ PLACERING</p>

        {/* Goal SVG with zones */}
        <svg viewBox="0 0 260 110" width="100%" style={{ display: 'block', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
          <defs>
            <linearGradient id="iceP" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D8D4CC" />
              <stop offset="100%" stopColor="#C8C4BC" />
            </linearGradient>
          </defs>
          <rect width="260" height="110" fill="url(#iceP)" rx="4" />
          {/* Goal posts */}
          <line x1="20" y1="10" x2="20" y2="90" stroke="#666" strokeWidth="3" />
          <line x1="240" y1="10" x2="240" y2="90" stroke="#666" strokeWidth="3" />
          <line x1="20" y1="10" x2="240" y2="10" stroke="#666" strokeWidth="3" />
          <line x1="20" y1="90" x2="240" y2="90" stroke="#999" strokeWidth="1" strokeDasharray="4,2" />
          <rect x="22" y="12" width="216" height="76" fill="rgba(255,255,255,0.3)" />
          {/* Dividers */}
          <line x1="93" y1="10" x2="93" y2="90" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
          <line x1="167" y1="10" x2="167" y2="90" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
          {/* Goalkeeper outline */}
          <rect x="121" y="38" width="18" height="32" rx="4" fill="none" stroke="#3a3530" strokeWidth="1.5" opacity="0.7" />
          <circle cx="130" cy="32" r="7" fill="none" stroke="#3a3530" strokeWidth="1.5" opacity="0.7" />
          <line x1="121" y1="45" x2="105" y2="42" stroke="#3a3530" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
          <line x1="139" y1="45" x2="155" y2="42" stroke="#3a3530" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
          <circle cx="104" cy="41" r="3.5" fill="none" stroke="#3a3530" strokeWidth="1.5" opacity="0.6" />
          <circle cx="156" cy="41" r="3.5" fill="none" stroke="#3a3530" strokeWidth="1.5" opacity="0.6" />
          <text x="130" y="80" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.5)" fontWeight="600">MÅLVAKT</text>
          {/* Left zone */}
          <rect x="22" y="12" width="70" height="76" rx="2"
            fill={dir === 'left' ? 'rgba(176,80,64,0.3)' : 'rgba(176,80,64,0.08)'}
            stroke={dir === 'left' ? 'var(--danger)' : 'rgba(176,80,64,0.3)'}
            strokeWidth={dir === 'left' ? '2' : '1'}
            style={{ cursor: confirmed ? 'default' : 'pointer' }}
            onClick={() => !confirmed && setDir('left')}
          />
          <text x="57" y="54" textAnchor="middle" fontSize="10" fill={dir === 'left' ? 'white' : 'rgba(255,255,255,0.6)'}
            fontWeight="700" style={{ pointerEvents: 'none' }}>V</text>
          <text x="57" y="66" textAnchor="middle" fontSize="6" fill={dir === 'left' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'}
            style={{ pointerEvents: 'none' }}>VÄNSTER</text>
          {/* Center zone */}
          <rect x="94" y="12" width="72" height="76" rx="2"
            fill={dir === 'center' ? 'rgba(176,80,64,0.2)' : 'rgba(176,80,64,0.04)'}
            stroke={dir === 'center' ? 'var(--danger)' : 'rgba(176,80,64,0.25)'}
            strokeWidth={dir === 'center' ? '2' : '1'}
            style={{ cursor: confirmed ? 'default' : 'pointer' }}
            onClick={() => !confirmed && setDir('center')}
          />
          <text x="130" y="42" textAnchor="middle" fontSize="10" fill={dir === 'center' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'}
            fontWeight="700" style={{ pointerEvents: 'none' }}>M</text>
          <text x="130" y="54" textAnchor="middle" fontSize="6" fill={dir === 'center' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)'}
            style={{ pointerEvents: 'none' }}>MITT</text>
          {/* Right zone */}
          <rect x="168" y="12" width="70" height="76" rx="2"
            fill={dir === 'right' ? 'rgba(176,80,64,0.3)' : 'rgba(176,80,64,0.08)'}
            stroke={dir === 'right' ? 'var(--danger)' : 'rgba(176,80,64,0.3)'}
            strokeWidth={dir === 'right' ? '2' : '1'}
            style={{ cursor: confirmed ? 'default' : 'pointer' }}
            onClick={() => !confirmed && setDir('right')}
          />
          <text x="203" y="54" textAnchor="middle" fontSize="10" fill={dir === 'right' ? 'white' : 'rgba(255,255,255,0.6)'}
            fontWeight="700" style={{ pointerEvents: 'none' }}>H</text>
          <text x="203" y="66" textAnchor="middle" fontSize="6" fill={dir === 'right' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'}
            style={{ pointerEvents: 'none' }}>HÖGER</text>
          {/* Penalty taker dot */}
          <circle cx="130" cy="102" r="4" fill="var(--danger)" stroke="#fff" strokeWidth="1.5" />
        </svg>

        {/* Height selector */}
        <p style={sectionLabelStyle}>HÖJD</p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 0 }}>
          {HEIGHT_OPTIONS.map(({ key, emoji, label, sub }) => (
            <button
              key={key}
              onClick={() => !confirmed && setHeight(key)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '10px 8px', borderRadius: 8,
                border: `1.5px solid ${height === key ? 'var(--danger)' : 'rgba(196,122,58,0.25)'}`,
                background: height === key ? 'rgba(176,80,64,0.15)' : 'var(--bg-dark-surface)',
                cursor: confirmed ? 'default' : 'pointer',
              }}
            >
              <span style={{ fontSize: 20 }}>{emoji}</span>
              <span style={{ color: 'var(--text-light)', fontSize: 12, fontWeight: 700 }}>{label}</span>
              <span style={{ color: 'var(--text-light-secondary)', fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{sub}</span>
            </button>
          ))}
        </div>

        {/* Confirm */}
        {!confirmed && (
          <button
            onClick={handleConfirm}
            style={{
              width: '100%', padding: 11, borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, var(--danger), #8B3E30)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              letterSpacing: '1px', marginTop: 10,
              boxShadow: '0 3px 10px rgba(176,80,64,0.4)',
            }}
          >
            SKJUT STRAFFEN →
          </button>
        )}
      </div>

      {/* Outcome */}
      {outcome && (
        <div style={{ padding: '8px 12px', marginTop: 4 }}>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{data.minute}'</p>
          <p style={{
            fontSize: 12,
            color: outcome.type === 'goal' ? 'var(--success)' : outcome.type === 'miss' ? 'var(--warning)' : 'var(--text-secondary)',
            fontWeight: outcome.type === 'goal' ? 700 : 400,
            lineHeight: 1.4,
          }}>
            {outcome.type === 'goal' ? '🏒 MÅL! ' : ''}{outcome.description}
          </p>
        </div>
      )}
    </div>
  )
}
