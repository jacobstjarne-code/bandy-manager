export function DiamondDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--border-dark))' }} />
      <svg viewBox="0 0 28 12" width="28" height="12">
        <polygon points="14,1 27,6 14,11 1,6" fill="none" stroke="var(--accent)" strokeWidth="0.8" opacity="0.4"/>
        <polygon points="14,4 20,6 14,8 8,6" fill="var(--accent)" opacity="0.15"/>
      </svg>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--border-dark), transparent)' }} />
    </div>
  )
}
