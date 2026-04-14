import { useState } from 'react'
import type { PenaltyInteractionData, PenaltyOutcome, PenaltyDirection, PenaltyHeight } from '../../../domain/services/penaltyInteractionService'

interface PenaltyInteractionProps {
  data: PenaltyInteractionData
  outcome: PenaltyOutcome | null
  onChoose: (dir: PenaltyDirection, height: PenaltyHeight) => void
}

const DIR_LABELS: Record<PenaltyDirection, { label: string; sub: string }> = {
  left:   { label: 'Vänster', sub: 'Målvaktens höger' },
  center: { label: 'Mitt',    sub: 'Riskfyllt' },
  right:  { label: 'Höger',   sub: 'Målvaktens vänster' },
}

const HEIGHT_LABELS: Record<PenaltyHeight, { label: string; sub: string }> = {
  low:  { label: 'Lågt 🧊', sub: 'Säkrare' },
  high: { label: 'Högt ⬆️',  sub: 'Svårare rädda' },
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
      <div className="card-sharp" style={{ padding: '12px 14px', borderColor: 'rgba(176,80,64,0.4)' }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--danger)', margin: 0 }}>
            🎯 STRAFF — {minuteStr} minuten
          </p>
          <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>
            {data.shooterName.split(' ').pop()}
          </span>
        </div>

        {/* Shooter/keeper row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '6px 8px', background: 'var(--bg-elevated)', borderRadius: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Skytt:</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
            {data.shooterName.split(' ').slice(-1)[0]}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            vs {data.keeperName.split(' ').slice(-1)[0]}
          </span>
        </div>

        {/* Placering */}
        <p style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, letterSpacing: '1px' }}>PLACERING</p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {(Object.keys(DIR_LABELS) as PenaltyDirection[]).map(d => (
            <button
              key={d}
              onClick={() => !confirmed && setDir(d)}
              style={{
                flex: 1, padding: '10px 0', minHeight: 44, borderRadius: 6, fontSize: 11, fontWeight: 600,
                cursor: confirmed ? 'default' : 'pointer', textAlign: 'center',
                background: dir === d ? 'rgba(176,80,64,0.12)' : 'var(--bg-elevated)',
                border: `1px solid ${dir === d ? 'var(--danger)' : 'var(--border)'}`,
                color: dir === d ? 'var(--danger)' : 'var(--text-primary)',
              }}
            >
              {DIR_LABELS[d].label}
              <span style={{ display: 'block', fontSize: 9, fontWeight: 400, color: 'var(--text-muted)', marginTop: 2 }}>{DIR_LABELS[d].sub}</span>
            </button>
          ))}
        </div>

        {/* Höjd */}
        <p style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, letterSpacing: '1px' }}>HÖJD</p>
        <div style={{ display: 'flex', gap: 6, marginBottom: confirmed ? 0 : 10 }}>
          {(Object.keys(HEIGHT_LABELS) as PenaltyHeight[]).map(h => (
            <button
              key={h}
              onClick={() => !confirmed && setHeight(h)}
              style={{
                flex: 1, padding: '10px 0', minHeight: 44, borderRadius: 6, fontSize: 11, fontWeight: 600,
                cursor: confirmed ? 'default' : 'pointer', textAlign: 'center',
                background: height === h ? 'rgba(176,80,64,0.12)' : 'var(--bg-elevated)',
                border: `1px solid ${height === h ? 'var(--danger)' : 'var(--border)'}`,
                color: height === h ? 'var(--danger)' : 'var(--text-primary)',
              }}
            >
              {HEIGHT_LABELS[h].label}
              <span style={{ display: 'block', fontSize: 9, fontWeight: 400, color: 'var(--text-muted)', marginTop: 2 }}>{HEIGHT_LABELS[h].sub}</span>
            </button>
          ))}
        </div>

        {!confirmed && (
          <button
            onClick={handleConfirm}
            style={{
              width: '100%', padding: '11px', fontSize: 13, fontWeight: 700, letterSpacing: '0.5px',
              background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 6,
              cursor: 'pointer', marginTop: 2,
            }}
          >
            SKJUT STRAFFEN →
          </button>
        )}
      </div>

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
