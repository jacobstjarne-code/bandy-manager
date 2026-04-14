import { useState } from 'react'
import type { CounterInteractionData, CounterOutcome, CounterChoice } from '../../../domain/services/counterAttackInteractionService'

interface CounterInteractionProps {
  data: CounterInteractionData
  outcome: CounterOutcome | null
  onChoose: (choice: CounterChoice) => void
}

const CHOICES: { choice: CounterChoice; emoji: string; label: string; sub: string }[] = [
  { choice: 'sprint',    emoji: '🏃', label: 'Spurta',   sub: 'Hög risk' },
  { choice: 'earlyBall', emoji: '🎯', label: 'Spela av', sub: 'Medium' },
  { choice: 'build',     emoji: '🧠', label: 'Bygga',    sub: 'Säkert' },
]

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-dark)',
  borderRadius: 12,
  padding: 16,
  border: '1.5px solid rgba(196,122,58,0.3)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
}

export function CounterInteraction({ data, outcome, onChoose }: CounterInteractionProps) {
  const [choice, setChoice] = useState<CounterChoice>('earlyBall')
  const [confirmed, setConfirmed] = useState(false)

  function handleConfirm() {
    if (confirmed) return
    setConfirmed(true)
    onChoose(choice)
  }

  const defText = data.defendersBeat === 1 ? '1 mot 1' : data.defendersBeat === 2 ? '2 mot 1' : '3 mot 2'

  return (
    <div style={{ margin: '6px 0' }}>
      <div style={cardStyle}>

        {/* Title */}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 8px 0' }}>
          ⚡ KONTRING — {data.minute}:e minuten
        </p>

        {/* Info row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'var(--bg-dark-surface)', borderRadius: 4, marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)' }}>
            {data.runnerName} springer fritt!
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-light-secondary)', marginLeft: 'auto' }}>{defText}</span>
        </div>

        {/* SVG mini-pitch */}
        <svg viewBox="0 0 260 120" width="100%" style={{ display: 'block', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
          <defs>
            <linearGradient id="igC" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8E4DC" />
              <stop offset="100%" stopColor="#D8D4CC" />
            </linearGradient>
            <marker id="arC" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0 0L10 5L0 10z" fill="var(--accent)" />
            </marker>
          </defs>
          <rect width="260" height="120" fill="url(#igC)" rx="4" />
          {/* Goal at top */}
          <rect x="100" y="2" width="60" height="14" fill="none" stroke="#999" strokeWidth="1.5" rx="2" />
          <circle cx="130" cy="12" r="5" fill="#2C2820" opacity="0.7" />
          <text x="130" y="15" textAnchor="middle" fontSize="5" fill="white" fontWeight="700">MV</text>
          {/* Defenders (beaten) */}
          <circle cx="112" cy="34" r="6" fill="#B05040" opacity="0.6" />
          <text x="112" y="37" textAnchor="middle" fontSize="5" fill="white">X</text>
          <circle cx="148" cy="30" r="6" fill="#B05040" opacity="0.6" />
          <text x="148" y="33" textAnchor="middle" fontSize="5" fill="white">X</text>
          {/* Runner */}
          <circle cx="100" cy="70" r="8" fill="var(--accent)" stroke="#fff" strokeWidth="2" />
          <text x="100" y="86" textAnchor="middle" fontSize="6" fill="var(--accent)" fontWeight="600">
            {data.runnerName.split(' ').pop()}
          </text>
          {/* Support player */}
          <circle cx="158" cy="80" r="6" fill="var(--accent)" opacity="0.6" stroke="#fff" strokeWidth="1.5" />
          <text x="158" y="94" textAnchor="middle" fontSize="6" fill="var(--text-light-secondary)">
            {data.supportName.split(' ').pop()}
          </text>
          {/* Arrow toward goal */}
          <line x1="100" y1="62" x2="115" y2="42" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arC)" />
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
            KÖR KONTRINGEN →
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
