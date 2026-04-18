
interface PositionTagProps {
  position: 'MV' | 'B' | 'MF' | 'YH' | 'YV' | 'A'
  size?: 'sm' | 'md'
}

// text color → [bgRgba, textColor]
const POSITION_STYLE: Record<PositionTagProps['position'], { bg: string; text: string }> = {
  MV: { bg: 'rgba(196,122,58,0.15)',  text: 'var(--accent)' },
  B:  { bg: 'rgba(176,80,64,0.15)',   text: 'var(--danger)' },
  MF: { bg: 'rgba(90,154,74,0.15)',   text: 'var(--success)' },
  YH: { bg: 'rgba(126,179,212,0.15)', text: 'var(--ice)' },
  YV: { bg: 'rgba(126,179,212,0.15)', text: 'var(--ice)' },
  A:  { bg: 'rgba(196,122,58,0.15)',  text: 'var(--accent)' },
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
