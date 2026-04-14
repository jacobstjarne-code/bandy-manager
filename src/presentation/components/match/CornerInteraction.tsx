import { useState } from 'react'
import type { CornerInteractionData, CornerOutcome, CornerZone, CornerDelivery } from '../../../domain/services/cornerInteractionService'

interface CornerInteractionProps {
  data: CornerInteractionData
  outcome: CornerOutcome | null
  onChoose: (zone: CornerZone, delivery: CornerDelivery) => void
}

const DELIVERY_LABELS: Record<CornerDelivery, { label: string; sub: string }> = {
  hard:  { label: 'Hårt skott', sub: 'Snabbt rus' },
  low:   { label: 'Låg pass',   sub: 'Kontroll' },
  short: { label: 'Kort hörna', sub: 'Överraska' },
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
      {/* Corner card — card-sharp, inline in feed */}
      <div className="card-sharp" style={{ padding: '12px 14px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            🏒 HÖRNA — {minuteStr} minuten
          </p>
          <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>
            {data.cornerTakerName}
          </span>
        </div>

        {/* Corner taker row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '6px 8px', background: 'var(--bg-elevated)', borderRadius: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Hörnläggare:</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{data.cornerTakerName.split('. ')[1] ?? data.cornerTakerName}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {data.topRusherName} rusar
          </span>
        </div>

        {/* Pitch SVG */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <svg viewBox="0 0 200 100" width="100%" style={{ display: 'block' }}>
            {/* Ice surface */}
            <rect x="0" y="0" width="200" height="100" fill="#d8e8f0" rx="3" />
            {/* Penalty arc */}
            <path d="M60,0 A60,50 0 0,1 60,100" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
            {/* Goal */}
            <rect x="0" y="35" width="4" height="30" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" rx="1" />
            {/* Goalkeeper */}
            <circle cx="12" cy="50" r="4" fill="var(--danger)" opacity="0.6" />
            {/* Defenders on goal line */}
            {[30, 40, 50, 60, 70].map((y, i) => (
              <circle key={i} cx="4" cy={y} r="3" fill="var(--danger)" opacity="0.4" />
            ))}
            {/* Corner point */}
            <circle cx={cornerSide === 'right' ? 195 : 5} cy="95" r="3" fill="var(--accent)" />
            <text
              x={cornerSide === 'right' ? 175 : 25}
              y="93" fontSize="6" fill="var(--accent)" fontWeight="600"
              textAnchor={cornerSide === 'right' ? 'end' : 'start'}
            >{cornerSide === 'right' ? 'Hörna från höger' : 'Hörna från vänster'}</text>
            {/* Zone buttons */}
            <rect x="15" y="15" width="35" height="18" rx="3"
              fill={zone === 'near' ? 'rgba(196,122,58,0.35)' : 'rgba(196,122,58,0.08)'}
              stroke={zone === 'near' ? 'var(--accent)' : 'var(--border)'} strokeWidth={zone === 'near' ? '1.5' : '0.8'}
              style={{ cursor: 'pointer' }}
              onClick={() => !confirmed && setZone('near')}
            />
            <text x="32" y="27" fontSize="6" fill={zone === 'near' ? 'var(--accent)' : 'var(--text-muted)'} textAnchor="middle" fontWeight={zone === 'near' ? '600' : '400'}>NÄRA</text>
            <rect x="15" y="38" width="35" height="18" rx="3"
              fill={zone === 'center' ? 'rgba(196,122,58,0.35)' : 'rgba(196,122,58,0.08)'}
              stroke={zone === 'center' ? 'var(--accent)' : 'var(--border)'} strokeWidth={zone === 'center' ? '1.5' : '0.8'}
              style={{ cursor: 'pointer' }}
              onClick={() => !confirmed && setZone('center')}
            />
            <text x="32" y="50" fontSize="6" fill={zone === 'center' ? 'var(--accent)' : 'var(--text-muted)'} textAnchor="middle" fontWeight={zone === 'center' ? '600' : '400'}>MITT</text>
            <rect x="15" y="61" width="35" height="18" rx="3"
              fill={zone === 'far' ? 'rgba(196,122,58,0.35)' : 'rgba(196,122,58,0.08)'}
              stroke={zone === 'far' ? 'var(--accent)' : 'var(--border)'} strokeWidth={zone === 'far' ? '1.5' : '0.8'}
              style={{ cursor: 'pointer' }}
              onClick={() => !confirmed && setZone('far')}
            />
            <text x="32" y="73" fontSize="6" fill={zone === 'far' ? 'var(--accent)' : 'var(--text-muted)'} textAnchor="middle" fontWeight={zone === 'far' ? '600' : '400'}>BORTRE</text>
            {/* Rushing players */}
            <line x1="120" y1="30" x2="55" y2="30" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="3,2" />
            <line x1="130" y1="50" x2="55" y2="50" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="3,2" />
            <line x1="120" y1="70" x2="55" y2="70" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="3,2" />
            <circle cx="120" cy="30" r="4" fill="var(--accent)" opacity="0.7" />
            <circle cx="130" cy="50" r="4" fill="var(--accent)" opacity="0.7" />
            <circle cx="120" cy="70" r="4" fill="var(--accent)" opacity="0.7" />
          </svg>
        </div>

        {/* Delivery selector */}
        <p style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, letterSpacing: '1px' }}>LEVERANS</p>
        <div style={{ display: 'flex', gap: 6, marginBottom: confirmed ? 0 : 10 }}>
          {(Object.keys(DELIVERY_LABELS) as CornerDelivery[]).map(d => (
            <button
              key={d}
              onClick={() => !confirmed && setDelivery(d)}
              style={{
                flex: 1, padding: '10px 0', minHeight: 44, borderRadius: 6, fontSize: 11, fontWeight: 600,
                cursor: confirmed ? 'default' : 'pointer', textAlign: 'center',
                background: delivery === d ? 'rgba(196,122,58,0.12)' : 'var(--bg-elevated)',
                border: `1px solid ${delivery === d ? 'var(--accent)' : 'var(--border)'}`,
                color: delivery === d ? 'var(--accent)' : 'var(--text-primary)',
              }}
            >
              {DELIVERY_LABELS[d].label}
              <span style={{ display: 'block', fontSize: 9, fontWeight: 400, color: 'var(--text-muted)', marginTop: 2 }}>{DELIVERY_LABELS[d].sub}</span>
            </button>
          ))}
        </div>

        {/* Confirm button — only shown before confirmed */}
        {!confirmed && (
          <button
            onClick={handleConfirm}
            className="btn btn-copper"
            style={{ width: '100%', padding: '11px', fontSize: 13, fontWeight: 700, letterSpacing: '0.5px', marginTop: 2 }}
          >
            SLÅ HÖRNAN →
          </button>
        )}
      </div>

      {/* Outcome — shown after resolution, same style as commentary */}
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
