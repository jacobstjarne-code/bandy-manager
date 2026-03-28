interface PhaseOverlayProps {
  phase: 'overtime' | 'penalties'
}

export function PhaseOverlay({ phase }: PhaseOverlayProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(14,13,11,0.92)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center',
    }}>
      {phase === 'overtime' ? (
        <>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⏱</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            FÖRLÄNGNING
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-light-secondary)' }}>Oavgjort efter 90 minuter.</p>
          <p style={{ fontSize: 14, color: 'rgba(245,241,235,0.45)', marginTop: 4 }}>Ytterligare 2 × 15 minuter spelas.</p>
        </>
      ) : (
        <>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--danger)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            STRAFFAR
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-light-secondary)' }}>Fortfarande oavgjort efter förlängning.</p>
          <p style={{ fontSize: 14, color: 'rgba(245,241,235,0.45)', marginTop: 4 }}>Nu avgör straffarna!</p>
        </>
      )}
    </div>
  )
}
