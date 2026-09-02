import type { CSSProperties, ReactNode } from 'react'

interface BandyPitchProps {
  width?: number | string
  height?: number | string
  children?: ReactNode
  variant?: 'lineup' | 'tactical'
  style?: CSSProperties
}

// viewBox: 220 × 170 — taller aspect ratio gives room for player labels
// Coordinate system: (0,0) = top-left, own goal at top, opponent goal at bottom
export function BandyPitch({
  width = '100%',
  height,
  children,
  variant = 'lineup',
  style,
}: BandyPitchProps) {
  if (variant === 'tactical') {
    return (
      <svg
        viewBox="0 0 280 400"
        width={width}
        height={height}
        data-pitch-variant="tactical"
        style={{
          display: 'block',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(180deg, var(--ice-rink), var(--ice-rink-deep))',
          border: '1px solid color-mix(in srgb, var(--ice-dark) 50%, transparent)',
          boxShadow: 'inset 0 1px 4px color-mix(in srgb, var(--ice-dark) 15%, transparent)',
          ...style,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="dot-ok" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="var(--tactic-dot-ok-start)" />
            <stop offset="100%" stopColor="var(--tactic-dot-ok-end)" />
          </radialGradient>
          <radialGradient id="dot-warn" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="var(--tactic-dot-warn-start)" />
            <stop offset="100%" stopColor="var(--tactic-dot-warn-end)" />
          </radialGradient>
          <filter id="dot-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.25" />
          </filter>
        </defs>

        <line data-pitch-marking="center-line" x1="0" y1="200" x2="280" y2="200" stroke="rgba(90,122,138,.4)" strokeWidth="0.5" strokeDasharray="3,3" />
        <circle data-pitch-marking="center-circle" cx="140" cy="200" r="35" fill="none" stroke="rgba(90,122,138,.4)" strokeWidth="0.5" strokeDasharray="3,3" />
        <rect data-pitch-marking="own-goal-area" x="90" y="0" width="100" height="28" fill="none" stroke="rgba(90,122,138,.4)" strokeWidth="0.5" />
        <rect data-pitch-marking="opponent-goal-area" x="90" y="372" width="100" height="28" fill="none" stroke="rgba(90,122,138,.4)" strokeWidth="0.5" />

        {children}
      </svg>
    )
  }

  const W = 220
  const H = 170
  const goalW = 7    // 3.5m * 2
  const goalD = 3    // depth of goal rectangle
  const penH = 26    // penalty area height from goal line (~13m)
  const penW = 80    // penalty area width centered
  const cornerR = 4  // corner arc radius

  const lineStyle = { stroke: 'rgba(90,122,138,0.4)', strokeWidth: 0.8, fill: 'none' }
  const goalStyle = { stroke: 'rgba(90,122,138,0.3)', strokeWidth: 1, fill: 'rgba(90,122,138,0.1)' }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={width}
      height={height}
      data-pitch-variant="lineup"
      style={{ display: 'block', borderRadius: 8, ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--ice-rink)' }} />
          <stop offset="50%" style={{ stopColor: 'color-mix(in srgb, var(--ice-rink), var(--ice-rink-deep))' }} />
          <stop offset="100%" style={{ stopColor: 'var(--ice-rink-deep)' }} />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect x={0} y={0} width={W} height={H} fill="url(#pitchGrad)" rx={8} />

      {/* Field outline */}
      <rect x={2} y={2} width={W - 4} height={H - 4} {...lineStyle} rx={1} />

      {/* Center line */}
      <line x1={2} y1={H / 2} x2={W - 2} y2={H / 2} {...lineStyle} />

      {/* Top penalty area */}
      <rect
        x={(W - penW) / 2}
        y={2}
        width={penW}
        height={penH}
        {...lineStyle}
      />

      {/* Bottom penalty area */}
      <rect
        x={(W - penW) / 2}
        y={H - 2 - penH}
        width={penW}
        height={penH}
        {...lineStyle}
      />

      {/* Top goal */}
      <rect
        x={(W - goalW) / 2}
        y={2 - goalD}
        width={goalW}
        height={goalD + 1}
        {...goalStyle}
      />

      {/* Bottom goal */}
      <rect
        x={(W - goalW) / 2}
        y={H - 2}
        width={goalW}
        height={goalD}
        {...goalStyle}
      />

      {/* Corner arcs (top-left, top-right, bottom-left, bottom-right) */}
      <path d={`M ${2 + cornerR} 2 A ${cornerR} ${cornerR} 0 0 0 2 ${2 + cornerR}`} {...lineStyle} />
      <path d={`M ${W - 2 - cornerR} 2 A ${cornerR} ${cornerR} 0 0 1 ${W - 2} ${2 + cornerR}`} {...lineStyle} />
      <path d={`M 2 ${H - 2 - cornerR} A ${cornerR} ${cornerR} 0 0 0 ${2 + cornerR} ${H - 2}`} {...lineStyle} />
      <path d={`M ${W - 2} ${H - 2 - cornerR} A ${cornerR} ${cornerR} 0 0 1 ${W - 2 - cornerR} ${H - 2}`} {...lineStyle} />

      {/* Children (slots) rendered on top */}
      {children}
    </svg>
  )
}
