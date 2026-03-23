interface StatBarProps {
  value: number
  color?: string
  height?: number
}

export function StatBar({ value, color = 'var(--accent)', height = 6 }: StatBarProps) {
  return (
    <div style={{ background: 'var(--border)', borderRadius: 99, height, overflow: 'hidden' }}>
      <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.3s' }} />
    </div>
  )
}
