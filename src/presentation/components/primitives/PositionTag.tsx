
interface PositionTagProps {
  position: 'MV' | 'B' | 'MF' | 'YH' | 'YV' | 'A'
  size?: 'sm' | 'md'
}

// text color → [bgRgba, textColor]
const POSITION_STYLE: Record<PositionTagProps['position'], { bg: string; text: string }> = {
  MV: { bg: 'color-mix(in srgb, var(--accent) 15%, transparent)',  text: 'var(--accent)' },
  B:  { bg: 'color-mix(in srgb, var(--danger) 15%, transparent)',   text: 'var(--danger)' },
  MF: { bg: 'color-mix(in srgb, var(--success) 15%, transparent)',   text: 'var(--success)' },
  YH: { bg: 'color-mix(in srgb, var(--ice) 15%, transparent)', text: 'var(--ice)' },
  YV: { bg: 'color-mix(in srgb, var(--ice) 15%, transparent)', text: 'var(--ice)' },
  A:  { bg: 'color-mix(in srgb, var(--accent) 15%, transparent)',  text: 'var(--accent)' },
}

export function PositionTag({ position, size = 'md' }: PositionTagProps) {
  const { bg, text } = POSITION_STYLE[position]
  const fontSize = size === 'sm' ? 10 : 11
  const padding = size === 'sm' ? '1px 5px' : '2px 6px'

  return (
    <span style={{
      display: 'inline-block',
      fontFamily: 'var(--font-body)',
      fontSize,
      fontWeight: 700,
      letterSpacing: '0.5px',
      padding,
      borderRadius: 3,
      background: bg,
      color: text,
      lineHeight: 1.4,
    }}>
      {position}
    </span>
  )
}
