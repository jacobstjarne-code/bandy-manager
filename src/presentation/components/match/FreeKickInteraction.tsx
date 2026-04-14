import { useState } from 'react'
import type { FreeKickInteractionData, FreeKickOutcome, FreeKickChoice } from '../../../domain/services/freeKickInteractionService'

interface FreeKickInteractionProps {
  data: FreeKickInteractionData
  outcome: FreeKickOutcome | null
  onChoose: (choice: FreeKickChoice) => void
}

const CHOICES: { choice: FreeKickChoice; emoji: string; label: string; sub: string }[] = [
  { choice: 'shoot',    emoji: '💥', label: 'Skjut',  sub: 'Direkt' },
  { choice: 'chipPass', emoji: '⤴️', label: 'Chip',   sub: 'Över muren' },
  { choice: 'layOff',   emoji: '↩️', label: 'Kort',   sub: 'Bygga om' },
]

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-dark)',
  borderRadius: 12,
  padding: 16,
  border: '1.5px solid rgba(196,122,58,0.3)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
}

export function FreeKickInteraction({ data, outcome, onChoose }: FreeKickInteractionProps) {
  const [choice, setChoice] = useState<FreeKickChoice>('shoot')
  const [confirmed, setConfirmed] = useState(false)

  function handleConfirm() {
    if (confirmed) return
    setConfirmed(true)
    onChoose(choice)
  }

  return (
    <div style={{ margin: '6px 0' }}>
      <div style={cardStyle}>

        {/* Title */}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 8px 0' }}>
          🏒 FRISLAG — {data.distanceMeters} meter
        </p>

        {/* Info row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'var(--bg-dark-surface)', borderRadius: 4, marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)' }}>
            {data.kickerName.split(' ').slice(-2).join(' ')} ställer sig vid bollen.
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-light-secondary)', marginLeft: 'auto' }}>
            Mur: {data.wallSize} man
          </span>
        </div>

        {/* SVG: goal + wall + ball */}
        <svg viewBox="0 0 260 150" width="100%" style={{ display: 'block', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
          <defs>
            <linearGradient id="igF" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8E4DC" />
              <stop offset="100%" stopColor="#D8D4CC" />
            </linearGradient>
          </defs>
          <rect width="260" height="150" fill="url(#igF)" rx="4" />
          {/* Goal posts */}
          <rect x="75" y="4" width="110" height="20" fill="none" stroke="#888" strokeWidth="2" rx="2" />
          <rect x="77" y="6" width="106" height="16" fill="rgba(0,0,0,0.04)" />
          {/* Keeper */}
          <circle cx="130" cy="16" r="6" fill="#2C2820" opacity="0.7" />
          <text x="130" y="19" textAnchor="middle" fontSize="5" fill="white" fontWeight="700">MV</text>
          {/* Wall */}
          <rect x="112" y="48" width={data.wallSize * 9} height="12" rx="3" fill="#B05040" opacity="0.75" />
          <text x={112 + data.wallSize * 4.5} y="57" textAnchor="middle" fontSize="7" fill="white" fontWeight="700">
            {'■ '.repeat(data.wallSize).trim()}
          </text>
          <text x="130" y="72" textAnchor="middle" fontSize="6" fill="#888">MUR · {data.wallSize} man</text>
          {/* Distance marker */}
          <line x1="130" y1="82" x2="130" y2="118" stroke="#C4BAA8" strokeWidth="0.8" strokeDasharray="3,2" />
          <text x="145" y="102" fontSize="6" fill="#999">{data.distanceMeters}m</text>
          {/* Kicker */}
          <circle cx="130" cy="125" r="5" fill="var(--accent)" stroke="#fff" strokeWidth="1.5" />
          <text x="130" y="140" textAnchor="middle" fontSize="6" fill="var(--accent)" fontWeight="600">
            {data.kickerName.split(' ').pop()}
          </text>
        </svg>

        {/* Choice buttons */}
        <div style={{ display: 'flex', gap: 6, marginBottom: confirmed ? 0 : 10 }}>
          {CHOICES.map(({ choice: c, emoji, label, sub }) => (
            <button
              key={c}
              onClick={() => !confirmed && setChoice(c)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '10px 8px', borderRadius: 8,
                border: `1.5px solid ${choice === c ? 'var(--accent)' : 'rgba(196,122,58,0.25)'}`,
                background: choice === c ? 'var(--bg-dark-elevated)' : 'var(--bg-dark-surface)',
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
            SLÅ FRISLAGET →
          </button>
        )}

        {/* Outcome */}
        {outcome && (
          <div style={{
            padding: '8px 10px', borderRadius: 6, marginTop: 8,
            background: outcome.type === 'goal' ? 'rgba(196,122,58,0.15)' : 'var(--bg-dark-surface)',
            borderLeft: outcome.type === 'goal' ? '3px solid var(--accent)' : '3px solid var(--bg-dark-elevated)',
          }}>
            <p style={{ fontSize: 12, fontWeight: outcome.type === 'goal' ? 700 : 400, color: outcome.type === 'goal' ? 'var(--accent)' : 'var(--text-light-secondary)', margin: 0 }}>
              {outcome.type === 'goal' ? '🏒 MÅL! ' : ''}{outcome.description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
