interface PhaseOverlayProps {
  phase: 'overtime' | 'penalties'
  onContinue: () => void
}

export function PhaseOverlay({ phase, onContinue }: PhaseOverlayProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center',
    }}>
      {phase === 'overtime' ? (
        <>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⏱</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            FÖRLÄNGNING
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-light-secondary)' }}>Oavgjort efter 60 minuter.</p>
          <p style={{ fontSize: 14, color: 'rgba(245,241,235,0.45)', marginTop: 4 }}>Ytterligare 2 × 15 minuter spelas.</p>
          <button onClick={onContinue} style={{
            marginTop: 28, padding: '13px 36px',
            background: 'var(--accent)', color: 'var(--bg)',
            border: 'none', borderRadius: 0, cursor: 'pointer',
            fontSize: 14, fontWeight: 700, letterSpacing: '1px',
            fontFamily: 'var(--font-display)',
          }}>
            Spela förlängning →
          </button>
        </>
      ) : (
        <>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--danger)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            STRAFFAR
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-light-secondary)' }}>Fortfarande oavgjort efter förlängning.</p>
          <p style={{ fontSize: 14, color: 'rgba(245,241,235,0.45)', marginTop: 4 }}>Nu avgör straffarna!</p>
          <button onClick={onContinue} style={{
            marginTop: 28, padding: '13px 36px',
            background: 'var(--danger)', color: 'var(--text-on-dark)',
            border: 'none', borderRadius: 0, cursor: 'pointer',
            fontSize: 14, fontWeight: 700, letterSpacing: '1px',
            fontFamily: 'var(--font-display)',
          }}>
            Påbörja straffläggning →
          </button>
        </>
      )}
    </div>
  )
}
