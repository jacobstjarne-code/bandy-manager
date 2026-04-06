import { useState } from 'react'

interface FormResult {
  result: 'V' | 'O' | 'F'
  score?: string      // e.g. "3–1"
  opponent?: string   // e.g. "Karlsborg"
}

interface FormDotsProps {
  results: FormResult[]
  size?: number       // dot size, default 8
}

const COLORS = {
  V: 'var(--success)',
  F: 'var(--danger)',
  O: 'var(--accent)',
} as const

const BG_COLORS = {
  V: 'rgba(90,154,74,0.15)',
  F: 'rgba(176,80,64,0.15)',
  O: 'rgba(196,186,168,0.15)',
} as const

const BORDER_COLORS = {
  V: 'rgba(90,154,74,0.3)',
  F: 'rgba(176,80,64,0.3)',
  O: 'rgba(196,186,168,0.3)',
} as const

export function FormDots({ results, size = 8 }: FormDotsProps) {
  const [tapped, setTapped] = useState<number | null>(null)

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => {
        const r = results[i]
        return (
          <div
            key={i}
            onClick={r?.score ? (e) => {
              e.stopPropagation()
              setTapped(prev => prev === i ? null : i)
            } : undefined}
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              background: r ? COLORS[r.result] : 'var(--border)',
              cursor: r?.score ? 'pointer' : 'default',
            }}
          />
        )
      })}

      {/* Tooltip */}
      {tapped !== null && results[tapped]?.score && (
        <>
          <div
            onClick={() => setTapped(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          />
          <div style={{
            position: 'absolute',
            bottom: size + 6,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-dark)',
            color: 'var(--text-light)',
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }}>
            <span style={{ color: COLORS[results[tapped].result] }}>{results[tapped].result}</span>
            {' '}{results[tapped].score}
            {results[tapped].opponent && (
              <span style={{ color: 'rgba(245,241,235,0.6)', marginLeft: 4 }}>
                {results[tapped].opponent}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/** Square variant for RoundSummary / dashboard */
export function FormSquares({ results, size = 22 }: FormDotsProps & { size?: number }) {
  const [tapped, setTapped] = useState<number | null>(null)

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {results.map((r, i) => (
        <div
          key={i}
          onClick={r.score ? (e) => {
            e.stopPropagation()
            setTapped(prev => prev === i ? null : i)
          } : undefined}
          style={{
            width: size, height: size, borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700,
            background: BG_COLORS[r.result],
            color: COLORS[r.result],
            border: `1px solid ${BORDER_COLORS[r.result]}`,
            cursor: r.score ? 'pointer' : 'default',
          }}
        >
          {r.result}
        </div>
      ))}
      {results.length === 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>}

      {/* Tooltip */}
      {tapped !== null && results[tapped]?.score && (
        <>
          <div
            onClick={() => setTapped(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          />
          <div style={{
            position: 'absolute',
            bottom: size + 6,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-dark)',
            color: 'var(--text-light)',
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }}>
            {results[tapped].score}
            {results[tapped].opponent && (
              <span style={{ color: 'rgba(245,241,235,0.6)', marginLeft: 4 }}>
                vs {results[tapped].opponent}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
