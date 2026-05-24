export const MIN_POINTS = 5
const PADDING = 2

const STROKE_TOKENS: Record<string, string> = {
  accent:  'var(--accent)',
  cold:    'var(--cold)',
  success: 'var(--success)',
  warm:    'var(--warm)',
  danger:  'var(--danger)',
}

export interface SparklineMarker {
  index: number
  color: string
  size?: number
  ringed?: boolean
}

interface SparklineProps {
  points: number[]
  markers?: SparklineMarker[]
  stroke?: 'accent' | 'cold' | 'success' | 'warm' | 'danger'
  height?: number
  yInverted?: boolean
  label?: string
  areaFill?: boolean
}

export function normalize(points: number[], height: number, yInverted: boolean): [number, number][] {
  const drawH = height - PADDING * 2
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min
  const n = points.length
  return points.map((v, i) => {
    const x = n === 1 ? 0 : (i / (n - 1)) * 100
    let ratio: number
    if (range === 0) {
      // Flat line: center vertically
      ratio = 0.5
    } else {
      // yInverted: lägre tal (t.ex. tabellplats 1) = överst
      ratio = yInverted ? (v - min) / range : 1 - (v - min) / range
    }
    const y = PADDING + ratio * drawH
    return [x, y]
  })
}

export function Sparkline({ points, markers, stroke = 'accent', height = 28, yInverted = false, label, areaFill = false }: SparklineProps) {
  if (points.length < MIN_POINTS) {
    return (
      <div className="sparkline-empty" style={{ height }}>
        —
      </div>
    )
  }

  const coords = normalize(points, height, yInverted)
  const polyPoints = coords.map(([x, y]) => `${x},${y}`).join(' ')
  const strokeColor = STROKE_TOKENS[stroke] ?? STROKE_TOKENS.accent

  return (
    <svg
      className="sparkline-svg"
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      style={{ height, width: '100%' }}
      aria-label={label}
    >
      {areaFill && (
        <polygon
          points={`0,${height} ${polyPoints} 100,${height}`}
          fill={strokeColor}
          fillOpacity={0.12}
        />
      )}
      {/* vector-effect="non-scaling-stroke" prevents stroke from scaling with viewBox distortion */}
      <polyline
        points={polyPoints}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {markers?.map((m) => {
        const [cx, cy] = coords[m.index] ?? [0, 0]
        const r = m.size ?? 2
        return (
          <g key={m.index}>
            {m.ringed && (
              <circle
                cx={cx}
                cy={cy}
                r={r + 1.5}
                fill="none"
                stroke="var(--text-light)"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={m.color}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )
      })}
    </svg>
  )
}
