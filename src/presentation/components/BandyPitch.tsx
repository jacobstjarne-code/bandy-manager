interface BandyPitchProps {
  width?: number | string
  children?: React.ReactNode
}

// viewBox: 220 × 130 — proportional to a real bandy pitch (110m × 65m, scale 2px/m)
// Coordinate system: (0,0) = top-left, own goal at top, opponent goal at bottom
export function BandyPitch({ width = '100%', children }: BandyPitchProps) {
  const W = 220
  const H = 130
  const goalW = 7    // 3.5m * 2
  const goalD = 3    // depth of goal rectangle
  const penH = 26    // penalty area height from goal line (~13m)
  const penW = 80    // penalty area width centered
  const cornerR = 4  // corner arc radius

  const lineStyle = { stroke: 'rgba(255,255,255,0.55)', strokeWidth: 0.8, fill: 'none' }
  const goalStyle = { stroke: 'rgba(255,255,255,0.7)', strokeWidth: 1, fill: 'rgba(255,255,255,0.06)' }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={width}
      style={{ display: 'block', borderRadius: 8 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1e3a" />
          <stop offset="50%" stopColor="#0c2440" />
          <stop offset="100%" stopColor="#0a1e3a" />
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
