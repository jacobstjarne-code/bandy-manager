import { useState } from 'react'
import type { CornerInteractionData, CornerOutcome, CornerZone, CornerDelivery } from '../../../domain/services/cornerInteractionService'

interface CornerInteractionProps {
  data: CornerInteractionData
  outcome: CornerOutcome | null
  onChoose: (zone: CornerZone, delivery: CornerDelivery) => void
}

const DELIVERY_OPTIONS: { key: CornerDelivery; emoji: string; label: string; sub: string }[] = [
  { key: 'hard',  emoji: '💨', label: 'Hårt skott', sub: 'Snabbt rus' },
  { key: 'low',   emoji: '🎯', label: 'Låg pass',   sub: 'Kontroll' },
  { key: 'short', emoji: '🤫', label: 'Kort hörna', sub: 'Överraska' },
]

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-dark)',
  borderRadius: 12,
  padding: 16,
  border: '1.5px solid rgba(196,122,58,0.3)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
}

const infoRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '6px 8px',
  background: 'var(--bg-dark-surface)',
  borderRadius: 4,
  marginBottom: 10,
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 9, color: 'var(--text-light-secondary)', marginBottom: 4,
  fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const,
}

export function CornerInteraction({ data, outcome, onChoose }: CornerInteractionProps) {
  const [zone, setZone] = useState<CornerZone>('center')
  const [delivery, setDelivery] = useState<CornerDelivery>('hard')
  const [confirmed, setConfirmed] = useState(false)
  const [cornerSide] = useState<'right' | 'left'>(() => Math.random() < 0.5 ? 'right' : 'left')

  const minuteStr = `${data.minute}:a`

  function handleConfirm() {
    if (confirmed) return
    setConfirmed(true)
    onChoose(zone, delivery)
  }

  return (
    <div style={{ margin: '6px 0' }}>
      <div style={cardStyle}>

        {/* Title */}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 8px 0' }}>
          📐 HÖRNA — {minuteStr} minuten
        </p>

        {/* Info row */}
        <div style={infoRowStyle}>
          <span style={{ fontSize: 10, color: 'var(--text-light-secondary)' }}>Hörnläggare:</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)' }}>
            {data.cornerTakerName.split('. ')[1] ?? data.cornerTakerName}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-light-secondary)', marginLeft: 'auto' }}>
            {data.topRusherName} rusar
          </span>
        </div>

        {/* Pitch SVG */}
        <svg viewBox="0 0 220 110" width="100%" style={{ display: 'block', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
          <defs>
            <linearGradient id="iceC" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8E4DC" />
              <stop offset="100%" stopColor="#D8D4CC" />
            </linearGradient>
          </defs>
          <rect width="220" height="110" fill="url(#iceC)" rx="4" />
          {/* Penalty arc */}
          <path d="M70,0 A70,55 0 0,1 70,110" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" />
          {/* Goal */}
          <rect x="0" y="37" width="5" height="36" fill="none" stroke="#999" strokeWidth="1.5" rx="1" />
          {/* Goalkeeper */}
          <circle cx="14" cy="55" r="5" fill="#2C2820" opacity="0.7" />
          <text x="14" y="57" textAnchor="middle" fontSize="5" fill="white" fontWeight="700">MV</text>
          {/* Defenders */}
          {[38, 48, 58, 68].map((y, i) => (
            <circle key={i} cx="6" cy={y} r="3" fill="#B05040" opacity="0.5" />
          ))}
          {/* Zone buttons */}
          <rect x="22" y="14" width="42" height="20" rx="4"
            fill={zone === 'near' ? 'rgba(196,122,58,0.3)' : 'rgba(196,122,58,0.08)'}
            stroke={zone === 'near' ? 'var(--accent)' : 'rgba(196,122,58,0.4)'}
            strokeWidth={zone === 'near' ? '1.5' : '0.8'}
            style={{ cursor: confirmed ? 'default' : 'pointer' }}
            onClick={() => !confirmed && setZone('near')}
          />
          <text x="43" y="27" fontSize="7" fill={zone === 'near' ? 'var(--accent)' : 'var(--text-light-secondary)'}
            textAnchor="middle" fontWeight={zone === 'near' ? '700' : '500'} style={{ pointerEvents: 'none' }}>
            NÄRA
          </text>
          <rect x="22" y="42" width="42" height="20" rx="4"
            fill={zone === 'center' ? 'rgba(196,122,58,0.3)' : 'rgba(196,122,58,0.08)'}
            stroke={zone === 'center' ? 'var(--accent)' : 'rgba(196,122,58,0.4)'}
            strokeWidth={zone === 'center' ? '1.5' : '0.8'}
            style={{ cursor: confirmed ? 'default' : 'pointer' }}
            onClick={() => !confirmed && setZone('center')}
          />
          <text x="43" y="55" fontSize="7" fill={zone === 'center' ? 'var(--accent)' : 'var(--text-light-secondary)'}
            textAnchor="middle" fontWeight={zone === 'center' ? '700' : '500'} style={{ pointerEvents: 'none' }}>
            MITT{zone === 'center' ? ' ●' : ''}
          </text>
          <rect x="22" y="70" width="42" height="20" rx="4"
            fill={zone === 'far' ? 'rgba(196,122,58,0.3)' : 'rgba(196,122,58,0.08)'}
            stroke={zone === 'far' ? 'var(--accent)' : 'rgba(196,122,58,0.4)'}
            strokeWidth={zone === 'far' ? '1.5' : '0.8'}
            style={{ cursor: confirmed ? 'default' : 'pointer' }}
            onClick={() => !confirmed && setZone('far')}
          />
          <text x="43" y="83" fontSize="7" fill={zone === 'far' ? 'var(--accent)' : 'var(--text-light-secondary)'}
            textAnchor="middle" fontWeight={zone === 'far' ? '700' : '500'} style={{ pointerEvents: 'none' }}>
            BORTRE
          </text>
          {/* Rush lines */}
          <line x1="140" y1="25" x2="70" y2="25" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="3,2" />
          <line x1="150" y1="55" x2="70" y2="52" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="3,2" />
          <line x1="140" y1="80" x2="70" y2="80" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="3,2" />
          <circle cx="140" cy="25" r="4" fill="var(--accent)" opacity="0.7" />
          <circle cx="150" cy="55" r="4" fill="var(--accent)" opacity="0.7" />
          <circle cx="140" cy="80" r="4" fill="var(--accent)" opacity="0.7" />
          {/* Corner point — both corners at goal end (cx≈5), top=left, bottom=right */}
          <circle cx="5" cy={cornerSide === 'right' ? 105 : 5} r="4" fill="var(--accent)" stroke="#fff" strokeWidth="1" />
          <text
            x="22"
            y={cornerSide === 'right' ? 102 : 14} fontSize="6" fill="var(--accent)" fontWeight="600"
            textAnchor="start"
          >
            {cornerSide === 'right' ? 'Hörna från höger' : 'Hörna från vänster'}
          </text>
        </svg>

        {/* Delivery selector */}
        <p style={sectionLabelStyle}>LEVERANS</p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 0 }}>
          {DELIVERY_OPTIONS.map(({ key, emoji, label, sub }) => (
            <button
              key={key}
              onClick={() => !confirmed && setDelivery(key)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '10px 8px', borderRadius: 8,
                border: `1.5px solid ${delivery === key ? 'var(--accent)' : 'rgba(196,122,58,0.25)'}`,
                background: delivery === key ? 'var(--bg-dark-elevated)' : 'var(--bg-dark-surface)',
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
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              letterSpacing: '1px', marginTop: 10,
              boxShadow: '0 3px 10px rgba(162,88,40,0.4)',
            }}
          >
            SLÅ HÖRNAN →
          </button>
        )}
      </div>

      {/* Outcome */}
      {outcome && (
        <div style={{ padding: '8px 12px', marginTop: 4 }}>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{data.minute}'</p>
          <p style={{
            fontSize: 12,
            color: outcome.type === 'goal' ? 'var(--success)' : 'var(--text-secondary)',
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
