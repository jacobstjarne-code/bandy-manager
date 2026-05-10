/**
 * sevenSegment.tsx — 7-segment display renderer
 * Shared between ScoreboardStalvallen and MatchReportView.
 *
 * Segment layout:
 *   aaa
 *  f   b
 *   ggg
 *  e   c
 *   ddd
 */
export const SEG_MAP: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgcde',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
  '-': 'g',
  ' ': '',
}

export type SegSize = 'lg' | 'md' | 'sm'

interface DigitProps {
  char: string
  size: SegSize
  color?: string
  glowColor?: string
}

/** Render one 7-segment digit as inline SVG */
export function SevenSegDigit({ char, size, color = 'var(--led-red)', glowColor }: DigitProps) {
  const segs = SEG_MAP[char] ?? ''
  const dimColor = 'rgba(255,255,255,0.07)'
  const shadow = glowColor ? `0 0 6px ${glowColor}, 0 0 12px ${glowColor}` : undefined

  // Size presets: width × height
  const dims: Record<SegSize, { w: number; h: number; sw: number }> = {
    lg: { w: 28, h: 52, sw: 4 },
    md: { w: 18, h: 34, sw: 3 },
    sm: { w: 12, h: 22, sw: 2 },
  }
  const { w, h, sw } = dims[size]
  const gap = sw * 0.5
  const mid = h / 2

  // Segment path generators
  function hSeg(y: number): string {
    const m = sw
    return `M${m + gap},${y} L${w - m - gap},${y}`
  }
  function vSeg(x: number, y1: number, y2: number): string {
    const m = sw
    return `M${x},${y1 + m + gap} L${x},${y2 - m - gap}`
  }

  const segPaths: Record<string, string> = {
    a: hSeg(0),
    g: hSeg(mid),
    d: hSeg(h),
    f: vSeg(0, 0, mid),
    b: vSeg(w, 0, mid),
    e: vSeg(0, mid, h),
    c: vSeg(w, mid, h),
  }

  return (
    <svg
      width={w + sw}
      height={h + sw}
      viewBox={`${-sw / 2} ${-sw / 2} ${w + sw} ${h + sw}`}
      style={{ display: 'inline-block', verticalAlign: 'bottom' }}
    >
      {Object.entries(segPaths).map(([id, d]) => (
        <path
          key={id}
          d={d}
          stroke={segs.includes(id) ? color : dimColor}
          strokeWidth={sw}
          strokeLinecap="round"
          fill="none"
          style={segs.includes(id) && shadow ? { filter: `drop-shadow(${shadow})` } : undefined}
        />
      ))}
    </svg>
  )
}

interface TextProps {
  text: string
  size: SegSize
  color?: string
  glowColor?: string
  gap?: number
}

/** Render a string of 7-segment digits */
export function SevenSegText({ text, size, color, glowColor, gap = 2 }: TextProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap }}>
      {text.split('').map((ch, i) => (
        <SevenSegDigit key={i} char={ch} size={size} color={color} glowColor={glowColor} />
      ))}
    </span>
  )
}

/** Render a colon separator (two dots) */
export function SevenSegColon({ size, color = 'var(--led-amber)' }: { size: SegSize; color?: string }) {
  const dotSize: Record<SegSize, number> = { lg: 5, md: 4, sm: 3 }
  const d = dotSize[size]
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', justifyContent: 'space-around', height: size === 'lg' ? 52 : size === 'md' ? 34 : 22, paddingBottom: 4 }}>
      <span style={{ width: d, height: d, borderRadius: '50%', background: color, boxShadow: `0 0 4px ${color}` }} />
      <span style={{ width: d, height: d, borderRadius: '50%', background: color, boxShadow: `0 0 4px ${color}` }} />
    </span>
  )
}
