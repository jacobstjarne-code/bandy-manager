interface MomentumBarProps {
  homeActions: number   // cumulative home attacking actions
  awayActions: number   // cumulative away attacking actions
  intensity: 'low' | 'medium' | 'high'
}

export function MomentumBar({ homeActions, awayActions, intensity }: MomentumBarProps) {
  const total = homeActions + awayActions
  const homePct = total > 0 ? (homeActions / total) * 100 : 50

  const barColor = intensity === 'high'
    ? 'var(--accent)'
    : intensity === 'medium'
    ? 'var(--ice)'
    : 'var(--border-dark)'

  const glowOpacity = intensity === 'high' ? 0.3 : intensity === 'medium' ? 0.1 : 0

  return (
    <div style={{ padding: '4px 16px', flexShrink: 0 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 8, color: 'var(--text-muted)', letterSpacing: '1px',
        marginBottom: 3,
      }}>
        <span>HEMMA</span>
        <span style={{
          fontSize: 9, fontWeight: 700,
          color: intensity === 'high' ? 'var(--accent)' : 'var(--text-muted)',
        }}>
          {intensity === 'high' ? '🔥 INTENSIVT' : intensity === 'medium' ? 'Aktivt' : 'Lugnt'}
        </span>
        <span>BORTA</span>
      </div>
      <div style={{
        height: 6, borderRadius: 3, overflow: 'hidden',
        background: 'var(--border)',
        boxShadow: glowOpacity > 0
          ? `0 0 8px rgba(196,122,58,${glowOpacity})`
          : 'none',
        transition: 'box-shadow 0.6s ease',
      }}>
        <div style={{
          height: '100%',
          width: `${homePct}%`,
          background: barColor,
          borderRadius: 3,
          transition: 'width 800ms ease-out, background-color 600ms ease-out',
        }} />
      </div>
    </div>
  )
}
